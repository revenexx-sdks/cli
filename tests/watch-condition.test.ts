import { describe, expect, it } from "vitest";
import {
  evaluateCondition,
  formatCondition,
  parseCondition,
  parseUntil,
} from "../lib/watch/condition.js";
import type { Resolved, WatchCondition } from "../lib/watch/types.js";

const value = (v: unknown): Resolved => ({ kind: "value", value: v });
const missing: Resolved = { kind: "missing", at: "status" };

/** Parse or fail the test — every case below expects a valid condition. */
const condition = (text: string): WatchCondition => {
  const parsed = parseCondition(text);
  if (!parsed.ok) throw new Error(`expected \`${text}\` to parse: ${parsed.error}`);
  return parsed.condition as WatchCondition;
};

describe("parseCondition", () => {
  it("accepts every keyword and the shorthands", () => {
    expect(condition("changed").kind).toBe("changed");
    expect(condition("truthy").kind).toBe("truthy");
    expect(condition("equals ready").kind).toBe("equals");
    expect(condition("= ready").kind).toBe("equals");
    expect(condition("== ready").kind).toBe("equals");
    expect(condition("matches ^rea").kind).toBe("matches");
    expect(condition("~ ^rea").kind).toBe("matches");
    expect(condition("terminal").kind).toBe("terminal");
  });

  it("rejects arguments the keyword does not take", () => {
    expect(parseCondition("changed ready").ok).toBe(false);
    expect(parseCondition("truthy 1").ok).toBe(false);
    expect(parseCondition("equals").ok).toBe(false);
    expect(parseCondition("matches").ok).toBe(false);
    expect(parseCondition("").ok).toBe(false);
  });

  it("names the alternatives when the keyword is unknown", () => {
    const parsed = parseCondition("becomes ready");
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain("becomes");
    expect(parsed.error).toContain("terminal");
  });

  it("strips quotes around an equals operand", () => {
    expect(condition('equals "in progress"')).toMatchObject({
      raw: "in progress",
      value: "in progress",
    });
  });
});

describe("matches", () => {
  it("strips g and y so test() stays stateless across polls", () => {
    const matcher = condition("matches /ready/gi");
    expect(matcher).toMatchObject({ source: "ready", flags: "i" });
    // The regression: with `g`, RegExp.test advances lastIndex, so the *same*
    // value would alternate true/false between polls.
    expect(evaluateCondition(matcher, value("READY"), null)).toBe(true);
    expect(evaluateCondition(matcher, value("READY"), null)).toBe(true);
    expect(evaluateCondition(matcher, value("READY"), null)).toBe(true);
  });

  it("accepts a bare pattern as well as /pattern/flags", () => {
    expect(condition("matches ^dep_")).toMatchObject({
      source: "^dep_",
      flags: "",
    });
  });

  it("reports a bad pattern at parse time rather than throwing later", () => {
    const parsed = parseCondition("matches [");
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toContain("invalid regex");
  });
});

describe("equals", () => {
  it("compares on the canonical string, so wire types don't have to be guessed", () => {
    expect(evaluateCondition(condition("equals 200"), value(200), null)).toBe(true);
    expect(evaluateCondition(condition("equals true"), value(true), null)).toBe(true);
    expect(evaluateCondition(condition("equals null"), value(null), null)).toBe(true);
    // Documented consequence of canonical(): the *string* "null" collides with
    // JSON null. `matches` is the escape hatch when that matters.
    expect(evaluateCondition(condition("equals null"), value("null"), null)).toBe(true);
  });

  it("is case-insensitive but echoes back what was typed", () => {
    const eq = condition("equals READY");
    expect(evaluateCondition(eq, value("ready"), null)).toBe(true);
    expect(formatCondition(eq)).toBe("= READY");
  });
});

