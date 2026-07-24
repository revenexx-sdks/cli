/**
 * Runs a one-shot command line from inside the TUI (DX-118 workstream 5),
 * reusing the generated commander actions — payload assembly, auth, retries
 * and error mapping stay single-sourced. The REPL's re-entrancy pattern
 * (parseAsync + a throwing process.exit sentinel + config reset) is combined
 * with output capture so nothing the command writes can clobber the ink
 * screen: stdout/stderr go to buffers, the request spinner is paused, and
 * `--output json` is forced so both payload and errors come back structured.
 */
import type { Command } from "commander";
import { cliConfig } from "../parser.js";
import { disableRequestSpinner, enableRequestSpinner } from "../spinner.js";

export type ExecutionResult = {
  ok: boolean;
  /** Exit code the command would have returned (4=auth, 5=not-found, …). */
  exitCode: number;
  /** Wall-clock run time, for the mockup's `· 182 ms` request line. */
  durationMs: number;
  /** Parsed stdout payload when it was valid JSON. */
  data: unknown;
  /** Parsed `{ error: { message, code, type, requestId } }` from stderr. */
  error: { message: string; code?: number | string; type?: string } | null;
  stdout: string;
  stderr: string;
};

export type TuiRunner = (
  tokens: string[],
  options?: { force?: boolean },
) => Promise<ExecutionResult>;

/**
 * Sentinel thrown by the process.exit stub. Named `ReplExit` on purpose:
 * parser.ts's parseError stays transparent to sentinels of that name (it
 * rethrows instead of printing the numeric message), and reusing the name
 * keeps that contract in one place.
 */
class ExitSentinel extends Error {
  exitCode: number;
  constructor(exitCode: number) {
    super(String(exitCode));
    this.name = "ReplExit";
    this.exitCode = exitCode;
  }
}

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
};

/** Bind a runner to the live program so the TUI can execute command tokens. */
export const createRunner = (program: Command): TuiRunner => {
  return async (tokens, options = {}) => {
    const saved = {
      output: cliConfig.output,
      json: cliConfig.json,
      force: cliConfig.force,
    };
    const originalExit = process.exit.bind(process);
    const originalStdoutWrite = process.stdout.write.bind(process.stdout);
    const originalStderrWrite = process.stderr.write.bind(process.stderr);

    let stdout = "";
    let stderr = "";
    let exitCode = 0;
    const startedAt = Date.now();

    cliConfig.output = "json";
    cliConfig.json = true;
    if (options.force === true) {
      cliConfig.force = true;
    }
    disableRequestSpinner();
    process.exit = ((code?: number): never => {
      throw new ExitSentinel(code ?? 0);
    }) as typeof process.exit;
    process.stdout.write = ((chunk: string | Uint8Array): boolean => {
      stdout += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString();
      return true;
    }) as typeof process.stdout.write;
    process.stderr.write = ((chunk: string | Uint8Array): boolean => {
      stderr += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString();
      return true;
    }) as typeof process.stderr.write;

    try {
      await program.parseAsync(tokens, { from: "user" });
    } catch (err) {
      if (err instanceof ExitSentinel) {
        exitCode = err.exitCode;
      } else if (
        typeof (err as { code?: unknown })?.code === "string" &&
        (err as { code: string }).code.startsWith("commander.")
      ) {
        // Commander already wrote its usage/help notice to the captured
        // stream; anything but a clean help exit is a usage failure.
        const commanderExit = (err as { exitCode?: number }).exitCode;
        exitCode = commanderExit === 0 ? 0 : 2;
      } else {
        exitCode = 1;
        stderr += `${err instanceof Error ? err.message : String(err)}\n`;
      }
    } finally {
      process.exit = originalExit;
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
      // cli.ts enables the spinner unconditionally at startup; restore that.
      enableRequestSpinner();
      cliConfig.output = saved.output;
      cliConfig.json = saved.json;
      cliConfig.force = saved.force;
    }

    const errorPayload = parseJson(stderr) as
      | { error?: ExecutionResult["error"] }
      | undefined;
    return {
      ok: exitCode === 0,
      exitCode,
      durationMs: Date.now() - startedAt,
      data: parseJson(stdout),
      error: errorPayload?.error ?? null,
      stdout,
      stderr,
    };
  };
};
