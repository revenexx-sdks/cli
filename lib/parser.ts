import chalk from "chalk";
import { InvalidArgumentError } from "commander";
import Table from "cli-table3";
import packageJson from "../package.json" with { type: "json" };
const { description } = packageJson;
import { globalConfig } from "./config.js";
import { redactSecrets } from "./redact.js";
import os from "os";
import Client from "./client.js";
import { isCloud } from "./utils.js";
import type { CliConfig } from "./types.js";
import {
  SDK_VERSION,
  SDK_TITLE,
  SDK_LOGO,
  EXECUTABLE_NAME,
  GITHUB_REPO,
} from "./constants.js";

const cliConfig: CliConfig = {
  verbose: false,
  json: false,
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

export const parse = (data: unknown): void => {
  if (cliConfig.json) {
    drawJSON(data);
    return;
  }

  const obj = toJsonObject(data);
  if (obj === null) {
    drawJSON(data);
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
      process.exit(1);
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
    process.exit(1);
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
  main: `${chalk.redBright(logo)}${description}`,
};

export { cliConfig };
