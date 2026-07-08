import crypto from "node:crypto";
import http from "node:http";
import { spawn } from "node:child_process";
import { fetch } from "undici";

/**
 * OAuth2 Authorization Code + PKCE helpers for the developer SSO login flow
 * (DX-57). The CLI is a native/public client — it cannot keep a secret — so it
 * uses PKCE (RFC 7636) against the Zitadel OIDC application and captures the
 * authorization code on an ephemeral loopback redirect.
 *
 * The pure pieces (PKCE generation, authorize-URL building, JWT claim decoding)
 * are exported separately so they can be unit-tested without a browser, a live
 * server, or network access.
 */

/** A base64url encoding with no padding, per RFC 7636. */
const base64url = (buffer: Buffer): string =>
  buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

export interface Pkce {
  verifier: string;
  challenge: string;
}

/** Derive the S256 PKCE challenge (base64url SHA-256) for a given verifier. */
export const pkceChallenge = (verifier: string): string =>
  base64url(crypto.createHash("sha256").update(verifier).digest());

/**
 * Generate a PKCE code verifier and its S256 challenge. The verifier is a
 * high-entropy 43–128 char base64url string; the challenge is the base64url
 * SHA-256 of the verifier.
 */
export const generatePkce = (): Pkce => {
  const verifier = base64url(crypto.randomBytes(32));
  return { verifier, challenge: pkceChallenge(verifier) };
};

/** A random, URL-safe state value used to defend against CSRF on the callback. */
export const generateState = (): string => base64url(crypto.randomBytes(16));

export interface AuthorizeUrlParams {
  authorizeEndpoint: string;
  clientId: string;
  redirectUri: string;
  challenge: string;
  state: string;
  scopes: string;
}

/** Build the Zitadel authorize URL with the PKCE challenge. */
export const buildAuthorizeUrl = ({
  authorizeEndpoint,
  clientId,
  redirectUri,
  challenge,
  state,
  scopes,
}: AuthorizeUrlParams): string => {
  const url = new URL(authorizeEndpoint);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", scopes);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
};

export interface OidcEndpoints {
  authorizeEndpoint: string;
  tokenEndpoint: string;
  userinfoEndpoint?: string;
}

/**
 * Resolve the authorize/token/userinfo endpoints from the issuer's OIDC
 * discovery document (`/.well-known/openid-configuration`).
 */
export const discoverEndpoints = async (
  issuer: string,
): Promise<OidcEndpoints> => {
  const base = issuer.replace(/\/$/, "");
  const res = await fetch(`${base}/.well-known/openid-configuration`);
  if (!res.ok) {
    throw new Error(
      `OIDC discovery failed (${res.status}) for issuer ${issuer}`,
    );
  }
  const doc = (await res.json()) as {
    authorization_endpoint?: string;
    token_endpoint?: string;
    userinfo_endpoint?: string;
  };
  if (!doc.authorization_endpoint || !doc.token_endpoint) {
    throw new Error(
      `OIDC discovery document for ${issuer} is missing authorization_endpoint/token_endpoint`,
    );
  }
  return {
    authorizeEndpoint: doc.authorization_endpoint,
    tokenEndpoint: doc.token_endpoint,
    userinfoEndpoint: doc.userinfo_endpoint,
  };
};

/**
 * Fetch the OIDC userinfo for an access token. Zitadel access tokens carry only
 * `sub`, so the human-readable identity (email/username) comes from here.
 * Best-effort: returns null on any failure so login still succeeds.
 */
