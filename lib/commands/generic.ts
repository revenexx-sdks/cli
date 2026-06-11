import inquirer from "inquirer";
import { Command } from "commander";
import { globalConfig, localConfig } from "../config.js";
import { loadProjectConfig, resolveTenant } from "../project-config.js";
import { EXECUTABLE_NAME, REGISTER_URL, DEFAULT_ENDPOINT } from "../constants.js";
import {
  actionRunner,
  success,
  parseBool,
  commandDescriptions,
  error,
  parse,
  log,
  drawTable,
  cliConfig,
} from "../parser.js";
import ID from "../id.js";
import { questionsLogout } from "../questions.js";
import ClientLegacy from "../client.js";

const deleteLocalSession = (accountId: string): void => {
  globalConfig.removeSession(accountId);
};

const getSessionAccountKey = (sessionId: string): string | undefined => {
  const session = globalConfig.get(sessionId) as
    | { email?: string; endpoint?: string }
    | undefined;
  if (!session) return undefined;
  return `${session.email ?? ""}|${session.endpoint ?? ""}`;
};

/**
 * Given selected session IDs, determine which sessions should be removed
 * locally: all sessions belonging to the same account (email+endpoint) as any
 * selected session. Sessions are local-only — API keys are revoked from the
 * Console, not via the CLI.
 *
 * @param selectedSessionIds Array of session IDs to process for logout.
 * @returns Session IDs to remove locally.
 */
const planSessionLogout = (selectedSessionIds: string[]): string[] => {
  // Map to group all session IDs by their unique account key (email+endpoint)
  const sessionIdsByAccount = new Map<string, string[]>();
  for (const sessionId of globalConfig.getSessionIds()) {
    const key = getSessionAccountKey(sessionId);
    if (!key) continue; // Skip sessions without proper account key

    // For each account key, gather all associated session IDs
    const ids = sessionIdsByAccount.get(key) ?? [];
    ids.push(sessionId);
    sessionIdsByAccount.set(key, ids);
  }

  const selectedAccounts = new Set<string>();
  for (const selectedSessionId of selectedSessionIds) {
    const key = getSessionAccountKey(selectedSessionId);
    if (key) selectedAccounts.add(key);
  }

  // Sessions to remove locally: all sessions under selected accounts
  return Array.from(selectedAccounts).flatMap(
    (accountKey) => sessionIdsByAccount.get(accountKey) ?? [],
  );
};

/**
 * Validate an API key against the gateway by probing `/locale` — a cheap,
 * always-routed endpoint. The gateway answers 200 for a valid key and 401
 * (`invalid api key` / `not authenticated`) for a bogus one. Older
 * self-hosted servers answer a scope-error (`general_unauthorized_scope`)
 * instead, which we also accept as proof the key was recognised.
 */
export type ApiKeyProbeFailureKind =
  | "invalid-key"
  | "invalid-tenant"
  | "missing-tenant"
  | "other";

export type ApiKeyValidationResult =
  | { ok: true; reason?: undefined; kind?: undefined }
  | { ok: false; reason: string; kind: ApiKeyProbeFailureKind };

/**
 * Pure classifier — translates the probe response (success or thrown error)
 * into the validation verdict. Extracted so it can be unit-tested without an
 * HTTP layer.
 *
 * The gateway answers with typeless `{"error":true,"message":"…"}` bodies, so
 * the message strings are matched directly; the `type`-based rules below them
 * cover older self-hosted servers that still send structured error types.
 */
