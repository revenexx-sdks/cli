import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";

const promptMock = vi.hoisted(() => vi.fn());
vi.mock("inquirer", () => ({
  default: { prompt: promptMock, registerPrompt: vi.fn() },
}));
vi.mock("inquirer-search-list", () => ({ default: {} }));

const callMock = vi.hoisted(() => vi.fn());
vi.mock("../lib/sdks.js", () => ({
  sdkForProject: vi.fn(async () => ({ call: callMock })),
}));

import {
  extractItems,
  resourceChoice,
  splitArrayInput,
  isInteractive,
  promptForMissing,
  confirmDestructive,
  type PromptSpec,
} from "../lib/interactive.js";
import { cliConfig } from "../lib/parser.js";

const originalStdinTTY = process.stdin.isTTY;
const originalStdoutTTY = process.stdout.isTTY;

const setTTY = (value: boolean | undefined): void => {
  Object.defineProperty(process.stdin, "isTTY", { value, configurable: true });
  Object.defineProperty(process.stdout, "isTTY", { value, configurable: true });
};

const spec = (overrides: Partial<PromptSpec>): PromptSpec => ({
  key: "id",
  option: "--id <id>",
  name: "id",
  type: "string",
  required: true,
  ...overrides,
});

beforeEach(() => {
  promptMock.mockReset();
  callMock.mockReset();
  cliConfig.json = false;
  cliConfig.output = "table";
  cliConfig.force = false;
  setTTY(false);
});

afterAll(() => {
  setTTY(originalStdinTTY);
  Object.defineProperty(process.stdout, "isTTY", {
    value: originalStdoutTTY,
    configurable: true,
  });
});

describe("isInteractive", () => {
  it("is false without a TTY", () => {
    expect(isInteractive()).toBe(false);
  });

  it("is true with TTY stdin/stdout", () => {
    setTTY(true);
    expect(isInteractive()).toBe(true);
  });

  it("stays interactive on a TTY regardless of output format", () => {
    // Interactivity keys off the streams, not the format, so --json/--csv/--yaml
    // all prompt on a terminal. Piping (non-TTY) is what suppresses prompts and
    // keeps machine output byte-stable.
    setTTY(true);
    cliConfig.json = true;
    cliConfig.output = "json";
    expect(isInteractive()).toBe(true);
  });

  it("is false when piped, even with a format flag", () => {
    setTTY(false);
    cliConfig.json = true;
    cliConfig.output = "json";
    expect(isInteractive()).toBe(false);
  });
});

describe("extractItems", () => {
  it("unwraps the gateway `items` envelope", () => {
    expect(
      extractItems({ items: [{ id: "a" }], page: { total: 1 } }),
    ).toEqual([{ id: "a" }]);
  });

  it("accepts a bare array", () => {
    expect(extractItems([{ id: "a" }, null, 5])).toEqual([{ id: "a" }]);
  });

  it("falls back to the first array-valued key", () => {
    expect(extractItems({ page: {}, rows: [{ id: "b" }] })).toEqual([
      { id: "b" },
    ]);
  });

  it("returns [] for scalars and array-less objects", () => {
    expect(extractItems("nope")).toEqual([]);
    expect(extractItems({ total: 3 })).toEqual([]);
  });
});

describe("resourceChoice", () => {
  it("prefers the field matching the path parameter name", () => {
    const choice = resourceChoice({ id: "x", functionId: "f1" }, "functionId");
    expect(choice?.value).toBe("f1");
  });

  it("falls back to id and labels with a friendly field", () => {
    const choice = resourceChoice({ id: "p1", sku: "WIDGET-1" }, "id");
    expect(choice?.value).toBe("p1");
    expect(choice?.name).toContain("WIDGET-1");
    expect(choice?.name).toContain("p1");
  });

  it("returns null when no identifier exists", () => {
    expect(resourceChoice({ name: "orphan" }, "id")).toBeNull();
  });
});

describe("splitArrayInput", () => {
  it("splits on commas and whitespace, dropping empties", () => {
    expect(splitArrayInput("a, b  c,,d ")).toEqual(["a", "b", "c", "d"]);
  });
});

