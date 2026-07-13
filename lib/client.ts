import os from "os";
import { fetch, FormData, Agent } from "undici";
import { globalConfig } from "./config.js";

// undici's fetch reports resource timing through
// performance.markResourceTiming, which Bun < 1.1 does not implement.
const perf = globalThis.performance as unknown as Record<string, unknown>;
if (typeof perf.markResourceTiming !== "function") {
  perf.markResourceTiming = () => {};
}
import { JSONBig } from "./json.js";
import { startRequestSpinner } from "./spinner.js";
import { redactSecrets } from "./redact.js";
import chalk from "chalk";
import type {
  Headers,
  RequestParams,
  ResponseType,
  FileUpload,
} from "./types.js";
import {
  DEFAULT_ENDPOINT,
  SDK_NAME,
  SDK_PLATFORM,
  SDK_LANGUAGE,
  SDK_VERSION,
  SDK_TITLE,
  EXECUTABLE_NAME,
} from "./constants.js";

// --- Transport resilience defaults (DX-103) --------------------------------

/** Overall per-request timeout (ms) before the request is aborted. */
const DEFAULT_TIMEOUT_MS = 30_000;
/** How long to wait for a TCP/TLS connection before giving up (ms). */
const CONNECT_TIMEOUT_MS = 10_000;
/** Maximum number of *retries* (so up to N+1 total attempts) for a request. */
const DEFAULT_MAX_RETRIES = 3;
/** Base delay for exponential backoff (ms). */
const RETRY_BASE_DELAY_MS = 300;
/** Ceiling for a single backoff wait (ms). */
const RETRY_MAX_DELAY_MS = 5_000;
/** Ceiling for an honored `Retry-After` wait (ms) — never block indefinitely. */
const RETRY_AFTER_MAX_MS = 60_000;

/**
 * Methods safe to retry automatically: they have no side effects (GET/HEAD) or
 * are idempotent by spec (PUT/DELETE). POST/PATCH are intentionally excluded so
 * a retry never risks duplicating a create/mutation the gateway already applied.
 */
const IDEMPOTENT_METHODS = new Set(["GET", "HEAD", "PUT", "DELETE", "OPTIONS"]);

/** Transient status codes worth retrying (on top of network errors). */
const RETRYABLE_STATUS = new Set([429, 502, 503, 504]);

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parse a `Retry-After` header, which is either an integer number of seconds
 * or an HTTP-date. Returns the delay in ms (clamped), or null when absent /
 * unparseable so the caller falls back to exponential backoff.
 */
const parseRetryAfter = (value: string | null): number | null => {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.min(Math.max(seconds, 0) * 1000, RETRY_AFTER_MAX_MS);
  }
  const date = Date.parse(value);
  if (!Number.isNaN(date)) {
    return Math.min(Math.max(date - Date.now(), 0), RETRY_AFTER_MAX_MS);
  }
  return null;
};

/** Full-jitter exponential backoff: random in [0, min(cap, base·2^attempt)]. */
const backoffDelay = (attempt: number): number => {
  const ceiling = Math.min(
    RETRY_MAX_DELAY_MS,
    RETRY_BASE_DELAY_MS * 2 ** attempt,
  );
  return Math.floor(Math.random() * ceiling);
};

// --- Shared connection pool ------------------------------------------------

// A single module-level dispatcher keeps connections alive and pooled across
// every request instead of building (and discarding) an Agent per call. It's
// rebuilt only when the TLS verification mode (`selfSigned`) changes.
let sharedAgent: Agent | undefined;
let sharedAgentSelfSigned: boolean | undefined;

const getDispatcher = (selfSigned: boolean): Agent => {
  if (sharedAgent === undefined || sharedAgentSelfSigned !== selfSigned) {
    // Close the stale pool in the background; a rejection here is harmless.
    void sharedAgent?.close().catch(() => {});
    sharedAgent = new Agent({
      connect: {
        rejectUnauthorized: !selfSigned,
        timeout: CONNECT_TIMEOUT_MS,
      },
    });
    sharedAgentSelfSigned = selfSigned;
  }
  return sharedAgent;
};

/**
 * Error thrown for any failed gateway request.
 */
export class RevenexxException extends Error {
  code?: number | string;
  type: string;
  response: string;
  /** Gateway correlation id (`x-request-id`), when the response carried one. */
  requestId?: string;

  constructor(
    message: string,
    code?: number | string,
    type: string = "",
    response: string = "",
    requestId?: string,
  ) {
    super(message);
    this.name = "RevenexxException";
    this.code = code;
    this.type = type;
    this.response = response;
    this.requestId = requestId;
  }
}

