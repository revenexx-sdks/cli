import { Command, InvalidArgumentError, Option } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { spawnSync } from "child_process";
import { create as createTar } from "tar";
import { sdkForProject } from "../sdks.js";
import { resolveTenant } from "../project-config.js";
import { EXECUTABLE_NAME } from "../constants.js";
import type { RequestParams } from "../types.js";
import { actionRunner, success, log, warn, hint, parse, drawTable, cliConfig } from "../parser.js";

/**
 * One-command deploys for the artifacts `create app` / `create theme`
 * scaffold, contributed by the 'create' plugin. Thin orchestration
 * over the generated apps/sites services — the same endpoints, sequenced:
 * find-or-create the target, package the directory, upload an activated
 * deployment, poll the platform build, then publish + install where the API
 * supports it.
 *
 * Every step after the upload can be resumed: `--deployment-id` skips the
 * packaging + upload and picks up an existing deployment (still building, or
 * built while an earlier run had already given up), so a stalled build queue
 * never forces a second upload (DX-229).
 *
 * Release approval (MAR-33): every upload carries a `releaseMode` — `deploy`
 * from `deploy app|theme`, `preview` from `preview app|theme`. The upload
 * still asks for activation, but the platform decides: it only puts a build
 * live once the registry approved its release round. After the build the
 * flow reads the round (`GET …/releases`) and publishes + installs only an
 * approved version; a round still in review ends the command with its state
 * instead of a success claim. `preview accept` gives the vendor's go on a
 * preview candidate, `release status` lists the rounds.
 *
 * `deploy cube` and `deploy integration` follow the same shape without the
 * marketplace steps (PE-1254, PE-1256): the build submits a release round and
 * the command waits for it like an app's, but there is nothing to publish or
 * install afterwards. The platform activates the build once the round is
 * approved. `preview cube|integration` upload a preview candidate.
 */

type Json = Record<string, unknown>;

const JSON_HEADERS = { "content-type": "application/json" };

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/** First array of objects in a list response, whatever the collection key. */
const firstArray = (response: Json): Json[] => {
  for (const value of Object.values(response)) {
    if (Array.isArray(value)) return value as Json[];
  }
  return [];
};

const readJsonIf = (file: string): Json | null => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
};

const errorMessage = (err: unknown): string => (err instanceof Error ? err.message : String(err));

/**
 * Did the gateway definitively reject the request? The client sets a numeric
 * `code` only from an HTTP response; timeouts and network errors carry none,
 * and a 5xx says nothing about whether the write landed.
 */
const isRejectedByGateway = (err: unknown): boolean => {
  const code = (err as { code?: unknown } | null)?.code;
  return typeof code === "number" && code >= 400 && code < 500;
};

/**
 * Prefix a caught error's message with what the failure means for the flow
 * and how to finish it, keeping the original error object so the exit code,
 * request-id and response details still come from the real failure.
 */
const rethrowWithContext = (err: unknown, context: string): never => {
  const wrapped = err instanceof Error ? err : new Error(String(err));
  wrapped.message = `${wrapped.message}\n${context}`;
  throw wrapped;
};

/**
 * `--timeout <seconds>` parser: a positive whole number of seconds. This is
 * the build wait only — the per-request HTTP limit is the global
 * `--request-timeout <ms>` and is never touched from here (DX-234).
 */
export const parseSeconds = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError("Expected a positive whole number of seconds.");
  }
  return parsed;
};

/** Never ship local state: matches the scaffolds' .gitignore set. */
const PACK_EXCLUDES = new Set(["node_modules", ".git", ".nuxt", ".output", ".data", ".env"]);

/**
 * Package a directory into a tar.gz File for the deployment upload.
 * `portable: true` keeps atime/ctime out of the header region that POSIX
 * reserves for the path prefix — the platform's manifest extractor reads that
 * region, and node-tar's default old-GNU timestamps turn every entry name
 * into garbage, silently degrading the app to a legacy Function (DX-231).
 */
