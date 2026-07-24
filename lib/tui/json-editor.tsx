/**
 * Structured editor for an `object`-typed form field (DX-118): the gateway's
 * write commands take a freeform `--data` JSON body, which the flat form can
 * only edit as a single line. This opens a full-pane key/value editor where
 * fields are added, edited and removed on the fly, then serialised back to a
 * compact JSON string.
 *
 * Nested JSON is edited in place: a value that is itself an object or array
 * shows as `{ n fields }` / `[ n items ]` and drills into the same editor one
 * level deeper (breadcrumb `data › meta › [0]`), unlimited depth. The editor
 * keeps a stack of scopes; esc pops a level (folding the child back into its
 * parent) and cancels at the root. Leaf values are entered as JSON (`"text"`,
 * `42`, `true`, `null`) so the whole body round-trips exactly; type `{}` or
 * `[]` into a value to start a nested container.
 *
 * Keys: ⏎ add field / append item (or drill into a nested value), → drill into
 * a nested value, tab switch key/value cell, ^d delete, ^s save, esc back.
 */
import { useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import { useTerminalSize } from "./terminal.js";
import { theme } from "./theme.js";

interface Row {
  /** Stable identity so React keys survive reordering/inserts. */
  id: number;
  /** Object member name; unused (index shown instead) in array scopes. */
  key: string;
  /** Raw JSON source for the value: a scalar (`"blue"`, `42`) or a nested
   * container source (`{"a":1}`, `[1,2]`) drilled into on demand. */
  value: string;
}

type Kind = "object" | "array";

interface Frame {
  /** Breadcrumb label: the parent key, or `[i]` when drilled into an array. */
  label: string;
  kind: Kind;
  rows: Row[];
  /** Parent row index this frame was drilled from — where it folds back. */
  originRow?: number;
}

/** Rows the pane spends on chrome: app header (3), status bar (1), pane
 * border (2), title (1), description (1), scroll indicators (2), footer
 * validity + hints (3). */
const EDITOR_CHROME_ROWS = 14;

let entrySeq = 0;
const nextId = (): number => (entrySeq += 1);

/** Parse a JSON string into editable rows. A well-formed object seeds one row
 * per key (value shown as its JSON source); anything else starts empty. */
export const parseEntries = (initial: string): Row[] => {
  const text = (initial ?? "").trim();
  if (text === "") return [];
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
      return Object.entries(parsed as Record<string, unknown>).map(
        ([key, value]) => ({ id: nextId(), key, value: JSON.stringify(value) }),
      );
    }
  } catch {
    // Not an object — start blank rather than lose the cursor in a text blob.
  }
  return [];
};

/** Editable rows for an already-parsed container value (used when drilling). */
const rowsFromValue = (value: unknown): Row[] =>
  Array.isArray(value)
    ? value.map((item) => ({ id: nextId(), key: "", value: JSON.stringify(item) }))
    : Object.entries(value as Record<string, unknown>).map(([key, item]) => ({
        id: nextId(),
        key,
        value: JSON.stringify(item),
      }));

/** A one-line summary when the source is a JSON container, else null (leaf). */
export const containerSummary = (source: string): string | null => {
  const text = source.trim();
  if (text === "") return null;
  try {
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      return `[ ${parsed.length} item${parsed.length === 1 ? "" : "s"} ]`;
    }
    if (parsed !== null && typeof parsed === "object") {
      const count = Object.keys(parsed as Record<string, unknown>).length;
      return `{ ${count} field${count === 1 ? "" : "s"} }`;
    }
  } catch {
    return null;
  }
  return null;
};

const isContainer = (source: string): boolean => containerSummary(source) !== null;

/** null when every row is valid; otherwise a one-line reason for the footer. */
export const validateEntries = (rows: Row[]): string | null => {
  const seen = new Set<string>();
  for (let index = 0; index < rows.length; index += 1) {
    const { key, value } = rows[index];
    if (key.trim() === "") return `field ${index + 1}: empty key`;
    if (seen.has(key)) return `duplicate key "${key}"`;
    seen.add(key);
    try {
      JSON.parse(value.trim() === "" ? "null" : value);
    } catch {
      return `field ${index + 1} (${key}): value is not JSON`;
    }
  }
  return null;
};

