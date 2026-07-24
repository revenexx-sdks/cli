/**
 * DX-118 TUI app shell: full-screen layout with the context header (tenant +
 * PRODUCTION, DX-111 alignment), the command browser (workstream 3), the `/`
 * palette and a status bar with the active key map. Selecting a runnable
 * command opens its auto-generated form and executes it through the injected
 * runner (startRun → runner), rendering the result table / detail in place.
 *
 * ink is ESM-only and initializes its yoga layout engine via top-level await,
 * so this module must only ever be loaded through the lazy dynamic import in
 * lib/commands/tui.ts — one-shot commands never pay for it.
 */
import { EventEmitter } from "node:events";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { render, Box, Text, useApp, useInput } from "ink";
import { useTerminalSize } from "./terminal.js";
import { SDK_TITLE, EXECUTABLE_NAME } from "../constants.js";
import type { TuiContext } from "./context.js";
import {
  flattenTree,
  filterEntries,
  crudCandidates,
  listResource,
  owningList,
  type CommandLeaf,
  type CommandNode,
  type PaletteEntry,
} from "./command-tree.js";
import {
  Form,
  buildArgv,
  buildCommandLine,
  type FormValues,
} from "./form.js";
import {
  Results,
  parsePageInfo,
  type PageInfo,
  type RunState,
} from "./results.js";
import { Panel, borderRow, Button } from "./panel.js";
import { ConfirmModal } from "./confirm.js";
import {
  theme,
  applyTheme,
  isTheme,
  THEME_NAMES,
  themeTerminalColors,
  THEME_TERMINAL_RESET,
  gradientColors,
  brighten,
  useShimmer,
  useSpinner,
  useDebugStats,
  type DebugStats,
  progressBar,
} from "./theme.js";
import { globalConfig } from "../config.js";
import { resourceChoice, type PromptSpec } from "../interactive.js";
import { copyToClipboard } from "./clipboard.js";
import { matchEgg, EggPanel } from "./eggs.js";
import type { TuiRunner } from "./executor.js";

/** Konami code — completing it toggles the wordmark shimmer (see `useInput`). */
const KONAMI = [
  "up",
  "up",
  "down",
  "down",
  "left",
  "right",
  "left",
  "right",
  "b",
  "a",
] as const;

/** Rows around the navbar's content: header box (3), status bar (1) and the
 * pane's top+bottom border (2). The navbar paints exactly (rows - this) content
 * lines, so its purple fill reaches the bottom border with no gap. */
const NAV_CHROME_ROWS = 6;

/** Name of the root nav section holding TUI preferences — the themes action
 * and the relocated alias command, tagged with this via `group` in
 * lib/commands/tui.ts. Deliberately not "settings" — that's a real API
 * service. */
const CONFIG_NAME = "config";

/** The brand wordmark, drawn as a warm left-to-right gradient (one <Text> per
 * glyph so chalk downgrades/strips colour per terminal without disturbing the
 * text). */
const BrandMark = ({ shimmer = false }: { shimmer?: boolean }) => {
  const chars = [...SDK_TITLE.toLowerCase()];
  const colors = gradientColors(chars.length);
  // A comet head sweeps across the glyphs then pauses (the +8 tail is dead
  // time), brightening the 3 cells behind it. phase is 0 when the egg is off,
  // so this collapses to the plain gradient.
  const phase = useShimmer(shimmer);
  const head = chars.length > 0 ? phase % (chars.length + 8) : 0;
  return (
    <Text bold>
      {chars.map((char, index) => {
        const trail = head - index;
        const amount = shimmer && trail >= 0 && trail <= 2 ? 0.7 - trail * 0.25 : 0;
        const color = amount > 0 ? brighten(colors[index], amount) : colors[index];
        return (
          <Text key={index} color={color}>
            {char}
          </Text>
        );
      })}
    </Text>
  );
};

/** Header, drawn with the shared Panel so its frame matches every other pane
 * (gradient top/bottom edges, solid accent sides — proven-aligned, unlike a
 * hand-rolled frame). The gradient wordmark sits left, context right.
 * Production is flagged by the yellow ▲ PRODUCTION chip only; the chrome stays
 * branded (no alarming red border) since day-to-day work is always against
 * prod. Body/secondary text stays terminal-native; only accents commit to the
 * palette. */
const Header = ({
  context,
  narrow,
  shimmer,
  width,
}: {
  context: TuiContext;
  narrow: boolean;
  shimmer: boolean;
  /** Full terminal width — the panel frame spans it exactly. */
  width: number;
}) => {
  const prod = context.production;
  const accent = theme.accent;
  return (
    <Panel width={width}>
      <Box justifyContent="space-between" gap={1}>
        <Box gap={1} flexShrink={0}>
          <BrandMark shimmer={shimmer} />
          <Text dimColor>v{context.version}</Text>
        </Box>
        <Box gap={1}>
          {prod && (
            <Text backgroundColor={theme.warn} color="#0b0522" bold>
              {" ▲ PRODUCTION "}
            </Text>
          )}
          {!narrow && (
            <>
              <Text dimColor wrap="truncate">
                {context.user ?? "not signed in"}
              </Text>
              <Text dimColor>·</Text>
            </>
          )}
          <Text bold color={accent}>
            {context.tenant || "(no tenant)"}
          </Text>
          <Text dimColor>→</Text>
          <Text wrap="truncate" color={accent}>
            {context.host}
          </Text>
        </Box>
      </Box>
    </Panel>
  );
};

/** "revenexx" figlet banners for the welcome splash. The large (Colossal, 69
 * wide) one is used when the pane can fit it; otherwise the compact (Standard,
 * 43 wide) one — so wide terminals get a big logo and narrow ones don't mangle
 * it. Coloured top-to-bottom with the brand gradient. */
const LOGO_BIG = [
  "888d888 .d88b.  888  888  .d88b.  88888b.   .d88b.  888  888 888  888",
  "888P\"  d8P  Y8b 888  888 d8P  Y8b 888 \"88b d8P  Y8b `Y8bd8P' `Y8bd8P'",
  "888    88888888 Y88  88P 88888888 888  888 88888888   X88K     X88K",
  "888    Y8b.      Y8bd8P  Y8b.     888  888 Y8b.     .d8\"\"8b. .d8\"\"8b.",
  "888     \"Y8888    Y88P    \"Y8888  888  888  \"Y8888  888  888 888  888",
];

const LOGO_STD = [
  "  _ __ _____   _____ _ __   _____  ____  __",
  " | '__/ _ \\ \\ / / _ \\ '_ \\ / _ \\ \\/ /\\ \\/ /",
  " | | |  __/\\ V /  __/ | | |  __/>  <  >  <",
  " |_|  \\___| \\_/ \\___|_| |_|\\___/_/\\_\\/_/\\_\\",
];

const LogoBanner = ({ maxWidth }: { maxWidth: number }) => {
  const logo = maxWidth >= 69 ? LOGO_BIG : LOGO_STD;
  // Pad every row to the widest so alignItems=center offsets them identically,
  // and colour left-to-right (per column) to match the header wordmark's
  // horizontal gradient rather than a per-row one.
  const cols = Math.max(...logo.map((line) => line.length));
  const colors = gradientColors(cols);
  return (
    <Box flexDirection="column" alignItems="center">
      {logo.map((line, index) => (
        <Text key={index} bold wrap="truncate">
          {[...line.padEnd(cols)].map((ch, col) => (
            <Text key={col} color={colors[col]}>
              {ch}
            </Text>
          ))}
        </Text>
      ))}
    </Box>
  );
};

/** Startup splash — the right-pane content shown until the first keystroke (see
 * App's `welcome` prop). The header and left navbar stay mounted around it, so
 * dismissing it just swaps this pane for the detail sheet: a seamless cut. */
