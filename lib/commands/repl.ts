import { Command } from "commander";
import readline from "readline";
import chalk from "chalk";
import {
  actionRunner,
  commandDescriptions,
  log,
  error,
  cliConfig,
} from "../parser.js";
import { EXECUTABLE_NAME } from "../constants.js";
import { tokenize, resolveAliases } from "../alias.js";
import { getErrorMessage } from "../utils.js";
import type { CliConfig } from "../types.js";

const EXIT_WORDS = new Set(["exit", "quit", ".exit", "q"]);
const HELP_WORDS = new Set(["help", "?", ".help"]);

/** How many lines of in-session command history the up-arrow can walk back. */
const HISTORY_SIZE = 1000;

/**
 * Sentinel thrown by the process.exit stub below. A command's error handler
 * (actionRunner → parseError) calls process.exit(1) after printing the error;
 * inside the REPL we translate that into a throw so a single failing command
 * ends the *line*, not the whole shell.
 */
class ReplExit extends Error {
  constructor(message?: string) {
    super(message);
    // parser.ts's parseError keys off this name to stay transparent to the
    // sentinel (it can't import this class — that would be a cycle).
    this.name = "ReplExit";
  }
}

/** Commander signals help/version/parse issues by throwing after it has already
 * written to the terminal — swallow those so the loop just re-prompts. */
const isCommanderNotice = (err: unknown): boolean =>
  typeof (err as { code?: unknown })?.code === "string" &&
  (err as { code: string }).code.startsWith("commander.");

/**
 * Tab-completion over the live commander tree: top-level command names for the
 * first token, the matched service's subcommands for the second. Shared with
 * the same program the CLI uses, so it always reflects the real command set.
 */
const completer = (
  program: Command,
  line: string,
): [string[], string] => {
  const tokens = line.replace(/^\s+/, "").split(/\s+/);
  if (tokens.length <= 1) {
    const fragment = tokens[0] ?? "";
    const names = program.commands.map((command) => command.name()).sort();
    const hits = names.filter((name) => name.startsWith(fragment));
    return [hits.length ? hits : names, fragment];
  }
  if (tokens.length === 2) {
    const service = program.commands.find(
      (command) =>
        command.name() === tokens[0] ||
        command.aliases().includes(tokens[0]),
    );
    if (service) {
      const fragment = tokens[1];
      const subs = service.commands.map((command) => command.name()).sort();
      const hits = subs.filter((name) => name.startsWith(fragment));
      return [hits.length ? hits : subs, fragment];
    }
  }
  return [[], line];
};

/**
 * Global flags (`--json`, `--tenant`, `--verbose`, …) are parsed by commander
 * into the shared `cliConfig`, whose handlers only *set* on presence and never
 * reset on absence. Across REPL lines that would make a one-off `--json` sticky
 * forever. Before each line we restore `cliConfig` to the session baseline
 * (which itself reflects any flags passed when `repl` was launched), so every
 * command starts clean — exactly like a fresh top-level invocation.
 */
const resetCliConfig = (baseline: CliConfig): void => {
  cliConfig.output = baseline.output;
  cliConfig.json = baseline.json;
  cliConfig.fields = baseline.fields;
  cliConfig.data = baseline.data;
  cliConfig.verbose = baseline.verbose;
  cliConfig.force = baseline.force;
  cliConfig.report = baseline.report;
  cliConfig.reportData = baseline.reportData;
  cliConfig.retry = baseline.retry;
  cliConfig.debug = baseline.debug;
  cliConfig.quiet = baseline.quiet;
  cliConfig.endpoint = baseline.endpoint;
  cliConfig.token = baseline.token;
  cliConfig.tenant = baseline.tenant;
  cliConfig.timeout = baseline.timeout;
};

/** Parse and run one line against the program, isolating errors and exits. */
const runLine = async (
  program: Command,
  raw: string,
  baseline: CliConfig,
): Promise<void> => {
  resetCliConfig(baseline);

  // Reuse the same alias expansion the top-level CLI applies.
  const argv = resolveAliases(program, ["node", EXECUTABLE_NAME, ...tokenize(raw)]);
  const tokens = argv.slice(2);
  if (tokens.length === 0) return;

  const originalExit = process.exit.bind(process);
  process.exit = ((code?: number): never => {
    throw new ReplExit(String(code ?? 0));
  }) as typeof process.exit;

  try {
    await program.parseAsync(tokens, { from: "user" });
  } catch (err) {
    if (err instanceof ReplExit) {
      // A command already reported its own failure before "exiting".
    } else if (isCommanderNotice(err)) {
      // Help/version/unknown-command notices are already on screen.
    } else {
      error(getErrorMessage(err));
    }
  } finally {
    process.exit = originalExit;
  }
};

