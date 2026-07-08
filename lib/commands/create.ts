import { Command, Option } from "commander";
import inquirer from "inquirer";
import { actionRunner, success, log, warn, hint, error, drawJSON, cliConfig } from "../parser.js";
import { sdkForProject } from "../sdks.js";
import type { RequestParams } from "../types.js";
import { apps } from "./services/apps.js";
import { scaffoldApp, validateAppName, validateEntityName, type AppScaffoldOptions } from "./create/scaffold-app.js";
import { scaffoldTheme, validateThemeName, type ThemeScaffoldOptions } from "./create/scaffold-theme.js";
import {
  buildCapabilities,
  emitterTargets,
  generateClient,
  mergeCapabilities,
} from "./create/appsdk-core.js";
import * as fs from "fs";
import * as path from "path";

/**
 * Scaffolding for the revenexx platform, contributed by the 'create'
 * plugin: `create app` and `create theme` stamp complete, deployable
 * skeletons; `apps generate` / `apps capabilities` carry the codegen ported
 * from @revenexx/app-sdk-cli.
 */

const DEFAULT_VENDOR = "revenexx";
const APP_SDK_VERSION = "^0.4.2";
const SCHEMAS_BASE = "https://schemas.revenexx.com";

const titleize = (name: string): string =>
  name.replace(/[-_]+/g, " ").replace(/(^|\s)([a-z])/g, (_m, s: string, c: string) => s + c.toUpperCase());

const collect = (value: string, previous: string[]): string[] => [...previous, ...value.split(",")]
  .map((v) => v.trim())
  .filter(Boolean);

interface CreateAppFlags {
  title?: string;
  description?: string;
  vendor: string;
  entity: string[];
  dir: string;
  yes?: boolean;
}

const createApp = async (name: string, flags: CreateAppFlags): Promise<void> => {
  const nameError = validateAppName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  let { title, description } = flags;
  let entities = flags.entity;

  const interactive = !flags.yes && process.stdout.isTTY && !cliConfig.json;
  if (interactive) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "title",
        message: "App title",
        default: title ?? titleize(name),
        when: () => title === undefined,
      },
      {
        type: "input",
        name: "description",
        message: "One-line description (Marketplace listing)",
        default: description ?? "A revenexx platform app.",
        when: () => description === undefined,
      },
      {
        type: "input",
        name: "entities",
        message: "Entities (comma-separated, plural snake_case)",
        default: entities.length > 0 ? entities.join(", ") : "items",
        when: () => entities.length === 0,
        validate: (value: string) => {
          const names = value.split(",").map((v) => v.trim()).filter(Boolean);
          if (names.length === 0) return "at least one entity is required";
          for (const entity of names) {
            const entityError = validateEntityName(entity);
            if (entityError) return entityError;
          }
          return true;
        },
      },
    ]);
    title = title ?? answers.title;
    description = description ?? answers.description;
    if (entities.length === 0 && typeof answers.entities === "string") {
      entities = answers.entities.split(",").map((v: string) => v.trim()).filter(Boolean);
    }
  }

  const options: AppScaffoldOptions = {
    name,
    title: title ?? titleize(name),
    description: description ?? "A revenexx platform app.",
    vendor: flags.vendor,
    entities: entities.length > 0 ? entities : ["items"],
    dir: flags.dir,
    appSdkVersion: APP_SDK_VERSION,
    schemasBase: SCHEMAS_BASE,
  };

  const result = scaffoldApp(options);

  if (cliConfig.json) {
    drawJSON(result);
    return;
  }

  success(`App '${name}' scaffolded at ${result.root}`);
  log("");
  for (const file of result.files) {
    log(`  ${file.path}`);
  }
  for (const warning of result.warnings) {
    warn(warning);
  }
  log("");
  log("Next steps:");
  for (const step of result.nextSteps) {
    hint(`  ${step}`);
  }
};

interface CreateThemeFlags {
  title?: string;
  description?: string;
  vendor: string;
  billing: "free" | "included";
  dir: string;
  yes?: boolean;
}