export const classifyApiKeyProbe = (
  err: unknown | null,
  tenant: string,
): ApiKeyValidationResult => {
  if (err == null) return { ok: true };
  const e = err as {
    code?: number;
    type?: string;
    response?: string;
    message?: string;
  };
  const message = typeof e.message === "string" ? e.message : "";
  if (e.type === "general_unauthorized_scope") {
    return { ok: true };
  }
  if (message === "api key not valid for this tenant") {
    return {
      ok: false,
      kind: "invalid-tenant",
      reason: `the key is not valid for tenant '${tenant}'`,
    };
  }
  if (message === "missing X-Revenexx-Tenant") {
    return {
      ok: false,
      kind: "missing-tenant",
      reason: "the gateway requires a tenant header on every request",
    };
  }
  if (e.type === "user_unauthorized") {
    return {
      ok: false,
      kind: "invalid-key",
      reason: "the key was not recognised by the server",
    };
  }
  if (e.type === "project_not_found" || e.type === "general_project_not_found") {
    return {
      ok: false,
      kind: "invalid-tenant",
      reason: `tenant '${tenant}' was not found`,
    };
  }
  if (message === "invalid api key") {
    return { ok: false, kind: "invalid-key", reason: "invalid api key" };
  }
  return {
    ok: false,
    kind: "other",
    reason: e.type ? `${e.type}` : (err as Error).message ?? "unknown error",
  };
};

export const validateApiKey = async (
  apiKey: string,
  endpoint: string,
  tenant: string,
): Promise<ApiKeyValidationResult> => {
  const client = new ClientLegacy()
    .setEndpoint(endpoint)
    .setTenant(tenant)
    .setKey(apiKey);
  try {
    await client.call("GET", "/locale", { "content-type": "application/json" }, {});
    return classifyApiKeyProbe(null, tenant);
  } catch (err) {
    return classifyApiKeyProbe(err, tenant);
  }
};

export const loginCommand = async ({
  endpoint,
  key,
  token,
  tenant,
}: {
  endpoint?: string;
  key?: string;
  token?: string;
  tenant?: string;
}): Promise<void> => {
  const projectFile = loadProjectConfig();

  // Resolution order per DX-22:
  // sub-flag → global --endpoint → REVENEXX_API_URL → .revenexx.yaml →
  // global config → default.
  const configEndpoint =
    endpoint ||
    cliConfig.endpoint ||
    process.env.REVENEXX_API_URL ||
    projectFile.apiUrl ||
    globalConfig.getEndpoint() ||
    DEFAULT_ENDPOINT;

  // Resolve an API key from flag → env → project file. (Global config is
  // the *destination*, not a source — `login` writes to it.)
  const resolvedKey =
    token ||
    key ||
    cliConfig.token ||
    process.env.REVENEXX_API_KEY ||
    projectFile.token ||
    "";

  if (!resolvedKey) {
    error(
      `No API key found. Provide one with --token, set REVENEXX_API_KEY in the environment, or add it to .revenexx.yaml.`,
    );
    return;
  }

  // Tenant slug: --tenant → ~/.revenexx/tenant (`tenants use`) →
  // REVENEXX_TENANT → .revenexx.yaml. The gateway scopes every request
  // to a tenant.
  const resolvedTenant = tenant || cliConfig.tenant || resolveTenant();

  if (!resolvedTenant) {
    error(
      `API key is set but no tenant was provided. Pass --tenant, set REVENEXX_TENANT, add \`tenant:\` to .revenexx.yaml, or run \`${EXECUTABLE_NAME} tenants use <slug>\`.`,
    );
    return;
  }

  log("Validating API key…");
  const result = await validateApiKey(
    resolvedKey,
    configEndpoint,
    resolvedTenant,
  );
  if (!result.ok) {
    error(`API key validation failed: ${result.reason}.`);
    return;
  }
  const id = ID.unique();
  globalConfig.addSession(id, { endpoint: configEndpoint });
  globalConfig.setCurrentSession(id);
  globalConfig.setEndpoint(configEndpoint);
  globalConfig.setKey(resolvedKey);
  globalConfig.setEmail(`apikey:${resolvedTenant}`);
  success(
    `Signed in with API key (tenant ${resolvedTenant}, endpoint ${configEndpoint})`,
  );
};