/**
 * Map a failed request to a meaningful process exit code so scripts and CI can
 * branch on *why* a command failed instead of a blanket `1`. Keyed off the
 * numeric status carried on {@link RevenexxException.code}; falls back to `1`
 * for locally-raised or non-HTTP errors.
 *
 *   2  usage error (bad flags/args — raised by the arg parser, not here)
 *   4  authentication/authorization failure (401/403)
 *   5  not found (404)
 *   8  rate limited (429)
 *   1  generic failure (network, timeout, 5xx, everything else)
 */
export const exitCodeForError = (err: unknown): number => {
  const raw = (err as { code?: number | string })?.code;
  const status = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(status)) return 1;
  if (status === 401 || status === 403) return 4;
  if (status === 404) return 5;
  if (status === 429) return 8;
  return 1;
};

class Client {
  private endpoint: string;
  headers: Headers;
  private selfSigned: boolean;
  private timeout: number;
  private retry: boolean;
  private debug: boolean;

  constructor() {
    this.endpoint = DEFAULT_ENDPOINT;
    this.selfSigned = false;
    this.timeout = DEFAULT_TIMEOUT_MS;
    this.retry = true;
    this.debug = false;
    this.headers = {
      "content-type": "",
      "x-sdk-name": SDK_NAME,
      "x-sdk-platform": SDK_PLATFORM,
      "x-sdk-language": SDK_LANGUAGE,
      "x-sdk-version": SDK_VERSION,
      "user-agent": `${SDK_TITLE}CLI/${SDK_VERSION} (${os.type()} ${os.version()}; ${os.arch()})`,
      "X-Revenexx-Response-Format": "1.8.1",
    };
  }

  /**
   * Set Cookie
   *
   * Your cookie
   *
   * @param {string} cookie
   *
   * @return self
   */
  setCookie(cookie: string): this {
    this.addHeader("cookie", cookie);
    return this;
  }

  /**
   * Set Project
   *
   * Your project ID
   *
   * @param {string} project
   *
   * @return self
   */
  setProject(project: string): this {
    this.addHeader("X-Revenexx-Project", project);
    return this;
  }

  /**
   * Set Tenant
   *
   * The tenant slug the request is scoped to. The API gateway requires this
   * header on every request.
   *
   * @param {string} tenant
   *
   * @return self
   */
  setTenant(tenant: string): this {
    this.addHeader("X-Revenexx-Tenant", tenant);
    return this;
  }

  /**
   * Set Market
   *
   * The active market slug to scope requests to, sent as the X-Revenexx-Market
   * header. Optional — omit it to see only global rows.
   *
   * @param {string} market
   *
   * @return self
   */
  setMarket(market: string): this {
    this.addHeader("X-Revenexx-Market", market);
    return this;
  }

  /**
   * Set Key
   *
   * Your secret API key
   *
   * @param {string} key
   *
   * @return self
   */
  setKey(key: string): this {
    this.addHeader("X-Revenexx-Api-Key", key);
    return this;
  }

  /**
   * Set JWT
   *
   * Your secret JSON Web Token
   *
   * @param {string} jwt
   *
   * @return self
   */
  setJWT(jwt: string): this {
    this.addHeader("X-Revenexx-JWT", jwt);
    return this;
  }

  /**
   * Set Bearer token
   *
   * An OAuth2 / OIDC access token (e.g. from SSO sign-in), sent in the standard
   * `Authorization: Bearer` header — the header the gateway validates for JWT
   * auth (see sdk-generator PR #9). Adds the `Bearer ` prefix unless the caller
   * already supplied one.
   *
   * @param {string} token
   *
   * @return self
   */
  setBearer(token: string): this {
    const value = token.toLowerCase().startsWith("bearer ")
      ? token
      : `Bearer ${token}`;
    this.addHeader("Authorization", value);
    return this;
  }

  /**
   * Set Locale
   *
   * @param {string} locale
   *
   * @return self
   */
  setLocale(locale: string): this {
    this.addHeader("X-Revenexx-Locale", locale);
    return this;
  }

  /**
   * Set Mode
   *
   * @param {string} mode
   *
   * @return self
   */
  setMode(mode: string): this {
    this.addHeader("X-Revenexx-Mode", mode);
    return this;
  }

  /**
   * Set self signed.
   *
   * @param {bool} status
   *
   * @return this
   */
  setSelfSigned(status: boolean): this {
    this.selfSigned = status;
    return this;
  }

  /**
   * True for hosts where cleartext `http://` is acceptable during local
   * development (loopback interfaces never leave the machine).
   */
  static isLoopbackHost(hostname: string): boolean {
    const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
return (
  host === "localhost" ||
  host === "::1" ||
  /^127(?:\.\d{1,3}){3}$/.test(host)
);
  }

