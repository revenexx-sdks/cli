/**
 * The watchlist pane (DX-141): every background watcher this session started,
 * with live state, and the keys to cancel them.
 *
 * Reads the store through useWatchers rather than props — the scheduler mutates
 * it from a timer with no render in between, so a prop-drilled copy would be
 * one frame stale exactly when it matters.
 */
import { useState } from "react";
import { Box, Text, useInput } from "ink";
import { Panel } from "./panel.js";
import { theme } from "./theme.js";
import { useTerminalSize } from "./terminal.js";
import { formatCondition } from "../watch/condition.js";
import { formatResolved } from "../watch/field-path.js";
import { formatDuration } from "../watch/duration.js";
import { isTerminalState } from "../watch/types.js";
import { useWatchers } from "../watch/use-watchers.js";
import { watchScheduler } from "../watch/scheduler.js";
import type { WatchState, Watcher } from "../watch/types.js";

/** Rows around the list: app header (3), status bar (1), pane border (2),
 * top spacer (1), the selected watcher's note (2) and the empty-state gap (1). */
const WATCH_CHROME_ROWS = 10;

/** Status-bar keys while this pane owns the keyboard. */
export const WATCH_PANE_HINTS: [string, string][] = [
  ["↑↓", "select"],
  ["x", "cancel"],
  ["X", "cancel all"],
  ["esc", "close"],
];

const STATE_GLYPH: Record<WatchState, string> = {
  pending: "◌",
  polling: "◉",
  satisfied: "✓",
  timeout: "⏱",
  error: "✗",
  cancelled: "·",
};

/** The palette is a mutable singleton, so colours resolve at render time. */
const stateColor = (state: WatchState): string => {
  switch (state) {
    case "polling":
      return theme.accent;
    case "satisfied":
      return theme.success;
    case "timeout":
      return theme.warn;
    case "error":
      return theme.danger;
    default:
      return theme.muted;
  }
};

/** The row's text, minus the leading glyph. */
const describe = (watcher: Watcher, now: number): string =>
  [
    `#${watcher.id}`,
    watcher.label,
    `${watcher.fieldPath === "" ? "(payload)" : watcher.fieldPath} ${formatCondition(watcher.condition)}`,
    formatResolved(watcher.lastValue, 24),
    `${watcher.pollCount}× · ${formatDuration((watcher.finishedAt ?? now) - watcher.createdAt)}`,
  ].join(" · ");

const WatcherRow = ({
  watcher,
  selected,
  budget,
  now,
}: {
  watcher: Watcher;
  selected: boolean;
  budget: number;
  now: number;
}) => {
  const line = `${STATE_GLYPH[watcher.state]} ${describe(watcher, now)}`;
  // ink styles text runs, not boxes, so the selection bar has to be one padded
  // Text — the same shape results.tsx's Table uses.
  if (selected) {
    return (
      <Text
        backgroundColor={theme.selectionBg}
        color={theme.selectionFg}
        bold
        wrap="truncate"
      >
        {`» ${line}`.padEnd(budget).slice(0, budget)}
      </Text>
    );
  }
  return (
    <Text wrap="truncate">
      <Text color={stateColor(watcher.state)}>
        {"  "}
        {STATE_GLYPH[watcher.state]}
      </Text>{" "}
      {describe(watcher, now)}
    </Text>
  );
};

export const WatchPane = ({
  width,
  onClose,
}: {
  width: number;
  onClose: () => void;
}) => {
  const watchers = useWatchers();
  const [cursor, setCursor] = useState(0);
  const { rows: terminalRows } = useTerminalSize();
  const maxRows = Math.max(terminalRows - WATCH_CHROME_ROWS, 3);
  // Live watchers first, then finished ones newest-first: this is a "what is
  // happening" view, not a log.
  const ordered = [
    ...watchers.filter((watcher) => !isTerminalState(watcher.state)),
    ...watchers
      .filter((watcher) => isTerminalState(watcher.state))
      .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0)),
  ];
  const at = Math.min(cursor, Math.max(ordered.length - 1, 0));
  const selected = ordered[at];
  const active = ordered.filter(
    (watcher) => !isTerminalState(watcher.state),
  ).length;

  useInput((input, key) => {
    if (key.escape || input === "q") {
      onClose();
      return;
    }
    if (key.upArrow) {
      setCursor((current) => Math.max(current - 1, 0));
      return;
    }
    if (key.downArrow) {
      setCursor((current) => Math.min(current + 1, ordered.length - 1));
      return;
    }
    if (input === "x" && selected !== undefined) {
      watchScheduler.cancel(selected.id);
      return;
    }
    if (input === "X") {
      void watchScheduler.cancelAll();
    }
  });

  // Windowed like every other list here: never render a frame taller than the
  // terminal (which desyncs ink's diff and sticks stale rows on screen).
  const start = Math.max(
    0,
    Math.min(at - Math.floor(maxRows / 2), ordered.length - maxRows),
  );
  const visible = ordered.slice(start, start + maxRows);
  const budget = Math.max(width - 4, 10);
  const now = Date.now();

  return (
    <Panel
      title="watchlist"
      titleColor={active > 0 ? theme.accent : undefined}
      footer={
        ordered.length > 0
          ? `${active} active · ${ordered.length - active} finished`
          : undefined
      }
      width={width}
      grow
    >
      {ordered.length === 0 ? (
        <Box paddingTop={1} flexDirection="column">
          <Text dimColor>Nothing is being watched.</Text>
          <Box paddingTop={1}>
            <Text dimColor>
              Type <Text color={theme.accent}>/watch</Text> to poll a resource
              field until it changes.
            </Text>
          </Box>
        </Box>
      ) : (
        <Box paddingTop={1} flexDirection="column">
          {visible.map((watcher) => (
            <WatcherRow
              key={watcher.id}
              watcher={watcher}
              selected={watcher.id === selected?.id}
              budget={budget}
              now={now}
            />
          ))}
          {selected !== undefined && selected.lastError !== null && (
            <Box paddingTop={1}>
              <Text
                color={selected.state === "error" ? theme.danger : theme.muted}
                wrap="truncate"
              >
                {selected.lastError}
              </Text>
            </Box>
          )}
        </Box>
      )}
    </Panel>
  );
};