/**
 * Read a single line with tab-completion, then close the readline before
 * returning. Only one reader is ever alive at a time: this is what lets a
 * command's own inquirer prompt (the missing-arg search/select) take over the
 * terminal without fighting the shell's reader — the bug that used to tear the
 * session down. Resolves `null` on EOF (Ctrl-D).
 *
 * Seed each reader with the session `history` (newest-first — the order
 * readline walks on ↑) so up-arrow recalls earlier commands even though the
 * reader itself is short-lived. We hand readline a copy and keep the source of
 * truth in `runRepl`; the reader only reads from it here.
 */
const askLine = (
  program: Command,
  prompt: string,
  history: string[],
): Promise<string | null> =>
  new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      completer: (line: string) => completer(program, line),
      history: [...history],
      historySize: HISTORY_SIZE,
    });
    let settled = false;
    const finish = (value: string | null): void => {
      if (settled) return;
      settled = true;
      rl.close();
      resolve(value);
    };
    // Ctrl-C cancels the current line and re-prompts (resolve empty); Ctrl-D /
    // EOF closes the reader with no answer and ends the shell.
    rl.on("SIGINT", () => {
      process.stdout.write("\n");
      finish("");
    });
    rl.on("close", () => finish(null));
    rl.question(prompt, (answer: string) => finish(answer));
  });

const runRepl = async (program: Command): Promise<void> => {
  // Commander must throw instead of exiting the process on parse issues.
  program.exitOverride();

  // Snapshot the flags the shell was launched with; each command is reset to
  // this baseline so a one-off `--json`/`--tenant`/… never leaks to the next.
  const baseline: CliConfig = {
    ...cliConfig,
    endpoint: cliConfig.endpoint,
    token: cliConfig.token,
    tenant: cliConfig.tenant,
    timeout: cliConfig.timeout,
  };

  // The per-command context banner (parser.ts renderContextBanner) fires on
  // every command run here too — so the production warning keeps showing for
  // each command in the session, which is exactly where a rapid-fire shell most
  // needs it. We deliberately don't mute it.
  log(
    `Interactive shell — type a command, ${chalk.cyan("help")}, or ${chalk.cyan("exit")}. Tab completes command names.`,
  );

  const prompt = chalk.cyan(`${EXECUTABLE_NAME}> `);
  // Session command history, newest-first (readline's ↑ order). Seeds each
  // per-line reader; lives only for the session (not persisted to disk).
  const history: string[] = [];
  for (;;) {
    const line = await askLine(program, prompt, history);
    if (line === null) {
      // Ctrl-D / EOF.
      process.stdout.write("\n");
      break;
    }
    const trimmed = line.trim();
    if (trimmed === "") continue;
    // Record for ↑ recall before acting on it: newest-first, collapsing an
    // immediate repeat of the last command, capped at HISTORY_SIZE.
    if (history[0] !== trimmed) {
      history.unshift(trimmed);
      if (history.length > HISTORY_SIZE) history.length = HISTORY_SIZE;
    }
    if (EXIT_WORDS.has(trimmed)) break;
    if (HELP_WORDS.has(trimmed)) {
      program.outputHelp();
      continue;
    }
    // The reader is now closed, so the command may prompt for missing args.
    await runLine(program, trimmed, baseline);
  }

  // Leave stdin in a clean, non-blocking state so the process can exit.
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(false);
    } catch {
      // Non-TTY / unsupported — safe to ignore.
    }
  }
  process.stdin.pause();
};

export const repl = new Command("repl")
  .description(commandDescriptions["repl"])
  .configureHelp({ helpWidth: process.stdout.columns || 80 })
  .action(
    actionRunner(async (_options: unknown, command: Command) => {
      const program = command.parent;
      if (!program) return;
      if (!process.stdin.isTTY || !process.stdout.isTTY) {
        error(
          `The REPL needs an interactive terminal. Run \`${EXECUTABLE_NAME} <command>\` directly in scripts.`,
        );
        return;
      }
      await runRepl(program);
    }),
  );
