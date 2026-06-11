import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  parseManifest,
  pickManifestValue,
  type AppManifest,
} from "../lib/commands/apps-aliases.js";

let workdir: string;

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-mf-"));
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
});

const writeManifest = (body: string | object): string => {
  const file = path.join(workdir, "manifest.json");
  fs.writeFileSync(
    file,
    typeof body === "string" ? body : JSON.stringify(body),
  );
  return file;
};

describe("parseManifest", () => {
  it("rejects when the file does not exist", () => {
    const result = parseManifest(path.join(workdir, "does-not-exist.json"));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/Manifest not found/);
  });

  it("rejects invalid JSON", () => {
    const file = writeManifest("not valid json {");
    const result = parseManifest(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/not valid JSON/i);
  });

  it("rejects a JSON array (must be an object)", () => {
    const file = writeManifest("[1,2,3]");
    const result = parseManifest(file);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toMatch(/must be a JSON object/);
  });

  it("rejects when required fields are missing", () => {
    const file = writeManifest({ name: "only-name" });
    const result = parseManifest(file);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toMatch(/missing required field/);
      expect(result.reason).toMatch(/function-id/);
      expect(result.reason).toMatch(/runtime/);
    }
  });

  it("accepts kebab-case `function-id`", () => {
    const file = writeManifest({
      "function-id": "my-app",
      name: "My App",
      runtime: "node-22",
    });
    const result = parseManifest(file);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.functionId).toBe("my-app");
  });

  it("accepts camelCase `functionId`", () => {
    const file = writeManifest({
      functionId: "my-app",
      name: "My App",
      runtime: "node-22",
    });
    const result = parseManifest(file);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.functionId).toBe("my-app");
  });

  it("accepts bare `id` as a last-resort alias", () => {
    const file = writeManifest({
      id: "id-alias",
      name: "My App",
      runtime: "node-22",
    });
    const result = parseManifest(file);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.functionId).toBe("id-alias");
  });

  it("normalises optional fields with both kebab and camel aliases", () => {
    const file = writeManifest({
      "function-id": "my-app",
      name: "My App",
      runtime: "node-22",
      "installation-id": "install-1",
      providerBranch: "main",
    });
    const result = parseManifest(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.installationId).toBe("install-1");
      expect(result.value.providerBranch).toBe("main");
    }
  });

  it("preserves arrays and primitive optional fields", () => {
    const file = writeManifest({
      "function-id": "my-app",
      name: "My App",
      runtime: "node-22",
      execute: ["any", "users"],
      events: ["users.*.create"],
      timeout: 30,
      enabled: false,
    });
    const result = parseManifest(file);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.execute).toEqual(["any", "users"]);
      expect(result.value.events).toEqual(["users.*.create"]);
      expect(result.value.timeout).toBe(30);
      expect(result.value.enabled).toBe(false);
    }
  });
});

describe("pickManifestValue", () => {
  it("returns the first defined key", () => {
    const m: AppManifest = { functionId: "a", id: "b" };
    expect(pickManifestValue<string>(m, "function-id", "functionId", "id")).toBe(
      "a",
    );
  });

  it("returns undefined when none of the keys are set", () => {
    expect(pickManifestValue<string>({}, "name", "runtime")).toBeUndefined();
  });

  it("does not coalesce falsy non-undefined values", () => {
    const m: AppManifest = { enabled: false };
    expect(pickManifestValue<boolean>(m, "enabled")).toBe(false);
  });
});
