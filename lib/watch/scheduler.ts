/**
 * The poller behind the watchlist (DX-141). Surface-agnostic: it knows how to
 * run argv, read a field, evaluate a condition and decide when to give up, and
 * nothing at all about ink or readline.
 *
 * Every dependency that touches the outside world — the runner, the clock, the
 * timers, the RNG — is injected, so tests own all four and never need
 * vi.useFakeTimers() (which cannot drive the microtask queue an awaited poll
 * suspends on).
 */

import { getErrorMessage } from "../utils.js";
import { evaluateCondition, formatCondition } from "./condition.js";
import { resolveFieldPath } from "./field-path.js";
import { createPortSet, watchPorts } from "./notify.js";
import { createWatchRegistry, watchRegistry } from "./registry.js";
import { drainRunQueue, enqueueRun } from "./run-queue.js";
import {
  DEFAULT_INTERVAL_MS,
  DEFAULT_WATCH_TIMEOUT_MS,
  JITTER_RATIO,
  MAX_ACTIVE_WATCHERS,
  MAX_TRANSIENT_FAILURES,
  MAX_WATCH_TIMEOUT_MS,
  MIN_INTERVAL_MS,
  TRANSIENT_BACKOFF_MS,
  isTerminalState,
} from "./types.js";
import type { WatchSpec, WatchState, Watcher } from "./types.js";
import type { NotificationPortSet } from "./notify.js";
import type { WatchRegistry } from "./registry.js";
import type { ExecutionResult } from "../tui/executor.js";

export type TimerHandle = unknown;

export type SchedulerDeps = {
  /** Injected so tests pass a fake; production binds enqueueRun. */
  run: (tokens: readonly string[]) => Promise<ExecutionResult>;
  now: () => number;
  setTimer: (fn: () => void, ms: number) => TimerHandle;
  clearTimer: (handle: TimerHandle) => void;
  random: () => number;
  registry: WatchRegistry;
  ports: NotificationPortSet;
  newId: () => string;
};

/** Absent arms are declared `undefined` because this package compiles with
 * `strict: false`, where a boolean discriminant does not narrow a union. */
export type StartOutcome =
  | { ok: true; watcher: Watcher; reason?: undefined }
  | { ok: false; reason: "capacity" | "duplicate"; watcher?: Watcher };

export type WatchContext = { tenant?: string; endpoint?: string };

export type WatchScheduler = {
  start(spec: WatchSpec, context?: WatchContext): StartOutcome;
  cancel(id: string): boolean;
  cancelAll(): Promise<void>;
  /** Resolves when the watcher reaches a terminal state — the await point for
   * a blocking one-shot `watch add`. */
  settled(id: string): Promise<Watcher>;
  activeCount(): number;
};

/**
 * Whether a failed poll is worth trying again. This is a second, coarser layer
 * on top of lib/client.ts's own retry: by the time a poll comes back failed,
 * the client has already burned its three full-jitter attempts on the
 * retryable statuses. So the question here is not "was this a blip" but "can
 * waiting seconds-to-minutes plausibly change the answer".
 */
const classifyFailure = (
  result: ExecutionResult,
  treat404AsTransient: boolean,
): "transient" | "fatal" => {
  switch (result.exitCode) {
    case 8:
      // 429 after the client already backed off: the gateway means it. Keep
      // the watcher alive but slow it down hard.
      return "transient";
    case 1:
      // Network, timeout, 5xx and anything non-HTTP. The right default for a
      // poller: a watcher exists precisely because the resource is in flux,
      // and a transport blip must not kill it.
      return "transient";
    case 4:
      // 401/403 will not fix itself, and re-polling a rejected credential is
      // how an account gets locked out.
      return "fatal";
    case 5:
      // A typo'd id should fail in two seconds, not five minutes. Opt in when
      // genuinely waiting for a resource to come into existence.
      return treat404AsTransient ? "transient" : "fatal";
    case 2:
      // Commander usage error. Bad argv never becomes good argv.
      return "fatal";
    default:
      return "fatal";
  }
};

