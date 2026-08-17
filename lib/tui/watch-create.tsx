/**
 * The `/watch` create flow (DX-141): pick a get-by-id command, fill its
 * parameters, probe it once, then choose the field, the condition and the
 * cadence.
 *
 * Every step reuses machinery that already exists — filterEntries for the
 * target search, Form (with autoPick) for the parameters, the run queue for the
 * probe — so the only genuinely new UI here is the field/condition/cadence
 * picking.
 *
 * The probe is not decoration: without it the user has to already know the
 * payload's field names, and it doubles as the `changed` baseline so the
 * condition means "different from what you just saw" rather than "different
 * from whatever poll 1 happens to return".
 */
import { useEffect, useRef, useState } from "react";
import { Box, Text, useInput } from "ink";
import { Panel } from "./panel.js";
import { theme } from "./theme.js";
import { useTerminalSize } from "./terminal.js";
import { Form, buildArgv, buildCommandLine, type FormValues } from "./form.js";
import { filterEntries, listResource } from "./command-tree.js";
import type { CommandLeaf, CommandNode, PaletteEntry } from "./command-tree.js";
import { enqueueRun } from "../watch/run-queue.js";
import { watchScheduler } from "../watch/scheduler.js";
import {
  enumerateFieldPaths,
  resolveFieldPath,
  formatResolved,
  suggestFieldPath,
} from "../watch/field-path.js";
import { parseCondition } from "../watch/condition.js";
import { parseDuration, formatDuration } from "../watch/duration.js";
import {
  DEFAULT_INTERVAL_MS,
  DEFAULT_WATCH_TIMEOUT_MS,
  MIN_INTERVAL_MS,
} from "../watch/types.js";
import type { Resolved, WatchCondition } from "../watch/types.js";
import type { PromptSpec, ResourceRecord } from "../interactive.js";

/** Rows around a step's list: header (3), status bar (1), border (2), title
 * line (1), query line (1), spacer (1), footer hint (1). */
const STEP_CHROME_ROWS = 11;

export const WATCH_CREATE_HINTS: [string, string][] = [
  ["↑↓", "select"],
  ["⏎", "next"],
  ["esc", "back"],
];

type Step = "target" | "params" | "probe" | "field" | "condition" | "cadence";

/**
 * Get-by-id commands, enumerated straight off the command tree. flattenTree
 * deliberately drops leaves folded behind their list (which is exactly what a
 * get is), so it can't be reused here.
 */
export const getByIdEntries = (commands: CommandNode[]): PaletteEntry[] =>
  commands.flatMap((node) =>
    (node.subcommands ?? [])
      .filter(
        (leaf) => leaf.method === "get" && listResource(leaf.name) === undefined,
      )
      .map((leaf) => ({
        path: `${node.name} ${leaf.name}`,
        description: leaf.description,
        parts: [node.name, leaf.name],
        leaf,
        display:
          leaf.label !== undefined ? `${node.name} ${leaf.label}` : undefined,
      })),
  );

/** The conditions offered, in the order they're worth reaching for. */
const CONDITION_CHOICES: {
  label: string;
  hint: string;
  /** Conditions that need an operand collect one before being parsed. */
  template: string;
  needsOperand: boolean;
}[] = [
  {
    label: "terminal",
    hint: "stops moving — done, ready, failed, cancelled…",
    template: "terminal",
    needsOperand: false,
  },
  {
    label: "changed",
    hint: "differs from the value probed just now",
    template: "changed",
    needsOperand: false,
  },
  {
    label: "equals",
    hint: "matches an exact value (case-insensitive)",
    template: "equals",
    needsOperand: true,
  },
  {
    label: "matches",
    hint: "matches a regular expression",
    template: "matches",
    needsOperand: true,
  },
  {
    label: "truthy",
    hint: "becomes non-empty / true",
    template: "truthy",
    needsOperand: false,
  },
];

/** A searchable, keyboard-driven list — the shape every step below reuses. */
const StepList = ({
  rows,
  cursor,
  maxRows,
}: {
  rows: { key: string; label: string; hint?: string }[];
  cursor: number;
  maxRows: number;
}) => {
  const start = Math.max(
    0,
    Math.min(cursor - Math.floor(maxRows / 2), rows.length - maxRows),
  );
  return (
    <Box flexDirection="column">
      {rows.slice(start, start + maxRows).map((row, index) => {
        const selected = start + index === cursor;
        return (
          <Text key={row.key} wrap="truncate">
            <Text
              color={selected ? theme.selectionFg : undefined}
              backgroundColor={selected ? theme.selectionBg : undefined}
              bold={selected}
            >
              {selected ? "» " : "  "}
              {row.label}
            </Text>
            {row.hint !== undefined && <Text dimColor> · {row.hint}</Text>}
          </Text>
        );
      })}
      {rows.length === 0 && <Text dimColor>  no matches</Text>}
    </Box>
  );
};

