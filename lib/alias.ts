import { Command } from "commander";
import chalk from "chalk";
import {
  actionRunner,
  success,
  log,
  warn,
  error,
  hint,
  drawTable,
  drawJSON,
  cliConfig,
} from "./parser.js";
import { globalConfig } from "./config.js";
import { EXECUTABLE_NAME } from "./constants.js";

/**
 * Command aliases (DX-111) — git-style short forms resolved *before* commander
 * parses argv, so `revenexx p ls` reaches `revenexx products list` without any
 * per-command wiring.
 *
 * Two layers, applied in order (see resolveAliases):
 *   1. User-defined aliases (`alias set …`), persisted in globalConfig.
 *   2. Built-in abbreviations for services and verbs.
 *
 * Every rewrite is gated on the target command actually existing in the
 * program, so a built-in alias is a harmless no-op on an SDK whose spec doesn't
 * ship that service, and a real command always wins over an alias of the same
 * name (an alias can never silently shadow core functionality).
 */

/**
 * Built-in first-token abbreviations for common services. Entries whose target
 * service isn't present in this SDK are ignored at resolution time, so this
 * list can stay generous without risking a wrong rewrite.
 */
export const BUILTIN_COMMAND_ALIASES: Record<string, string> = {
  p: "products",
  prod: "products",
  prods: "products",
  o: "orders",
  ord: "orders",
  cust: "customers",
  cat: "categories",
  cats: "categories",
  fam: "families",
  attr: "attributes",
  inv: "inventories",
  pay: "payments",
  ship: "shipping",
  msg: "messaging",
  cart: "carts",
  s: "sites",
  price: "prices",
  tok: "tokens",
};

/**
 * Built-in second-token abbreviations for the CRUD verbs every service shares.
 * Scoped to the resolved service's subcommands at resolution time.
 */
export const BUILTIN_VERB_ALIASES: Record<string, string> = {
  ls: "list",
  l: "list",
  rm: "delete",
  del: "delete",
  d: "delete",
  mk: "create",
  new: "create",
  add: "create",
  g: "get",
  up: "update",
  upd: "update",
  edit: "update",
};

/** Reserved names a user alias may not take (they'd shadow alias management). */
const RESERVED_ALIAS_NAMES = new Set(["alias", "help"]);

/**
 * Split an alias expansion into argv tokens, honouring single/double quotes so
 * `alias set deploy "apps create-deployment --activate true"` round-trips. A
 * deliberately tiny shell-ish splitter — no variable/glob expansion.
 */
export const tokenize = (input: string): string[] => {
  const tokens: string[] = [];
  let current = "";
  let quote: '"' | "'" | null = null;
  let started = false;
  for (const char of input) {
    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      started = true;
      continue;
    }
    if (/\s/.test(char)) {
      if (started) {
        tokens.push(current);
        current = "";
        started = false;
      }
      continue;
    }
    current += char;
    started = true;
  }
  if (started) tokens.push(current);
  return tokens;
};

const findCommand = (
  parent: Command,
  name: string,
): Command | undefined =>
  parent.commands.find(
    (command) => command.name() === name || command.aliases().includes(name),
  );

const hasCommand = (parent: Command, name: string): boolean =>
  findCommand(parent, name) !== undefined;

/**
 * Rewrite argv by applying user-defined and built-in aliases. Pure and
 * synchronous — safe to run before commander parsing and the guided picker.
 * Returns the original argv untouched when nothing matches.
 */