const WelcomeScreen = ({
  context,
  width,
}: {
  context: TuiContext;
  width: number;
}) => (
  <Panel title="welcome" width={width} grow>
    <Box
      flexGrow={1}
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
    >
      <LogoBanner maxWidth={width - 4} />
      <Box marginTop={1}>
        <Text dimColor>the interactive console — browse, run, inspect</Text>
      </Box>
      {context.production && (
        <Box marginTop={1}>
          <Text backgroundColor={theme.warn} color="#0b0522" bold>
            {" ▲ PRODUCTION "}
          </Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text bold color={theme.accent}>
          {context.tenant || "(no tenant)"}
        </Text>
        <Text dimColor> → {context.host}</Text>
      </Box>
      <Box marginTop={1}>
        <Text>
          <Text color={theme.accent}>type</Text>
          <Text dimColor> search </Text>
          <Text dimColor>·</Text>
          <Text color={theme.accent}> /</Text>
          <Text dimColor> palette </Text>
          <Text dimColor>·</Text>
          <Text color={theme.accent}> ↑↓</Text>
          <Text dimColor> browse </Text>
          <Text dimColor>·</Text>
          <Text color={theme.accent}> ⏎</Text>
          <Text dimColor> open </Text>
          <Text dimColor>·</Text>
          <Text color={theme.accent}> q</Text>
          <Text dimColor> quit</Text>
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>start typing to search — or any key to begin</Text>
      </Box>
    </Box>
  </Panel>
);

/** The `?` help overlay — the full context keymap, in the right pane. Any key
 * closes it (handled in App's useInput). */
const HelpPanel = ({ width }: { width: number }) => {
  const row = (keys: string, desc: string): ReactNode => (
    <Box gap={1} key={keys + desc}>
      <Box width={12} flexShrink={0}>
        <Text color={theme.accent}>{keys}</Text>
      </Box>
      <Text wrap="truncate">{desc}</Text>
    </Box>
  );
  const section = (title: string): ReactNode => (
    <Box marginTop={1} key={title}>
      <Text bold color={theme.warn}>
        {title}
      </Text>
    </Box>
  );
  return (
    <Panel title="help" width={width} grow>
      <Text dimColor>Keyboard reference — press any key to close.</Text>
      {section("Browse")}
      {row("↑ ↓", "move")}
      {row("PgUp PgDn", "jump a page")}
      {row("⏎ →", "open group / run command")}
      {row("esc ←", "back (esc quits at the top level)")}
      {row("type  /", "search commands")}
      {row("y", "copy the command's one-shot line")}
      {row("^t", "change theme")}
      {row("^w", "welcome / home")}
      {row("q", "back / quit")}
      {section("Form")}
      {row("↹ ⇧↹", "next / previous field (then Submit / Cancel)")}
      {row("← → space", "cycle small enum / toggle boolean")}
      {row("⏎", "choose (long enum / resource) · else next field")}
      {row("^r", "run from any field")}
      {row("esc", "cancel")}
      {section("JSON body")}
      {row("⏎", "add a field / append an item")}
      {row("→", "edit nested object / array")}
      {row("↹", "switch key / value")}
      {row("^d", "delete field")}
      {row("^s", "save back to the form")}
      {row("esc", "up a level / cancel")}
      {section("Results")}
      {row("↑ ↓", "rows")}
      {row("PgUp PgDn", "jump a page")}
      {row("⏎", "row detail")}
      {row("/", "filter rows (esc clears)")}
      {row("← →", "scroll columns")}
      {row("n p", "page")}
      {row("o", "cycle output format")}
      {row("y", "copy (Y: whole output)")}
      {row("c", "create a new record")}
      {row("u", "update this record")}
      {row("d", "delete this record (confirm)")}
      {row("e", "edit parameters")}
      {row("q esc", "back")}
    </Panel>
  );
};

/** The `^t` theme picker: a searchable, live-preview list. Type to filter,
 * ↑↓ moves and recolours the whole UI immediately (via onPreview, which
 * re-applies the palette and re-renders), Enter keeps the highlighted theme,
 * Esc reverts to the one in effect when the picker opened. */
const ThemePicker = ({
  width,
  names,
  committed,
  onPreview,
  onKeep,
  onCancel,
}: {
  width: number;
  names: string[];
  /** The theme active when the picker opened — marked, and where it starts. */
  committed: string;
  onPreview: (name: string) => void;
  onKeep: (name: string) => void;
  onCancel: () => void;
}) => {
  const { rows: terminalRows } = useTerminalSize();
  const [query, setQueryState] = useState("");
  const [cursor, setCursorState] = useState(() =>
    Math.max(names.indexOf(committed), 0),
  );
  // Refs so fast typing can't act on a stale query/cursor between renders.
  const queryRef = useRef("");
  const cursorRef = useRef(cursor);
  const setQuery = (value: string): void => {
    queryRef.current = value;
    setQueryState(value);
  };
  const setCursor = (value: number): void => {
    cursorRef.current = value;
    setCursorState(value);
  };

  const filterFor = (q: string): string[] => {
    const token = q.trim().toLowerCase();
    return token === ""
      ? names
      : names.filter((name) => name.toLowerCase().includes(token));
  };

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    const list = filterFor(queryRef.current);
    const at = Math.min(cursorRef.current, Math.max(list.length - 1, 0));
    if (key.return) {
      if (list[at] !== undefined) onKeep(list[at]);
      return;
    }
    if (key.upArrow) {
      const next = Math.max(at - 1, 0);
      setCursor(next);
      if (list[next] !== undefined) onPreview(list[next]);
      return;
    }
    if (key.downArrow) {
      const next = Math.min(at + 1, list.length - 1);
      setCursor(next);
      if (list[next] !== undefined) onPreview(list[next]);
      return;
    }
    if (key.pageUp || key.pageDown) {
      const page = Math.max(terminalRows - 10, 4);
      const next = key.pageUp
        ? Math.max(at - page, 0)
        : Math.min(at + page, list.length - 1);
      setCursor(next);
      if (list[next] !== undefined) onPreview(list[next]);
      return;
    }
    const nextQuery =
      key.backspace || key.delete
        ? queryRef.current.slice(0, -1)
        : input !== "" && !key.ctrl && !key.meta && !key.tab
          ? queryRef.current + input
          : null;
    if (nextQuery !== null) {
      setQuery(nextQuery);
      setCursor(0);
      const list2 = filterFor(nextQuery);
      if (list2[0] !== undefined) onPreview(list2[0]);
    }
  });

  const filtered = filterFor(query);
  const selected = Math.min(cursor, Math.max(filtered.length - 1, 0));
  const capacity = Math.max(terminalRows - 10, 4);
  const start = Math.min(
    Math.max(selected - capacity + 1, 0),
    Math.max(filtered.length - capacity, 0),
  );
  const visible = filtered.slice(start, start + capacity);
  return (
    <Panel title="theme" titleColor={theme.accent} width={width} grow>
      <Text dimColor>type to search · ↑↓ preview · ⏎ keep · esc revert</Text>
      <Box>
        <Text color={theme.accent}>{"› "}</Text>
        <Text>{query}</Text>
        <Text inverse> </Text>
      </Box>
      <Box flexDirection="column" paddingTop={1}>
        {start > 0 && <Text dimColor>↑ {start} more</Text>}
        {filtered.length === 0 && (
          <Text dimColor>no themes match “{query}”</Text>
        )}
        {visible.map((name, index) => {
          const at = start + index;
          const isSelected = at === selected;
          return (
            <Box key={name}>
              <Box width={2} flexShrink={0}>
                {isSelected ? (
                  <Text color={theme.accent} bold>
                    {"» "}
                  </Text>
                ) : (
                  <Text> </Text>
                )}
              </Box>
              {isSelected ? (
                <Text backgroundColor={theme.selectionBg} color={theme.selectionFg} bold>
                  {` ${name} `}
                </Text>
              ) : (
                <Text>{name}</Text>
              )}
              {name === committed && <Text dimColor> · current</Text>}
            </Box>
          );
        })}
        {start + capacity < filtered.length && (
          <Text dimColor>↓ {filtered.length - start - capacity} more</Text>
        )}
      </Box>
    </Panel>
  );
};

/** A record value as a form field string: booleans as true/false, objects as
 * JSON, everything else stringified. Used to pre-fill an update form. */
const toFormValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/** The value a fetched record supplies for one form spec when pre-filling an
 * update/delete entered from a list row. A resource-ID field (its path
 * parameter) is resolved through the SAME fallback the picker uses
 * (`resourceChoice`: the param name, then id/$id/code/key) — a list row keys
 * its identifier as `id`/`$id`, never as the command's camelCase option key,
 * so a plain `record[spec.key]` lookup would miss and re-open the search.
 * Everything else matches the record by the option key or the spec name.
 * Returns undefined when the record offers nothing for the field. */
const recordValueForSpec = (
  record: Record<string, unknown>,
  spec: PromptSpec,
): string | undefined => {
  if (spec.resource !== undefined) {
    return resourceChoice(record, spec.name)?.value;
  }
  if (Object.prototype.hasOwnProperty.call(record, spec.key)) {
    return toFormValue(record[spec.key]);
  }
  if (Object.prototype.hasOwnProperty.call(record, spec.name)) {
    return toFormValue(record[spec.name]);
  }
  return undefined;
};

const BROWSER_WIDTH = 30;

