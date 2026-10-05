import { Command } from "commander";
import inquirer from "inquirer";
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
import { decodeJwtClaims, tenantsFromClaims } from "../oauth.js";
import { resolveSsoJwt } from "../sdks.js";
import { isInteractive, registerPositionalChoices } from "../interactive.js";
import {
  validateApiKey,
  validateSsoJwt,
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

/** The source label for tenants read off the SSO token's membership claims. */
export const ACCOUNT_SOURCE = "your account (SSO)";

export interface TenantSources {
  env?: string;
  flag?: string;
  projectFile?: string;
  tenantFile?: string;
  /**
   * Tenants the signed-in account is a member of, from the SSO token's
   * `tenant_ids` claim (see `tenantsFromClaims`). This is the one source that
   * does not require the user to already know the slug.
   */
  accountTenants?: string[];
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

  // The account's own memberships first: that is the list a fresh login is
  // looking for, so it should head the table.
  for (const slug of sources.accountTenants ?? []) {
    add(slug, ACCOUNT_SOURCE);
  }
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

/**
 * The tenants the signed-in SSO account is a member of, read off the stored
 * token's claims. Works offline and even on an expired token — the claims are
 * still decodable, and the gateway would enforce exactly this list.
 */
export const discoverAccountTenants = (): string[] =>
  tenantsFromClaims(decodeJwtClaims(globalConfig.getJWT()));

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

/**
 * Whatever the CLI can present to the gateway to check a slug: an API key
 * (flag/env/yaml/config — the same precedence every command uses), else the
 * browser-session JWT, refreshed if it has expired. `expired` means an SSO
 * session exists but could not be refreshed; `none` means nobody is signed in.
 */
export type ProbeCredential =
  | { kind: "apikey"; key: string }
  | { kind: "sso"; jwt: string }
  | { kind: "expired"; reason: string }
  | { kind: "none" };

const resolveProbeCredential = async (): Promise<ProbeCredential> => {
  const { key } = resolveProbeContext();
  if (key) return { kind: "apikey", key };
  if (!globalConfig.getJWT()) return { kind: "none" };
  try {
    const jwt = await resolveSsoJwt();
    return jwt ? { kind: "sso", jwt } : { kind: "none" };
  } catch (err) {
    return { kind: "expired", reason: (err as Error).message };
  }
};

const probeTenant = async (
  slug: string,
  credential: ProbeCredential,
): Promise<ApiKeyValidationResult | null> => {
  const { endpoint } = resolveProbeContext();
  switch (credential.kind) {
    case "apikey":
      return await validateApiKey(credential.key, endpoint, slug);
    case "sso":
      return await validateSsoJwt(credential.jwt, endpoint, slug);
    default:
      return null;
  }
};

/** Why a slug could not be validated, for the human-readable warnings. */
const noCredentialNote = (credential: ProbeCredential): string =>
  credential.kind === "expired"
    ? credential.reason
    : `Not signed in — run \`${EXECUTABLE_NAME} login\` first to validate tenant access.`;

/**
 * The slugs `tenants use` can offer: the account's own memberships when the
 * SSO token carries any (the gateway enforces exactly that list), otherwise
 * every slug this machine knows about.
 */
export const selectableTenants = (
  accountTenants: string[],
  known: KnownTenant[],
): string[] => {
  const fromAccount = accountTenants.map((t) => t.trim()).filter(Boolean);
  return fromAccount.length > 0
    ? Array.from(new Set(fromAccount))
    : known.map((t) => t.slug);
};

/** Picker entries for the slugs, with the active one marked and preselected. */
export const tenantChoices = (
  slugs: string[],
  active: string,
): Array<{ name: string; value: string }> =>
  slugs.map((slug) => ({
    name: slug === active ? `${slug} (active)` : slug,
    value: slug,
  }));

/**
 * `tenants use` writes ~/.revenexx/tenant, which outranks REVENEXX_TENANT and
 * `tenant:` in .revenexx.yaml. When either names a different tenant the switch
 * silently disagrees with it, so say so (DX-460).
 */
export const tenantOverrideNotes = (
  slug: string,
  ambient: { env?: string; projectFile?: string },
): string[] => {
  const notes: string[] = [];
  const env = ambient.env?.trim();
  if (env && env !== slug) {
    notes.push(
      `REVENEXX_TENANT is '${env}' but the tenant you just set ('${slug}') takes precedence over it.`,
    );
  }
  const projectFile = ambient.projectFile?.trim();
  if (projectFile && projectFile !== slug) {
    notes.push(
      `.revenexx.yaml sets tenant '${projectFile}' but the tenant you just set ('${slug}') takes precedence over it.`,
    );
  }
  return notes;
};

export const tenants = new Command("tenants")
  .description(commandDescriptions["tenants"] ?? "Manage Revenexx tenants")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

tenants
  .command("list")
  .description(
    "List the tenants your account can access, plus any slugs configured on this machine, and whether the current credential reaches each",
  )
  .action(
    actionRunner(async () => {
      const projectFile = loadProjectConfig();
      const accountTenants = discoverAccountTenants();
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
        accountTenants,
        sessionEmails: globalConfig
          .getSessions()
          .map((session) => session.email ?? ""),
        active: readActiveTenant(),
      });

      if (known.length === 0) {
        if (globalConfig.getJWT()) {
          // Signed in via SSO, but the token grants no tenant. Nothing the CLI
          // can discover — the account itself has no membership yet.
          log(
            `Your account is not a member of any tenant yet. Ask a tenant admin for access, then run \`${EXECUTABLE_NAME} login\` again to refresh your session.`,
          );
        } else {
          log(
            `Not signed in. Run \`${EXECUTABLE_NAME} login\` and then \`${EXECUTABLE_NAME} tenants list\` to see the tenants your account can access, or \`${EXECUTABLE_NAME} login --token <key> --tenant <slug>\` for an API key.`,
          );
        }
        return;
      }

      const credential = await resolveProbeCredential();
      const rows = [];
      for (const tenant of known) {
        let access: string;
        switch (credential.kind) {
          case "apikey":
          case "sso": {
            const result = await probeTenant(tenant.slug, credential);
            access = result?.ok ? "ok" : (result?.reason ?? "unknown");
            break;
          }
          case "expired":
            access = "(session expired)";
            break;
          default:
            access = "(not signed in)";
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
      if (credential.kind === "none") {
        hint(
          `Sign in (\`${EXECUTABLE_NAME} login\`) or set REVENEXX_API_KEY to verify tenant access.`,
        );
      } else if (credential.kind === "expired") {
        hint(credential.reason);
      }
      if (!readActiveTenant()) {
        hint(
          `Run \`${EXECUTABLE_NAME} tenants use <slug>\` to scope commands to one of these tenants.`,
        );
      }
    }),
  );

/**
 * The result of `use` / `current` as data. Status lines (`log`, `success`) go
 * to stderr in every non-table output mode and vanish under --quiet, so the
 * full-screen TUI (which forces JSON and reads stdout) and `$(… current -q)`
 * would otherwise get nothing back (DX-460).
 */
const emitActiveTenant = (
  slug: string,
  extra: Record<string, string> = {},
): boolean => {
  if (cliConfig.output !== "table") {
    console.log([{ Tenant: slug, Active: true, ...extra }]);
    return true;
  }
  if (cliConfig.quiet) {
    console.log(slug);
    return true;
  }
  return false;
};

/**
 * Let the user choose among the tenants they can reach. On a terminal that is
 * a picker; everywhere else (pipes, CI, --json) it is the plain list and no
 * choice is made, so automation never blocks on a prompt.
 */
const listSelectableTenants = (): string[] => {
  const accountTenants = discoverAccountTenants();
  const known = collectKnownTenants({
    env: process.env.REVENEXX_TENANT,
    flag: cliConfig.tenant,
    projectFile: loadProjectConfig().tenant,
    accountTenants,
    sessionEmails: globalConfig
      .getSessions()
      .map((session) => session.email ?? ""),
    active: readActiveTenant(),
  });
  return selectableTenants(accountTenants, known);
};

const chooseTenant = async (): Promise<string | undefined> => {
  const slugs = listSelectableTenants();
  if (slugs.length === 0) {
    error(
      `No tenants found. Run \`${EXECUTABLE_NAME} login\` to sign in, or pass a slug: \`${EXECUTABLE_NAME} tenants use <slug>\`.`,
    );
    process.exitCode = 1;
    return undefined;
  }
  const active = readActiveTenant();
  if (isInteractive() && !cliConfig.json) {
    const answer = await inquirer.prompt([
      {
        type: "list",
        name: "slug",
        message: "Switch to which tenant?",
        choices: tenantChoices(slugs, active),
        default: slugs.indexOf(active) >= 0 ? slugs.indexOf(active) : 0,
      },
    ]);
    return answer.slug as string;
  }
  if (cliConfig.json) {
    console.log(slugs.map((slug) => ({ Tenant: slug, Active: slug === active })));
  } else {
    drawTable(
      slugs.map((slug) => ({ Tenant: slug, Active: slug === active ? "yes" : "" })),
    );
    hint(`Run \`${EXECUTABLE_NAME} tenants use <slug>\` with one of these.`);
  }
  process.exitCode = 1;
  return undefined;
};

/** Validate `slug` against the gateway and persist it. False when refused. */
const switchTenant = async (slug: string): Promise<boolean> => {
  const credential = await resolveProbeCredential();
  const result = await probeTenant(slug, credential);
  if (result === null) {
    warn(
      `${noCredentialNote(credential)} Switching tenant without gateway validation.`,
    );
  } else if (!result.ok) {
    if (result.kind === "invalid-tenant" && !cliConfig.force) {
      error(`Cannot switch: ${result.reason}. Pass --force to set it anyway.`);
      return false;
    }
    warn(`Could not verify tenant '${slug}': ${result.reason}.`);
  }

  writeActiveTenant(slug);
  if (!emitActiveTenant(slug)) success(`Active tenant set to '${slug}'`);
  for (const note of tenantOverrideNotes(slug, {
    env: process.env.REVENEXX_TENANT,
    projectFile: loadProjectConfig().tenant,
  })) {
    warn(note);
  }
  return true;
};

tenants
  .command("use [slug]")
  .description(
    "Switch the active tenant context (validated against the gateway with your API key or browser session). Without a slug, choose from the tenants you can access.",
  )
  .action(
    actionRunner(async (slug?: string) => {
      if (!slug?.trim()) {
        const chosen = await chooseTenant();
        if (chosen) await switchTenant(chosen);
        return;
      }

      if (!(await switchTenant(slug.trim()))) {
        // Refused: show what would have worked, and on a terminal let the
        // user pick it right away instead of retyping the command.
        const chosen = await chooseTenant();
        if (chosen) await switchTenant(chosen);
      }
    }),
  );

// The full-screen TUI runs commands with captured output (no TTY, so no
// inquirer picker); give its form the tenant list as a selectable field.
registerPositionalChoices(
  tenants.commands.find((c) => c.name() === "use")!,
  listSelectableTenants,
);

tenants
  .command("current")
  .description("Print the active tenant slug")
  .option("--check", "Verify the active tenant against the gateway")
  .action(
    actionRunner(async ({ check }: { check?: boolean }) => {
      const slug = readActiveTenant();
      if (!slug) {
        if (cliConfig.output !== "table") {
          console.log([]);
          return;
        }
        if (cliConfig.quiet) return;
        log(
          `No active tenant set. Run \`${EXECUTABLE_NAME} tenants list\` to see your tenants, then \`${EXECUTABLE_NAME} tenants use <slug>\`.`,
        );
        return;
      }

      let access: string | undefined;
      let credential: ProbeCredential | undefined;
      if (check) {
        credential = await resolveProbeCredential();
        const result = await probeTenant(slug, credential);
        access =
          result === null
            ? "(cannot verify)"
            : result.ok
              ? "ok"
              : result.reason;
        if (result === null && cliConfig.output === "table") {
          log(slug);
          warn(`${noCredentialNote(credential)} Cannot verify tenant access.`);
          return;
        }
      }

      if (emitActiveTenant(slug, access === undefined ? {} : { Access: access })) {
        return;
      }
      log(slug);
      if (check && credential !== undefined) {
        if (access === "ok") {
          success(
            `Tenant '${slug}' is accessible with the current ${credential.kind === "apikey" ? "API key" : "session"}`,
          );
        } else {
          error(`Tenant check failed: ${access}`);
        }
      }
    }),
  );
