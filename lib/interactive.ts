import inquirer from "inquirer";
import inquirerSearchList from "inquirer-search-list";
import chalk from "chalk";
import { cliConfig, parseInteger } from "./parser.js";

// cli.ts registers this too, but lib consumers (and tests) may reach these
// helpers without going through cli.ts — registering twice is harmless.
inquirer.registerPrompt("search-list", inquirerSearchList);

/** Points a resource-ID prompt at the endpoint that lists candidate values. */
export interface ResourcePicker {
  /** GET path returning the candidate resources, e.g. `/products`. */
  listPath: string;
  /** Whether that endpoint accepts a `limit` query parameter. */
  hasLimit: boolean;
}

/**
 * Generation-time description of one command option, emitted by
 * getCliPromptSpecs() in the SDK generator. Everything the runtime needs to
 * prompt for a missing value — or fail fast exactly like commander when the
 * session is not interactive.
 */
export interface PromptSpec {
  /** commander opts key, e.g. `familyId`. */
  key: string;
  /** Flag syntax for the fail-fast error, e.g. `--family-id <family-id>`. */
  option: string;
  /** Spec parameter name, e.g. `family_id`. */
  name: string;
  description?: string;
  type: string;
  required: boolean;
  /** Mask input while typing (passwords, tokens, API keys). */
  secret?: boolean;
  enum?: string[];
  resource?: ResourcePicker;
}

/**
 * Prompting is reserved for humans at a terminal: both stdin and stdout must be
 * TTYs. This keys off the streams alone, not the output format, so every format
 * behaves the same — `--json`/`--csv`/`--yaml` all prompt on a terminal and all
 * fail fast when piped. Machine-readable output stays byte-stable regardless:
 * redirecting stdout (`> file`, `| jq`) makes it a non-TTY, which suppresses
 * prompts, and the interactive prompt chrome renders to the TTY and is cleared
 * before the final payload is written.
 */
export const isInteractive = (): boolean =>
  Boolean(process.stdin.isTTY && process.stdout.isTTY);

/** Longest description rendered inline in a prompt message. */
const MESSAGE_MAX = 70;

const messageFor = (spec: PromptSpec): string => {
  const description = (spec.description ?? "").trim().replace(/\s+/g, " ");
  if (description === "") return spec.name;
  const short =
    description.length > MESSAGE_MAX
      ? `${description.slice(0, MESSAGE_MAX - 1)}…`
      : description;
  return `${spec.name} ${chalk.dim(`(${short})`)}`;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Pull the resource rows out of a list-endpoint response. The gateway wraps
 * collections as `{ items: [...], page: {...} }`; stay defensive about bare
 * arrays and other envelope key names.
 */
export const extractItems = (response: unknown): Record<string, unknown>[] => {
  if (Array.isArray(response)) return response.filter(isObject);
  if (!isObject(response)) return [];
  if (Array.isArray(response.items)) return response.items.filter(isObject);
  for (const value of Object.values(response)) {
    if (Array.isArray(value)) return value.filter(isObject);
  }
  return [];
};

/** Fields tried (in order) for a human-readable choice label. */
const LABEL_FIELDS = ["name", "title", "label", "sku", "code", "email", "slug"];

/**
 * Build a picker choice for one listed resource: value is what the API path
 * expects (the field matching the path-parameter name, falling back to common
 * id fields), label is the friendliest string the row offers. Returns null
 * when no usable identifier exists.
 */
export const resourceChoice = (
  item: Record<string, unknown>,
  paramName: string,
): { name: string; value: string } | null => {
  const value =
    item[paramName] ?? item.id ?? item.$id ?? item.code ?? item.key;
  if (value === undefined || value === null || value === "") return null;
  const id = String(value);
  const label = LABEL_FIELDS.map((field) => item[field]).find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate !== "",
  );
  return {
    name: label !== undefined && label !== id ? `${label} ${chalk.dim(id)}` : id,
    value: id,
  };
};

/** Split a free-text answer for an array parameter into its values. */
export const splitArrayInput = (value: string): string[] =>
  value
    .split(/[,\s]+/)
    .map((part) => part.trim())
    .filter((part) => part !== "");

const validateRequiredText = (value: string): boolean | string =>
  value.trim() !== "" ? true : "A value is required.";

const validateRequiredArrayText = (value: string): boolean | string =>
  splitArrayInput(value).length > 0 ? true : "At least one value is required.";

const validateInteger = (value: string): boolean | string => {
  try {
    parseInteger(value);
    return true;
  } catch {
    return "Not a number.";
  }
};

const validateJson = (value: string): boolean | string => {
  try {
    JSON.parse(value);
    return true;
  } catch {
    return "Not valid JSON.";
  }
};

/**
 * Live searchable picker for a resource-ID parameter, backed by the paired
 * list endpoint. Falls back to a plain text prompt when the listing fails or
 * comes back empty (no access, empty tenant, …) so the user is never stuck.
 */
