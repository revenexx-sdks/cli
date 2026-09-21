/**
 * The `watch` command group (DX-141): poll a resource field until it reaches a
 * condition.
 *
 *   watch add --until 'status terminal' -- imports get-import --import-id abc
 *   watch list
 *   watch rm 1
 *
 * It behaves differently depending on where it is invoked from, and the split
 * is the whole point of the feature:
 *
 *   - Inside the REPL or the TUI, a watcher is registered against the session
 *     and the prompt comes straight back, so you keep working while it polls.
 *   - One-shot on a terminal there is no session to come back to, so the
 *     command blocks with a live line and turns the outcome into an exit code —
 *     which is what makes `watch add … && deploy` work in a script.
 *   - Non-interactive it refuses, the way `repl` does. Scripts that want a
 *     poll loop with no TTY should write the loop; a half-rendered progress
 *     line in a CI log helps nobody.
 */
import { Command, Option } from "commander";
import chalk from "chalk";
import {
  actionRunner,
  cliConfig,
  commandDescriptions,
  drawTable,
  error,
  hint,
  log,
  parse,
  success,
  warn,
  resolveActiveContext,
} from "../parser.js";
import { EXECUTABLE_NAME } from "../constants.js";
import { createRunner } from "../tui/executor.js";
import { parseUntil, formatCondition } from "../watch/condition.js";
import { formatResolved } from "../watch/field-path.js";
import { formatDuration, parseDuration } from "../watch/duration.js";
import { bindRunQueue, isRunQueueBound } from "../watch/run-queue.js";
import { watchRegistry } from "../watch/registry.js";
import { watchScheduler } from "../watch/scheduler.js";
import { isWatchSessionActive } from "../watch/session.js";
import { createReplNotificationPort, watchPorts } from "../watch/notify.js";
import {
  DEFAULT_INTERVAL_MS,
  DEFAULT_WATCH_TIMEOUT_MS,
  MIN_INTERVAL_MS,
  isTerminalState,
} from "../watch/types.js";
import type { Watcher } from "../watch/types.js";

/**
 * Exit codes, extending the table documented on exitCodeForError in
 * lib/client.ts. `satisfied` is the only success; a timeout is its own code so
 * CI can tell "it never got there" from "it failed", and a failure propagates
 * the poll's own code so 401 stays 4 and 429 stays 8.
 */
const EXIT_TIMEOUT = 7;
const EXIT_CANCELLED = 130;

const exitCodeFor = (watcher: Watcher): number => {
  switch (watcher.state) {
    case "satisfied":
      return 0;
    case "timeout":
      return EXIT_TIMEOUT;
    case "cancelled":
      return EXIT_CANCELLED;
    default:
      return watcher.lastExitCode === 0 ? 1 : watcher.lastExitCode;
  }
};

/**
 * A watcher as a table row, for `watch list` and the final `--json` payload.
 * The note is truncated for the table and kept whole for machine output — a
 * gateway error body is long enough to blow the column layout apart.
 */
const asRow = (
  watcher: Watcher,
  { full = false }: { full?: boolean } = {},
): Record<string, unknown> => {
  const note =
    watcher.lastError === null || full || watcher.lastError.length <= 48
      ? watcher.lastError
      : `${watcher.lastError.slice(0, 47)}…`;
  return {
    id: watcher.id,
    state: watcher.state,
    command: watcher.label,
    field: watcher.fieldPath === "" ? "(payload)" : watcher.fieldPath,
    condition: formatCondition(watcher.condition),
    value: formatResolved(watcher.lastValue),
    polls: watcher.pollCount,
    every: formatDuration(watcher.intervalMs),
    age: formatDuration((watcher.finishedAt ?? Date.now()) - watcher.createdAt),
    ...(note === null ? {} : { note }),
  };
};

/**
 * Resolve the target tokens against the live command tree before starting a
 * watcher.
 *
 * Worth doing eagerly: outside the REPL the program has no exitOverride, so
 * commander reports a bad command by calling process.exit(1) — which the
 * executor reports as a generic failure, and a generic failure is transient by
 * design (a poller must survive a transport blip). A typo would therefore be
 * retried up the whole backoff ladder before being called what it is.
 */
const resolveTarget = (
  program: Command,
  tokens: string[],
  // `error?: undefined` on the ok arm: this package compiles with
  // `strict: false`, where a boolean discriminant does not narrow a union.
): { ok: true; error?: undefined } | { ok: false; error: string } => {
  const words = tokens.filter((token) => !token.startsWith("-"));
  const head = words[0];
  if (head === undefined) return { ok: false, error: "no command to watch" };
  const service = program.commands.find(
    (candidate) =>
      candidate.name() === head || candidate.aliases().includes(head),
  );
  if (service === undefined) {
    return { ok: false, error: `unknown command \`${head}\`` };
  }
  const sub = words[1];
  if (sub === undefined || service.commands.length === 0) return { ok: true };
  const found = service.commands.some(
    (candidate) =>
      candidate.name() === sub || candidate.aliases().includes(sub),
  );
  return found
    ? { ok: true }
    : {
        ok: false,
        error: `unknown command \`${head} ${sub}\` — try \`${EXECUTABLE_NAME} ${head} --help\``,
      };
};

