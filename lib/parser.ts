import chalk from "chalk";
import { InvalidArgumentError, type Command } from "commander";
import Table from "cli-table3";
import packageJson from "../package.json" with { type: "json" };
const { description } = packageJson;
import { globalConfig } from "./config.js";
import { loadProjectConfig, resolveTenant } from "./project-config.js";
import { redactSecrets } from "./redact.js";
import os from "os";
import Client, { exitCodeForError } from "./client.js";
import { isCloud } from "./utils.js";
import type { CliConfig, OutputFormat } from "./types.js";
import { OUTPUT_FORMATS } from "./types.js";
import {
  SDK_VERSION,
  SDK_TITLE,
  SDK_LOGO,
  DEFAULT_ENDPOINT,
  EXECUTABLE_NAME,
  GITHUB_REPO,
} from "./constants.js";

const cliConfig: CliConfig = {
  verbose: false,
  output: "table",
  json: false,
  quiet: false,
  force: false,
  report: false,
  reportData: {},
  retry: true,
  debug: false,
};

type JsonObject = Record<string, unknown>;

interface ReportDataPayload {
  data?: {
    args?: string[];
  };
}

const toJsonObject = (value: unknown): JsonObject | null => {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as JsonObject;
  }

  return null;
};

// redactSecrets lives in ./redact.js so low-level modules (the HTTP client)
// can redact without importing parser.ts. Re-exported here for existing callers.
export { redactSecrets };

const redactArgs = (args: string[]): string[] => {
  const out: string[] = [];
  const SECRET_FLAGS = new Set([
    "--token",
    "-t",
    "--key",
    "--password",
    "--api-key",
    "--cookie",
  ]);
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (SECRET_FLAGS.has(a) && i + 1 < args.length) {
      out.push(a, "***");
      i++;
      continue;
    }
    // `--token=value` form
    const eq = a.indexOf("=");
    if (eq !== -1 && SECRET_FLAGS.has(a.slice(0, eq))) {
      out.push(`${a.slice(0, eq)}=***`);
      continue;
    }
    out.push(redactSecrets(a));
  }
  return out;
};

const extractReportCommandArgs = (value: unknown): string[] => {
  if (!value || typeof value !== "object") {
    return [];
  }

  const reportData = value as ReportDataPayload;
  if (!Array.isArray(reportData.data?.args)) {
    return [];
  }

  return redactArgs(reportData.data.args);
};

/** Max rendered width for a table cell before truncation. */
const MAX_CELL_WIDTH = 60;
/** Max rendered width for a nested-value preview (compact JSON). */
const MAX_PREVIEW_WIDTH = 40;

const isBigNumber = (value: unknown): boolean =>
  (value as { constructor?: { name?: string } })?.constructor?.name ===
  "BigNumber";

/** True for values rendered inline on a `key : value` line. */
const isScalarish = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  typeof value !== "object" ||
  isBigNumber(value);

const truncate = (value: string, max: number): string =>
  value.length > max ? `${value.slice(0, max - 1)}…` : value;

/** Compact single-line preview of a nested value, e.g. `{"a":1,…`. */
const previewValue = (value: unknown): string =>
  truncate(JSON.stringify(value) ?? "", MAX_PREVIEW_WIDTH);

const formatScalar = (value: unknown): string => {
  if (value === null || value === undefined) return chalk.dim("-");
  if (typeof value === "boolean") return chalk.yellow(String(value));
  if (typeof value === "number" || isBigNumber(value))
    return chalk.yellow(String(value));
  const s = String(value);
  return s === "" ? chalk.dim("(empty)") : s;
};

const sectionTitle = (title: string): string => chalk.bold(title);

/**
 * Print an aligned `key : value` block. Keys are padded *before* the ` : `
 * separator, which keeps the output parseable with `line.split(" : ")` —
 * the CI runtime tests rely on that contract for the first output line.
 */
const drawKeyValues = (obj: JsonObject, indent: number = 0): void => {
  const keys = Object.keys(obj);
  const width = keys.reduce((max, key) => Math.max(max, key.length), 0);
  const pad = " ".repeat(indent);
  for (const key of keys) {
    const value = obj[key];
    const rendered = isScalarish(value)
      ? formatScalar(value)
      : chalk.dim(previewValue(value));
    console.log(`${pad}${chalk.cyan(key.padEnd(width))} : ${rendered}`);
  }
};

/**
 * Narrow output to the columns named by `--fields` before rendering. Object
 * rows keep only the listed keys (in the given order); arrays project every
 * row. A list envelope — a single object whose one array-valued property holds
 * the rows (e.g. `{ total, products: [...] }`) — projects that collection while
 * keeping the envelope so `--fields` reads naturally on `list` output too.
 */
