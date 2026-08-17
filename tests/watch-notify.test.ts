import { afterEach, describe, expect, it, vi } from "vitest";
import { cliConfig } from "../lib/parser.js";
import {
  bindOutOfBandWriter,
  createPortSet,
  createReplNotificationPort,
  createTuiNotificationPort,
  formatWatchOutcome,
  resetBellState,
  ringBell,
  writeOutOfBand,
} from "../lib/watch/notify.js";
import type { Watcher } from "../lib/watch/types.js";

const makeWatcher = (overrides: Partial<Watcher> = {}): Watcher =>
  Object.freeze({
    id: "1",
    label: "imports get-import",
    commandLine: "revenexx imports get-import --import-id abc",
    path: ["imports", "get-import"],
    values: {},
    tokens: ["imports", "get-import"],
    fieldPath: "status",
    condition: { kind: "terminal", done: ["done"], custom: false },
    intervalMs: 5_000,
    timeoutMs: 60_000,
    treat404AsTransient: false,
    createdAt: 0,
    state: "satisfied",
    lastValue: { kind: "value", value: "done" },
    initialValue: null,
    pollCount: 3,
    transientFailures: 0,
    lastPolledAt: 1_000,
    lastError: null,
    satisfiedAt: 42_000,
    finishedAt: 42_000,
    lastExitCode: 0,
    ...overrides,
  }) as Watcher;

/** Force the bell's TTY gate on, since vitest runs with stdout piped. */
const withTty = <T>(fn: () => T): T => {
  const descriptor = Object.getOwnPropertyDescriptor(process.stdout, "isTTY");
  Object.defineProperty(process.stdout, "isTTY", {
    value: true,
    configurable: true,
  });
  try {
    return fn();
  } finally {
    if (descriptor === undefined) {
      delete (process.stdout as { isTTY?: boolean }).isTTY;
    } else {
      Object.defineProperty(process.stdout, "isTTY", descriptor);
    }
  }
};

afterEach(() => {
  bindOutOfBandWriter(null);
  resetBellState();
  cliConfig.quiet = false;
});

describe("out-of-band writing", () => {
  it("bypasses a stdout capture installed by the executor", () => {
    // The regression: a timer firing during a run would otherwise put the BEL
    // into that run's capture buffer, which then gets fed to JSON.parse — so
    // the bell is lost AND the poll comes back with no data.
    const collected: string[] = [];
    bindOutOfBandWriter((chunk) => void collected.push(chunk));

    let captured = "";
    const original = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string): boolean => {
      captured += String(chunk);
      return true;
    }) as typeof process.stdout.write;
    try {
      withTty(() => ringBell());
    } finally {
      process.stdout.write = original;
    }

    expect(collected).toEqual(["\x07"]);
    expect(captured).toBe("");
  });

  it("keeps writing to the real stdout binding captured at module load", () => {
    // With no test writer bound, the module-load binding must still win over a
    // patch installed afterwards.
    let captured = "";
    const original = process.stdout.write.bind(process.stdout);
    const realWrites: string[] = [];
    // Stand in for the terminal by watching the binding the module captured:
    // it was bound before this patch, so the patch must not see the byte.
    process.stdout.write = ((chunk: string): boolean => {
      captured += String(chunk);
      return true;
    }) as typeof process.stdout.write;
    try {
      withTty(() => {
        bindOutOfBandWriter((chunk) => void realWrites.push(chunk));
        writeOutOfBand("x");
      });
    } finally {
      process.stdout.write = original;
      bindOutOfBandWriter(null);
    }
    expect(realWrites).toEqual(["x"]);
    expect(captured).toBe("");
  });
});

describe("the bell", () => {
  it("coalesces a burst into one ring", () => {
    const rings: string[] = [];
    bindOutOfBandWriter((chunk) => void rings.push(chunk));
    let now = 0;
    withTty(() => {
      ringBell(() => now);
      ringBell(() => now);
      now = 500;
      ringBell(() => now);
      now = 1_600;
      ringBell(() => now);
    });
    expect(rings).toEqual(["\x07", "\x07"]);
  });

  it("stays quiet under --quiet and when stdout is not a terminal", () => {
    const rings: string[] = [];
    bindOutOfBandWriter((chunk) => void rings.push(chunk));

    cliConfig.quiet = true;
    withTty(() => ringBell());
    expect(rings).toHaveLength(0);

    cliConfig.quiet = false;
    resetBellState();
    // Not wrapped in withTty: vitest pipes stdout, so isTTY is falsy here.
    ringBell();
    expect(rings).toHaveLength(0);
  });
});

describe("port sets", () => {
  it("deliver to every attached port and stop on detach", () => {
    const ports = createPortSet();
    const first = vi.fn();
    const second = vi.fn();
    const detach = ports.attach({ onTransition: first });
    ports.attach({ onTransition: second });
    const event = {
      watcher: makeWatcher(),
      from: "polling" as const,
      to: "satisfied" as const,
    };
    ports.onTransition(event);
    expect(first).toHaveBeenCalledTimes(1);
    detach();
    ports.onTransition(event);
    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(2);
  });
});

describe("formatWatchOutcome", () => {
  it("describes each ending with its own glyph and tone", () => {
    expect(formatWatchOutcome(makeWatcher())).toMatchObject({
      glyph: "✓",
      tone: "success",
    });
    expect(
      formatWatchOutcome(makeWatcher({ state: "timeout" })),
    ).toMatchObject({ glyph: "⏱", tone: "warn" });
    expect(
      formatWatchOutcome(makeWatcher({ state: "error", lastError: "boom" })),
    ).toMatchObject({ glyph: "✗", tone: "danger" });
    expect(formatWatchOutcome(makeWatcher()).text).toContain("#1");
    expect(formatWatchOutcome(makeWatcher()).text).toContain("imports get-import");
  });
});

describe("the REPL port", () => {
  it("clears the prompt row, prints, rings and repaints", () => {
    const written: string[] = [];
    bindOutOfBandWriter((chunk) => void written.push(chunk));
    const redraw = vi.fn();
    const port = createReplNotificationPort(redraw);
    withTty(() =>
      port.onTransition({
        watcher: makeWatcher(),
        from: "polling",
        to: "satisfied",
      }),
    );
    expect(written[0]).toMatch(/^\r\x1b\[2K✓ /);
    expect(written[0]?.endsWith("\n")).toBe(true);
    expect(written[1]).toBe("\x07");
    expect(redraw).toHaveBeenCalledTimes(1);
  });

  it("ignores non-terminal transitions", () => {
    const redraw = vi.fn();
    const port = createReplNotificationPort(redraw);
    port.onTransition({
      watcher: makeWatcher({ state: "polling" }),
      from: "pending",
      to: "polling",
    });
    expect(redraw).not.toHaveBeenCalled();
  });
});

describe("the TUI port", () => {
  it("toasts the outcome with its tone", () => {
    bindOutOfBandWriter(() => undefined);
    const toast = vi.fn();
    createTuiNotificationPort(toast).onTransition({
      watcher: makeWatcher({ state: "error", lastError: "boom" }),
      from: "polling",
      to: "error",
    });
    expect(toast).toHaveBeenCalledTimes(1);
    expect(toast.mock.calls[0]?.[0]).toContain("✗");
    expect(toast.mock.calls[0]?.[1]).toBe("danger");
  });
});
