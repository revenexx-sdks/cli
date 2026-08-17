/**
 * The TUI's `/`-command registry (DX-141): the closed set of words that mean
 * "do a thing" rather than "search for a command", replacing the hardcoded
 * exit/debug/fps chain that used to sit inline in app.tsx's filter handler.
 *
 * `/` does not open a separate palette — it enters the fuzzy command filter
 * with an empty query, so `/` followed by a word *is* the slash command.
 *
 * The visible entries are also the source of their **nav rows**: lib/commands/
 * tui.ts turns them into synthetic CommandNodes (slashNavEntries) so they can be
 * browsed and searched like anything else, rather than only being findable by
 * someone who already knows the word. One registry, both surfaces.
 *
 * Pure and ink-free on purpose: the matching is unit-testable without rendering
 * an app, tui.ts can import it on the one-shot path, and the actions arrive as
 * a context object supplied by App.
 */

import type { CommandLeaf, CommandNode } from "./command-tree.js";

/** Callbacks App hands the registry; one per action a slash command can take. */
export type SlashContext = {
  requestQuit: () => void;
  toggleDebug: () => void;
  openWatchCreate: () => void;
  openWatchList: () => void;
};

export type SlashCommand = {
  name: string;
  aliases?: readonly string[];
  description: string;
  /**
   * Dispatchable by typing the word, but never given a nav row. The three
   * inherited words are hidden to preserve their long-standing behaviour
   * exactly: typing `exi` or `deb` has always shown "no matches", and `debug`
   * is an undocumented diagnostics egg.
   */
  hidden?: boolean;
  /** Which in-app pane a visible entry opens, for its synthetic nav row. */
  tuiAction?: NonNullable<CommandLeaf["tuiAction"]>;
  run: (context: SlashContext) => void;
};

export const SLASH_COMMANDS: readonly SlashCommand[] = [
  {
    name: "watch",
    description: "Watch a resource field until it changes or settles",
    tuiAction: "watch-create",
    run: (context) => context.openWatchCreate(),
  },
  {
    name: "watchlist",
    aliases: ["watching", "watchers"],
    description: "Background watchers and their live status",
    tuiAction: "watch-list",
    run: (context) => context.openWatchList(),
  },
  {
    name: "exit",
    hidden: true,
    description: "Close the app",
    run: (context) => context.requestQuit(),
  },
  {
    name: "debug",
    aliases: ["fps"],
    hidden: true,
    description: "Toggle the diagnostics HUD",
    run: (context) => context.toggleDebug(),
  },
];

const canonicalWord = (word: string): string => word.trim().toLowerCase();

const namesOf = (command: SlashCommand): readonly string[] => [
  command.name,
  ...(command.aliases ?? []),
];

/**
 * Exact-word lookup for the **hidden** words only, which fire the instant the
 * word completes — the behaviour `exit`, `debug` and `fps` have always had, and
 * the reason typing `exi` shows no matches rather than a row.
 *
 * Visible commands deliberately do NOT fire this way. `watch` is a prefix of
 * `watchlist`, so instant-firing on the shorter word would make the longer one
 * impossible to type; they are offered as rows and dispatched on Enter, which
 * is also how you discover them.
 */
export const matchInstantSlash = (word: string): SlashCommand | undefined => {
  const needle = canonicalWord(word);
  if (needle === "") return undefined;
  return SLASH_COMMANDS.find(
    (command) => command.hidden === true && namesOf(command).includes(needle),
  );
};

/**
 * The visible commands as browsable nav rows. They land in the root "commands"
 * section next to `login`/`status` — a synthetic node with no subcommands and a
 * tuiAction, exactly the shape the `themes` entry already uses — so the
 * watchlist is something you can find by looking rather than only by knowing
 * the word. Because they are real nav entries, flattenTree picks them up and
 * they appear in `/` search too, with no second code path.
 */
export const slashNavEntries = (): CommandNode[] =>
  SLASH_COMMANDS.filter((command) => command.hidden !== true).map((command) => ({
    name: command.name,
    description: command.description,
    ...(command.tuiAction === undefined ? {} : { tuiAction: command.tuiAction }),
    subcommands: [],
  }));