const projectFields = (data: unknown, fields?: string[]): unknown => {
  if (!fields || fields.length === 0) return data;

  const pick = (obj: JsonObject): JsonObject => {
    const out: JsonObject = {};
    for (const field of fields) {
      if (field in obj) out[field] = obj[field];
    }
    return out;
  };

  if (Array.isArray(data)) {
    return data.map((item) => {
      const obj = toJsonObject(item);
      return obj ? pick(obj) : item;
    });
  }

  const obj = toJsonObject(data);
  if (obj === null) return data;

  const arrayKeys = Object.keys(obj).filter((key) => Array.isArray(obj[key]));
  if (arrayKeys.length === 1) {
    const key = arrayKeys[0];
    return { ...obj, [key]: projectFields(obj[key], fields) };
  }
  return pick(obj);
};

export const parse = (data: unknown): void => {
  const projected = projectFields(data, cliConfig.fields);

  switch (cliConfig.output) {
    case "json":
      drawJSON(projected);
      return;
    case "jsonl":
      drawJSONL(projected);
      return;
    case "csv":
      drawCSV(projected);
      return;
    case "yaml":
      drawYAML(projected);
      return;
    case "markdown":
      drawMarkdown(projected);
      return;
  }

  const obj = toJsonObject(projected);
  if (obj === null) {
    drawJSON(projected);
    return;
  }

  const keys = Object.keys(obj);
  const scalarKeys = keys.filter((key) => isScalarish(obj[key]));
  const width = scalarKeys.reduce((max, key) => Math.max(max, key.length), 0);

  for (const key of keys) {
    const value = obj[key];
    if (isScalarish(value)) {
      console.log(
        `${chalk.cyan(key.padEnd(width))} : ${formatScalar(value)}`,
      );
    } else if (Array.isArray(value)) {
      console.log("");
      console.log(sectionTitle(key));
      if (
        value.length > 0 &&
        typeof value[0] === "object" &&
        value[0] !== null
      ) {
        drawTable(value as JsonObject[]);
      } else {
        drawJSON(value);
      }
    } else {
      console.log("");
      console.log(sectionTitle(key));
      drawKeyValues(toJsonObject(value) ?? {}, 2);
    }
  }
};

export const drawTable = (data: Array<JsonObject | null | undefined>): void => {
  if (data.length == 0) {
    // Keep piped output script-friendly (`[]`, as before this redesign);
    // the friendly message is for humans at a terminal.
    console.log(process.stdout.isTTY ? chalk.dim("No results.") : "[]");
    return;
  }

  const rows = data.map((item): JsonObject => toJsonObject(item) ?? {});

  // Create an object with all the keys in it
  const obj = rows.reduce((res, item) => ({ ...res, ...item }), {});
  // Get those keys as an array
  const keys = Object.keys(obj);
  if (keys.length === 0) {
    drawJSON(data);
    return;
  }
  // Create an object with all keys set to a null default
  const def = keys.reduce((result: Record<string, unknown>, key) => {
    result[key] = null;
    return result;
  }, {});
  // Use object destructuring to replace all default values with the ones we have
  const normalizedData = rows.map((item) => ({ ...def, ...item }));

  const columns = Object.keys(normalizedData[0]);

  // Measure plain (unstyled) cell text first so column widths are known
  // before any coloring is applied.
  interface Cell {
    text: string;
    dim: boolean;
  }
  const cellFor = (value: unknown): Cell => {
    if (value === null || value === undefined) return { text: "-", dim: true };
    if (
      (Array.isArray(value) || typeof value === "object") &&
      !isBigNumber(value)
    ) {
      return { text: previewValue(value), dim: true };
    }
    return { text: truncate(String(value), MAX_CELL_WIDTH), dim: false };
  };
  const grid = normalizedData.map((row) =>
    columns.map((key) => cellFor(row[key])),
  );

  // Fit the table to the terminal so rows never wrap and interleave: keep
  // leading columns while they fit, and list the dropped ones below. Piped
  // (non-TTY) output keeps every column so scripts see the full table.
  // Per-column overhead: paddingRight (2) plus the column separator (1).
  const OVERHEAD = 3;
  const budget = process.stdout.isTTY
    ? (process.stdout.columns || 80) - 1
    : Infinity;
  const naturalWidths = columns.map((column, i) =>
    Math.max(column.length, ...grid.map((cells) => cells[i].text.length)),
  );
  let used = 0;
  let visible = 0;
  while (
    visible < columns.length &&
    (used + naturalWidths[visible] + OVERHEAD <= budget || visible === 0)
  ) {
    used += naturalWidths[visible] + OVERHEAD;
    visible++;
  }
  // Even a lone first column must not exceed the terminal.
  const widths = naturalWidths
    .slice(0, visible)
    .map((width) => Math.min(width, Math.max(budget - OVERHEAD, 8)));
  const hidden = columns.slice(visible);

  const table = new Table({
    head: columns
      .slice(0, visible)
      .map((c, i) => chalk.bold(truncate(c, widths[i]))),
    chars: {
      top: "",
      "top-mid": "",
      "top-left": "",
      "top-right": "",
      bottom: "",
      "bottom-mid": "",
      "bottom-left": "",
      "bottom-right": "",
      left: "",
      "left-mid": "",
      mid: "",
      "mid-mid": "",
      right: "",
      "right-mid": "",
      middle: " ",
    },
    style: { head: [], border: [], "padding-left": 0, "padding-right": 2 },
  });

  grid.forEach((cells) => {
    table.push(
      cells.slice(0, visible).map((cell, i) => {
        const text = truncate(cell.text, widths[i]);
        return cell.dim ? chalk.dim(text) : text;
      }),
    );
  });
  console.log(table.toString());
  if (hidden.length > 0) {
    console.log(
      chalk.dim(
        `(+${hidden.length} more column${hidden.length === 1 ? "" : "s"}: ${hidden.join(", ")} — use --json for the full output)`,
      ),
    );
  }
};

