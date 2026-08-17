/**
 * Watch conditions (DX-141): the closed set of ways a watcher can decide it is
 * done, plus the parser behind `--until` and the formatter the UIs echo back.
 */

import { getErrorMessage } from "../utils.js";
import { canonical, parseFieldPath } from "./field-path.js";
import type { Resolved, WatchCondition } from "./types.js";

export const CONDITION_KEYWORDS = [
  "changed",
  "equals",
  "matches",
  "terminal",
  "truthy",
] as const;

/** Shorthands accepted in place of a keyword. */
const EQUALS_ALIASES = ["=", "=="];
const MATCHES_ALIASES = ["~"];

/**
 * "Terminal" means *stopped moving*, not *won*: a watcher must stop and tell
 * you the deploy failed, not spin to timeout while the resource sits in
 * `failed`. Both the success and the failure sinks are in the set.
 */
export const DEFAULT_TERMINAL_STATES: readonly string[] = [
  "succeeded",
  "success",
  "complete",
  "completed",
  "done",
  "ready",
  "active",
  "available",
  "live",
  "published",
  "failed",
  "failure",
  "error",
  "errored",
  "cancelled",
  "canceled",
  "aborted",
  "expired",
  "timed_out",
  "timeout",
  "rejected",
  "deleted",
];

/**
 * Normalised for matching: `TIMED OUT`, `timed-out` and `timed_out` are the
 * same sink, and services are not consistent about which they emit.
 */
const normalizeState = (text: string): string =>
  text.trim().toLowerCase().replace(/[\s-]+/g, "_");

/**
 * Override precedence, most specific first:
 *   1. per-watcher — `--until 'status terminal(ready,failed)'`
 *   2. REVENEXX_WATCH_TERMINAL_STATES (comma-separated), read once at load —
 *      the same env-var grain as REVENEXX_THEME / REVENEXX_NO_ANIM
 *   3. the built-in set above
 * The resolved set is baked into the condition record, so a watcher stays
 * self-describing even if the environment changes underneath it.
 */
const envTerminalStates = (process.env["REVENEXX_WATCH_TERMINAL_STATES"] ?? "")
  .split(",")
  .map((part) => part.trim())
  .filter((part) => part !== "");

export const defaultTerminalStates = (): readonly string[] =>
  envTerminalStates.length > 0 ? envTerminalStates : DEFAULT_TERMINAL_STATES;

/**
 * The absent arm of each branch is declared as `undefined` rather than omitted:
 * this package compiles with `strict: false`, where TypeScript will not narrow
 * a union by a boolean discriminant, so callers must be able to read `.error`
 * off the union directly.
 */
export type ConditionParse =
  | { ok: true; condition: WatchCondition; error?: undefined }
  | { ok: false; condition?: undefined; error: string };

/** Strip one matched pair of surrounding quotes, if present. */
const unquote = (text: string): string => {
  const first = text[0];
  if ((first === '"' || first === "'") && text.endsWith(first) && text.length > 1) {
    return text.slice(1, -1);
  }
  return text;
};

const compileMatch = (argument: string): ConditionParse => {
  if (argument === "") return { ok: false, error: "`matches` needs a pattern" };
  // Accept both a bare pattern and the familiar /pattern/flags form.
  const delimited = /^\/(.*)\/([a-z]*)$/s.exec(argument);
  const source = delimited?.[1] ?? unquote(argument);
  // `g` and `y` make RegExp.test stateful through lastIndex: the *same* value
  // would alternate true/false between polls. Dropped, never honoured.
  const flags = (delimited?.[2] ?? "").replace(/[gy]/g, "");
  try {
    new RegExp(source, flags);
  } catch (err) {
    // Rejected at parse time, not on poll 1 — a bad regex has to fail where the
    // user can see it, not five seconds later inside a background timer.
    return { ok: false, error: `invalid regex: ${getErrorMessage(err)}` };
  }
  return { ok: true, condition: { kind: "matches", source, flags } };
};

const parseTerminal = (text: string): ConditionParse => {
  const custom = /^terminal\s*\(([^)]*)\)$/i.exec(text.trim());
  if (custom === null) {
    return text.trim().toLowerCase() === "terminal"
      ? {
          ok: true,
          condition: {
            kind: "terminal",
            done: defaultTerminalStates(),
            custom: false,
          },
        }
      : {
          ok: false,
          error: "`terminal` takes either no argument or terminal(a,b,c)",
        };
  }
  const done = (custom[1] ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
  if (done.length === 0) {
    return { ok: false, error: "`terminal(...)` needs at least one state" };
  }
  return { ok: true, condition: { kind: "terminal", done, custom: true } };
};

