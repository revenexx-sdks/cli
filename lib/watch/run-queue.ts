/**
 * One process-wide lock over "something is driving the commander program right
 * now" (DX-141). Everything that patches the shared process globals must pass
 * through it:
 *
 *   - lib/tui/executor.ts's runner patches process.exit, both stream writes,
 *     all five console.* methods and cliConfig, restoring them in a finally.
 *     Two overlapping calls corrupt each other — the inner finally restores
 *     while the outer is still running, so the outer's output leaks onto the
 *     ink frame and its captured buffers come back wrong.
 *   - lib/commands/repl.ts's runLine patches process.exit and resets cliConfig
 *     around a bare parseAsync — a different mechanism over the same globals.
 *
 * Background polls therefore cannot merely serialize against each other; they
 * have to serialize against the foreground too. That is why the primitive here
 * is a lock over *thunks* rather than a queue of token arrays: the REPL's line
 * runner is not a TuiRunner call and could not otherwise be covered.
 *
 * RE-ENTRANCY RULE: never call withRunLock (or enqueueRun) from inside a locked
 * task — it deadlocks. The scheduler's first poll is deliberately deferred onto
 * a timer for exactly this reason: `watch add` typed at the REPL executes
 * inside runLine, which already holds the lock.
 */

import type { ExecutionResult, TuiRunner } from "../tui/executor.js";

export type RunPriority = "foreground" | "background";

/** Rejection handed to entries dropped by drainRunQueue. */
export class RunQueueClosed extends Error {
  constructor() {
    super("run queue closed");
    this.name = "RunQueueClosed";
  }
}

type Entry = {
  priority: RunPriority;
  task: () => Promise<unknown>;
  resolve: (value: never) => void;
  reject: (reason: unknown) => void;
};

let bound: TuiRunner | null = null;
let active = false;
const pending: Entry[] = [];

/** The TUI and the REPL bind the live program's runner for the session. */
export const bindRunQueue = (runner: TuiRunner | null): void => {
  bound = runner;
};

export const isRunQueueBound = (): boolean => bound !== null;

/** For the status bar: "polling · 2 queued". */
export const runQueueDepth = (): { running: boolean; queued: number } => ({
  running: active,
  queued: pending.length,
});

const pump = (): void => {
  if (active) return;
  const entry = pending.shift();
  if (entry === undefined) return;
  active = true;
  // Not awaited on purpose: pump() stays synchronous so a timer callback can
  // enqueue without spinning up a second drain loop.
  void Promise.resolve()
    .then(entry.task)
    .then(
      (value) => entry.resolve(value as never),
      (reason: unknown) => entry.reject(reason),
    )
    .finally(() => {
      active = false;
      pump();
    });
};

export const withRunLock = <T>(
  task: () => Promise<T>,
  priority: RunPriority = "background",
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const entry: Entry = {
      priority,
      task: task as () => Promise<unknown>,
      resolve: resolve as (value: never) => void,
      reject,
    };
    if (priority === "foreground") {
      // Ahead of queued polls, behind other foreground work — two fast
      // keystrokes still run in the order they were pressed, and a user never
      // waits out a backlog of watcher polls to see their own command.
      const at = pending.findIndex((queued) => queued.priority === "background");
      if (at === -1) pending.push(entry);
      else pending.splice(at, 0, entry);
    } else {
      pending.push(entry);
    }
    pump();
  });

export const enqueueRun = (
  tokens: readonly string[],
  options: { force?: boolean; priority?: RunPriority } = {},
): Promise<ExecutionResult> =>
  withRunLock(async () => {
    if (bound === null) throw new Error("run queue has no runner bound");
    return bound([...tokens], { force: options.force === true });
  }, options.priority ?? "background");

/** How long teardown waits for the in-flight run before giving up on it. */
const DRAIN_TIMEOUT_MS = 5_000;

/**
 * Teardown: drop everything not yet started, then await the in-flight run so
 * nothing resolves into a torn-down ink tree.
 *
 * Bounded, because "in flight" can mean a request the client is still retrying:
 * its own timeout is 30 s and it retries idempotent GETs three times, so an
 * unbounded wait would leave someone staring at a restored terminal for a
 * minute after pressing q. Abandoning the wait is safe — every watcher has
 * already been cancelled by the time this runs, so the poll's continuation
 * re-reads a terminal state and does nothing.
 */
export const drainRunQueue = async (
  timeoutMs = DRAIN_TIMEOUT_MS,
): Promise<void> => {
  const dropped = pending.splice(0, pending.length);
  for (const entry of dropped) entry.reject(new RunQueueClosed());
  const deadline = Date.now() + timeoutMs;
  while (active && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
};
