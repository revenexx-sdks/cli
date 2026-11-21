import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import {
  CUBE_DOCUMENTS,
  compileCubeSchemas,
  lintCubeDirectory,
  lintCubeRelease,
  loadCubeSchemas,
  registryPath,
  validRange,
} from "../lib/commands/cube-lint.js";

/**
 * `cube lint`: the registry's checks on a Cube release, run locally. The
 * schemas here are small stand-ins (the rules after the schema check do not
 * depend on them); one test feeds a real constraint through to show schema
 * findings land in the registry's `{document, path, message}` shape.
 */

const permissive = Object.fromEntries(CUBE_DOCUMENTS.map((d) => [d, {}]));
const checks = compileCubeSchemas(permissive);

/** A small Cube that passes: one file dataset, one metric, a billing.json. */
const release = (): Record<string, unknown> => ({
  "cube.json": {
    vendor: "acme",
    name: "holidays",
    version: "1.0.0",
    requires: { orders: "^3.0" },
    data: [{ file: "data/holidays-de.csv", dataset: "holidays" }],
  },
  "analytics.json": {
    datasets: [
      {
        name: "holidays",
        source: { file: "data/holidays-de.csv" },
        columns: [
          { name: "day", type: "date" },
          { name: "label", type: "text" },
          { name: "contact", type: "text", pii: true },
        ],
      },
    ],
  },
  "metrics.json": {
    metrics: [{ key: "holiday_count", dataset: "holidays", expr: "day + 1" }],
    dimensions: [{ key: "label", dataset: "holidays", column: "label", ai_safe: true }],
  },
  "billing.json": { type: "free", support: { email: "help@acme.example" } },
  "data/holidays-de.csv": "day,label,contact\n2026-12-25,Weihnachten,\n",
});

const messages = (r: { problems: { message: string }[] }) => r.problems.map((p) => p.message);