export const parseCondition = (text: string): ConditionParse => {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: false, error: "empty condition" };
  const head = trimmed.split(/\s+/)[0] ?? "";
  const argument = trimmed.slice(head.length).trim();
  const keyword = head.toLowerCase();

  if (keyword === "changed" || keyword === "truthy") {
    return argument === ""
      ? { ok: true, condition: { kind: keyword } }
      : { ok: false, error: `\`${keyword}\` takes no argument` };
  }
  if (keyword === "equals" || EQUALS_ALIASES.includes(keyword)) {
    if (argument === "") return { ok: false, error: "`equals` needs a value" };
    const raw = unquote(argument);
    return {
      ok: true,
      condition: { kind: "equals", raw, value: raw.toLowerCase() },
    };
  }
  if (keyword === "matches" || MATCHES_ALIASES.includes(keyword)) {
    return compileMatch(argument);
  }
  if (keyword === "terminal" || keyword.startsWith("terminal(")) {
    return parseTerminal(trimmed);
  }

  return {
    ok: false,
    error: `unknown condition \`${head}\` — expected one of ${CONDITION_KEYWORDS.join(", ")}`,
  };
};

const isConditionKeyword = (head: string): boolean => {
  const lower = head.toLowerCase();
  return (
    (CONDITION_KEYWORDS as readonly string[]).includes(lower) ||
    lower.startsWith("terminal(") ||
    EQUALS_ALIASES.includes(lower) ||
    MATCHES_ALIASES.includes(lower)
  );
};

export type UntilParse =
  | {
      ok: true;
      fieldPath: string;
      condition: WatchCondition;
      error?: undefined;
    }
  | {
      ok: false;
      fieldPath?: undefined;
      condition?: undefined;
      error: string;
    };

/**
 * `[<field-path>] <condition>` — the shape `--until` takes. One flag carries
 * both because `--until 'status equals ready'` reads better than splitting it,
 * and the condition keywords are a closed set, so a leading token that is not
 * one of them is unambiguously the field path. Callers that pass `--field`
 * separately can use parseCondition directly.
 */
export const parseUntil = (text: string): UntilParse => {
  const trimmed = text.trim();
  if (trimmed === "") return { ok: false, error: "empty condition" };
  const head = trimmed.split(/\s+/)[0] ?? "";
  const keywordLed = isConditionKeyword(head);
  const fieldPath = keywordLed ? "" : head;
  const parsed = parseCondition(
    keywordLed ? trimmed : trimmed.slice(head.length).trim(),
  );
  if (!parsed.ok) return { ok: false, error: parsed.error as string };
  if (!keywordLed && parseFieldPath(fieldPath) === null) {
    return { ok: false, error: `invalid field path \`${fieldPath}\`` };
  }
  return {
    ok: true,
    fieldPath,
    condition: parsed.condition as WatchCondition,
  };
};

export const evaluateCondition = (
  condition: WatchCondition,
  current: Resolved,
  baseline: Resolved | null,
): boolean => {
  if (condition.kind === "changed") {
    // No baseline means this poll *is* the baseline, so it can never be the
    // change. See the baseline note in scheduler.ts.
    if (baseline === null) return false;
    if (current.kind !== baseline.kind) return true; // a field appearing IS a change
    if (current.kind === "missing" || baseline.kind === "missing") return false;
    return canonical(current.value) !== canonical(baseline.value);
  }

  // Every other condition is a statement about a value. A field that is not
  // there yet is "not satisfied", never an error — a job's `error.message`
  // legitimately materialises on poll 9.
  if (current.kind === "missing") return false;
  const value = current.value;

  switch (condition.kind) {
    case "equals":
      return canonical(value).toLowerCase() === condition.value;
    case "matches":
      return new RegExp(condition.source, condition.flags).test(canonical(value));
    case "terminal": {
      const seen = normalizeState(canonical(value));
      return condition.done.some((state) => normalizeState(state) === seen);
    }
    case "truthy":
      // JS truthiness with two corrections a JSON-over-the-wire poller needs:
      // the *strings* "false"/"0" (a boolean rendered as text) are falsy, and
      // an empty array/object is falsy — `errors truthy` must not fire on [].
      if (typeof value === "string") {
        const text = value.trim().toLowerCase();
        return text !== "" && text !== "false" && text !== "0";
      }
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object" && value !== null) {
        return Object.keys(value).length > 0;
      }
      return Boolean(value);
  }
};

export const formatCondition = (condition: WatchCondition): string => {
  switch (condition.kind) {
    case "changed":
      return "changed";
    case "truthy":
      return "truthy";
    case "equals":
      return `= ${condition.raw}`;
    case "matches":
      return `~ /${condition.source}/${condition.flags}`;
    case "terminal":
      return condition.custom
        ? `terminal(${condition.done.join(",")})`
        : "terminal";
  }
};
