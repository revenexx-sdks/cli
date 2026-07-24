import { Command } from "commander";
import { actionRunner, commandDescriptions, error } from "../parser.js";
import {
  getPromptSpecs,
  getCommandMeta,
  type PromptSpec,
} from "../interactive.js";
import { EXECUTABLE_NAME } from "../constants.js";
import { listResource, owningList } from "../tui/command-tree.js";

const SECRET_RE = /password|secret|token|api[-_]?key/i;

/** Top-level commands the TUI hides: they don't fit a browse-and-run,
 * results-in-a-table shell — either they start another interactive session
 * (`repl`, `tui` itself) or they are local/dev tooling that produces files or
 * mutates the install rather than calling the gateway (`update`, `generate`,
 * `types`, `completion`). One-shot invocation of these is unaffected. */
const TUI_HIDDEN_COMMANDS = new Set([
  "tui",
  "repl",
  "update",
  "generate",
  "types",
  "completion",
]);

/** Positional args (`<repo>`) as PromptSpecs, in declared order. */
const positionalSpecs = (command: Command): PromptSpec[] => {
  const args =
    (command as unknown as {
      _args?: Array<{
        name: () => string;
        required: boolean;
        variadic: boolean;
        description?: string;
      }>;
    })._args ?? [];
  return args.map((arg, index) => ({
    key: `_arg${index}`,
    option: `<${arg.name()}>`,
    name: arg.name(),
    description: arg.description || undefined,
    type: "string",
    required: arg.required,
    positional: true,
    variadic: arg.variadic,
  }));
};

/** Synthesize option specs from the command's own commander options — used for
 * plugin commands (skills, create, deploy, apps) that don't emit rich
 * PromptSpecs via registerPromptSpecs. Enum/resource metadata isn't available
 * this way, so these render as plain text/boolean/array fields. */
const optionSpecs = (command: Command): PromptSpec[] => {
  const options =
    (command as unknown as {
      options?: Array<{
        long?: string;
        short?: string;
        description: string;
        mandatory: boolean;
        required: boolean;
        optional: boolean;
        variadic: boolean;
        attributeName: () => string;
      }>;
    }).options ?? [];
  return options
    .filter((option) => option.long !== undefined && option.long !== "--help")
    .map((option) => {
      const flag = option.long ?? option.short!;
      const takesValue = option.required || option.optional;
      const type = option.variadic ? "array" : takesValue ? "string" : "boolean";
      return {
        key: option.attributeName(),
        option: takesValue ? `${flag} <value>` : flag,
        name: flag.replace(/^--/, ""),
        description: option.description || undefined,
        type,
        required: option.mandatory === true,
        secret: SECRET_RE.test(flag) || undefined,
      };
    });
};

/** All the inputs the TUI form should collect for a command: positional args
 * first (declared order), then options — the rich registered specs for
 * generated service commands, or synthesized commander options for plugins. */
export const specsFor = (command: Command): PromptSpec[] => {
  const registered = getPromptSpecs(command);
  const options = registered.length > 0 ? registered : optionSpecs(command);
  return [...positionalSpecs(command), ...options];
};

