import { describe, it, expect, afterEach } from "vitest";
import { Command } from "commander";
import { createRunner } from "../lib/tui/executor.js";

/**
 * The TUI runs commands in-process and captures their output so nothing clobbers
 * the ink screen. Capturing only `process.stdout.write` is not enough: on Bun —
 * the runtime behind the compiled binary that Homebrew installs and that ships
 * as a release asset — `console.log` writes to the file descriptor directly and
 * never calls `process.stdout.write`. These tests pin the console redirect,
 * because without it every command in the packaged TUI renders as
 * "(empty response)" while its real output leaks over the frame.
 */

const original = {
  log: console.log,
  info: console.info,
  debug: console.debug,
  warn: console.warn,
  error: console.error,
};

afterEach(() => {
  console.log = original.log;
  console.info = original.info;
  console.debug = original.debug;
  console.warn = original.warn;
  console.error = original.error;
});

/** A program whose action prints through `console`, like every CLI helper. */
const programPrinting = (
  stdoutLine: string,
  stderrLine?: string,
): Command => {
  const program = new Command();
  program.exitOverride();
  program
    .command("say")
    .action(() => {
      console.log(stdoutLine);
      if (stderrLine !== undefined) {
        console.error(stderrLine);
      }
    });
  return program;
};

describe("createRunner output capture", () => {
  it("captures console output that never touches process.stdout.write", async () => {
    // Stand in for Bun: a console that writes straight past the stream.
    const leaked: string[] = [];
    console.log = (...args: unknown[]): void => {
      leaked.push(args.join(" "));
    };

    const run = createRunner(programPrinting("signed in as someone"));
    const result = await run(["say"]);

    expect(result.stdout).toContain("signed in as someone");
    // Nothing may escape to the real console — that is what corrupts the frame.
    expect(leaked).toEqual([]);
  });

  it("captures console.error into stderr so the error view still gets a payload", async () => {
    const run = createRunner(
      programPrinting("out", JSON.stringify({ error: { message: "nope" } })),
    );
    const result = await run(["say"]);

    expect(result.stdout).toContain("out");
    expect(result.error).toEqual({ message: "nope" });
  });

  it("formats multiple and non-string arguments like the console does", async () => {
    const program = new Command();
    program.exitOverride();
    program.command("say").action(() => {
      console.log("count:", 2, { ok: true });
    });

    const result = await createRunner(program)(["say"]);

    expect(result.stdout.trim()).toBe("count: 2 { ok: true }");
  });

  it("restores every console method after the run", async () => {
    const run = createRunner(programPrinting("hello"));
    await run(["say"]);

    expect(console.log).toBe(original.log);
    expect(console.info).toBe(original.info);
    expect(console.debug).toBe(original.debug);
    expect(console.warn).toBe(original.warn);
    expect(console.error).toBe(original.error);
  });

  it("restores the console even when the command throws", async () => {
    const program = new Command();
    program.exitOverride();
    program.command("boom").action(() => {
      throw new Error("kaboom");
    });

    const result = await createRunner(program)(["boom"]);

    expect(result.ok).toBe(false);
    expect(console.log).toBe(original.log);
    expect(console.error).toBe(original.error);
  });
});
