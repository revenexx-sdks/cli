/**
 * Pure command-tree helpers for the TUI browser and palette. The tree is
 * captured from the live commander program (lib/commands/tui.ts), so plugins
 * and generated services are all included without a second registry.
 */

import {
  BUILTIN_COMMAND_ALIASES,
  BUILTIN_VERB_ALIASES,
} from "../alias.js";
import type { PromptSpec } from "../interactive.js";

export type CommandLeaf = {
  name: string;
  description: string;
  /** Display name for the browser (e.g. the resource behind a list command:
   * `asset-families-list` → `asset-families`). Execution, search and the
   * one-shot line always use the real `name`. */
  label?: string;
  /** Registered PromptSpecs (see registerPromptSpecs) — the form's source. */
  specs?: PromptSpec[];
  /** DELETE-backed command; the TUI gates execution behind a confirm modal. */
  destructive?: boolean;
  /** Lower-case HTTP method — safe reads auto-run once params are picked. */
  method?: string;
  /** Kept in the tree (so a list's u/d can resolve it) but not shown when
   * browsing: a get/update/delete whose actions are reached from its list. */
  hidden?: boolean;
  /** TUI-only synthetic action — open an in-app panel instead of running a
   * command (settings → themes opens the theme picker). */
  tuiAction?: "theme-picker";
  /** Real invocation path when the nav path differs from the command path:
   * the settings subtree relocates `alias`, so its actions browse under
   * `settings › alias` but still run as `alias set|list|remove`. */
  runPath?: string[];
  /** Drill-in children. Services are two-level and leave this unset; the
   * relocated alias nests (alias → set/list/remove). */
  subcommands?: CommandLeaf[];
  /** Grouped under this named root nav section instead of folders/commands
   * (TUI preferences: the themes action + the relocated alias command). */
  group?: string;
};

export type CommandNode = CommandLeaf & {
  /** Empty for standalone commands (login, status, …). */
  subcommands: CommandLeaf[];
};

export type PaletteEntry = {
  /** Full invocation path, e.g. "products list-products". */
  path: string;
  description: string;
  /** Invocation tokens, e.g. ["products", "list-products"]. */
  parts: string[];
  /** The runnable command itself (specs, destructive flag). */
  leaf: CommandLeaf;
  /** Prettier row text for the search list (resource-labelled path). The
   * query always matches against `path`, so real names keep working. */
  display?: string;
};

/** Every runnable invocation plus the service groups themselves. A service
 * whose own records have a list (bare `list`/`index`) merges with it: the
 * group's search row IS that list — picking it runs the records and lands
 * inside the folder. Groups without one just drill in. */
export const flattenTree = (nodes: CommandNode[]): PaletteEntry[] =>
  nodes.flatMap((node) => {
    if (node.subcommands.length === 0) {
      return [
        {
          path: node.name,
          description: node.description,
          parts: [node.name],
          leaf: node,
        },
      ];
    }
    const ownList = node.subcommands.find(
      (subcommand) => listResource(subcommand.name) === "",
    );
    return [
      ownList !== undefined
        ? {
            path: node.name,
            description: ownList.description || node.description,
            parts: [node.name, ownList.name],
            leaf: ownList,
            display: node.name,
          }
        : {
            path: node.name,
            description: node.description,
            parts: [node.name],
            leaf: node,
          },
      // Hidden leaves (create/get/update/delete behind their list) are
      // excluded from search too: the list is the entry point for the
      // whole record lifecycle (⏎ view · c/u/d). The own-records list is
      // already merged into the group row above.
      ...node.subcommands
        .filter(
          (subcommand) =>
            subcommand.hidden !== true &&
            listResource(subcommand.name) !== "",
        )
        .map((subcommand) => ({
          path: `${node.name} ${subcommand.name}`,
          description: subcommand.description,
          parts: [node.name, subcommand.name],
          leaf: subcommand,
          display:
            subcommand.label !== undefined
              ? `${node.name} ${subcommand.label}`
              : undefined,
        })),
    ];
  });

/** Naive plural candidates for a resource word (deployment → deployments…). */
const plurals = (word: string): string[] =>
  word.endsWith("y")
    ? [`${word.slice(0, -1)}ies`, `${word}s`, word]
    : [`${word}s`, `${word}es`, word];

/** Naive singular candidates (deployments → deployment…). */
const singulars = (word: string): string[] =>
  word.endsWith("ies")
    ? [`${word.slice(0, -3)}y`, word]
    : word.endsWith("s")
      ? [word.slice(0, -1), word]
      : [word];

/** Command-name forms a list can take (`x-list`, rails-style `x-index`). */
const LIST_FORMS = ["list", "index"];

/**
 * The resource a list command browses: `asset-families-list`,
 * `list-deployments` and rails-style `asset-index` → their resource, the
 * bare `list`/`index` → "" (the service's own records). Undefined when the
 * command isn't a list at all.
 */
export const listResource = (name: string): string | undefined => {
  for (const form of LIST_FORMS) {
    if (name === form) return "";
    if (name.endsWith(`-${form}`)) return name.slice(0, -(form.length + 1));
  }
  if (name.startsWith("list-")) return name.slice("list-".length);
  return undefined;
};