const validateFrame = (frame: Frame): string | null => {
  if (frame.kind === "object") return validateEntries(frame.rows);
  for (let index = 0; index < frame.rows.length; index += 1) {
    try {
      JSON.parse(frame.rows[index].value.trim() === "" ? "null" : frame.rows[index].value);
    } catch {
      return `item ${index}: value is not JSON`;
    }
  }
  return null;
};

/** Serialise a scope to compact JSON: object → `{…}`, array → `[…]`. */
export const serializeEntries = (rows: Row[]): string => {
  const object: Record<string, unknown> = {};
  for (const { key, value } of rows) {
    object[key] = JSON.parse(value.trim() === "" ? "null" : value);
  }
  return JSON.stringify(object);
};

const serializeFrame = (frame: Frame): string =>
  frame.kind === "object"
    ? serializeEntries(frame.rows)
    : JSON.stringify(
        frame.rows.map((row) =>
          JSON.parse(row.value.trim() === "" ? "null" : row.value),
        ),
      );

/** Fold every child scope back into its parent and return the root JSON, or
 * null if any scope is invalid (blocking a save). */
const collapse = (stack: Frame[]): string | null => {
  const frames = stack.map((frame) => ({ ...frame, rows: [...frame.rows] }));
  for (let index = frames.length - 1; index > 0; index -= 1) {
    if (validateFrame(frames[index]) !== null) return null;
    const source = serializeFrame(frames[index]);
    const origin = frames[index].originRow ?? 0;
    const parent = frames[index - 1];
    parent.rows = parent.rows.map((row, rowIndex) =>
      rowIndex === origin ? { ...row, value: source } : row,
    );
  }
  if (validateFrame(frames[0]) !== null) return null;
  return serializeFrame(frames[0]);
};

/** The focused text cell with a block cursor, mirroring the form's fields. */
const Cell = ({
  text,
  focused,
  caret,
  placeholder,
}: {
  text: string;
  focused: boolean;
  caret: number;
  placeholder: string;
}) => {
  if (!focused) {
    return text === "" ? (
      <Text dimColor>{placeholder}</Text>
    ) : (
      <Text wrap="truncate">{text}</Text>
    );
  }
  const at = Math.min(Math.max(caret, 0), text.length);
  return (
    <Text wrap="truncate">
      <Text color={theme.accent}>{text.slice(0, at)}</Text>
      <Text inverse>{text.slice(at, at + 1) || " "}</Text>
      <Text color={theme.accent}>{text.slice(at + 1)}</Text>
    </Text>
  );
};

