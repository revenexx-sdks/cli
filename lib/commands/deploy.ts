import { Command, InvalidArgumentError } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
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
export async function packDirectory(dir: string): Promise<File> {
  const tempFile = path.join(os.tmpdir(), `revenexx-deploy-${process.pid}-${Date.now()}.tar.gz`);
  await createTar(
    {
      gzip: true,
      portable: true,
      file: tempFile,
      cwd: dir,
      filter: (entry) => {
        const top = entry.replace(/^\.\//, "").split("/")[0];
        return !PACK_EXCLUDES.has(top) && !entry.endsWith(".tar.gz");
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
 * Poll a deployment until it is ready; print build logs when it fails.
 * `timeoutSeconds` is compared against the wall clock after every read, so
 * `0` gives up right after the first status (used by the tests).
 */
export async function pollDeployment(deploymentPath: string, timeoutSeconds: number): Promise<Json> {
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
    if (status === "ready") return deployment;
    if (status === "failed") {
      const buildLogs = deployment.buildLogs ?? deployment.logs ?? "";
      if (buildLogs) log(String(buildLogs));
      throw new Error("platform build failed — see the build logs above");
    }
    if (status === "canceled") {
      throw new Error("platform build was canceled — upload a new deployment to try again");
    }
    if ((Date.now() - startedAt) / 1000 >= timeoutSeconds) {
      throw new BuildTimeoutError(timeoutSeconds, status);
    }
    await sleep(POLL_INTERVAL_MS);
  }
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

/** What the release endpoints are addressed by: an app (function) or a theme (site). */
export interface ReleaseTarget {
  kind: "app" | "theme";
  id: string;
}

const releasesPath = (target: ReleaseTarget): string =>
  target.kind === "app" ? `/apps/${target.id}/releases` : `/sites/${target.id}/releases`;

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
 * What the release check means for publish + install. Approved (or no
 * release endpoint on this gateway) → go on. Rejected → fail with the
 * reason. Anything else → stop here: the build is uploaded but not live
 * until a reviewer approves it, and publishing an unapproved version is
 * refused by the registry anyway.
 */
function releaseGate(check: ReleaseCheck, label: string, target: ReleaseTarget): "proceed" | "hold" {
  if (!check.available) return "proceed";
  const round = check.round;
  if (!round) {
    warn(`no release round is recorded for this ${label} yet — publish and install did NOT run`);
    hint(`check later with '${EXECUTABLE_NAME} release status${target.kind === "app" ? " --function-id " : " --site-id "}${target.id}'`);
    return "hold";
  }
  const state = roundState(round);
  if (state === "approved") return "proceed";
  if (state === "rejected") {
    const reason = rejectionText(round.rejection);
    throw new Error(`release ${round.version ?? ""} rc ${roundRc(round) ?? "?"} was rejected${reason ? `: ${reason}` : ""} — publish and install did NOT run`);
  }
  warn(`release ${round.version ?? ""} rc ${roundRc(round) ?? "?"} is ${state}: the build is uploaded but not live until it is approved — publish and install did NOT run`);
  if (round.decision_due_at) hint(`a reviewer decision is due by ${String(round.decision_due_at)}`);
  if (roundMode(round) === "preview") {
    hint(`it is a preview: once you have checked the candidate, give your go with '${EXECUTABLE_NAME} preview accept'`);
  }
  hint(`follow the review with '${EXECUTABLE_NAME} release status'`);
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
 * Resolve the app or theme a release command talks about: explicit ids win,
 * otherwise the directory decides (manifest.json → app, theme.json → theme)
 * and the target is looked up by name.
 */
export async function resolveReleaseTarget(
  dir: string,
  flags: { functionId?: string; siteId?: string },
): Promise<{ target: ReleaseTarget; name: string; version: string }> {
  const root = path.resolve(dir);
  const manifest = readJsonIf(path.join(root, "manifest.json"));
  const theme = readJsonIf(path.join(root, "theme.json"));
  const stringOf = (doc: Json | null, key: string): string => (typeof doc?.[key] === "string" ? (doc[key] as string) : "");

  if (flags.functionId) return { target: { kind: "app", id: flags.functionId }, name: stringOf(manifest, "name"), version: stringOf(manifest, "version") };
  if (flags.siteId) return { target: { kind: "theme", id: flags.siteId }, name: stringOf(theme, "name"), version: stringOf(theme, "version") };

  const kind: ReleaseTarget["kind"] | null = stringOf(manifest, "name") ? "app" : stringOf(theme, "name") ? "theme" : null;
  if (!kind) {
    throw new Error(`${root} is neither an app (manifest.json) nor a theme (theme.json) directory — run from one, or pass --function-id / --site-id`);
  }
  const doc = kind === "app" ? manifest : theme;
  const name = stringOf(doc, "name");
  const found = await findByName(kind === "app" ? "/apps" : "/sites", name);
  if (!found) throw new Error(`no ${kind} named '${name}' is registered — deploy it first, or pass ${kind === "app" ? "--function-id" : "--site-id"}`);
  return { target: { kind, id: resourceId(found) }, name, version: stringOf(doc, "version") };
}

const releaseUnavailable = (): Error =>
  new Error("this gateway does not offer release rounds yet — update the platform, or follow the review in Cockpit");

export interface PreviewAcceptFlags {
  functionId?: string;
  siteId?: string;
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

export interface ReleaseStatusFlags {
  functionId?: string;
  siteId?: string;
}

/** The release rounds of an app or theme, newest first. */
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

export const deploy = new Command("deploy")
  .description("Deploy apps, themes and sites to the revenexx platform")
  .addCommand(appCommand("deploy", "Deploy a platform app: register if new, upload, build, then publish + install once the release is approved"))
  .addCommand(themeCommand("deploy", "Deploy a Blokkli theme: site deploy + automatic registry registration, then publish + install once the release is approved"))
  .addCommand(
    siteOptions(
      new Command("site")
        .description("Deploy any directory as a platform Site (find-or-create by name, upload, build)")
        .argument("[dir]", "site directory", "."),
    ).action(actionRunner(deploySite)),
  );

export const preview = new Command("preview")
  .description("Release a preview: you check the running candidate and accept it before it goes live")
  .addCommand(appCommand("preview", "Upload and build an app as a preview candidate (reachable on its own host until accepted and approved)"))
  .addCommand(themeCommand("preview", "Upload and build a theme as a preview candidate (live once accepted and approved)"))
  .addCommand(
    new Command("accept")
      .description("Accept a preview candidate: your go as the vendor, next to the reviewer's approval")
      .argument("[dir]", "app or theme directory (manifest.json / theme.json)", ".")
      .option("--function-id <id>", "the app to accept (skips the lookup by name)")
      .option("--site-id <id>", "the theme to accept (skips the lookup by name)")
      .option("--release-version <version>", "version to accept (default: manifest/theme version, else the newest preview candidate)")
      .option("--rc <n>", "release round to accept (default: the version's current candidate)", parseRound)
      .action(actionRunner(previewAccept)),
  );

export const release = new Command("release")
  .description("Follow the review of your app and theme releases")
  .addCommand(
    new Command("status")
      .description("List the release rounds of an app or theme: version, round, mode, state, gates, decision date")
      .argument("[dir]", "app or theme directory (manifest.json / theme.json)", ".")
      .option("--function-id <id>", "the app to show (skips the lookup by name)")
      .option("--site-id <id>", "the theme to show (skips the lookup by name)")
      .action(actionRunner(releaseStatus)),
  );