/** exitOverride binds to one Command; polls parse into subcommands. */
const applyExitOverride = (command: Command): void => {
  command.exitOverride();
  for (const child of command.commands) applyExitOverride(child);
};

const requireTty = (): boolean => {
  if (process.stdin.isTTY === true && process.stdout.isTTY === true) {
    return true;
  }
  error(
    `Watchers need an interactive terminal. In a script, poll with your own loop around \`${EXECUTABLE_NAME} <get command> --json\`.`,
  );
  return false;
};

const add = new Command("add")
  .description("Watch a resource field until it reaches a condition")
  .argument(
    "<command...>",
    `The get-by-id command to poll, after \`--\` (e.g. \`-- imports get-import --import-id abc\`)`,
  )
  .addOption(
    new Option(
      "-u, --until <expression>",
      "When to stop: `[<field>] changed|equals <v>|matches <re>|terminal|truthy`",
    ).makeOptionMandatory(),
  )
  .option(
    // No -f short flag: the program's global `-f, --force` would swallow it.
    "--field <path>",
    "Dot path into the response (e.g. `status`, `items.0.state`). Also accepted as the first word of --until",
  )
  // No commander defaults here on purpose: formatDuration renders for humans
  // ("5m 00s"), which parseDuration then rejects. The constants are the single
  // source of truth and the flags fall back to them when absent.
  .option(
    "-e, --every <duration>",
    `Poll interval, default ${formatDuration(DEFAULT_INTERVAL_MS)} — floor ${formatDuration(MIN_INTERVAL_MS)}`,
  )
  .option(
    "--for <duration>",
    `Give up after this long, default ${formatDuration(DEFAULT_WATCH_TIMEOUT_MS)}`,
  )
  .option(
    "--wait-for-create",
    "Treat 404 as transient — for a resource that does not exist yet",
  )
  // NOTE: these live on the subcommand on purpose. A global flag would need a
  // matching line in repl.ts's hand-written resetCliConfig, or a one-off value
  // would leak into every later REPL line with nothing to catch the omission.
  .action(
    actionRunner(
      async (
        tokens: string[],
        options: {
          until: string;
          field?: string;
          every?: string;
          for?: string;
          waitForCreate?: boolean;
        },
        command: Command,
      ) => {
        if (!requireTty()) {
          process.exit(2);
        }
        const until = parseUntil(options.until);
        if (!until.ok) {
          error(until.error as string);
          process.exit(2);
        }
        const every =
          options.every === undefined
            ? { ok: true as const, ms: DEFAULT_INTERVAL_MS }
            : parseDuration(options.every);
        if (!every.ok) {
          error(every.error as string);
          process.exit(2);
        }
        const within =
          options.for === undefined
            ? { ok: true as const, ms: DEFAULT_WATCH_TIMEOUT_MS }
            : parseDuration(options.for);
        if (!within.ok) {
          error(within.error as string);
          process.exit(2);
        }
        // --field wins when both are given; otherwise --until may carry it.
        const fieldPath = (options.field ?? until.fieldPath ?? "").trim();

        const program = command.parent?.parent ?? null;
        if (program === null) {
          error("watch needs the root program to run commands.");
          process.exit(1);
        }
        const target = resolveTarget(program, tokens);
        if (!target.ok) {
          error(target.error);
          process.exit(2);
        }
        // In a session the runner is already bound; one-shot this is the only
        // place that can bind it.
        const sessioned = isWatchSessionActive();
        if (!isRunQueueBound()) {
          // Without this commander answers a bad flag by calling
          // process.exit(1), which the executor can only report as a generic
          // failure — and generic failures are transient, so an unknown option
          // would be retried up the whole backoff ladder before being called
          // what it is. Throwing instead lets the executor label it a usage
          // error (2), which the scheduler treats as fatal.
          //
          // Applied over the whole tree, not just the root: exitOverride sets a
          // callback on one Command, and the subcommand is what rejects the
          // flag. Safe here because every later parse in this process is a poll.
          applyExitOverride(program);
          bindRunQueue(createRunner(program));
        }

        const context = resolveActiveContext();
        const outcome = watchScheduler.start(
          {
            path: [tokens[0] ?? ""],
            values: {},
            tokens,
            commandLine: `${EXECUTABLE_NAME} ${tokens.join(" ")}`,
            fieldPath,
            condition: until.condition,
            intervalMs: every.ms,
            timeoutMs: within.ms,
            treat404AsTransient: options.waitForCreate === true,
            label: tokens.filter((token) => !token.startsWith("-")).join(" "),
          },
          { tenant: context.tenant, endpoint: context.endpoint },
        );

        if (!outcome.ok) {
          error(
            outcome.reason === "capacity"
              ? "Too many active watchers. Cancel one with `watch rm <id>` first."
              : `Already watching that (#${outcome.watcher?.id ?? "?"}).`,
          );
          process.exit(1);
        }
        const watcher = outcome.watcher as Watcher;

        if (sessioned) {
          success(
            `watcher ${chalk.cyan(`#${watcher.id}`)} · ${watcher.label} · ${
              fieldPath || "(payload)"
            } ${formatCondition(watcher.condition)} · every ${formatDuration(
              watcher.intervalMs,
            )}`,
          );
          hint(`\`watch list\` to see it, \`watch rm ${watcher.id}\` to stop it`);
          return;
        }

        // One-shot: block until it settles. Ctrl-C cancels the watcher rather
        // than killing the process mid-poll, so the exit code stays meaningful.
        //
        // The keepalive is load-bearing. The scheduler unrefs its timers so a
        // forgotten watcher can never be the reason a session refuses to exit —
        // correct in the REPL and the TUI, where stdin holds the loop open, but
        // here the poll timer is the *only* pending work, so node would find an
        // empty event loop and exit 0 before the first poll ever fired.
        const keepAlive = setInterval(() => undefined, 1_000);
        const onSigint = (): void => {
          watchScheduler.cancel(watcher.id);
        };
        process.once("SIGINT", onSigint);
        const detachPort = watchPorts.attach(
          createReplNotificationPort(() => undefined),
        );
        if (cliConfig.json !== true && cliConfig.quiet !== true) {
          log(
            `Watching ${watcher.label} · ${fieldPath || "(payload)"} ${formatCondition(
              watcher.condition,
            )} · every ${formatDuration(every.ms)}, up to ${formatDuration(
              within.ms,
            )}`,
          );
        }
        try {
          const settled = await watchScheduler.settled(watcher.id);
          if (cliConfig.output !== "table") {
            // The REPL port already printed a human line; under a machine
            // format the final record is the only structured output.
            parse(asRow(settled, { full: true }));
          }
          process.exit(exitCodeFor(settled));
        } finally {
          clearInterval(keepAlive);
          process.off("SIGINT", onSigint);
          detachPort();
        }
      },
    ),
  );