const transientDelay = (failures: number, intervalMs: number): number => {
  const step =
    TRANSIENT_BACKOFF_MS[
      Math.min(failures, TRANSIENT_BACKOFF_MS.length) - 1
    ] ?? intervalMs;
  return Math.max(intervalMs, step);
};

/**
 * Freeze the tenant/endpoint the watcher was created under onto its argv.
 *
 * Poll runs otherwise inherit whatever cliConfig holds *at poll time*, and that
 * moves: the REPL calls resetCliConfig(baseline) before every line, so a
 * watcher created after `--tenant acme` on one line would silently start
 * polling the baseline tenant a few seconds later. "Watch this thing" has to
 * keep meaning this thing.
 *
 * The flags go *in front of* the command path: the generated service commands
 * re-declare their own --tenant/--endpoint, so a trailing global would be
 * parsed by the subcommand (or rejected as unknown). Leading is unambiguously
 * the program's.
 */
export const buildWatchTokens = (
  spec: WatchSpec,
  context: WatchContext,
): string[] => {
  if (spec.pinContext === false) return [...spec.tokens];
  const prefix: string[] = [];
  if (
    context.tenant !== undefined &&
    context.tenant !== "" &&
    !spec.tokens.includes("--tenant")
  ) {
    prefix.push("--tenant", context.tenant);
  }
  if (
    context.endpoint !== undefined &&
    context.endpoint !== "" &&
    !spec.tokens.includes("--endpoint")
  ) {
    prefix.push("--endpoint", context.endpoint);
  }
  return [...prefix, ...spec.tokens];
};

/** Identity for duplicate detection: same argv, same field, same condition. */
const watcherKey = (
  tokens: readonly string[],
  fieldPath: string,
  condition: Watcher["condition"],
): string =>
  `${JSON.stringify(tokens)}|${fieldPath}|${formatCondition(condition)}`;

