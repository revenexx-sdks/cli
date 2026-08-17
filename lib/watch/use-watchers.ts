/**
 * The only file under lib/watch/ that imports react (DX-141). Everything else
 * in this directory has to stay loadable on the one-shot path, so the React
 * binding lives here and is imported only from lib/tui/.
 */

import { useSyncExternalStore } from "react";
import { watchRegistry } from "./registry.js";
import { isTerminalState } from "./types.js";
import type { Watcher } from "./types.js";

/**
 * useSyncExternalStore rather than subscribe + useState, for one concrete
 * reason: with `useEffect(() => registry.subscribe(force), [])` a transition
 * emitted between the first render and the effect commit is dropped, and the
 * pane shows a stale watcher until something else happens to re-render it. That
 * window is real here — a watcher flipping to `satisfied` 40 ms after the pane
 * opens lands squarely in it. This hook re-reads the snapshot on subscribe and
 * after every commit, so a missed emit self-heals. It also guarantees the pane
 * and the status-bar badge read the same snapshot within a commit.
 */
export const useWatchers = (): readonly Watcher[] =>
  useSyncExternalStore(watchRegistry.subscribe, watchRegistry.snapshot);

export type WatchCounts = { active: number; done: number; failed: number };

/** Badge arithmetic, derived from the same snapshot the pane renders. */
export const useWatchCounts = (): WatchCounts => {
  const watchers = useWatchers();
  let active = 0;
  let done = 0;
  let failed = 0;
  for (const watcher of watchers) {
    if (!isTerminalState(watcher.state)) active += 1;
    else if (watcher.state === "satisfied") done += 1;
    else if (watcher.state !== "cancelled") failed += 1;
  }
  return { active, done, failed };
};
