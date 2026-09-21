import { Command, InvalidArgumentError } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { create as createTar } from "tar";
import { sdkForProject } from "../sdks.js";
import { readActiveTenant } from "./tenants.js";
import { EXECUTABLE_NAME } from "../constants.js";
import type { RequestParams } from "../types.js";
import { actionRunner, success, log, warn, hint, parse, cliConfig } from "../parser.js";

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

export interface DeployAppFlags {
  functionId?: string;
  deploymentId?: string;
  runtime: string;
  specification?: string;
  owner?: string;
  publish: boolean;
  install: boolean;
  timeout: number;
}

/** The exact invocation that finishes a deployment from the build wait on. */
const appResumeCommand = (functionId: string, deploymentId: string, flags: Pick<DeployAppFlags, "owner" | "publish" | "install">): string => {
  const parts = [`${EXECUTABLE_NAME} deploy app --function-id ${functionId} --deployment-id ${deploymentId}`];
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

    log("Uploading deployment (activate=true)");
    const deployment = (await client.call(
      "post",
      `/apps/${functionId}/deployments`,
      { "content-type": "multipart/form-data" },
      { code, activate: true, entrypoint: "src/main.js", commands: "npm install" },
    )) as Json;
    deploymentId = resourceId(deployment);
    if (!deploymentId) throw new Error("the upload returned no deployment id");
  }

  const pending = flags.publish && flags.install ? "publish + install" : flags.publish ? "publish" : flags.install ? "install" : "nothing else";
  await waitForBuild(`/apps/${functionId}/deployments/${deploymentId}`, flags.timeout, pending, appResumeCommand(functionId, deploymentId, flags));

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
    const owner = flags.owner ?? readActiveTenant();
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
    parse({ app: name, functionId, deploymentId, resumed: resuming, published, installed });
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

    log("Uploading deployment (activate=true)");
    const deployment = (await client.call(
      "post",
      `/sites/${siteId}/deployments`,
      { "content-type": "multipart/form-data" },
      { code, activate: true },
    )) as Json;
    deploymentId = resourceId(deployment);
    if (!deploymentId) throw new Error("the upload returned no deployment id");
  }

  const resume = `${EXECUTABLE_NAME} deploy ${subcommand} --site-id ${siteId} --deployment-id ${deploymentId}`;
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

  // theme.json's site block wins over the generic defaults.
  const siteFlags: DeploySiteFlags = {
    ...flags,
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
    const owner = flags.owner ?? readActiveTenant();
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
    parse({ theme: name, ...result, published, installed });
    return;
  }
  success(`Theme '${name}' deployed (${result.siteId})`);
  hint("bind your domain in Cockpit → Experience → Themes to route real traffic");
};

const BUILD_TIMEOUT_HELP = "how long to wait for the platform build, in seconds (the per-request HTTP limit is the global --request-timeout <ms>)";
const RESUME_HELP = "finish an existing deployment instead of uploading a new one: skips packaging + upload, waits for its build, then runs the remaining steps";

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

export const deploy = new Command("deploy")
  .description("Deploy apps, themes and sites to the revenexx platform")
  .addCommand(
    new Command("app")
      .description("Deploy a platform app: register if new, upload, build, publish + install")
      .argument("[dir]", "app directory (needs manifest.json)", ".")
      .option("--function-id <id>", "deploy to this existing app (skips find-or-create by name)")
      .option("--deployment-id <id>", RESUME_HELP)
      .option("--runtime <runtime>", "function runtime for a first-time registration", "node-25")
      .option("--specification <spec>", "compute specification for a first-time registration")
      .option("--owner <tenant>", "tenant to install on (default: the active tenant)")
      .option("--no-publish", "skip publishing to the Marketplace")
      .option("--no-install", "skip the marketplace install (routes are written at install time)")
      .option("--timeout <seconds>", BUILD_TIMEOUT_HELP, parseSeconds, 600)
      .action(actionRunner(deployApp)),
  )
  .addCommand(
    siteOptions(
      new Command("theme")
        .description("Deploy a Blokkli theme: site deploy + automatic registry registration, then publish + install")
        .argument("[dir]", "theme directory (needs theme.json)", "."),
    )
      .option("--owner <tenant>", "tenant to install on (default: the active tenant)")
      .option("--no-publish", "skip the marketplace publish")
      .option("--no-install", "skip the marketplace install")
      .action(actionRunner(deployTheme)),
  )
  .addCommand(
    siteOptions(
      new Command("site")
        .description("Deploy any directory as a platform Site (find-or-create by name, upload, build)")
        .argument("[dir]", "site directory", "."),
    ).action(actionRunner(deploySite)),
  );
