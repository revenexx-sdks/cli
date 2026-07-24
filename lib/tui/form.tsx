/**
 * Auto-generated command form (DX-118 workstream 4): renders a PromptSpec
 * list as an editable form — required fields first, enum values cycled with
 * ←/→, booleans toggled, secrets masked while typing. Submitting validates
 * and builds the exact one-shot invocation; execution inside the TUI lands
 * with the result-view workstream.
 */
import { useEffect, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import { EXECUTABLE_NAME } from "../constants.js";
import {
  listResourceRecords,
  type PromptSpec,
  type ResourceRecord,
} from "../interactive.js";
import { ResourcePicker } from "./resource-picker.js";
import { JsonObjectEditor } from "./json-editor.js";
import { Panel, Button } from "./panel.js";
import { theme } from "./theme.js";
import { useTerminalSize } from "./terminal.js";

/** Sliding window: fields shown at once on short terminals. */
const MAX_FIELDS = 12;

export type FormValues = Record<string, string>;

/** Flag token from the spec's option syntax: `--family-id <family-id>`. */
const flagFor = (spec: PromptSpec): string => spec.option.split(" ")[0];

const shellQuote = (value: string): string =>
  /[^A-Za-z0-9@%+=:,./_-]/.test(value) ? `'${value.replaceAll("'", "'\\''")}'` : value;

/**
 * The argv tokens this form's values produce (no shell quoting — these go
 * straight to commander's parse, not through a shell). Booleans emit the bare
 * flag when true and nothing otherwise; arrays pass comma/space-separated
 * values as variadic arguments.
 */
const splitList = (value: string): string[] =>
  value
    .split(/[,\s]+/)
    .map((item) => item.trim())
    .filter((item) => item !== "");

export const buildArgv = (
  path: string[],
  specs: PromptSpec[],
  values: FormValues,
): string[] => {
  // Positional arguments come first (in declared order), then options — the
  // shape commander parses for e.g. `skills add <repo> <name> [--flags]`.
  const positional: string[] = [];
  const options: string[] = [];
  for (const spec of specs) {
    const value = (values[spec.key] ?? "").trim();
    if (value === "") continue;
    if (spec.positional === true) {
      if (spec.variadic === true) positional.push(...splitList(value));
      else positional.push(value);
      continue;
    }
    if (spec.type === "boolean") {
      if (value !== "true" && value !== "false") continue;
      // Body booleans declare a value (`--enabled <enabled>` / `[value]`), so
      // emit it explicitly — `false` must be sent, not omitted. A plain switch
      // (`--force`, no placeholder) only appears when true.
      if (/[<[]/.test(spec.option)) {
        options.push(flagFor(spec), value);
      } else if (value === "true") {
        options.push(flagFor(spec));
      }
      continue;
    }
    if (spec.type === "array") {
      const items = splitList(value);
      if (items.length > 0) options.push(flagFor(spec), ...items);
      continue;
    }
    options.push(flagFor(spec), value);
  }
  return [...path, ...positional, ...options];
};

export const validateField = (
  spec: PromptSpec,
  raw: string | undefined,
): string | null => {
  const value = (raw ?? "").trim();
  if (value === "") {
    return spec.required ? "required" : null;
  }
  switch (spec.type) {
    case "integer":
      return /^-?\d+$/.test(value) ? null : "not a number";
    case "number":
      // Decimals, exponents and signed forms are all valid numbers — only
      // "integer" is whole-number-only.
      return Number.isFinite(Number(value)) ? null : "not a number";
    case "object":
      try {
        JSON.parse(value);
        return null;
      } catch {
        return "not valid JSON";
      }
    default:
      return null;
  }
};

/**
 * The one-shot command line this form would run, shell-quoted for display,
 * e.g. `revenexx products create --name 'Blue Bike' --price 100`. Secret
 * values are masked — this string is rendered on screen, never executed
 * (execution goes through buildArgv).
 */
export const buildCommandLine = (
  path: string[],
  specs: PromptSpec[],
  values: FormValues,
): string => {
  const masked: FormValues = { ...values };
  for (const spec of specs) {
    if (spec.secret === true && (masked[spec.key] ?? "") !== "") {
      masked[spec.key] = "*".repeat(masked[spec.key].length);
    }
  }
  return [
    EXECUTABLE_NAME,
    ...buildArgv(path, specs, masked).map((token, index) =>
      index < path.length ? token : shellQuote(token),
    ),
  ].join(" ");
};

/** Positional arguments first (declared order, so the argv stays valid), then
 * required options, then optional ones. */
export const orderSpecs = (specs: PromptSpec[]): PromptSpec[] => {
  const positional = specs.filter((spec) => spec.positional === true);
  const options = specs.filter((spec) => spec.positional !== true);
  return [
    ...positional,
    ...options.filter((spec) => spec.required),
    ...options.filter((spec) => !spec.required),
  ];
};

const cycleOptions = (spec: PromptSpec): string[] => {
  if (spec.enum !== undefined && spec.enum.length > 0) {
    return spec.required ? spec.enum : ["", ...spec.enum];
  }
  // boolean: optional fields may also stay unset.
  return spec.required ? ["true", "false"] : ["", "true", "false"];
};

/** Enums up to this many values render as an inline radio row (mockup style);
 * longer ones open the searchable picker (typing through dozens of runtimes
 * one ←/→ at a time is unusable). */
const RADIO_MAX = 5;

/** An enum too large for the inline radio — edited via the searchable picker,
 * not the ←/→ cycle. */
const isLargeEnum = (spec: PromptSpec): boolean =>
  spec.enum !== undefined && spec.enum.length > RADIO_MAX;

/** Fields adjusted with ←/→/space in place: small enums (radio) and booleans.
 * Large enums are excluded — they open the picker instead. */
const isCycled = (spec: PromptSpec): boolean =>
  (spec.enum !== undefined &&
    spec.enum.length > 0 &&
    spec.enum.length <= RADIO_MAX) ||
  spec.type === "boolean";

const FieldControl = ({
  spec,
  value,
  focused,
  caret = 0,
}: {
  spec: PromptSpec;
  value: string;
  focused: boolean;
  /** Cursor position within the text value (only meaningful when focused). */
  caret?: number;
}) => {
  if (spec.type === "boolean") {
    return (
      <Text>
        {value === "" ? (
          <Text dimColor>○ (unset)</Text>
        ) : value === "true" ? (
          <Text color={theme.success}>● true</Text>
        ) : (
          <Text color={theme.danger}>○ false</Text>
        )}
        {focused && <Text dimColor> ←→ toggle</Text>}
      </Text>
    );
  }
  if (spec.enum !== undefined && spec.enum.length > 0) {
    if (spec.enum.length <= RADIO_MAX) {
      return (
        <Text wrap="truncate">
          {spec.enum.map((option, index) => (
            <Text key={option}>
              {index > 0 ? "  " : ""}
              {option === value ? (
                <Text>
                  <Text color={theme.accent}>◉ </Text>
                  {option}
                </Text>
              ) : (
                <Text dimColor>○ {option}</Text>
              )}
            </Text>
          ))}
        </Text>
      );
    }
    const label =
      value === ""
        ? spec.default !== undefined
          ? `default: ${spec.default}`
          : "(unset)"
        : value;
    return (
      <Text color={focused ? theme.accent : undefined} dimColor={value === ""}>
        {label}
        {focused && <Text dimColor> ⌕ enter: choose</Text>}
      </Text>
    );
  }
  if (spec.type === "object") {
    // A JSON body: summarise as a field count and point at the editor rather
    // than showing the raw serialised string, which never fits one line.
    let summary = "";
    const trimmed = value.trim();
    if (trimmed !== "") {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)) {
          const count = Object.keys(parsed as Record<string, unknown>).length;
          summary = `{ ${count} field${count === 1 ? "" : "s"} }`;
        } else {
          summary = trimmed;
        }
      } catch {
        summary = trimmed;
      }
    }
    return (
      <Text color={focused ? theme.accent : undefined} dimColor={summary === ""}>
        {summary === "" ? "{ } enter: edit" : summary}
        {focused && summary !== "" && <Text dimColor> · enter: edit</Text>}
      </Text>
    );
  }
  const shown = spec.secret ? "*".repeat(value.length) : value;
  if (!focused) {
    return shown === "" ? (
      <Text dimColor>
        {spec.resource !== undefined
          ? "⌕ enter: search"
          : spec.default !== undefined
            ? `default: ${spec.default}`
            : spec.type === "array"
              ? "(comma-separated)"
              : "(empty)"}
      </Text>
    ) : (
      <Text>{shown}</Text>
    );
  }
  // Focused: draw the block cursor at its position within the value.
  const at = Math.min(Math.max(caret, 0), shown.length);
  return (
    <Text>
      <Text color={theme.accent}>{shown.slice(0, at)}</Text>
      <Text inverse>{shown.slice(at, at + 1) || " "}</Text>
      <Text color={theme.accent}>{shown.slice(at + 1)}</Text>
      {shown === "" && spec.resource !== undefined && (
        <Text dimColor> ⌕ enter: search</Text>
      )}
      {shown === "" &&
        spec.resource === undefined &&
        spec.default !== undefined && (
          <Text dimColor> default: {spec.default}</Text>
        )}
    </Text>
  );
};

