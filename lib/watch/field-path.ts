/**
 * Dot-path resolution into a poll payload, plus the canonical text form every
 * condition compares against (DX-141).
 *
 * The one design decision worth knowing before reading: there is **no implicit
 * descent into a list envelope**. See resolveFieldPath.
 */

import type { Resolved } from "./types.js";

const DIGITS = /^\d+$/;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * Comparable text for a resolved value. Scalars stringify to exactly what a
 * user would type at the flag (`null`, `true`, `42`, `ready`), so
 * `--until 'code equals 200'` matches the number 200 and
 * `--until 'error equals null'` matches JSON null without the caller having to
 * guess the wire type. Containers get stable JSON — `equals` on them is
 * possible, though `matches` is the sane tool there.
 */
export const canonical = (value: unknown): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "string") return value;
  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  ) {
    return String(value);
  }
  try {
    return JSON.stringify(value) ?? "undefined";
  } catch {
    // Circular structures can't happen over the wire, but a poll payload is
    // untrusted input and a throw here would kill the watcher.
    return String(value);
  }
};

/** Segments, or null when the path is malformed (an empty segment). */
export const parseFieldPath = (path: string): string[] | null => {
  const trimmed = path.trim();
  if (trimmed === "") return [];
  const segments = trimmed.split(".");
  return segments.some((segment) => segment === "") ? null : segments;
};

/**
 * Walk `path` into `data`.
 *
 * Deliberately strict about list envelopes: a bare `status` against the
 * gateway's `{ items, page }` resolves to `missing`, **not** `items[0].status`.
 * A page of 50 records has 50 statuses, and picking `[0]` would depend on a
 * default sort the CLI neither controls nor displays — a watcher silently
 * tracking whichever row sorted first is a wrong answer wearing a right
 * answer's clothes. It would also make the same `--until 'status equals ready'`
 * mean two different things depending on which command it was pointed at.
 * Being explicit costs eight characters: `items.0.status`. What falls out free
 * and is worth knowing: `page.total`, `page.hasMore`, `items.length`.
 */
export const resolveFieldPath = (data: unknown, path: string): Resolved => {
  const segments = parseFieldPath(path);
  if (segments === null) return { kind: "missing", at: path.trim() };

  let node: unknown = data;
  const walked: string[] = [];
  const at = (segment: string): string => [...walked, segment].join(".");

  for (const segment of segments) {
    if (Array.isArray(node)) {
      if (DIGITS.test(segment)) {
        const index = Number(segment);
        if (index >= node.length) return { kind: "missing", at: at(segment) };
        node = node[index];
      } else if (segment === "length") {
        node = node.length;
      } else {
        return { kind: "missing", at: at(segment) };
      }
    } else if (isPlainObject(node)) {
      // Own properties only: `constructor`, `toString` and `__proto__` resolve
      // through the prototype chain and are not payload.
      if (!Object.prototype.hasOwnProperty.call(node, segment)) {
        return { kind: "missing", at: at(segment) };
      }
      node = node[segment];
    } else {
      // null, undefined, string, number, boolean — nothing left to descend.
      // Notably `"abc".0` is a miss: strings are not traversable here.
      return { kind: "missing", at: at(segment) };
    }
    walked.push(segment);
  }
  return { kind: "value", value: node };
};

/**
 * Every path a surface can offer as a suggestion, depth-first and capped. Used
 * by the TUI wizard to turn a probed payload into a pick list instead of making
 * the user know the field names.
 */
export const enumerateFieldPaths = (
  data: unknown,
  { maxDepth = 3, maxPaths = 200 }: { maxDepth?: number; maxPaths?: number } = {},
): string[] => {
  const paths: string[] = [];
  const walk = (node: unknown, prefix: string, depth: number): void => {
    if (paths.length >= maxPaths || depth > maxDepth) return;
    if (Array.isArray(node)) {
      if (prefix !== "") paths.push(`${prefix}.length`);
      // Only the first element: the shape repeats, and offering 50 identical
      // path families would bury the useful ones.
      if (node.length > 0) walk(node[0], `${prefix}.0`, depth + 1);
      return;
    }
    if (!isPlainObject(node)) return;
    for (const key of Object.keys(node)) {
      if (paths.length >= maxPaths) return;
      const next = prefix === "" ? key : `${prefix}.${key}`;
      paths.push(next);
      walk(node[key], next, depth + 1);
    }
  };
  walk(data, "", 0);
  return paths;
};

/** Keys that name a lifecycle state, in the order we'd guess them. */
const STATE_KEYS = ["status", "state", "phase"];

/**
 * Advisory only — a prefill for the surfaces, never applied by the resolver. A
 * get-by-id response is a bare object whose interesting field is nearly always
 * `status`; a list envelope's is `page.total`.
 */
export const suggestFieldPath = (data: unknown): string | null => {
  if (!isPlainObject(data)) return null;
  if (Array.isArray(data["items"])) return "page.total";
  for (const key of STATE_KEYS) {
    if (Object.prototype.hasOwnProperty.call(data, key)) return key;
  }
  return null;
};

/**
 * Short display text for a resolved value: an em dash for a miss, scalars bare,
 * containers as truncated JSON.
 */
export const formatResolved = (resolved: Resolved | null, max = 40): string => {
  if (resolved === null || resolved.kind === "missing") return "—";
  const text = canonical(resolved.value);
  return text.length > max ? `${text.slice(0, Math.max(max - 1, 1))}…` : text;
};
