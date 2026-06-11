import chalk from "chalk";
import { InvalidArgumentError } from "commander";
import Table from "cli-table3";
import packageJson from "../package.json" with { type: "json" };
const { description } = packageJson;
import { globalConfig } from "./config.js";
import os from "os";
import Client from "./client.js";
import { isCloud } from "./utils.js";
import type { CliConfig } from "./types.js";
import {
  SDK_VERSION,
  SDK_TITLE,
  SDK_LOGO,
  EXECUTABLE_NAME,
} from "./constants.js";

const cliConfig: CliConfig = {
  verbose: false,
  json: false,
  force: false,
  all: false,
  ids: [],
  report: false,
  reportData: {},
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

/**
 * Strip token-like and credential-like substrings from text before it ever
 * reaches stdout/stderr or a bug-report URL. Conservative: prefers to over-
 * redact rather than leak. Patterns kept simple and ordered.
 */
export const redactSecrets = (input: unknown): string => {
  if (input === null || input === undefined) return "";
  let s = typeof input === "string" ? input : String(input);

  // Server-issued API keys (long opaque tokens with a `standard_` prefix)
  s = s.replace(/standard_[A-Za-z0-9]{32,}/g, "standard_***");
  // Gateway-issued API keys (`rvxk_…`)
  s = s.replace(/rvxk_[A-Za-z0-9]{16,}/g, "rvxk_***");
  // Auth-related headers
  s = s.replace(
    /(X-Revenexx-(?:Api-Key|Key|Cookie|JWT|Session|Dev-Key|Mode))(\s*[:=]\s*)([^\s,'"`}\]]+)/gi,
    "$1$2***",
  );
  // `Authorization: Bearer …`
  s = s.replace(/(Bearer\s+)([A-Za-z0-9._\-]{20,})/gi, "$1***");
  // Inline shell env assignments
  s = s.replace(
    /\b(REVENEXX_(?:TOKEN|API_KEY|KEY|COOKIE)\s*=\s*)([^\s;'"`]+)/g,
    "$1***",
  );
  // JSON / kv: token / api_key / secret / password / cookie / key
  s = s.replace(
    /(["'`]?(?:token|api[_-]?key|secret|password|cookie|key)["'`]?\s*[:=]\s*["'`]?)([^"'`\s,;}\]]{4,})/gi,
    "$1***",
  );
  return s;
};

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

export const parse = (data: unknown): void => {
  if (cliConfig.json) {
    drawJSON(data);
    return;
  }

  const obj = data as JsonObject;
  for (const key in obj) {
    if (obj[key] === null) {
      console.log(`${chalk.yellow.bold(key)} : null`);
    } else if (Array.isArray(obj[key])) {
      console.log(`${chalk.yellow.bold.underline(key)}`);
      if (typeof (obj[key] as unknown[])[0] === "object") {
        drawTable(obj[key] as JsonObject[]);
      } else {
        drawJSON(obj[key]);
      }
    } else if (typeof obj[key] === "object") {
      if ((obj[key] as { constructor?: { name?: string } })?.constructor?.name === "BigNumber") {
        console.log(`${chalk.yellow.bold(key)} : ${obj[key]}`);
      } else {
        console.log(`${chalk.yellow.bold.underline(key)}`);
        const tableRow = toJsonObject(obj[key]) ?? {};
        drawTable([tableRow]);
      }
    } else {
      console.log(`${chalk.yellow.bold(key)} : ${obj[key]}`);
    }
  }
};

export const drawTable = (data: Array<JsonObject | null | undefined>): void => {
  if (data.length == 0) {
    console.log("[]");
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
  // Create an object with all keys set to the default value ''
  const def = keys.reduce((result: Record<string, string>, key) => {
    result[key] = "-";
    return result;
  }, {});
  // Use object destructuring to replace all default values with the ones we have
  const normalizedData = rows.map((item) => ({ ...def, ...item }));

  const columns = Object.keys(normalizedData[0]);

  const table = new Table({
    head: columns.map((c) => chalk.cyan.italic.bold(c)),
    chars: {
      top: " ",
      "top-mid": " ",
      "top-left": " ",
      "top-right": " ",
      bottom: " ",
      "bottom-mid": " ",
      "bottom-left": " ",
      "bottom-right": " ",
      left: " ",
      "left-mid": " ",
      mid: chalk.cyan("─"),
      "mid-mid": chalk.cyan("┼"),
      right: " ",
      "right-mid": " ",
      middle: chalk.cyan("│"),
    },
  });

  normalizedData.forEach((row) => {
    const rowValues: string[] = [];
    for (const key of columns) {
      if (row[key] == null) {
        rowValues.push("-");
      } else if (Array.isArray(row[key])) {
        rowValues.push(JSON.stringify(row[key]));
      } else if (typeof row[key] === "object") {
        rowValues.push(JSON.stringify(row[key]));
      } else {
        rowValues.push(String(row[key]));
      }
    }
    table.push(rowValues);
  });
  console.log(table.toString());
};

export const drawJSON = (data: unknown): void => {
  console.log(JSON.stringify(data, null, 2));
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
    return `Tip: configure credentials with \`${EXECUTABLE_NAME} login\` or set REVENEXX_API_KEY + REVENEXX_TENANT.`;
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
      return `Tip: your token expired — run \`${EXECUTABLE_NAME} login --browser\` to mint a new one.`;
    }
    if (type === "general_unauthorized_scope") {
      return `Tip: the token is valid but lacks the required scope — issue a new Personal Access Token with the right permissions.`;
    }
    return `Tip: authentication failed — run \`${EXECUTABLE_NAME} login\` (or pass --token) and try again.`;
  }

  return null;
};

export const parseError = (err: Error): void => {
  if (cliConfig.report) {
    void (async () => {
      let appwriteVersion = "unknown";
      const endpoint = globalConfig.getEndpoint();

      try {
        const client = new Client().setEndpoint(endpoint);
        const res = (await client.call("get", "/health/version")) as {
          version: string;
        };
        appwriteVersion = res.version;
      } catch {
        // Silently fail
      }

      const version = SDK_VERSION;
      const commandArgs = extractReportCommandArgs(cliConfig.reportData);
      const stepsToReproduce = `Running \`${EXECUTABLE_NAME} ${commandArgs.join(" ")}\``;
      const yourEnvironment = `CLI version: ${version}\nOperation System: ${os.type()}\nRevenexx version: ${appwriteVersion}\nIs Cloud: ${isCloud()}`;

      const stack =
        "```\n" + redactSecrets(err.stack || err.message) + "\n```";

      const githubIssueUrl = new URL(
        "https://github.com/revenexx/revenexx/issues/new",
      );
      githubIssueUrl.searchParams.append("labels", "bug");
      githubIssueUrl.searchParams.append("template", "bug.yaml");
      githubIssueUrl.searchParams.append(
        "title",
        `🐛 Bug Report: ${err.message}`,
      );
      githubIssueUrl.searchParams.append(
        "actual-behavior",
        `CLI Error:\n${stack}`,
      );
      githubIssueUrl.searchParams.append(
        "steps-to-reproduce",
        stepsToReproduce,
      );
      githubIssueUrl.searchParams.append("environment", yourEnvironment);

      log(
        `To report this error you can:\n - Create a support ticket in our Discord server https://appwrite.io/discord \n - Create an issue in our Github\n   ${githubIssueUrl.href}\n`,
      );

      error("\n Stack Trace: \n");
      console.error(redactSecrets(err.stack || err.message));
      const tip = authHint(err);
      if (tip) hint(tip);
      process.exit(1);
    })();
  } else {
    if (cliConfig.verbose) {
      console.error(redactSecrets(err.stack || err.message));
      // Surface structured fields (code / type / response) without secrets.
      const meta = err as unknown as {
        code?: unknown;
        type?: unknown;
        response?: unknown;
      };
      if (meta.code !== undefined) console.error(`  code: ${meta.code}`);
      if (meta.type !== undefined)
        console.error(`  type: ${redactSecrets(meta.type)}`);
      if (meta.response !== undefined)
        console.error(`  response: ${redactSecrets(meta.response)}`);
    } else {
      log("For detailed error pass the --verbose or --report flag");
      error(err.message);
    }
    const tip = authHint(err);
    if (tip) hint(tip);
    process.exit(1);
  }
};

export const actionRunner = <
  T extends (...args: unknown[]) => Promise<unknown>,
>(
  fn: T,
): ((...args: Parameters<T>) => Promise<void>) => {
  return (...args: Parameters<T>) => {
    if (
      cliConfig.all &&
      Array.isArray(cliConfig.ids) &&
      cliConfig.ids.length !== 0
    ) {
      error(`The '--all' and '--id' flags cannot be used together.`);
      process.exit(1);
    }
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

export const log = (message?: string): void => {
  console.log(`${chalk.cyan.bold("ℹ Info:")} ${chalk.cyan(message ?? "")}`);
};

export const warn = (message?: string): void => {
  console.log(
    `${chalk.yellow.bold("ℹ Warning:")} ${chalk.yellow(message ?? "")}`,
  );
};

export const hint = (message?: string): void => {
  console.log(`${chalk.cyan.bold("♥ Hint:")} ${chalk.cyan(message ?? "")}`);
};

export const success = (message?: string): void => {
  console.log(
    `${chalk.green.bold("✓ Success:")} ${chalk.green(message ?? "")}`,
  );
};

export const error = (message?: string): void => {
  const safe = redactSecrets(message);
  console.error(`${chalk.red.bold("✗ Error:")} ${chalk.red(safe)}`);
};

export const logo = SDK_LOGO;

export const commandDescriptions: Record<string, string> = {
  account: `The account command allows you to authenticate and manage a user account.`,
  graphql: `The graphql command allows you to query and mutate any resource type on your Revenexx server.`,
  avatars: `The avatars command aims to help you complete everyday tasks related to your app image, icons, and avatars.`,
  databases: `(Legacy) The databases command allows you to create structured collections of documents and query and filter lists of documents.`,
  "tables-db": `The tables-db command allows you to create structured tables of columns and query and filter lists of rows.`,
  functions: `The functions command allows you to view, create, and manage your Cloud Functions.`,
  generate: `The generate command allows you to generate a type-safe SDK from your ${SDK_TITLE} project configuration.`,
  health: `The health command allows you to both validate and monitor your ${SDK_TITLE} server's health.`,
  locale: `The locale command allows you to customize your app based on your users' location.`,
  sites: `The sites command allows you to view, create and manage your Revenexx Sites.`,
  storage: `The storage command allows you to manage your project files.`,
  teams: `The teams command allows you to group users of your project to enable them to share read and write access to your project resources.`,
  update: `The update command allows you to update the ${SDK_TITLE} CLI to the latest version.`,
  users: `The users command allows you to manage your project users.`,
  projects: `The projects command allows you to manage your projects, add platforms, manage API keys, Dev Keys etc.`,
  project: `The project command allows you to manage project related resources like usage, variables, etc.`,
  client: `The client command allows you to configure your CLI`,
  login: `The login command allows you to authenticate and manage a user account.`,
  logout: `The logout command allows you to log out of your ${SDK_TITLE} account.`,
  whoami: `The whoami command gives information about the currently logged-in user.`,
  register: `Outputs the link to create an ${SDK_TITLE} account.`,
  console: `The console command gives you access to the APIs used by the Revenexx Console.`,
  messaging: `The messaging command allows you to manage topics and targets and send messages.`,
  migrations: `The migrations command allows you to migrate data between services.`,
  vcs: `The vcs command allows you to interact with VCS providers and manage your code repositories.`,
  main: chalk.redBright(`${logo}${description}`),
};

export { cliConfig };