/**
 * Colorize a `JSON.stringify(…, null, 2)` string for terminal display. A
 * no-op when color is disabled (piped output, NO_COLOR), so plain-text
 * consumers always see valid, uncolored JSON.
 */
const colorizeJSON = (json: string): string => {
  if (chalk.level === 0) return json;
  return json.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/g,
    (match, str?: string, colon?: string) => {
      if (str !== undefined) {
        return colon !== undefined ? `${chalk.cyan(str)}${colon}` : chalk.green(str);
      }
      if (match === "null") return chalk.dim(match);
      return chalk.yellow(match);
    },
  );
};

export const drawJSON = (data: unknown): void => {
  // JSON.stringify returns undefined for undefined/functions — print the
  // literal text (matching console.log's old behavior) instead of throwing.
  const json = JSON.stringify(data, null, 2) ?? "undefined";
  // The --json path must stay byte-stable for scripting/pipes: never colorize.
  if (cliConfig.json) {
    console.log(json);
    return;
  }
  console.log(colorizeJSON(json));
};

/**
 * Reduce a response to the stream of records NDJSON emits: an array becomes its
 * items; a list envelope with exactly one array-of-objects collection becomes
 * that collection; any other value is a single record. Unlike {@link toRows}
 * this preserves scalar items verbatim (no `{ value }` wrapping) so a plain
 * array like `["a","b"]` streams as one scalar per line.
 */
const toRecords = (data: unknown): unknown[] => {
  if (Array.isArray(data)) return data;
  const obj = toJsonObject(data);
  if (obj === null) return [data];

  const collectionKeys = Object.keys(obj).filter((key) => {
    const value = obj[key];
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((item) => toJsonObject(item) !== null)
    );
  });
  if (collectionKeys.length === 1) {
    return obj[collectionKeys[0]] as unknown[];
  }
  return [obj];
};

/** The NDJSON / JSON Lines text for a response: one compact, uncolored JSON
 * value per line. Shared by drawJSONL and the TUI's format toggle. */
export const formatJSONL = (data: unknown): string =>
  toRecords(data)
    .map((record) => JSON.stringify(record) ?? "null")
    .join("\n");

/**
 * Render a response as NDJSON / JSON Lines: one compact, uncolored JSON value
 * per line. Ideal for streaming large `list` results into `jq -c`, `xargs`, or
 * log pipelines without materializing the whole array.
 */
export const drawJSONL = (data: unknown): void => {
  const lines = formatJSONL(data);
  // Suppress a trailing blank line for an empty stream while staying pipeable.
  if (lines !== "") console.log(lines);
};

/**
 * Reduce a response to the rows a tabular renderer (CSV) needs: an array
 * becomes its items; a list envelope with exactly one array-of-objects
 * collection becomes that collection; any other object is a single row.
 */