export const resolveAliases = (
  program: Command,
  argv: string[],
): string[] => {
  if (argv.length <= 2) return argv;
  const head = argv.slice(0, 2);
  const rest = argv.slice(2);

  // Flags before the command name are too ambiguous to rewrite safely.
  if (rest[0]?.startsWith("-")) return argv;

  let tokens = [...rest];

  // 1. User-defined alias on the first token. Real commands always win.
  const userAliases = globalConfig.getAliases();
  if (
    tokens[0] &&
    Object.prototype.hasOwnProperty.call(userAliases, tokens[0]) &&
    !hasCommand(program, tokens[0])
  ) {
    tokens = [...tokenize(userAliases[tokens[0]]), ...tokens.slice(1)];
  }

  // 2. Built-in service abbreviation on the first token.
  if (tokens[0] && !tokens[0].startsWith("-") && !hasCommand(program, tokens[0])) {
    const canonical = BUILTIN_COMMAND_ALIASES[tokens[0]];
    if (canonical && hasCommand(program, canonical)) {
      tokens[0] = canonical;
    }
  }

  // 3. Built-in verb abbreviation on the second token, scoped to the service.
  const service = tokens[0] ? findCommand(program, tokens[0]) : undefined;
  if (
    service &&
    tokens[1] &&
    !tokens[1].startsWith("-") &&
    !hasCommand(service, tokens[1])
  ) {
    const canonicalVerb = BUILTIN_VERB_ALIASES[tokens[1]];
    if (canonicalVerb && hasCommand(service, canonicalVerb)) {
      tokens[1] = canonicalVerb;
    }
  }

  return [...head, ...tokens];
};

/**
 * The `alias` command: manage user-defined aliases. Built-in aliases are
 * fixed and listed for reference under `alias list`.
 */
export const alias = new Command("alias")
  .description(
    "Manage command aliases — short forms for commands you run often.",
  )
  .configureHelp({ helpWidth: process.stdout.columns || 80 });

alias
  .command("set <name> <expansion...>")
  .description(
    `Create or update an alias, e.g. \`${EXECUTABLE_NAME} alias set deploy "apps create-deployment --activate true"\``,
  )
  .action(
    actionRunner(async (name: string, expansionParts: string[], _opts, command: Command) => {
      const program = command.parent?.parent;
      if (name.startsWith("-") || /\s/.test(name)) {
        error(`Invalid alias name '${name}'. Use a single word without spaces.`);
        return;
      }
      if (RESERVED_ALIAS_NAMES.has(name)) {
        error(`'${name}' is reserved and cannot be used as an alias.`);
        return;
      }
      if (program && findCommand(program, name)) {
        warn(
          `'${name}' is also a built-in command, which always takes precedence — this alias will never resolve.`,
        );
      }
      const expansion = expansionParts.join(" ").trim();
      if (!expansion) {
        error("Alias expansion cannot be empty.");
        return;
      }
      globalConfig.setAlias(name, expansion);
      success(`Alias '${name}' → ${chalk.cyan(expansion)}`);
    }),
  );

alias
  .command("list")
  .alias("ls")
  .description("List user-defined and built-in aliases")
  .action(
    actionRunner(async () => {
      const userAliases = globalConfig.getAliases();
      const userRows = Object.entries(userAliases).map(([name, expansion]) => ({
        Alias: name,
        "Expands to": expansion,
        Type: "user",
      }));
      const builtinRows = [
        ...Object.entries(BUILTIN_COMMAND_ALIASES),
        ...Object.entries(BUILTIN_VERB_ALIASES),
      ].map(([name, expansion]) => ({
        Alias: name,
        "Expands to": expansion,
        Type: "built-in",
      }));
      const rows = [...userRows, ...builtinRows];

      if (cliConfig.json) {
        drawJSON(rows);
        return;
      }
      if (userRows.length === 0) {
        log(
          `No user-defined aliases yet. Create one with \`${EXECUTABLE_NAME} alias set <name> "<command>"\`.`,
        );
      }
      drawTable(rows);
    }),
  );

alias
  .command("remove <name>")
  .alias("rm")
  .description("Remove a user-defined alias")
  .action(
    actionRunner(async (name: string) => {
      if (globalConfig.removeAlias(name)) {
        success(`Removed alias '${name}'`);
      } else {
        error(`No user-defined alias named '${name}'.`);
        hint(`Run \`${EXECUTABLE_NAME} alias list\` to see the current aliases.`);
      }
    }),
  );