describe("terminal", () => {
  it("treats separators and case as noise", () => {
    const done = condition("terminal");
    for (const seen of ["TIMED OUT", "timed-out", "timed_out", "Failed", "done"]) {
      expect(evaluateCondition(done, value(seen), null)).toBe(true);
    }
    expect(evaluateCondition(done, value("processing"), null)).toBe(false);
  });

  it("includes the failure sinks, not just the wins", () => {
    // "Terminal" means stopped moving: a watcher must report the failure, not
    // spin to timeout while the resource sits in `failed`.
    const done = condition("terminal");
    expect(evaluateCondition(done, value("failed"), null)).toBe(true);
    expect(evaluateCondition(done, value("cancelled"), null)).toBe(true);
  });

  it("takes a custom set and round-trips it", () => {
    const custom = condition("terminal(ready,failed)");
    expect(custom).toMatchObject({ custom: true, done: ["ready", "failed"] });
    expect(formatCondition(custom)).toBe("terminal(ready,failed)");
    expect(evaluateCondition(custom, value("done"), null)).toBe(false);
    expect(evaluateCondition(custom, value("ready"), null)).toBe(true);
    expect(parseCondition("terminal()").ok).toBe(false);
    expect(parseCondition("terminal ready").ok).toBe(false);
  });
});

describe("truthy", () => {
  it("corrects JS truthiness for values that came over the wire as JSON", () => {
    const t = condition("truthy");
    for (const falsy of [[], {}, "", "false", "0", " FALSE ", 0, null]) {
      expect(evaluateCondition(t, value(falsy), null)).toBe(false);
    }
    for (const truthy of [["x"], { a: 1 }, "ok", 1, true]) {
      expect(evaluateCondition(t, value(truthy), null)).toBe(true);
    }
  });
});

describe("changed", () => {
  it("never fires without a baseline — that poll IS the baseline", () => {
    expect(evaluateCondition(condition("changed"), value("a"), null)).toBe(false);
  });

  it("counts a field appearing or vanishing as a change", () => {
    const c = condition("changed");
    expect(evaluateCondition(c, value("a"), missing)).toBe(true);
    expect(evaluateCondition(c, missing, value("a"))).toBe(true);
    expect(evaluateCondition(c, missing, missing)).toBe(false);
    expect(evaluateCondition(c, value("a"), value("a"))).toBe(false);
    expect(evaluateCondition(c, value("a"), value("b"))).toBe(true);
    expect(evaluateCondition(c, value(1), value("1"))).toBe(false); // canonical
  });
});

describe("a missing field", () => {
  it("is never satisfied by a value condition — it may arrive later", () => {
    for (const text of ["equals ready", "matches .", "terminal", "truthy"]) {
      expect(evaluateCondition(condition(text), missing, null)).toBe(false);
    }
  });
});

describe("parseUntil", () => {
  it("splits a leading field path off the condition", () => {
    expect(parseUntil("status equals ready")).toMatchObject({
      ok: true,
      fieldPath: "status",
    });
    expect(parseUntil("items.0.status terminal")).toMatchObject({
      ok: true,
      fieldPath: "items.0.status",
    });
  });

  it("leaves the field empty when the expression leads with a keyword", () => {
    expect(parseUntil("equals ready")).toMatchObject({ ok: true, fieldPath: "" });
    expect(parseUntil("terminal")).toMatchObject({ ok: true, fieldPath: "" });
    expect(parseUntil("terminal(ready)")).toMatchObject({
      ok: true,
      fieldPath: "",
    });
  });

  it("rejects a malformed field path and a bad condition alike", () => {
    expect(parseUntil("a..b equals x").ok).toBe(false);
    expect(parseUntil("status nonsense x").ok).toBe(false);
    expect(parseUntil("").ok).toBe(false);
  });
});

describe("formatCondition", () => {
  it("renders each kind for the pane and the status line", () => {
    expect(formatCondition(condition("changed"))).toBe("changed");
    expect(formatCondition(condition("truthy"))).toBe("truthy");
    expect(formatCondition(condition("terminal"))).toBe("terminal");
    expect(formatCondition(condition("matches /x/i"))).toBe("~ /x/i");
  });
});