const toRows = (data: unknown): JsonObject[] => {
  if (Array.isArray(data)) {
    return data.map((item) => toJsonObject(item) ?? { value: item });
  }
  const obj = toJsonObject(data);
  if (obj === null) return [{ value: data }];

  const collectionKeys = Object.keys(obj).filter((key) => {
    const value = obj[key];
    return (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((item) => toJsonObject(item) !== null)
    );
  });
  if (collectionKeys.length === 1) {
    return (obj[collectionKeys[0]] as unknown[]).map(
      (item) => toJsonObject(item) ?? { value: item },
    );
  }
  return [obj];
};

/** Union of every row's keys, in first-seen order, for stable columns. */
const columnUnion = (rows: JsonObject[]): string[] => {
  const columns: string[] = [];
  const seen = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!seen.has(key)) {
        seen.add(key);
        columns.push(key);
      }
    }
  }
  return columns;
};

/** RFC 4180 field quoting: wrap+escape only when the value needs it. */
const csvEscape = (value: string): string =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

const csvCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (isScalarish(value)) return String(value);
  return JSON.stringify(value);
};

/** The RFC 4180 CSV text for a response ("" when there are no rows). Shared
 * by drawCSV and the TUI's format toggle. */
export const formatCSV = (data: unknown): string => {
  const rows = toRows(data);
  if (rows.length === 0) return "";

  const columns = columnUnion(rows);
  const lines = [columns.map(csvEscape).join(",")];
  for (const row of rows) {
    lines.push(columns.map((key) => csvEscape(csvCell(row[key]))).join(","));
  }
  return lines.join("\n");
};

/**
 * Render rows as RFC 4180 CSV: a header row (the union of row keys, in first-
 * seen order) followed by one line per row. Always plain text — never colored
 * — so the output pipes cleanly.
 */
export const drawCSV = (data: unknown): void => {
  const text = formatCSV(data);
  if (text === "") return;
  console.log(text);
};

/** Escape a value for a GitHub-flavored Markdown table cell. */
const mdEscape = (value: string): string =>
  value
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")
    .replace(/\r?\n/g, "<br>");

const mdCell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (isScalarish(value)) return mdEscape(String(value));
  return mdEscape(JSON.stringify(value));
};

const mdRow = (cells: string[]): string => `| ${cells.join(" | ")} |`;

/**
 * Render a response as a GitHub-flavored Markdown table — handy for docs, PR
 * comments, and issue bodies. A lone record becomes a two-column Field/Value
 * table; arrays and list envelopes become one row per record.
 */
export const drawMarkdown = (data: unknown): void => {
  const single = !Array.isArray(data) ? toJsonObject(data) : null;
  const isEnvelope =
    single !== null && Object.keys(single).some((key) => Array.isArray(single[key]));

  if (single !== null && !isEnvelope) {
    const lines = [mdRow(["Field", "Value"]), mdRow(["---", "---"])];
    for (const key of Object.keys(single)) {
      lines.push(mdRow([mdEscape(key), mdCell(single[key])]));
    }
    console.log(lines.join("\n"));
    return;
  }

  const rows = toRows(data);
  if (rows.length === 0) return;

  const columns = columnUnion(rows);
  const lines = [
    mdRow(columns.map(mdEscape)),
    mdRow(columns.map(() => "---")),
    ...rows.map((row) => mdRow(columns.map((key) => mdCell(row[key])))),
  ];
  console.log(lines.join("\n"));
};

/**
 * Format a single YAML scalar, double-quoting (JSON-style, which is valid YAML)
 * whenever the plain form would be ambiguous — empty, whitespace-edged, a YAML
 * indicator, or something that would otherwise parse as a number/bool/null.
 */
