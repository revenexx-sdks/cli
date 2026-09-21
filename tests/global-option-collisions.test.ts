import { describe, it, expect, beforeAll } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { Command } from "commander";

/**
 * Commander parses the program's global options anywhere in argv, so a
 * subcommand that declares a flag with the same long (or short) name never
 * receives it: the program swallows the token and the subcommand sees its
 * default (DX-234: `deploy app --timeout 420` became a 420 ms HTTP timeout).
 *
 * The generator refuses to emit a colliding spec-sourced flag (CLI.php,
 * `globalOptionNames`). This test covers the other half: hand-written and
 * plugin commands, and it keeps the generator's list honest by reading the
 * real program chain out of cli.ts.
 */

const cliSource = fs.readFileSync(path.join(__dirname, "..", "cli.ts"), "utf8");
const chainStart = cliSource.indexOf("    program\n");
const chainEnd = cliSource.indexOf(".showSuggestionAfterError()", chainStart);
const programChain = cliSource.slice(chainStart, chainEnd);

/** Every flag token the program declares: `--json`, `-j`, `--no-retry`, … */
const globalFlags = new Set<string>(["-h", "--help", "-v", "--version"]);
for (const match of programChain.matchAll(/\.option\('([^']+)'/g)) {
  const flags = match[1].split(/[ ,]+/).filter((token) => token.startsWith("-"));
  for (const flag of flags) globalFlags.add(flag);
}

/**
 * `login` and `client` re-declare global flags so they show in their own
 * --help, and read the values back from cliConfig / the parent command's
 * options, so the program swallowing them is the intended path. Everything
 * else must use a distinct name.
 */
const ALLOWED = new Set(["login --endpoint", "login --token", "login --tenant", "client --endpoint", "client --debug"]);

/** Every module that can export a Command: hand-written, plugin-contributed, generated. */
const commandDirs = [path.join(__dirname, "..", "lib", "commands"), path.join(__dirname, "..", "lib", "commands", "services")];
const moduleFiles = commandDirs.flatMap((dir) =>
  fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".d.ts"))
    .map((file) => path.join(dir, file)),
);

/** Commander 9's typings hide these; the runtime fields are stable. */
type Introspectable = Command & { options: { long?: string; short?: string }[]; commands: readonly Command[] };

const collisions: string[] = [];
const visit = (command: Command, trail: string): void => {
  const name = trail ? `${trail} ${command.name()}` : command.name();
  const { options, commands } = command as Introspectable;
  for (const option of options) {
    for (const flag of [option.long, option.short]) {
      if (flag && globalFlags.has(flag) && !ALLOWED.has(`${name} ${flag}`)) {
        collisions.push(`${name} ${flag}`);
      }
    }
  }
  for (const child of commands) visit(child, name);
};

let modulesChecked = 0;
const importFailures: string[] = [];
beforeAll(async () => {
  for (const file of moduleFiles) {
    let exports: Record<string, unknown>;
    try {
      exports = (await import(file)) as Record<string, unknown>;
    } catch (err) {
      importFailures.push(`${path.relative(process.cwd(), file)}: ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    modulesChecked++;
    for (const value of Object.values(exports)) {
      if (value instanceof Command) visit(value, "");
    }
  }
});

describe("global option collisions", () => {
  it("reads the real program chain", () => {
    expect(chainStart).toBeGreaterThan(-1);
    expect(chainEnd).toBeGreaterThan(chainStart);
    expect(globalFlags).toContain("--json");
    expect(globalFlags).toContain("--request-timeout");
    expect(globalFlags).toContain("--no-retry");
  });

  it("imports every command module", () => {
    expect(importFailures).toEqual([]);
    expect(modulesChecked).toBeGreaterThan(5);
  });

  it("no subcommand declares a flag the program would swallow", () => {
    expect(collisions.sort()).toEqual([]);
  });
});
