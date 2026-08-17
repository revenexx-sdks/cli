import { describe, expect, it, vi } from "vitest";
import { parseCondition } from "../lib/watch/condition.js";
import { createPortSet } from "../lib/watch/notify.js";
import { createWatchRegistry } from "../lib/watch/registry.js";
import { createWatchScheduler } from "../lib/watch/scheduler.js";
import {
  MAX_ACTIVE_WATCHERS,
  MAX_TRANSIENT_FAILURES,
  MIN_INTERVAL_MS,
  TRANSIENT_BACKOFF_MS,
} from "../lib/watch/types.js";
import type { WatchNotification } from "../lib/watch/notify.js";
import type { WatchSpec } from "../lib/watch/types.js";
import type { ExecutionResult } from "../lib/tui/executor.js";

/**
 * A real setImmediate drains every microtask already queued — which is exactly
 * what vi.useFakeTimers() cannot do. The scheduler suspends at
 * `await deps.run(...)`, so a fake timer that fires its callback synchronously
 * would leave the continuation unrun and the next assertion looking at a
 * scheduler that hasn't moved. Hence the injected clock below.
 */
const flush = (): Promise<void> =>
  new Promise((resolve) => setImmediate(resolve));

const createFakeClock = () => {
  let now = 0;
  let seq = 0;
  const timers = new Map<number, { at: number; fn: () => void }>();
  const nextDue = (): { id: number; at: number } | null => {
    let best: { id: number; at: number } | null = null;
    for (const [id, timer] of timers) {
      if (best === null || timer.at < best.at || (timer.at === best.at && id < best.id)) {
        best = { id, at: timer.at };
      }
    }
    return best;
  };
  return {
    now: (): number => now,
    setTimer: (fn: () => void, ms: number): number => {
      const id = ++seq;
      timers.set(id, { at: now + ms, fn });
      return id;
    },
    clearTimer: (handle: unknown): void => {
      timers.delete(handle as number);
    },
    /** Fire the next due timer, then let every continuation it triggered run. */
    async next(): Promise<boolean> {
      const due = nextDue();
      if (due === null) return false;
      const timer = timers.get(due.id);
      timers.delete(due.id);
      now = Math.max(now, due.at);
      timer?.fn();
      await flush();
      return true;
    },
    /** Skip time without firing anything — for the deadline paths. */
    jump(ms: number): void {
      now += ms;
    },
    pending: (): number => timers.size,
  };
};

type Clock = ReturnType<typeof createFakeClock>;

const result = (overrides: Partial<ExecutionResult> = {}): ExecutionResult => ({
  ok: true,
  exitCode: 0,
  durationMs: 1,
  data: {},
  error: null,
  stdout: "",
  stderr: "",
  ...overrides,
});

const failure = (exitCode: number, message = "nope"): ExecutionResult =>
  result({ ok: false, exitCode, data: undefined, error: { message } });

const conditionFor = (text: string) => {
  const parsed = parseCondition(text);
  if (!parsed.ok) throw new Error(parsed.error);
  return parsed.condition!;
};

const spec = (overrides: Partial<WatchSpec> = {}): WatchSpec => ({
  path: ["imports", "get-import"],
  values: {},
  tokens: ["imports", "get-import", "--import-id", "abc"],
  commandLine: "revenexx imports get-import --import-id abc",
  fieldPath: "status",
  condition: conditionFor("equals ready"),
  intervalMs: 5_000,
  timeoutMs: 60_000,
  ...overrides,
});

/** A scheduler with its own store, ports and clock — never the singleton. */
const harness = (
  run: (tokens: readonly string[]) => Promise<ExecutionResult>,
  clock: Clock = createFakeClock(),
) => {
  const registry = createWatchRegistry();
  const ports = createPortSet();
  const events: WatchNotification[] = [];
  ports.attach({ onTransition: (event) => void events.push(event) });
  let ids = 0;
  const scheduler = createWatchScheduler({
    run,
    registry,
    ports,
    now: clock.now,
    setTimer: clock.setTimer,
    clearTimer: clock.clearTimer,
    // 0.5 makes the jitter the identity, so intervals are exact in tests.
    random: () => 0.5,
    newId: () => String(++ids),
  });
  return { scheduler, registry, ports, events, clock };
};

