/**
 * Result view for commands run inside the TUI (DX-118 workstream 5).
 * Collections render as a selectable table (enter = row detail, n/p = paging
 * when the command supports limit/offset); single objects as a key-value
 * sheet; failures as an error panel reusing the CLI's redacted JSON error
 * payload plus authHint.
 */
import { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import { authHint, formatCSV, formatJSONL } from "../parser.js";
import { extractItems } from "../interactive.js";
import { useTerminalSize } from "./terminal.js";
import { copyToClipboard } from "./clipboard.js";
import { Panel } from "./panel.js";
import { theme, useSpinner } from "./theme.js";
import type { ExecutionResult } from "./executor.js";

/** Renderings the `o` key cycles through, mirroring `-o/--output`. */
const OUTPUT_FORMATS = ["table", "json", "jsonl", "csv"] as const;
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

/** The serialized text for one data value in a non-table format — the same
 * bytes the one-shot `-o json|jsonl|csv` renderers emit. */
export const formatData = (
  data: unknown,
  format: Exclude<OutputFormat, "table">,
): string => {
  switch (format) {
    case "json":
      return JSON.stringify(data, null, 2) ?? "undefined";
    case "jsonl":
      return formatJSONL(data);
    case "csv":
      return formatCSV(data);
  }
};

/** The serialized text for a non-table format — same bytes the one-shot
 * `-o json|jsonl|csv` renderers emit. */
export const formatResult = (
  result: ExecutionResult,
  format: Exclude<OutputFormat, "table">,
): string => {
  if (result.data === undefined) return result.stdout.trim();
  return formatData(result.data, format);
};

/** Rows around the table: header box (3), status bar (1), panel top+bottom
 * border (2), the blank spacer line (1), column header (1), hidden-columns
 * note (1), scroll indicators (2). */
const TABLE_CHROME_ROWS = 11;
/** Longest cell before truncation, matching the one-shot table's spirit. */
const CELL_CAP = 40;

export type RunState =
  | { status: "running"; commandLine: string }
  | { status: "done"; commandLine: string; result: ExecutionResult };

const isScalar = (value: unknown): boolean =>
  value === null ||
  ["string", "number", "boolean"].includes(typeof value);

const cell = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

/** A list/collection payload (as opposed to a single object) — used to show a
 * "no records" state instead of dumping an empty `{ items: [], page: … }`. */
const isCollection = (data: unknown): boolean => {
  if (Array.isArray(data)) return true;
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    Array.isArray(obj.items) || Array.isArray(obj.data) || "page" in obj
  );
};

/** ISO-8601 timestamp (date + time), e.g. `2026-07-15T09:12:00Z`. */
const ISO_RE = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/;

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** An absolute but human-readable timestamp, e.g. `Jul 15, 2026 09:12`. Kept in
 * UTC (as stored) so it's deterministic and matches the raw value; seconds and
 * timezone are dropped for compactness. */
const humanDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const pad2 = (n: number): string => String(n).padStart(2, "0");
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()} ${pad2(
    d.getUTCHours(),
  )}:${pad2(d.getUTCMinutes())}`;
};

/** Render a row for display: ISO timestamps become human-readable dates. Only
 * the on-screen copy changes — the raw payload behind `c`/`-o json` is
 * untouched. */
export const humanizeRow = (
  row: Record<string, unknown>,
): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(row)) {
    out[key] =
      typeof value === "string" && ISO_RE.test(value)
        ? humanDate(value)
        : value;
  }
  return out;
};

/** Booleans render as an icon only: green `●` (true) / dim `○` (false). */
const pad = (text: string, width?: number): string =>
  width === undefined ? text : text.padEnd(width).slice(0, width);

/** A cell's display text at a fixed width — numeric right-aligned, others left.
 * Used to compose a selected row as one continuous run (no column-gap holes in
 * the highlight). */
const cellStr = (value: unknown, width: number, numeric: boolean): string => {
  const raw =
    typeof value === "boolean" ? (value ? "●" : "○") : cell(value);
  if (numeric) {
    return raw.length >= width ? raw.slice(raw.length - width) : raw.padStart(width);
  }
  return raw.padEnd(width).slice(0, width);
};

/** Columns treated as a state/status enum — their string values get a badge
 * colour. `enabled`/`active` booleans already render as coloured yes/no. */
const isStatusColumn = (column: string): boolean =>
  ["status", "state", "phase", "stage"].includes(column.toLowerCase());

/** Map a status word to a palette accent: healthy → green, in-flight → amber,
 * terminal/failed → red, anything else uncoloured. */
const STATUS_COLOR: Record<string, string> = {
  active: theme.success,
  enabled: theme.success,
  live: theme.success,
  paid: theme.success,
  published: theme.success,
  completed: theme.success,
  succeeded: theme.success,
  pending: theme.warn,
  draft: theme.warn,
  processing: theme.warn,
  queued: theme.warn,
  disabled: theme.danger,
  failed: theme.danger,
  canceled: theme.danger,
  cancelled: theme.danger,
  error: theme.danger,
  expired: theme.danger,
  unpaid: theme.danger,
};

const statusColor = (value: string): string | undefined =>
  STATUS_COLOR[value.trim().toLowerCase()];

const CellText = ({
  value,
  selected,
  width,
  numeric,
  status,
}: {
  value: unknown;
  selected: boolean;
  /** Cell (column) width. Numeric cells right-align to it; a selected row's
   * highlight fills it. */
  width?: number;
  /** Right-align (numeric column). */
  numeric?: boolean;
  /** Render string values as a status badge (see STATUS_COLOR). */
  status?: boolean;
}) => {
  const isBool = typeof value === "boolean";
  const raw = isBool ? (value ? "●" : "○") : cell(value);
  const text =
    numeric === true && width !== undefined
      ? raw.length >= width
        ? raw.slice(raw.length - width)
        : raw.padStart(width)
      : selected && width !== undefined
        ? pad(raw, width)
        : raw;
  // The selected row is a brand-purple bar — uniform, no per-cell colour under
  // the highlight.
  if (selected) {
    return (
      <Text
        backgroundColor={theme.selectionBg}
        color={theme.selectionFg}
        wrap="truncate"
      >
        {text}
      </Text>
    );
  }
  if (isBool) {
    return (
      <Text color={value ? theme.success : theme.danger} wrap="truncate">
        {text}
      </Text>
    );
  }
  const badge =
    status === true && typeof value === "string" ? statusColor(value) : undefined;
  if (badge !== undefined) {
    return (
      <Text color={badge} wrap="truncate">
        {text}
      </Text>
    );
  }
  return <Text wrap="truncate">{text}</Text>;
};

/** All columns, identifier/name-ish ones first, then the remaining scalars,
 * with object-valued columns (rendered as JSON previews) last. */
export const tableColumns = (rows: Record<string, unknown>[]): string[] => {
  const first = rows[0] ?? {};
  const keys = Object.keys(first);
  const preferred = ["sku", "id", "name", "title", "code", "email", "status"];
  const ranked = [
    ...preferred.filter((key) => keys.includes(key)),
    ...keys.filter((key) => !preferred.includes(key)),
  ];
  return [
    ...ranked.filter((key) => isScalar(first[key])),
    ...ranked.filter((key) => !isScalar(first[key])),
  ];
};

/** The gateway's list-envelope pagination block, when present. */
export type PageInfo = {
  limit?: number;
  offset?: number;
  total?: number;
  returned?: number;
  hasMore?: boolean;
};

export const parsePageInfo = (data: unknown): PageInfo | null => {
  if (typeof data !== "object" || data === null) return null;
  const page = (data as { page?: unknown }).page;
  if (typeof page !== "object" || page === null) return null;
  const candidate = page as Record<string, unknown>;
  const info: PageInfo = {};
  for (const key of ["limit", "offset", "total", "returned"] as const) {
    if (typeof candidate[key] === "number") info[key] = candidate[key];
  }
  if (typeof candidate.hasMore === "boolean") info.hasMore = candidate.hasMore;
  return Object.keys(info).length > 0 ? info : null;
};

export type TableLayout = {
  columns: string[];
  widths: number[];
  /** Columns scrolled off to the left (the first column stays pinned). */
  hiddenLeft: string[];
  /** Columns that did not fit on the right. */
  hidden: string[];
};

/**
 * Fit columns to the width budget the way the one-shot human table does:
 * natural (content) widths capped at CELL_CAP, keep leading columns while
 * they fit, and report what is hidden on either side. `offset` scrolls the
 * window horizontally — the first (identifier) column stays pinned so rows
 * remain recognizable. The marker column costs 2, each column a 1-wide gap.
 */
export const fitColumns = (
  rows: Record<string, unknown>[],
  budget: number,
  offset = 0,
): TableLayout => {
  const all = tableColumns(rows);
  const scrollable = all.slice(1);
  const clamped = Math.min(
    Math.max(offset, 0),
    Math.max(scrollable.length - 1, 0),
  );
  const candidates = [...all.slice(0, 1), ...scrollable.slice(clamped)];
  const widths: number[] = [];
  let used = 2;
  for (const column of candidates) {
    const natural = Math.min(
      Math.max(
        column.length,
        ...rows.map((row) => cell(row[column]).length),
      ),
      CELL_CAP,
    );
    if (widths.length > 0 && used + natural + 1 > budget) break;
    // The pinned column concedes half the budget so scrolled-in columns
    // always have room to appear next to it.
    widths.push(
      widths.length === 0
        ? Math.min(natural, Math.max(Math.floor(budget / 2), 8))
        : natural,
    );
    used += widths[widths.length - 1] + 1;
  }
  // A wide second column (uuids) must not leave the pinned one alone —
  // admit it clamped to whatever room is left, truncation beats absence.
  const remaining = budget - used - 1;
  if (widths.length === 1 && candidates.length > 1 && remaining >= 8) {
    widths.push(remaining);
  }
  return {
    columns: candidates.slice(0, widths.length),
    widths,
    hiddenLeft: scrollable.slice(0, clamped),
    hidden: candidates.slice(widths.length),
  };
};

const Running = ({ commandLine }: { commandLine: string }) => {
  const spinner = useSpinner();
  return (
    <Box flexDirection="column" paddingX={1} paddingY={1}>
      <Box gap={1}>
        <Text color={theme.accent}>{spinner}</Text>
        <Text wrap="truncate">{commandLine}</Text>
      </Box>
    </Box>
  );
};

const ErrorView = ({ result }: { result: ExecutionResult }) => {
  const message =
    result.error?.message ??
    result.stderr.trim().split("\n").slice(-1)[0] ??
    "Command failed.";
  const tip = authHint(result.error ?? {});
  return (
    <Box flexDirection="column" paddingX={1}>
      <Box gap={1}>
        <Text backgroundColor={theme.danger} color="white" bold>
          {" ERROR "}
        </Text>
        <Text color={theme.danger} wrap="wrap">
          {message}
        </Text>
      </Box>
      {(result.error?.code !== undefined || result.error?.type !== undefined) && (
        <Text dimColor>
          {[
            result.error?.code !== undefined ? `code ${result.error.code}` : null,
            result.error?.type,
          ]
            .filter((part) => part !== null && part !== undefined)
            .join(" · ")}
        </Text>
      )}
      {tip !== null && <Text color={theme.warn}>{tip}</Text>}
    </Box>
  );
};

/** Scrollable plain-text pane for the non-table output formats. */
const TextView = ({
  text,
  scroll,
  maxRows,
}: {
  text: string;
  scroll: number;
  maxRows: number;
}) => {
  const lines = text === "" ? ["(empty)"] : text.split("\n");
  const capacity = Math.max(maxRows, 3);
  const start = Math.min(
    Math.max(scroll, 0),
    Math.max(lines.length - capacity, 0),
  );
  const visible = lines.slice(start, start + capacity);
  return (
    <Box flexDirection="column">
      {start > 0 && <Text dimColor>↑ {start} more</Text>}
      {visible.map((line, index) => (
        <Text key={start + index} wrap="truncate">
          {line === "" ? " " : line}
        </Text>
      ))}
      {start + capacity < lines.length && (
        <Text dimColor>↓ {lines.length - start - capacity} more</Text>
      )}
    </Box>
  );
};

const RowDetail = ({ row }: { row: Record<string, unknown> }) => (
  <Box flexDirection="column">
    {Object.entries(row).map(([key, value]) => (
      <Box key={key} gap={1}>
        <Box width={22} flexShrink={0}>
          <Text dimColor wrap="truncate">
            {key}
          </Text>
        </Box>
        <Text wrap="truncate">{cell(value)}</Text>
      </Box>
    ))}
  </Box>
);

export const Table = ({
  rows,
  cursor,
  detail,
  layout,
  maxRows,
  budget,
}: {
  rows: Record<string, unknown>[];
  cursor: number;
  detail: boolean;
  layout: TableLayout;
  maxRows: number;
  /** Table content width — the selected row fills it so its highlight is a
   * solid edge-to-edge bar (no blanks between/after columns). */
  budget: number;
}) => {
  if (detail && rows[cursor] !== undefined) {
    return <RowDetail row={rows[cursor]} />;
  }
  const { columns, widths, hiddenLeft, hidden } = layout;
  // Numeric columns (never the pinned first one) right-align, header and cells
  // alike — the tabular look from the concept.
  const numericColumns = new Set(
    columns
      .slice(1)
      .filter(
        (column) =>
          rows.some((row) => typeof row[column] === "number") &&
          rows.every(
            (row) => row[column] == null || typeof row[column] === "number",
          ),
      ),
  );
  const capacity = Math.max(maxRows, 3);
  const start = Math.min(
    Math.max(cursor - capacity + 1, 0),
    Math.max(rows.length - capacity, 0),
  );
  const visible = rows.slice(start, start + capacity);
  return (
    <Box flexDirection="column">
      <Box gap={1}>
        {columns.map((column, columnIndex) => {
          const numeric = columnIndex > 0 && numericColumns.has(column);
          const label = column.toUpperCase();
          return (
            <Box
              key={column}
              width={widths[columnIndex] + (columnIndex === 0 ? 2 : 0)}
              flexShrink={0}
            >
              <Text dimColor wrap="truncate">
                {columnIndex === 0
                  ? `  ${label}`
                  : numeric
                    ? label.padStart(widths[columnIndex])
                    : label}
              </Text>
            </Box>
          );
        })}
      </Box>
      {start > 0 && <Text dimColor>↑ {start} more</Text>}
      {visible.map((row, index) => {
        const isSelected = start + index === cursor;
        if (isSelected) {
          // The marker sits in its own fixed 2-cell box so its (possibly
          // double-width in some terminals) glyph can't shift the columns; the
          // rest is one continuous run, padded to fill the highlight bar.
          const line = columns
            .map((column, columnIndex) =>
              cellStr(
                row[column],
                widths[columnIndex],
                numericColumns.has(column),
              ),
            )
            .join(" ");
          return (
            <Box key={start + index}>
              <Box width={2} flexShrink={0}>
                <Text backgroundColor={theme.selectionBg} color={theme.selectionFg} bold>
                  {"» "}
                </Text>
              </Box>
              <Text
                backgroundColor={theme.selectionBg}
                color={theme.selectionFg}
                bold
                wrap="truncate"
              >
                {line.padEnd(budget - 2)}
              </Text>
            </Box>
          );
        }
        return (
          <Box key={start + index} gap={1}>
            {columns.map((column, columnIndex) => {
              const colWidth = widths[columnIndex] + (columnIndex === 0 ? 2 : 0);
              if (columnIndex === 0) {
                // Pad to the column width so the selection bar fills the cell
                // (ink only styles text runs, not the Box).
                const text = `${isSelected ? "» " : "  "}${cell(row[column])}`;
                return (
                  <Box key={column} width={colWidth} flexShrink={0}>
                    <Text
                      backgroundColor={isSelected ? theme.selectionBg : undefined}
                      color={isSelected ? theme.selectionFg : undefined}
                      wrap="truncate"
                    >
                      {isSelected ? text.padEnd(colWidth).slice(0, colWidth) : text}
                    </Text>
                  </Box>
                );
              }
              return (
                <Box key={column} width={colWidth} flexShrink={0}>
                  <CellText
                    value={row[column]}
                    selected={isSelected}
                    width={colWidth}
                    numeric={numericColumns.has(column)}
                    status={isStatusColumn(column)}
                  />
                </Box>
              );
            })}
          </Box>
        );
      })}
      {start + capacity < rows.length && (
        <Text dimColor>↓ {rows.length - start - capacity} more</Text>
      )}
      {(hidden.length > 0 || hiddenLeft.length > 0) && (
        <Text dimColor wrap="truncate">
          {hiddenLeft.length > 0 ? `\u2039 ${hiddenLeft.length}  ` : ""}
          {hidden.length > 0
            ? `${hidden.length} more: ${hidden.join(", ")} \u203A  `
            : ""}
          {"\u2190\u2192 scroll"}
        </Text>
      )}
    </Box>
  );
};

export const Results = ({
  state,
  title,
  width,
  canPage,
  canEdit,
  active = true,
  canUpdate = false,
  canDelete = false,
  canCreate = false,
  onPage,
  onEdit,
  onCreate,
  onUpdate,
  onDelete,
  onClose,
}: {
  state: RunState;
  /** Command path shown in the panel's top border. */
  title: string;
  /** Total panel width — the table budgets its columns against it. */
  width: number;
  /** Whether the executed command supports limit/offset paging. */
  canPage: boolean;
  /** Whether the command has parameters `e` can focus the sidebar for. */
  canEdit: boolean;
  /** Keyboard focus — the parameter sidebar may own the keys instead. */
  active?: boolean;
  /** Whether this resource has an update command `u` can jump to. */
  canUpdate?: boolean;
  /** Whether this resource has a delete command `d` can jump to. */
  canDelete?: boolean;
  /** Whether this resource has a create command `c` can jump to. */
  canCreate?: boolean;
  onPage: (direction: 1 | -1) => void;
  onEdit: () => void;
  /** Open the sibling create form (row-independent). */
  onCreate?: () => void;
  /** Jump to the update form for the current record (raw, un-humanized). */
  onUpdate?: (record: Record<string, unknown>) => void;
  /** Jump to the (confirm-gated) delete for the current record. */
  onDelete?: (record: Record<string, unknown>) => void;
  onClose: () => void;
}) => {
  const [cursor, setCursor] = useState(0);
  const [detail, setDetail] = useState(false);
  const [format, setFormat] = useState<OutputFormat>("table");
  /** In-table filter over the loaded rows. `filtering` = the query line has
   * focus (typing narrows live); once committed with Enter the filter stays
   * applied while the normal row keys (c/o/u/d/⏎) act on the matches. */
  const [filter, setFilter] = useState("");
  const [filtering, setFiltering] = useState(false);
  /** Horizontal column scroll (first column stays pinned). */
  const [columnOffset, setColumnOffset] = useState(0);
  const [scroll, setScroll] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);

  // The copy confirmation fades after a moment.
  useEffect(() => {
    if (copied === null) return;
    const timer = setTimeout(() => setCopied(null), 2500);
    return () => clearTimeout(timer);
  }, [copied]);
  const { rows: terminalRows } = useTerminalSize();
  // Panel border + padding take 4 columns of the pane's width.
  const tableBudget = width - 4;

  // Raw rows drive the `u`→update jump (real values); the humanized copy is
  // only for display (relative-free absolute dates).
  const rawRows =
    state.status === "done" && state.result.ok
      ? extractItems(state.result.data)
      : [];
  const rows = rawRows.map(humanizeRow);
  // Client-side filter over the loaded page: keep a row if any cell contains
  // the query. `view*` are the filtered lists the cursor/actions index into.
  const token = filter.trim().toLowerCase();
  const matchIndices = rows
    .map((_, index) => index)
    .filter(
      (index) =>
        token === "" ||
        Object.values(rows[index]).some((value) =>
          (typeof value === "object" && value !== null
            ? JSON.stringify(value)
            : String(value ?? "")
          )
            .toLowerCase()
            .includes(token),
        ),
    );
  const viewRows = matchIndices.map((index) => rows[index]);
  const viewRaw = matchIndices.map((index) => rawRows[index]);
  const layout = fitColumns(viewRows, tableBudget, columnOffset);

  useInput(
    (input, key) => {
    // While the filter line has focus, keystrokes edit the query (↑↓ still
    // move the selection through the matches); Enter commits, Esc clears.
    if (filtering) {
      if (key.return) {
        setFiltering(false);
        return;
      }
      if (key.escape) {
        setFilter("");
        setFiltering(false);
        setCursor(0);
        return;
      }
      if (key.upArrow) {
        setCursor((current) => Math.max(current - 1, 0));
        return;
      }
      if (key.downArrow) {
        setCursor((current) =>
          Math.min(current + 1, Math.max(viewRows.length - 1, 0)),
        );
        return;
      }
      if (key.backspace || key.delete) {
        setFilter((current) => current.slice(0, -1));
        setCursor(0);
        return;
      }
      if (input !== "" && !key.ctrl && !key.meta && !key.tab) {
        setFilter((current) => current + input);
        setCursor(0);
      }
      return;
    }
    if (key.escape) {
      if (detail) {
        setDetail(false);
        return;
      }
      // Esc drops an applied filter before it closes the results view.
      if (filter !== "") {
        setFilter("");
        setCursor(0);
        return;
      }
      onClose();
      return;
    }
    if (input === "q") {
      if (detail) {
        setDetail(false);
        return;
      }
      onClose();
      return;
    }
    if (state.status !== "done") return;
    if (input === "/" && state.result.ok && format === "table") {
      setFiltering(true);
      return;
    }
    if (canCreate && onCreate !== undefined && input === "c") {
      // `c` jumps to the sibling create form — deliberately row-independent,
      // so it works from an empty list too.
      onCreate();
      return;
    }
    if (input === "y" || input === "Y") {
      // `y` yanks the focused item — the row under the cursor in a table, or
      // the drilled-into item in any format; `Y` (and any list view / failure)
      // copies the whole output in the current format.
      const copyFormat = format === "table" ? "json" : format;
      const focused =
        state.result.ok && viewRaw.length > 0 && (format === "table" || detail)
          ? viewRaw[Math.min(cursor, viewRaw.length - 1)]
          : undefined;
      if (input === "y" && focused !== undefined) {
        void copyToClipboard(formatData(focused, copyFormat)).then((ok) =>
          setCopied(ok ? `✓ copied item as ${copyFormat}` : "copy failed"),
        );
        return;
      }
      const text = state.result.ok
        ? formatResult(state.result, copyFormat)
        : state.result.stderr.trim() ||
          (state.result.error?.message ?? "");
      void copyToClipboard(text).then((ok) =>
        setCopied(
          ok
            ? `✓ copied as ${state.result.ok ? copyFormat : "error text"}`
            : "copy failed",
        ),
      );
      return;
    }
    if (input === "o" && state.result.ok) {
      // Cycle the rendering like -o/--output would, without re-running. Keep
      // the detail focus: if a row is drilled into, cycling formats shows just
      // that item; on the list itself it cycles the whole collection.
      setFormat(
        (current) =>
          OUTPUT_FORMATS[
            (OUTPUT_FORMATS.indexOf(current) + 1) % OUTPUT_FORMATS.length
          ],
      );
      setScroll(0);
      return;
    }
    if (key.upArrow) {
      if (format !== "table") {
        setScroll((current) => Math.max(current - 1, 0));
      } else {
        setCursor((current) => Math.max(current - 1, 0));
      }
      return;
    }
    if (key.downArrow) {
      if (format !== "table") {
        setScroll((current) => current + 1);
      } else {
        setCursor((current) =>
          Math.min(current + 1, Math.max(viewRows.length - 1, 0)),
        );
      }
      return;
    }
    if (key.pageUp || key.pageDown) {
      // Page by the visible table height (Ink doesn't surface Home/End, so
      // PgUp/PgDn to run to the ends of a long page of rows / raw output).
      const page = Math.max(terminalRows - TABLE_CHROME_ROWS, 3);
      if (format !== "table") {
        setScroll((current) =>
          key.pageUp ? Math.max(current - page, 0) : current + page,
        );
      } else {
        setCursor((current) =>
          key.pageUp
            ? Math.max(current - page, 0)
            : Math.min(current + page, Math.max(viewRows.length - 1, 0)),
        );
      }
      return;
    }
    if (key.return && format === "table" && viewRows.length > 0) {
      setDetail(true);
      return;
    }
    if (key.rightArrow && format === "table" && !detail && layout.hidden.length > 0) {
      setColumnOffset((current) => current + 1);
      return;
    }
    if (key.leftArrow && format === "table" && !detail && columnOffset > 0) {
      setColumnOffset((current) => Math.max(current - 1, 0));
      return;
    }
    if (canPage && (input === "n" || input === "p")) {
      setCursor(0);
      setScroll(0);
      setDetail(false);
      onPage(input === "n" ? 1 : -1);
      return;
    }
    if (canEdit && input === "e") {
      onEdit();
      return;
    }
    if (
      (canUpdate && onUpdate !== undefined && input === "u") ||
      (canDelete && onDelete !== undefined && input === "d")
    ) {
      // Jump to update/delete, targeting the record under the cursor (table)
      // or the single object on screen (a get result).
      const record =
        viewRaw.length > 0
          ? viewRaw[Math.min(cursor, viewRaw.length - 1)]
          : typeof state.result.data === "object" && state.result.data !== null
            ? (state.result.data as Record<string, unknown>)
            : undefined;
      if (record === undefined) return;
      if (input === "u") onUpdate?.(record);
      else onDelete?.(record);
    }
    },
    { isActive: active },
  );

  if (state.status === "running") {
    return (
      <Panel title={title} focused={active} width={width}>
        <Running commandLine={state.commandLine} />
      </Panel>
    );
  }

  const { result } = state;
  // A row is drilled into (Enter on a table row): every format then shows just
  // that one item, not the whole collection.
  const inItemDetail = detail && viewRaw.length > 0;
  const selectedRaw = inItemDetail
    ? viewRaw[Math.min(cursor, viewRaw.length - 1)]
    : undefined;
  const filterActive = filtering || filter !== "";
  // The copy confirmation lives in the bottom border (coloured, so it's still
  // prominent) — no content row, so a table never gains a blank line.
  const footer =
    copied ??
    (result.ok ? `${inItemDetail ? "item · " : ""}o: ${format}` : "error");
  const footerColor =
    copied === null
      ? undefined
      : copied.startsWith("✓")
        ? theme.success
        : theme.danger;
  const contentRows = terminalRows - TABLE_CHROME_ROWS;
  return (
    <Panel
      title={title}
      footer={footer}
      footerColor={footerColor}
      focused={active}
      width={width}
    >
      {/* First line: the filter bar. Lists always show it — as the live query
          when active, otherwise as a dim `/` affordance — so filtering is
          discoverable on every list. Non-filterable views (errors, single
          records, raw formats) keep a blank spacer of the same height, so the
          table budget is unchanged. */}
      {filterActive ? (
        <Box>
          <Text color={theme.accent}>{"⌕ "}</Text>
          <Text>{filter}</Text>
          {filtering && <Text inverse> </Text>}
          <Text dimColor>
            {"  "}
            {viewRows.length}/{rows.length}
          </Text>
        </Box>
      ) : result.ok && format === "table" && rows.length > 0 ? (
        <Box>
          <Text dimColor>{"⌕ / to filter rows"}</Text>
        </Box>
      ) : (
        <Box height={1} />
      )}
      {!result.ok ? (
        <ErrorView result={result} />
      ) : format !== "table" ? (
        <TextView
          text={
            selectedRaw !== undefined
              ? formatData(selectedRaw, format)
              : formatResult(result, format)
          }
          scroll={scroll}
          maxRows={contentRows}
        />
      ) : viewRows.length > 0 ? (
        <Table
          rows={viewRows}
          cursor={Math.min(cursor, viewRows.length - 1)}
          detail={detail}
          layout={layout}
          maxRows={contentRows}
          budget={tableBudget}
        />
      ) : filter !== "" ? (
        <Text dimColor>No rows match “{filter}”. Esc clears the filter.</Text>
      ) : isCollection(result.data) ? (
        <Text dimColor>
          No records.{canPage ? " n/p to page · e to change filters." : ""}
        </Text>
      ) : typeof result.data === "object" && result.data !== null ? (
        <RowDetail row={humanizeRow(result.data as Record<string, unknown>)} />
      ) : (
        <Text>{result.stdout.trim() || "(empty response)"}</Text>
      )}
    </Panel>
  );
};