/** Searchable single-column picker for an enum field with more values than the
 * inline radio can show (e.g. a runtime with 60+ options). Type to filter, ↑↓
 * to move, ⏎ to pick, esc to cancel — the same shape as the theme picker.
 * Optional fields get a leading "(unset)" row so the value can be cleared. */
const EnumPicker = ({
  name,
  description,
  options,
  current,
  allowUnset,
  onPick,
  onCancel,
}: {
  name: string;
  description?: string;
  options: string[];
  current: string;
  /** Optional fields may be reset to no value via a leading "(unset)" row. */
  allowUnset: boolean;
  onPick: (value: string) => void;
  onCancel: () => void;
}) => {
  const { rows: terminalRows } = useTerminalSize();
  const entries = allowUnset ? ["", ...options] : options;
  const [query, setQueryState] = useState("");
  const queryRef = useRef("");
  const [cursor, setCursorState] = useState(() =>
    Math.max(entries.indexOf(current), 0),
  );
  const cursorRef = useRef(cursor);
  // Refs so fast typing can't act on a stale query/cursor between renders.
  const setQuery = (value: string): void => {
    queryRef.current = value;
    setQueryState(value);
  };
  const setCursor = (value: number): void => {
    cursorRef.current = value;
    setCursorState(value);
  };

  const label = (value: string): string => (value === "" ? "(unset)" : value);
  const filterFor = (q: string): string[] => {
    const token = q.trim().toLowerCase();
    return token === ""
      ? entries
      : entries.filter((value) => label(value).toLowerCase().includes(token));
  };

  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      return;
    }
    const list = filterFor(queryRef.current);
    const at = Math.min(cursorRef.current, Math.max(list.length - 1, 0));
    if (key.return) {
      if (list[at] !== undefined) onPick(list[at]);
      return;
    }
    if (key.upArrow) {
      setCursor(Math.max(at - 1, 0));
      return;
    }
    if (key.downArrow) {
      setCursor(Math.min(at + 1, list.length - 1));
      return;
    }
    if (key.pageUp || key.pageDown) {
      const page = Math.max(terminalRows - 12, 4);
      setCursor(
        key.pageUp
          ? Math.max(at - page, 0)
          : Math.min(at + page, list.length - 1),
      );
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
    }
  });

  const filtered = filterFor(query);
  const selected = Math.min(cursor, Math.max(filtered.length - 1, 0));
  const capacity = Math.max(terminalRows - 12, 4);
  const start = Math.min(
    Math.max(selected - capacity + 1, 0),
    Math.max(filtered.length - capacity, 0),
  );
  const visible = filtered.slice(start, start + capacity);
  return (
    <Box flexDirection="column" flexGrow={1}>
      <Text color={theme.accent}>Choose {name}</Text>
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
        {start > 0 && <Text dimColor>↑ {start} more</Text>}
        {filtered.length === 0 && (
          <Text dimColor>no values match “{query}”</Text>
        )}
        {visible.map((value, index) => {
          const at = start + index;
          const isSelected = at === selected;
          return (
            <Box key={value === "" ? "(unset)" : value}>
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
                <Text
                  backgroundColor={theme.selectionBg}
                  color={theme.selectionFg}
                  bold
                >
                  {` ${label(value)} `}
                </Text>
              ) : (
                <Text dimColor={value === ""}>{label(value)}</Text>
              )}
              {value === current && <Text dimColor> · current</Text>}
            </Box>
          );
        })}
        {start + capacity < filtered.length && (
          <Text dimColor>↓ {filtered.length - start - capacity} more</Text>
        )}
      </Box>
    </Box>
  );
};

