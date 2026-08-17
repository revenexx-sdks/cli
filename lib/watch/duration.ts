/**
 * Human durations for the watch flags (`--every 5s`, `--for 10m`) and the TUI
 * wizard's cadence step (DX-141).
 */

const UNITS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  sec: 1_000,
  secs: 1_000,
  m: 60_000,
  min: 60_000,
  mins: 60_000,
  h: 3_600_000,
  hr: 3_600_000,
  hrs: 3_600_000,
};

/**
 * The absent arm of each branch is declared as `undefined` rather than omitted:
 * this package compiles with `strict: false`, where TypeScript will not narrow
 * a union by a boolean discriminant, so callers must be able to read `.error`
 * off the union directly.
 */
export type DurationParse =
  | { ok: true; ms: number; error?: undefined }
  | { ok: false; ms?: undefined; error: string };

/**
 * `500ms` | `5s` | `2m` | `1h` | `30` — a bare number is **seconds**, which is
 * what everyone means when they type `--every 5`. Fractions are allowed
 * (`0.5m`); the result is rounded to whole milliseconds.
 */
export const parseDuration = (text: string): DurationParse => {
  const trimmed = text.trim().toLowerCase();
  if (trimmed === "") return { ok: false, error: "empty duration" };
  const match = /^(\d+(?:\.\d+)?)\s*([a-z]*)$/.exec(trimmed);
  if (match === null) {
    return {
      ok: false,
      error: `invalid duration \`${text.trim()}\` — try 5s, 2m, 500ms`,
    };
  }
  const amount = Number(match[1]);
  const unit = match[2] === "" ? "s" : (match[2] as string);
  const scale = UNITS[unit];
  if (scale === undefined) {
    return {
      ok: false,
      error: `unknown duration unit \`${unit}\` — use ms, s, m or h`,
    };
  }
  return { ok: true, ms: Math.round(amount * scale) };
};

/** Compact, for status lines and table cells: `900ms`, `42s`, `3m 05s`, `2h 07m`. */
export const formatDuration = (ms: number): string => {
  if (ms < 1_000) return `${Math.max(Math.round(ms), 0)}ms`;
  const totalSeconds = Math.round(ms / 1_000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
};
