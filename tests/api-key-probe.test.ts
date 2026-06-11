import { describe, it, expect } from "vitest";
import { classifyApiKeyProbe } from "../lib/commands/generic.js";

describe("classifyApiKeyProbe", () => {
  it("treats null (i.e. the probe returned 200) as ok", () => {
    expect(classifyApiKeyProbe(null, "any-project")).toEqual({ ok: true });
  });

  it("surfaces the gateway's typeless `invalid api key` message", () => {
    const result = classifyApiKeyProbe(
      { code: 401, message: "invalid api key" },
      "revenexx",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("invalid api key");
      expect(result.kind).toBe("invalid-key");
    }
  });

  it("classifies `api key not valid for this tenant` as an invalid tenant", () => {
    const result = classifyApiKeyProbe(
      { code: 401, message: "api key not valid for this tenant" },
      "other-tenant",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("invalid-tenant");
      expect(result.reason).toMatch(/other-tenant/);
    }
  });

  it("classifies `missing X-Revenexx-Tenant` as a missing tenant header", () => {
    const result = classifyApiKeyProbe(
      { code: 400, message: "missing X-Revenexx-Tenant" },
      "revenexx",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("missing-tenant");
  });

  it("treats `general_unauthorized_scope` as ok — the key was recognised", () => {
    const result = classifyApiKeyProbe(
      { code: 401, type: "general_unauthorized_scope", message: "missing scopes" },
      "revenexx",
    );
    expect(result).toEqual({ ok: true });
  });

  it("rejects `user_unauthorized` with the standard reason", () => {
    const result = classifyApiKeyProbe(
      { code: 401, type: "user_unauthorized", message: "not authorized" },
      "revenexx",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/not recognised by the server/);
    }
  });

  it("rejects `project_not_found` with the project id in the message", () => {
    const result = classifyApiKeyProbe(
      { code: 404, type: "project_not_found", message: "no such project" },
      "missing-proj",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/missing-proj/);
      expect(result.reason).toMatch(/not found/);
    }
  });

  it("also accepts the `general_project_not_found` variant", () => {
    const result = classifyApiKeyProbe(
      { code: 404, type: "general_project_not_found" },
      "missing-proj",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/missing-proj/);
  });

  it("falls back to err.type when no specific rule matches", () => {
    const result = classifyApiKeyProbe(
      { code: 500, type: "internal_server_error" },
      "p",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("internal_server_error");
  });

  it("falls back to err.message when err.type is missing", () => {
    const result = classifyApiKeyProbe(new Error("boom"), "p");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/boom/);
  });

  it("returns 'unknown error' on shapeless throws", () => {
    const result = classifyApiKeyProbe({}, "p");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/unknown error/);
  });
});
