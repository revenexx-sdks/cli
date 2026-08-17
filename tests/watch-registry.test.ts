import { describe, expect, it, vi } from "vitest";
import { createWatchRegistry } from "../lib/watch/registry.js";
import { MAX_RETAINED_WATCHERS } from "../lib/watch/types.js";
import type { Watcher } from "../lib/watch/types.js";

const makeWatcher = (id: string, overrides: Partial<Watcher> = {}): Watcher =>
  Object.freeze({
    id,
    label: `cmd ${id}`,
    commandLine: `revenexx cmd ${id}`,
    path: ["cmd"],
    values: {},
    tokens: ["cmd"],
    fieldPath: "status",
    condition: { kind: "terminal", done: ["done"], custom: false },
    intervalMs: 5_000,
    timeoutMs: 60_000,
    treat404AsTransient: false,
    createdAt: 0,
    state: "polling",
    lastValue: null,
    initialValue: null,
    pollCount: 0,
    transientFailures: 0,
    lastPolledAt: null,
    lastError: null,
    satisfiedAt: null,
    finishedAt: null,
    lastExitCode: 0,
    ...overrides,
  }) as Watcher;

describe("watch registry", () => {
  it("keeps the snapshot referentially stable between mutations", () => {
    // The useSyncExternalStore contract: React calls getSnapshot on every
    // render and throws if it sees a fresh array each time.
    const registry = createWatchRegistry();
    const empty = registry.snapshot();
    expect(registry.snapshot()).toBe(empty);

    registry.add(makeWatcher("1"));
    const one = registry.snapshot();
    expect(one).not.toBe(empty);
    expect(registry.snapshot()).toBe(one);

    registry.update("1", { pollCount: 1 });
    expect(registry.snapshot()).not.toBe(one);
  });

  it("replaces records wholesale instead of mutating them", () => {
    const registry = createWatchRegistry();
    const first = registry.add(makeWatcher("1"));
    const second = registry.update("1", { pollCount: 3 });
    expect(second).not.toBe(first);
    expect(first.pollCount).toBe(0);
    expect(second?.pollCount).toBe(3);
    expect(Object.isFrozen(second)).toBe(true);
  });

  it("returns undefined when updating an unknown id", () => {
    expect(createWatchRegistry().update("nope", { pollCount: 1 })).toBeUndefined();
  });

  it("does not invoke the listener on subscribe", () => {
    // settled() relies on this: its listener references its own unsubscribe.
    const registry = createWatchRegistry();
    const listener = vi.fn();
    registry.subscribe(listener);
    expect(listener).not.toHaveBeenCalled();
    registry.add(makeWatcher("1"));
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("stops delivering after unsubscribe", () => {
    const registry = createWatchRegistry();
    const listener = vi.fn();
    registry.subscribe(listener)();
    registry.add(makeWatcher("1"));
    expect(listener).not.toHaveBeenCalled();
  });

  it("still notifies the rest when a listener unsubscribes itself", () => {
    const registry = createWatchRegistry();
    const other = vi.fn();
    const unsubscribe = registry.subscribe(() => unsubscribe());
    registry.subscribe(other);
    registry.add(makeWatcher("1"));
    expect(other).toHaveBeenCalledTimes(1);
  });

  it("emits on remove and clear only when something changed", () => {
    const registry = createWatchRegistry();
    registry.add(makeWatcher("1"));
    const listener = vi.fn();
    registry.subscribe(listener);
    expect(registry.remove("nope")).toBe(false);
    expect(listener).not.toHaveBeenCalled();
    expect(registry.remove("1")).toBe(true);
    expect(listener).toHaveBeenCalledTimes(1);
    registry.clear();
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("prunes the oldest finished watchers and never an active one", () => {
    const registry = createWatchRegistry();
    registry.add(makeWatcher("live", { state: "polling" }));
    for (let index = 0; index < MAX_RETAINED_WATCHERS + 5; index += 1) {
      registry.add(
        makeWatcher(`done-${index}`, {
          state: "satisfied",
          finishedAt: index + 1,
        }),
      );
    }
    registry.prune();
    const ids = registry.snapshot().map((watcher) => watcher.id);
    expect(ids).toContain("live");
    expect(ids).toHaveLength(MAX_RETAINED_WATCHERS + 1);
    expect(ids).not.toContain("done-0");
    expect(ids).toContain(`done-${MAX_RETAINED_WATCHERS + 4}`);
  });

  it("leaves a short list alone", () => {
    const registry = createWatchRegistry();
    registry.add(makeWatcher("1", { state: "satisfied", finishedAt: 1 }));
    const before = registry.snapshot();
    registry.prune();
    expect(registry.snapshot()).toBe(before);
  });
});