export const whoami = new Command("whoami")
  .description(commandDescriptions["whoami"])
  .action(
    actionRunner(async () => {
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

      if (key === "") {
        error(
          `No user is signed in. To sign in, run '${EXECUTABLE_NAME} login'`,
        );
        return;
      }

      const tenant = resolveTenant() || "(none)";

      const data = [
        {
          "Auth method": "API key",
          Tenant: tenant,
          Endpoint: endpoint,
        },
      ];
      if (cliConfig.json) {
        console.log(data);
        return;
      }
      drawTable(data);
    }),
  );

export const register = new Command("register")
  .description(commandDescriptions["register"])
  .action(
    actionRunner(async () => {
      log(`Visit ${REGISTER_URL} to create an account`);
    }),
  );

export const login = new Command("login")
  .description(commandDescriptions["login"])
  .option(
    `--endpoint [endpoint]`,
    `Revenexx API URL for self-hosted instances`,
  )
  .option(
    `--token [token]`,
    `Gateway API key (for CI / scripts). Also read from REVENEXX_API_KEY.`,
  )
  .option(`--key [key]`, `Alias for --token (kept for back-compat)`)
  .option(
    `--tenant [tenant]`,
    `Tenant slug (defaults to ~/.revenexx/tenant via \`tenants use\`, then REVENEXX_TENANT, then .revenexx.yaml)`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  })
  .action(actionRunner(loginCommand));

export const logout = new Command("logout")
  .description(commandDescriptions["logout"])
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  })
  .action(
    actionRunner(async () => {
      const sessions = globalConfig.getSessions();
      const current = globalConfig.getCurrentSession();
      const originalCurrent = current;

      if (current === "" || !sessions.length) {
        log("No active sessions found.");
        return;
      }
      if (sessions.length === 1) {
        // Remove all local sessions with the same email+endpoint
        const allSessionIds = globalConfig.getSessionIds();
        for (const sessId of allSessionIds) {
          deleteLocalSession(sessId);
        }
        globalConfig.setCurrentSession("");
        success("Logged out successfully");

        return;
      }

      const answers = await inquirer.prompt(questionsLogout);

      if (answers.accounts?.length) {
        const localTargets = planSessionLogout(answers.accounts as string[]);

        for (const sessionId of localTargets) {
          deleteLocalSession(sessionId);
        }
      }

      const remainingSessions = globalConfig.getSessions();
      const hasCurrent = remainingSessions.some(
        (session) => session.id === originalCurrent,
      );

      if (remainingSessions.length > 0 && hasCurrent) {
        globalConfig.setCurrentSession(originalCurrent);
      } else if (remainingSessions.length > 0) {
        const nextSession =
          remainingSessions.find((session) => session.email) ??
          remainingSessions[0];
        globalConfig.setCurrentSession(nextSession.id);

        success(
          nextSession.email
            ? `Switched to ${nextSession.email}`
            : `Switched to session at ${nextSession.endpoint}`,
        );
      } else if (remainingSessions.length === 0) {
        globalConfig.setCurrentSession("");
      }

      success("Logged out successfully");
    }),
  );

interface ClientCommandOptions {
  selfSigned?: boolean;
  endpoint?: string;
  projectId?: string;
  key?: string;
  debug?: boolean;
  reset?: boolean;
}

