import { describe, expect, it } from "vitest";
import {
  canonical,
  enumerateFieldPaths,
  formatResolved,
  parseFieldPath,
  resolveFieldPath,
  suggestFieldPath,
} from "../lib/watch/field-path.js";

/** The gateway's list shape, as parsePageInfo reads it. */
const envelope = {
  items: [
    { id: "a", status: "processing" },
    { id: "b", status: "done" },
  ],
  page: { limit: 25, offset: 0, total: 2, returned: 2, hasMore: false },
};

const record = { id: "imp_1", status: "processing", error: null, retries: 0 };

describe("resolveFieldPath", () => {
  it("walks objects, arrays and array length", () => {
    expect(resolveFieldPath(envelope, "items.0.status")).toEqual({
      kind: "value",
      value: "processing",
    });
    expect(resolveFieldPath(envelope, "page.total")).toEqual({
      kind: "value",
      value: 2,
    });
    expect(resolveFieldPath(envelope, "page.hasMore")).toEqual({
      kind: "value",
      value: false,
    });
    expect(resolveFieldPath(envelope, "items.length")).toEqual({
      kind: "value",
      value: 2,
    });
  });

  it("does NOT descend implicitly into a list envelope", () => {
    // A page has as many statuses as it has rows; picking [0] would depend on
    // a gateway sort the CLI neither controls nor shows. Pinned so nobody
    // "helpfully" adds the shortcut later.
    expect(resolveFieldPath(envelope, "status")).toEqual({
      kind: "missing",
      at: "status",
    });
  });

  it("keeps missing, null and undefined distinguishable", () => {
    expect(resolveFieldPath(record, "error")).toEqual({
      kind: "value",
      value: null,
    });
    expect(resolveFieldPath({ error: undefined }, "error")).toEqual({
      kind: "value",
      value: undefined,
    });
    expect(resolveFieldPath(record, "nope")).toEqual({
      kind: "missing",
      at: "nope",
    });
  });

  it("reads own properties only", () => {
    for (const path of ["constructor", "toString", "__proto__", "hasOwnProperty"]) {
      expect(resolveFieldPath(record, path).kind).toBe("missing");
    }
  });

  it("reports the failing segment, not the whole path", () => {
    expect(resolveFieldPath(envelope, "page.nope.deeper")).toEqual({
      kind: "missing",
      at: "page.nope",
    });
    expect(resolveFieldPath(envelope, "items.99")).toEqual({
      kind: "missing",
      at: "items.99",
    });
  });

  it("misses rather than throwing on untraversable nodes", () => {
    expect(resolveFieldPath(envelope, "items.status").kind).toBe("missing");
    expect(resolveFieldPath({ a: null }, "a.b").kind).toBe("missing");
    expect(resolveFieldPath({ a: "abc" }, "a.0").kind).toBe("missing");
    expect(resolveFieldPath({ a: 1 }, "a.b").kind).toBe("missing");
    expect(resolveFieldPath(undefined, "status").kind).toBe("missing");
    expect(resolveFieldPath("not json", "status").kind).toBe("missing");
    // Negative indices are deliberately unsupported: not all digits.
    expect(resolveFieldPath(envelope, "items.-1").kind).toBe("missing");
  });

  it("treats an empty path as the whole payload", () => {
    expect(resolveFieldPath(record, "")).toEqual({
      kind: "value",
      value: record,
    });
    expect(resolveFieldPath(record, "   ")).toEqual({
      kind: "value",
      value: record,
    });
  });

  it("rejects malformed paths", () => {
    for (const path of ["a..b", ".a", "a."]) {
      expect(parseFieldPath(path)).toBeNull();
      expect(resolveFieldPath(record, path)).toEqual({
        kind: "missing",
        at: path,
      });
    }
  });
});

describe("canonical", () => {
  it("stringifies scalars to what a user would type at the flag", () => {
    expect(canonical(null)).toBe("null");
    expect(canonical(undefined)).toBe("undefined");
    expect(canonical(200)).toBe("200");
    expect(canonical(true)).toBe("true");
    expect(canonical("ready")).toBe("ready");
  });

  it("gives containers stable JSON", () => {
    expect(canonical([1, 2])).toBe("[1,2]");
    expect(canonical({ a: 1 })).toBe('{"a":1}');
  });
});

describe("suggestFieldPath", () => {
  it("prefers page.total for a list and a state key for a record", () => {
    expect(suggestFieldPath(envelope)).toBe("page.total");
    expect(suggestFieldPath(record)).toBe("status");
    expect(suggestFieldPath({ phase: "x" })).toBe("phase");
    expect(suggestFieldPath({ id: "x" })).toBeNull();
    expect(suggestFieldPath("nope")).toBeNull();
  });
});

describe("enumerateFieldPaths", () => {
  it("offers the paths a wizard can show, one element deep into arrays", () => {
    const paths = enumerateFieldPaths(envelope);
    expect(paths).toContain("items");
    expect(paths).toContain("items.length");
    expect(paths).toContain("items.0.status");
    expect(paths).toContain("page.total");
    // Only the first element: the shape repeats.
    expect(paths).not.toContain("items.1.status");
  });

  it("caps the result", () => {
    const wide: Record<string, number> = {};
    for (let index = 0; index < 500; index += 1) wide[`k${index}`] = index;
    expect(enumerateFieldPaths(wide, { maxPaths: 10 }).length).toBe(10);
  });
});

describe("formatResolved", () => {
  it("renders a miss as an em dash and truncates long values", () => {
    expect(formatResolved(null)).toBe("—");
    expect(formatResolved({ kind: "missing", at: "x" })).toBe("—");
    expect(formatResolved({ kind: "value", value: "ready" })).toBe("ready");
    expect(formatResolved({ kind: "value", value: "x".repeat(80) }, 10)).toBe(
      `${"x".repeat(9)}…`,
    );
  });
});