export const fetchUserInfo = async (
  userinfoEndpoint: string,
  accessToken: string,
): Promise<JwtClaims | null> => {
  try {
    const res = await fetch(userinfoEndpoint, {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as JwtClaims;
  } catch {
    return null;
  }
};

export interface TokenResponse {
  jwt: string;
  /** OIDC id_token, when issued — carries profile claims (email) for display. */
  idToken?: string;
  refreshToken?: string;
  /** Absolute expiry as epoch milliseconds, when the server reported expires_in. */
  expiresAt?: number;
}

interface RawTokenResponse {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

const parseTokenResponse = (raw: RawTokenResponse): TokenResponse => {
  if (raw.error) {
    throw new Error(
      `Token endpoint error: ${raw.error}${raw.error_description ? ` — ${raw.error_description}` : ""}`,
    );
  }
  // The gateway accepts the token in `Authorization: Bearer`. Prefer the
  // access token; fall back to the id_token if the IdP only returns that.
  const jwt = raw.access_token || raw.id_token;
  if (!jwt) {
    throw new Error("Token endpoint did not return an access_token");
  }
  return {
    jwt,
    idToken: raw.id_token,
    refreshToken: raw.refresh_token,
    expiresAt:
      typeof raw.expires_in === "number"
        ? Date.now() + raw.expires_in * 1000
        : undefined,
  };
};

/**
 * Read a token-endpoint response defensively: tolerate non-JSON bodies and
 * non-2xx statuses, and never surface the raw body (it may echo secrets).
 */
const readTokenResponse = async (
  res: Awaited<ReturnType<typeof fetch>>,
): Promise<TokenResponse> => {
  const text = await res.text();
  let raw: RawTokenResponse;
  try {
    raw = JSON.parse(text) as RawTokenResponse;
  } catch {
    throw new Error(
      `Token endpoint returned HTTP ${res.status} with a non-JSON response.`,
    );
  }
  if (!res.ok && !raw.error) {
    throw new Error(`Token endpoint returned HTTP ${res.status}.`);
  }
  return parseTokenResponse(raw);
};

export interface ExchangeCodeParams {
  tokenEndpoint: string;
  clientId: string;
  code: string;
  redirectUri: string;
  verifier: string;
}

/** Exchange the authorization code for tokens (PKCE, no client secret). */
export const exchangeCode = async ({
  tokenEndpoint,
  clientId,
  code,
  redirectUri,
  verifier,
}: ExchangeCodeParams): Promise<TokenResponse> => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    code,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  return readTokenResponse(res);
};

export interface RefreshTokensParams {
  tokenEndpoint: string;
  clientId: string;
  refreshToken: string;
}

/** Mint a fresh JWT from a stored refresh token. */
export const refreshTokens = async ({
  tokenEndpoint,
  clientId,
  refreshToken,
}: RefreshTokensParams): Promise<TokenResponse> => {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    client_id: clientId,
    refresh_token: refreshToken,
  });
  const res = await fetch(tokenEndpoint, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  const parsed = await readTokenResponse(res);
  // Reuse the existing refresh token if the IdP didn't rotate it.
  return { ...parsed, refreshToken: parsed.refreshToken ?? refreshToken };
};

/**
 * The page shown in the browser after the OAuth redirect. Self-contained
 * (inline styles, no external assets) since it's served from the ephemeral
 * loopback server.
 */
const callbackPage = (ok: boolean): string => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Revenexx CLI</title>
    <style>
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        background: #0b0d10;
        color: #e6e8ea;
      }
      .card {
        text-align: center;
        padding: 48px 64px;
        border: 1px solid #23272d;
        border-radius: 12px;
        background: #12151a;
      }
      .icon {
        width: 56px;
        height: 56px;
        margin: 0 auto 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 28px;
        color: #fff;
        background: ${ok ? "#1f883d" : "#cf222e"};
      }
      h1 {
        margin: 0 0 8px;
        font-size: 20px;
        font-weight: 600;
      }
      p {
        margin: 0;
        font-size: 14px;
        color: #9aa1a9;
      }
      .brand {
        margin-top: 24px;
        font-size: 12px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #6b727a;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="icon">${ok ? "✓" : "✗"}</div>
      <h1>${ok ? "Signed in successfully" : "Sign-in failed"}</h1>
      <p>You can close this tab and return to your terminal.</p>
      <div class="brand">Revenexx CLI</div>
    </div>
  </body>
</html>`;

export interface LoopbackCapture {
  redirectUri: string;
  /** Resolves with the authorization code once the browser is redirected back. */
  waitForCode: () => Promise<string>;
  close: () => void;
}

/**
 * Start a loopback HTTP server to receive the OAuth redirect. The port and
 * path are taken from `redirectUri`, which must exactly match the redirect URI
 * registered on the Zitadel application. The returned `waitForCode` validates
 * the `state`, serves a small "you can close this tab" page, and resolves with
 * the captured `code`.
 */
export const runLoopbackCapture = async (
  expectedState: string,
  redirectUri: string,
): Promise<LoopbackCapture> => {
  const parsed = new URL(redirectUri);
  const port = Number(parsed.port);
  const callbackPath = parsed.pathname;
  let resolveCode: (code: string) => void;
  let rejectCode: (err: Error) => void;
  const codePromise = new Promise<string>((resolve, reject) => {
    resolveCode = resolve;
    rejectCode = reject;
  });

  const server = http.createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://127.0.0.1");
    if (url.pathname !== callbackPath) {
      res.writeHead(404).end();
      return;
    }
    const error = url.searchParams.get("error");
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    const respond = (ok: boolean): void => {
      res
        .writeHead(200, { "content-type": "text/html; charset=utf-8" })
        .end(callbackPage(ok));
    };

    if (error) {
      respond(false);
      rejectCode(new Error(`Authorization failed: ${error}`));
      return;
    }
    if (!state || state !== expectedState) {
      respond(false);
      rejectCode(new Error("State mismatch — possible CSRF, aborting."));
      return;
    }
    if (!code) {
      respond(false);
      rejectCode(new Error("No authorization code returned."));
      return;
    }
    respond(true);
    resolveCode(code);
  });

  // A dropped/malformed connection (the browser closing the tab, a port scan,
  // a reset socket when we tear the server down) must never crash the CLI.
  server.on("clientError", (_err, socket) => socket.destroy());

  await new Promise<void>((resolve, reject) => {
    // Bind to loopback only, on the fixed port from the registered redirect URI.
    server.once("error", (err: NodeJS.ErrnoException) => {
      reject(
        err.code === "EADDRINUSE"
          ? new Error(
              `Port ${port} is already in use — close whatever is listening on it and try \`login\` again.`,
            )
          : err,
      );
    });
    server.listen(port, "127.0.0.1", resolve);
  });

  // After listen succeeds, swallow late socket-level errors (e.g. ECONNRESET
  // from destroying keep-alive sockets in close()) instead of letting them
  // bubble up as an unhandled 'error' event.
  server.on("error", () => {});

  return {
    redirectUri,
    waitForCode: () => codePromise,
    close: () => {
      // close() alone leaves keep-alive sockets (the browser holds one open for
      // the response page) — destroy them so the process can exit promptly.
      server.closeAllConnections?.();
      server.close();
    },
  };
};

/**
 * Open the user's default browser at `url`. Best-effort: if the launcher fails
 * (e.g. headless environment), the caller should still have printed the URL.
 */
export const openBrowser = (url: string): void => {
  const platform = process.platform;
  const [cmd, args] =
    platform === "darwin"
      ? ["open", [url]]
      : platform === "win32"
        ? ["cmd", ["/c", "start", "", url]]
        : ["xdg-open", [url]];
  try {
    const child = spawn(cmd, args as string[], {
      stdio: "ignore",
      detached: true,
    });
    child.on("error", () => {
      /* Ignore — the URL was already printed for manual opening. */
    });
    child.unref();
  } catch {
    /* Ignore — the URL was already printed for manual opening. */
  }
};

export interface JwtClaims {
  email?: string;
  preferred_username?: string;
  name?: string;
  sub?: string;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Best-effort decode of a JWT payload for display (e.g. the signed-in email).
 * Does NOT verify the signature — the gateway is the source of truth on auth.
 */
export const decodeJwtClaims = (jwt: string): JwtClaims | null => {
  const parts = jwt.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = Buffer.from(parts[1], "base64url").toString("utf-8");
    return JSON.parse(payload) as JwtClaims;
  } catch {
    return null;
  }
};