/** CRUD verbs whose commands fold into their list (⏎ view · c/u/d). */
export const CRUD_VERBS = ["create", "get", "update", "delete"] as const;

/** Name forms per verb — rails-style synonyms included (store/show/destroy). */
const VERB_FORMS: Record<(typeof CRUD_VERBS)[number], string[]> = {
  create: ["create", "store"],
  get: ["get", "show"],
  update: ["update"],
  delete: ["delete", "destroy"],
};

/**
 * Candidate command names for a CRUD verb belonging to a list command:
 * `list` → `create`; `asset-families-list` → `asset-families-create`;
 * `asset-index` → `asset-create` / `asset-store`;
 * `list-deployments` → `create-deployment` / `create-deployments`.
 */
export const crudCandidates = (listName: string, verb: string): string[] => {
  const forms = VERB_FORMS[verb as (typeof CRUD_VERBS)[number]] ?? [verb];
  for (const listForm of LIST_FORMS) {
    if (listName === listForm) return forms;
    if (listName.endsWith(`-${listForm}`)) {
      const prefix = listName.slice(0, -listForm.length);
      return forms.map((form) => `${prefix}${form}`);
    }
  }
  if (listName.startsWith("list-")) {
    const resource = listName.slice("list-".length);
    return [...new Set(singulars(resource))].map((word) => `${verb}-${word}`);
  }
  return [];
};

/**
 * The list command a CRUD command folds into, when the service has it:
 * `get-deployment` → `list-deployments`, `categories-get` →
 * `categories-list`, `asset-show` → `asset-index`, bare `create` → `list`.
 * Null when the name isn't a CRUD form or no matching list exists.
 */
export const owningList = (
  name: string,
  listNames: ReadonlySet<string>,
): string | null => {
  for (const verb of CRUD_VERBS) {
    for (const form of VERB_FORMS[verb]) {
      if (name === form) {
        for (const listForm of LIST_FORMS) {
          if (listNames.has(listForm)) return listForm;
        }
        return null;
      }
      if (name.endsWith(`-${form}`)) {
        const prefix = name.slice(0, -form.length);
        for (const listForm of LIST_FORMS) {
          const candidate = `${prefix}${listForm}`;
          if (listNames.has(candidate)) return candidate;
        }
        return null;
      }
    }
    if (name.startsWith(`${verb}-`)) {
      const resource = name.slice(verb.length + 1);
      for (const plural of plurals(resource)) {
        const candidate = `list-${plural}`;
        if (listNames.has(candidate)) return candidate;
      }
      return null;
    }
  }
  return null;
};

/** A query token matches as itself or through the CLI's built-in service /
 * verb abbreviations (lib/alias.ts) — so `p ls` finds `products list`. */
const tokenExpansions = (token: string): string[] => {
  const expansions = [token];
  const service = BUILTIN_COMMAND_ALIASES[token];
  if (service !== undefined) expansions.push(service.toLowerCase());
  const verb = BUILTIN_VERB_ALIASES[token];
  if (verb !== undefined) expansions.push(verb.toLowerCase());
  return expansions;
};

/**
 * Multi-token, alias-aware matching: the query splits on whitespace and every
 * token must match the path in order (case-insensitive substring, each token
 * also counting through its built-in alias). `pro get` therefore matches
 * `products get-product`, and so does `p g`. Entries whose first token
 * matches at the start of the path rank first, like guided mode's picker.
 */
export const filterEntries = (
  entries: PaletteEntry[],
  query: string,
): PaletteEntry[] => {
  const tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return entries;
  const matches: {
    entry: PaletteEntry;
    prefix: boolean;
    /** Path characters the query left unmatched — `p ls` covers all of
     * `products list` (aliases count in full) but little of
     * `products asset-families-list`, so tighter entries rank first. */
    tightness: number;
    index: number;
  }[] = [];
  for (const [index, entry] of entries.entries()) {
    const path = entry.path.toLowerCase();
    let position = 0;
    let matched = true;
    let prefix = false;
    let coverage = 0;
    for (const [tokenIndex, token] of tokens.entries()) {
      // Earliest match across the token's expansions, at or after where the
      // previous token matched (in-order); position ties prefer the longest
      // expansion so the alias `p` counts as all of `products`.
      let at = -1;
      let length = 0;
      for (const candidate of tokenExpansions(token)) {
        const found = path.indexOf(candidate, position);
        if (found >= 0 && (at === -1 || found < at || (found === at && candidate.length > length))) {
          at = found;
          length = candidate.length;
        }
      }
      if (at === -1) {
        matched = false;
        break;
      }
      if (tokenIndex === 0 && at === 0) {
        prefix = true;
      }
      coverage += length;
      position = at + length;
    }
    if (matched) {
      matches.push({ entry, prefix, tightness: path.length - coverage, index });
    }
  }
  matches.sort(
    (a, b) =>
      Number(b.prefix) - Number(a.prefix) ||
      a.tightness - b.tightness ||
      a.index - b.index,
  );
  return matches.map((match) => match.entry);
};
