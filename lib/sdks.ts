import { globalConfig, localConfig } from "./config.js";
import { loadProjectConfig, resolveTenant } from "./project-config.js";
import { cliConfig } from "./parser.js";
import Client from "./client.js";
import os from "os";
import {
  DEFAULT_ENDPOINT,
  EXECUTABLE_NAME,
  SDK_TITLE,
  SDK_VERSION,
  SSO_ISSUER,
  SSO_CLIENT_ID,
} from "./constants.js";
import { decodeJwtClaims, discoverEndpoints, refreshTokens } from "./oauth.js";

/**
 * Resolve a usable JWT for the current SSO session, refreshing it via the
 * stored refresh token when it has expired (or is about to). Returns "" when no
 * JWT session exists. Throws with a re-login hint when a refresh is needed but
 * fails.
 */
const resolveSsoJwt = async (): Promise<string> => {
  let jwt = globalConfig.getJWT();
  if (!jwt) {
    return "";
  }

  // Prefer the stored expiry; if the server didn't report one, fall back to the
  // JWT's own `exp` claim (seconds since epoch) so a dead token still triggers
  // a refresh instead of being sent and 401'ing.
  let expiresAt = globalConfig.getJwtExpires();
  if (expiresAt <= 0) {
    const exp = decodeJwtClaims(jwt)?.exp;
    if (typeof exp === "number") {
      expiresAt = exp * 1000;
    }
  }
  const refreshToken = globalConfig.getRefreshToken();
  // Refresh a little early to avoid races with in-flight requests.
  const isExpired = expiresAt > 0 && Date.now() >= expiresAt - 30_000;

  if (isExpired && refreshToken) {
    try {
      const { tokenEndpoint } = await discoverEndpoints(SSO_ISSUER);
      const tokens = await refreshTokens({
        tokenEndpoint,
        clientId: SSO_CLIENT_ID,
        refreshToken,
      });
      jwt = tokens.jwt;
      globalConfig.setJWT(tokens.jwt);
      if (tokens.refreshToken) {
        globalConfig.setRefreshToken(tokens.refreshToken);
      }
      if (tokens.expiresAt) {
        globalConfig.setJwtExpires(tokens.expiresAt);
      }
    } catch (_err) {
      throw new Error(
        `Your SSO session has expired. Run \`${EXECUTABLE_NAME} login\` to sign in again.`,
      );
    }
  } else if (isExpired) {
    throw new Error(
      `Your SSO session has expired. Run \`${EXECUTABLE_NAME} login\` to sign in again.`,
    );
  }

  return jwt;
};

export const sdkForProject = async (): Promise<Client> => {
  const client = new Client();

  const projectFile = loadProjectConfig();

  // Resolution order (per DX-22) — same shape for endpoint, token, project:
  // --flag → REVENEXX_* env → .revenexx.yaml → local/global config → default.
  const endpoint =
    cliConfig.endpoint ||
    process.env.REVENEXX_API_URL ||
    projectFile.apiUrl ||
    localConfig.getEndpoint() ||
    globalConfig.getEndpoint() ||
    DEFAULT_ENDPOINT;

  // resolveTenant() covers ~/.revenexx/tenant (`tenants use`), then
  // REVENEXX_TENANT, then .revenexx.yaml — keeping this in sync with the
  // x-revenexx-tenant header below.
  const project =
    cliConfig.tenant ||
    resolveTenant() ||
    process.env.REVENEXX_PROJECT ||
    projectFile.projectId ||
    localConfig.getProject().projectId ||
    globalConfig.getProject() ||
    "";

  const key =
    cliConfig.token ||
    process.env.REVENEXX_API_KEY ||
    projectFile.token ||
    globalConfig.getKey() ||
    "";
  const selfSigned = globalConfig.getSelfSigned();

  if (!project) {
    throw new Error(
      `Project is not set. Please run \`${EXECUTABLE_NAME} login\` or pass --tenant to scope the request.`,
    );
  }

  client.headers = {
    ...client.headers,
    "x-sdk-name": "Command Line",
    "x-sdk-platform": "console",
    "x-sdk-language": "cli",
    "x-sdk-version": SDK_VERSION,
    "user-agent": `${SDK_TITLE}CLI/${SDK_VERSION} (${os.type()} ${os.version()}; ${os.arch()})`,
    // The API gateway scopes every request to a tenant.
    "x-revenexx-tenant": resolveTenant(project),
  };

  client
    .setEndpoint(endpoint)
    .setProject(project)
    .setSelfSigned(selfSigned)
    .setLocale("en-US")
    // Transport resilience (DX-103): honor --timeout / --no-retry, and enable
    // redacted HTTP debug logging under --debug or --verbose.
    .setRetry(cliConfig.retry !== false)
    .setDebug(cliConfig.debug === true || cliConfig.verbose === true);

  if (cliConfig.timeout !== undefined) {
    if (!Number.isFinite(cliConfig.timeout) || cliConfig.timeout <= 0) {
      throw new Error(
        `Invalid --timeout value '${cliConfig.timeout}'. Expected a positive integer (milliseconds).`,
      );
    }
    client.setTimeout(cliConfig.timeout);
  }

  if (key) {
    // setKey targets the legacy header; the gateway reads x-revenexx-api-key.
    client.headers["x-revenexx-api-key"] = key;
    return client.setKey(key).setMode("default");
  }

  // No API key — fall back to a stored SSO JWT. The gateway validates OIDC
  // tokens in the standard `Authorization: Bearer` header (the same path the
  // web/node/php SDKs use; see PR #9), not the legacy X-Revenexx-JWT header.
  // Refreshed transparently when expired.
  const jwt = await resolveSsoJwt();
  if (jwt) {
    return client.setBearer(jwt).setMode("default");
  }

  throw new Error(
    `Session not found. Please run \`${EXECUTABLE_NAME} login\` to create a session.`,
  );
};
