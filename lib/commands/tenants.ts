import { Command } from "commander";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  actionRunner,
  commandDescriptions,
  success,
  log,
  warn,
  hint,
  error,
  drawTable,
  cliConfig,
} from "../parser.js";
import { globalConfig } from "../config.js";
import { loadProjectConfig } from "../project-config.js";
import { DEFAULT_ENDPOINT, EXECUTABLE_NAME } from "../constants.js";
import {
  validateApiKey,
  type ApiKeyValidationResult,
} from "./generic.js";

export const defaultTenantFile = (): string =>
  path.join(os.homedir(), ".revenexx", "tenant");

export const readActiveTenant = (file: string = defaultTenantFile()): string => {
  // The file is written by an explicit `tenants use` and wins over the
  // ambient REVENEXX_TENANT env var.
  try {
    const fromDisk = fs.readFileSync(file, "utf-8").trim();
    if (fromDisk) return fromDisk;
  } catch {
    // No tenant file — fall through to the env var.
  }
  return process.env.REVENEXX_TENANT ?? "";
};

export const writeActiveTenant = (
  slug: string,
  file: string = defaultTenantFile(),
): void => {
  // Shares `~/.revenexx` with the credential store (prefs.json), so keep the
  // directory owner-only; reassert on every write to repair drift.
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  try {
    fs.chmodSync(dir, 0o700);
  } catch {
    // Best-effort: non-POSIX filesystems may not support chmod.
  }
  fs.writeFileSync(file, slug, { encoding: "utf-8", mode: 0o600 });
  try {
    fs.chmodSync(file, 0o600);
  } catch {
    // Best-effort: non-POSIX filesystems may not support chmod.
  }
};

export interface KnownTenant {
  slug: string;
  sources: string[];
  active: boolean;
}

export interface TenantSources {
  env?: string;
  flag?: string;
  projectFile?: string;
  tenantFile?: string;
  /** Session emails from the global config; `apikey:<tenant>` entries count. */
  sessionEmails?: string[];
  active?: string;
}

/**
 * Pure aggregation of every place the CLI can learn a tenant slug from.
 * Extracted so it can be unit-tested without touching the filesystem.
 */
export const collectKnownTenants = (sources: TenantSources): KnownTenant[] => {
  const found = new Map<string, Set<string>>();
  const add = (slug: string | undefined, source: string): void => {
    const trimmed = slug?.trim();
    if (!trimmed) return;
    const entry = found.get(trimmed) ?? new Set<string>();
    entry.add(source);
    found.set(trimmed, entry);
  };

  add(sources.flag, "--tenant flag");
  add(sources.env, "REVENEXX_TENANT");
  add(sources.projectFile, ".revenexx.yaml");
  add(sources.tenantFile, "~/.revenexx/tenant");
  for (const email of sources.sessionEmails ?? []) {
    if (email.startsWith("apikey:")) {
      add(email.slice("apikey:".length), "login session");
    }
  }

  const active = sources.active?.trim() ?? "";
  return Array.from(found.entries()).map(([slug, srcs]) => ({
    slug,
    sources: Array.from(srcs),
    active: slug === active,
  }));
};

const resolveProbeContext = (): { endpoint: string; key: string } => {
  const projectFile = loadProjectConfig();
  const endpoint =
    cliConfig.endpoint ||
    process.env.REVENEXX_API_URL ||
    projectFile.apiUrl ||
    globalConfig.getEndpoint() ||
    DEFAULT_ENDPOINT;
  const key =
    cliConfig.token ||
    process.env.REVENEXX_API_KEY ||
    projectFile.token ||
    globalConfig.getKey() ||
    "";
  return { endpoint, key };
};

const probeTenant = async (
  slug: string,
): Promise<ApiKeyValidationResult | null> => {
  const { endpoint, key } = resolveProbeContext();
  if (!key) return null;
  return await validateApiKey(key, endpoint, slug);
};

export const tenants = new Command("tenants")
  .description(commandDescriptions["tenants"] ?? "Manage Revenexx tenants")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

tenants
  .command("list")
  .description(
    "List tenants known to this machine and whether the current API key can access them",
  )
  .action(
    actionRunner(async () => {
      const projectFile = loadProjectConfig();
      const known = collectKnownTenants({
        env: process.env.REVENEXX_TENANT,
        flag: cliConfig.tenant,
        projectFile: projectFile.tenant,
        tenantFile: (() => {
          try {
            return fs.readFileSync(defaultTenantFile(), "utf-8").trim();
          } catch {
            return undefined;
          }
        })(),
        sessionEmails: globalConfig
          .getSessions()
          .map((session) => session.email ?? ""),
        active: readActiveTenant(),
      });

      if (known.length === 0) {
        log(
          `No tenants configured yet. Run \`${EXECUTABLE_NAME} tenants use <slug>\` or \`${EXECUTABLE_NAME} login --tenant <slug>\`.`,
        );
        return;
      }

      const { key } = resolveProbeContext();
      const rows = [];
      for (const tenant of known) {
        let access = "(no key to verify)";
        if (key) {
          const result = await probeTenant(tenant.slug);
          access = result?.ok ? "ok" : (result?.reason ?? "unknown");
        }
        rows.push({
          Tenant: tenant.slug,
          Active: tenant.active ? "yes" : "",
          Sources: tenant.sources.join(", "),
          Access: access,
        });
      }

      if (cliConfig.json) {
        console.log(rows);
        return;
      }
      drawTable(rows);
      if (!key) {
        hint(
          `Set an API key (\`${EXECUTABLE_NAME} login\` or REVENEXX_API_KEY) to verify tenant access.`,
        );
      }
    }),
  );

tenants
  .command("use <slug>")
  .description(
    "Switch the active tenant context (validated against the gateway when an API key is available)",
  )
  .action(
    actionRunner(async (slug: string) => {
      if (!slug) {
        error("Tenant slug is required");
        return;
      }

      const result = await probeTenant(slug);
      if (result === null) {
        warn(
          "No API key available — switching tenant without gateway validation.",
        );
      } else if (!result.ok) {
        if (result.kind === "invalid-tenant" && !cliConfig.force) {
          error(
            `Cannot switch: ${result.reason}. Pass --force to set it anyway.`,
          );
          return;
        }
        warn(`Could not verify tenant '${slug}': ${result.reason}.`);
      }

      writeActiveTenant(slug);
      success(`Active tenant set to '${slug}'`);
    }),
  );

tenants
  .command("current")
  .description("Print the active tenant slug")
  .option("--check", "Verify the active tenant against the gateway")
  .action(
    actionRunner(async ({ check }: { check?: boolean }) => {
      const slug = readActiveTenant();
      if (!slug) {
        log(`No active tenant set. Run \`${EXECUTABLE_NAME} tenants use <slug>\`.`);
        return;
      }
      log(slug);

      if (check) {
        const result = await probeTenant(slug);
        if (result === null) {
          warn("No API key available — cannot verify tenant access.");
        } else if (result.ok) {
          success(`Tenant '${slug}' is accessible with the current API key`);
        } else {
          error(`Tenant check failed: ${result.reason}`);
        }
      }
    }),
  );