export const tui = new Command("tui")
  .description(commandDescriptions["tui"])
  .option(
    "--theme <name>",
    "Start with a named colour theme (e.g. dark, light, dracula); press ^t in the TUI to switch",
  )
  .action(
    actionRunner(async (options: { theme?: string }) => {
      if (!process.stdout.isTTY || !process.stdin.isTTY) {
        error(
          `The TUI needs an interactive terminal. Run '${EXECUTABLE_NAME} tui' from a TTY, or use one-shot commands instead.`,
        );
        process.exit(1);
      }

      // The shell browses the same command tree commander parses, taken from
      // the live program so plugins and generated services are all included.
      // Alphabetical like guided mode's picker (lib/command-picker.ts), so
      // both surfaces list commands in the same order.
      const firstLine = (text: string): string => text.split("\n")[0] ?? "";
      const byName = (
        a: { name: string },
        b: { name: string },
      ): number => a.name.localeCompare(b.name);
      // Duplicate names can legitimately exist on the commander tree (the
      // DX-22 apps alias shapes re-register e.g. `list`); the browser keeps
      // the first, like commander's own lookup does.
      const dedupe = <T extends { name: string }>(items: T[]): T[] => {
        const seen = new Set<string>();
        return items.filter((item) =>
          seen.has(item.name) ? false : (seen.add(item.name), true),
        );
      };
      // A create/get/update/delete (any naming shape: bare, `x-get`,
      // `get-x`) is hidden from the browser when its service has the
      // matching list: those actions are reached from the list itself
      // (⏎ view · c create · u update · d delete). They stay in the tree
      // (so the list's c/u/d can resolve them) and remain one-shot
      // commands. Visible lists are labelled by their resource and sort
      // ahead of the remaining action commands.
      const commands = dedupe(
        (tui.parent?.commands ?? [])
          .filter((command) => !TUI_HIDDEN_COMMANDS.has(command.name()))
          .map((command) => {
            const serviceName = command.name();
            const listNames = new Set(
              command.commands
                .map((subcommand) => subcommand.name())
                .filter((name) => listResource(name) !== undefined),
            );
            const rank = (name: string): number => {
              const resource = listResource(name);
              if (resource === "") return 0; // the service's own records
              return resource !== undefined ? 1 : 2;
            };
            return {
              name: serviceName,
              description: firstLine(command.description()),
              specs: specsFor(command),
              subcommands: dedupe(
                command.commands.map((subcommand) => {
                  const name = subcommand.name();
                  const resource = listResource(name);
                  return {
                    name,
                    label:
                      resource === ""
                        ? serviceName
                        : resource !== undefined
                          ? resource
                          : undefined,
                    description: firstLine(subcommand.description()),
                    specs: specsFor(subcommand),
                    destructive: getCommandMeta(subcommand).destructive === true,
                    method: getCommandMeta(subcommand).method,
                    hidden: owningList(name, listNames) !== null,
                  };
                }),
              ).sort(
                (a, b) =>
                  rank(a.name) - rank(b.name) ||
                  (a.label ?? a.name).localeCompare(b.label ?? b.name),
              ),
            };
          }),
      ).sort(byName);

      // TUI preferences that aren't gateway commands are shown at the root
      // under a "config" section header (not a folder you drill into): a
      // `themes` action that opens the live theme picker, and the real `alias`
      // command relocated out of the top level. `alias` keeps its true
      // invocation (`alias set|list|remove`) via runPath, so it still runs the
      // same command — it's only regrouped in the nav. The section is called
      // "config" because "settings" is a real API service.
      const aliasCommand = (tui.parent?.commands ?? []).find(
        (command) => command.name() === "alias",
      );
      const CONFIG_SECTION = "config";
      const configMembers = [
        {
          name: "themes",
          description: "Switch the TUI colour theme",
          tuiAction: "theme-picker" as const,
          group: CONFIG_SECTION,
          subcommands: [],
        },
        ...(aliasCommand !== undefined
          ? [
              {
                name: "alias",
                description: firstLine(aliasCommand.description()),
                group: CONFIG_SECTION,
                subcommands: aliasCommand.commands.map((subcommand) => ({
                  name: subcommand.name(),
                  description: firstLine(subcommand.description()),
                  specs: specsFor(subcommand),
                  method: getCommandMeta(subcommand).method,
                  destructive: getCommandMeta(subcommand).destructive === true,
                  runPath: ["alias", subcommand.name()],
                })),
              },
            ]
          : []),
      ];
      const browseCommands = [
        ...commands.filter((node) => node.name !== "alias"),
        ...configMembers,
      ];

      // Lazy imports: ink initializes its yoga layout engine via top-level
      // await on load, so it must never be pulled in on the one-shot path.
      const [{ runTui }, { buildTuiContext }, { createRunner }] =
        await Promise.all([
          import("../tui/app.js"),
          import("../tui/context.js"),
          import("../tui/executor.js"),
        ]);
      const program = tui.parent;
      await runTui(
        buildTuiContext(browseCommands),
        program === null ? undefined : createRunner(program),
        options.theme,
      );
    }),
  );