export async function packDirectory(dir: string, extraExcludes: readonly string[] = []): Promise<File> {
  // "*.tgz" leaves out top-level files with that suffix; anything else is a
  // top-level name.
  const suffixes = extraExcludes.filter((entry) => entry.startsWith("*.")).map((entry) => entry.slice(1));
  const excluded = new Set([...PACK_EXCLUDES, ...extraExcludes.filter((entry) => !entry.startsWith("*."))]);
  const tempFile = path.join(os.tmpdir(), `revenexx-deploy-${process.pid}-${Date.now()}.tar.gz`);
  await createTar(
    {
      gzip: true,
      portable: true,
      file: tempFile,
      cwd: dir,
      filter: (entry) => {
        const parts = entry.replace(/^\.\//, "").split("/");
        const top = parts[0];
        if (parts.length === 1 && suffixes.some((suffix) => top.endsWith(suffix))) return false;
        return !excluded.has(top) && !entry.endsWith(".tar.gz");
      },
    },
    ["."],
  );
  try {
    const buffer = fs.readFileSync(tempFile);
    return new File([buffer], path.basename(tempFile), { type: "application/gzip" });
  } finally {
    if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
  }
}

/** Raised when the build wait runs out while the deployment is still in flight. */
export class BuildTimeoutError extends Error {
  constructor(
    readonly timeoutSeconds: number,
    readonly lastStatus: string,
  ) {
    super(`timed out after ${timeoutSeconds}s waiting for the build (last status: ${lastStatus})`);
    this.name = "BuildTimeoutError";
  }
}

/** Poll interval between deployment status reads. */
export const POLL_INTERVAL_MS = 5000;

/**
 * Poll a deployment until it is ready or failed and return it either way.
 * `timeoutSeconds` is compared against the wall clock after every read, so
 * `0` gives up right after the first status (used by the tests).
 */
export async function settleDeployment(deploymentPath: string, timeoutSeconds: number): Promise<Json> {
  const client = await sdkForProject();
  const startedAt = Date.now();
  let lastStatus = "";

  for (;;) {
    const deployment = (await client.call("get", deploymentPath, JSON_HEADERS, {})) as Json;
    const status = String(deployment.status ?? "unknown");
    if (status !== lastStatus) {
      log(`  status: ${status}`);
      lastStatus = status;
    }
    if (status === "ready" || status === "failed") return deployment;
    if (status === "canceled") {
      throw new Error("platform build was canceled — upload a new deployment to try again");
    }
    if ((Date.now() - startedAt) / 1000 >= timeoutSeconds) {
      throw new BuildTimeoutError(timeoutSeconds, status);
    }
    await sleep(POLL_INTERVAL_MS);
  }
}

/** Poll a deployment until it is ready; print build logs when it fails. */
export async function pollDeployment(deploymentPath: string, timeoutSeconds: number): Promise<Json> {
  const deployment = await settleDeployment(deploymentPath, timeoutSeconds);
  if (deployment.status === "failed") {
    const buildLogs = deployment.buildLogs ?? deployment.logs ?? "";
    if (buildLogs) log(String(buildLogs));
    throw new Error("platform build failed — see the build logs above");
  }
  return deployment;
}

/**
 * Wait for the build; on timeout, say what did not happen and how to finish
 * the existing deployment instead of re-uploading (DX-229).
 */
async function waitForBuild(deploymentPath: string, timeoutSeconds: number, pendingSteps: string, resumeCommand: string): Promise<void> {
  log("Waiting for the platform build");
  try {
    await pollDeployment(deploymentPath, timeoutSeconds);
  } catch (err) {
    if (!(err instanceof BuildTimeoutError)) throw err;
    rethrowWithContext(
      err,
      [
        `  The build is still running on the platform; ${pendingSteps} did NOT run.`,
        `  Wait longer with --timeout <seconds>, or finish this deployment later without re-uploading:`,
        `    ${resumeCommand}`,
      ].join("\n"),
    );
  }
}

/** Exact-name lookup in a list endpoint, tolerant of the collection key. */
async function findByName(listPath: string, name: string): Promise<Json | null> {
  const client = await sdkForProject();
  const response = (await client.call("get", listPath, JSON_HEADERS, { search: name })) as Json;
  return firstArray(response).find((item) => item.name === name) ?? null;
}

const resourceId = (resource: Json): string => String(resource.$id ?? resource.id ?? "");

/** Is the app listed on the Marketplace? `null` when the registry can't tell us. */
async function isPublished(functionId: string): Promise<boolean | null> {
  try {
    const client = await sdkForProject();
    const status = (await client.call("get", `/apps/${functionId}/marketplace-status`, JSON_HEADERS, {})) as Json;
    const flag = status.is_published ?? status.isPublished ?? status.published;
    return typeof flag === "boolean" ? flag : null;
  } catch {
    return null;
  }
}

export type ReleaseMode = "deploy" | "preview";

export type ReleaseKind = "app" | "theme" | "cube" | "integration";

/** What the release endpoints are addressed by: an app (function), a theme (site), a Cube or an integration. */
export interface ReleaseTarget {
  kind: ReleaseKind;
  id: string;
}

/** The platform collection each release kind lives in. */
const RELEASE_COLLECTION: Record<ReleaseKind, string> = { app: "/apps", theme: "/sites", cube: "/cubes", integration: "/integrations" };

/** The option that names a target of each kind directly. */
export const RELEASE_ID_FLAG: Record<ReleaseKind, string> = {
  app: "--function-id",
  theme: "--site-id",
  cube: "--cube-id",
  integration: "--integration-id",
};

export const releasesPath = (target: ReleaseTarget): string => `${RELEASE_COLLECTION[target.kind]}/${target.id}/releases`;

/** Round states that will not change without a reviewer or a new build. */
const SETTLED_STATES = new Set(["approved", "rejected"]);

/** Default wait for a release round to be recorded and settle, in seconds. */
export const DEFAULT_RELEASE_WAIT_SECONDS = 120;

const isNotFound = (err: unknown): boolean => {
  const code = (err as { code?: unknown } | null)?.code;
  return code === 404 || code === 405 || code === 501;
};

/**
 * The release rounds of a target, newest first as the registry orders them.
 * `null` when the gateway has no release endpoint (yet) — the caller then
 * keeps the flow it had before release approval existed.
 */
export async function fetchReleaseRounds(target: ReleaseTarget): Promise<Json[] | null> {
  const client = await sdkForProject();
  try {
    const response = (await client.call("get", releasesPath(target), JSON_HEADERS, {})) as Json | Json[];
    if (Array.isArray(response)) return response;
    for (const key of ["data", "releases", "rounds", "versions"]) {
      if (Array.isArray(response[key])) return response[key] as Json[];
    }
    return firstArray(response);
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

const roundState = (round: Json): string => String(round.state ?? "unknown");
const roundRc = (round: Json): number | null => (typeof round.rc_number === "number" ? round.rc_number : typeof round.rc === "number" ? round.rc : null);
const roundMode = (round: Json): string => String(round.mode ?? "deploy");

/**
 * The round this deployment opened: by recorded deployment id first, then
 * the newest round of the version the manifest names. Without a version at
 * hand (a resume run from another directory) the registry's newest round —
 * it lists rounds newest first — is the one the latest build opened.
 */
export const findRound = (rounds: Json[], deploymentId: string, version: string): Json | null => {
  const byDeployment = rounds.find((round) =>
    [round.deployment_id, round.deploymentId, round.deployed_deployment_id].some((id) => id && String(id) === deploymentId),
  );
  if (byDeployment) return byDeployment;
  if (!version) return rounds[0] ?? null;
  const ofVersion = rounds.filter((round) => String(round.version ?? "") === version);
  ofVersion.sort((a, b) => (roundRc(b) ?? 0) - (roundRc(a) ?? 0));
  return ofVersion[0] ?? null;
};

/** Human text for a rejection, whatever shape the registry stored it in. */
export const rejectionText = (rejection: unknown): string => {
  if (!rejection) return "";
  if (typeof rejection === "string") return rejection;
  if (typeof rejection === "object") {
    const r = rejection as Json;
    const text = r.reason ?? r.message ?? r.summary ?? r.code;
    if (text) return String(text);
  }
  return JSON.stringify(rejection);
};

/** One-line verdict of both gate phases: "pre passed, 1 warning · post pending". */
export const gateSummary = (gateResults: unknown): string => {
  const phases = (gateResults && typeof gateResults === "object" ? gateResults : {}) as Json;
  return ["pre", "post"]
    .map((phase) => {
      const entry = phases[phase];
      if (!entry) return `${phase} pending`;
      const results = (Array.isArray(entry) ? entry : ((entry as Json).results ?? [])) as Json[];
      const count = (status: string): number => results.filter((result) => result.status === status).length;
      const failed = count("failed");
      const warnings = count("warning");
      if (failed > 0) return `${phase} failed (${failed})`;
      return warnings > 0 ? `${phase} passed, ${warnings} warning${warnings === 1 ? "" : "s"}` : `${phase} passed`;
    })
    .join(" · ");
};

export interface ReleaseCheck {
  /** False when the gateway has no release endpoint: the pre-approval flow applies. */
  available: boolean;
  round: Json | null;
}

/**
 * Wait for the deployment's release round to be recorded and settle
 * (approved / rejected). Returns whatever is known when `waitSeconds` runs
 * out — a round still in review is a normal outcome, not an error. `0` reads
 * once (used by the tests).
 */
export async function awaitReleaseRound(target: ReleaseTarget, deploymentId: string, version: string, waitSeconds: number): Promise<ReleaseCheck> {
  const startedAt = Date.now();
  let lastSeen = "";
  for (;;) {
    let rounds: Json[] | null;
    try {
      rounds = await fetchReleaseRounds(target);
    } catch (err) {
      // Not knowing the round is no reason to fail a finished build: the
      // registry refuses to publish an unapproved version on its own.
      warn(`could not read the release round (${errorMessage(err)}) — continuing as before release approval`);
      return { available: false, round: null };
    }
    if (rounds === null) return { available: false, round: null };
    const round = findRound(rounds, deploymentId, version);
    if (round) {
      const seen = `${roundState(round)}`;
      if (seen !== lastSeen) {
        log(`  release ${round.version ?? version} rc ${roundRc(round) ?? "?"} (${roundMode(round)}): ${seen}`);
        lastSeen = seen;
      }
      if (SETTLED_STATES.has(roundState(round))) return { available: true, round };
    }
    if ((Date.now() - startedAt) / 1000 >= waitSeconds) return { available: true, round };
    await sleep(POLL_INTERVAL_MS);
  }
}

/** The compact release block of a result document. */
const releaseSummary = (round: Json | null): Json | null =>
  round
    ? {
        version: round.version ?? null,
        rc: roundRc(round),
        mode: roundMode(round),
        state: roundState(round),
        gates: gateSummary(round.gate_results),
        decisionDueAt: round.decision_due_at ?? null,
        rejection: rejectionText(round.rejection) || null,
      }
    : null;

/**
 * What the release check means for the steps after the build. Approved (or
 * no release endpoint on this gateway) → go on. Rejected → fail with the
 * reason. Anything else → stop here: the build is uploaded but not live
 * until a reviewer approves it, and publishing an unapproved version is
 * refused by the registry anyway. `skipped` names what did not run; Cubes
 * and integrations have no step after the build and pass "".
 */
export function releaseGate(check: ReleaseCheck, label: string, target: ReleaseTarget, skipped = "publish and install did NOT run"): "proceed" | "hold" {
  if (!check.available) return "proceed";
  const tail = skipped ? ` — ${skipped}` : "";
  const statusCommand = `${EXECUTABLE_NAME} release status ${RELEASE_ID_FLAG[target.kind]} ${target.id}`;
  const round = check.round;
  if (!round) {
    warn(`no release round is recorded for this ${label} yet${tail}`);
    hint(`check later with '${statusCommand}'`);
    return "hold";
  }
  const state = roundState(round);
  if (state === "approved") return "proceed";
  if (state === "rejected") {
    const reason = rejectionText(round.rejection);
    throw new Error(`release ${round.version ?? ""} rc ${roundRc(round) ?? "?"} was rejected${reason ? `: ${reason}` : ""}${tail}`);
  }
  warn(`release ${round.version ?? ""} rc ${roundRc(round) ?? "?"} is ${state}: the build is uploaded but not live until it is approved${tail}`);
  if (round.decision_due_at) hint(`a reviewer decision is due by ${String(round.decision_due_at)}`);
  if (roundMode(round) === "preview") {
    hint(`it is a preview: once you have checked the candidate, give your go with '${EXECUTABLE_NAME} preview accept ${RELEASE_ID_FLAG[target.kind]} ${target.id}'`);
  }
  hint(`follow the review with '${statusCommand}'`);
  return "hold";
}

/** Context for a publish the registry refused because the version is not approved. */
const isVersionNotApproved = (err: unknown): boolean => {
  const e = err as { code?: unknown; type?: unknown; message?: unknown; response?: unknown } | null;
  if (e?.code !== 409) return false;
  return /version_not_approved|not approved/i.test(`${String(e.type ?? "")} ${String(e.message ?? "")} ${typeof e.response === "string" ? e.response : JSON.stringify(e.response ?? "")}`);
};

export interface DeployAppFlags {
  functionId?: string;
  deploymentId?: string;
  runtime: string;
  specification?: string;
  owner?: string;
  publish: boolean;
  install: boolean;
  timeout: number;
  /** `deploy` (default) or `preview` — set by the `deploy` / `preview` command group. */
  releaseMode?: ReleaseMode;
  /** How long to wait for the release round to settle after the build, in seconds. */
  releaseWait?: number;
}

/** The exact invocation that finishes a deployment from the build wait on. */
const appResumeCommand = (functionId: string, deploymentId: string, flags: Pick<DeployAppFlags, "owner" | "publish" | "install" | "releaseMode">): string => {
  const group = flags.releaseMode === "preview" ? "preview" : "deploy";
  const parts = [`${EXECUTABLE_NAME} ${group} app --function-id ${functionId} --deployment-id ${deploymentId}`];
  if (flags.owner) parts.push(`--owner ${flags.owner}`);
  if (!flags.publish) parts.push("--no-publish");
  if (!flags.install) parts.push("--no-install");
  return parts.join(" ");
};

export const deployApp = async (dir: string, flags: DeployAppFlags): Promise<void> => {
  const root = path.resolve(dir);
  const manifest = readJsonIf(path.join(root, "manifest.json"));
  const client = await sdkForProject();
  const resuming = Boolean(flags.deploymentId);
  const releaseMode: ReleaseMode = flags.releaseMode ?? "deploy";
  const version = typeof manifest?.version === "string" ? manifest.version : "";

  // Resuming reads the name from the registered app when the manifest is not
  // at hand — the resume command may be run from anywhere.
  let name = typeof manifest?.name === "string" ? manifest.name : "";
  if (!name && resuming && flags.functionId) {
    const app = (await client.call("get", `/apps/${flags.functionId}`, JSON_HEADERS, {})) as Json;
    name = typeof app.name === "string" ? app.name : "";
  }
  if (!name) {
    throw new Error(`${root} is not an app directory (no manifest.json with a name) — scaffold one with '${EXECUTABLE_NAME} create app'`);
  }

  let functionId = flags.functionId ?? "";
  if (!functionId) {
    const existing = await findByName("/apps", name);
    if (existing) {
      functionId = resourceId(existing);
      log(`Using existing app '${name}' (${functionId})`);
    } else if (resuming) {
      throw new Error(`no app named '${name}' is registered — pass --function-id together with --deployment-id`);
    } else {
      log(`Registering app '${name}'`);
      const payload: RequestParams = {
        functionId: "unique()",
        name,
        runtime: flags.runtime,
        entrypoint: "src/main.js",
        commands: "npm install",
      };
      if (flags.specification) payload.specification = flags.specification;
      const created = (await client.call("post", "/apps", JSON_HEADERS, payload)) as Json;
      functionId = resourceId(created);
    }
  }
  if (!functionId) throw new Error("could not resolve the app's function id");

  let deploymentId = flags.deploymentId ?? "";
  if (deploymentId) {
    log(`Resuming deployment ${deploymentId} of '${name}' (${functionId}) — skipping packaging and upload`);
  } else {
    log("Packaging source");
    const code = await packDirectory(root);

    // activate is a request, not a promise: the platform puts the build live
    // only once its release round is approved (otherwise it stays a candidate).
    log(`Uploading deployment (activate=true, releaseMode=${releaseMode})`);
    const deployment = (await client.call(
      "post",
      `/apps/${functionId}/deployments`,
      { "content-type": "multipart/form-data" },
      { code, activate: true, releaseMode, entrypoint: "src/main.js", commands: "npm install" },
    )) as Json;
    deploymentId = resourceId(deployment);
    if (!deploymentId) throw new Error("the upload returned no deployment id");
  }

  const pending = flags.publish && flags.install ? "publish + install" : flags.publish ? "publish" : flags.install ? "install" : "nothing else";
  await waitForBuild(`/apps/${functionId}/deployments/${deploymentId}`, flags.timeout, pending, appResumeCommand(functionId, deploymentId, flags));

  log("Checking the release round");
  const target: ReleaseTarget = { kind: "app", id: functionId };
  const check = await awaitReleaseRound(target, deploymentId, version, flags.releaseWait ?? DEFAULT_RELEASE_WAIT_SECONDS);
  const release = releaseSummary(check.round);
  if (releaseGate(check, "deployment", target) === "hold") {
    if (cliConfig.output !== "table") {
      parse({ app: name, functionId, deploymentId, resumed: resuming, releaseMode, release, published: false, installed: false });
      return;
    }
    success(`App '${name}' uploaded and built (${functionId}) — waiting for release approval`);
    hint(`once approved, finish with: ${appResumeCommand(functionId, deploymentId, flags)}`);
    return;
  }

  let published = false;
  // A resumed run may follow a publish that did land while the earlier run
  // gave up on the response (DX-234): ask the registry before publishing
  // again, so the resume command finishes the flow instead of repeating it.
  if (flags.publish && resuming && (await isPublished(functionId)) === true) {
    log("Already listed on the Marketplace — skipping publish");
    published = true;
  } else if (flags.publish) {
    log("Publishing to the Marketplace");
    try {
      await client.call("post", `/apps/${functionId}/publish`, JSON_HEADERS, {});
      published = true;
    } catch (err) {
      // The publish can land server-side while the client gives up on the
      // response: ask the registry before failing the flow.
      if ((await isPublished(functionId)) === true) {
        warn(`publish request failed client-side (${errorMessage(err)}) but the Marketplace lists the app as published — continuing`);
        published = true;
      } else {
        const resume = appResumeCommand(functionId, deploymentId, flags);
        if (isVersionNotApproved(err)) {
          rethrowWithContext(
            err,
            [
              `  The registry refused the publish: this version is not approved yet, and install did NOT run.`,
              `  Follow the review: ${EXECUTABLE_NAME} release status --function-id ${functionId}`,
              `  Finish once it is approved: ${resume}`,
            ].join("\n"),
          );
        }
        const outcome = isRejectedByGateway(err)
          ? "the gateway rejected the publish"
          : "the publish may still have landed server-side";
        rethrowWithContext(
          err,
          [
            `  The build is ready; ${outcome}, and install did NOT run.`,
            `  Check: ${EXECUTABLE_NAME} apps get-marketplace-status --function-id ${functionId}`,
            `  Finish (skips the publish if the Marketplace already lists the app): ${resume}`,
          ].join("\n"),
        );
      }
    }
  }

  let installed = false;
  if (flags.install) {
    const owner = flags.owner ?? (cliConfig.tenant || resolveTenant());
    if (!owner) {
      warn(`no owner tenant resolved — skipping the marketplace install (pass --owner or '${EXECUTABLE_NAME} tenants use')`);
    } else {
      log(`Installing on tenant '${owner}'`);
      try {
        await client.call("post", "/apps/marketplace/install", JSON_HEADERS, { owner, name });
        installed = true;
      } catch (err) {
        rethrowWithContext(
          err,
          [
            `  The build${published ? " and publish are" : " is"} done; install did NOT run, so no routes were written.`,
            `  Retry only the install: ${appResumeCommand(functionId, deploymentId, { ...flags, publish: false })}`,
          ].join("\n"),
        );
      }
    }
  }

  // Machine-readable stdout is the result document and nothing else; the
  // progress lines above went to stderr (DX-241).
  if (cliConfig.output !== "table") {
    parse({ app: name, functionId, deploymentId, resumed: resuming, releaseMode, release, published, installed });
    return;
  }
  success(`App '${name}' deployed (${functionId})`);
  hint("routes are written at install time — re-run the install after every new version");
};

interface DeploySiteFlags {
  siteId?: string;
  deploymentId?: string;
  name?: string;
  framework: string;
  adapter: string;
  buildRuntime: string;
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  timeout: number;
  /** `deploy` (default) or `preview`; only themes go through release approval. */
  releaseMode?: ReleaseMode;
}

/**
 * Find-or-create the Site, upload an activated deployment, poll the build.
 * `pendingSteps` names what the caller still does after the build, for the
 * timeout message.
 */
async function deployToSite(
  root: string,
  flags: DeploySiteFlags,
  name: string,
  subcommand: "site" | "theme",
  pendingSteps: string,
): Promise<{ siteId: string; deploymentId: string }> {
  const client = await sdkForProject();
  const resuming = Boolean(flags.deploymentId);
  const group = flags.releaseMode === "preview" ? "preview" : "deploy";

  let siteId = flags.siteId ?? "";
  if (!siteId) {
    const existing = await findByName("/sites", name);
    if (existing) {
      siteId = resourceId(existing);
      log(`Using existing site '${name}' (${siteId})`);
    } else if (resuming) {
      throw new Error(`no site named '${name}' exists — pass --site-id together with --deployment-id`);
    } else {
      log(`Creating site '${name}'`);
      const created = (await client.call("post", "/sites", JSON_HEADERS, {
        siteId: "unique()",
        name,
        framework: flags.framework,
        adapter: flags.adapter,
        buildRuntime: flags.buildRuntime,
        installCommand: flags.installCommand,
        buildCommand: flags.buildCommand,
        outputDirectory: flags.outputDirectory,
      })) as Json;
      siteId = resourceId(created);
    }
  }
  if (!siteId) throw new Error("could not resolve the site id");

  let deploymentId = flags.deploymentId ?? "";
  if (deploymentId) {
    log(`Resuming deployment ${deploymentId} of '${name}' (${siteId}) — skipping packaging and upload`);
  } else {
    log("Packaging source");
    const code = await packDirectory(root);

    const payload: RequestParams = { code, activate: true };
    if (flags.releaseMode) payload.releaseMode = flags.releaseMode;
    log(`Uploading deployment (activate=true${flags.releaseMode ? `, releaseMode=${flags.releaseMode}` : ""})`);
    const deployment = (await client.call("post", `/sites/${siteId}/deployments`, { "content-type": "multipart/form-data" }, payload)) as Json;
    deploymentId = resourceId(deployment);
    if (!deploymentId) throw new Error("the upload returned no deployment id");
  }

  const resume = `${EXECUTABLE_NAME} ${group} ${subcommand} --site-id ${siteId} --deployment-id ${deploymentId}`;
  await waitForBuild(`/sites/${siteId}/deployments/${deploymentId}`, flags.timeout, pendingSteps, resume);

  return { siteId, deploymentId };
}

const deploySite = async (dir: string, flags: DeploySiteFlags): Promise<void> => {
  const root = path.resolve(dir);
  const pkg = readJsonIf(path.join(root, "package.json"));
  const name = flags.name ?? (typeof pkg?.name === "string" ? pkg.name : path.basename(root));

  const result = await deployToSite(root, flags, name, "site", "nothing else");

  if (cliConfig.output !== "table") {
    parse({ site: name, ...result });
    return;
  }
  success(`Site '${name}' deployed (${result.siteId})`);
};

export interface DeployThemeFlags extends DeploySiteFlags {
  owner?: string;
  publish: boolean;
  install: boolean;
  /** How long to wait for the release round to settle after the build, in seconds. */
  releaseWait?: number;
}

export const deployTheme = async (dir: string, flags: DeployThemeFlags): Promise<void> => {
  const root = path.resolve(dir);
  const theme = readJsonIf(path.join(root, "theme.json"));
  const resuming = Boolean(flags.deploymentId);

  // Like deployApp: a resume may run from anywhere, so without a theme.json
  // the name (needed for the marketplace install) comes from the site itself.
  let name = flags.name ?? (typeof theme?.name === "string" ? theme.name : "");
  if (!name && resuming && flags.siteId) {
    const client = await sdkForProject();
    const site = (await client.call("get", `/sites/${flags.siteId}`, JSON_HEADERS, {})) as Json;
    name = typeof site.name === "string" ? site.name : "";
  }
  if (!name) {
    throw new Error(
      resuming
        ? `${root} is not a theme directory (no theme.json with a name) — run the resume from the theme directory, or pass --site-id together with --deployment-id`
        : `${root} is not a theme directory (no theme.json with a name) — scaffold one with '${EXECUTABLE_NAME} create theme'`,
    );
  }
  const site = ((theme?.site ?? {}) as Json);
  const releaseMode: ReleaseMode = flags.releaseMode ?? "deploy";
  const version = typeof theme?.version === "string" ? theme.version : "";

  // theme.json's site block wins over the generic defaults.
  const siteFlags: DeploySiteFlags = {
    ...flags,
    releaseMode,
    framework: String(site.framework ?? flags.framework),
    adapter: String(site.adapter ?? flags.adapter),
    installCommand: String(site.installCommand ?? flags.installCommand),
    buildCommand: String(site.buildCommand ?? flags.buildCommand),
    outputDirectory: String(site.outputDirectory ?? flags.outputDirectory),
  };

  const pending = flags.publish && flags.install ? "publish + install" : flags.publish ? "publish" : flags.install ? "install" : "nothing else";
  const result = await deployToSite(root, siteFlags, name, "theme", pending);
  // Theme registration is automatic: the platform's build worker extracts
  // theme.json from the ready deployment and drives the registry itself.

  log("Checking the release round");
  const target: ReleaseTarget = { kind: "theme", id: result.siteId };
  const check = await awaitReleaseRound(target, result.deploymentId, version, flags.releaseWait ?? DEFAULT_RELEASE_WAIT_SECONDS);
  const release = releaseSummary(check.round);
  if (releaseGate(check, "deployment", target) === "hold") {
    if (cliConfig.output !== "table") {
      parse({ theme: name, ...result, releaseMode, release, published: false, installed: false });
      return;
    }
    success(`Theme '${name}' uploaded and built (${result.siteId}) — waiting for release approval`);
    hint(`once approved, finish with: ${EXECUTABLE_NAME} ${releaseMode} theme --site-id ${result.siteId} --deployment-id ${result.deploymentId}`);
    return;
  }

  const client = await sdkForProject();
  let published = false;
  if (flags.publish) {
    try {
      await client.call("post", `/sites/${result.siteId}/publish`, JSON_HEADERS, {});
      published = true;
      log("Published to the Marketplace");
    } catch {
      warn("publish endpoint not available on this gateway — publish the theme from Cockpit → Experience → Themes");
    }
  }
  let installed = false;
  if (flags.install) {
    const owner = flags.owner ?? (cliConfig.tenant || resolveTenant());
    if (!owner) {
      warn(`no owner tenant resolved — skipping the marketplace install (pass --owner or '${EXECUTABLE_NAME} tenants use')`);
    } else {
      try {
        await client.call("post", "/apps/marketplace/install", JSON_HEADERS, { owner, name });
        installed = true;
        log(`Installed on tenant '${owner}'`);
      } catch {
        warn("marketplace install failed — install the theme from Cockpit → Experience → Themes");
      }
    }
  }

  if (cliConfig.output !== "table") {
    parse({ theme: name, ...result, releaseMode, release, published, installed });
    return;
  }
  success(`Theme '${name}' deployed (${result.siteId})`);
  hint("bind your domain in Cockpit → Experience → Themes to route real traffic");
};

/**
 * Cubes (PE-1254). A Cube deployment does not run anything: the platform
 * build bundles the directory and submits it to the analytics registry as a
 * release. `ready` means the release was submitted, `failed` that the registry
 * refused it — with one line per problem in the build logs. The flow then
 * waits for the release round like an app's (PE-1256); a gateway without
 * Cube release rounds ends it at "submitted for review" as before.
 */

/** Never ship a Cube's local build output either. */
const CUBE_PACK_EXCLUDES = ["dist"];

export interface CubeIdentity {
  vendor: string;
  name: string;
  version: string;
}

const stringField = (doc: Json | null | undefined, key: string): string => (typeof doc?.[key] === "string" ? (doc[key] as string) : "");

/** vendor/name@version, leaving out whatever is not known. */
export const cubeLabel = (cube: Partial<CubeIdentity>): string => {
  const ref = cube.vendor && cube.name ? `${cube.vendor}/${cube.name}` : (cube.name ?? "");
  return cube.version ? `${ref}@${cube.version}` : ref;
};

/** The identity the build recorded (`manifestJson`), as a string or an object. */
export const deploymentCubeIdentity = (deployment: Json): Partial<CubeIdentity> => {
  let manifest: unknown = deployment.manifestJson ?? deployment.manifest ?? null;
  if (typeof manifest === "string") {
    try {
      manifest = JSON.parse(manifest);
    } catch {
      manifest = null;
    }
  }
  const doc = (manifest && typeof manifest === "object" ? manifest : {}) as Json;
  const identity: Partial<CubeIdentity> = {};
  for (const key of ["vendor", "name", "version"] as const) {
    const value = stringField(doc, key);
    if (value) identity[key] = value;
  }
  return identity;
};

export interface CubeBuildOutcome {
  /** The submitted line as the build wrote it, when it did. */
  submitted: string | null;
  /** The rejection line ("Release rejected by analytics-api: …"), when present. */
  rejected: string | null;
  /** One entry per problem the registry named: "{document} {path} → {message}". */
  problems: string[];
}

/** Read the release outcome out of a Cube deployment's build logs. */
export const parseCubeBuildLogs = (buildLogs: unknown): CubeBuildOutcome => {
  const lines = String(buildLogs ?? "").split(/\r?\n/);
  const outcome: CubeBuildOutcome = { submitted: null, rejected: null, problems: [] };
  let inRejection = false;
  for (const line of lines) {
    if (line.startsWith("Release submitted for review:")) {
      outcome.submitted = line.trim();
      inRejection = false;
      continue;
    }
    if (line.startsWith("Release rejected by ")) {
      outcome.rejected = line.trim();
      inRejection = true;
      continue;
    }
    if (inRejection) {
      if (/^\s+\S/.test(line)) outcome.problems.push(line.trim());
      else if (line.trim() !== "") inRejection = false;
    }
  }
  return outcome;
};

/**
 * Run the Cube repo's own validator when it ships one. The registry runs the
 * same checks; failing here saves a build round-trip. Output goes to stderr so
 * a machine-readable stdout stays the result document alone.
 */
export function validateCubeLocally(root: string): "passed" | "skipped" {
  const script = path.join(root, "scripts", "cube.mjs");
  if (!fs.existsSync(script)) return "skipped";
  const args = [script, "validate", root];
  const catalog = path.join(root, "test", "catalog.json");
  if (fs.existsSync(catalog)) args.push("--catalog", catalog);

  log("Validating the Cube (scripts/cube.mjs validate)");
  const run = spawnSync("node", args, { cwd: root, encoding: "utf8" });
  if (run.error) {
    warn(`could not run the local validator (${errorMessage(run.error)}) — the registry still validates the release`);
    return "skipped";
  }
  const output = `${run.stdout ?? ""}${run.stderr ?? ""}`.trimEnd();
  if (run.status !== 0) {
    if (output) process.stderr.write(`${output}\n`);
    throw new Error("local validation failed — fix the problems above, or pass --skip-validate to let the registry decide");
  }
  return "passed";
}

/**
 * Integrations (PE-1256). An integration repo is a node package of workflow
 * nodes: package.json depends on the node SDK and its build ends with
 * `rvnxx-nodes manifest`, which writes dist/manifest.json. Most repos also
 * keep a manifest.json at the root, and that one names the integration in
 * the registry. The platform build installs, builds and `npm pack`s the
 * package, publishes the tarball to the integrations API and opens the
 * release round in Console.
 */

/** The node SDK every integration package depends on. */
export const INTEGRATION_SDK_PACKAGE = "@revenexx/integrations-node-sdk";

/** Leave out the local build output and stray `npm pack` tarballs. */
const INTEGRATION_PACK_EXCLUDES = ["dist", "*.tgz"];

export interface IntegrationPackage {
  /** Registry name: manifest.json's name, else the package name without its scope. */
  name: string;
  vendor: string;
  version: string;
  /** The npm package name as package.json states it. */
  packageName: string;
}

/**
 * Read an integration package from a directory, or `null` when the directory
 * is not one. The node SDK's own repo depends on nothing and is not one.
 */
export const readIntegrationPackage = (root: string): IntegrationPackage | null => {
  const pkg = readJsonIf(path.join(root, "package.json"));
  if (!pkg) return null;
  const packageName = stringField(pkg, "name");
  if (packageName === INTEGRATION_SDK_PACKAGE) return null;
  const dependsOnSdk = ["dependencies", "peerDependencies", "devDependencies"].some((key) => {
    const deps = pkg[key];
    return Boolean(deps && typeof deps === "object" && INTEGRATION_SDK_PACKAGE in (deps as Json));
  }) || (Array.isArray(pkg.bundledDependencies) && pkg.bundledDependencies.includes(INTEGRATION_SDK_PACKAGE));
  const scripts = (pkg.scripts && typeof pkg.scripts === "object" ? pkg.scripts : {}) as Json;
  const buildsManifest = Object.values(scripts).some((script) => typeof script === "string" && script.includes("rvnxx-nodes manifest"));
  if (!dependsOnSdk && !buildsManifest) return null;

  const manifest = readJsonIf(path.join(root, "manifest.json"));
  const name = stringField(manifest, "name") || packageName.replace(/^@[^/]+\//, "");
  if (!name) return null;
  return {
    name,
    vendor: stringField(manifest, "vendor"),
    version: stringField(manifest, "version") || stringField(pkg, "version"),
    packageName,
  };
};

/** What differs between the two resources that build into a release round. */
interface PackageResource {
  kind: "cube" | "integration";
  /** Human noun in messages, and the same at the start of a sentence. */
  noun: string;
  title: string;
  collection: string;
  /** The id parameter of the create call. */
  idParam: string;
  packExcludes: readonly string[];
}

const CUBE_RESOURCE: PackageResource = { kind: "cube", noun: "Cube", title: "Cube", collection: "/cubes", idParam: "cubeId", packExcludes: CUBE_PACK_EXCLUDES };
const INTEGRATION_RESOURCE: PackageResource = {
  kind: "integration",
  noun: "integration",
  title: "Integration",
  collection: "/integrations",
  idParam: "integrationId",
  packExcludes: INTEGRATION_PACK_EXCLUDES,
};

interface PackageDeployFlags {
  deploymentId?: string;
  /** Deploy from the connected repository instead of uploading the directory. */
  fromGit?: boolean;
  ref?: string;
  refType?: "branch" | "commit" | "tag";
  timeout: number;
  /** `deploy` (default) or `preview` — set by the `deploy` / `preview` command group. */
  releaseMode?: ReleaseMode;
  /** How long to wait for the release round to settle after the build, in seconds. */
  releaseWait?: number;
}

const packageResumeCommand = (res: PackageResource, releaseMode: ReleaseMode, id: string, deploymentId: string): string =>
  `${EXECUTABLE_NAME} ${releaseMode === "preview" ? "preview" : "deploy"} ${res.kind} ${RELEASE_ID_FLAG[res.kind]} ${id} --deployment-id ${deploymentId}`;

interface PackageDeploy {
  res: PackageResource;
  root: string;
  name: string;
  /** The id given on the command line, if any. */
  id: string;
  /** What the directory says about the release; the build's manifest fills the gaps. */
  local: Partial<CubeIdentity>;
  flags: PackageDeployFlags;
  /** Extra keys for the result document. */
  extra?: Json;
}

/**
 * The flow `deploy cube` and `deploy integration` share: find-or-create,
 * upload (or trigger a Git build), wait for the build, then wait for the
 * release round it opened. A rejected build names every problem; a round in
 * review ends the command with its state. Git builds always run in deploy
 * mode.
 */
async function deployPackage(d: PackageDeploy): Promise<void> {
  const { res, root, name, flags } = d;
  const client = await sdkForProject();
  const resuming = Boolean(flags.deploymentId);
  const releaseMode: ReleaseMode = flags.fromGit ? "deploy" : (flags.releaseMode ?? "deploy");
  const idFlag = RELEASE_ID_FLAG[res.kind];

  let id = d.id;
  let resource: Json | null = null;
  if (!id) {
    resource = await findByName(res.collection, name);
    if (resource) {
      id = resourceId(resource);
      log(`Using existing ${res.noun} '${name}' (${id})`);
    } else if (resuming) {
      throw new Error(`no ${res.noun} named '${name}' exists — pass ${idFlag} together with --deployment-id`);
    } else if (flags.fromGit) {
      throw new Error(`no ${res.noun} named '${name}' exists — connect it to its repository in Cockpit first, or deploy the directory without --from-git`);
    } else {
      log(`Creating ${res.noun} '${name}'`);
      resource = (await client.call("post", res.collection, JSON_HEADERS, { [res.idParam]: "unique()", name })) as Json;
      id = resourceId(resource);
    }
  }
  if (!id) throw new Error(`could not resolve the ${res.noun} id`);

  let deploymentId = flags.deploymentId ?? "";
  if (deploymentId) {
    log(`Resuming deployment ${deploymentId} of '${name}' (${id}) — skipping packaging and upload`);
  } else if (flags.fromGit) {
    if (!resource || resourceId(resource) !== id) {
      resource = (await client.call("get", `${res.collection}/${id}`, JSON_HEADERS, {})) as Json;
    }
    if (!stringField(resource, "installationId") || !stringField(resource, "providerRepositoryId")) {
      throw new Error(`${res.title} '${name}' (${id}) is not connected to a repository — connect it in Cockpit, or deploy the directory without --from-git`);
    }
    const refType = flags.refType ?? "branch";
    const reference = flags.ref ?? (refType === "branch" ? stringField(resource, "providerBranch") : "");
    if (!reference) throw new Error(`no reference to deploy — pass --ref <${refType}>`);
    log(`Triggering a deployment from ${refType} '${reference}' (activate=true)`);
    const deployment = (await client.call("post", `${res.collection}/${id}/deployments/vcs`, JSON_HEADERS, {
      type: refType,
      reference,
      activate: true,
    })) as Json;
    deploymentId = resourceId(deployment);
    if (!deploymentId) throw new Error("the platform returned no deployment id");
  } else {
    log(`Packaging the ${res.noun}`);
    const code = await packDirectory(root, res.packExcludes);
    // activate is a request, not a promise: the platform puts the build live
    // only once its release round is approved.
    log(`Uploading deployment (activate=true, releaseMode=${releaseMode})`);
    const deployment = (await client.call(
      "post",
      `${res.collection}/${id}/deployments`,
      { "content-type": "multipart/form-data" },
      { code, activate: true, releaseMode },
    )) as Json;
    deploymentId = resourceId(deployment);
    if (!deploymentId) throw new Error("the upload returned no deployment id");
  }

  log("Waiting for the platform build");
  let deployment: Json;
  try {
    deployment = await settleDeployment(`${res.collection}/${id}/deployments/${deploymentId}`, flags.timeout);
  } catch (err) {
    if (!(err instanceof BuildTimeoutError)) throw err;
    return rethrowWithContext(
      err,
      [
        "  The build is still running on the platform; the release has NOT been submitted yet.",
        "  Wait longer with --timeout <seconds>, or pick this deployment up later without re-uploading:",
        `    ${packageResumeCommand(res, releaseMode, id, deploymentId)}`,
      ].join("\n"),
    );
  }

  const outcome = parseCubeBuildLogs(deployment.buildLogs ?? deployment.logs);
  const identity = { ...d.local, ...deploymentCubeIdentity(deployment) };
  const label = cubeLabel(identity) || name;
  const machine = cliConfig.output !== "table";
  const result: Json = {
    [res.kind]: identity.vendor && identity.name ? `${identity.vendor}/${identity.name}` : name,
    version: identity.version ?? null,
    [res.idParam]: id,
    deploymentId,
    resumed: resuming,
    source: flags.fromGit ? "git" : "upload",
    releaseMode,
    ...d.extra,
  };

  if (deployment.status === "failed") {
    if (machine) {
      parse({ ...result, status: "rejected", reason: outcome.rejected, problems: outcome.problems });
    } else {
      if (outcome.rejected) warn(outcome.rejected);
      for (const problem of outcome.problems) warn(`  ${problem}`);
      if (!outcome.rejected && outcome.problems.length === 0) {
        const raw = String(deployment.buildLogs ?? deployment.logs ?? "").trimEnd();
        if (raw) process.stderr.write(`${raw}\n`);
      }
    }
    const count = outcome.problems.length;
    throw new Error(
      outcome.rejected
        ? `release of ${label} was rejected${count ? ` (${count} problem${count === 1 ? "" : "s"})` : ""} — fix ${count === 1 ? "it" : "them"} and deploy again`
        : `the ${res.noun} build failed${machine ? "" : " — see the build logs above"}`,
    );
  }

  log("Checking the release round");
  const target: ReleaseTarget = { kind: res.kind, id };
  const check = await awaitReleaseRound(target, deploymentId, identity.version ?? "", flags.releaseWait ?? DEFAULT_RELEASE_WAIT_SECONDS);

  // A gateway without release rounds: the build submitted the release and
  // that is all the platform can tell.
  if (!check.available) {
    if (machine) {
      parse({ ...result, status: "submitted", review: "pending", release: null });
      return;
    }
    success(outcome.submitted ?? `Release submitted for review: ${label} (review pending).`);
    hint("the review happens in Console; the release goes live once it is approved");
    return;
  }

  const release = releaseSummary(check.round);
  const state = check.round ? roundState(check.round) : "";
  if (machine && state !== "approved") {
    parse({ ...result, status: state === "rejected" ? "rejected" : "submitted", review: state || "pending", release });
  }
  if (outcome.submitted && !machine) log(outcome.submitted);
  if (releaseGate(check, `${res.noun} deployment`, target, "") === "hold") {
    if (!machine) success(`${res.title} ${label} uploaded and built (${id}) — waiting for release approval`);
    return;
  }

  if (machine) {
    parse({ ...result, status: "approved", review: "approved", release });
    return;
  }
  success(`${res.title} ${label} approved and deployed (${id})`);
}

export interface DeployCubeFlags extends PackageDeployFlags {
  cubeId?: string;
  /** Skip `node scripts/cube.mjs validate` before the upload. */
  skipValidate?: boolean;
}

export const deployCube = async (dir: string, flags: DeployCubeFlags): Promise<void> => {
  const root = path.resolve(dir);
  const cubeJson = readJsonIf(path.join(root, "cube.json"));
  const resuming = Boolean(flags.deploymentId);
  const local: Partial<CubeIdentity> = {};
  for (const key of ["vendor", "name", "version"] as const) {
    const value = stringField(cubeJson, key);
    if (value) local[key] = value;
  }

  // Resuming may run from anywhere: the name then comes from the Cube itself.
  let name = local.name ?? "";
  if (!name && flags.cubeId && (resuming || flags.fromGit)) {
    const client = await sdkForProject();
    const cube = (await client.call("get", `/cubes/${flags.cubeId}`, JSON_HEADERS, {})) as Json;
    name = stringField(cube, "name");
  }
  if (!name) {
    throw new Error(`${root} is not a Cube directory (no cube.json with a name) — start one with '${EXECUTABLE_NAME} create cube'`);
  }

  let validation: "passed" | "skipped" = "skipped";
  if (!resuming && !flags.fromGit && flags.skipValidate !== true) {
    validation = validateCubeLocally(root);
  }

  await deployPackage({ res: CUBE_RESOURCE, root, name, id: flags.cubeId ?? "", local, flags, extra: { validation } });
};

export interface DeployIntegrationFlags extends PackageDeployFlags {
  integrationId?: string;
  /** Registry name override (default: manifest.json name, else the package name without its scope). */
  name?: string;
}

export const deployIntegration = async (dir: string, flags: DeployIntegrationFlags): Promise<void> => {
  const root = path.resolve(dir);
  const pkg = readIntegrationPackage(root);
  const resuming = Boolean(flags.deploymentId);

  let name = flags.name ?? pkg?.name ?? "";
  if (!name && flags.integrationId && (resuming || flags.fromGit)) {
    const client = await sdkForProject();
    const integration = (await client.call("get", `/integrations/${flags.integrationId}`, JSON_HEADERS, {})) as Json;
    name = stringField(integration, "name");
  }
  if (!name) {
    throw new Error(
      `${root} is not an integration package (no package.json depending on ${INTEGRATION_SDK_PACKAGE}) — run from one, or pass --integration-id together with --deployment-id`,
    );
  }
  const local: Partial<CubeIdentity> = { name };
  if (pkg?.vendor) local.vendor = pkg.vendor;
  if (pkg?.version) local.version = pkg.version;

  await deployPackage({ res: INTEGRATION_RESOURCE, root, name, id: flags.integrationId ?? "", local, flags });
};

/**
 * Which kind of release target a directory holds. cube.json and an
 * integration package are checked before manifest.json, because integration
 * repos keep a manifest.json of their own.
 */
export const detectReleaseKind = (root: string): { kind: ReleaseKind; name: string; version: string } | null => {
  const cube = readJsonIf(path.join(root, "cube.json"));
  if (stringField(cube, "name")) return { kind: "cube", name: stringField(cube, "name"), version: stringField(cube, "version") };
  const integration = readIntegrationPackage(root);
  if (integration) return { kind: "integration", name: integration.name, version: integration.version };
  const manifest = readJsonIf(path.join(root, "manifest.json"));
  if (stringField(manifest, "name")) return { kind: "app", name: stringField(manifest, "name"), version: stringField(manifest, "version") };
  const theme = readJsonIf(path.join(root, "theme.json"));
  if (stringField(theme, "name")) return { kind: "theme", name: stringField(theme, "name"), version: stringField(theme, "version") };
  return null;
};

export interface ReleaseTargetFlags {
  functionId?: string;
  siteId?: string;
  cubeId?: string;
  integrationId?: string;
}

/**
 * Resolve the app, theme, Cube or integration a release command talks about:
 * explicit ids win, otherwise the directory decides (cube.json → Cube,
 * integration package → integration, manifest.json → app, theme.json →
 * theme) and the target is looked up by name.
 */
export async function resolveReleaseTarget(dir: string, flags: ReleaseTargetFlags): Promise<{ target: ReleaseTarget; name: string; version: string }> {
  const root = path.resolve(dir);
  const detected = detectReleaseKind(root);
  const given: Array<[ReleaseKind, string | undefined]> = [
    ["app", flags.functionId],
    ["theme", flags.siteId],
    ["cube", flags.cubeId],
    ["integration", flags.integrationId],
  ];
  for (const [kind, id] of given) {
    if (!id) continue;
    const local = detected?.kind === kind ? detected : null;
    return { target: { kind, id }, name: local?.name ?? "", version: local?.version ?? "" };
  }

  if (!detected) {
    throw new Error(
      `${root} is not an app (manifest.json), theme (theme.json), Cube (cube.json) or integration package directory — run from one, or pass --function-id / --site-id / --cube-id / --integration-id`,
    );
  }
  const { kind, name, version } = detected;
  const found = await findByName(RELEASE_COLLECTION[kind], name);
  if (!found) throw new Error(`no ${kind} named '${name}' is registered — deploy it first, or pass ${RELEASE_ID_FLAG[kind]}`);
  return { target: { kind, id: resourceId(found) }, name, version };
}

const releaseUnavailable = (): Error =>
  new Error("this gateway does not offer release rounds yet — update the platform, or follow the review in Cockpit");

export interface PreviewAcceptFlags extends ReleaseTargetFlags {
  releaseVersion?: string;
  rc?: number;
}

/**
 * The vendor's go on a preview candidate. `--rc` omitted lets the platform
 * pick the version's current candidate round.
 */
export const previewAccept = async (dir: string, flags: PreviewAcceptFlags): Promise<void> => {
  const { target, name, version: localVersion } = await resolveReleaseTarget(dir, flags);
  let version = flags.releaseVersion ?? localVersion;
  if (!version) {
    // No version at hand: the newest preview candidate is the one to accept.
    const rounds = await fetchReleaseRounds(target);
    if (rounds === null) throw releaseUnavailable();
    const candidate = rounds.find((round) => roundMode(round) === "preview" && roundState(round) === "candidate");
    version = typeof candidate?.version === "string" ? candidate.version : "";
  }
  if (!version) throw new Error("no preview candidate found — pass --release-version <version>");

  const body: RequestParams = { version };
  if (flags.rc !== undefined) body.rc = flags.rc;
  const client = await sdkForProject();
  let response: Json;
  try {
    response = (await client.call("post", `${releasesPath(target)}/accept`, JSON_HEADERS, body)) as Json;
  } catch (err) {
    if (isNotFound(err)) throw releaseUnavailable();
    throw err;
  }
  const round = ((response?.data ?? response) || {}) as Json;
  const label = name || target.id;

  if (cliConfig.output !== "table") {
    parse({ [target.kind]: label, id: target.id, accepted: true, release: releaseSummary(round.version ? round : { ...round, version, rc_number: flags.rc ?? round.rc_number }) });
    return;
  }
  const state = round.state ? ` — round is now ${String(round.state)}` : "";
  success(`Accepted preview ${version}${flags.rc !== undefined ? ` rc ${flags.rc}` : ""} of '${label}'${state}`);
  if (round.state && round.state !== "approved") hint("it goes live once a reviewer has approved it as well");
};

export type ReleaseStatusFlags = ReleaseTargetFlags;

/** The release rounds of an app, theme, Cube or integration, newest first. */
export const releaseStatus = async (dir: string, flags: ReleaseStatusFlags): Promise<void> => {
  const { target, name } = await resolveReleaseTarget(dir, flags);
  const rounds = await fetchReleaseRounds(target);
  if (rounds === null) throw releaseUnavailable();
  const label = name || target.id;

  if (cliConfig.output !== "table") {
    parse({ [target.kind]: label, id: target.id, releases: rounds });
    return;
  }
  log(`Release rounds of '${label}' (${target.id})`);
  drawTable(
    rounds.map((round) => ({
      version: String(round.version ?? ""),
      rc: roundRc(round) ?? "",
      mode: roundMode(round),
      state: roundState(round),
      gates: gateSummary(round.gate_results),
      due: round.decision_due_at ? String(round.decision_due_at) : "",
      rejection: rejectionText(round.rejection),
    })),
  );
};

/** `--rc <n>` parser: a positive whole round number. */
export const parseRound = (value: string): number => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new InvalidArgumentError("Expected a positive whole round number.");
  }
  return parsed;
};

const BUILD_TIMEOUT_HELP = "how long to wait for the platform build, in seconds (the per-request HTTP limit is the global --request-timeout <ms>)";
const RESUME_HELP = "finish an existing deployment instead of uploading a new one: skips packaging + upload, waits for its build, then runs the remaining steps";
const RELEASE_WAIT_HELP = "how long to wait after the build for the release round to be approved or rejected, in seconds";
const PACKAGE_RESUME_HELP = "pick up an existing deployment instead of uploading a new one: waits for its build and its release round";

const siteOptions = (command: Command): Command =>
  command
    .option("--site-id <id>", "deploy to this existing site (skips find-or-create by name)")
    .option("--deployment-id <id>", RESUME_HELP)
    .option("--name <name>", "site name (default: package.json name / directory name)")
    .option("--framework <framework>", "site framework", "nuxt")
    .option("--adapter <adapter>", "framework adapter", "ssr")
    .option("--build-runtime <runtime>", "build runtime", "node-25")
    .option("--install-command <command>", "install command", "npm install")
    .option("--build-command <command>", "build command", "npm run build")
    .option("--output-directory <dir>", "build output directory", ".output")
    .option("--timeout <seconds>", BUILD_TIMEOUT_HELP, parseSeconds, 600);

/** `--from-git` and its ref options; deploy only, since Git builds always run in deploy mode. */
const gitOptions = (command: Command, noun: string): Command =>
  command
    .option("--from-git", `deploy from the ${noun}'s connected repository instead of uploading the directory`)
    .option("--ref <ref>", `with --from-git: the branch, tag or commit to deploy (default: the ${noun}'s production branch)`)
    .addOption(new Option("--ref-type <type>", "with --from-git: what --ref names").choices(["branch", "tag", "commit"]).default("branch"));

/** The wait options of a Cube or integration deploy. */
const packageWaitOptions = (command: Command): Command =>
  command
    .option("--timeout <seconds>", BUILD_TIMEOUT_HELP, parseSeconds, 600)
    .option("--release-wait <seconds>", RELEASE_WAIT_HELP, parseSeconds, DEFAULT_RELEASE_WAIT_SECONDS);

/** `deploy app` and `preview app` share everything but the release mode. */
const appCommand = (releaseMode: ReleaseMode, description: string): Command =>
  new Command("app")
    .description(description)
    .argument("[dir]", "app directory (needs manifest.json)", ".")
    .option("--function-id <id>", "deploy to this existing app (skips find-or-create by name)")
    .option("--deployment-id <id>", RESUME_HELP)
    .option("--runtime <runtime>", "function runtime for a first-time registration", "node-25")
    .option("--specification <spec>", "compute specification for a first-time registration")
    .option("--owner <tenant>", "tenant to install on (default: the active tenant)")
    .option("--no-publish", "skip publishing to the Marketplace")
    .option("--no-install", "skip the marketplace install (routes are written at install time)")
    .option("--timeout <seconds>", BUILD_TIMEOUT_HELP, parseSeconds, 600)
    .option("--release-wait <seconds>", RELEASE_WAIT_HELP, parseSeconds, DEFAULT_RELEASE_WAIT_SECONDS)
    .action(actionRunner((dir: string, flags: DeployAppFlags) => deployApp(dir, { ...flags, releaseMode })));

const themeCommand = (releaseMode: ReleaseMode, description: string): Command =>
  siteOptions(
    new Command("theme")
      .description(description)
      .argument("[dir]", "theme directory (needs theme.json)", "."),
  )
    .option("--owner <tenant>", "tenant to install on (default: the active tenant)")
    .option("--no-publish", "skip the marketplace publish")
    .option("--no-install", "skip the marketplace install")
    .option("--release-wait <seconds>", RELEASE_WAIT_HELP, parseSeconds, DEFAULT_RELEASE_WAIT_SECONDS)
    .action(actionRunner((dir: string, flags: DeployThemeFlags) => deployTheme(dir, { ...flags, releaseMode })));

const cubeCommand = (releaseMode: ReleaseMode, description: string): Command => {
  const command = new Command("cube")
    .description(description)
    .argument("[dir]", "Cube directory (needs cube.json)", ".")
    .option("--cube-id <id>", "deploy to this existing Cube (skips find-or-create by name)")
    .option("--deployment-id <id>", PACKAGE_RESUME_HELP)
    .option("--skip-validate", "do not run scripts/cube.mjs validate before the upload");
  if (releaseMode === "deploy") gitOptions(command, "Cube");
  return packageWaitOptions(command).action(actionRunner((dir: string, flags: DeployCubeFlags) => deployCube(dir, { ...flags, releaseMode })));
};

const integrationCommand = (releaseMode: ReleaseMode, description: string): Command => {
  const command = new Command("integration")
    .description(description)
    .argument("[dir]", "integration package directory (package.json depending on the node SDK)", ".")
    .option("--integration-id <id>", "deploy to this existing integration (skips find-or-create by name)")
    .option("--deployment-id <id>", PACKAGE_RESUME_HELP)
    .option("--name <name>", "integration name (default: manifest.json name, else the package name without its scope)");
  if (releaseMode === "deploy") gitOptions(command, "integration");
  return packageWaitOptions(command).action(
    actionRunner((dir: string, flags: DeployIntegrationFlags) => deployIntegration(dir, { ...flags, releaseMode })),
  );
};

/** The id options of `preview accept` and `release status`. */
const targetOptions = (command: Command, verb: string): Command =>
  command
    .option("--function-id <id>", `the app to ${verb} (skips the lookup by name)`)
    .option("--site-id <id>", `the theme to ${verb} (skips the lookup by name)`)
    .option("--cube-id <id>", `the Cube to ${verb} (skips the lookup by name)`)
    .option("--integration-id <id>", `the integration to ${verb} (skips the lookup by name)`);

const TARGET_DIR_HELP = "app, theme, Cube or integration directory (manifest.json / theme.json / cube.json / package.json)";

export const deploy = new Command("deploy")
  .description("Deploy apps, themes, sites, Cubes and integrations to the revenexx platform")
  .addCommand(appCommand("deploy", "Deploy a platform app: register if new, upload, build, then publish + install once the release is approved"))
  .addCommand(themeCommand("deploy", "Deploy a Blokkli theme: site deploy + automatic registry registration, then publish + install once the release is approved"))
  .addCommand(
    siteOptions(
      new Command("site")
        .description("Deploy any directory as a platform Site (find-or-create by name, upload, build)")
        .argument("[dir]", "site directory", "."),
    ).action(actionRunner(deploySite)),
  )
  .addCommand(cubeCommand("deploy", "Deploy an analytics Cube: validate, create if new, upload, build, then wait for the release to be approved"))
  .addCommand(integrationCommand("deploy", "Deploy an integration package: create if new, upload, build, then wait for the release to be approved"));

export const preview = new Command("preview")
  .description("Release a preview: you check the running candidate and accept it before it goes live")
  .addCommand(appCommand("preview", "Upload and build an app as a preview candidate (reachable on its own host until accepted and approved)"))
  .addCommand(themeCommand("preview", "Upload and build a theme as a preview candidate (live once accepted and approved)"))
  .addCommand(cubeCommand("preview", "Upload and build a Cube as a preview candidate (live once accepted and approved)"))
  .addCommand(integrationCommand("preview", "Upload and build an integration as a preview candidate (live once accepted and approved)"))
  .addCommand(
    targetOptions(
      new Command("accept")
        .description("Accept a preview candidate: your go as the vendor, next to the reviewer's approval")
        .argument("[dir]", TARGET_DIR_HELP, "."),
      "accept",
    )
      .option("--release-version <version>", "version to accept (default: the directory's version, else the newest preview candidate)")
      .option("--rc <n>", "release round to accept (default: the version's current candidate)", parseRound)
      .action(actionRunner(previewAccept)),
  );

export const release = new Command("release")
  .description("Follow the review of your app, theme, Cube and integration releases")
  .addCommand(
    targetOptions(
      new Command("status")
        .description("List the release rounds of an app, theme, Cube or integration: version, round, mode, state, gates, decision date")
        .argument("[dir]", TARGET_DIR_HELP, "."),
      "show",
    ).action(actionRunner(releaseStatus)),
  );
