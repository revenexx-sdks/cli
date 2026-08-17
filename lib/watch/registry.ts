/**
 * The watcher store (DX-141). A mutable exported singleton, which is the grain
 * of this codebase — lib/tui/theme.ts does the same with the active palette,
 * and the TUI has no context or event bus (everything else is prop-drilled from
 * App). The REPL, the one-shot `watch` command and the TUI pane all read the
 * same store, so the surfaces cannot disagree about what is running.
 */

import { MAX_RETAINED_WATCHERS, isTerminalState } from "./types.js";
import type { Watcher } from "./types.js";

export type WatchRegistry = {
  get(id: string): Watcher | undefined;
  /** Referentially stable between mutations — see the note on emit(). */
  snapshot(): readonly Watcher[];
  add(watcher: Watcher): Watcher;
  update(id: string, patch: Partial<Watcher>): Watcher | undefined;
  remove(id: string): boolean;
  clear(): void;
  /** Drop finished watchers past MAX_RETAINED_WATCHERS, oldest-finished first. */
  prune(): void;
  /** Listeners are NOT invoked on subscribe; callers read snapshot() first. */
  subscribe(listener: () => void): () => void;
};

export const createWatchRegistry = (): WatchRegistry => {
  const byId = new Map<string, Watcher>();
  const listeners = new Set<() => void>();
  let cached: readonly Watcher[] = [];

  /**
   * Rebuild the snapshot, then notify. The array identity must change exactly
   * when the data does and not otherwise: useSyncExternalStore calls
   * getSnapshot on every render and throws "The result of getSnapshot should be
   * cached" if it sees a fresh array each time.
   *
   * Emitting synchronously (rather than coalescing into a microtask) is
   * deliberate — the run lock already bounds mutations to one per completed
   * poll, so there are no bursts to collapse, and synchronous delivery keeps
   * settled() and notification ordering trivially deterministic.
   */
  const emit = (): void => {
    cached = [...byId.values()];
    // Copy first: a listener may unsubscribe itself (settled() does).
    for (const listener of [...listeners]) listener();
  };

  return {
    get: (id) => byId.get(id),
    snapshot: () => cached,
    add: (watcher) => {
      byId.set(watcher.id, watcher);
      emit();
      return watcher;
    },
    update: (id, patch) => {
      const current = byId.get(id);
      if (current === undefined) return undefined;
      // Records are replaced wholesale, never mutated: a React pane can then
      // memo on identity, and the scheduler can compare before/after states.
      const next = Object.freeze({ ...current, ...patch }) as Watcher;
      byId.set(id, next);
      emit();
      return next;
    },
    remove: (id) => {
      const had = byId.delete(id);
      if (had) emit();
      return had;
    },
    clear: () => {
      byId.clear();
      emit();
    },
    prune: () => {
      const finished = [...byId.values()].filter((watcher) =>
        isTerminalState(watcher.state),
      );
      if (finished.length <= MAX_RETAINED_WATCHERS) return;
      finished
        .sort((a, b) => (a.finishedAt ?? 0) - (b.finishedAt ?? 0))
        .slice(0, finished.length - MAX_RETAINED_WATCHERS)
        .forEach((watcher) => byId.delete(watcher.id));
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};

/** Process-wide store, shared by every surface. */
export const watchRegistry: WatchRegistry = createWatchRegistry();
