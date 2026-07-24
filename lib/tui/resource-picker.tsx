/**
 * Table picker for a resource-ID form field (DX-118): candidates come from the
 * parameter's paired list endpoint and are shown as the real list table (all
 * columns), filtered as you type — the same view and filter as a list result.
 * When the endpoint supports a `search` parameter, typing re-queries the
 * gateway (debounced) so any record is findable; otherwise the query filters
 * the loaded page client-side. Enter picks the highlighted row's id; with no
 * match the typed text is used verbatim so an exact id never dead-ends; esc
 * falls back to manual typing.
 */
import { useEffect, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useTerminalSize } from "./terminal.js";
import { theme } from "./theme.js";
import { Table, humanizeRow, fitColumns } from "./results.js";
import type { ResourceRecord } from "../interactive.js";

/** Rows around the candidate table: app header (3), status bar (1), pane
 * border (2), pane title (1), "Search …" line (1), description (1), query
 * line (1), spacer (1), table header (1), no-search notice (1). */
const PICKER_CHROME_ROWS = 13;
/** Pause after the last keystroke before a server-side search fires. */
const SEARCH_DEBOUNCE_MS = 250;

export const ResourcePicker = ({
  name,
  description,
  searchable,
  width,
  load,
  onPick,
  onCancel,
}: {
  /** Spec parameter name, e.g. `product_id`. */
  name: string;
  /** Spec description, shown like the one-shot prompt's message line. */
  description?: string;
  /** True when the list endpoint accepts a `search` query parameter. */
  searchable: boolean;
  /** Pane width — the table budgets its columns against it. */
  width: number;
  load: (query: string) => Promise<ResourceRecord[]>;
  onPick: (value: string) => void;
  onCancel: () => void;
}) => {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const { rows: terminalRows } = useTerminalSize();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<ResourceRecord[]>([]);
  /** Monotonic fetch id — a stale response never overwrites a newer one. */
  const fetchSeq = useRef(0);

  const fetchRecords = (nextQuery: string): void => {
    const id = ++fetchSeq.current;
    setLoading(true);
    void load(nextQuery).then((entries) => {
      if (fetchSeq.current === id) {
        setRecords(entries);
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    if (!searchable) {
      fetchRecords("");
      return;
    }
    // Server-side search: initial load immediately, then re-query as the user
    // types, debounced against keystroke bursts.
    const timer = setTimeout(
      () => fetchRecords(query),
      query === "" ? 0 : SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(timer);
  }, [query, searchable]);

  // Server search already narrows; otherwise filter the loaded rows here (same
  // any-column substring match as a list result's `/` filter).
  const token = query.trim().toLowerCase();
  const filtered =
    searchable || token === ""
      ? records
      : records.filter((record) =>
          Object.values(record.row).some((value) =>
            (typeof value === "object" && value !== null
              ? JSON.stringify(value)
              : String(value ?? "")
            )
              .toLowerCase()
              .includes(token),
          ),
        );
  const selected = Math.min(cursor, Math.max(filtered.length - 1, 0));

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    if (key.return) {
      if (filtered[selected] !== undefined) {
        onPick(filtered[selected].value);
      } else if (query.trim() !== "" && !loading) {
        // Nothing matches, but the user typed something — take it verbatim so
        // a known id beyond the fetched page still works.
        onPick(query.trim());
      }
      return;
    }
    if (key.upArrow) {
      setCursor(Math.max(selected - 1, 0));
      return;
    }
    if (key.downArrow) {
      setCursor(Math.min(selected + 1, Math.max(filtered.length - 1, 0)));
      return;
    }
    if (key.pageUp || key.pageDown) {
      const page = Math.max(terminalRows - PICKER_CHROME_ROWS, 3);
      setCursor(
        key.pageUp
          ? Math.max(selected - page, 0)
          : Math.min(selected + page, Math.max(filtered.length - 1, 0)),
      );
      return;
    }
    if (key.backspace || key.delete) {
      setQuery((current) => current.slice(0, -1));
      setCursor(0);
      return;
    }
    if (input !== "" && !key.ctrl && !key.meta && !key.tab) {
      setQuery((current) => current + input);
      setCursor(0);
    }
  });

  const rows = filtered.map((record) => humanizeRow(record.row));
  const budget = Math.max(width - 4, 10);
  const layout = fitColumns(rows, budget, 0);
  const maxRows = Math.max(terminalRows - PICKER_CHROME_ROWS, 3);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box gap={1} justifyContent="space-between">
        <Text color={theme.accent}>Search {name}</Text>
        {!loading && (
          <Text dimColor>
            {filtered.length}
            {searchable ? "" : `/${records.length}`}
          </Text>
        )}
      </Box>
      {description !== undefined && description !== "" && (
        <Text dimColor wrap="truncate">
          {description}
        </Text>
      )}
      <Box>
        <Text color={theme.accent}>{"⌕ "}</Text>
        <Text>{query}</Text>
        <Text inverse> </Text>
      </Box>
      <Box flexDirection="column" paddingTop={1}>
        {loading && <Text dimColor>loading candidates…</Text>}
        {!loading && rows.length > 0 && (
          <Table
            rows={rows}
            cursor={selected}
            detail={false}
            layout={layout}
            maxRows={maxRows}
            budget={budget}
          />
        )}
        {!loading && rows.length === 0 && (
          <Text dimColor>
            {query.trim() === ""
              ? "no candidates — esc to type the value manually"
              : "no match — enter uses what you typed, esc to cancel"}
          </Text>
        )}
      </Box>
      {!searchable && !loading && (
        <Text dimColor>
          filtering the first {records.length} records — this endpoint has no
          server-side search
        </Text>
      )}
    </Box>
  );
};