const createTheme = async (name: string, flags: CreateThemeFlags): Promise<void> => {
  const nameError = validateThemeName(name);
  if (nameError) {
    throw new Error(nameError);
  }

  let { title, description } = flags;

  const interactive = !flags.yes && process.stdout.isTTY && !cliConfig.json;
  if (interactive) {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "title",
        message: "Theme title",
        default: title ?? titleize(name),
        when: () => title === undefined,
      },
      {
        type: "input",
        name: "description",
        message: "One-line description (Marketplace listing)",
        default: description ?? "A revenexx Blokkli storefront theme.",
        when: () => description === undefined,
      },
    ]);
    title = title ?? answers.title;
    description = description ?? answers.description;
  }

  const options: ThemeScaffoldOptions = {
    name,
    title: title ?? titleize(name),
    description: description ?? "A revenexx Blokkli storefront theme.",
    vendor: flags.vendor,
    billingType: flags.billing,
    dir: flags.dir,
    schemasBase: SCHEMAS_BASE,
  };

  const result = scaffoldTheme(options);

  if (cliConfig.json) {
    drawJSON(result);
    return;
  }

  success(`Theme '${name}' scaffolded at ${result.root}`);
  log("");
  for (const file of result.files) {
    log(`  ${file.path}`);
  }
  log("");
  log("Next steps:");
  for (const step of result.nextSteps) {
    hint(`  ${step}`);
  }
};

export const create = new Command("create")
  .description("Scaffold revenexx platform apps and Blokkli themes")
  .addCommand(
    new Command("app")
      .description("Scaffold a platform app: manifest, schema, function, tests — npm-test-green out of the box")
      .argument("<name>", "app name (lowercase, digits, dashes — becomes the repo and route namespace)")
      .option("--title <title>", "display title (default: derived from the name)")
      .option("--description <text>", "one-line description for the Marketplace listing")
      .option("--vendor <vendor>", "vendor slug", DEFAULT_VENDOR)
      .option("--entity <name>", "entity to scaffold (repeatable or comma-separated, plural snake_case)", collect, [] as string[])
      .option("--dir <path>", "parent directory to scaffold into", ".")
      .option("-y, --yes", "accept all defaults, never prompt")
      .action(actionRunner(createApp)),
  )
  .addCommand(
    new Command("theme")
      .description("Scaffold a Blokkli theme: manifest pair + Nuxt SSR storefront, deployable via deploy.sh")
      .argument("<name>", "theme name (lowercase, digits, dashes)")
      .option("--title <title>", "display title (default: derived from the name)")
      .option("--description <text>", "one-line description for the Marketplace listing")
      .option("--vendor <vendor>", "vendor slug", DEFAULT_VENDOR)
      .addOption(new Option("--billing <type>", "billing type").choices(["free", "included"]).default("free"))
      .option("--dir <path>", "parent directory to scaffold into", ".")
      .option("-y, --yes", "accept all defaults, never prompt")
      .action(actionRunner(createTheme)),
  )
  .addCommand(
    new Command("site")
      .description("Create a Site on the platform (the deployment target for themes and storefronts)")
      .argument("<name>", "site name")
      .option("--site-id <id>", "explicit site id", "unique()")
      .option("--framework <framework>", "site framework", "nuxt")
      .option("--adapter <adapter>", "framework adapter", "ssr")
      .option("--build-runtime <runtime>", "build runtime", "node-25")
      .option("--install-command <command>", "install command", "npm install")
      .option("--build-command <command>", "build command", "npm run build")
      .option("--output-directory <dir>", "build output directory", ".output")
      .action(
        actionRunner(async (name: string, flags: Record<string, string>) => {
          const client = await sdkForProject();
          const payload: RequestParams = {
            siteId: flags.siteId,
            name,
            framework: flags.framework,
            adapter: flags.adapter,
            buildRuntime: flags.buildRuntime,
            installCommand: flags.installCommand,
            buildCommand: flags.buildCommand,
            outputDirectory: flags.outputDirectory,
          };
          const site = (await client.call("post", "/sites", { "content-type": "application/json" }, payload)) as Record<string, unknown>;
          if (cliConfig.json) {
            drawJSON(site);
            return;
          }
          success(`Site '${name}' created (${site.$id ?? site.id})`);
          hint(`deploy into it with: revenexx deploy site <dir> --site-id ${site.$id ?? site.id}`);
        }),
      ),
  );