const pickResource = async (spec: PromptSpec): Promise<unknown> => {
  const resource = spec.resource!;
  let items: Record<string, unknown>[] = [];
  try {
    // Lazy import: pulling in sdks.js eagerly would drag config/session
    // side effects into every consumer of this module (notably unit tests).
    const { sdkForProject } = await import("./sdks.js");
    const client = await sdkForProject();
    const response = await client.call(
      "get",
      resource.listPath,
      { "content-type": "application/json" },
      resource.hasLimit ? { limit: 100 } : {},
    );
    items = extractItems(response);
  } catch {
    items = [];
  }
  const choices = items
    .map((item) => resourceChoice(item, spec.name))
    .filter((choice): choice is { name: string; value: string } => choice !== null);
  if (choices.length === 0) {
    return promptForValue({ ...spec, resource: undefined });
  }
  const answer = await inquirer.prompt([
    {
      type: "search-list",
      name: "value",
      message: messageFor(spec),
      choices,
    },
  ]);
  return answer.value;
};

/** Ask for a single parameter value with the prompt type its spec calls for. */
export const promptForValue = async (spec: PromptSpec): Promise<unknown> => {
  if (spec.resource !== undefined) {
    return pickResource(spec);
  }
  if (spec.enum !== undefined && spec.enum.length > 0) {
    const answer = await inquirer.prompt([
      {
        type: spec.type === "array" ? "checkbox" : "list",
        name: "value",
        message: messageFor(spec),
        choices: spec.enum,
        validate:
          spec.type === "array" && spec.required
            ? (value: unknown[]) =>
                value.length > 0 ? true : "Select at least one value."
            : undefined,
      },
    ]);
    return answer.value;
  }
  switch (spec.type) {
    case "boolean": {
      const answer = await inquirer.prompt([
        { type: "confirm", name: "value", message: messageFor(spec) },
      ]);
      return answer.value;
    }
    case "integer":
    case "number": {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "value",
          message: messageFor(spec),
          validate: validateInteger,
        },
      ]);
      return parseInteger(answer.value);
    }
    case "array": {
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "value",
          message: `${messageFor(spec)} ${chalk.dim("(comma-separated)")}`,
          validate: spec.required ? validateRequiredArrayText : undefined,
        },
      ]);
      return splitArrayInput(answer.value);
    }
    case "object": {
      // Kept as a string: the command payload does its own JSON.parse.
      const answer = await inquirer.prompt([
        {
          type: "input",
          name: "value",
          message: `${messageFor(spec)} ${chalk.dim("(JSON)")}`,
          validate: validateJson,
        },
      ]);
      return answer.value;
    }
    default: {
      const answer = await inquirer.prompt([
        {
          type: spec.secret ? "password" : "input",
          name: "value",
          message: messageFor(spec),
          mask: spec.secret ? "*" : undefined,
          validate: validateRequiredText,
        },
      ]);
      return answer.value;
    }
  }
};

/** Minimal slice of commander's Command used to fail exactly like it does. */
interface CommanderLike {
  error(message: string, errorOptions?: { exitCode?: number; code?: string }): never;
}

/**
 * Fill in missing required options: prompt for each one on an interactive
 * terminal, or fail fast with commander's own missing-mandatory-option error
 * everywhere else (CI, pipes, `--json`) so automation never hangs. Returns
 * the merged option map the command action destructures from.
 */
export const promptForMissing = async (
  // Loose signatures on purpose: commander hands action handlers untyped
  // (options, command) arguments, and the generated call sites pass them
  // straight through.
  options: unknown,
  specs: PromptSpec[],
  command?: unknown,
  // Command actions destructure loosely-typed values, matching commander's own opts().
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<Record<string, any>> => {
  const optionMap = (options ?? {}) as Record<string, unknown>;
  const missing = specs.filter(
    (spec) => spec.required && optionMap[spec.key] === undefined,
  );
  if (missing.length === 0) return optionMap;
  if (!isInteractive()) {
    const message = `error: required option '${missing[0].option}' not specified`;
    const commander = command as CommanderLike | undefined;
    if (commander !== undefined) {
      commander.error(message, {
        exitCode: 1,
        code: "commander.missingMandatoryOptionValue",
      });
    }
    process.stderr.write(`${message}\n`);
    process.exit(1);
  }
  const answers: Record<string, unknown> = {};
  for (const spec of missing) {
    answers[spec.key] = await promptForValue(spec);
  }
  return { ...optionMap, ...answers };
};

/**
 * Gate a destructive command behind an explicit yes. Skipped with `--force`
 * and in non-interactive contexts (scripts keep their existing fire-and-run
 * semantics — this guard is for humans).
 */
export const confirmDestructive = async (action: string): Promise<void> => {
  if (cliConfig.force || !isInteractive()) return;
  const answer = await inquirer.prompt([
    {
      type: "confirm",
      name: "confirmed",
      message: `You are about to run \`${action}\` — this cannot be undone. Continue?`,
      default: false,
    },
  ]);
  if (!answer.confirmed) {
    process.stderr.write(`${chalk.yellow("!")} Aborted.\n`);
    process.exit(1);
  }
};
