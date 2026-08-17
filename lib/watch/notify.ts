/**
 * Notification ports for the watchlist (DX-141). The scheduler calls one
 * interface on every state transition; the TUI renders a toast and a badge, the
 * REPL prints a line and rings the bell. Ports differ in *rendering*, not in
 * which transitions they care about — filtering belongs to the port.
 */

import { cliConfig } from "../parser.js";
import { formatCondition } from "./condition.js";
import { formatResolved } from "./field-path.js";
import { formatDuration } from "./duration.js";
import { isTerminalState } from "./types.js";
import type { WatchState, Watcher } from "./types.js";

export type WatchNotification = {
  watcher: Watcher;
  /** The state it left, so a port can ignore intra-poll churn. */
  from: WatchState;
  to: WatchState;
};

export type NotificationPort = {
  onTransition(event: WatchNotification): void;
};

export type NotificationPortSet = NotificationPort & {
  /** Returns a detach function, mirroring registry.subscribe. */
  attach(port: NotificationPort): () => void;
};

export const createPortSet = (): NotificationPortSet => {
  const ports = new Set<NotificationPort>();
  return {
    attach: (port) => {
      ports.add(port);
      return () => {
        ports.delete(port);
      };
    },
    onTransition: (event) => {
      for (const port of [...ports]) {
        // One misbehaving port must not stall the poll loop or the others.
        try {
          port.onTransition(event);
        } catch {
          // Intentionally swallowed.
        }
      }
    },
  };
};

/** The scheduler singleton's port set. */
export const watchPorts: NotificationPortSet = createPortSet();

/**
 * The real fd-1 write, captured at module load — before the TUI's ink proxy
 * exists and before lib/tui/executor.ts ever patches process.stdout.write.
 *
 * Out-of-band output (the bell, the REPL's completion line) always goes through
 * this binding. A naive `process.stdout.write("\x07")` from a timer that
 * happened to fire during a run would land in that run's capture buffer
 * instead of the terminal — and then be fed to JSON.parse, so the poll would
 * come back with `data: undefined` and the bell would never sound.
 *
 * Capturing here is safe: ESM imports resolve at startup, the executor always
 * restores in a finally, and createInkStdout() only *reads* the write to build
 * its proxy — it never replaces it.
 */
const realStdoutWrite = process.stdout.write.bind(process.stdout);
const defaultWrite = (chunk: string): void => {
  realStdoutWrite(chunk);
};
let outOfBandWrite: (chunk: string) => void = defaultWrite;

/** Test seam (and a hook for any future surface). Pass null to restore. */
export const bindOutOfBandWriter = (
  write: ((chunk: string) => void) | null,
): void => {
  outOfBandWrite = write ?? defaultWrite;
};

export const writeOutOfBand = (chunk: string): void => {
  outOfBandWrite(chunk);
};

/**
 * Silenced when stdout is not a TTY (a BEL in a pipe is a stray byte in
 * someone's JSON), on TERM=dumb, on an explicit opt-out, and under --quiet.
 * NO_COLOR is deliberately *not* consulted: it is about colour, not sound, and
 * overloading it would surprise anyone who sets it globally.
 */
const bellMutedByEnv = (): boolean =>
  process.env["REVENEXX_NO_BELL"] !== undefined ||
  process.env["TERM"] === "dumb" ||
  process.stdout.isTTY !== true;

const BELL_COALESCE_MS = 1_000;
let lastBellAt = -Infinity;

/** Reset the coalescing window. Tests only. */
export const resetBellState = (): void => {
  lastBellAt = -Infinity;
};

export const ringBell = (now: () => number = Date.now): void => {
  if (bellMutedByEnv() || cliConfig.quiet === true) return;
  // Eight watchers finishing in the same second must be one bell, not eight.
  const at = now();
  if (at - lastBellAt < BELL_COALESCE_MS) return;
  lastBellAt = at;
  writeOutOfBand("\x07");
};

/** Glyph + a one-line summary of how a watcher ended. */
export const formatWatchOutcome = (
  watcher: Watcher,
): { glyph: string; tone: "success" | "danger" | "warn"; text: string } => {
  const elapsed = formatDuration(
    (watcher.finishedAt ?? watcher.createdAt) - watcher.createdAt,
  );
  const where = `${watcher.label} · ${watcher.fieldPath || "(payload)"}`;
  switch (watcher.state) {
    case "satisfied":
      return {
        glyph: "✓",
        tone: "success",
        text: `watcher #${watcher.id} satisfied · ${where} ${formatCondition(
          watcher.condition,
        )} · now ${formatResolved(watcher.lastValue)} · ${elapsed}`,
      };
    case "timeout":
      return {
        glyph: "⏱",
        tone: "warn",
        // A watcher whose every poll failed has no last value to show, and a
        // bare dash hides the reason it never got anywhere — carry the note.
        text: `watcher #${watcher.id} timed out · ${where} · ${
          watcher.lastValue === null && watcher.lastError !== null
            ? watcher.lastError
            : `last ${formatResolved(watcher.lastValue)}`
        } · ${elapsed}`,
      };
    case "cancelled":
      return {
        glyph: "·",
        tone: "warn",
        text: `watcher #${watcher.id} cancelled · ${where}`,
      };
    default:
      return {
        glyph: "✗",
        tone: "danger",
        text: `watcher #${watcher.id} failed · ${where} · ${
          watcher.lastError ?? "unknown error"
        }`,
      };
  }
};

/**
 * REPL: a line plus a bell. readline may be parked mid-prompt, so the notice
 * starts with \r + erase-line rather than half-overwriting the prompt, and the
 * caller's `redraw` repaints it afterwards — otherwise the user is left
 * apparently prompt-less until the next keystroke.
 */
export const createReplNotificationPort = (
  redraw: () => void,
): NotificationPort => ({
  onTransition: ({ watcher, to }) => {
    if (!isTerminalState(to)) return;
    const { glyph, text } = formatWatchOutcome(watcher);
    writeOutOfBand(`\r\x1b[2K${glyph} ${text}\n`);
    ringBell();
    redraw();
  },
});

/**
 * TUI: an in-app toast plus the bell. Built once and handed a ref-backed
 * callback — the scheduler holds the port for the process lifetime, so a port
 * closing over a render-scoped setter would go stale.
 */
export const createTuiNotificationPort = (
  toast: (text: string, tone: "success" | "danger" | "warn") => void,
): NotificationPort => ({
  onTransition: ({ watcher, to }) => {
    if (!isTerminalState(to)) return;
    const { glyph, tone, text } = formatWatchOutcome(watcher);
    toast(`${glyph} ${text}`, tone);
    ringBell();
  },
});