// ---------------------------------------------------------------------------
// Codegen ported from @revenexx/app-sdk-cli, attached to the `apps` service
// group: `revenexx apps generate` + `revenexx apps capabilities`.
// ---------------------------------------------------------------------------

interface AppsGenerateFlags {
  schema: string;
  manifest: string;
  out: string;
  target: string;
  runtime?: string;
  namespace?: string;
  vendor?: string;
  app?: string;
}

const appsGenerate = new Command("generate")
  .description(`Generate the typed data client from schema.json + manifest.json (targets: ${emitterTargets().join(", ")})`)
  .option("--schema <path>", "path to schema.json", "./schema.json")
  .option("--manifest <path>", "path to manifest.json", "./manifest.json")
  .option("--out <dir>", "output directory", "./src")
  .addOption(new Option("--target <target>", "language target").choices(emitterTargets()).default("js"))
  .option("--runtime <module>", "JS runtime import specifier", "@revenexx/app-sdk")
  .option("--namespace <ns>", "PHP namespace (default: Revenexx\\<App>)")
  .option("--vendor <slug>", "override manifest.vendor")
  .option("--app <slug>", "override manifest.name")
  .action(
    actionRunner(async (flags: AppsGenerateFlags) => {
      const result = generateClient({
        schemaPath: flags.schema,
        manifestPath: flags.manifest,
        outDir: flags.out,
        target: flags.target,
        runtimeModule: flags.runtime,
        phpNamespace: flags.namespace,
        vendor: flags.vendor,
        app: flags.app,
      });
      if (cliConfig.json) {
        drawJSON(result);
        return;
      }
      success(`Generated ${result.target} client for [${result.entities.join(", ")}]`);
      for (const file of result.files) {
        log(`  ${file}`);
      }
    }),
  );

interface AppsCapabilitiesFlags {
  schema: string;
  manifest: string;
  write?: boolean;
  capVersion: string;
  prefix: boolean;
}

const appsCapabilities = new Command("capabilities")
  .description("Generate manifest.capabilities.json (CRUD capability stubs) from schema.json")
  .option("--schema <path>", "path to schema.json", "./schema.json")
  .option("--manifest <path>", "path to manifest.json", "./manifest.json")
  .option("--write", "write manifest.capabilities.json and strip capabilities from manifest.json (default: dry-run print)")
  .option("--cap-version <version>", "capability contract version", "1.0.0")
  .option("--no-prefix", "plain entity capabilities/routes instead of the {app}.{entity}.{op} / /{app}/{entity} app contract")
  .action(
    actionRunner(async (flags: AppsCapabilitiesFlags) => {
      const schema = JSON.parse(fs.readFileSync(flags.schema, "utf8"));
      const manifest = JSON.parse(fs.readFileSync(flags.manifest, "utf8"));

      const generated = buildCapabilities({
        schema,
        permissions: manifest.permissions ?? [],
        version: flags.capVersion,
        appPrefix: flags.prefix ? manifest.name : undefined,
      });

      if (!flags.write) {
        drawJSON(generated);
        hint("dry run — pass --write to update manifest.capabilities.json");
        return;
      }

      const capabilitiesPath = path.join(path.dirname(flags.manifest), "manifest.capabilities.json");
      let existing: Array<Record<string, unknown>> = [];
      try {
        existing = JSON.parse(fs.readFileSync(capabilitiesPath, "utf8"));
      } catch {
        // first run — no register yet
      }
      const merged = mergeCapabilities(existing, generated);
      fs.writeFileSync(capabilitiesPath, JSON.stringify(merged, null, 2) + "\n");

      // manifest.json carries everything except the capability register.
      delete manifest.capabilities;
      fs.writeFileSync(flags.manifest, JSON.stringify(manifest, null, 2) + "\n");

      success(`Wrote ${merged.length} capabilities to ${capabilitiesPath}`);
    }),
  );

apps.addCommand(appsGenerate);
apps.addCommand(appsCapabilities);