describe("scheduler lifecycle", () => {
  it("defers the very first poll instead of running it inline", async () => {
    // `watch add` typed at the REPL runs inside runLine, which already holds
    // the run lock — polling inline would deadlock.
    const run = vi.fn(async () => result());
    const h = harness(run);
    const started = h.scheduler.start(spec());
    expect(started.ok).toBe(true);
    expect(run).not.toHaveBeenCalled();
    expect(h.clock.pending()).toBe(1);
    expect(h.registry.get("1")?.state).toBe("pending");
  });

  it("satisfies once the field reaches the value, then stops", async () => {
    const statuses = ["processing", "ready"];
    const h = harness(async () =>
      result({ data: { status: statuses.shift() ?? "ready" } }),
    );
    h.scheduler.start(spec());
    await h.clock.next();
    expect(h.registry.get("1")?.state).toBe("polling");
    await h.clock.next();
    const watcher = h.registry.get("1");
    expect(watcher?.state).toBe("satisfied");
    expect(watcher?.pollCount).toBe(2);
    expect(watcher?.satisfiedAt).not.toBeNull();
    expect(h.clock.pending()).toBe(0);
  });

  it("polls on the configured interval, jittered", async () => {
    const stamps: number[] = [];
    const clock = createFakeClock();
    const h = harness(async () => {
      stamps.push(clock.now());
      return result({ data: { status: "processing" } });
    }, clock);
    h.scheduler.start(spec({ intervalMs: 5_000 }));
    for (let index = 0; index < 3; index += 1) await h.clock.next();
    expect(stamps).toEqual([0, 5_000, 10_000]);
  });

  it("bounds the jitter and honours the interval floor", async () => {
    for (const [random, expected] of [
      [0, 4_250],
      [1, 5_750],
    ] as const) {
      const stamps: number[] = [];
      const clock = createFakeClock();
      const registry = createWatchRegistry();
      const scheduler = createWatchScheduler({
        registry,
        ports: createPortSet(),
        now: clock.now,
        setTimer: clock.setTimer,
        clearTimer: clock.clearTimer,
        random: () => random,
        newId: () => "1",
        run: async () => {
          stamps.push(clock.now());
          return result({ data: { status: "processing" } });
        },
      });
      scheduler.start(spec({ intervalMs: 5_000 }));
      await clock.next();
      await clock.next();
      expect(stamps[1]).toBe(expected);
    }

    // Below the floor, jitter can't drag an interval any lower.
    const clock = createFakeClock();
    const stamps: number[] = [];
    const h = harness(async () => {
      stamps.push(clock.now());
      return result({ data: { status: "processing" } });
    }, clock);
    h.scheduler.start(spec({ intervalMs: 100 }));
    await h.clock.next();
    await h.clock.next();
    expect(stamps[1]).toBe(MIN_INTERVAL_MS);
  });
});

describe("the changed baseline", () => {
  it("is captured on the first poll, so poll 1 can never satisfy", async () => {
    const statuses = ["processing", "processing", "done"];
    const h = harness(async () =>
      result({ data: { status: statuses.shift() ?? "done" } }),
    );
    h.scheduler.start(spec({ condition: conditionFor("changed") }));
    await h.clock.next();
    expect(h.registry.get("1")?.state).toBe("polling");
    await h.clock.next();
    expect(h.registry.get("1")?.state).toBe("polling");
    await h.clock.next();
    expect(h.registry.get("1")?.state).toBe("satisfied");
  });

  it("can be supplied by the creator, which lets poll 1 satisfy", async () => {
    const h = harness(async () => result({ data: { status: "done" } }));
    h.scheduler.start(
      spec({
        condition: conditionFor("changed"),
        initialValue: { kind: "value", value: "processing" },
      }),
    );
    await h.clock.next();
    expect(h.registry.get("1")?.state).toBe("satisfied");
  });
});