export const JsonObjectEditor = ({
  name,
  description,
  initial,
  onSave,
  onCancel,
}: {
  /** Spec parameter name, e.g. `data`. */
  name: string;
  description?: string;
  /** Current field value — a JSON string, or "" for a fresh body. */
  initial: string;
  onSave: (value: string) => void;
  onCancel: () => void;
}) => {
  const { rows: terminalRows } = useTerminalSize();
  const [frames, setFramesState] = useState<Frame[]>(() => [
    { label: name, kind: "object", rows: parseEntries(initial) },
  ]);
  const [row, setRowState] = useState(0);
  const [column, setColumnState] = useState<"key" | "value">("key");
  // Input handlers read/write these refs: key events can outpace renders and
  // the state closures would then be stale, dropping keystrokes.
  const framesRef = useRef(frames);
  const rowRef = useRef(0);
  const columnRef = useRef<"key" | "value">("key");
  const caretRef = useRef(0);
  const [caret, setCaretState] = useState(0);

  const setFrames = (next: Frame[]): void => {
    framesRef.current = next;
    setFramesState(next);
  };
  const setCaret = (pos: number): void => {
    caretRef.current = pos;
    setCaretState(pos);
  };
  const setRow = (next: number): void => {
    rowRef.current = next;
    setRowState(next);
  };
  const setColumn = (next: "key" | "value"): void => {
    columnRef.current = next;
    setColumnState(next);
  };

  const top = (): Frame => framesRef.current[framesRef.current.length - 1];
  /** Effective column: array scopes have no key cell. */
  const effColumn = (frame: Frame): "key" | "value" =>
    frame.kind === "array" ? "value" : columnRef.current;

  const cellText = (frame: Frame, rowIndex: number, col: "key" | "value"): string => {
    const target = frame.rows[rowIndex];
    if (target === undefined) return "";
    return col === "key" ? target.key : target.value;
  };

  const focusCell = (nextRow: number, nextColumn: "key" | "value"): void => {
    const frame = top();
    const col = frame.kind === "array" ? "value" : nextColumn;
    setRow(nextRow);
    setColumn(col);
    const text = cellText(frame, nextRow, col);
    setCaret(isContainer(col === "value" ? text : "") ? 0 : text.length);
  };

  const replaceTopRows = (rows: Row[]): void => {
    const stack = framesRef.current;
    setFrames([...stack.slice(0, -1), { ...stack[stack.length - 1], rows }]);
  };

  const addRow = (): void => {
    const frame = top();
    const at = frame.rows.length === 0 ? 0 : rowRef.current + 1;
    const rows = [
      ...frame.rows.slice(0, at),
      { id: nextId(), key: "", value: "" },
      ...frame.rows.slice(at),
    ];
    replaceTopRows(rows);
    focusCell(at, frame.kind === "array" ? "value" : "key");
  };

  const deleteRow = (): void => {
    const frame = top();
    if (frame.rows.length === 0) return;
    const rows = frame.rows.filter((_, index) => index !== rowRef.current);
    replaceTopRows(rows);
    focusCell(Math.max(0, Math.min(rowRef.current, rows.length - 1)), "key");
  };

  const setCell = (text: string): void => {
    const frame = top();
    const col = effColumn(frame);
    const rows = frame.rows.map((entry, index) =>
      index === rowRef.current ? { ...entry, [col]: text } : entry,
    );
    replaceTopRows(rows);
  };

  /** Descend into the focused value if it is a nested object or array. */
  const drill = (): void => {
    const frame = top();
    const source = frame.rows[rowRef.current]?.value ?? "";
    if (!isContainer(source)) return;
    const parsed = JSON.parse(source) as unknown;
    const kind: Kind = Array.isArray(parsed) ? "array" : "object";
    const label =
      frame.kind === "array"
        ? `[${rowRef.current}]`
        : frame.rows[rowRef.current].key || "(field)";
    setFrames([
      ...framesRef.current,
      { label, kind, rows: rowsFromValue(parsed), originRow: rowRef.current },
    ]);
    focusCell(0, kind === "array" ? "value" : "key");
  };

  /** Fold the current scope back into its parent (esc), or cancel at root. */
  const back = (): void => {
    const stack = framesRef.current;
    if (stack.length <= 1) {
      onCancel();
      return;
    }
    const child = stack[stack.length - 1];
    if (validateFrame(child) !== null) return; // fix or delete before leaving
    const source = serializeFrame(child);
    const origin = child.originRow ?? 0;
    const parent = stack[stack.length - 2];
    const rows = parent.rows.map((entry, index) =>
      index === origin ? { ...entry, value: source } : entry,
    );
    setFrames([...stack.slice(0, -2), { ...parent, rows }]);
    setRow(origin);
    setColumn("value");
    setCaret(0);
  };

  const save = (): void => {
    const result = collapse(framesRef.current);
    if (result !== null) onSave(result);
  };

  useInput((input, key) => {
    if (key.escape) {
      back();
      return;
    }
    if (key.ctrl && (input === "s" || input === "S")) {
      save();
      return;
    }
    if (key.ctrl && (input === "d" || input === "D")) {
      deleteRow();
      return;
    }
    const frame = top();
    const col = effColumn(frame);
    const source = frame.rows[rowRef.current]?.value ?? "";
    const onContainerValue = col === "value" && isContainer(source);
    if (key.return) {
      if (onContainerValue) drill();
      else addRow();
      return;
    }
    if (key.tab) {
      if (frame.kind === "object") {
        focusCell(rowRef.current, col === "key" ? "value" : "key");
      }
      return;
    }
    if (key.upArrow) {
      focusCell(Math.max(rowRef.current - 1, 0), col);
      return;
    }
    if (key.downArrow) {
      focusCell(Math.min(rowRef.current + 1, frame.rows.length - 1), col);
      return;
    }
    if (key.rightArrow && onContainerValue) {
      drill();
      return;
    }
    if (frame.rows.length === 0) return;
    if (onContainerValue) return; // a container value is edited by drilling in
    const current = col === "key" ? frame.rows[rowRef.current].key : source;
    const pos = Math.min(caretRef.current, current.length);
    if (key.leftArrow) {
      setCaret(Math.max(pos - 1, 0));
      return;
    }
    if (key.rightArrow) {
      setCaret(Math.min(pos + 1, current.length));
      return;
    }
    if (key.backspace || key.delete) {
      if (pos > 0) {
        setCell(current.slice(0, pos - 1) + current.slice(pos));
        setCaret(pos - 1);
      }
      return;
    }
    if (input !== "" && !key.ctrl && !key.meta) {
      setCell(current.slice(0, pos) + input + current.slice(pos));
      setCaret(pos + input.length);
    }
  });

  const frame = top();
  const isArray = frame.kind === "array";
  const activeColumn = effColumn(frame);
  const problem = validateFrame(frame);
  const crumb = framesRef.current.map((entry) => entry.label).join(" › ");
  const nested = framesRef.current.length > 1;
  const keyWidth = isArray
    ? Math.max(4, `[${Math.max(frame.rows.length - 1, 0)}]`.length)
    : Math.min(Math.max(12, ...frame.rows.map((entry) => entry.key.length + 1)), 24);
  // Sliding window over the rows so the whole scope is reachable with ↑↓.
  const capacity = Math.max(terminalRows - EDITOR_CHROME_ROWS, 4);
  const start = Math.min(
    Math.max(row - capacity + 1, 0),
    Math.max(frame.rows.length - capacity, 0),
  );
  const visible = frame.rows.slice(start, start + capacity);

  return (
    <Box flexDirection="column" flexGrow={1}>
      <Box gap={1} justifyContent="space-between">
        <Text color={theme.accent} wrap="truncate">
          Edit {crumb}
        </Text>
        <Text dimColor>
          {isArray
            ? `${frame.rows.length} item${frame.rows.length === 1 ? "" : "s"}`
            : `${frame.rows.length} field${frame.rows.length === 1 ? "" : "s"}`}
        </Text>
      </Box>
      {!nested && description !== undefined && description !== "" && (
        <Text dimColor wrap="truncate">
          {description}
        </Text>
      )}
      <Box flexDirection="column" paddingTop={1}>
        {start > 0 && <Text dimColor>↑ {start} more</Text>}
        {frame.rows.length === 0 && (
          <Text dimColor>
            {isArray
              ? "empty — press ⏎ to append an item"
              : "no fields yet — press ⏎ to add one"}
          </Text>
        )}
        {visible.map((entry, index) => {
          const at = start + index;
          const selected = at === row;
          const valueContainer = isContainer(entry.value);
          const onValue = selected && activeColumn === "value";
          return (
            <Box key={entry.id} gap={1}>
              <Box width={2} flexShrink={0}>
                {selected ? (
                  <Text color={theme.accent} bold>
                    {"» "}
                  </Text>
                ) : (
                  <Text> </Text>
                )}
              </Box>
              <Box width={keyWidth} flexShrink={0}>
                {isArray ? (
                  <Text dimColor>[{at}]</Text>
                ) : (
                  <Cell
                    text={entry.key}
                    focused={selected && activeColumn === "key"}
                    caret={caret}
                    placeholder="key"
                  />
                )}
              </Box>
              <Text dimColor>:</Text>
              <Box flexGrow={1}>
                {valueContainer ? (
                  <Text color={onValue ? theme.accent : undefined}>
                    {containerSummary(entry.value)}
                    {onValue && <Text dimColor> → edit</Text>}
                  </Text>
                ) : (
                  <Cell
                    text={entry.value}
                    focused={onValue}
                    caret={caret}
                    placeholder="value (JSON)"
                  />
                )}
              </Box>
            </Box>
          );
        })}
        {start + capacity < frame.rows.length && (
          <Text dimColor>↓ {frame.rows.length - start - capacity} more</Text>
        )}
      </Box>
      <Box paddingTop={1} flexDirection="column">
        {problem === null ? (
          <Text color={theme.success} wrap="truncate">
            ✓ {serializeFrame(frame)}
          </Text>
        ) : (
          <Text color={theme.danger} wrap="truncate">
            ✗ {problem}
          </Text>
        )}
        <Text dimColor wrap="truncate">
          {isArray ? "⏎ add item" : "⏎ add field"} · → edit nested ·
          {isArray ? "" : " tab key/value ·"} ^d delete · ^s save ·{" "}
          {nested ? "esc back" : "esc cancel"}
        </Text>
      </Box>
    </Box>
  );
};