  /**
   * Set endpoint.
   *
   * @param {string} endpoint
   *
   * @return this
   */
  setEndpoint(endpoint: string): this {
    let url: URL;
    try {
      url = new URL(endpoint);
    } catch {
      throw new RevenexxException("Invalid endpoint URL: " + endpoint);
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new RevenexxException("Invalid endpoint URL: " + endpoint);
    }

    // Refuse cleartext `http://` to a remote host: the API key and
    // `Authorization: Bearer` JWT would travel unencrypted. Loopback hosts are
    // allowed for local development; self-hosted deployments should use
    // `https://` (pair with `--self-signed` for a self-signed certificate).
    // `REVENEXX_ALLOW_CLEARTEXT=1` is an explicit opt-out for trusted private
    // networks (and the test harness) that reach the API over plain http://.
    const allowCleartext = process.env.REVENEXX_ALLOW_CLEARTEXT === "1";
    if (
      url.protocol === "http:" &&
      !Client.isLoopbackHost(url.hostname) &&
      !allowCleartext
    ) {
      throw new RevenexxException(
        `Refusing to use insecure endpoint '${endpoint}': credentials would be sent in cleartext over http://. Use https:// (self-hosted setups can pair it with --self-signed), or a loopback host such as http://localhost for local development. Set REVENEXX_ALLOW_CLEARTEXT=1 to override on a trusted private network.`,
      );
    }

    this.endpoint = endpoint;
    return this;
  }

  /**
   * Set the per-request timeout in milliseconds. A request that exceeds this is
   * aborted with a clear "timed out" error rather than hanging indefinitely.
   *
   * @param {number} ms
   *
   * @return this
   */
  setTimeout(ms: number): this {
    if (Number.isFinite(ms) && ms > 0) {
      this.timeout = ms;
    }
    return this;
  }

  /**
   * Enable or disable automatic retries (bounded exponential backoff with
   * jitter for idempotent requests, honoring `Retry-After`). On by default.
   *
   * @param {boolean} enabled
   *
   * @return this
   */
  setRetry(enabled: boolean): this {
    this.retry = enabled;
    return this;
  }

  /**
   * Enable redacted HTTP debug logging (request line, status, duration,
   * request id) to stderr. Off by default.
   *
   * @param {boolean} enabled
   *
   * @return this
   */
  setDebug(enabled: boolean): this {
    this.debug = enabled;
    return this;
  }

  /**
   * @param {string} key
   * @param {string} value
   */
  addHeader(key: string, value: string): this {
    this.headers[key.toLowerCase()] = value;
    return this;
  }