describe("promptForMissing", () => {
  it("returns options untouched when nothing required is missing", async () => {
    const options = { id: "p1", extra: undefined };
    const result = await promptForMissing(options, [spec({})]);
    expect(result).toBe(options);
    expect(promptMock).not.toHaveBeenCalled();
  });

  it("fails fast through commander in non-interactive contexts", async () => {
    const error = vi.fn((message: string): never => {
      throw new Error(message);
    });
    await expect(
      promptForMissing({}, [spec({})], { error }),
    ).rejects.toThrow("error: required option '--id <id>' not specified");
    expect(error).toHaveBeenCalledWith(
      "error: required option '--id <id>' not specified",
      { exitCode: 1, code: "commander.missingMandatoryOptionValue" },
    );
    expect(promptMock).not.toHaveBeenCalled();
  });

  it("exits(1) without a command handle in non-interactive contexts", async () => {
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: string | number | null): never => {
        throw new Error(`exit:${code}`);
      });
    const stderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    await expect(promptForMissing({}, [spec({})])).rejects.toThrow("exit:1");
    expect(stderr).toHaveBeenCalledWith(
      "error: required option '--id <id>' not specified\n",
    );
    exit.mockRestore();
    stderr.mockRestore();
  });

  it("prompts for each missing required option on a TTY", async () => {
    setTTY(true);
    promptMock
      .mockResolvedValueOnce({ value: "open" })
      .mockResolvedValueOnce({ value: "42" });
    const result = await promptForMissing({ kept: "yes" }, [
      spec({ key: "status", name: "status", enum: ["open", "paid"] }),
      spec({ key: "limit", name: "limit", type: "integer" }),
    ]);
    expect(result).toEqual({ kept: "yes", status: "open", limit: 42 });
    expect(promptMock.mock.calls[0][0][0].type).toBe("list");
    expect(promptMock.mock.calls[0][0][0].choices).toEqual(["open", "paid"]);
    expect(promptMock.mock.calls[1][0][0].type).toBe("input");
  });

  it("uses checkbox for required enum arrays and password for secrets", async () => {
    setTTY(true);
    promptMock
      .mockResolvedValueOnce({ value: ["a"] })
      .mockResolvedValueOnce({ value: "hunter2" });
    const result = await promptForMissing({}, [
      spec({ key: "scopes", name: "scopes", type: "array", enum: ["a", "b"] }),
      spec({ key: "password", name: "password", secret: true }),
    ]);
    expect(result).toEqual({ scopes: ["a"], password: "hunter2" });
    expect(promptMock.mock.calls[0][0][0].type).toBe("checkbox");
    expect(promptMock.mock.calls[1][0][0].type).toBe("password");
    expect(promptMock.mock.calls[1][0][0].mask).toBe("*");
  });

  it("splits free-text array answers into values", async () => {
    setTTY(true);
    promptMock.mockResolvedValueOnce({ value: "a, b c" });
    const result = await promptForMissing({}, [
      spec({ key: "items", name: "items", type: "array" }),
    ]);
    expect(result.items).toEqual(["a", "b", "c"]);
    const question = promptMock.mock.calls[0][0][0];
    expect(question.validate(", ,")).toBe("At least one value is required.");
    expect(question.validate("a, ,")).toBe(true);
  });

  it("offers a searchable picker backed by the list endpoint", async () => {
    setTTY(true);
    callMock.mockResolvedValueOnce({
      items: [
        { id: "p1", name: "Widget" },
        { id: "p2", name: "Gadget" },
      ],
    });
    promptMock.mockResolvedValueOnce({ value: "p2" });
    const result = await promptForMissing({}, [
      spec({ resource: { listPath: "/products", hasLimit: true } }),
    ]);
    expect(result.id).toBe("p2");
    expect(callMock).toHaveBeenCalledWith(
      "get",
      "/products",
      { "content-type": "application/json" },
      { limit: 100 },
    );
    const question = promptMock.mock.calls[0][0][0];
    expect(question.type).toBe("search-list");
    expect(question.choices.map((c: { value: string }) => c.value)).toEqual([
      "p1",
      "p2",
    ]);
  });

  it("falls back to plain input when the listing fails", async () => {
    setTTY(true);
    callMock.mockRejectedValueOnce(new Error("boom"));
    promptMock.mockResolvedValueOnce({ value: "manual-id" });
    const result = await promptForMissing({}, [
      spec({ resource: { listPath: "/products", hasLimit: true } }),
    ]);
    expect(result.id).toBe("manual-id");
    expect(promptMock.mock.calls[0][0][0].type).toBe("input");
  });
});

describe("confirmDestructive", () => {
  it("skips the prompt with --force", async () => {
    setTTY(true);
    cliConfig.force = true;
    await confirmDestructive("products delete");
    expect(promptMock).not.toHaveBeenCalled();
  });

  it("skips the prompt in non-interactive contexts (scripts unchanged)", async () => {
    await confirmDestructive("products delete");
    expect(promptMock).not.toHaveBeenCalled();
  });

  it("proceeds when the user confirms", async () => {
    setTTY(true);
    promptMock.mockResolvedValueOnce({ confirmed: true });
    await confirmDestructive("products delete");
    expect(promptMock).toHaveBeenCalledTimes(1);
    expect(promptMock.mock.calls[0][0][0].type).toBe("confirm");
    expect(promptMock.mock.calls[0][0][0].default).toBe(false);
  });

  it("aborts with exit code 1 when declined", async () => {
    setTTY(true);
    promptMock.mockResolvedValueOnce({ confirmed: false });
    const exit = vi
      .spyOn(process, "exit")
      .mockImplementation((code?: string | number | null): never => {
        throw new Error(`exit:${code}`);
      });
    const stderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    await expect(confirmDestructive("products delete")).rejects.toThrow(
      "exit:1",
    );
    exit.mockRestore();
    stderr.mockRestore();
  });
});