export const createWatchScheduler = (
  overrides: Partial<SchedulerDeps> = {},
): WatchScheduler => {
  let sequence = 0;
  const deps: SchedulerDeps = {
    run: (tokens) => enqueueRun(tokens, { priority: "background" }),
    now: Date.now,
    setTimer: (fn, ms) => {
      const handle = setTimeout(fn, ms);
      // unref'd like the request spinner: a forgotten watcher must never be
      // the reason the process refuses to exit.
      handle.unref?.();
      return handle;
    },
    clearTimer: (handle) => clearTimeout(handle as NodeJS.Timeout),
    random: Math.random,
    registry: watchRegistry,
    ports: watchPorts,
    // Short, typeable ids: `watch rm 3` beats `watch rm 68f3a1c9b2d4e70`.
    newId: () => String(++sequence),
    ...overrides,
  };

  const timers = new Map<string, TimerHandle>();

  /**
   * ±JITTER_RATIO around the interval, floored. Decorrelates watchers created
   * in a burst so they stop landing in the same queue slot.
   */
  const jittered = (intervalMs: number): number =>
    Math.max(
      MIN_INTERVAL_MS,
      Math.round(intervalMs * (1 + (deps.random() * 2 - 1) * JITTER_RATIO)),
    );

  const schedule = (id: string, delayMs: number): void => {
    const handle = deps.setTimer(() => {
      timers.delete(id);
      void tick(id);
    }, delayMs);
    timers.set(id, handle);
  };

  const finish = (id: string, state: WatchState, lastError?: string): void => {
    const before = deps.registry.get(id);
    if (before === undefined || isTerminalState(before.state)) return;
    const handle = timers.get(id);
    if (handle !== undefined) {
      deps.clearTimer(handle);
      timers.delete(id);
    }
    const at = deps.now();
    const after = deps.registry.update(id, {
      state,
      finishedAt: at,
      satisfiedAt: state === "satisfied" ? at : null,
      ...(lastError === undefined ? {} : { lastError }),
    });
    deps.registry.prune();
    // Registry first, ports second: a port that re-reads the store (the TUI
    // badge counts from the snapshot) must not see the pre-transition state.
    if (after !== undefined) {
      deps.ports.onTransition({ watcher: after, from: before.state, to: state });
    }
  };

  const tick = async (id: string): Promise<void> => {
    try {
      const watcher = deps.registry.get(id);
      if (watcher === undefined || isTerminalState(watcher.state)) return;

      // The deadline is checked *before* spending a queue slot: a watcher that
      // expired while waiting behind other work must not fire one last poll.
      if (deps.now() >= watcher.createdAt + watcher.timeoutMs) {
        finish(id, "timeout");
        return;
      }

      let result: ExecutionResult;
      try {
        result = await deps.run(watcher.tokens);
      } catch {
        // enqueueRun only rejects when the queue was torn down mid-flight.
        finish(id, "cancelled");
        return;
      }

      // Re-read: a cancel may have landed while this poll sat in the queue.
      const current = deps.registry.get(id);
      if (current === undefined || isTerminalState(current.state)) return;

      const base = {
        pollCount: current.pollCount + 1,
        lastPolledAt: deps.now(),
        lastExitCode: result.exitCode,
      };

      if (!result.ok) {
        const message =
          result.error?.message ??
          result.stderr.split("\n").find((line) => line.trim() !== "") ??
          `exit ${result.exitCode}`;
        if (classifyFailure(result, current.treat404AsTransient) === "fatal") {
          deps.registry.update(id, base);
          finish(id, "error", message);
          return;
        }
        const failures = current.transientFailures + 1;
        if (failures > MAX_TRANSIENT_FAILURES) {
          deps.registry.update(id, { ...base, transientFailures: failures });
          finish(id, "error", `${message} (gave up after ${failures} attempts)`);
          return;
        }
        deps.registry.update(id, {
          ...base,
          transientFailures: failures,
          lastError: message,
          state: "polling",
        });
        schedule(id, transientDelay(failures, current.intervalMs));
        return;
      }

      const resolved = resolveFieldPath(result.data, current.fieldPath);
      // The first successful poll seeds the `changed` baseline, unless the
      // creator supplied one (the TUI wizard probes before creating).
      const baseline = current.initialValue ?? resolved;
      const satisfied = evaluateCondition(
        current.condition,
        resolved,
        baseline,
      );

      deps.registry.update(id, {
        ...base,
        transientFailures: 0,
        lastValue: resolved,
        initialValue: baseline,
        state: "polling",
        // A missing field is not a failure — it is "not satisfied yet", noted
        // softly so the pane can say so. A job's error.message legitimately
        // materialises on poll 9; hard-failing on the first miss would break
        // the common case.
        lastError:
          resolved.kind === "missing"
            ? `field \`${current.fieldPath}\` not present yet (at \`${resolved.at}\`)`
            : null,
      });

      if (satisfied) {
        finish(id, "satisfied");
        return;
      }
      if (deps.now() >= current.createdAt + current.timeoutMs) {
        finish(id, "timeout");
        return;
      }
      schedule(id, jittered(current.intervalMs));
    } catch (err) {
      // tick() is fired and forgotten from a timer; an escaped rejection here
      // would be an unhandled rejection with no owner.
      finish(id, "error", getErrorMessage(err));
    }
  };

  const cancel = (id: string): boolean => {
    const handle = timers.get(id);
    if (handle !== undefined) {
      deps.clearTimer(handle);
      timers.delete(id);
    }
    const watcher = deps.registry.get(id);
    if (watcher === undefined || isTerminalState(watcher.state)) return false;
    finish(id, "cancelled");
    return true;
  };

  return {
    start: (spec, context = {}) => {
      const active = deps.registry
        .snapshot()
        .filter((watcher) => !isTerminalState(watcher.state));
      if (active.length >= MAX_ACTIVE_WATCHERS) {
        return { ok: false, reason: "capacity" };
      }

      const tokens = buildWatchTokens(spec, context);
      const key = watcherKey(tokens, spec.fieldPath, spec.condition);
      const existing = active.find(
        (watcher) =>
          watcherKey(watcher.tokens, watcher.fieldPath, watcher.condition) ===
          key,
      );
      // Holding a key down in the TUI must not spawn five identical pollers.
      if (existing !== undefined) {
        return { ok: false, reason: "duplicate", watcher: existing };
      }

      const watcher = deps.registry.add(
        Object.freeze({
          id: deps.newId(),
          label: spec.label ?? spec.path.join(" "),
          commandLine: spec.commandLine,
          path: [...spec.path],
          values: { ...spec.values },
          tokens,
          fieldPath: spec.fieldPath,
          condition: spec.condition,
          intervalMs: Math.max(
            spec.intervalMs ?? DEFAULT_INTERVAL_MS,
            MIN_INTERVAL_MS,
          ),
          timeoutMs: Math.min(
            spec.timeoutMs ?? DEFAULT_WATCH_TIMEOUT_MS,
            MAX_WATCH_TIMEOUT_MS,
          ),
          treat404AsTransient: spec.treat404AsTransient === true,
          createdAt: deps.now(),
          state: "pending",
          lastValue: null,
          initialValue: spec.initialValue ?? null,
          pollCount: 0,
          transientFailures: 0,
          lastPolledAt: null,
          lastError: null,
          satisfiedAt: null,
          finishedAt: null,
          lastExitCode: 0,
        }) as Watcher,
      );

      // Always deferred, never inline. `watch add` typed at the REPL runs
      // inside runLine, which itself holds the run lock — polling inline would
      // deadlock. It also gives the caller a turn to subscribe before the first
      // transition can fire.
      schedule(watcher.id, 0);
      return { ok: true, watcher };
    },

    cancel,

    cancelAll: async () => {
      for (const watcher of deps.registry.snapshot()) {
        if (!isTerminalState(watcher.state)) cancel(watcher.id);
      }
      // An in-flight poll has to land before ink unmounts, or its continuation
      // resolves into a torn-down tree.
      await drainRunQueue();
    },

    settled: (id) =>
      new Promise<Watcher>((resolve, reject) => {
        let unsubscribe: (() => void) | null = null;
        const check = (): boolean => {
          const watcher = deps.registry.get(id);
          if (watcher === undefined) return false;
          if (!isTerminalState(watcher.state)) return false;
          resolve(watcher);
          return true;
        };
        // An id that is not in the store can never settle — pruning only ever
        // drops watchers that are already terminal, and finish() emits before
        // it prunes, so a live listener always sees the transition first.
        if (deps.registry.get(id) === undefined) {
          reject(new Error(`no such watcher: ${id}`));
          return;
        }
        if (check()) return;
        // Safe: registry.subscribe never invokes the listener synchronously,
        // so `unsubscribe` is always assigned by the time this runs.
        unsubscribe = deps.registry.subscribe(() => {
          if (check()) unsubscribe?.();
        });
      }),

    activeCount: () =>
      deps.registry
        .snapshot()
        .filter((watcher) => !isTerminalState(watcher.state)).length,
  };
};

/**
 * Process-wide scheduler over the singleton registry. Nothing runs until
 * start() is called, so eager construction at import is free.
 */
export const watchScheduler: WatchScheduler = createWatchScheduler();

/** Test helper: a fully isolated scheduler with its own store and ports. */
export const createIsolatedScheduler = (
  overrides: Partial<SchedulerDeps> = {},
): { scheduler: WatchScheduler; registry: WatchRegistry; ports: NotificationPortSet } => {
  const registry = createWatchRegistry();
  const ports = createPortSet();
  return {
    registry,
    ports,
    scheduler: createWatchScheduler({ registry, ports, ...overrides }),
  };
};