const BrowserPane = ({
  title,
  items,
  cursor,
  sections = [],
  height,
  focused = true,
}: {
  title: string;
  items: CommandLeaf[];
  cursor: number;
  /** Non-selectable section headers spliced in before the item at each
   * `at` index (root: folders/commands, in a service: collections/actions). */
  sections?: { label: string; at: number }[];
  /** Exact number of content rows to paint (so the fill has no gap). */
  height: number;
  /** Whether the browser currently owns the keyboard (dims its title when a
   * command screen is active — the navbar stays visible either way). */
  focused?: boolean;
}) => {
  // flush panel → content spans the full width between the side borders.
  const inner = BROWSER_WIDTH - 2;
  const total = Math.max(height, 1);
  // One row each is reserved (top/bottom) for scroll indicators or blank fill.
  const capacity = Math.max(total - 2, 1);

  // Display rows = the items with non-selectable section headers spliced in.
  // The cursor still indexes `items`.
  type DisplayRow =
    | { kind: "header"; label: string }
    | { kind: "item"; item: CommandLeaf; index: number };
  const display: DisplayRow[] = [];
  items.forEach((item, index) => {
    for (const section of sections) {
      if (section.at === index) {
        display.push({ kind: "header", label: section.label });
      }
    }
    display.push({ kind: "item", item, index });
  });

  // Window over display rows, keeping the selected item on screen.
  const selectedRow = Math.max(
    display.findIndex((row) => row.kind === "item" && row.index === cursor),
    0,
  );
  const start = Math.min(
    Math.max(selectedRow - capacity + 1, 0),
    Math.max(display.length - capacity, 0),
  );
  const visible = display.slice(start, start + capacity);
  const countItems = (slice: DisplayRow[]): number =>
    slice.filter((row) => row.kind === "item").length;
  const hiddenAbove = countItems(display.slice(0, start));
  const hiddenBelow = countItems(display.slice(start + capacity));

  // Terminal-native: rows are plain text over the terminal's own background.
  // Only section headers, borders and the selection bar carry colour.
  const fillLine = (key: string, text: string, dim = true): ReactNode => (
    <Text key={key} dimColor={dim} wrap="truncate">
      {text.padEnd(inner).slice(0, inner)}
    </Text>
  );

  const rows: ReactNode[] = [];
  rows.push(fillLine("top", hiddenAbove > 0 ? `  ↑ ${hiddenAbove} more` : ""));
  visible.forEach((row, offset) => {
    if (row.kind === "header") {
      // Same gradient rule as the pane borders: dashes fade through the theme
      // gradient by column, the label stays the accent.
      const fill = "─".repeat(Math.max(inner - row.label.length - 4, 0));
      rows.push(
        <Text key={`h${start + offset}`} wrap="truncate">
          {borderRow(
            [
              { text: "── ", gradient: true },
              { text: row.label, color: theme.accent, bold: true },
              { text: " " },
              { text: fill, gradient: true },
            ],
            inner,
          )}
        </Text>,
      );
      return;
    }
    const { item, index } = row;
    const selected = index === cursor;
    const name = `  ${item.label ?? item.name}`.padEnd(inner).slice(0, inner);
    rows.push(
      selected ? (
        <Text
          key={`i${index}`}
          bold
          backgroundColor={theme.selectionBg}
          color={theme.selectionFg}
          wrap="truncate"
        >
          {name}
        </Text>
      ) : (
        <Text key={`i${index}`} wrap="truncate">
          {name}
        </Text>
      ),
    );
  });
  rows.push(fillLine("bot", hiddenBelow > 0 ? `  ↓ ${hiddenBelow} more` : ""));
  while (rows.length < total) {
    rows.push(fillLine(`blank${rows.length}`, ""));
  }

  return (
    <Panel
      title={title}
      titleColor={theme.accent}
      focused={focused}
      width={BROWSER_WIDTH}
      flush
    >
      {rows}
    </Panel>
  );
};

/** Parameters shown in the sidebar before running. */
const MAX_SIDEBAR_PARAMS = 8;

const DetailPane = ({
  path,
  item,
  isGroup,
  width,
}: {
  path: string[];
  item: CommandLeaf | undefined;
  isGroup: boolean;
  width: number;
}) => {
  const specs = item?.specs ?? [];
  const hasRequired = specs.some((spec) => spec.required);
  const shown = specs.slice(0, MAX_SIDEBAR_PARAMS);
  const title =
    item === undefined ? undefined : [...path, item.name].join(" · ");
  return (
    <Panel title={title} width={width}>
      {item === undefined ? (
        <Text dimColor>Nothing selected.</Text>
      ) : (
        <>
          {/* A blank first line pads the description off the top border. */}
          <Box paddingTop={1}>
            <Text wrap="truncate">{item.description || "No description."}</Text>
          </Box>
          {!isGroup && shown.length > 0 && (
            <Box paddingTop={1} flexDirection="column">
              <Text dimColor>parameters</Text>
              {shown.map((spec) => (
                <Box key={spec.key} gap={1}>
                  <Text wrap="truncate">
                    {"  "}
                    {spec.name}
                    {spec.required && <Text color="red"> *</Text>}
                  </Text>
                  <Text dimColor wrap="truncate">
                    {spec.enum !== undefined && spec.enum.length > 0
                      ? spec.enum.slice(0, 3).join(" | ")
                      : spec.type}
                  </Text>
                </Box>
              ))}
              {specs.length > shown.length && (
                <Text dimColor>  +{specs.length - shown.length} more</Text>
              )}
            </Box>
          )}
          <Box paddingTop={1} flexDirection="column">
            {isGroup ? (
              <Text dimColor>enter to browse its commands</Text>
            ) : item.tuiAction !== undefined ? (
              <Text dimColor>enter to open the theme picker</Text>
            ) : (
              <>
                <Text wrap="truncate">
                  <Text dimColor>one-shot: </Text>
                  {EXECUTABLE_NAME}{" "}
                  {(item.runPath ?? [...path, item.name]).join(" ")}
                </Text>
                <Text dimColor>
                  {hasRequired
                    ? "enter to fill in its parameters"
                    : "enter to run it"}
                  <Text dimColor> · y copies it</Text>
                </Text>
              </>
            )}
          </Box>
        </>
      )}
    </Panel>
  );
};

/** The run's pagination facts, docked under the parameter sidebar. */
const PageInfoPane = ({
  info,
  width,
}: {
  info: PageInfo | null;
  width: number;
}) => {
  if (info === null) return null;
  const returned = info.returned ?? undefined;
  const total = info.total ?? undefined;
  const offset = info.offset ?? 0;
  // How far through the whole collection this page reaches — a filled bar of
  // the sidebar's inner width (panel border + padding take 4 cells).
  const showBar =
    total !== undefined && total > 0 && (returned !== undefined || info.limit !== undefined);
  const barWidth = Math.max(width - 4, 4);
  const { filled, empty } = progressBar(
    (offset + (returned ?? info.limit ?? 0)) / (total ?? 1),
    barWidth,
  );
  return (
    <Panel title="page" width={width}>
      {(returned !== undefined || total !== undefined) && (
        <Text wrap="truncate">
          {returned !== undefined ? `${returned.toLocaleString()} returned` : ""}
          {returned !== undefined && total !== undefined ? " of " : ""}
          {total !== undefined ? (
            <Text bold>{total.toLocaleString()}</Text>
          ) : (
            ""
          )}
        </Text>
      )}
      {showBar && (
        <Text>
          <Text color={theme.accent}>{"█".repeat(filled)}</Text>
          <Text dimColor>{"░".repeat(empty)}</Text>
        </Text>
      )}
      <Text dimColor wrap="truncate">
        {info.offset !== undefined ? `offset ${info.offset}` : ""}
        {info.offset !== undefined && info.limit !== undefined ? " · " : ""}
        {info.limit !== undefined ? `limit ${info.limit}` : ""}
        {info.hasMore === true ? " · n next" : ""}
      </Text>
    </Panel>
  );
};

/** One executed command, kept for the `debug` history pane. Only fields the
 * executor actually returns — there is no HTTP status/URL to show (the raw
 * gateway call is buried in the generated client and never surfaces them to
 * the TUI), so this is a run log, not a network trace. */
type RunRecord = {
  method?: string;
  path: string[];
  ok: boolean;
  exitCode: number;
  durationMs: number;
  error?: string;
};

/** Cap on retained history rows — a rolling window, newest last. */
const MAX_HISTORY = 20;

/** Hidden `debug` mode's right-pane readout: live process/render stats plus a
 * scrollback of recent runs (method · command · ok/exit · duration). Replaces
 * the detail sheet while debug is on; toggled by typing `debug` (or `fps`). */
const DebugPane = ({
  stats,
  cols,
  rows,
  history,
  width,
}: {
  stats: DebugStats;
  cols: number;
  rows: number;
  history: RunRecord[];
  width: number;
}) => {
  const recent = history.slice(-12).reverse();
  const stat = (label: string, value: string): ReactNode => (
    <Box gap={1} key={label}>
      <Box width={10} flexShrink={0}>
        <Text dimColor>{label}</Text>
      </Box>
      <Text color={theme.accent}>{value}</Text>
    </Box>
  );
  return (
    <Panel title="debug" titleColor={theme.warn} width={width} grow>
      <Box paddingTop={1} flexDirection="column">
        {stat("renders/s", `${stats.fps} (no frame loop — repaints on change)`)}
        {stat("frame", stats.frameMs > 0 ? `~${stats.frameMs} ms` : "idle")}
        {stat("memory", `${stats.rssMb} MB rss`)}
        {stat("terminal", `${cols}×${rows}`)}
        {stat("theme", theme.name)}
      </Box>
      <Box paddingTop={1} flexDirection="column">
        <Text dimColor>recent runs</Text>
        {recent.length === 0 ? (
          <Text dimColor>  none yet — run a command</Text>
        ) : (
          recent.map((record, index) => (
            <Box key={index} gap={1}>
              <Box width={2} flexShrink={0}>
                <Text color={record.ok ? theme.success : theme.danger}>
                  {record.ok ? "✓" : "✗"}
                </Text>
              </Box>
              <Text wrap="truncate">
                {record.method !== undefined && (
                  <Text dimColor>{record.method.toUpperCase()} </Text>
                )}
                {record.path.join(" ")}
                {!record.ok && <Text dimColor> · exit {record.exitCode}</Text>}
                <Text dimColor> · {record.durationMs} ms</Text>
              </Text>
            </Box>
          ))
        )}
      </Box>
      <Box paddingTop={1}>
        <Text dimColor>type “debug” again to hide</Text>
      </Box>
    </Panel>
  );
};

/** [key, action] pairs rendered mockup-style: cyan key, dim label. */
type KeyHint = [string, string];