export const client = new Command("client")
  .description(commandDescriptions["client"])
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  })
  .option(
    "-ss, --self-signed <value>",
    "Configure the CLI to use a self-signed certificate ( true or false )",
    parseBool,
  )
  .option("-e, --endpoint <endpoint>", "Set your Revenexx server endpoint")
  .option("-p, --project-id <project-id>", "Set your Revenexx project ID")
  .option("-k, --key <key>", "Set your Revenexx server's API key")
  .option("-d, --debug", "Print CLI debug information")
  .option("-r, --reset", "Reset the CLI configuration")
  .action(
    actionRunner(
      async (
        localOpts: ClientCommandOptions,
        command: Command,
      ) => {
        const parentOpts = (command.parent?.opts() ?? {}) as {
          endpoint?: string;
          projectId?: string;
        };
        const endpoint = localOpts.endpoint ?? parentOpts.endpoint;
        const projectId = localOpts.projectId ?? parentOpts.projectId;
        const { selfSigned, key, debug, reset } = localOpts;

        if (
          selfSigned == undefined &&
          endpoint == undefined &&
          projectId == undefined &&
          key == undefined &&
          debug == undefined &&
          reset == undefined
        ) {
          command.help();
        }

        if (debug) {
          const key = globalConfig.getKey();
          const maskedKey =
            key && key.length > 16
              ? `${key.slice(0, 8)}...${key.slice(-8)}`
              : key
                ? "********"
                : "";
          const project = localConfig.getProject();
          const cookie = globalConfig.getCookie();
          let maskedCookie = "";
          if (cookie) {
            const [cookieName, cookieValueAndRest = ""] = cookie.split("=", 2);
            const cookieValue = cookieValueAndRest.split(";")[0] ?? "";
            const tail =
              cookieValue.length > 8
                ? cookieValue.slice(-8)
                : cookieValue || "********";
            maskedCookie = `${cookieName}=...${tail}`;
          }
          const config = {
            endpoint: globalConfig.getEndpoint(),
            key: maskedKey,
            cookie: maskedCookie,
            selfSigned: globalConfig.getSelfSigned(),
            projectId: project.projectId ?? "",
            projectName: project.projectName ?? "",
          };
          parse(config);
        }

        if (endpoint !== undefined) {
          try {
            const id = ID.unique();
            const url = new URL(endpoint);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
              throw new Error();
            }

            const clientInstance = new ClientLegacy().setEndpoint(endpoint);
            clientInstance.setProject("console");
            if (selfSigned || globalConfig.getSelfSigned()) {
              clientInstance.setSelfSigned(true);
            }
            const response = (await clientInstance.call(
              "GET",
              "/health/version",
            )) as { version?: string };
            if (!response.version) {
              throw new Error();
            }
            globalConfig.setCurrentSession(id);
            globalConfig.addSession(id, { endpoint });
            globalConfig.setEndpoint(endpoint);
          } catch (_) {
            throw new Error(
              "Invalid endpoint or your Revenexx server is not running as expected.",
            );
          }
        }

        if (key !== undefined) {
          if (!globalConfig.getCurrentSession()) {
            throw new Error(
              `Session not found. Please run \`${EXECUTABLE_NAME} client --endpoint <endpoint>\` first.`,
            );
          }
          globalConfig.setKey(key);
        }

        if (projectId !== undefined) {
          localConfig.setProject(projectId, "");
        }

        if (selfSigned == true || selfSigned == false) {
          if (!globalConfig.getCurrentSession()) {
            throw new Error(
              `Session not found. Please run \`${EXECUTABLE_NAME} client --endpoint <endpoint>\` first.`,
            );
          }
          globalConfig.setSelfSigned(selfSigned);
        }

        if (reset !== undefined) {
          for (const sessionId of globalConfig.getSessionIds()) {
            deleteLocalSession(sessionId);
          }

          globalConfig.setCurrentSession("");
        }

        if (!debug) {
          success("Setting client");
        }
      },
    ),
  );

export const migrate = async (): Promise<void> => {
  if (!globalConfig.has("endpoint") || !globalConfig.has("cookie")) {
    return;
  }

  const endpoint = globalConfig.get("endpoint") as string;
  const cookie = globalConfig.get("cookie") as string;

  const id = ID.unique();
  const data = {
    endpoint,
    cookie,
    email: "legacy",
  };

  globalConfig.addSession(id, data);
  globalConfig.setCurrentSession(id);
  globalConfig.delete("endpoint");
  globalConfig.delete("cookie");
};
