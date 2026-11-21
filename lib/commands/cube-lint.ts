/**
 * `revenexx cube lint` — check a Cube the way the Cube registry checks a
 * release, before anything is uploaded.
 *
 * A Cube is its six documents (cube.json and the four analytics files plus
 * billing.json) and the CSV data files cube.json lists. Each document is
 * validated against its published schema (https://schemas.revenexx.com), then
 * across documents with the rules the registry applies to every release:
 *
 *   - every `data[]` file is shipped and fills a dataset whose source is that
 *     file; every file dataset is listed in `data[]`; no Parquet yet
 *   - every function fills a dataset that exists, and every function dataset
 *     names a function that exists; a connection dataset names a connection
 *     cube.json declares
 *   - a Cube declares datasets, not views
 *   - every stored dataset's table name fits in 63 characters
 *   - `requires` holds readable semver ranges, and a Cube does not require itself
 *   - no SQL: metric formulas use names, numbers, + - * / and parentheses
 *     only, no dataset source is a query, and no document has a `sql` key
 *
 * A release with any of these problems is refused as a whole. What needs the
 * registry itself (the version is new, the name belongs to this vendor and is
 * no app's name, a new version changes no column type) is checked when the
 * release is uploaded.
 *
 * Warnings do not refuse a release; they name what the platform will quietly
 * ignore or what a listing will miss: `ai_safe` on a dimension where it has
 * no effect (a personal-data column, a lookup, a grain), and a missing
 * billing.json or support contact.
 *
 * Pure apart from reading the directory and fetching the schemas, so the
 * rules run in tests without a network.
 */
import fs from "node:fs";
import path from "node:path";
import { Ajv2020 } from "ajv/dist/2020.js";
import ajvFormats from "ajv-formats";

// ajv-formats is CommonJS: under Node's ESM interop its default export is the
// module object, whose own `default` is the plugin; a bundle hands over the
// plugin itself.
type FormatsPlugin = (ajv: Ajv2020) => Ajv2020;
const addFormats: FormatsPlugin =
  ((ajvFormats as unknown as { default?: FormatsPlugin }).default ?? (ajvFormats as unknown as FormatsPlugin));

export const CUBE_DOCUMENTS = ["cube", "analytics", "metrics", "reports", "dashboards", "billing"] as const;
export type CubeDocument = (typeof CUBE_DOCUMENTS)[number];

export const DEFAULT_SCHEMAS_BASE = "https://schemas.revenexx.com";

/** The same 25 MB the registry accepts per data file. */
export const MAX_DATA_BYTES = 25 * 1024 * 1024;

/** One finding, in the registry's shape. */
export interface CubeProblem {
  document: string;
  path: string;
  message: string;
}

export interface CubeLintResult {
  /** `vendor/name@version`, when cube.json names them. */
  cube: string | null;
  problems: CubeProblem[];
  warnings: CubeProblem[];
}

type Json = Record<string, unknown>;

/** A document's schema check: the findings, empty when it is valid. */
export type SchemaCheck = (document: unknown) => { path: string; message: string }[];

const DATA_FILE = /^(?!\/)(?!.*\.\.)[A-Za-z0-9_./-]+\.csv$/;
const FORMULA =
  /^(?:\s*(?:[0-9]+(?:\.[0-9]+)?|(?:[a-z][a-z0-9]*(?:-[a-z0-9]+)*\.)?[a-z][a-z0-9_]*|[-+*/()]))+\s*$/;
const MAX_TABLE_NAME = 63;

const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const objects = (v: unknown): Json[] => list(v).filter(isObject);
const text = (v: unknown): string | null => (typeof v === "string" ? v : null);

// ── semver ranges, as the registry reads `requires` ─────────────────────────

