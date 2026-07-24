import type { Command } from "commander";
import inquirer from "inquirer";
import inquirerSearchList from "inquirer-search-list";
import chalk from "chalk";
import { resolveDefaultMode } from "./project-config.js";

// Also registered in cli.ts / interactive.ts; registering twice is harmless
// and keeps this module usable on its own (tests).
inquirer.registerPrompt("search-list", inquirerSearchList);

/** Longest description shown next to a command name in the picker. */
const DESCRIPTION_MAX = 60;

/**
 * Guided mode runs before commander parses argv, so global flags haven't been
 * processed yet — gate on the raw argv instead of cliConfig. Same contract as
 * lib/interactive.ts: humans at a TTY only, and `--json` (plus help requests)
 * keep commander's byte-stable non-interactive behavior.
 */
const canPick = (argv: string[]): boolean =>
  Boolean(process.stdin.isTTY && process.stdout.isTTY) &&
  !argv.includes("--json") &&
  !argv.includes("-j") &&
  !argv.includes("--help") &&
  !argv.includes("-h");

const findCommand = (parent: Command, name: string): Command | undefined =>
  parent.commands.find(
    (command) => command.name() === name || command.aliases().includes(name),
  );

const choiceFor = (
  command: Command,
  width: number,
): { name: string; value: string } => {
  const description = (command.description() ?? "")
    .split("\n")[0]
    .trim();
  const short =
    description.length > DESCRIPTION_MAX
      ? `${description.slice(0, DESCRIPTION_MAX - 1)}…`
      : description;
  return {
    name: short === ""
      ? command.name()
      : `${command.name().padEnd(width)}  ${chalk.dim(short)}`,
    value: command.name(),
  };
};

/**
 * Searchable picker over a command list. A partial token the user already
 * typed (`revenexx p`) pre-filters the list to matching names; if nothing
 * matches, every command is offered so a typo never dead-ends.
 */
const pickCommand = async (
  commands: readonly Command[],
  message: string,
  typed?: string,
): Promise<string> => {
  let list = [...commands];
  if (typed !== undefined && typed !== "") {
    const token = typed.toLowerCase();
    const matching = list.filter((command) =>
      command.name().toLowerCase().includes(token),
    );
    if (matching.length > 0) list = matching;
  }
  list.sort((a, b) => a.name().localeCompare(b.name()));
  const width = list.reduce(
    (max, command) => Math.max(max, command.name().length),
    0,
  );
  const answer = await inquirer.prompt([
    {
      type: "search-list",
      name: "value",
      message,
      choices: list.map((command) => choiceFor(command, width)),
    },
  ]);
  return answer.value as string;
};

/**
 * Resolve the command line interactively before commander parses it (guided
 * mode, DX-98 stretch goal):
 *
 * - `revenexx` on a TTY launches the full-screen TUI by default (DX-140);
 *   `REVENEXX_NO_TUI` / `defaultMode` opt back into the picker, which then
 *   picks a command then a subcommand — the picked command's own prompting
 *   (lib/interactive.ts) walks through its options.
 * - `revenexx p` with an unknown/partial name opens the picker filtered to
 *   matching commands; remaining argv passes through to the resolved command.
 *
 * Everywhere else (non-TTY, `--json`, help/version requests, flags first,
 * fully valid command lines) the original argv is returned untouched so
 * commander's behavior — including its errors — stays byte-identical. Any
 * picker failure also falls back to the original argv.
 */
export const resolveCommandArgv = async (
  program: Command,
  argv: string[],
): Promise<string[]> => {
  try {
    if (!canPick(argv)) return argv;
    const head = argv.slice(0, 2);
    let rest = argv.slice(2);

    let target: Command;
    if (rest.length === 0) {
      // DX-140: a bare `revenexx` on a TTY lands in the full-screen TUI by
      // default. `REVENEXX_NO_TUI` / `defaultMode: guided|help` opt out (see
      // resolveDefaultMode). `help` returns argv untouched so commander prints
      // usage like the non-TTY path; `tui` routes through the existing `tui`
      // command so its runTui launch/exit plumbing is reused verbatim. The
      // guard keeps test builds (no `tui` command) on the guided picker.
      const mode = resolveDefaultMode();
      if (mode === "help") return argv;
      if (mode === "tui" && findCommand(program, "tui") !== undefined) {
        return [...head, "tui"];
      }
      const picked = await pickCommand(program.commands, "Select a command");
      target = findCommand(program, picked)!;
    } else if (rest[0].startsWith("-")) {
      // Global flags before the command name (e.g. --endpoint) — too
      // ambiguous to resolve safely, let commander handle it.
      return argv;
    } else {
      const known = findCommand(program, rest[0]);
      if (known !== undefined) {
        target = known;
      } else {
        const picked = await pickCommand(
          program.commands,
          "Select a command",
          rest[0],
        );
        target = findCommand(program, picked)!;
      }
      rest = rest.slice(1);
    }

    if (target.commands.length === 0) {
      return [...head, target.name(), ...rest];
    }

    // The target has subcommands (a service): resolve the next token the
    // same way, or pick one when it's missing entirely.
    if (rest.length === 0) {
      const picked = await pickCommand(
        target.commands,
        `Select a ${target.name()} command`,
      );
      return [...head, target.name(), picked];
    }
    if (rest[0].startsWith("-") || findCommand(target, rest[0]) !== undefined) {
      return [...head, target.name(), ...rest];
    }
    const picked = await pickCommand(
      target.commands,
      `Select a ${target.name()} command`,
      rest[0],
    );
    return [...head, target.name(), picked, ...rest.slice(1)];
  } catch {
    return argv;
  }
};
