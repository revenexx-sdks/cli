import { describe, it, expect } from "vitest";
import { authHint } from "../lib/parser.js";

describe("authHint", () => {
  it("hints on locally-thrown 'Session not found'", () => {
    const tip = authHint(new Error("Session not found. Please run …"));
    expect(tip).toMatch(/login/);
    expect(tip).toMatch(/REVENEXX_API_KEY/);
  });

  it("hints on locally-thrown 'Project is not set'", () => {
    const tip = authHint(new Error("Project is not set."));
    expect(tip).toMatch(/login/);
  });

  it("hints on locally-thrown 'No API token found'", () => {
    const tip = authHint(new Error("No API token found."));
    expect(tip).toMatch(/login/);
  });

  it("hints on 401 user_unauthorized", () => {
    const tip = authHint({
      code: 401,
      type: "user_unauthorized",
      message: "The current user is not authorized…",
    });
    expect(tip).toMatch(/authentication failed/i);
  });

  it("hints on expired JWT", () => {
    const tip = authHint({
      code: 401,
      type: "user_jwt_invalid",
      message: "JWT token is invalid",
    });
    expect(tip).toMatch(/expired/);
    expect(tip).toMatch(/--browser/);
  });

  it("hints on scope-error variants", () => {
    const tip = authHint({
      code: 401,
      type: "general_unauthorized_scope",
      message: "Missing scopes",
    });
    expect(tip).toMatch(/scope/);
  });

  it("returns null for non-auth errors (404 project not found)", () => {
    const tip = authHint({
      code: 404,
      type: "project_not_found",
      message: "Project with the requested ID could not be found.",
    });
    expect(tip).toBeNull();
  });

  it("returns null for plain Error without auth markers", () => {
    expect(authHint(new Error("Network unreachable"))).toBeNull();
  });
});