const yamlScalar = (value: unknown): string => {
  if (value === null || value === undefined) return "null";
  if (typeof value === "boolean") return String(value);
  if (typeof value === "number" || isBigNumber(value)) return String(value);
  const s = String(value);
  if (
    s === "" ||
    s !== s.trim() ||
    /^[!&*?|>@`"'#%,[\]{}:-]/.test(s) ||
    /:(\s|$)/.test(s) ||
    /\s#/.test(s) ||
    /[\n\t]/.test(s) ||
    /^(true|false|null|yes|no|on|off|~)$/i.test(s) ||
    /^[+-]?(\d[\d_]*\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)
  ) {
    return JSON.stringify(s);
  }
  return s;
};

const isYamlScalar = (value: unknown): boolean => isScalarish(value);

/** Emit a `key: value` line, recursing for nested collections. */
const emitYamlKey = (
  prefix: string,
  key: string,
  value: unknown,
  indent: number,
  lines: string[],
): void => {
  const renderedKey = yamlScalar(key);
  if (isYamlScalar(value)) {
    lines.push(`${prefix}${renderedKey}: ${yamlScalar(value)}`);
    return;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      lines.push(`${prefix}${renderedKey}: []`);
      return;
    }
    lines.push(`${prefix}${renderedKey}:`);
    emitYaml(value, indent + 1, lines);
    return;
  }
  const obj = toJsonObject(value) ?? {};
  if (Object.keys(obj).length === 0) {
    lines.push(`${prefix}${renderedKey}: {}`);
    return;
  }
  lines.push(`${prefix}${renderedKey}:`);
  emitYaml(value, indent + 1, lines);
};

const emitYaml = (data: unknown, indent: number, lines: string[]): void => {
  const pad = "  ".repeat(indent);

  if (Array.isArray(data)) {
    if (data.length === 0) {
      lines.push(`${pad}[]`);
      return;
    }
    for (const item of data) {
      if (isYamlScalar(item)) {
        lines.push(`${pad}- ${yamlScalar(item)}`);
      } else if (Array.isArray(item)) {
        lines.push(`${pad}-`);
        emitYaml(item, indent + 1, lines);
      } else {
        const obj = toJsonObject(item) ?? {};
        const keys = Object.keys(obj);
        if (keys.length === 0) {
          lines.push(`${pad}- {}`);
          continue;
        }
        // First key sits on the `- ` marker; the rest align under it. The
        // marker is exactly one indent wide, so children nest at indent + 1.
        keys.forEach((key, i) => {
          const itemPrefix = i === 0 ? `${pad}- ` : `${pad}  `;
          emitYamlKey(itemPrefix, key, obj[key], indent + 1, lines);
        });
      }
    }
    return;
  }

  const obj = toJsonObject(data);
  if (obj !== null) {
    const keys = Object.keys(obj);
    if (keys.length === 0) {
      lines.push(`${pad}{}`);
      return;
    }
    for (const key of keys) {
      emitYamlKey(pad, key, obj[key], indent, lines);
    }
    return;
  }

  lines.push(`${pad}${yamlScalar(data)}`);
};

/** Render a response as YAML. Always plain text — losslessly structured. */
export const drawYAML = (data: unknown): void => {
  const lines: string[] = [];
  emitYaml(data, 0, lines);
  console.log(lines.join("\n"));
};

/**
 * Detect "token missing / invalid / expired" failure modes and return a
 * one-line user-facing hint. Returns null when the error doesn't look auth-
 * related so other failure modes (network, validation, etc.) aren't muddied
 * with login advice.
 */
export const authHint = (err: unknown): string | null => {
  const meta = err as {
    code?: number;
    type?: string;
    response?: string;
    message?: string;
  };
  const type = String(meta.type ?? "");
  const message = String(meta.message ?? "");

  // Locally raised by sdkForProject / sdkForConsole when no credentials
  // are configured yet.
  if (
    /Session not found/i.test(message) ||
    /Project is not set/i.test(message) ||
    /No API token found/i.test(message)
  ) {
    return `Configure credentials with \`${EXECUTABLE_NAME} login\` or set REVENEXX_API_KEY + REVENEXX_TENANT.`;
  }

  // Server-side rejections.
  const isAuthCode = meta.code === 401 || meta.code === 403;
  const authTypes = new Set([
    "user_unauthorized",
    "user_invalid_credentials",
    "user_jwt_invalid",
    "user_session_not_found",
    "user_session_expired",
    "general_unauthorized_scope",
    "general_access_forbidden",
    "user_authentication_required",
  ]);
  if (isAuthCode || authTypes.has(type)) {
    if (
      type === "user_jwt_invalid" ||
      type === "user_session_expired" ||
      /expired/i.test(message)
    ) {
      return `Your token expired — run \`${EXECUTABLE_NAME} login --browser\` to mint a new one.`;
    }
    if (type === "general_unauthorized_scope") {
      return `The token is valid but lacks the required scope — issue a new Personal Access Token with the right permissions.`;
    }
    return `Authentication failed — run \`${EXECUTABLE_NAME} login\` (or pass --token) and try again.`;
  }

  return null;
};

/**
 * Render extra detail carried by the typed errors in lib/commands/errors.ts
 * (duck-typed on `name` so this file stays decoupled from command code).
 */
const drawErrorDetails = (err: Error): void => {
  if (err.name === "ConfigValidationError") {
    const validationErrors = (
      err as unknown as {
        getValidationErrors?: () => Array<{ path: string; message: string }>;
      }
    ).getValidationErrors?.();
    for (const item of validationErrors ?? []) {
      console.error(
        `  ${chalk.red("✗")} ${chalk.cyan(item.path)}: ${redactSecrets(item.message)}`,
      );
    }
    return;
  }

  if (err.name === "DestructiveChangeError") {
    const metadata = (
      err as unknown as {
        getMetadata?: () => {
          changes: Array<{
            type: string;
            resource: string;
            field: string;
            oldValue?: unknown;
            newValue?: unknown;
          }>;
        };
      }
    ).getMetadata?.();
    for (const change of metadata?.changes ?? []) {
      const from =
        change.oldValue === undefined
          ? "-"
          : redactSecrets(previewValue(change.oldValue));
      const to =
        change.newValue === undefined
          ? "-"
          : redactSecrets(previewValue(change.newValue));
      console.error(
        `  ${chalk.yellow("!")} ${change.type} ${chalk.cyan(`${change.resource}.${change.field}`)}${change.oldValue !== undefined || change.newValue !== undefined ? chalk.dim(` (${from} → ${to})`) : ""}`,
      );
    }
    hint(`Re-run with --force to apply these changes.`);
    return;
  }

  if (err.name === "ProjectNotInitializedError") {
    hint(`Run \`${EXECUTABLE_NAME} login\` in your project directory to get set up.`);
    return;
  }

  if (err.name === "AuthenticationError") {
    hint(`Run \`${EXECUTABLE_NAME} login\` to authenticate and try again.`);
    return;
  }
};

/** Dim `code / type / response` metadata lines for verbose error output. */
const drawErrorMeta = (err: Error): void => {
  const meta = err as unknown as {
    code?: unknown;
    type?: unknown;
    response?: unknown;
    requestId?: unknown;
  };
  if (meta.code !== undefined)
    console.error(chalk.dim(`  code: ${meta.code}`));
  if (meta.type !== undefined)
    console.error(chalk.dim(`  type: ${redactSecrets(meta.type)}`));
  // The gateway correlation id ties this failure to a server-side log line —
  // invaluable when asking support to investigate.
  if (meta.requestId !== undefined && meta.requestId !== "")
    console.error(chalk.dim(`  request-id: ${redactSecrets(meta.requestId)}`));
  if (meta.response !== undefined)
    console.error(chalk.dim(`  response: ${redactSecrets(meta.response)}`));
};

export const parseError = (err: Error): void => {
  // The REPL replaces process.exit with a throwing sentinel so one failing
  // command doesn't kill the shell. When that sentinel reaches here (e.g. a
  // command called process.exit itself, before parseError ran), stay
  // transparent: rethrow it so the REPL loop handles it, instead of printing
  // its numeric "message" as a bogus error.
  if (err && err.name === "ReplExit") {
    throw err;
  }

  const exitCode = exitCodeForError(err);

  // Machine-readable failure: emit structured JSON to stderr and exit with a
  // meaningful code. This wins over the human and --report paths so scripts
  // running under --json / --quiet can always parse the error and branch on
  // the exit code (4=auth, 5=not-found, 8=rate-limit, 1=generic).
  if (cliConfig.output === "json" || cliConfig.quiet) {
    const meta = err as {
      code?: number | string;
      type?: string;
      requestId?: string;
    };
    const payload: {
      error: {
        message: string;
        code?: number | string;
        type?: string;
        requestId?: string;
      };
    } = { error: { message: redactSecrets(err.message) } };
    if (meta.code !== undefined) payload.error.code = meta.code;
    if (meta.type !== undefined && meta.type !== "")
      payload.error.type = redactSecrets(meta.type);
    if (meta.requestId !== undefined && meta.requestId !== "")
      payload.error.requestId = redactSecrets(meta.requestId);
    process.stderr.write(`${JSON.stringify(payload)}\n`);
    process.exit(exitCode);
  }

  if (cliConfig.report) {
    void (async () => {
      let serverVersion = "unknown";
      const endpoint = globalConfig.getEndpoint();

      try {
        const client = new Client().setEndpoint(endpoint);
        const res = (await client.call("get", "/health/version")) as {
          version: string;
        };
        serverVersion = res.version;
      } catch {
        // Silently fail
      }

      const version = SDK_VERSION;
      const commandArgs = extractReportCommandArgs(cliConfig.reportData);
      const stepsToReproduce = `Running \`${EXECUTABLE_NAME} ${commandArgs.join(" ")}\``;
      // Surface the gateway correlation id so support can tie the report to a
      // server-side log line.
      const requestId = (err as unknown as { requestId?: string }).requestId;
      const requestIdLine = requestId ? `\nRequest ID: ${redactSecrets(requestId)}` : "";
      const yourEnvironment = `CLI version: ${version}\nOperating System: ${os.type()}\nServer version: ${serverVersion}\nIs Cloud: ${isCloud()}${requestIdLine}`;

      const stack =
        "```\n" + redactSecrets(err.stack || err.message) + "\n```";

      // Point at the public CLI repo (GITHUB_REPO) so the link resolves for
      // external users, and use GitHub's generic `title`/`body` query params
      // rather than issue-form field keys so it works without a specific
      // issue template installed.
      const githubIssueUrl = new URL(
        `https://github.com/${GITHUB_REPO}/issues/new`,
      );
      githubIssueUrl.searchParams.append("labels", "bug");
      githubIssueUrl.searchParams.append(
        "title",
        `🐛 Bug Report: ${redactSecrets(err.message)}`,
      );
      githubIssueUrl.searchParams.append(
        "body",
        `**Steps to reproduce**\n${stepsToReproduce}\n\n**Actual behavior**\nCLI Error:\n${stack}\n\n**Environment**\n${yourEnvironment}`,
      );

      error(err.message);
      drawErrorDetails(err);
      console.error(chalk.dim(redactSecrets(err.stack ?? "")));
      log(`To report this error, open an issue on GitHub:\n  ${githubIssueUrl.href}`);
      const tip = authHint(err);
      if (tip) hint(tip);
      process.exit(exitCode);
    })();
  } else {
    error(err.message);
    drawErrorDetails(err);
    if (cliConfig.verbose) {
      console.error(chalk.dim(redactSecrets(err.stack ?? "")));
      drawErrorMeta(err);
    }
    const tip = authHint(err);
    if (tip) hint(tip);
    if (!cliConfig.verbose) {
      console.error(
        chalk.dim(`Re-run with --verbose or --report for more detail.`),
      );
    }
    process.exit(exitCode);
  }
};

export const actionRunner = <
  T extends (...args: unknown[]) => Promise<unknown>,
>(
  fn: T,
): ((...args: Parameters<T>) => Promise<void>) => {
  return (...args: Parameters<T>) => {
    return fn(...args)
      .then(() => undefined)
      .catch(parseError);
  };
};

export const parseInteger = (value: string): number => {
  const parsedValue = parseInt(value, 10);
  if (isNaN(parsedValue)) {
    throw new InvalidArgumentError("Not a number.");
  }
  return parsedValue;
};

export const parseBool = (value: string): boolean => {
  if (value === "true") return true;
  if (value === "false") return false;
  throw new InvalidArgumentError("Not a boolean.");
};

/** Convenience value aliases: `md`→`markdown`, `ndjson`→`jsonl`. */
const OUTPUT_FORMAT_ALIASES: Record<string, OutputFormat> = {
  md: "markdown",
  ndjson: "jsonl",
};

export const parseOutputFormat = (value: string): OutputFormat => {
  const lower = value.toLowerCase();
  const format = OUTPUT_FORMAT_ALIASES[lower] ?? lower;
  if ((OUTPUT_FORMATS as readonly string[]).includes(format)) {
    return format as OutputFormat;
  }
  throw new InvalidArgumentError(
    `Expected one of: ${OUTPUT_FORMATS.join(", ")} (or md, ndjson).`,
  );
};

/** Split a `--fields a,b,c` value into a trimmed, non-empty column list. */
export const parseFields = (value: string): string[] =>
  value
    .split(",")
    .map((field) => field.trim())
    .filter((field) => field.length > 0);

/**
 * Status lines follow one gh-style system: a colored symbol, then the plain
 * message. Message text is left uncolored for readability; chalk drops the
 * ANSI codes automatically for non-TTY output and NO_COLOR.
 */
export const log = (message?: string): void => {
  console.log(`${chalk.cyan("ℹ")} ${message ?? ""}`);
};

export const warn = (message?: string): void => {
  console.log(`${chalk.yellow("!")} ${message ?? ""}`);
};

export const hint = (message?: string): void => {
  console.log(chalk.dim(`  Tip: ${message ?? ""}`));
};

export const success = (message?: string): void => {
  console.log(`${chalk.green("✓")} ${message ?? ""}`);
};

export const error = (message?: string): void => {
  const safe = redactSecrets(message);
  console.error(`${chalk.red("✗")} ${safe}`);
};

export const logo = SDK_LOGO;

/** Top-level commands the context banner stays quiet for (see below). */
const BANNER_SKIP_COMMANDS = new Set([
  "repl",
  "tui",
  "status",
  "alias",
  "register",
  "update",
  "generate",
  "help",
]);

export const safeHostname = (endpoint: string): string => {
  try {
    return new URL(endpoint).hostname;
  } catch {
    return endpoint;
  }
};

/**
 * Resolve the endpoint + tenant the next command will hit, using the same
 * precedence as sdkForProject() but without constructing a client. Kept here so
 * both the banner and any future callers share one source of truth.
 */
export const resolveActiveContext = (): {
  endpoint: string;
  tenant: string;
} => {
  const projectFile = loadProjectConfig();
  const endpoint =
    cliConfig.endpoint ||
    process.env.REVENEXX_API_URL ||
    projectFile.apiUrl ||
    globalConfig.getEndpoint() ||
    DEFAULT_ENDPOINT;
  const tenant =
    cliConfig.tenant ||
    resolveTenant() ||
    process.env.REVENEXX_PROJECT ||
    projectFile.projectId ||
    globalConfig.getProject() ||
    "";
  return { endpoint, tenant };
};

/**
 * True when the given endpoint/tenant should trigger the prominent production
 * warning. Sensitivity is configurable: a tenant is sensitive if it's in the
 * persisted list (`client --sensitive-tenants`) or REVENEXX_SENSITIVE_TENANTS.
 * Otherwise we fall back to prod heuristics — the built-in default endpoint is
 * the live production gateway, and any endpoint/tenant containing "prod".
 */
export const isSensitiveContext = (
  endpoint: string,
  tenant: string,
): boolean => {
  const configured = new Set<string>([
    ...globalConfig.getSensitiveTenants(),
    ...(process.env.REVENEXX_SENSITIVE_TENANTS ?? "")
      .split(",")
      .map((slug) => slug.trim())
      .filter((slug) => slug !== ""),
  ]);
  if (tenant && configured.has(tenant)) return true;

  const host = safeHostname(endpoint);
  const defaultHost = safeHostname(DEFAULT_ENDPOINT);
  if (host && host === defaultHost) return true;
  if (/prod/i.test(endpoint) || /prod/i.test(tenant)) return true;
  return false;
};

/** Walk up to the top-level command name for a (possibly nested) command. */
const topLevelName = (command: Command): string => {
  let current = command;
  while (current.parent && current.parent.parent) {
    current = current.parent;
  }
  return current.name();
};

/**
 * Commander `preAction` hook (DX-111): surface which tenant + endpoint the
 * command is about to hit, with a prominent red banner in production. Written
 * to stderr so it never contaminates machine-readable stdout, and suppressed
 * for `--json`, `--quiet`, non-TTY stderr, and the handful of context-free
 * commands that would only be noise.
 */
export const renderContextBanner = (
  _thisCommand: Command,
  actionCommand: Command,
): void => {
  if (cliConfig.json || cliConfig.quiet) return;
  if (!process.stderr.isTTY) return;
  if (BANNER_SKIP_COMMANDS.has(topLevelName(actionCommand))) return;

  const { endpoint, tenant } = resolveActiveContext();
  const tenantLabel = tenant || "(no tenant)";
  const host = safeHostname(endpoint);

  if (isSensitiveContext(endpoint, tenant)) {
    process.stderr.write(
      `${chalk.bgRed.white.bold(" PRODUCTION ")} ${chalk.red.bold(tenantLabel)} ${chalk.dim("→")} ${chalk.red(host)}\n`,
    );
    return;
  }

  process.stderr.write(
    chalk.dim(`● ${tenantLabel} → ${host}`) + "\n",
  );
};

/**
 * Hand-written help text for the CLI's own (non-generated) commands. Service
 * command descriptions come from the spec at generation time (see
 * services.ts.twig), so only CLI-native commands need entries here — anything
 * consumed without a fallback (login/logout/whoami/register/client) must stay.
 */
export const commandDescriptions: Record<string, string> = {
  login: `The login command allows you to authenticate to your ${SDK_TITLE} account.`,
  logout: `The logout command allows you to log out of your ${SDK_TITLE} account.`,
  whoami: `The whoami command gives information about the currently logged-in user.`,
  register: `Outputs the link to create a ${SDK_TITLE} account.`,
  client: `The client command allows you to configure your CLI.`,
  tenants: `The tenants command scopes follow-up commands to a specific ${SDK_TITLE} tenant.`,
  alias: `Manage command aliases — short forms for commands you run often.`,
  status: `Shows your identity, active tenant/endpoint, token expiry and gateway health at a glance.`,
  repl: `Starts an interactive shell so you can run several commands in one authenticated session.`,
  tui: `Launches the full-screen interactive terminal app.`,
  main: `${chalk.redBright(logo)}${description}`,
};

export { cliConfig };