/** The parameter sidebar: fields, focused-spec info, live command preview. */
export const Form = ({
  path,
  specs,
  values,
  onChange,
  onSubmit,
  onClose,
  active = true,
  autoPick = false,
  runOnComplete = false,
  width,
  onPickerToggle,
  loadResourceRecords = listResourceRecords,
}: {
  path: string[];
  specs: PromptSpec[];
  /** Total panel width — the title sits in the top border. */
  width: number;
  /** Lifted so the parent can re-run / page without losing entered values. */
  values: FormValues;
  onChange: (values: FormValues) => void;
  /** Called with the values to run when they didn't come from state yet
   * (auto-run after a pick); parameterless on a plain submit. */
  onSubmit: (values?: FormValues) => void;
  onClose: () => void;
  /** Keyboard focus — the form sits beside the results as a sidebar and only
   * one of the two panes listens at a time. */
  active?: boolean;
  /** Open the first required resource field's picker immediately — search →
   * pick → run without an intermediate form stop. */
  autoPick?: boolean;
  /** Submit as soon as a pick completes every field's validation (safe reads
   * and modal-gated deletes). */
  runOnComplete?: boolean;
  /** The resource picker needs the full screen width; the parent hides the
   * results pane while it is open. */
  onPickerToggle?: (open: boolean) => void;
  /** Injectable for tests; defaults to the shared list-endpoint fetch. */
  loadResourceRecords?: (
    spec: PromptSpec,
    query?: string,
  ) => Promise<ResourceRecord[]>;
}) => {
  const fields = orderSpecs(specs);
  const [focus, setFocus] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [picker, setPickerState] = useState<PromptSpec | null>(null);
  const [editor, setEditorState] = useState<PromptSpec | null>(null);
  const [enumPicker, setEnumPickerState] = useState<PromptSpec | null>(null);
  /** Input handlers read/write this ref: key events can outpace renders and
   * the `values` prop would then be a stale closure, losing keystrokes. */
  const valuesRef = useRef(values);
  useEffect(() => {
    // External updates (paging rewrites offset) land here too.
    valuesRef.current = values;
  }, [values]);

  const focusedSpec = fields[focus];

  /** Text-caret position within the focused field. A ref backs the input
   * handlers (key events outpace renders); the state drives the cursor render. */
  const caretRef = useRef(0);
  const [caret, setCaretState] = useState(0);
  const setCaret = (pos: number): void => {
    caretRef.current = pos;
    setCaretState(pos);
  };
  // Land the caret at the end of the field whenever focus moves.
  useEffect(() => {
    setCaret((valuesRef.current[focusedSpec?.key ?? ""] ?? "").length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus]);

  const setPicker = (spec: PromptSpec | null): void => {
    setPickerState(spec);
    onPickerToggle?.(spec !== null);
  };

  // The JSON editor, like the picker, needs the full screen width, so it also
  // asks the parent to hide the results pane while open.
  const setEditor = (spec: PromptSpec | null): void => {
    setEditorState(spec);
    onPickerToggle?.(spec !== null);
  };

  // The enum picker borrows the full width too (same as the resource picker).
  const setEnumPicker = (spec: PromptSpec | null): void => {
    setEnumPickerState(spec);
    onPickerToggle?.(spec !== null);
  };

  const setValue = (key: string, value: string): void => {
    valuesRef.current = { ...valuesRef.current, [key]: value };
    onChange(valuesRef.current);
    setErrors((current) => ({ ...current, [key]: "" }));
  };

  // Search-first flow: a command whose first required parameter is a
  // resource id goes straight into its candidate search.
  useEffect(() => {
    const first = fields[0];
    if (
      autoPick &&
      first !== undefined &&
      first.required &&
      first.resource !== undefined &&
      (values[first.key] ?? "") === ""
    ) {
      setPicker(first);
    }
    // Mount-only: reopening on later renders would trap the user.
  }, []);

  const submit = (): void => {
    const found: Record<string, string> = {};
    for (const spec of fields) {
      const problem = validateField(spec, values[spec.key]);
      if (problem !== null) found[spec.key] = problem;
    }
    setErrors(found);
    const firstInvalid = fields.findIndex((spec) => found[spec.key]);
    if (firstInvalid >= 0) {
      setFocus(firstInvalid);
      return;
    }
    onSubmit();
  };

  useInput(
    (input, key) => {
    if (picker !== null || editor !== null || enumPicker !== null) {
      // The picker / JSON editor / enum picker owns the keyboard while open
      // (each has its own useInput).
      return;
    }
    if (key.ctrl && (input === "r" || input === "R")) {
      // Run from any field (Enter only submits from the last one).
      submit();
      return;
    }
    if (key.escape) {
      onClose();
      return;
    }
    // Focus runs over the fields and then two buttons: [Submit] then [Cancel].
    const submitIndex = fields.length;
    const cancelIndex = fields.length + 1;
    if (key.upArrow || (key.tab && key.shift)) {
      setFocus((current) => Math.max(current - 1, 0));
      return;
    }
    if (key.downArrow || key.tab) {
      setFocus((current) => Math.min(current + 1, cancelIndex));
      return;
    }
    // On the button row, ←/→ toggles between Submit and Cancel.
    if (focus >= submitIndex && (key.leftArrow || key.rightArrow)) {
      setFocus(key.leftArrow ? submitIndex : cancelIndex);
      return;
    }
    if (focus >= submitIndex && (input === " " || key.return)) {
      if (focus === submitIndex) submit();
      else onClose();
      return;
    }
    if (key.return) {
      // An `object` (JSON body) field opens the structured key/value editor,
      // whether empty (build a new body) or populated (edit the existing one).
      if (focusedSpec?.type === "object") {
        setEditor(focusedSpec);
        return;
      }
      // An empty resource-ID field searches its list endpoint; once it holds
      // a value (picked or typed), enter behaves like everywhere else.
      if (
        focusedSpec?.resource !== undefined &&
        (valuesRef.current[focusedSpec.key] ?? "") === ""
      ) {
        setPicker(focusedSpec);
        return;
      }
      // A large enum opens the searchable picker (too many values to cycle).
      if (focusedSpec !== undefined && isLargeEnum(focusedSpec)) {
        setEnumPicker(focusedSpec);
        return;
      }
      // Advance toward the Submit button; Enter never runs straight from a
      // field, so a form is only ever submitted deliberately (on Submit or ^r).
      setFocus(Math.min(focus + 1, submitIndex));
      return;
    }
    if (focusedSpec === undefined) return;
    if (isLargeEnum(focusedSpec)) {
      // → or space also opens the picker; no inline editing or ←/→ cycling of
      // a dozens-long list.
      if (key.rightArrow || input === " ") setEnumPicker(focusedSpec);
      return;
    }
    if (isCycled(focusedSpec)) {
      if (key.leftArrow || key.rightArrow || input === " ") {
        const options = cycleOptions(focusedSpec);
        const index = Math.max(
          options.indexOf(valuesRef.current[focusedSpec.key] ?? ""),
          0,
        );
        const step = key.leftArrow ? options.length - 1 : 1;
        setValue(focusedSpec.key, options[(index + step) % options.length]);
      }
      return;
    }
    // Object (JSON body) fields are edited only through the full-pane editor
    // (opened with Enter above), never a single inline line.
    if (focusedSpec.type === "object") return;
    // Text field: caret editing. Left/right move within the value; typing and
    // deletion happen at the caret, not just the end.
    const cur = valuesRef.current[focusedSpec.key] ?? "";
    const pos = Math.min(caretRef.current, cur.length);
    if (key.leftArrow) {
      setCaret(Math.max(pos - 1, 0));
      return;
    }
    if (key.rightArrow) {
      setCaret(Math.min(pos + 1, cur.length));
      return;
    }
    if (key.backspace || key.delete) {
      if (pos > 0) {
        setValue(focusedSpec.key, cur.slice(0, pos - 1) + cur.slice(pos));
        setCaret(pos - 1);
      }
      return;
    }
    if (input !== "" && !key.ctrl && !key.meta) {
      setValue(focusedSpec.key, cur.slice(0, pos) + input + cur.slice(pos));
      setCaret(pos + input.length);
    }
    },
    { isActive: active },
  );

  // Focus indices past the last field land on the Submit / Cancel buttons.
  const submitIndex = fields.length;
  const cancelIndex = fields.length + 1;
  // Sliding window keeps the focused field visible (clamped to the fields, so
  // focus resting on a button still shows the tail of the list).
  const capacity = Math.max(Math.min(fields.length, MAX_FIELDS), 1);
  const fieldFocus = Math.min(focus, Math.max(fields.length - 1, 0));
  const start = Math.min(
    Math.max(fieldFocus - capacity + 1, 0),
    Math.max(fields.length - capacity, 0),
  );
  const visible = fields.slice(start, start + capacity);
  // +2 for the "▸ " focus marker, +2 for a required " *".
  const labelWidth = fields.reduce(
    (max, spec) => Math.max(max, spec.name.length + 2 + (spec.required ? 2 : 0)),
    0,
  );

  if (enumPicker !== null) {
    return (
      <Panel title={path.join(" · ")} focused grow width={width}>
        <EnumPicker
          name={enumPicker.name}
          description={enumPicker.description}
          options={enumPicker.enum ?? []}
          current={valuesRef.current[enumPicker.key] ?? ""}
          allowUnset={!enumPicker.required}
          onPick={(value) => {
            const next = { ...valuesRef.current, [enumPicker.key]: value };
            valuesRef.current = next;
            onChange(next);
            setErrors((current) => ({ ...current, [enumPicker.key]: "" }));
            const index = fields.findIndex(
              (spec) => spec.key === enumPicker.key,
            );
            setEnumPicker(null);
            if (index >= 0 && index < fields.length - 1) {
              setFocus(index + 1);
            }
            if (
              runOnComplete &&
              fields.every(
                (spec) => validateField(spec, next[spec.key]) === null,
              )
            ) {
              onSubmit(next);
            }
          }}
          onCancel={() => setEnumPicker(null)}
        />
      </Panel>
    );
  }

  if (picker !== null) {
    return (
      <Panel title={path.join(" · ")} focused grow width={width}>
        <ResourcePicker
          name={picker.name}
          description={picker.description}
          searchable={picker.resource?.search === true}
          width={width}
          load={(query) => loadResourceRecords(picker, query)}
          onPick={(value) => {
            const next = { ...valuesRef.current, [picker.key]: value };
            valuesRef.current = next;
            onChange(next);
            setErrors((current) => ({ ...current, [picker.key]: "" }));
            setPicker(null);
            const index = fields.findIndex((spec) => spec.key === picker.key);
            if (index >= 0 && index < fields.length - 1) {
              setFocus(index + 1);
            }
            // Safe reads run the moment the pick completes the form.
            if (
              runOnComplete &&
              fields.every(
                (spec) => validateField(spec, next[spec.key]) === null,
              )
            ) {
              onSubmit(next);
            }
          }}
          onCancel={() => setPicker(null)}
        />
      </Panel>
    );
  }

  if (editor !== null) {
    return (
      <Panel title={path.join(" · ")} focused grow width={width}>
        <JsonObjectEditor
          name={editor.name}
          description={editor.description}
          initial={valuesRef.current[editor.key] ?? ""}
          onSave={(value) => {
            const next = { ...valuesRef.current, [editor.key]: value };
            valuesRef.current = next;
            onChange(next);
            setErrors((current) => ({ ...current, [editor.key]: "" }));
            setEditor(null);
            // Flow forward like the picker does, so a body field mid-form
            // doesn't trap focus once it's filled.
            const index = fields.findIndex((spec) => spec.key === editor.key);
            if (index >= 0 && index < fields.length - 1) setFocus(index + 1);
          }}
          onCancel={() => setEditor(null)}
        />
      </Panel>
    );
  }

  return (
    <Panel title={path.join(" · ")} focused={active} grow width={width}>
      {fields.length === 0 && (
        <Text dimColor>This command takes no parameters.</Text>
      )}
      {start > 0 && <Text dimColor>↑ {start} more</Text>}
      {visible.map((spec, index) => {
        const focused = active && focus < fields.length && start + index === focus;
        const error = errors[spec.key];
        return (
          <Box key={spec.key} gap={1}>
            <Box width={labelWidth} flexShrink={0}>
              <Text dimColor={!focused} wrap="truncate">
                {focused ? "» " : "  "}
                {spec.name}
                {spec.required && <Text color={theme.danger}> *</Text>}
              </Text>
            </Box>
            <FieldControl
              spec={spec}
              value={values[spec.key] ?? ""}
              focused={focused}
              caret={caret}
            />
            {error !== undefined && error !== "" && (
              <Text color={theme.danger}>← {error}</Text>
            )}
          </Box>
        );
      })}
      {start + capacity < fields.length && (
        <Text dimColor>↓ {fields.length - start - capacity} more</Text>
      )}
      {active && focusedSpec !== undefined && (
        <Box paddingTop={1} flexDirection="column">
          <Text dimColor wrap="truncate">
            {focusedSpec.type}
            {focusedSpec.required ? " · required" : " · optional"}
            {focusedSpec.secret === true ? " · secret" : ""}
            {focusedSpec.resource !== undefined
              ? ` · from ${focusedSpec.resource.listPath}`
              : ""}
          </Text>
          {focusedSpec.description !== undefined && (
            <Text dimColor wrap="truncate">
              {focusedSpec.description}
            </Text>
          )}
        </Box>
      )}
      {/* Submit / Cancel are real focus stops: Tab (or Enter through the
          fields) lands on Submit, then Enter runs — so a form is never
          submitted by accident. ^r still runs from anywhere. */}
      <Box paddingTop={1} gap={2} flexWrap="wrap">
        {active ? (
          <>
            <Button
              label="Submit"
              variant="primary"
              focused={focus === submitIndex}
            />
            <Button label="Cancel" focused={focus === cancelIndex} />
            <Text dimColor>
              {focus >= submitIndex
                ? "  ←→ choose · ⏎ select · esc cancel"
                : focusedSpec?.type === "object"
                  ? "  ⏎ edits the JSON body · ^r runs"
                  : "  ⏎ next · ^r run"}
            </Text>
          </>
        ) : (
          <Text dimColor>e edit parameters</Text>
        )}
      </Box>
      <Box paddingTop={1}>
        <Text wrap="truncate">{buildCommandLine(path, fields, values)}</Text>
      </Box>
    </Panel>
  );
};
