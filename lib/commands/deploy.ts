import { Command } from "commander";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { create as createTar } from "tar";
import { sdkForProject } from "../sdks.js";
import { readActiveTenant } from "./tenants.js";
import type { RequestParams } from "../types.js";
import { actionRunner, success, log, warn, hint, drawJSON, cliConfig } from "../parser.js";

/**
 * One-command deploys for the artifacts `create app` / `create theme`
 * scaffold, contributed by the 'create' plugin. Thin orchestration
 * over the generated apps/sites services — the same endpoints, sequenced:
 * find-or-create the target, package the directory, upload an activated
 * deployment, poll the platform build, then publish + install where the API
 * supports it.
 */

type Json = Record<string, unknown>;

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

/** Never ship local state: matches the scaffolds' .gitignore set. */
const PACK_EXCLUDES = new Set(["node_modules", ".git", ".nuxt", ".output", ".data", ".env"]);

/** Package a directory into a tar.gz File for the deployment upload. */
async function packDirectory(dir: string): Promise<File> {
  const tempFile = path.join(os.tmpdir(), `revenexx-deploy-${process.pid}-${Date.now()}.tar.gz`);
  await createTar(
    {
      gzip: true,
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

/** Poll a deployment until it is ready; print build logs when it fails. */
async function pollDeployment(deploymentPath: string, timeoutSeconds: number): Promise<Json> {
  const client = await sdkForProject();
  const startedAt = Date.now();
  let lastStatus = "";

  for (;;) {
    const deployment = (await client.call("get", deploymentPath, { "content-type": "application/json" }, {})) as Json;
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
    if ((Date.now() - startedAt) / 1000 > timeoutSeconds) {
      throw new Error(`timed out after ${timeoutSeconds}s waiting for the build (last status: ${status}) — pass --timeout to wait longer`);
    }
    await sleep(5000);
  }
}

/** Exact-name lookup in a list endpoint, tolerant of the collection key. */
async function findByName(listPath: string, name: string): Promise<Json | null> {
  const client = await sdkForProject();
  const response = (await client.call("get", listPath, { "content-type": "application/json" }, { search: name })) as Json;
  return firstArray(response).find((item) => item.name === name) ?? null;
}

const resourceId = (resource: Json): string => String(resource.$id ?? resource.id ?? "");

interface DeployAppFlags {
  functionId?: string;
  runtime: string;
  specification?: string;
  owner?: string;
  publish: boolean;
  install: boolean;
  timeout: string;
}

const deployApp = async (dir: string, flags: DeployAppFlags): Promise<void> => {
  const root = path.resolve(dir);
  const manifest = readJsonIf(path.join(root, "manifest.json"));
  if (!manifest || typeof manifest.name !== "string") {
    throw new Error(`${root} is not an app directory (no manifest.json with a name) — scaffold one with 'revenexx create app'`);
  }
  const name = manifest.name;
  const client = await sdkForProject();

  let functionId = flags.functionId ?? "";
  if (!functionId) {
    const existing = await findByName("/apps", name);
    if (existing) {
      functionId = resourceId(existing);
      log(`Using existing app '${name}' (${functionId})`);
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
      const created = (await client.call("post", "/apps", { "content-type": "application/json" }, payload)) as Json;
      functionId = resourceId(created);
    }
  }
  if (!functionId) throw new Error("could not resolve the app's function id");

  log("Packaging source");
  const code = await packDirectory(root);

  log("Uploading deployment (activate=true)");
  const deployment = (await client.call(
    "post",
    `/apps/${functionId}/deployments`,
    { "content-type": "multipart/form-data" },
    { code, activate: true, entrypoint: "src/main.js", commands: "npm install" },
  )) as Json;
  const deploymentId = resourceId(deployment);

  log("Waiting for the platform build");
  await pollDeployment(`/apps/${functionId}/deployments/${deploymentId}`, parseInt(flags.timeout, 10));

  if (flags.publish) {
    log("Publishing to the Marketplace");
    await client.call("post", `/apps/${functionId}/publish`, { "content-type": "application/json" }, {});
  }
  if (flags.install) {
    const owner = flags.owner ?? readActiveTenant();
    if (!owner) {
      warn("no owner tenant resolved — skipping the marketplace install (pass --owner or 'revenexx tenants use')");
    } else {
      log(`Installing on tenant '${owner}'`);
      await client.call("post", "/apps/marketplace/install", { "content-type": "application/json" }, { owner, name });
    }
  }

  if (cliConfig.json) {
    drawJSON({ app: name, functionId, deploymentId, published: flags.publish, installed: flags.install });
    return;
  }
  success(`App '${name}' deployed (${functionId})`);
  hint("routes are written at install time — re-run the install after every new version");
};

interface DeploySiteFlags {
  siteId?: string;
  name?: string;
  framework: string;
  adapter: string;
  buildRuntime: string;
  installCommand: string;
  buildCommand: string;
  outputDirectory: string;
  timeout: string;
}

/** Find-or-create the Site, upload an activated deployment, poll the build. */
async function deployToSite(root: string, flags: DeploySiteFlags, name: string): Promise<{ siteId: string; deploymentId: string }> {
  const client = await sdkForProject();

  let siteId = flags.siteId ?? "";
  if (!siteId) {
    const existing = await findByName("/sites", name);
    if (existing) {
      siteId = resourceId(existing);
      log(`Using existing site '${name}' (${siteId})`);
    } else {
      log(`Creating site '${name}'`);
      const created = (await client.call("post", "/sites", { "content-type": "application/json" }, {
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

  log("Packaging source");
  const code = await packDirectory(root);

  log("Uploading deployment (activate=true)");
  const deployment = (await client.call(
    "post",
    `/sites/${siteId}/deployments`,
    { "content-type": "multipart/form-data" },
    { code, activate: true },
  )) as Json;
  const deploymentId = resourceId(deployment);

  log("Waiting for the platform build");
  await pollDeployment(`/sites/${siteId}/deployments/${deploymentId}`, parseInt(flags.timeout, 10));

  return { siteId, deploymentId };
}

const deploySite = async (dir: string, flags: DeploySiteFlags): Promise<void> => {
  const root = path.resolve(dir);
  const pkg = readJsonIf(path.join(root, "package.json"));
  const name = flags.name ?? (typeof pkg?.name === "string" ? pkg.name : path.basename(root));

  const result = await deployToSite(root, flags, name);

  if (cliConfig.json) {
    drawJSON({ site: name, ...result });
    return;
  }
  success(`Site '${name}' deployed (${result.siteId})`);
};

interface DeployThemeFlags extends DeploySiteFlags {
  owner?: string;
  publish: boolean;
  install: boolean;
}

const deployTheme = async (dir: string, flags: DeployThemeFlags): Promise<void> => {
  const root = path.resolve(dir);
  const theme = readJsonIf(path.join(root, "theme.json"));
  if (!theme || typeof theme.name !== "string") {
    throw new Error(`${root} is not a theme directory (no theme.json with a name) — scaffold one with 'revenexx create theme'`);
  }
  const site = (theme.site ?? {}) as Json;
  const name = flags.name ?? theme.name;

  // theme.json's site block wins over the generic defaults.
  const siteFlags: DeploySiteFlags = {
    ...flags,
    framework: String(site.framework ?? flags.framework),
    adapter: String(site.adapter ?? flags.adapter),
    installCommand: String(site.installCommand ?? flags.installCommand),
    buildCommand: String(site.buildCommand ?? flags.buildCommand),
    outputDirectory: String(site.outputDirectory ?? flags.outputDirectory),
  };

  const result = await deployToSite(root, siteFlags, name);
  // Theme registration is automatic: the platform's build worker extracts
  // theme.json from the ready deployment and drives the registry itself.

  const client = await sdkForProject();
  let published = false;
  if (flags.publish) {
    try {
      await client.call("post", `/sites/${result.siteId}/publish`, { "content-type": "application/json" }, {});
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
      warn("no owner tenant resolved — skipping the marketplace install (pass --owner or 'revenexx tenants use')");
    } else {
      try {
        await client.call("post", "/apps/marketplace/install", { "content-type": "application/json" }, { owner, name });
        installed = true;
        log(`Installed on tenant '${owner}'`);
      } catch {
        warn("marketplace install failed — install the theme from Cockpit → Experience → Themes");
      }
    }
  }

  if (cliConfig.json) {
    drawJSON({ theme: name, ...result, published, installed });
    return;
  }
  success(`Theme '${name}' deployed (${result.siteId})`);
  hint("bind your domain in Cockpit → Experience → Themes to route real traffic");
};

const siteOptions = (command: Command): Command =>
  command
    .option("--site-id <id>", "deploy to this existing site (skips find-or-create by name)")
    .option("--name <name>", "site name (default: package.json name / directory name)")
    .option("--framework <framework>", "site framework", "nuxt")
    .option("--adapter <adapter>", "framework adapter", "ssr")
    .option("--build-runtime <runtime>", "build runtime", "node-25")
    .option("--install-command <command>", "install command", "npm install")
    .option("--build-command <command>", "build command", "npm run build")
    .option("--output-directory <dir>", "build output directory", ".output")
    .option("--timeout <seconds>", "how long to wait for the platform build", "600");

export const deploy = new Command("deploy")
  .description("Deploy apps, themes and sites to the revenexx platform")
  .addCommand(
    new Command("app")
      .description("Deploy a platform app: register if new, upload, build, publish + install")
      .argument("[dir]", "app directory (needs manifest.json)", ".")
      .option("--function-id <id>", "deploy to this existing app (skips find-or-create by name)")
      .option("--runtime <runtime>", "function runtime for a first-time registration", "node-25")
      .option("--specification <spec>", "compute specification for a first-time registration")
      .option("--owner <tenant>", "tenant to install on (default: the active tenant)")
      .option("--no-publish", "skip publishing to the Marketplace")
      .option("--no-install", "skip the marketplace install (routes are written at install time)")
      .option("--timeout <seconds>", "how long to wait for the platform build", "600")
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
