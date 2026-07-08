import { describe, it, expect } from "vitest";
import net from "node:net";
import {
  buildAuthorizeUrl,
  decodeJwtClaims,
  generatePkce,
  generateState,
  pkceChallenge,
  runLoopbackCapture,
} from "../lib/oauth.js";
import {
  storeSsoSession,
  type SsoSessionStore,
} from "../lib/commands/generic.js";

describe("generatePkce / pkceChallenge", () => {
  it("derives the S256 challenge for the RFC 7636 test vector", () => {
    // RFC 7636 Appendix B.
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(pkceChallenge(verifier)).toBe(
      "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM",
    );
  });

  it("produces a URL-safe verifier of valid length and a matching challenge", () => {
    const { verifier, challenge } = generatePkce();
    expect(verifier).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(verifier.length).toBeGreaterThanOrEqual(43);
    expect(verifier.length).toBeLessThanOrEqual(128);
    expect(challenge).toMatch(/^[A-Za-z0-9\-_]+$/);
    expect(challenge).toBe(pkceChallenge(verifier));
  });

  it("generates distinct verifiers and state values each call", () => {
    expect(generatePkce().verifier).not.toBe(generatePkce().verifier);
    expect(generateState()).not.toBe(generateState());
  });
});

describe("buildAuthorizeUrl", () => {
  it("includes all required PKCE / OAuth2 query parameters", () => {
    const url = new URL(
      buildAuthorizeUrl({
        authorizeEndpoint: "https://id.revenexx.com/oauth/v2/authorize",
        clientId: "cli-client",
        redirectUri: "http://127.0.0.1:51234/callback",
        challenge: "the-challenge",
        state: "the-state",
        scopes: "openid profile email offline_access",
      }),
    );
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("client_id")).toBe("cli-client");
    expect(url.searchParams.get("redirect_uri")).toBe(
      "http://127.0.0.1:51234/callback",
    );
    expect(url.searchParams.get("scope")).toBe(
      "openid profile email offline_access",
    );
    expect(url.searchParams.get("state")).toBe("the-state");
    expect(url.searchParams.get("code_challenge")).toBe("the-challenge");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  });
});

describe("decodeJwtClaims", () => {
  it("decodes the payload of a (unsigned) JWT", () => {
    const payload = { email: "dev@revenexx.com", sub: "user-123", exp: 9999 };
    const b64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
    const jwt = `header.${b64}.signature`;
    expect(decodeJwtClaims(jwt)).toMatchObject(payload);
  });

  it("returns null for malformed tokens", () => {
    expect(decodeJwtClaims("not-a-jwt")).toBeNull();
    expect(decodeJwtClaims("a.!!!notbase64json!!!.c")).toBeNull();
  });
});

describe("runLoopbackCapture", () => {
  // Grab a free loopback port so the fixed-port binding doesn't clash.
  const freePort = (): Promise<number> =>
    new Promise((resolve, reject) => {
      const srv = net.createServer();
      srv.once("error", reject);
      srv.listen(0, "127.0.0.1", () => {
        const { port } = srv.address() as net.AddressInfo;
        srv.close(() => resolve(port));
      });
    });

  const setup = async (state = "st8") => {
    const port = await freePort();
    const cap = await runLoopbackCapture(state, `http://127.0.0.1:${port}/callback`);
    return { port, cap, base: `http://127.0.0.1:${port}/callback` };
  };

  it("resolves with the code when the state matches", async () => {
    const { cap, base } = await setup();
    const codeP = cap.waitForCode();
    await fetch(`${base}?code=abc123&state=st8`);
    await expect(codeP).resolves.toBe("abc123");
    cap.close();
  });

  it("rejects on a state mismatch (CSRF defense)", async () => {
    const { cap, base } = await setup();
    // Attach the rejection handler before triggering the callback.
    const assertion = expect(cap.waitForCode()).rejects.toThrow(/state mismatch/i);
    await fetch(`${base}?code=abc123&state=WRONG`);
    await assertion;
    cap.close();
  });

  it("rejects when the IdP reports an error", async () => {
    const { cap, base } = await setup();
    const assertion = expect(cap.waitForCode()).rejects.toThrow(/access_denied/);
    await fetch(`${base}?error=access_denied&state=st8`);
    await assertion;
    cap.close();
  });

  it("rejects when no code is returned", async () => {
    const { cap, base } = await setup();
    const assertion = expect(cap.waitForCode()).rejects.toThrow(
      /no authorization code/i,
    );
    await fetch(`${base}?state=st8`);
    await assertion;
    cap.close();
  });

  it("404s on an unexpected path", async () => {
    const { cap, port } = await setup();
    const res = await fetch(`http://127.0.0.1:${port}/nope`);
    expect(res.status).toBe(404);
    cap.close();
  });
});

describe("storeSsoSession", () => {
  // In-memory fake of the global session store (mirrors the per-session
  // setters on the real Global config without touching disk).
  const makeStore = () => {
    const record: Record<string, unknown> = {};
    const store: SsoSessionStore = {
      addSession: (id, data) => {
        record.id = id;
        record.endpoint = data.endpoint;
      },
      setCurrentSession: (id) => (record.current = id),
      setEndpoint: (e) => (record.endpoint = e),
      setJWT: (j) => (record.jwt = j),
      setRefreshToken: (r) => (record.refreshToken = r),
      setJwtExpires: (n) => (record.jwtExpiresAt = n),
      setEmail: (e) => (record.email = e),
      setAuthMethod: (m) => (record.authMethod = m),
    };
    return { store, record };
  };

  it("persists the JWT session and marks it current", () => {
    const { store, record } = makeStore();
    const id = storeSsoSession(store, {
      endpoint: "https://api.revenexx.com/v1",
      jwt: "the-jwt",
      refreshToken: "the-refresh",
      expiresAt: 1234567890,
      email: "dev@revenexx.com",
    });

    expect(id).toBeTruthy();
    expect(record.current).toBe(id);
    expect(record.endpoint).toBe("https://api.revenexx.com/v1");
    expect(record.jwt).toBe("the-jwt");
    expect(record.refreshToken).toBe("the-refresh");
    expect(record.jwtExpiresAt).toBe(1234567890);
    expect(record.email).toBe("dev@revenexx.com");
    expect(record.authMethod).toBe("sso");
  });

  it("defaults the email to 'sso' and skips optional fields when absent", () => {
    const { store, record } = makeStore();
    storeSsoSession(store, {
      endpoint: "https://api.revenexx.com/v1",
      jwt: "the-jwt",
    });
    expect(record.email).toBe("sso");
    expect(record.refreshToken).toBeUndefined();
    expect(record.jwtExpiresAt).toBeUndefined();
  });
});
