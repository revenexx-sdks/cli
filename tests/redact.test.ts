import { describe, it, expect } from "vitest";
import { redactSecrets } from "../lib/parser.js";

describe("redactSecrets", () => {
  it("masks `standard_…` API keys", () => {
    expect(
      redactSecrets(
        "X-Revenexx-Api-Key: standard_abcdef1234567890abcdef1234567890abcdef1234567890",
      ),
    ).not.toMatch(/standard_[A-Za-z0-9]{32,}/);
  });

  it("masks gateway `rvxk_…` API keys", () => {
    expect(
      redactSecrets("X-Revenexx-Api-Key: rvxk_dSAPwzbsKXzdW1mKq3bNSH6n3kQ0"),
    ).not.toMatch(/rvxk_[A-Za-z0-9]{16,}/);
  });

  it("masks header forms with `:` and `=`", () => {
    expect(redactSecrets("X-Revenexx-Api-Key: secret123abcdef")).toContain(
      "***",
    );
    expect(redactSecrets("X-Revenexx-Key: secret123abcdef")).toContain("***");
    expect(redactSecrets("X-Revenexx-Cookie=abcdefghijklmnop")).toContain(
      "***",
    );
  });

  it("masks JSON-shaped token / password / secret fields", () => {
    const out = redactSecrets('{"token":"abcdef1234","password":"hunter2"}');
    expect(out).toMatch(/"token":"\*\*\*"/);
    expect(out).toMatch(/"password":"\*\*\*"/);
  });

  it("masks `REVENEXX_API_KEY=...` shell assignments", () => {
    expect(redactSecrets("REVENEXX_API_KEY=standard_xxxxxxxxxxxxxxxxxx")).toBe(
      "REVENEXX_API_KEY=***",
    );
  });

  it("masks `Authorization: Bearer …` JWTs", () => {
    expect(
      redactSecrets("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.foobar123abc"),
    ).toContain("Bearer ***");
  });

  it("leaves plain text untouched", () => {
    const msg = "Project with the requested ID could not be found.";
    expect(redactSecrets(msg)).toBe(msg);
  });

  it("returns empty string for null / undefined", () => {
    expect(redactSecrets(null)).toBe("");
    expect(redactSecrets(undefined)).toBe("");
  });
});