describe("failure handling", () => {
  it("backs off through the transient ladder, then gives up", async () => {
    const stamps: number[] = [];
    const clock = createFakeClock();
    const h = harness(async () => {
      stamps.push(clock.now());
      return failure(1, "socket hang up");
    }, clock);
    h.scheduler.start(spec({ intervalMs: 1_000, timeoutMs: 10 * 60_000 }));
    for (let index = 0; index < MAX_TRANSIENT_FAILURES + 1; index += 1) {
      await h.clock.next();
    }
    const gaps = stamps.slice(1).map((at, index) => at - (stamps[index] ?? 0));
    expect(gaps).toEqual([...TRANSIENT_BACKOFF_MS]);
    const watcher = h.registry.get("1");
    expect(watcher?.state).toBe("error");
    expect(watcher?.lastError).toContain("socket hang up");
    expect(watcher?.lastError).toContain("gave up");
  });

  it("resets the failure count after a success", async () => {
    const outcomes = [failure(1), failure(1), result({ data: { status: "x" } })];
    const h = harness(async () => outcomes.shift() ?? failure(1));
    h.scheduler.start(spec());
    await h.clock.next();
    await h.clock.next();
    expect(h.registry.get("1")?.transientFailures).toBe(2);
    await h.clock.next();
    expect(h.registry.get("1")?.transientFailures).toBe(0);
  });

  it("keeps polling through a 429 the client already backed off from", async () => {
    const h = harness(async () => failure(8, "rate limited"));
    h.scheduler.start(spec());
    await h.clock.next();
    expect(h.registry.get("1")?.state).toBe("polling");
    expect(h.clock.pending()).toBe(1);
  });

  it("gives up immediately on auth and usage failures", async () => {
    for (const code of [4, 2]) {
      const h = harness(async () => failure(code, `code ${code}`));
      h.scheduler.start(spec());
      await h.clock.next();
      expect(h.registry.get("1")?.state).toBe("error");
      expect(h.clock.pending()).toBe(0);
    }
  });

  it("treats 404 as fatal unless the watcher opted in", async () => {
    const strict = harness(async () => failure(5, "not found"));
    strict.scheduler.start(spec());
    await strict.clock.next();
    expect(strict.registry.get("1")?.state).toBe("error");

    const lenient = harness(async () => failure(5, "not found"));
    lenient.scheduler.start(spec({ treat404AsTransient: true }));
    await lenient.clock.next();
    expect(lenient.registry.get("1")?.state).toBe("polling");
  });

  it("treats a missing field as not-yet, not as a failure", async () => {
    const h = harness(async () => result({ data: { other: 1 } }));
    h.scheduler.start(spec({ intervalMs: 5_000, timeoutMs: 12_000 }));
    await h.clock.next();
    const polling = h.registry.get("1");
    expect(polling?.state).toBe("polling");
    expect(polling?.transientFailures).toBe(0);
    expect(polling?.lastError).toContain("not present yet");
    // …and if it never turns up, the watcher times out still carrying the note.
    // Polls land at 0/5s/10s; the 15s timer trips the pre-poll deadline check.
    await h.clock.next();
    await h.clock.next();
    await h.clock.next();
    const done = h.registry.get("1");
    expect(done?.state).toBe("timeout");
    expect(done?.lastError).toContain("not present yet");
  });
});

describe("deadlines", () => {
  it("does not spend a queue slot on an already-expired watcher", async () => {
    const run = vi.fn(async () => result({ data: { status: "x" } }));
    const h = harness(run);
    h.scheduler.start(spec({ timeoutMs: 30_000 }));
    h.clock.jump(30_001);
    await h.clock.next();
    expect(run).not.toHaveBeenCalled();
    expect(h.registry.get("1")?.state).toBe("timeout");
  });

  it("times out when the deadline passes during a slow poll", async () => {
    const clock = createFakeClock();
    const h = harness(async () => {
      clock.jump(40_000);
      return result({ data: { status: "processing" } });
    }, clock);
    h.scheduler.start(spec({ timeoutMs: 30_000 }));
    await h.clock.next();
    expect(h.registry.get("1")?.state).toBe("timeout");
    expect(h.registry.get("1")?.pollCount).toBe(1);
  });
});

describe("cancellation", () => {
  it("stops a watcher and clears its timer", async () => {
    const h = harness(async () => result({ data: { status: "processing" } }));
    h.scheduler.start(spec());
    await h.clock.next();
    expect(h.clock.pending()).toBe(1);
    expect(h.scheduler.cancel("1")).toBe(true);
    expect(h.registry.get("1")?.state).toBe("cancelled");
    expect(h.clock.pending()).toBe(0);
    expect(h.scheduler.cancel("1")).toBe(false);
  });

  it("keeps a cancel that lands mid-poll", async () => {
    let release!: () => void;
    const h = harness(
      async () =>
        new Promise<ExecutionResult>((resolve) => {
          release = () => resolve(result({ data: { status: "ready" } }));
        }),
    );
    h.scheduler.start(spec());
    const firing = h.clock.next();
    await flush();
    h.scheduler.cancel("1");
    release();
    await firing;
    expect(h.registry.get("1")?.state).toBe("cancelled");
    expect(h.clock.pending()).toBe(0);
    expect(h.events.filter((event) => event.to === "satisfied")).toHaveLength(0);
  });

  it("cancelAll clears every live watcher and leaves the finished alone", async () => {
    const h = harness(async () => result({ data: { status: "ready" } }));
    h.scheduler.start(spec());
    await h.clock.next(); // #1 satisfies
    h.scheduler.start(spec({ condition: conditionFor("equals never") }));
    await h.scheduler.cancelAll();
    expect(h.registry.get("1")?.state).toBe("satisfied");
    expect(h.registry.get("2")?.state).toBe("cancelled");
    expect(h.clock.pending()).toBe(0);
    expect(h.scheduler.activeCount()).toBe(0);
  });
});

