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
  /** Whether that endpoint accepts a `search` query parameter — lets the
   * TUI picker filter server-side instead of only over the first page. */
  search?: boolean;
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
  /** The schema default, as a display string — shown as a form placeholder so
   * an empty field's effect is legible. Absent when the schema has none. */
  default?: string;
  resource?: ResourcePicker;
  /** A commander positional argument (e.g. `skills add <repo> <name>`) rather
   * than a `--flag` option — emitted as a bare token before the options. */
  positional?: boolean;
  /** Positional that consumes the rest of the argv (e.g. `<files...>`). */
  variadic?: boolean;
}

/**
 * Prompt specs looked up by command object. The generated service modules
 * register every command's full spec list (required and optional) here so
 * surfaces that browse the live commander tree — the DX-118 TUI's generated
 * forms — can read them without re-parsing anything. WeakMap keyed by the
 * commander Command instance: no name collisions, garbage-collects with the
 * program.
 */
const promptSpecRegistry = new WeakMap<object, PromptSpec[]>();

/** Command traits the TUI needs beyond parameters. */
export interface CommandMeta {
  /** DELETE-backed command: the TUI gates it behind its own confirm modal
   * (one-shot mode keeps confirmDestructive / `--force` semantics). */
  destructive?: boolean;
  /** Lower-case HTTP method behind the command — lets the TUI auto-run safe
   * reads once their required parameters are picked. */
  method?: string;
}

const commandMetaRegistry = new WeakMap<object, CommandMeta>();

export const registerPromptSpecs = (
  command: object,
  specs: PromptSpec[],
  meta?: CommandMeta,
): void => {
  promptSpecRegistry.set(command, specs);
  if (meta !== undefined) {
    commandMetaRegistry.set(command, meta);
  }
};

export const getPromptSpecs = (command: object): PromptSpec[] =>
  promptSpecRegistry.get(command) ?? [];

export const getCommandMeta = (command: object): CommandMeta =>
  commandMetaRegistry.get(command) ?? {};

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
): { name: string; value: string; label: string } | null => {
  const value =
    item[paramName] ?? item.id ?? item.$id ?? item.code ?? item.key;
  if (value === undefined || value === null || value === "") return null;
  const id = String(value);
  const label = LABEL_FIELDS.map((field) => item[field]).find(
    (candidate): candidate is string =>
      typeof candidate === "string" && candidate !== "",
  );
  const plain = label !== undefined && label !== id ? label : "";
  return {
    // inquirer display string; the TUI renders value + label itself.
    name: plain !== "" ? `${plain} ${chalk.dim(id)}` : id,
    value: id,
    label: plain,
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

/** One pickable candidate for a resource-ID parameter. */
export interface ResourceChoiceEntry {
  /** inquirer display string (may carry ANSI dim styling around the id). */
  name: string;
  /** The identifier the API path expects. */
  value: string;
  /** Plain human label ("" when the item offers nothing beyond its id). */
  label: string;
}

/** Page size for candidate listings — the gateway's documented maximum. */
export const RESOURCE_CHOICE_LIMIT = 200;

/**
 * Fetch the candidate values for a resource-ID parameter from its paired
 * list endpoint, optionally filtered server-side when the endpoint supports
 * a `search` parameter. Returns [] whenever listing fails or comes back
 * empty (no access, empty tenant, …) — callers fall back to free-text input.
 * Shared by the inquirer picker below and the TUI form's search field.
 */
const fetchResourceItems = async (
  spec: PromptSpec,
  query: string,
): Promise<Record<string, unknown>[]> => {
  const resource = spec.resource;
  if (resource === undefined) return [];
  try {
    // Lazy import: pulling in sdks.js eagerly would drag config/session
    // side effects into every consumer of this module (notably unit tests).
    const { sdkForProject } = await import("./sdks.js");
    const client = await sdkForProject();
    const params: Record<string, unknown> = {};
    if (resource.hasLimit) params.limit = RESOURCE_CHOICE_LIMIT;
    if (resource.search === true && query.trim() !== "") {
      params.search = query.trim();
    }
    const response = await client.call(
      "get",
      resource.listPath,
      { "content-type": "application/json" },
      params,
    );
    return extractItems(response);
  } catch {
    return [];
  }
};

export const listResourceChoices = async (
  spec: PromptSpec,
  query = "",
): Promise<ResourceChoiceEntry[]> => {
  const items = await fetchResourceItems(spec, query);
  return items
    .map((item) => resourceChoice(item, spec.name))
    .filter((choice): choice is ResourceChoiceEntry => choice !== null);
};

/** One pickable record for a resource-ID parameter: the full row (so the TUI
 * picker can show the real list table) plus the identifier the API path
 * expects. Rows without a usable identifier are dropped. */
export interface ResourceRecord {
  row: Record<string, unknown>;
  value: string;
}

/** Like {@link listResourceChoices} but keeps the whole record, so the TUI can
 * render the paired list as a filterable table and pick a row's id. */
export const listResourceRecords = async (
  spec: PromptSpec,
  query = "",
): Promise<ResourceRecord[]> => {
  const items = await fetchResourceItems(spec, query);
  return items
    .map((row) => {
      const choice = resourceChoice(row, spec.name);
      return choice === null ? null : { row, value: choice.value };
    })
    .filter((record): record is ResourceRecord => record !== null);
};

/**
 * Live searchable picker for a resource-ID parameter, backed by the paired
 * list endpoint. Falls back to a plain text prompt when the listing fails or
 * comes back empty (no access, empty tenant, …) so the user is never stuck.
 */
const pickResource = async (spec: PromptSpec): Promise<unknown> => {
  const choices = await listResourceChoices(spec);
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