const StatusBar = ({
  hints,
  right,
  busy = false,
  debug,
}: {
  hints: KeyHint[];
  right?: string;
  /** Animate a spinner in the bar while a request is in flight. */
  busy?: boolean;
  /** Hidden `debug` mode: when set, a live HUD (renders/sec, mean paint ms,
   * memory, terminal size) replaces the right label. */
  debug?: DebugStats & { cols: number; rows: number };
}) => {
  const spinner = useSpinner(busy);
  return (
    <Box paddingX={1} justifyContent="space-between" gap={2}>
      <Box gap={2} flexShrink={1} overflow="hidden">
        {busy && <Text color={theme.accent}>{spinner}</Text>}
        {hints.map(([key, label]) => (
          <Text key={`${key}${label}`} wrap="truncate">
            <Text color={theme.accent}>{key}</Text>
            <Text dimColor> {label}</Text>
          </Text>
        ))}
      </Box>
      <Box flexShrink={0}>
        {debug !== undefined ? (
          <Text wrap="truncate">
            <Text color={theme.accent}>{debug.fps}</Text>
            <Text dimColor>fps · </Text>
            <Text color={theme.accent}>{debug.frameMs}</Text>
            <Text dimColor>ms · </Text>
            <Text color={theme.accent}>{debug.rssMb}</Text>
            <Text dimColor>MB · </Text>
            <Text color={theme.accent}>
              {debug.cols}×{debug.rows}
            </Text>
          </Text>
        ) : (
          <Text dimColor>{right ?? `${EXECUTABLE_NAME} tui`}</Text>
        )}
      </Box>
    </Box>
  );
};

/** Quit confirmation. Every exit path — `q` or `esc` at the top level, or
 * typing "exit" — routes through this so a stray keypress can't drop the
 * session. Explicit `y` quits; any other key stays — landing on the welcome
 * splash (the cautious default, matching the destructive-command modal). */
