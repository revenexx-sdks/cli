/**
 * Whether an interactive session is hosting watchers right now (DX-141).
 *
 * `watch add` means two different things depending on the answer. Inside the
 * REPL or the TUI there is a process that outlives the command, so the watcher
 * is registered and the prompt comes straight back. One-shot there is nothing
 * to come back to, so the command blocks until the watcher settles and turns
 * its outcome into an exit code.
 *
 * A tiny module of its own rather than a flag on cliConfig: repl.ts's
 * resetCliConfig is a hand-maintained mirror of CliConfig with no compile-time
 * link, and a field missing from it becomes silently sticky across REPL lines.
 */

let depth = 0;

export const beginWatchSession = (): void => {
  depth += 1;
};

export const endWatchSession = (): void => {
  depth = Math.max(depth - 1, 0);
};

export const isWatchSessionActive = (): boolean => depth > 0;
