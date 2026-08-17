import { afterEach, describe, expect, it } from "vitest";
import { Command } from "commander";
import { createRunner } from "../lib/tui/executor.js";
import {
  RunQueueClosed,
  bindRunQueue,
  drainRunQueue,
  enqueueRun,
  isRunQueueBound,
  runQueueDepth,
  withRunLock,
} from "../lib/watch/run-queue.js";

/** A promise plus its resolver, so a test can hold a task open. */
const deferred = <T>(): {
  promise: Promise<T>;
  resolve: (value: T) => void;
} => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

afterEach(async () => {
  await drainRunQueue();
  bindRunQueue(null);
});

describe("run lock", () => {
  it("never lets two tasks overlap", async () => {
    let inFlight = 0;
    let peak = 0;
    const task = async (): Promise<void> => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
    };
    await Promise.all(
      Array.from({ length: 10 }, () => withRunLock(task, "background")),
    );
    expect(peak).toBe(1);
  });

  it("serializes the real executor so overlapping runs keep their own output", async () => {
    // The hazard the whole queue exists for: createRunner patches process.exit,
    // both stream writes and every console method, restoring them in a finally.
    // Run two concurrently without the lock and the inner finally restores
    // while the outer is still capturing.
    const program = new Command();
    program.exitOverride();
    program.command("slow").action(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
      console.log(JSON.stringify({ who: "slow" }));
    });
    program.command("fast").action(() => {
      console.log(JSON.stringify({ who: "fast" }));
    });
    const originalLog = console.log;
    bindRunQueue(createRunner(program));

    const [slow, fast] = await Promise.all([
      enqueueRun(["slow"]),
      enqueueRun(["fast"]),
    ]);

    expect(slow.data).toEqual({ who: "slow" });
    expect(fast.data).toEqual({ who: "fast" });
    expect(console.log).toBe(originalLog);
  });

  it("runs foreground work ahead of queued polls", async () => {
    const order: string[] = [];
    const gate = deferred<void>();
    const first = withRunLock(async () => {
      order.push("in-flight");
      await gate.promise;
    }, "background");

    const rest = Promise.all([
      withRunLock(async () => void order.push("bg-1"), "background"),
      withRunLock(async () => void order.push("bg-2"), "background"),
      withRunLock(async () => void order.push("fg"), "foreground"),
    ]);

    gate.resolve();
    await first;
    await rest;
    expect(order).toEqual(["in-flight", "fg", "bg-1", "bg-2"]);
  });

  it("keeps foreground work in the order it was requested", async () => {
    const order: string[] = [];
    const gate = deferred<void>();
    const first = withRunLock(async () => {
      await gate.promise;
    }, "background");
    const rest = Promise.all([
      withRunLock(async () => void order.push("bg"), "background"),
      withRunLock(async () => void order.push("fg-1"), "foreground"),
      withRunLock(async () => void order.push("fg-2"), "foreground"),
    ]);
    gate.resolve();
    await first;
    await rest;
    expect(order).toEqual(["fg-1", "fg-2", "bg"]);
  });

  it("does not wedge when a task rejects", async () => {
    await expect(
      withRunLock(async () => {
        throw new Error("boom");
      }),
    ).rejects.toThrow("boom");
    await expect(withRunLock(async () => "after")).resolves.toBe("after");
    expect(runQueueDepth()).toEqual({ running: false, queued: 0 });
  });

  it("rejects rather than hanging when nothing is bound", async () => {
    bindRunQueue(null);
    expect(isRunQueueBound()).toBe(false);
    await expect(enqueueRun(["anything"])).rejects.toThrow(/no runner bound/);
  });

  it("passes the force flag through to the runner", async () => {
    const seen: { tokens: string[]; force?: boolean }[] = [];
    bindRunQueue(async (tokens, options) => {
      seen.push({ tokens, force: options?.force });
      return {
        ok: true,
        exitCode: 0,
        durationMs: 0,
        data: undefined,
        error: null,
        stdout: "",
        stderr: "",
      };
    });
    await enqueueRun(["a"], { force: true });
    await enqueueRun(["b"]);
    expect(seen).toEqual([
      { tokens: ["a"], force: true },
      { tokens: ["b"], force: false },
    ]);
  });
});

describe("drainRunQueue", () => {
  it("drops what has not started and awaits what has", async () => {
    const gate = deferred<void>();
    let finished = false;
    const inFlight = withRunLock(async () => {
      await gate.promise;
      finished = true;
    }, "background");
    const queued = withRunLock(async () => "never", "background");

    const rejection = expect(queued).rejects.toBeInstanceOf(RunQueueClosed);
    const draining = drainRunQueue();
    gate.resolve();
    await inFlight;
    await draining;
    await rejection;

    expect(finished).toBe(true);
    expect(runQueueDepth()).toEqual({ running: false, queued: 0 });
  });
});