  async call<T = unknown>(
    method: string,
    path: string = "",
    headers: Headers = {},
    params: RequestParams = {},
    responseType: ResponseType = "json",
  ): Promise<T> {
    const mergedHeaders: Headers = { ...this.headers, ...headers };
    const url = new URL(this.endpoint + path);

    let body: FormData | string | undefined = undefined;

    if (method.toUpperCase() === "GET") {
      url.search = new URLSearchParams(
        Client.flatten(params) as Record<string, string>,
      ).toString();
    } else if (
      mergedHeaders["content-type"]
        ?.toLowerCase()
        .startsWith("multipart/form-data")
    ) {
      delete mergedHeaders["content-type"];
      const formData = new FormData();

      const flatParams = Client.flatten(params);

      for (const [key, value] of Object.entries(flatParams)) {
        if (
          value &&
          typeof value === "object" &&
          "type" in value &&
          value.type === "file"
        ) {
          const fileUpload = value as FileUpload;
          formData.append(key, fileUpload.file as Blob, fileUpload.filename);
        } else {
          formData.append(key, value as string);
        }
      }

      body = formData;
    } else {
      body = JSONBig.stringify(params);
    }

    const upperMethod = method.toUpperCase();
    // Only auto-retry requests that are safe to replay: idempotent methods
    // whose body can be re-sent (a consumed FormData stream cannot). POST/PATCH
    // are excluded so a retry never risks duplicating an applied mutation.
    const bodyReplayable = !(body instanceof FormData);
    const maxRetries =
      this.retry && IDEMPOTENT_METHODS.has(upperMethod) && bodyReplayable
        ? DEFAULT_MAX_RETRIES
        : 0;

    let response: Awaited<ReturnType<typeof fetch>> | undefined = undefined;
    // Spinner is a no-op unless the CLI entry point enabled it (library
    // consumers and piped/non-TTY runs never see it). Kept up across retries.
    const stopSpinner = startRequestSpinner(`${upperMethod} ${path}`);
    try {
      for (let attempt = 0; ; attempt++) {
        const startedAt = Date.now();
        try {
          response = await fetch(url.toString(), {
            method: upperMethod,
            headers: mergedHeaders,
            body,
            // Bound every request so a slow/black-holed gateway can't hang
            // the CLI forever; aborts with a TimeoutError we translate below.
            signal: AbortSignal.timeout(this.timeout),
            // One pooled dispatcher, reused across requests (see getDispatcher).
            dispatcher: getDispatcher(this.selfSigned),
          });
        } catch (error) {
          const err = error as Error;
          const timedOut =
            err.name === "TimeoutError" || err.name === "AbortError";
          this.logDebug(
            upperMethod,
            path,
            timedOut ? "timeout" : "network-error",
            Date.now() - startedAt,
          );
          // Retry transient network failures for replayable idempotent requests
          // (a timeout is deliberate, not transient — surface it immediately).
          if (!timedOut && attempt < maxRetries) {
            await sleep(backoffDelay(attempt));
            continue;
          }
          if (timedOut) {
            throw new RevenexxException(
              `Request timed out after ${this.timeout}ms (${upperMethod} ${path}). Increase the limit with --timeout, or check your connection and the endpoint.`,
            );
          }
          throw new RevenexxException(err.message);
        }

        const requestId = response.headers.get("x-request-id") ?? undefined;
        this.logDebug(
          upperMethod,
          path,
          String(response.status),
          Date.now() - startedAt,
          requestId,
        );

        // Retry transient statuses; honor Retry-After on 429/503, else back off.
        if (attempt < maxRetries && RETRYABLE_STATUS.has(response.status)) {
          const retryAfter = parseRetryAfter(
            response.headers.get("retry-after"),
          );
          const delay = retryAfter ?? backoffDelay(attempt);
          // Drain the body so the pooled connection is freed for reuse.
          await response.arrayBuffer().catch(() => {});
          await sleep(delay);
          continue;
        }
        break;
      }
    } finally {
      stopSpinner();
    }

    // The loop either assigns `response` and breaks, or throws — so it is set.
    const res = response as Awaited<ReturnType<typeof fetch>>;
    const requestId = res.headers.get("x-request-id") ?? undefined;

    if (res.status >= 400) {
      const text = await res.text();
      let json: { message?: string; code?: number; type?: string } | undefined =
        undefined;
      try {
        json = JSON.parse(text);
      } catch (_error) {
        throw new RevenexxException(text, res.status, "", text, requestId);
      }

      if (
        path !== "/account" &&
        json.code === 401 &&
        json.type === "user_more_factors_required"
      ) {
        console.log(`${chalk.cyan("ℹ")} Unusable account found, removing...`);

        const current = globalConfig.getCurrentSession();
        globalConfig.setCurrentSession("");
        globalConfig.removeSession(current);
      }

      const isUnauthorized =
        json.code === 401 &&
        json.type === "general_unauthorized_scope" &&
        typeof json.message === "string" &&
        /role:\s*guests/i.test(json.message);

      if (isUnauthorized) {
        throw new RevenexxException(
          `You are not authenticated. Run '${EXECUTABLE_NAME} login' to authenticate and try again.`,
          json.code,
          json.type,
          text,
          requestId,
        );
      }

      throw new RevenexxException(
        json.message || text,
        json.code,
        json.type,
        text,
        requestId,
      );
    }

    if (responseType === "arraybuffer") {
      const data = await res.arrayBuffer();
      return data as T;
    }

    const cookies = res.headers.getSetCookie();
    if (cookies && cookies.length > 0) {
      for (const cookie of cookies) {
        if (cookie.startsWith("a_session_console=")) {
          globalConfig.setCookie(cookie);
        }
      }
    }

    const text = await res.text();
    let json: T | undefined = undefined;
    try {
      json = JSONBig.parse(text);
    } catch (_error) {
      return text as T;
    }
    return json as T;
  }

  /**
   * Redacted, opt-in HTTP debug line on stderr (request line, status/outcome,
   * duration, and gateway request id). Everything is passed through
   * redactSecrets so auth material in the path can never leak.
   */
  private logDebug(
    method: string,
    path: string,
    outcome: string,
    durationMs: number,
    requestId?: string,
  ): void {
    if (!this.debug) return;
    const id = requestId ? ` request-id=${requestId}` : "";
    const line = `${method} ${path} → ${outcome} (${durationMs}ms)${id}`;
    console.error(chalk.dim(`[http] ${redactSecrets(line)}`));
  }

  static flatten(
    data: RequestParams,
    prefix: string = "",
  ): Record<string, unknown> {
    let output: Record<string, unknown> = {};

    for (const key in data) {
      const value = data[key];
      const finalKey = prefix ? prefix + "[" + key + "]" : key;

      if (Array.isArray(value)) {
        output = {
          ...output,
          ...Client.flatten(value as unknown as RequestParams, finalKey),
        };
      } else {
        output[finalKey] = value;
      }
    }

    return output;
  }
}

export default Client;