describe("admission", () => {
  it("refuses past the concurrency cap and frees a slot on cancel", () => {
    const h = harness(async () => result());
    for (let index = 0; index < MAX_ACTIVE_WATCHERS; index += 1) {
      const outcome = h.scheduler.start(
        spec({ fieldPath: `status${index}` }),
      );
      expect(outcome.ok).toBe(true);
    }
    expect(h.scheduler.start(spec({ fieldPath: "extra" }))).toMatchObject({
      ok: false,
      reason: "capacity",
    });
    h.scheduler.cancel("1");
    expect(h.scheduler.start(spec({ fieldPath: "extra" })).ok).toBe(true);
  });

  it("refuses an exact duplicate but allows a different condition", () => {
    const h = harness(async () => result());
    const first = h.scheduler.start(spec());
    const again = h.scheduler.start(spec());
    expect(again).toMatchObject({ ok: false, reason: "duplicate" });
    expect(again.watcher?.id).toBe(first.watcher?.id);
    expect(h.scheduler.start(spec({ condition: conditionFor("terminal") })).ok).toBe(
      true,
    );
  });

  it("pins the active tenant onto the argv so a later switch can't move it", () => {
    const h = harness(async () => result());
    const outcome = h.scheduler.start(spec(), { tenant: "acme" });
    expect(outcome.watcher?.tokens.slice(0, 2)).toEqual(["--tenant", "acme"]);
    // An explicit --tenant on the command wins.
    const explicit = h.scheduler.start(
      spec({ tokens: ["imports", "get-import", "--tenant", "other"] }),
      { tenant: "acme" },
    );
    expect(explicit.watcher?.tokens[0]).toBe("imports");
  });
});

describe("settled", () => {
  it("resolves on the transition and unsubscribes afterwards", async () => {
    const h = harness(async () => result({ data: { status: "ready" } }));
    h.scheduler.start(spec());
    const settled = h.scheduler.settled("1");
    await h.clock.next();
    expect((await settled).state).toBe("satisfied");
    // The listener is gone: further mutations must not keep it alive.
    const before = h.registry.snapshot();
    h.registry.update("1", { pollCount: 99 });
    expect(h.registry.snapshot()).not.toBe(before);
  });

  it("resolves straight away for an already-terminal watcher", async () => {
    const h = harness(async () => result({ data: { status: "ready" } }));
    h.scheduler.start(spec());
    await h.clock.next();
    expect((await h.scheduler.settled("1")).state).toBe("satisfied");
  });

  it("rejects for an id that was never registered", async () => {
    const h = harness(async () => result());
    await expect(h.scheduler.settled("nope")).rejects.toThrow(/no such watcher/);
  });
});

describe("notification ports", () => {
  it("fire after the registry already holds the new state", async () => {
    const h = harness(async () => result({ data: { status: "ready" } }));
    let seen: string | undefined;
    h.ports.attach({
      onTransition: (event) => {
        seen = h.registry.get(event.watcher.id)?.state;
      },
    });
    h.scheduler.start(spec());
    await h.clock.next();
    expect(seen).toBe("satisfied");
  });

  it("survive a port that throws", async () => {
    const h = harness(async () => result({ data: { status: "ready" } }));
    const other = vi.fn();
    h.ports.attach({
      onTransition: () => {
        throw new Error("bad port");
      },
    });
    h.ports.attach({ onTransition: other });
    h.scheduler.start(spec());
    await h.clock.next();
    expect(h.registry.get("1")?.state).toBe("satisfied");
    expect(other).toHaveBeenCalledTimes(1);
  });

  it("report only terminal transitions, once each", async () => {
    const statuses = ["a", "b", "ready"];
    const h = harness(async () =>
      result({ data: { status: statuses.shift() ?? "ready" } }),
    );
    h.scheduler.start(spec());
    await h.clock.next();
    await h.clock.next();
    await h.clock.next();
    expect(h.events).toHaveLength(1);
    expect(h.events[0]).toMatchObject({ from: "polling", to: "satisfied" });
  });
});
