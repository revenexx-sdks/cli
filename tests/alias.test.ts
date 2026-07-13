import { describe, it, expect, beforeEach, vi } from "vitest";

// resolveAliases only reaches globalConfig.getAliases(); stub the config module
// so the test controls the user-defined alias table without touching disk.
const aliasStore = vi.hoisted(() => ({} as Record<string, string>));
vi.mock("../lib/config.js", () => ({
  globalConfig: {
    getAliases: () => aliasStore,
    getSensitiveTenants: () => [],
    getEndpoint: () => "",
    getProject: () => "",
    getSelfSigned: () => false,
    getKey: () => "",
    getJWT: () => "",
  },
  localConfig: {},
}));

import { Command } from "commander";
import {
  resolveAliases,
  tokenize,
  BUILTIN_COMMAND_ALIASES,
} from "../lib/alias.js";

const buildProgram = (): Command => {
  const program = new Command();
  for (const service of ["products", "pages", "orders", "apps"]) {
    const command = new Command(service);
    for (const verb of ["list", "get", "create", "update", "delete"]) {
      command.command(verb);
    }
    program.addCommand(command);
  }
  program.addCommand(new Command("whoami"));
  return program;
};

const HEAD = ["node", "cli"];
const rest = (argv: string[]): string[] => argv.slice(2);

beforeEach(() => {
  for (const key of Object.keys(aliasStore)) delete aliasStore[key];
});

describe("tokenize", () => {
  it("splits on whitespace", () => {
    expect(tokenize("apps create --activate")).toEqual([
      "apps",
      "create",
      "--activate",
    ]);
  });

  it("keeps quoted segments intact", () => {
    expect(tokenize(`apps create --name "my app" --tag 'x y'`)).toEqual([
      "apps",
      "create",
      "--name",
      "my app",
      "--tag",
      "x y",
    ]);
  });

  it("collapses repeated whitespace", () => {
    expect(tokenize("  products   list  ")).toEqual(["products", "list"]);
  });
});

describe("resolveAliases — built-in", () => {
  it("expands a service abbreviation on the first token", () => {
    const program = buildProgram();
    expect(rest(resolveAliases(program, [...HEAD, "p", "list"]))).toEqual([
      "products",
      "list",
    ]);
  });

  it("expands a verb abbreviation scoped to the service", () => {
    const program = buildProgram();
    expect(rest(resolveAliases(program, [...HEAD, "orders", "ls"]))).toEqual([
      "orders",
      "list",
    ]);
  });

  it("expands both service and verb together", () => {
    const program = buildProgram();
    expect(rest(resolveAliases(program, [...HEAD, "p", "rm"]))).toEqual([
      "products",
      "delete",
    ]);
  });

  it("leaves a real command untouched", () => {
    const program = buildProgram();
    expect(rest(resolveAliases(program, [...HEAD, "products", "list"]))).toEqual(
      ["products", "list"],
    );
  });

  it("is a no-op when the target service is absent from this SDK", () => {
    // `pay` → payments, but this program has no payments command.
    expect(BUILTIN_COMMAND_ALIASES["pay"]).toBe("payments");
    const program = buildProgram();
    expect(rest(resolveAliases(program, [...HEAD, "pay", "list"]))).toEqual([
      "pay",
      "list",
    ]);
  });

  it("does not rewrite when a flag comes first", () => {
    const program = buildProgram();
    const argv = [...HEAD, "--json", "p", "ls"];
    expect(resolveAliases(program, argv)).toEqual(argv);
  });
});

describe("resolveAliases — user-defined", () => {
  it("expands a user alias into its command line", () => {
    aliasStore["deploy"] = "apps create --activate true";
    const program = buildProgram();
    expect(rest(resolveAliases(program, [...HEAD, "deploy"]))).toEqual([
      "apps",
      "create",
      "--activate",
      "true",
    ]);
  });

  it("appends trailing args after the expansion", () => {
    aliasStore["mkapp"] = "apps create";
    const program = buildProgram();
    expect(
      rest(resolveAliases(program, [...HEAD, "mkapp", "--name", "x"])),
    ).toEqual(["apps", "create", "--name", "x"]);
  });

  it("never lets a user alias shadow a real command", () => {
    aliasStore["products"] = "orders list";
    const program = buildProgram();
    expect(rest(resolveAliases(program, [...HEAD, "products"]))).toEqual([
      "products",
    ]);
  });
});