const PARTIAL = /^v?(\d+|[xX*])(?:\.(\d+|[xX*]))?(?:\.(\d+|[xX*]))?(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const COMPARATOR = /^(<=|>=|<|>|=|\^|~)?\s*(\S+)$/;

/**
 * Whether the registry can read `range`: exact versions, comparators,
 * caret, tilde, x-ranges and partial versions, hyphen ranges and `||`.
 */
export function validRange(range: unknown): boolean {
  if (typeof range !== "string" || !range.trim()) return false;
  for (const alt of range.split("||")) {
    let tokens = alt.trim().replace(/(<=|>=|<|>|=|\^|~)\s+/g, "$1").split(/\s+/).filter(Boolean);
    if (!tokens.length) return false;
    if (tokens.length === 3 && tokens[1] === "-") tokens = [`>=${tokens[0]}`, `<=${tokens[2]}`];
    for (const token of tokens) {
      const m = COMPARATOR.exec(token);
      if (!m || !PARTIAL.test(m[2])) return false;
    }
  }
  return true;
}

// ── schemas ──────────────────────────────────────────────────────────────────

/**
 * The six schemas from `source`: a base URL (the published schemas by
 * default) or a directory holding `<document>.schema.json`, such as the
 * `schemas/` a Cube repo vendors for working offline.
 */
export async function loadCubeSchemas(
  source: string = DEFAULT_SCHEMAS_BASE,
  fetchImpl: typeof fetch = fetch,
): Promise<Record<CubeDocument, Json>> {
  const out = {} as Record<CubeDocument, Json>;
  const remote = /^https?:\/\//.test(source);
  for (const doc of CUBE_DOCUMENTS) {
    const file = `${doc}.schema.json`;
    if (remote) {
      const url = `${source.replace(/\/+$/, "")}/${file}`;
      let response: Response;
      try {
        response = await fetchImpl(url);
      } catch (err) {
        throw new Error(`could not fetch ${url} (${err instanceof Error ? err.message : String(err)}) — pass --schemas <dir> to lint against local copies`);
      }
      if (!response.ok) throw new Error(`could not fetch ${url} (HTTP ${response.status}) — pass --schemas <dir> to lint against local copies`);
      out[doc] = (await response.json()) as Json;
    } else {
      const abs = path.resolve(source, file);
      if (!fs.existsSync(abs)) throw new Error(`${abs} is missing — the schema directory needs all six schemas`);
      out[doc] = JSON.parse(fs.readFileSync(abs, "utf8")) as Json;
    }
  }
  return out;
}

/** Turn an instance path (`/data/0/file`) into the registry's `data[0].file`. */
export function registryPath(instancePath: string): string {
  let out = "";
  for (const raw of instancePath.split("/").slice(1)) {
    const part = raw.replace(/~1/g, "/").replace(/~0/g, "~");
    out += /^\d+$/.test(part) ? `[${part}]` : out ? `.${part}` : part;
  }
  return out;
}

/** Compile the schemas (JSON Schema 2020-12, with formats). */
export function compileCubeSchemas(schemas: Record<string, Json>): Record<string, SchemaCheck> {
  const ajv = new Ajv2020({ strict: false, allErrors: true });
  addFormats(ajv);
  const checks: Record<string, SchemaCheck> = {};
  for (const [doc, schema] of Object.entries(schemas)) {
    const validate = ajv.compile(schema);
    checks[doc] = (document) => {
      if (validate(document)) return [];
      return (validate.errors ?? []).map((e) => {
        const extra = (e.params as { additionalProperty?: string } | undefined)?.additionalProperty;
        return { path: registryPath(e.instancePath), message: `${e.message ?? "is not valid"}${extra ? ` (${extra})` : ""}` };
      });
    };
  }
  return checks;
}

// ── reading a Cube directory ─────────────────────────────────────────────────

/**
 * The release a directory would make: the documents it has, and the data
 * files cube.json lists (read from disk). A document that is not JSON is a
 * problem; a listed data file that is missing is left out, and the rules
 * report it.
 */
export function readCubeRelease(root: string): { files: Record<string, unknown>; problems: CubeProblem[] } {
  const files: Record<string, unknown> = {};
  const problems: CubeProblem[] = [];
  for (const doc of CUBE_DOCUMENTS) {
    const file = path.join(root, `${doc}.json`);
    if (!fs.existsSync(file)) continue;
    try {
      files[`${doc}.json`] = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      problems.push({ document: `${doc}.json`, path: "", message: `not valid JSON: ${err instanceof Error ? err.message : String(err)}` });
    }
  }
  const cube = files["cube.json"];
  for (const entry of objects(isObject(cube) ? cube.data : [])) {
    const name = text(entry.file);
    if (!name || !DATA_FILE.test(name)) continue;
    const abs = path.join(root, name);
    if (fs.existsSync(abs) && fs.statSync(abs).isFile()) files[name] = fs.readFileSync(abs, "utf8");
  }
  return { files, problems };
}

// ── the rules ────────────────────────────────────────────────────────────────

function sqlKeys(node: unknown, at = ""): string[] {
  const out: string[] = [];
  if (Array.isArray(node)) {
    node.forEach((v, i) => out.push(...sqlKeys(v, `${at}[${i}]`)));
  } else if (isObject(node)) {
    for (const [k, v] of Object.entries(node)) {
      const here = at ? `${at}.${k}` : k;
      if (k.toLowerCase() === "sql") out.push(here);
      out.push(...sqlKeys(v, here));
    }
  }
  return out;
}

/**
 * Lint a release: `files` maps a file name to its content, documents parsed,
 * data files as text — the body the CLI uploads. `checks` are the compiled
 * schemas.
 */
export function lintCubeRelease(files: Record<string, unknown>, checks: Record<string, SchemaCheck>): CubeLintResult {
  const problems: CubeProblem[] = [];
  const warnings: CubeProblem[] = [];
  const problem = (document: string, at: string, message: string) => problems.push({ document, path: at, message });
  const warning = (document: string, at: string, message: string) => warnings.push({ document, path: at, message });

  const docs: Partial<Record<CubeDocument, Json>> = {};
  const data: Record<string, string> = {};
  for (const [name, content] of Object.entries(files)) {
    const stem = name.endsWith(".json") ? name.slice(0, -5) : null;
    if (stem && (CUBE_DOCUMENTS as readonly string[]).includes(stem)) {
      if (!isObject(content)) problem(name, "", "must be a JSON object");
      else docs[stem as CubeDocument] = content;
    } else if (DATA_FILE.test(name)) {
      if (typeof content !== "string") problem(name, "", "a data file is CSV text");
      else if (Buffer.byteLength(content) > MAX_DATA_BYTES) problem(name, "", `larger than ${MAX_DATA_BYTES / (1024 * 1024)} MB`);
      else data[name] = content;
    } else {
      problem(name, "", "not a Cube document or a CSV data file");
    }
  }

  const cube = docs.cube;
  if (!cube) {
    problem("cube.json", "", "the Cube has no cube.json");
    return { cube: null, problems, warnings };
  }
  const id = [text(cube.vendor), text(cube.name)].every(Boolean)
    ? `${cube.vendor}/${cube.name}${text(cube.version) ? `@${cube.version}` : ""}`
    : null;

  // 1. Each document against its schema.
  for (const [stem, content] of Object.entries(docs)) {
    const check = checks[stem];
    if (!check) continue;
    for (const finding of check(content)) problem(`${stem}.json`, finding.path, finding.message);
  }

  const analytics = docs.analytics ?? {};
  const datasets = new Map<string, Json>();
  for (const d of objects(analytics.datasets)) if (text(d.name)) datasets.set(d.name as string, d);
  const functions = new Map<string, Json>();
  for (const f of objects(cube.functions)) if (text(f.key)) functions.set(f.key as string, f);

  // 2. A Cube has no entities, so no views; its data comes as datasets.
  if (list(analytics.views).length) problem("analytics.json", "views", "a Cube declares datasets, not views");

  // 3. Data files: listed, shipped and filling a file dataset.
  const listed = new Set<unknown>();
  list(cube.data).forEach((entry, i) => {
    if (!isObject(entry)) return;
    const file = entry.file;
    const ds = entry.dataset;
    listed.add(file);
    if (typeof file === "string" && file.endsWith(".parquet")) problem("cube.json", `data[${i}].file`, "Parquet files are not loaded yet; ship CSV");
    else if (typeof file !== "string" || !(file in data)) problem("cube.json", `data[${i}].file`, `'${String(file)}' is missing`);
    const target = typeof ds === "string" ? datasets.get(ds) : undefined;
    if (!target) problem("cube.json", `data[${i}].dataset`, `analytics.json declares no dataset '${String(ds)}'`);
    else if ((isObject(target.source) ? target.source.file : undefined) !== file) problem("cube.json", `data[${i}].dataset`, `dataset '${String(ds)}' is not filled from '${String(file)}'`);
  });
  for (const name of Object.keys(data).sort()) if (!listed.has(name)) problem(name, "", "not listed in cube.json data");

  // 4. Functions and the datasets they fill; sources.
  list(cube.functions).forEach((f, i) => {
    if (!isObject(f)) return;
    const ds = typeof f.dataset === "string" ? datasets.get(f.dataset) : undefined;
    if (!ds) problem("cube.json", `functions[${i}].dataset`, `analytics.json declares no dataset '${String(f.dataset)}'`);
    else if ((isObject(ds.source) ? ds.source.function : undefined) !== f.key) problem("cube.json", `functions[${i}].dataset`, `dataset '${String(f.dataset)}' is not filled by function '${String(f.key)}'`);
  });
  const connections = new Set(objects(cube.connections).map((c) => c.key));
  [...datasets.values()].forEach((ds, i) => {
    const source = isObject(ds.source) ? ds.source : {};
    const at = `datasets[${i}].source`;
    if ("file" in source && !listed.has(source.file)) problem("analytics.json", at, `file '${String(source.file)}' is not listed in cube.json data`);
    if ("function" in source && !functions.has(source.function as string)) problem("analytics.json", at, `cube.json declares no function '${String(source.function)}'`);
    if ("query" in source) problem("analytics.json", `${at}.query`, "a Cube ships no SQL; read a table or an endpoint");
    if ("connection" in source && !connections.has(source.connection)) problem("analytics.json", `${at}.connection`, `cube.json declares no connection '${String(source.connection)}'`);
  });

  // 4b. Every stored dataset becomes a table `{vendor}__{cube}__{dataset}`;
  // the database cuts names at 63 characters.
  const prefix = `${String(cube.vendor)}__${String(cube.name)}__`.replace(/-/g, "_");
  [...datasets.keys()].forEach((name, i) => {
    if ((prefix + name).length > MAX_TABLE_NAME) problem("analytics.json", `datasets[${i}].name`, `table name '${prefix + name}' is longer than ${MAX_TABLE_NAME} characters`);
  });

  // 5. Ranges a resolver can read.
  const requires = isObject(cube.requires) ? cube.requires : {};
  for (const [name, range] of Object.entries(requires)) {
    if (typeof range === "string" && !validRange(range)) problem("cube.json", `requires.${name}`, `'${range}' is not a semver range`);
  }
  if (typeof cube.name === "string" && cube.name in requires) problem("cube.json", `requires.${cube.name}`, "a Cube cannot require itself");

  // 6. No SQL: formulas in the restricted grammar, no `sql` anywhere.
  const metrics = docs.metrics ?? {};
  list(metrics.metrics).forEach((m, i) => {
    if (!isObject(m)) return;
    for (const k of ["expr", "derived"]) {
      const formula = m[k];
      if (typeof formula === "string" && !FORMULA.test(formula)) problem("metrics.json", `metrics[${i}].${k}`, "only names, numbers, + - * / and parentheses; a Cube ships no SQL");
    }
  });
  for (const [stem, content] of Object.entries(docs)) {
    for (const at of sqlKeys(content)) problem(`${stem}.json`, at, "a Cube ships no SQL");
  }

  // Warnings: `ai_safe` where it has no effect.
  const piiColumns = new Map<string, Set<unknown>>();
  for (const [name, ds] of datasets) piiColumns.set(name, new Set(objects(ds.columns).filter((c) => c.pii === true).map((c) => c.name)));
  list(metrics.dimensions).forEach((d, i) => {
    if (!isObject(d) || d.ai_safe !== true) return;
    const at = `dimensions[${i}].ai_safe`;
    if (typeof d.dataset === "string" && piiColumns.get(d.dataset)?.has(d.column)) warning("metrics.json", at, "ignored: the column is personal data, whose values never go to AI");
    else if (d.lookup) warning("metrics.json", at, "ignored on a dimension with a lookup: AI texts name the lookup's label, not this value");
    else if (d.grain) warning("metrics.json", at, "ignored on a dimension with a grain");
  });

  // Warnings: the marketplace listing.
  if (!docs.billing) warning("billing.json", "", "missing: without billing.json the Cube is not listed in the marketplace");
  else if (!isObject(docs.billing.support)) warning("billing.json", "support", "no support contact: the marketplace listing shows one");

  return { cube: id, problems, warnings };
}

/** Lint a Cube directory against the schemas from `schemas` (URL or directory). */
export async function lintCubeDirectory(
  dir: string,
  opts: { schemas?: string; fetchImpl?: typeof fetch } = {},
): Promise<CubeLintResult & { root: string }> {
  const root = path.resolve(dir);
  if (!fs.existsSync(path.join(root, "cube.json"))) throw new Error(`${root} is not a Cube directory (no cube.json)`);
  const { files, problems: readProblems } = readCubeRelease(root);
  const checks = compileCubeSchemas(await loadCubeSchemas(opts.schemas ?? DEFAULT_SCHEMAS_BASE, opts.fetchImpl ?? fetch));
  const result = lintCubeRelease(files, checks);
  return { root, ...result, problems: [...readProblems, ...result.problems] };
}
