import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { loadProjectConfig, resolveDefaultMode } from "../lib/project-config.js";

// loadProjectConfig caches keyed on `start` dir, so every test picks a unique
// tmpdir and never collides with another test's cache entry.
let workdir: string;

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-pc-"));
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
});

describe("loadProjectConfig", () => {
  it("returns an empty result when no file exists", async () => {
    
    const cfg = loadProjectConfig(workdir);
    expect(cfg.source).toBeNull();
    expect(cfg.token).toBeUndefined();
    expect(cfg.projectId).toBeUndefined();
  });

  it("parses flat key:value entries", async () => {
    fs.writeFileSync(
      path.join(workdir, ".revenexx.yaml"),
      [
        "# header comment",
        "token: standard_xxxxxxxxxxxxxxxxxx",
        "project_id: acme-prod",
        "api_url: https://staging.example.com/v1",
        "tenant: acme",
      ].join("\n"),
    );
    
    const cfg = loadProjectConfig(workdir);
    expect(cfg.token).toBe("standard_xxxxxxxxxxxxxxxxxx");
    expect(cfg.projectId).toBe("acme-prod");
    expect(cfg.apiUrl).toBe("https://staging.example.com/v1");
    expect(cfg.tenant).toBe("acme");
    expect(cfg.source).toMatch(/\.revenexx\.yaml$/);
  });

  it("strips single and double quotes from values", async () => {
    fs.writeFileSync(
      path.join(workdir, ".revenexx.yaml"),
      `token: "quoted-token-123"\nproject_id: 'quoted-proj'\n`,
    );
    
    const cfg = loadProjectConfig(workdir);
    expect(cfg.token).toBe("quoted-token-123");
    expect(cfg.projectId).toBe("quoted-proj");
  });

  it("walks up parent dirs to find the nearest file", async () => {
    fs.writeFileSync(
      path.join(workdir, ".revenexx.yaml"),
      "token: from-parent\n",
    );
    const nested = path.join(workdir, "a", "b", "c");
    fs.mkdirSync(nested, { recursive: true });
    
    const cfg = loadProjectConfig(nested);
    expect(cfg.token).toBe("from-parent");
  });

  it("accepts the .yml extension too", async () => {
    fs.writeFileSync(
      path.join(workdir, ".revenexx.yml"),
      "token: yml-token\n",
    );

    const cfg = loadProjectConfig(workdir);
    expect(cfg.token).toBe("yml-token");
  });
});

describe("resolveDefaultMode", () => {
  const originalCwd = process.cwd();
  const originalNoTui = process.env.REVENEXX_NO_TUI;

  afterEach(() => {
    process.chdir(originalCwd);
    if (originalNoTui === undefined) delete process.env.REVENEXX_NO_TUI;
    else process.env.REVENEXX_NO_TUI = originalNoTui;
  });

  it("defaults to tui with no env or config", () => {
    delete process.env.REVENEXX_NO_TUI;
    process.chdir(workdir);
    expect(resolveDefaultMode()).toBe("tui");
  });

  it("REVENEXX_NO_TUI=1 forces guided", () => {
    process.env.REVENEXX_NO_TUI = "1";
    process.chdir(workdir);
    expect(resolveDefaultMode()).toBe("guided");
  });

  it("ignores a falsy REVENEXX_NO_TUI value", () => {
    process.env.REVENEXX_NO_TUI = "false";
    process.chdir(workdir);
    expect(resolveDefaultMode()).toBe("tui");
  });

  it("honours a defaultMode key from .revenexx.yaml", () => {
    delete process.env.REVENEXX_NO_TUI;
    fs.writeFileSync(
      path.join(workdir, ".revenexx.yaml"),
      "defaultMode: help\n",
    );
    process.chdir(workdir);
    expect(resolveDefaultMode()).toBe("help");
  });

  it("lets REVENEXX_NO_TUI win over a config defaultMode", () => {
    process.env.REVENEXX_NO_TUI = "1";
    fs.writeFileSync(
      path.join(workdir, ".revenexx.yaml"),
      "defaultMode: tui\n",
    );
    process.chdir(workdir);
    expect(resolveDefaultMode()).toBe("guided");
  });
});