const list = new Command("list")
  .alias("ls")
  .description("Show the watchers registered in this session")
  .action(
    actionRunner(async () => {
      const watchers = watchRegistry.snapshot();
      if (watchers.length === 0) {
        if (cliConfig.output !== "table") {
          parse([]);
          return;
        }
        log("No watchers.");
        hint(
          isWatchSessionActive()
            ? `\`watch add --until 'status terminal' -- <get command>\` starts one`
            : "Watchers live for the length of a `repl` or `tui` session",
        );
        return;
      }
      // parse() renders a bare array as JSON — its table path only walks an
      // object's keys — so hand it the machine formats and draw the table here.
      if (cliConfig.output !== "table") {
        parse(watchers.map((watcher) => asRow(watcher, { full: true })));
        return;
      }
      drawTable(watchers.map((watcher) => asRow(watcher)));
    }),
  );

const remove = new Command("rm")
  .alias("cancel")
  .description("Cancel a watcher")
  .argument("[id]", "Watcher id, as shown by `watch list`")
  .option("--all", "Cancel every active watcher")
  .action(
    actionRunner(async (id: string | undefined, options: { all?: boolean }) => {
      if (options.all === true) {
        const stopped = watchRegistry
          .snapshot()
          .filter((watcher) => !isTerminalState(watcher.state)).length;
        await watchScheduler.cancelAll();
        success(`Cancelled ${stopped} watcher${stopped === 1 ? "" : "s"}.`);
        return;
      }
      if (id === undefined) {
        error("Pass a watcher id, or --all.");
        process.exit(2);
      }
      const watcher = watchRegistry.get(id);
      if (watcher === undefined) {
        error(`No watcher #${id}. \`watch list\` shows the ids.`);
        process.exit(5);
      }
      if (!watchScheduler.cancel(id)) {
        warn(`Watcher #${id} had already finished (${watcher.state}).`);
        return;
      }
      success(`Cancelled watcher #${id}.`);
    }),
  );

export const watch = new Command("watch")
  .description(commandDescriptions["watch"] ?? "")
  .addCommand(add)
  .addCommand(list)
  .addCommand(remove);