export const WatchCreate = ({
  commands,
  width,
  onClose,
  onNotice,
  loadResourceRecords,
}: {
  commands: CommandNode[];
  width: number;
  onClose: () => void;
  onNotice: (text: string, tone: "success" | "danger" | "warn") => void;
  loadResourceRecords?: (
    spec: PromptSpec,
    query?: string,
  ) => Promise<ResourceRecord[]>;
}) => {
  const [step, setStep] = useState<Step>("target");
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [target, setTarget] = useState<{
    path: string[];
    leaf: CommandLeaf;
  } | null>(null);
  const [values, setValues] = useState<FormValues>({});
  const [probe, setProbe] = useState<{
    data: unknown;
    paths: string[];
  } | null>(null);
  const [probeError, setProbeError] = useState<string | null>(null);
  const [fieldPath, setFieldPath] = useState("");
  const [operand, setOperand] = useState("");
  const [condition, setCondition] = useState<WatchCondition | null>(null);
  const [conditionError, setConditionError] = useState<string | null>(null);
  const [interval, setInterval] = useState("5s");
  const [maxFor, setMaxFor] = useState("5m");
  const [cadenceFocus, setCadenceFocus] = useState<0 | 1>(0);
  const [cadenceError, setCadenceError] = useState<string | null>(null);
  const { rows: terminalRows } = useTerminalSize();
  const maxRows = Math.max(terminalRows - STEP_CHROME_ROWS, 3);
  /** Monotonic probe id, so a superseded probe can never land. */
  const probeSeq = useRef(0);

  const entries = getByIdEntries(commands);
  const targetRows = filterEntries(entries, query);

  const fieldRows = (probe?.paths ?? []).filter((path) =>
    path.toLowerCase().includes(fieldPath.trim().toLowerCase()),
  );

  /** Run the target once so the field step can offer real paths. */
  useEffect(() => {
    if (step !== "probe" || target === null) return;
    const id = ++probeSeq.current;
    const tokens = buildArgv(target.path, target.leaf.specs ?? [], values);
    void enqueueRun(tokens, { priority: "foreground" })
      .then((result) => {
        if (probeSeq.current !== id) return;
        if (!result.ok) {
          setProbeError(result.error?.message ?? `exit ${result.exitCode}`);
          return;
        }
        const paths = enumerateFieldPaths(result.data);
        setProbe({ data: result.data, paths });
        setFieldPath(suggestFieldPath(result.data) ?? "");
        setProbeError(null);
        setCursor(0);
        setStep("field");
      })
      .catch((err: unknown) => {
        if (probeSeq.current !== id) return;
        setProbeError(err instanceof Error ? err.message : String(err));
      });
  }, [step, target, values]);

  const back = (): void => {
    setCursor(0);
    if (step === "target") onClose();
    else if (step === "params") setStep("target");
    else if (step === "probe" || step === "field") setStep("params");
    else if (step === "condition") setStep("field");
    else setStep("condition");
  };

  const create = (): void => {
    if (target === null || condition === null) return;
    const every = parseDuration(interval);
    const within = parseDuration(maxFor);
    if (!every.ok) {
      setCadenceError(every.error);
      return;
    }
    if (!within.ok) {
      setCadenceError(within.error);
      return;
    }
    const specs = target.leaf.specs ?? [];
    // Seed the baseline from what the probe actually returned, so `changed`
    // means "different from what you just saw" rather than "different from
    // whatever poll 1 happens to return".
    const initialValue: Resolved | undefined =
      probe === null ? undefined : resolveFieldPath(probe.data, fieldPath);
    const outcome = watchScheduler.start({
      path: target.path,
      values,
      tokens: buildArgv(target.path, specs, values),
      commandLine: buildCommandLine(target.path, specs, values),
      fieldPath: fieldPath.trim(),
      condition,
      intervalMs: every.ms,
      timeoutMs: within.ms,
      ...(initialValue === undefined ? {} : { initialValue }),
      label: target.path.join(" "),
    });
    if (outcome.ok) {
      onNotice(
        `◉ watching #${outcome.watcher.id} · ${target.path.join(" ")} · every ${formatDuration(every.ms)}`,
        "success",
      );
      onClose();
      return;
    }
    onNotice(
      outcome.reason === "capacity"
        ? "too many active watchers — cancel one first"
        : `already watching that (#${outcome.watcher?.id ?? "?"})`,
      "warn",
    );
    onClose();
  };

  // The params step hands the keyboard to Form; the probe step is waiting on
  // the gateway and takes no input but esc.
  useInput(
    (input, key) => {
      if (key.escape) {
        back();
        return;
      }
      if (step === "probe") return;

      if (step === "target") {
        if (key.return) {
          const entry = targetRows[Math.min(cursor, targetRows.length - 1)];
          if (entry === undefined) return;
          setTarget({ path: entry.parts, leaf: entry.leaf });
          setValues({});
          setCursor(0);
          // A get with no parameters can go straight to the probe.
          setStep((entry.leaf.specs ?? []).length === 0 ? "probe" : "params");
          return;
        }
        if (key.upArrow) {
          setCursor((at) => Math.max(at - 1, 0));
          return;
        }
        if (key.downArrow) {
          setCursor((at) => Math.min(at + 1, targetRows.length - 1));
          return;
        }
        if (key.backspace || key.delete) {
          setQuery((text) => text.slice(0, -1));
          setCursor(0);
          return;
        }
        if (input !== "" && !key.ctrl && !key.meta && !key.tab) {
          setQuery((text) => text + input);
          setCursor(0);
        }
        return;
      }

      if (step === "field") {
        if (key.return) {
          const picked = fieldRows[cursor];
          // Enter on a highlighted suggestion takes it; with none highlighted
          // the typed text stands, so a path the probe didn't enumerate (an
          // array index, a field that materialises later) still works.
          if (picked !== undefined) setFieldPath(picked);
          setCursor(0);
          setStep("condition");
          return;
        }
        if (key.upArrow) {
          setCursor((at) => Math.max(at - 1, 0));
          return;
        }
        if (key.downArrow) {
          setCursor((at) => Math.min(at + 1, fieldRows.length - 1));
          return;
        }
        if (key.backspace || key.delete) {
          setFieldPath((text) => text.slice(0, -1));
          setCursor(0);
          return;
        }
        if (input !== "" && !key.ctrl && !key.meta && !key.tab) {
          setFieldPath((text) => text + input);
          setCursor(0);
        }
        return;
      }

      if (step === "condition") {
        const choice = CONDITION_CHOICES[cursor];
        if (key.return && choice !== undefined) {
          const text = choice.needsOperand
            ? `${choice.template} ${operand.trim()}`
            : choice.template;
          const parsed = parseCondition(text);
          if (!parsed.ok) {
            setConditionError(parsed.error);
            return;
          }
          setCondition(parsed.condition);
          setConditionError(null);
          setStep("cadence");
          return;
        }
        if (key.upArrow) {
          setCursor((at) => Math.max(at - 1, 0));
          setOperand("");
          setConditionError(null);
          return;
        }
        if (key.downArrow) {
          setCursor((at) => Math.min(at + 1, CONDITION_CHOICES.length - 1));
          setOperand("");
          setConditionError(null);
          return;
        }
        if (choice?.needsOperand === true) {
          if (key.backspace || key.delete) {
            setOperand((text) => text.slice(0, -1));
            return;
          }
          if (input !== "" && !key.ctrl && !key.meta && !key.tab) {
            setOperand((text) => text + input);
          }
        }
        return;
      }

      // cadence
      if (key.return) {
        create();
        return;
      }
      if (key.tab || key.upArrow || key.downArrow) {
        setCadenceFocus((at) => (at === 0 ? 1 : 0));
        return;
      }
      const set = cadenceFocus === 0 ? setInterval : setMaxFor;
      if (key.backspace || key.delete) {
        set((text) => text.slice(0, -1));
        setCadenceError(null);
        return;
      }
      if (input !== "" && !key.ctrl && !key.meta && !key.tab) {
        set((text) => text + input);
        setCadenceError(null);
      }
    },
    { isActive: step !== "params" },
  );

  if (step === "params" && target !== null) {
    return (
      <Form
        path={target.path}
        specs={target.leaf.specs ?? []}
        values={values}
        onChange={setValues}
        onSubmit={(submitted) => {
          if (submitted !== undefined) setValues(submitted);
          setStep("probe");
        }}
        onClose={() => setStep("target")}
        width={width}
        autoPick
        {...(loadResourceRecords === undefined ? {} : { loadResourceRecords })}
      />
    );
  }

  const title = `watch · ${step}`;
  const footer =
    target === null ? undefined : `${target.path.join(" ")} · step ${
      { target: 1, params: 2, probe: 3, field: 3, condition: 4, cadence: 5 }[step]
    }/5`;

  return (
    <Panel
      title={title}
      titleColor={theme.accent}
      {...(footer === undefined ? {} : { footer })}
      width={width}
      focused
      grow
    >
      {step === "target" && (
        <Box paddingTop={1} flexDirection="column">
          <Text dimColor>Which resource should be polled?</Text>
          <Box paddingTop={1}>
            <Text>
              <Text color={theme.accent}>search </Text>
              {query}
              <Text color={theme.accent}>▏</Text>
            </Text>
          </Box>
          <Box paddingTop={1}>
            <StepList
              rows={targetRows.map((entry) => ({
                key: entry.path,
                label: entry.display ?? entry.path,
                hint: entry.description,
              }))}
              cursor={Math.min(cursor, Math.max(targetRows.length - 1, 0))}
              maxRows={maxRows}
            />
          </Box>
        </Box>
      )}

      {step === "probe" && (
        <Box paddingTop={1} flexDirection="column">
          {probeError === null ? (
            <Text dimColor>Fetching it once to read its fields…</Text>
          ) : (
            <>
              <Text color={theme.danger}>{probeError}</Text>
              <Box paddingTop={1}>
                <Text dimColor>esc to go back and fix the parameters</Text>
              </Box>
            </>
          )}
        </Box>
      )}

      {step === "field" && (
        <Box paddingTop={1} flexDirection="column">
          <Text dimColor>Which field should be watched?</Text>
          <Box paddingTop={1}>
            <Text>
              <Text color={theme.accent}>field </Text>
              {fieldPath}
              <Text color={theme.accent}>▏</Text>
              {probe !== null && (
                <Text dimColor>
                  {"  → "}
                  {formatResolved(resolveFieldPath(probe.data, fieldPath))}
                </Text>
              )}
            </Text>
          </Box>
          <Box paddingTop={1}>
            <StepList
              rows={fieldRows.map((path) => ({
                key: path,
                label: path,
                ...(probe === null
                  ? {}
                  : {
                      hint: formatResolved(
                        resolveFieldPath(probe.data, path),
                        24,
                      ),
                    }),
              }))}
              cursor={Math.min(cursor, Math.max(fieldRows.length - 1, 0))}
              maxRows={maxRows}
            />
          </Box>
        </Box>
      )}

      {step === "condition" && (
        <Box paddingTop={1} flexDirection="column">
          <Text dimColor>
            Stop watching <Text color={theme.accent}>{fieldPath || "(payload)"}</Text>{" "}
            when it…
          </Text>
          <Box paddingTop={1}>
            <StepList
              rows={CONDITION_CHOICES.map((choice) => ({
                key: choice.label,
                label: choice.label,
                hint: choice.hint,
              }))}
              cursor={cursor}
              maxRows={maxRows}
            />
          </Box>
          {CONDITION_CHOICES[cursor]?.needsOperand === true && (
            <Box paddingTop={1}>
              <Text>
                <Text color={theme.accent}>value </Text>
                {operand}
                <Text color={theme.accent}>▏</Text>
              </Text>
            </Box>
          )}
          {conditionError !== null && (
            <Box paddingTop={1}>
              <Text color={theme.danger}>{conditionError}</Text>
            </Box>
          )}
        </Box>
      )}

      {step === "cadence" && (
        <Box paddingTop={1} flexDirection="column">
          <Text dimColor>How often, and for how long?</Text>
          <Box paddingTop={1} flexDirection="column">
            <Text>
              <Text color={cadenceFocus === 0 ? theme.accent : undefined}>
                {cadenceFocus === 0 ? "» " : "  "}every{"  "}
              </Text>
              {interval}
              {cadenceFocus === 0 && <Text color={theme.accent}>▏</Text>}
              <Text dimColor>
                {"   "}floor {formatDuration(MIN_INTERVAL_MS)}, default{" "}
                {formatDuration(DEFAULT_INTERVAL_MS)}
              </Text>
            </Text>
            <Text>
              <Text color={cadenceFocus === 1 ? theme.accent : undefined}>
                {cadenceFocus === 1 ? "» " : "  "}for{"    "}
              </Text>
              {maxFor}
              {cadenceFocus === 1 && <Text color={theme.accent}>▏</Text>}
              <Text dimColor>
                {"   "}gives up after this — default{" "}
                {formatDuration(DEFAULT_WATCH_TIMEOUT_MS)}
              </Text>
            </Text>
          </Box>
          {cadenceError !== null && (
            <Box paddingTop={1}>
              <Text color={theme.danger}>{cadenceError}</Text>
            </Box>
          )}
          <Box paddingTop={1}>
            <Text dimColor>↹ switches field · ⏎ starts watching</Text>
          </Box>
        </Box>
      )}
    </Panel>
  );
};
