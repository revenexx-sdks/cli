/**
 * Shared vocabulary for the background watchlist (DX-141): a watcher polls one
 * get-by-id command and reports when a field reaches a condition.
 *
 * Deliberately dependency-free. The REPL, the one-shot `watch` command and the
 * TUI pane all import this tree, and every module under lib/tui/ pulls in ink —
 * which initialises its yoga layout engine via top-level await (see the comment
 * in lib/commands/tui.ts). Nothing in lib/watch/ may therefore import from
 * lib/tui/ except as `import type`.
 */

export type WatchState =
  /** Created; no successful poll yet. Also the `changed` baseline window. */
  | "pending"
  /** At least one poll landed and the condition is not met yet. */
  | "polling"
  | "satisfied"
  | "timeout"
  /** Gave up: a fatal failure, or too many transient ones in a row. */
  | "error"
  | "cancelled";

export const TERMINAL_WATCH_STATES: ReadonlySet<WatchState> = new Set<WatchState>([
  "satisfied",
  "timeout",
  "error",
  "cancelled",
]);

export const isTerminalState = (state: WatchState): boolean =>
  TERMINAL_WATCH_STATES.has(state);

/**
 * The outcome of a field-path lookup. Tagged rather than `unknown | undefined`
 * because the gateway legitimately returns `null`, and `equals null` has to be
 * distinguishable from "there is no such path" — otherwise a typo'd path
 * quietly satisfies a condition instead of reporting itself.
 */
export type Resolved =
  | { kind: "value"; value: unknown }
  /** The path prefix that failed, so a surface can point at the bad segment. */
  | { kind: "missing"; at: string };

export type WatchCondition =
  | { kind: "changed" }
  /** `raw` is what the user typed (echoed back in the UI); `value` is the
   * lower-cased comparand actually matched against. */
  | { kind: "equals"; raw: string; value: string }
  /** Source + flags, not a live RegExp: the record stays a plain value, so it
   * compares structurally for duplicate detection and survives a snapshot. */
  | { kind: "matches"; source: string; flags: string }
  | { kind: "terminal"; done: readonly string[]; custom: boolean }
  | { kind: "truthy" };

/**
 * Structurally identical to lib/tui/form.tsx's FormValues. Re-declared rather
 * than imported: form.tsx is a React module, and importing it here would drag
 * ink onto the one-shot path.
 */
export type WatchFormValues = Record<string, string>;

export type Watcher = Readonly<{
  id: string;
  /** Short display label, e.g. "imports get-import". */
  label: string;
  /** The one-shot line (buildCommandLine), for display only. */
  commandLine: string;
  path: readonly string[];
  values: WatchFormValues;
  /** Frozen argv, resolved once at creation — see buildWatchTokens. */
  tokens: readonly string[];
  fieldPath: string;
  condition: WatchCondition;
  intervalMs: number;
  timeoutMs: number;
  /** 404 is fatal by default — a typo'd id should fail fast. Opt in when
   * genuinely waiting for a resource that does not exist yet. */
  treat404AsTransient: boolean;
  createdAt: number;

  state: WatchState;
  lastValue: Resolved | null;
  /** Baseline for `changed`. Seeded by the first successful poll unless the
   * creator supplied one (the TUI wizard probes before creating). */
  initialValue: Resolved | null;
  pollCount: number;
  /** Consecutive transient failures; any successful poll resets it. */
  transientFailures: number;
  lastPolledAt: number | null;
  /** Also carries the soft "field not present yet" note, which is not a
   * failure — see the scheduler. */
  lastError: string | null;
  satisfiedAt: number | null;
  finishedAt: number | null;
  /** Exit code of the last poll, so a blocking one-shot can propagate it. */
  lastExitCode: number;
}>;

export type WatchSpec = {
  path: string[];
  values: WatchFormValues;
  tokens: string[];
  commandLine: string;
  fieldPath: string;
  condition: WatchCondition;
  intervalMs?: number;
  timeoutMs?: number;
  /** Pre-seed the `changed` baseline from a payload already in hand. */
  initialValue?: Resolved;
  treat404AsTransient?: boolean;
  label?: string;
  /** Pin --tenant/--endpoint onto the argv at creation. Default true. */
  pinContext?: boolean;
};

/**
 * A floor, not a suggestion. One poll can legitimately take a minute: the
 * client's own timeout is 30 s and it retries idempotent GETs three times with
 * full-jitter backoff (lib/client.ts). Below ~2 s the extra polls buy nothing
 * but queue pressure and 429s the client then has to back off from anyway.
 */
export const MIN_INTERVAL_MS = 2_000;
export const DEFAULT_INTERVAL_MS = 5_000;
export const DEFAULT_WATCH_TIMEOUT_MS = 5 * 60_000;
export const MAX_WATCH_TIMEOUT_MS = 60 * 60_000;

/**
 * Polls are serialized through one queue (see run-queue.ts), so N watchers make
 * each one's effective period at best N × poll-duration. Past ~8 the advertised
 * interval stops being true and the status-bar badge stops being readable.
 */
export const MAX_ACTIVE_WATCHERS = 8;

/**
 * ±15 % decorrelation, not backoff. Watchers created in a burst would otherwise
 * stay phase-locked forever and keep landing in the same queue slot.
 */
export const JITTER_RATIO = 0.15;

/**
 * Applied on top of the client's own retries: by the time a poll comes back
 * failed, the client has already spent its three attempts.
 */
export const TRANSIENT_BACKOFF_MS: readonly number[] = [
  2_000, 5_000, 15_000, 30_000, 30_000,
];
export const MAX_TRANSIENT_FAILURES = TRANSIENT_BACKOFF_MS.length;

/** Finished watchers stay visible; the oldest-finished are pruned past this. */
export const MAX_RETAINED_WATCHERS = 20;
