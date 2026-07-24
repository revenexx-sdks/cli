import { Command } from "commander";
import {
  actionRunner,
  commandDescriptions,
  parse,
  error,
  cliConfig,
} from "../parser.js";
import { globalConfig } from "../config.js";
import { loadProjectConfig, resolveTenant } from "../project-config.js";
import { DEFAULT_ENDPOINT, EXECUTABLE_NAME } from "../constants.js";
import { decodeJwtClaims } from "../oauth.js";
import { resolveSsoJwt } from "../sdks.js";
import Client from "../client.js";

/** How long to wait on the gateway health probe before giving up (offline). */
const HEALTH_TIMEOUT_MS = 3000;

/** Render a millisecond duration as a compact `1d 2h 3m` / `4m 5s` countdown. */
const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!days && !hours) parts.push(`${seconds}s`);
  return parts.join(" ");
};

/**
 * Resolve the SSO token expiry (epoch ms), preferring the stored value and
 * falling back to the JWT's own `exp` claim — mirroring resolveSsoJwt().
 */
const resolveTokenExpiry = (jwt: string): number => {
  let expiresAt = globalConfig.getJwtExpires();
  if (expiresAt <= 0) {
    const exp = decodeJwtClaims(jwt)?.exp;
    if (typeof exp === "number") expiresAt = exp * 1000;
  }
  return expiresAt;
};

/**
 * Probe the gateway's health endpoint with a short timeout and no retries so
 * `status` never hangs on an unreachable/offline endpoint. The gateway scopes
 * every request to a tenant, so the tenant header is sent just like a real
 * call. An HTTP error still means the gateway *answered* (reachable); only a
 * network/timeout failure counts as unreachable.
 */
const probeGatewayHealth = async (
  endpoint: string,
  tenant: string,
): Promise<string> => {
  const client = new Client()
    .setEndpoint(endpoint)
    .setSelfSigned(globalConfig.getSelfSigned())
    .setRetry(false)
    .setTimeout(HEALTH_TIMEOUT_MS);
  if (tenant) {
    client.headers = { ...client.headers, "x-revenexx-tenant": tenant };
  }
  try {
    const response = (await client.call("GET", "/health/version")) as {
      version?: string;
    };
    return response?.version ? `ok (v${response.version})` : "ok";
  } catch (err) {
    // The gateway answering with an HTTP error (even 401/400 on the scoped
    // health route) still proves it's reachable: the thrown RevenexxException
    // carries the response body and/or a numeric status code. A network error
    // or timeout carries neither — that's the genuinely unreachable case.
    const meta = err as { code?: unknown; response?: unknown };
    const reachable =
      typeof meta.code === "number" ||
      (typeof meta.response === "string" && meta.response !== "");
    return reachable ? "reachable" : "unreachable";
  }
};

export const status = new Command("status")
  .description(commandDescriptions["status"])
  .configureHelp({ helpWidth: process.stdout.columns || 80 })
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
      let jwt = globalConfig.getJWT();

      if (key === "" && jwt === "") {
        error(
          `No user is signed in. To sign in, run '${EXECUTABLE_NAME} login'`,
        );
        return;
      }

      const tenant =
        cliConfig.tenant ||
        resolveTenant() ||
        process.env.REVENEXX_PROJECT ||
        projectFile.projectId ||
        globalConfig.getProject() ||
        "(none)";
      const usingKey = key !== "";

      // Mirror what every real command does before hitting the gateway: refresh
      // the SSO token via the stored refresh token when it has expired, so the
      // reported expiry reflects the session the CLI will actually use. Without
      // this, `status` prints a stale "expired" while every command silently
      // refreshes and succeeds. A dead refresh token is the genuine re-login
      // case, surfaced as such below.
      let refreshFailed = false;
      if (!usingKey && jwt) {
        try {
          jwt = (await resolveSsoJwt()) || jwt;
        } catch {
          refreshFailed = true;
        }
      }

      // The signed-in identity: an API key has no user, so name it by tenant;
      // SSO uses the stored email, falling back to the JWT's own claims.
      const claims = jwt ? decodeJwtClaims(jwt) : null;
      const user = usingKey
        ? `apikey:${tenant}`
        : globalConfig.getEmail() ||
          claims?.preferred_username ||
          claims?.name ||
          claims?.sub ||
          "(unknown)";

      let tokenExpiry = "n/a";
      if (!usingKey && jwt) {
        if (refreshFailed) {
          tokenExpiry = `expired — run \`${EXECUTABLE_NAME} login\``;
        } else {
          const expiresAt = resolveTokenExpiry(jwt);
          if (expiresAt > 0) {
            const remaining = expiresAt - Date.now();
            tokenExpiry =
              remaining <= 0 ? "expired" : `in ${formatDuration(remaining)}`;
          }
        }
      }

      const gateway = await probeGatewayHealth(
        endpoint,
        tenant === "(none)" ? "" : tenant,
      );

      parse({
        User: user,
        "Auth method": usingKey ? "API key" : "SSO (Zitadel)",
        Tenant: tenant,
        Endpoint: endpoint,
        "Token expires": tokenExpiry,
        Gateway: gateway,
      });
    }),
  );