const QuitConfirm = ({
  width,
  onConfirm,
  onCancel,
}: {
  width: number;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  useInput((input) => {
    if (input === "y" || input === "Y") {
      onConfirm();
      return;
    }
    onCancel();
  });
  return (
    <Panel title="quit" titleColor={theme.warn} width={width} grow>
      <Box
        flexGrow={1}
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
      >
        <Text bold>Really quit {SDK_TITLE}?</Text>
        <Box paddingTop={1}>
          <Text dimColor>You’ll drop back to the shell.</Text>
        </Box>
        <Box paddingTop={1} gap={2}>
          <Button label="y quit" variant="primary" />
          <Button label="n stay" variant="default" />
        </Box>
        <Box paddingTop={1}>
          <Text dimColor>press y to quit · any other key returns to welcome</Text>
        </Box>
      </Box>
    </Panel>
  );
};

export const App = ({
  context,
  runner,
  loadResourceRecords,
  welcome = false,
  onThemePersist = (name: string) => {
    try {
      globalConfig.set("theme", name);
    } catch {
      // Best-effort: a read-only prefs.json shouldn't crash the session.
    }
  },
}: {
  context: TuiContext;
  runner?: TuiRunner;
  /** Injectable for tests; threaded through to the parameter form. */
  loadResourceRecords?: Parameters<typeof Form>[0]["loadResourceRecords"];
  /** Show the startup splash until the first keystroke (off in tests). */
  welcome?: boolean;
  /** Persist the kept theme; injectable so tests don't touch prefs.json. */
  onThemePersist?: (name: string) => void;
}) => {
  const { exit } = useApp();
  /** False while the welcome splash is up; the first key dismisses it. */
  const [welcomed, setWelcomed] = useState(!welcome);
  /** The `?` help overlay (browse-level; the next keystroke closes it). */
  const [showHelp, setShowHelp] = useState(false);
  /** `^t` theme picker: open flag plus the theme that was active when it opened
   * (restored on Esc). `themeName` mirrors the applied palette; changing it
   * re-renders the whole tree so the mutated palette takes effect everywhere. */
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [themeName, setThemeName] = useState(theme.name);
  const committedTheme = useRef(theme.name);
  const { columns, rows } = useTerminalSize();
  /** Live filter over all commands (null = plain browsing). The list stays
   * on screen while filtering — no overlay. */
  const [filter, setFilter] = useState<string | null>(null);
  /** Source of truth for input handlers: key events can arrive faster than
   * renders, and reading the `filter` state there would act on stale
   * closures — duplicating or losing characters. */
  const filterRef = useRef<string | null>(null);
  /** Browse cursor to restore when the filter is cleared. */
  const browseCursor = useRef(0);
  /** Drill path into the command tree: [] at the root, ["apps"] inside a
   * service, ["alias"] inside the relocated alias command (its actions are the
   * one place the browser goes a second level deep). */
  const [navPath, setNavPath] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  /** Cursor to restore at each shallower level when backing out (one entry per
   * drill-in, popped on the way back). */
  const cursorStack = useRef<number[]>([]);
  /** Leaf whose form is open (with its invocation path), or null. */
  const [form, setForm] = useState<{ path: string[]; leaf: CommandLeaf } | null>(
    null,
  );
  const [formValues, setFormValues] = useState<FormValues>({});
  const [run, setRun] = useState<RunState | null>(null);
  /** Latest pagination facts; kept mounted while the next page loads so the
   * sidebar doesn't reflow (jump) between pages. */
  const [pageFacts, setPageFacts] = useState<PageInfo | null>(null);
  /** Which command-screen pane owns the keyboard. */
  const [focusPane, setFocusPane] = useState<"params" | "results">("params");
  /** The resource picker borrows the whole screen width while open. */
  const [sidebarPickerOpen, setSidebarPickerOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  /** Monotonic run id: a stale response never overwrites a newer view. */
  const runSeq = useRef(0);
  /** Origin list to jump back to (and re-run) after a create/update/delete
   * entered from it succeeds. */
  const returnTo = useRef<{
    target: { path: string[]; leaf: CommandLeaf };
    values: FormValues;
  } | null>(null);
  /** Konami-code easter egg: shimmer the wordmark once the sequence lands. */
  const [shimmer, setShimmer] = useState(false);
  const konami = useRef<string[]>([]);
  /** Hidden `debug` mode: typing "debug" (or "fps") toggles a live footer HUD
   * and a run-history pane (type it again to hide). Undocumented — not in the
   * help panel. */
  const [debug, setDebug] = useState(false);
  const debugStats = useDebugStats(debug);
  /** Rolling log of executed commands for the debug pane (newest last). */
  const [history, setHistory] = useState<RunRecord[]>([]);
  /** Quit confirmation gate: every exit path opens it instead of leaving
   * outright, so a stray key can't drop the session. */
  const [quitting, setQuitting] = useState(false);
  const requestQuit = (): void => setQuitting(true);
  /** Transient footer note (e.g. "✓ copied command"), auto-cleared. */
  const [copyNote, setCopyNote] = useState<string | null>(null);
  useEffect(() => {
    if (copyNote === null) return undefined;
    const timer = setTimeout(() => setCopyNote(null), 1600);
    return () => clearTimeout(timer);
  }, [copyNote]);
  /** Last values a command was run with, keyed by its invocation path — so
   * reopening a command restores what you last typed (ids, filters, paging)
   * instead of a blank form. Session-scoped; never persisted. */
  const lastValues = useRef<Map<string, FormValues>>(new Map());

  /** The node the browser is currently inside, walking the drill path
   * (`undefined` at the root). */
  const nodeAt = (path: string[]): CommandLeaf | undefined => {
    let level: CommandLeaf[] = context.commands;
    let node: CommandLeaf | undefined;
    for (const name of path) {
      node = level.find((candidate) => candidate.name === name);
      if (node === undefined) return undefined;
      level = node.subcommands ?? [];
    }
    return node;
  };
  const group = navPath.length === 0 ? undefined : nodeAt(navPath);
  /** A node's browsable children: the get/update/delete reachable from a list
   * are hidden (kept in the tree only so the list's u/d can resolve them). */
  const browsableSubcommands = (node: CommandLeaf): CommandLeaf[] =>
    (node.subcommands ?? []).filter((subcommand) => subcommand.hidden !== true);
  /** Filter mode is scoped: inside a service it searches only that service's
   * commands (by their short names); at the root it searches every runnable
   * invocation as full-path entries. */
  const searchSpace: PaletteEntry[] =
    group !== undefined
      ? browsableSubcommands(group).map((subcommand) => ({
          path: subcommand.name,
          description: subcommand.description,
          parts: [group.name, subcommand.name],
          leaf: subcommand,
        }))
      : flattenTree(context.commands);
  const filteredEntries =
    filter === null ? [] : filterEntries(searchSpace, filter);
  // The root nav is grouped: service folders first, then standalone commands,
  // then the config section (themes + alias) — each under its own header.
  const rootFolders = context.commands.filter(
    (node) => node.group !== CONFIG_NAME && node.subcommands.length > 0,
  );
  const rootCommands = context.commands.filter(
    (node) => node.group !== CONFIG_NAME && node.subcommands.length === 0,
  );
  const rootConfig = context.commands.filter(
    (node) => node.group === CONFIG_NAME,
  );
  const rootItems = [...rootFolders, ...rootCommands, ...rootConfig];
  const items: CommandLeaf[] =
    filter !== null
      ? filteredEntries.map((entry) => ({
          ...entry.leaf,
          // The real invocation (so the detail pane's one-shot line is
          // accurate even for the group row merged with its list)…
          name: entry.parts.join(" "),
          // …while the row shows the resource-labelled path ("apps",
          // "apps deployments"); in-service search keeps the nav's labels.
          label:
            group !== undefined
              ? entry.leaf.label
              : (entry.display ?? entry.path),
          description: entry.description,
        }))
      : group
        ? browsableSubcommands(group)
        : rootItems;
  /** Section headers for the nav: folders/commands at the root (where the
   * two genuinely mix), collections/actions inside a service (items arrive
   * rank-ordered from the capture; headers only when both parts exist). */
  const navSections: { label: string; at: number }[] = (() => {
    if (filter !== null) return [];
    if (group === undefined) {
      const sections: { label: string; at: number }[] = [];
      let at = 0;
      if (rootFolders.length > 0) {
        sections.push({ label: "folders", at });
        at += rootFolders.length;
      }
      if (rootCommands.length > 0) {
        sections.push({ label: "commands", at });
        at += rootCommands.length;
      }
      if (rootConfig.length > 0) {
        sections.push({ label: "config", at });
        at += rootConfig.length;
      }
      // A lone section reads as a redundant header — only label when the root
      // genuinely mixes more than one kind.
      return sections.length > 1 ? sections : [];
    }
    const boundary = items.findIndex(
      (item) => listResource(item.name) === undefined,
    );
    const partitioned =
      boundary > 0 &&
      items
        .slice(boundary)
        .every((item) => listResource(item.name) === undefined);
    return partitioned && boundary < items.length
      ? [
          { label: "collections", at: 0 },
          { label: "actions", at: boundary },
        ]
      : [];
  })();
  const selected = items[Math.min(cursor, Math.max(items.length - 1, 0))];
  /** A magic word typed into the filter, if any — shown in place of the detail
   * pane. Purely cosmetic; it never appears among the runnable entries. */
  const egg = filter === null ? undefined : matchEgg(filter);
  const selectedEntry =
    filter === null
      ? undefined
      : filteredEntries[Math.min(cursor, Math.max(filteredEntries.length - 1, 0))];
  const selectedIsGroup =
    filter !== null
      ? selectedEntry !== undefined &&
        selectedEntry.parts.length === 1 &&
        (context.commands.find(
          (node) => node.name === selectedEntry.parts[0],
        )?.subcommands.length ?? 0) > 0
      : (selected?.subcommands?.length ?? 0) > 0;

  /** Drill into the selected group, remembering the current cursor so backing
   * out lands where we left. */
  const pushNav = (name: string): void => {
    cursorStack.current.push(cursor);
    setNavPath((path) => [...path, name]);
    setCursor(0);
  };
  /** Back out one level, restoring the cursor we drilled from. */
  const popNav = (): void => {
    setNavPath((path) => path.slice(0, -1));
    setCursor(cursorStack.current.pop() ?? 0);
  };

  /** Open a runnable command: its form — or run it right away when it has
   * nothing to fill in (destructive ones still stop at the confirm modal). */
  const openLeaf = (target: { path: string[]; leaf: CommandLeaf }): void => {
    returnTo.current = null;
    // Restore what this command was last run with (ids, filters, paging) so
    // iterative work doesn't retype the form each time.
    const remembered = lastValues.current.get(target.path.join(" ")) ?? {};
    setForm(target);
    setFormValues(remembered);
    runSeq.current += 1;
    setRun(null);
    setConfirming(false);
    setSidebarPickerOpen(false);
    setPageFacts(null);
    // Run first: only required parameters gate execution behind the sidebar
    // form — optional ones are refined alongside the results (`e` focuses
    // the sidebar). Destructive commands still stop at the confirm modal.
    // (Any required field always stops at the form for review, even when
    // remembered values could fill it — so a create is never re-fired on open.)
    const hasRequired = (target.leaf.specs ?? []).some((spec) => spec.required);
    if (hasRequired) {
      setFocusPane("params");
      return;
    }
    if (target.leaf.destructive === true) {
      setFocusPane("params");
      setConfirming(true);
      return;
    }
    startRun(target, remembered, false);
  };

  /** The sibling command matching a list/get command's resource, if the
   * service has one — any naming shape (`list`/`x-list`/`list-x`, and the
   * matching `get` forms as origins), singular/plural aware:
   * `list-deployments` + delete → `delete-deployment`. Restricted to the
   * given HTTP methods. */
  const siblingFor = (
    path: string[],
    verb: string,
    methods: string[],
  ): { path: string[]; leaf: CommandLeaf } | undefined => {
    if (path.length !== 2) return undefined;
    const [serviceName, cmdName] = path;
    const node = context.commands.find(
      (candidate) => candidate.name === serviceName,
    );
    if (node === undefined) return undefined;
    // Normalize the origin to its list command(s): a list is itself; a get
    // maps back through the service's actual lists.
    const listNames = new Set(
      node.subcommands
        .map((subcommand) => subcommand.name)
        .filter((name) => listResource(name) !== undefined),
    );
    const origins =
      listResource(cmdName) !== undefined
        ? [cmdName]
        : (() => {
            const owner = owningList(cmdName, listNames);
            return owner !== null ? [owner] : [];
          })();
    for (const origin of origins) {
      for (const targetName of crudCandidates(origin, verb)) {
        const leaf = node.subcommands.find(
          (sub) =>
            sub.name === targetName && methods.includes(sub.method ?? ""),
        );
        if (leaf !== undefined) {
          return { path: [serviceName, targetName], leaf };
        }
      }
    }
    return undefined;
  };
  const updateSiblingFor = (
    path: string[],
  ): { path: string[]; leaf: CommandLeaf } | undefined =>
    siblingFor(path, "update", ["put", "patch"]);
  const deleteSiblingFor = (
    path: string[],
  ): { path: string[]; leaf: CommandLeaf } | undefined =>
    siblingFor(path, "delete", ["delete"]);
  /** The current command screen as a jump-back origin — recorded only for
   * lists, where returning (and re-running) is the natural confirmation. */
  const listOrigin = (): {
    target: { path: string[]; leaf: CommandLeaf };
    values: FormValues;
  } | null => {
    if (form === null || form.path.length !== 2) return null;
    // Any list naming shape counts (list / x-list / list-x / x-index).
    if (listResource(form.path[1]) === undefined) return null;
    return { target: form, values: formValues };
  };

  const createSiblingFor = (
    path: string[],
  ): { path: string[]; leaf: CommandLeaf } | undefined =>
    siblingFor(path, "create", ["post"]);

  /** Jump into an update form pre-filled from a record. Two shapes of update
   * command:
   *  - explicit fields (`--code`, `--labels`, …): each is filled from the
   *    matching record field.
   *  - a single `--data` JSON body: the record isn't wrapped in a `data` key,
   *    so seed the body with the record itself, minus the fields that travel
   *    as their own params (the id/path params) — otherwise the required body
   *    would open empty and update would be unusable for those resources.
   * Raw values throughout, so dates/objects round-trip. */
  const openUpdate = (
    target: { path: string[]; leaf: CommandLeaf },
    record: Record<string, unknown>,
  ): void => {
    returnTo.current = null;
    const specs = target.leaf.specs ?? [];
    const values: FormValues = {};
    // Keys carried by their own (non-body) params — excluded from the seeded
    // JSON body so they aren't sent twice.
    const ownParamKeys = new Set(
      specs
        .filter((spec) => !(spec.type === "object" && spec.key === "data"))
        .map((spec) => spec.key),
    );
    for (const spec of specs) {
      const value = recordValueForSpec(record, spec);
      if (value !== undefined) {
        values[spec.key] = value;
      } else if (spec.type === "object" && spec.key === "data") {
        const body: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(record)) {
          if (!ownParamKeys.has(key)) body[key] = value;
        }
        values[spec.key] = JSON.stringify(body);
      }
    }
    setForm(target);
    setFormValues(values);
    runSeq.current += 1;
    setRun(null);
    setConfirming(false);
    setSidebarPickerOpen(false);
    setPageFacts(null);
    setFocusPane("params");
  };

  /** Jump to the delete command for a record, pre-filled from it (its id and
   * any other field the delete command shares). Goes straight to the confirm
   * modal when the record satisfies every required field; otherwise shows the
   * form to fill the rest first. */
  const openDelete = (
    target: { path: string[]; leaf: CommandLeaf },
    record: Record<string, unknown>,
  ): void => {
    returnTo.current = null;
    const specs = target.leaf.specs ?? [];
    const values: FormValues = {};
    for (const spec of specs) {
      const value = recordValueForSpec(record, spec);
      if (value !== undefined) values[spec.key] = value;
    }
    setForm(target);
    setFormValues(values);
    runSeq.current += 1;
    setRun(null);
    setSidebarPickerOpen(false);
    setPageFacts(null);
    const ready = specs.every(
      (spec) => !spec.required || (values[spec.key] ?? "") !== "",
    );
    setConfirming(ready);
    setFocusPane("params");
  };

  const applyFilter = (value: string): void => {
    filterRef.current = value;
    setFilter(value);
    setCursor(0);
  };

  const enterFilter = (seed: string): void => {
    browseCursor.current = cursor;
    applyFilter(seed);
  };

  const clearFilter = (): void => {
    filterRef.current = null;
    setFilter(null);
    setCursor(browseCursor.current);
  };

  /** Repaint the terminal's default foreground + background (OSC 10/11) to the
   * active theme so light/dark themes flip the whole canvas — and keep text
   * readable — on terminals that honour it (Ghostty). TTY-only, so tests and
   * pipes are untouched. */
  const emitThemeBg = (): void => {
    if (process.stdout.isTTY) {
      process.stdout.write(themeTerminalColors());
    }
  };

  const openThemePicker = (): void => {
    committedTheme.current = theme.name;
    setShowThemePicker(true);
  };
  /** Live preview: recolour immediately as the highlighted theme changes. */
  const previewTheme = (name: string): void => {
    applyTheme(name);
    setThemeName(theme.name);
    emitThemeBg();
  };
  const keepTheme = (name: string): void => {
    applyTheme(name);
    committedTheme.current = theme.name;
    setThemeName(theme.name);
    onThemePersist(theme.name);
    emitThemeBg();
    setShowThemePicker(false);
  };
  const cancelTheme = (): void => {
    applyTheme(committedTheme.current);
    setThemeName(theme.name);
    emitThemeBg();
    setShowThemePicker(false);
  };

  useInput((input, key) => {
    if (!welcomed) {
      // The startup splash dismisses on the first keystroke; a printable
      // character also seeds the command search, exactly as in the browser
      // ("/" opens an empty filter, any other char begins type-to-search).
      setWelcomed(true);
      if (input === "/") {
        enterFilter("");
      } else if (input !== "" && input !== " " && !key.ctrl && !key.meta && !key.tab) {
        enterFilter(input);
      }
      return;
    }
    if (quitting) {
      // The quit confirmation owns the keyboard (its own useInput).
      return;
    }
    if (showThemePicker) {
      // The theme picker owns the keyboard while open (its own useInput).
      return;
    }
    if (showHelp) {
      // The help overlay is a browse-level modal — any key dismisses it.
      setShowHelp(false);
      return;
    }
    if (form !== null) {
      // The form (or its picker / modal / results) owns the keyboard.
      return;
    }
    if (input === "?") {
      setShowHelp(true);
      return;
    }
    if (key.ctrl && (input === "t" || input === "T")) {
      // ^t (not a bare letter, which type-to-search would swallow) opens the
      // live theme picker.
      openThemePicker();
      return;
    }
    if (key.ctrl && (input === "w" || input === "W")) {
      // ^w reopens the welcome splash — "home". After the first keystroke
      // dismisses it at startup this is the way back; the next key dismisses
      // it again, exactly as at startup. Clear any live filter first so it's a
      // clean return rather than a stale search underneath.
      if (filterRef.current !== null) clearFilter();
      setWelcomed(false);
      return;
    }
    // Konami code: track the running tail of movement/b/a keystrokes and toggle
    // the wordmark shimmer when it lands. Non-completing keys fall through to
    // their normal handling, so this stays invisible until the sequence hits.
    const token = key.upArrow
      ? "up"
      : key.downArrow
        ? "down"
        : key.leftArrow
          ? "left"
          : key.rightArrow
            ? "right"
            : input === "b"
              ? "b"
              : input === "a"
                ? "a"
                : null;
    if (token !== null) {
      const tail = [...konami.current, token].slice(-KONAMI.length);
      konami.current = tail;
      if (
        tail.length === KONAMI.length &&
        tail.every((step, index) => step === KONAMI[index])
      ) {
        konami.current = [];
        setShimmer((on) => !on);
        // The trailing b/a seeded a filter; drop it so the browser is clean.
        if (filterRef.current !== null) clearFilter();
        return;
      }
    }
    if (key.upArrow) {
      setCursor((current) => Math.max(current - 1, 0));
      return;
    }
    if (key.downArrow) {
      setCursor((current) => Math.min(current + 1, items.length - 1));
      return;
    }
    // Page jumps by roughly the visible navbar height — the fast way through a
    // long service list (Ink doesn't surface Home/End, so PgUp/PgDn to the ends).
    if (key.pageUp) {
      const page = Math.max(rows - NAV_CHROME_ROWS - 2, 1);
      setCursor((current) => Math.max(current - page, 0));
      return;
    }
    if (key.pageDown) {
      const page = Math.max(rows - NAV_CHROME_ROWS - 2, 1);
      setCursor((current) => Math.min(current + page, items.length - 1));
      return;
    }
    if (filterRef.current !== null) {
      const currentFilter = filterRef.current;
      if (key.escape) {
        clearFilter();
        return;
      }
      if (key.return) {
        const entry = filteredEntries[Math.min(cursor, filteredEntries.length - 1)];
        if (entry !== undefined) {
          clearFilter();
          openEntry(entry);
        }
        return;
      }
      if (key.backspace || key.delete) {
        const next = currentFilter.slice(0, -1);
        // Deleting the last character leaves filter mode entirely — an
        // empty query would list every flattened entry, which reads as a
        // duplicated navigation.
        if (next === "") {
          clearFilter();
        } else {
          applyFilter(next);
        }
        return;
      }
      if (input !== "" && !key.ctrl && !key.meta && !key.tab) {
        const next = currentFilter + input;
        const word = next.trim().toLowerCase();
        // Typing "exit" closes the TUI (through the same quit confirmation as
        // q/esc). `q` can't be typed as a word — it's the back/quit key — so
        // "exit" is the typed escape hatch.
        if (word === "exit") {
          clearFilter();
          requestQuit();
          return;
        }
        // Hidden `debug` easter egg: typing the word (or the `fps` alias)
        // toggles the diagnostics HUD + history pane and drops back out of the
        // filter, so it never lingers as a (missing) search. Undocumented.
        if (word === "debug" || word === "fps") {
          setDebug((on) => !on);
          clearFilter();
          return;
        }
        applyFilter(next);
      }
      return;
    }
    if (input === "/") {
      enterFilter("");
      return;
    }
    // q backs out like esc wherever nothing is being typed; type-to-search
    // only ever claims the other characters.
    if (input === "q") {
      if (navPath.length > 0) {
        popNav();
      } else {
        requestQuit();
      }
      return;
    }
    // y copies the selected command's one-shot invocation to the clipboard —
    // the TUI as a launchpad for scripts. Runnable leaves only; groups and
    // synthetic actions (themes) have nothing to run. In filter mode y is
    // search text, so this only fires while plain-browsing.
    if (input === "y" && selected !== undefined) {
      const isGroup = (selected.subcommands?.length ?? 0) > 0;
      if (!isGroup && selected.tuiAction === undefined) {
        const runPath = selected.runPath ?? [...navPath, selected.name];
        void copyToClipboard(`${EXECUTABLE_NAME} ${runPath.join(" ")}`).then(
          (ok) => setCopyNote(ok ? "✓ copied command" : "copy failed"),
        );
      }
      return;
    }
    if (key.return || key.rightArrow) {
      if (selected === undefined) return;
      // A node with children drills in (a service at the root, or `alias`
      // inside settings).
      if ((selected.subcommands?.length ?? 0) > 0) {
        pushNav(selected.name);
        return;
      }
      // A synthetic settings action opens its panel instead of running.
      if (selected.tuiAction === "theme-picker") {
        openThemePicker();
        return;
      }
      openLeaf({
        // Relocated commands (alias, under settings) carry their real
        // invocation; everything else runs at its nav path.
        path: selected.runPath ?? [...navPath, selected.name],
        leaf: selected,
      });
      return;
    }
    if (key.escape || key.leftArrow || key.backspace) {
      if (navPath.length > 0) {
        popNav();
        return;
      }
      if (key.escape) {
        requestQuit();
      }
      return;
    }
    // Any other typing searches right away, fzf-style — the list filters
    // in place and stays on screen.
    if (input !== "" && !key.ctrl && !key.meta && !key.tab) {
      enterFilter(input);
    }
  });

  /** Land the browser on a searched entry and open it. A group entry drills
   * into the service; anything else runs / opens its form. */
  const openEntry = (entry: PaletteEntry): void => {
    const [head, sub] = entry.parts;
    const rootIndex = Math.max(
      rootItems.findIndex((candidate) => candidate.name === head),
      0,
    );
    const node = context.commands.find((candidate) => candidate.name === head);
    // A synthetic action (themes) opens its panel — it isn't a runnable
    // command, so it never goes through openLeaf.
    if (entry.leaf.tuiAction === "theme-picker") {
      setNavPath([]);
      setCursor(rootIndex);
      openThemePicker();
      return;
    }
    if (sub === undefined) {
      if (node !== undefined && node.subcommands.length > 0) {
        // Group entry: drill into the service (don't auto-run).
        cursorStack.current = [rootIndex];
        setNavPath([head]);
        setCursor(0);
        return;
      }
      // A standalone command: land on it at the root, then open.
      cursorStack.current = [];
      setNavPath([]);
      setCursor(rootIndex);
    } else {
      cursorStack.current = [rootIndex];
      setNavPath([head]);
      // Cursor indexes the browsable list the nav renders, not the full tree.
      setCursor(
        Math.max(
          node === undefined
            ? 0
            : browsableSubcommands(node).findIndex(
                (candidate) => candidate.name === sub,
              ),
          0,
        ),
      );
    }
    openLeaf({ path: entry.parts, leaf: entry.leaf });
  };

  const formSpecs = form?.leaf.specs ?? [];
  const canPage = formSpecs.some((spec) => spec.key === "offset");
  /** Paging/sorting/filtering inputs live in the right sidebar; everything
   * else (create / update bodies, an id to fetch, …) is "content" and fills
   * the main window. `filter` is the generic column=value option every list
   * command carries (see getCliPromptSpecs in the generator). */
  const PAGING_KEYS = new Set([
    "limit",
    "offset",
    "order",
    "sort",
    "page",
    "filter",
  ]);
  const contentSpecs = formSpecs.filter((spec) => !PAGING_KEYS.has(spec.key));
  /** A command with content inputs (create/update/get/delete) shows its form in
   * the main window; a pure list command shows results there and paging on the
   * right. */
  const formInMain = contentSpecs.length > 0;
  /** From a list/get result, `u` jumps to this resource's update form and `d`
   * to its (confirm-gated) delete. */
  const updateTarget = form === null ? undefined : updateSiblingFor(form.path);
  const createTarget = form === null ? undefined : createSiblingFor(form.path);
  const canCreate = createTarget !== undefined;
  const canUpdate = updateTarget !== undefined;
  const deleteTarget = form === null ? undefined : deleteSiblingFor(form.path);
  const canDelete = deleteTarget !== undefined;

  /** Jump back to the origin list (if a c/u/d was entered from one) and
   * re-run it. Used on success, on cancel, and when leaving a failure. */
  const returnToOrigin = (): boolean => {
    const origin = returnTo.current;
    if (origin === null) return false;
    returnTo.current = null;
    setForm(origin.target);
    setFormValues(origin.values);
    startRun(origin.target, origin.values, false);
    return true;
  };

  const startRun = (
    target: { path: string[]; leaf: CommandLeaf },
    values: FormValues,
    force: boolean,
  ): void => {
    if (runner === undefined) return;
    // Remember what this command ran with, so reopening restores it.
    lastValues.current.set(target.path.join(" "), values);
    const specs = target.leaf.specs ?? [];
    const commandLine = buildCommandLine(target.path, specs, values);
    const tokens = buildArgv(target.path, specs, values);
    const id = ++runSeq.current;
    setConfirming(false);
    setFocusPane("results");
    setRun({ status: "running", commandLine });
    void runner(tokens, { force }).then((result) => {
      // Log every completed run for the debug pane (before the stale-run guard:
      // a superseded run still executed and its timing is real).
      setHistory((log) =>
        [
          ...log,
          {
            method: target.leaf.method,
            path: target.path,
            ok: result.ok,
            exitCode: result.exitCode,
            durationMs: result.durationMs,
            error: result.error?.message,
          },
        ].slice(-MAX_HISTORY),
      );
      if (runSeq.current !== id) return;
      // A create/update/delete entered from a list jumps straight back to
      // that list on success and re-runs it — the fresh page (new row,
      // changed values, removed row) IS the confirmation. Failures stay on
      // the error view.
      if (result.ok && returnToOrigin()) {
        return;
      }
      setRun({ status: "done", commandLine, result });
      if (result.ok) {
        setPageFacts(parsePageInfo(result.data));
      }
    });
  };

  const submitForm = (values?: FormValues): void => {
    if (form === null) return;
    if (form.leaf.destructive === true) {
      setConfirming(true);
      return;
    }
    startRun(form, values ?? formValues, false);
  };

  const turnPage = (direction: 1 | -1): void => {
    if (form === null) return;
    const limit = Number.parseInt(formValues["limit"] ?? "", 10);
    const pageSize = Number.isNaN(limit) ? 50 : limit;
    const offset = Number.parseInt(formValues["offset"] ?? "", 10);
    const current = Number.isNaN(offset) ? 0 : offset;
    // No-op at the edges: already on the first page, or the gateway said there
    // is no next page — don't waste a round-trip.
    if (direction < 0 && current === 0) return;
    if (direction > 0 && pageFacts?.hasMore === false) return;
    const next = Math.max(current + direction * pageSize, 0);
    const values = { ...formValues, offset: String(next) };
    setFormValues(values);
    startRun(form, values, false);
  };

  // Status-bar hints, matched to whichever component currently owns the
  // keyboard so the advertised keys are always the real ones.
  const hints: KeyHint[] = quitting
    ? [
        ["y", "quit"],
        ["n", "stay"],
      ]
    : showHelp
    ? [["any key", "close"]]
    : showThemePicker
      ? [
          ["type", "search"],
          ["↑↓", "preview"],
          ["⏎", "keep"],
          ["esc", "revert"],
        ]
      : sidebarPickerOpen
      ? [
          ["type", "search"],
          ["↑↓", "select"],
          ["⏎", "pick"],
          ["esc", "cancel"],
        ]
      : confirming
        ? [
            ["y", "run"],
            ["n", "cancel"],
          ]
        : form !== null && focusPane === "results" && run !== null
          ? run.status === "running"
            ? [
                ["esc", "cancel"],
                ["", "waiting for the gateway…"],
              ]
            : [
                ["↑↓", "rows"],
                ["⏎", "detail"],
                ["/", "filter"],
                ...(canPage ? [["n/p", "page"] as KeyHint] : []),
                ...(canCreate ? [["c", "create"] as KeyHint] : []),
                ...(canUpdate ? [["u", "update"] as KeyHint] : []),
                ...(canDelete ? [["d", "delete"] as KeyHint] : []),
                ...(formSpecs.length > 0 ? [["e", "params"] as KeyHint] : []),
                ["o", "format"],
                ["y", "copy"],
                ["q", "back"],
              ]
          : form !== null
            ? [
                ["↹", "field"],
                ["←→", "choose"],
                ["⏎", "next → submit"],
                ["^r", "run"],
                ["esc", "back"],
              ]
            : filter !== null
              ? [
                  ["type", "filter"],
                  ["↑↓", "select"],
                  ["⏎", "open"],
                  ["esc", "clear"],
                  ["?", "help"],
                ]
              : [
                  ["type", "search"],
                  ["/", "palette"],
                  ["↑↓", "select"],
                  ["⏎", "open"],
                  ["^t", "theme"],
                  group === undefined ? ["q", "quit"] : ["q", "back"],
                  ["?", "help"],
                ];

  // Mockup-style request line: METHOD command · [exit] · NNN ms.
  const requestLabel = [
    form?.leaf.method?.toUpperCase(),
    form?.path.join(" "),
  ]
    .filter(Boolean)
    .join(" ");
  const statusRight =
    run !== null && run.status === "done"
      ? [
          requestLabel || undefined,
          run.result.ok ? undefined : `exit ${run.result.exitCode}`,
          `${run.result.durationMs} ms`,
        ]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  // The command browser is a permanent left navbar; every other pane lives in
  // the space to its right (minus the row gap).
  const rightWidth = Math.max(columns - BROWSER_WIDTH - 1, 16);
  // The paging/param sidebar only appears when there's room for a usable
  // results pane (≥24) beside it; otherwise it's dropped and results take the
  // full width (n/p paging still works). Its width shrinks to fit, capped at 40.
  const showSidebar = rightWidth >= 46;
  const SIDEBAR_WIDTH = showSidebar
    ? Math.min(40, rightWidth - 24 - 1)
    : 0;
  const sidebarWidth = sidebarPickerOpen ? rightWidth : SIDEBAR_WIDTH;
  const resultsWidth = showSidebar
    ? Math.max(rightWidth - SIDEBAR_WIDTH - 1, 24)
    : rightWidth;
  const detailWidth = rightWidth;

  const browserTitle =
    filter !== null
      ? `${group === undefined ? "" : `${navPath.join(" ")} `}› ${filter}▌`
      : group === undefined
        ? "browse"
        : `commands · ${navPath.join(" ")}`;

  // Below a usable minimum the chrome (header 3 + status 1 + borders + navbar)
  // can't fit; render a hint instead of silently clipping the layout.
  if (columns < 50 || rows < 12) {
    return (
      <Box
        height={rows}
        width={columns}
        alignItems="center"
        justifyContent="center"
        paddingX={1}
      >
        <Text color={theme.warn} wrap="wrap">
          Terminal too small — resize to at least 50×12.
        </Text>
      </Box>
    );
  }

  return (
    // overflow=hidden is load-bearing: a frame even one line taller than the
    // terminal desyncs ink's diff and stale rows stick on screen forever.
    <Box flexDirection="column" height={rows} overflow="hidden">
      <Header
        context={context}
        narrow={columns < 100}
        shimmer={shimmer}
        width={columns}
      />
      {/* The command browser is a permanent left navbar; the pane to its right
          swaps between the welcome splash, the detail sheet, the command
          screen, and the confirm modal, but the navbar itself never
          disappears. */}
      <Box flexGrow={1} gap={1} overflow="hidden">
        <BrowserPane
          title={browserTitle}
          items={items}
          cursor={Math.min(cursor, Math.max(items.length - 1, 0))}
          sections={navSections}
          height={rows - NAV_CHROME_ROWS}
          focused={welcomed && form === null && !confirming && !quitting}
        />
        {!welcomed ? (
          <WelcomeScreen context={context} width={detailWidth} />
        ) : quitting ? (
          <QuitConfirm
            width={detailWidth}
            onConfirm={exit}
            onCancel={() => {
              // Declining the quit lands you back on the welcome splash — the
              // one way to bring it back after the first keystroke dismissed
              // it. The next key dismisses it again, exactly as at startup.
              setQuitting(false);
              setWelcomed(false);
            }}
          />
        ) : showThemePicker ? (
          <ThemePicker
            width={detailWidth}
            names={THEME_NAMES}
            committed={committedTheme.current}
            onPreview={previewTheme}
            onKeep={keepTheme}
            onCancel={cancelTheme}
          />
        ) : showHelp ? (
          <HelpPanel width={detailWidth} />
        ) : form !== null && confirming ? (
          // Keep the main-window pane border; the modal centers inside it.
          <Panel title={form.path.join(" · ")} width={rightWidth} focused grow>
            <ConfirmModal
              commandLine={buildCommandLine(form.path, formSpecs, formValues)}
              onConfirm={() => form !== null && startRun(form, formValues, true)}
              onCancel={() => {
                setConfirming(false);
                // A cancelled c/u/d goes back to the list it came from.
                if (returnToOrigin()) return;
                // Without parameters there is no sidebar to fall back to.
                if (formSpecs.length === 0) {
                  setForm(null);
                } else {
                  setFocusPane("params");
                }
              }}
            />
          </Panel>
        ) : form !== null && formInMain ? (
          // Input command (create/update/get/delete): the form fills the main
          // window; once it runs, the results take its place. No right sidebar —
          // these carry no paging/sorting.
          run !== null ? (
            <Results
              state={run}
              title={form.path.join(" · ")}
              width={rightWidth}
              canPage={canPage}
              canEdit={contentSpecs.length > 0}
              active={focusPane === "results"}
              canCreate={canCreate}
              onCreate={() => {
                if (createTarget !== undefined) {
                  const origin = listOrigin();
                  openLeaf(createTarget);
                  returnTo.current = origin;
                }
              }}
              canUpdate={canUpdate}
              onUpdate={(record) => {
                if (updateTarget !== undefined) {
                  const origin = listOrigin();
                  openUpdate(updateTarget, record);
                  returnTo.current = origin;
                }
              }}
              canDelete={canDelete}
              onDelete={(record) => {
                if (deleteTarget !== undefined) {
                  const origin = listOrigin();
                  openDelete(deleteTarget, record);
                  returnTo.current = origin;
                }
              }}
              onPage={turnPage}
              onEdit={() => {
                // Swap the results back out for the form to edit and re-run.
                runSeq.current += 1;
                setRun(null);
                setFocusPane("params");
              }}
              onClose={() => {
                runSeq.current += 1;
                setRun(null);
                if (returnToOrigin()) return;
                setForm(null);
              }}
            />
          ) : (
            <Form
              path={form.path}
              specs={formSpecs}
              values={formValues}
              onChange={setFormValues}
              onSubmit={submitForm}
              onClose={() => {
                if (returnToOrigin()) return;
                setForm(null);
              }}
              active={focusPane === "params"}
              width={rightWidth}
              autoPick
              runOnComplete={
                form.leaf.method === "get" || form.leaf.destructive === true
              }
              onPickerToggle={setSidebarPickerOpen}
              loadResourceRecords={loadResourceRecords}
            />
          )
        ) : form !== null ? (
          // List command: results in the main pane, paging/sorting docked on the
          // right at all times.
          <>
            {!sidebarPickerOpen &&
              (run !== null ? (
                <Results
                  state={run}
                  title={form.path.join(" · ")}
                  width={resultsWidth}
                  canPage={canPage}
                  canEdit={formSpecs.length > 0}
                  active={focusPane === "results"}
                  canCreate={canCreate}
                  onCreate={() => {
                    if (createTarget !== undefined) {
                      const origin = listOrigin();
                      openLeaf(createTarget);
                      returnTo.current = origin;
                    }
                  }}
                  canUpdate={canUpdate}
                  onUpdate={(record) => {
                    if (updateTarget !== undefined) {
                      const origin = listOrigin();
                      openUpdate(updateTarget, record);
                      returnTo.current = origin;
                    }
                  }}
                  canDelete={canDelete}
                  onDelete={(record) => {
                    if (deleteTarget !== undefined) {
                      const origin = listOrigin();
                      openDelete(deleteTarget, record);
                      returnTo.current = origin;
                    }
                  }}
                  onPage={turnPage}
                  onEdit={() => setFocusPane("params")}
                  onClose={() => {
                    // Also invalidates an in-flight run so its late response
                    // can't reopen the results view.
                    runSeq.current += 1;
                    setRun(null);
                    setForm(null);
                  }}
                />
              ) : (
                <Panel title={form.path.join(" · ")} width={resultsWidth}>
                  <Text dimColor wrap="truncate">
                    {EXECUTABLE_NAME} {form.path.join(" ")}
                  </Text>
                  <Box paddingTop={1}>
                    <Text dimColor>running…</Text>
                  </Box>
                </Panel>
              ))}
            {showSidebar && formSpecs.length > 0 && (
              <Box flexDirection="column" flexShrink={0} overflow="hidden">
                <Form
                  path={form.path}
                  specs={formSpecs}
                  values={formValues}
                  onChange={setFormValues}
                  onSubmit={submitForm}
                  onClose={() => {
                if (returnToOrigin()) return;
                setForm(null);
              }}
                  active={focusPane === "params"}
                  width={sidebarWidth}
                  autoPick
                  runOnComplete={
                    form.leaf.method === "get" || form.leaf.destructive === true
                  }
                  onPickerToggle={setSidebarPickerOpen}
                  loadResourceRecords={loadResourceRecords}
                />
                {!sidebarPickerOpen && (
                  <PageInfoPane info={pageFacts} width={sidebarWidth} />
                )}
              </Box>
            )}
          </>
        ) : egg !== undefined ? (
          <EggPanel egg={egg} width={detailWidth} />
        ) : filter !== null && items.length === 0 ? (
          <Panel title="no matches" width={detailWidth}>
            <Text dimColor>No commands match your search.</Text>
            <Box paddingTop={1}>
              <Text dimColor>esc to clear the filter</Text>
            </Box>
          </Panel>
        ) : debug ? (
          <DebugPane
            stats={debugStats}
            cols={columns}
            rows={rows}
            history={history}
            width={detailWidth}
          />
        ) : (
          <DetailPane
            path={filter !== null ? [] : navPath}
            item={selected}
            isGroup={selectedIsGroup}
            width={detailWidth}
          />
        )}
      </Box>
      <StatusBar
        hints={
          welcomed
            ? hints
            : [
                ["type", "search"],
                ["", "· or any key to begin"],
              ]
        }
        right={copyNote ?? statusRight}
        busy={run?.status === "running"}
        debug={
          debug ? { ...debugStats, cols: columns, rows } : undefined
        }
      />
    </Box>
  );
};

/**
 * Thin stdout proxy ink renders through, bound to the *real* write at
 * startup. The executor captures command output by patching
 * `process.stdout.write` while a command runs; without this indirection that
 * patch would also swallow ink's own frames (freezing the UI and polluting
 * the captured JSON with ANSI). Dimensions and resize events proxy through
 * to the real stream.
 */
const createInkStdout = (): {
  stream: NodeJS.WriteStream;
  detach: () => void;
} => {
  const realWrite = process.stdout.write.bind(process.stdout);
  const proxy = new EventEmitter() as EventEmitter & {
    write: (chunk: string | Uint8Array) => boolean;
    columns?: number;
    rows?: number;
    isTTY?: boolean;
  };
  proxy.write = (chunk) => realWrite(chunk);
  Object.defineProperties(proxy, {
    columns: { get: () => process.stdout.columns },
    rows: { get: () => process.stdout.rows },
    isTTY: { get: () => process.stdout.isTTY },
  });
  const forwardResize = (): void => {
    proxy.emit("resize");
  };
  process.stdout.on("resize", forwardResize);
  return {
    stream: proxy as unknown as NodeJS.WriteStream,
    detach: () => {
      process.stdout.off("resize", forwardResize);
    },
  };
};

/** Renders the TUI on the alternate screen and resolves when the user exits,
 * restoring the primary screen buffer even on failure. */
export const runTui = async (
  context: TuiContext,
  runner?: TuiRunner,
  themeName?: string,
): Promise<void> => {
  // Startup theme precedence: explicit --theme flag → REVENEXX_THEME env →
  // saved preference. Applied before the first OSC-11 write so the terminal
  // background matches from frame one.
  const startupTheme = [
    themeName,
    process.env.REVENEXX_THEME,
    globalConfig.get("theme") as string | undefined,
  ].find(isTheme);
  if (startupTheme !== undefined) applyTheme(startupTheme);
  const altScreen = process.stdout.isTTY;
  // Restore the terminal: reset the OSC-11 background to default and leave the
  // alternate screen. Runs from the normal `finally` *and* from signal/exit
  // handlers, so a SIGTERM/SIGHUP (tab closed) or hard exit can't leave the
  // terminal stuck purple on the alt-screen. Idempotent.
  let restored = false;
  const restore = (): void => {
    if (restored || !altScreen) return;
    restored = true;
    process.stdout.write(`${THEME_TERMINAL_RESET}\x1b[?1049l`);
  };
  // These fire on paths that bypass `finally`. `exit` covers process.exit and
  // natural end; the signal handlers restore then re-raise the default action.
  const onExit = (): void => restore();
  const onSignal = (signal: NodeJS.Signals): void => {
    restore();
    process.off(signal, onSignal);
    process.kill(process.pid, signal);
  };
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM", "SIGHUP"];
  if (altScreen) {
    process.stdout.write("\x1b[?1049h\x1b[H");
    // Paint the whole terminal (every pane and gap) in the theme's surface AND
    // set the default foreground to its onSurface, so light themes stay
    // readable. Terminals that don't support it ignore the sequences; both are
    // reset on exit.
    process.stdout.write(themeTerminalColors());
    process.once("exit", onExit);
    for (const signal of signals) process.once(signal, onSignal);
  }
  const inkStdout = createInkStdout();
  try {
    const instance = render(<App context={context} runner={runner} welcome />, {
      stdout: inkStdout.stream,
      // Command output must reach the executor's process.stdout.write capture
      // untouched — ink's console patch would reroute it into the UI instead.
      patchConsole: false,
    });
    await instance.waitUntilExit();
  } finally {
    inkStdout.detach();
    process.off("exit", onExit);
    for (const signal of signals) process.off(signal, onSignal);
    restore();
  }
};
