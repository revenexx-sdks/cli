import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

const promptMock = vi.hoisted(() => vi.fn());
vi.mock("inquirer", () => ({
  default: { prompt: promptMock, registerPrompt: vi.fn() },
}));
vi.mock("inquirer-search-list", () => ({ default: {} }));

import { Command } from "commander";
import { resolveCommandArgv } from "../lib/command-picker.js";

const originalStdinTTY = process.stdin.isTTY;
const originalStdoutTTY = process.stdout.isTTY;

const setTTY = (value: boolean | undefined): void => {
  Object.defineProperty(process.stdin, "isTTY", { value, configurable: true });
  Object.defineProperty(process.stdout, "isTTY", { value, configurable: true });
};

const buildProgram = (): Command => {
  const program = new Command();
  const products = new Command("products").description("Manage products.");
  products.command("list").description("List products.");
  products.command("get").description("Get a product.");
  const pages = new Command("pages").description("Manage pages.");
  pages.command("list").description("List pages.");
  program.addCommand(products);
  program.addCommand(pages);
  program.addCommand(new Command("whoami").description("Current user."));
  return program;
};

const HEAD = ["node", "cli"];

/** Names offered by the last picker invocation. */
const offered = (call = 0): string[] =>
  promptMock.mock.calls[call][0][0].choices.map(
    (choice: { value: string }) => choice.value,
  );

beforeEach(() => {
  promptMock.mockReset();
  setTTY(true);
});

afterAll(() => {
  setTTY(originalStdinTTY);
  Object.defineProperty(process.stdout, "isTTY", {
    value: originalStdoutTTY,
    configurable: true,
  });
});

describe("resolveCommandArgv passthrough", () => {
  it("returns argv untouched without a TTY", async () => {
    setTTY(false);
    const argv = [...HEAD, "p"];
    expect(await resolveCommandArgv(buildProgram(), argv)).toBe(argv);
    expect(promptMock).not.toHaveBeenCalled();
  });

  it.each([["--json"], ["-j"], ["--help"], ["-h"]])(
    "returns argv untouched when %s is present",
    async (flag) => {
      const argv = [...HEAD, "p", flag];
      expect(await resolveCommandArgv(buildProgram(), argv)).toBe(argv);
      expect(promptMock).not.toHaveBeenCalled();
    },
  );

  it("returns argv untouched when it starts with a flag", async () => {
    const argv = [...HEAD, "--verbose", "products", "list"];
    expect(await resolveCommandArgv(buildProgram(), argv)).toBe(argv);
    expect(promptMock).not.toHaveBeenCalled();
  });

  it("passes a fully valid command line through without prompting", async () => {
    const argv = [...HEAD, "products", "list", "--limit", "10"];
    expect(await resolveCommandArgv(buildProgram(), argv)).toEqual(argv);
    expect(promptMock).not.toHaveBeenCalled();
  });

  it("falls back to the original argv when the picker fails", async () => {
    promptMock.mockRejectedValueOnce(new Error("no terminal"));
    const argv = [...HEAD, "p"];
    expect(await resolveCommandArgv(buildProgram(), argv)).toBe(argv);
  });
});

describe("resolveCommandArgv guided mode", () => {
  it("walks bare invocations through command and subcommand pickers", async () => {
    promptMock
      .mockResolvedValueOnce({ value: "products" })
      .mockResolvedValueOnce({ value: "list" });
    const result = await resolveCommandArgv(buildProgram(), [...HEAD]);
    expect(result).toEqual([...HEAD, "products", "list"]);
    expect(offered(0)).toEqual(["pages", "products", "whoami"]);
    expect(offered(1)).toEqual(["get", "list"]);
  });

  it("filters the picker to commands matching a partial name", async () => {
    promptMock
      .mockResolvedValueOnce({ value: "pages" })
      .mockResolvedValueOnce({ value: "list" });
    const result = await resolveCommandArgv(buildProgram(), [...HEAD, "p"]);
    expect(result).toEqual([...HEAD, "pages", "list"]);
    expect(offered(0)).toEqual(["pages", "products"]);
  });

  it("keeps remaining argv after resolving a partial command", async () => {
    promptMock.mockResolvedValueOnce({ value: "products" });
    const result = await resolveCommandArgv(buildProgram(), [
      ...HEAD,
      "prod",
      "get",
      "--id",
      "x",
    ]);
    expect(result).toEqual([...HEAD, "products", "get", "--id", "x"]);
    expect(promptMock).toHaveBeenCalledTimes(1);
  });

  it("offers every subcommand when the partial matches nothing", async () => {
    promptMock.mockResolvedValueOnce({ value: "get" });
    const result = await resolveCommandArgv(buildProgram(), [
      ...HEAD,
      "products",
      "gte",
    ]);
    expect(result).toEqual([...HEAD, "products", "get"]);
    expect(offered(0)).toEqual(["get", "list"]);
  });

  it("picks a subcommand when a service is invoked bare", async () => {
    promptMock.mockResolvedValueOnce({ value: "get" });
    const result = await resolveCommandArgv(buildProgram(), [
      ...HEAD,
      "products",
    ]);
    expect(result).toEqual([...HEAD, "products", "get"]);
  });

  it("resolves commands without subcommands directly", async () => {
    promptMock.mockResolvedValueOnce({ value: "whoami" });
    const result = await resolveCommandArgv(buildProgram(), [...HEAD, "who"]);
    expect(result).toEqual([...HEAD, "whoami"]);
    expect(promptMock).toHaveBeenCalledTimes(1);
  });
});