describe("lintCubeRelease", () => {
  it("passes a well-formed Cube", () => {
    const result = lintCubeRelease(release(), checks);
    expect(result.cube).toBe("acme/holidays@1.0.0");
    expect(result.problems).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it("reports schema findings in the registry's shape", () => {
    const strict = compileCubeSchemas({
      ...permissive,
      cube: { type: "object", properties: { data: { type: "array", items: { type: "object", required: ["file", "dataset"] } } } },
    });
    const files = release();
    (files["cube.json"] as { data: unknown[] }).data.push({ file: "data/x.csv" });
    const result = lintCubeRelease(files, strict);
    expect(result.problems).toContainEqual({ document: "cube.json", path: "data[1]", message: "must have required property 'dataset'" });
  });

  it("refuses SQL anywhere: a query source, a sql key, a formula outside the grammar", () => {
    const files = release();
    const analytics = files["analytics.json"] as { datasets: { source: Record<string, unknown> }[] };
    analytics.datasets.push({ name: "orders_raw", source: { query: "select * from orders" } } as never);
    (files["metrics.json"] as { metrics: Record<string, unknown>[] }).metrics.push(
      { key: "bad", dataset: "holidays", expr: "sum(day); drop table x" },
      { key: "raw", dataset: "holidays", sql: "select 1" },
    );
    const result = lintCubeRelease(files, checks);
    expect(result.problems).toContainEqual({ document: "analytics.json", path: "datasets[1].source.query", message: "a Cube ships no SQL; read a table or an endpoint" });
    expect(result.problems).toContainEqual({ document: "metrics.json", path: "metrics[1].expr", message: "only names, numbers, + - * / and parentheses; a Cube ships no SQL" });
    expect(result.problems).toContainEqual({ document: "metrics.json", path: "metrics[2].sql", message: "a Cube ships no SQL" });
  });

  it("checks data files against cube.json and analytics.json", () => {
    const files = release();
    delete files["data/holidays-de.csv"];
    files["data/extra.csv"] = "a\n1\n";
    (files["cube.json"] as { data: unknown[] }).data.push({ file: "data/big.parquet", dataset: "nope" });
    const result = lintCubeRelease(files, checks);
    expect(messages(result)).toEqual(expect.arrayContaining([
      "'data/holidays-de.csv' is missing",
      "Parquet files are not loaded yet; ship CSV",
      "analytics.json declares no dataset 'nope'",
      "not listed in cube.json data",
    ]));
  });

  it("checks functions, connections, views and table names", () => {
    const files = release();
    const cube = files["cube.json"] as Record<string, unknown>;
    cube.functions = [{ key: "fetch", dataset: "rates" }];
    const analytics = files["analytics.json"] as Record<string, unknown[]>;
    analytics.views = [{ name: "v" }];
    analytics.datasets.push(
      { name: "rates", source: { function: "other" }, columns: [] },
      { name: "ads", source: { connection: "google" }, columns: [] },
      { name: "a_dataset_name_that_is_much_too_long_for_one_table", source: {}, columns: [] },
    );
    const result = lintCubeRelease(files, checks);
    expect(messages(result)).toEqual(expect.arrayContaining([
      "a Cube declares datasets, not views",
      "dataset 'rates' is not filled by function 'fetch'",
      "cube.json declares no function 'other'",
      "cube.json declares no connection 'google'",
      "table name 'acme__holidays__a_dataset_name_that_is_much_too_long_for_one_table' is longer than 63 characters",
    ]));
  });

  it("checks requires: readable ranges, never itself", () => {
    const files = release();
    (files["cube.json"] as Record<string, unknown>).requires = { orders: "three", holidays: "^1.0" };
    const result = lintCubeRelease(files, checks);
    expect(result.problems).toContainEqual({ document: "cube.json", path: "requires.orders", message: "'three' is not a semver range" });
    expect(result.problems).toContainEqual({ document: "cube.json", path: "requires.holidays", message: "a Cube cannot require itself" });
  });

  it("warns where ai_safe has no effect, and about the marketplace listing", () => {
    const files = release();
    (files["metrics.json"] as { dimensions: unknown[] }).dimensions.push(
      { key: "contact", dataset: "holidays", column: "contact", ai_safe: true },
      { key: "market", dataset: "holidays", column: "label", lookup: "markets.markets", ai_safe: true },
    );
    delete files["billing.json"];
    const result = lintCubeRelease(files, checks);
    expect(result.problems).toEqual([]);
    expect(result.warnings.map((w) => `${w.document} ${w.path}`)).toEqual([
      "metrics.json dimensions[1].ai_safe",
      "metrics.json dimensions[2].ai_safe",
      "billing.json ",
    ]);
  });

  it("says so when there is no cube.json", () => {
    expect(messages(lintCubeRelease({}, checks))).toEqual(["the Cube has no cube.json"]);
  });
});

describe("validRange", () => {
  it("reads the ranges the registry reads", () => {
    for (const r of ["1.2.3", "=1.2.3", "v1.2.3", "^3.0", "~1.2", ">=1.2 <2", "1.x", "*", "1.2 - 2.0", "^1 || ^2", ">= 1.4"]) {
      expect(validRange(r), r).toBe(true);
    }
    for (const r of ["", "three", "^", "1.2.3.4", ">=a"]) expect(validRange(r), r).toBe(false);
  });
});

describe("registryPath", () => {
  it("turns an instance path into the registry's notation", () => {
    expect(registryPath("/data/0/file")).toBe("data[0].file");
    expect(registryPath("")).toBe("");
    expect(registryPath("/requires/a~1b")).toBe("requires.a/b");
  });
});

describe("lintCubeDirectory", () => {
  let dir: string;
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "cube-lint-"));
  });
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  const writeCube = (root: string): void => {
    for (const [name, content] of Object.entries(release())) {
      fs.mkdirSync(path.dirname(path.join(root, name)), { recursive: true });
      fs.writeFileSync(path.join(root, name), typeof content === "string" ? content : JSON.stringify(content));
    }
  };

  it("reads the directory and the schemas from a local directory", async () => {
    writeCube(dir);
    const schemas = path.join(dir, "schemas");
    fs.mkdirSync(schemas);
    for (const doc of CUBE_DOCUMENTS) fs.writeFileSync(path.join(schemas, `${doc}.schema.json`), "{}");
    const result = await lintCubeDirectory(dir, { schemas });
    expect(result.cube).toBe("acme/holidays@1.0.0");
    expect(result.problems).toEqual([]);
  });

  it("fetches the published schemas by default", async () => {
    writeCube(dir);
    const asked: string[] = [];
    const fetchImpl = (async (url: string) => {
      asked.push(url);
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;
    await lintCubeDirectory(dir, { fetchImpl });
    expect(asked).toEqual(CUBE_DOCUMENTS.map((d) => `https://schemas.revenexx.com/${d}.schema.json`));
  });

  it("names a document that is not JSON", async () => {
    writeCube(dir);
    fs.writeFileSync(path.join(dir, "metrics.json"), "{ not json");
    const result = await lintCubeDirectory(dir, { fetchImpl: (async () => new Response("{}")) as unknown as typeof fetch });
    expect(result.problems[0]).toMatchObject({ document: "metrics.json", path: "" });
    expect(result.problems[0].message).toMatch(/^not valid JSON/);
  });

  it("says what to do when the schemas cannot be fetched", async () => {
    writeCube(dir);
    await expect(loadCubeSchemas(undefined, (async () => new Response("", { status: 503 })) as unknown as typeof fetch))
      .rejects.toThrow(/HTTP 503.*--schemas <dir>/);
  });

  it("refuses a directory without cube.json", async () => {
    await expect(lintCubeDirectory(dir)).rejects.toThrow(/not a Cube directory/);
  });
});
