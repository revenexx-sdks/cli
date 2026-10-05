import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import { cliConfig } from "../lib/parser.js";
import {
  readActiveTenant,
  writeActiveTenant,
  collectKnownTenants,
  selectableTenants,
  tenantChoices,
  tenantOverrideNotes,
  tenants,
  ACCOUNT_SOURCE,
} from "../lib/commands/tenants.js";

let workdir: string;
let tenantFile: string;

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-tenants-"));
  tenantFile = path.join(workdir, "tenant");
  delete process.env.REVENEXX_TENANT;
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
  delete process.env.REVENEXX_TENANT;
});

describe("tenants helpers", () => {
  it("read returns empty string when no file and no env", () => {
    expect(readActiveTenant(tenantFile)).toBe("");
  });

  it("write persists the slug, read reads it back", () => {
    writeActiveTenant("acme", tenantFile);
    expect(fs.readFileSync(tenantFile, "utf-8")).toBe("acme");
    expect(readActiveTenant(tenantFile)).toBe("acme");
  });

  it("write creates the parent directory if missing", () => {
    const nested = path.join(workdir, "deep", "nested", "tenant");
    writeActiveTenant("acme-nested", nested);
    expect(fs.existsSync(nested)).toBe(true);
    expect(readActiveTenant(nested)).toBe("acme-nested");
  });

  it("the file written by `tenants use` overrides REVENEXX_TENANT", () => {
    writeActiveTenant("on-disk", tenantFile);
    process.env.REVENEXX_TENANT = "from-env";
    expect(readActiveTenant(tenantFile)).toBe("on-disk");
  });

  it("falls back to REVENEXX_TENANT when no file exists", () => {
    process.env.REVENEXX_TENANT = "from-env";
    expect(readActiveTenant(tenantFile)).toBe("from-env");
  });

  it("falls back to REVENEXX_TENANT when the file is empty", () => {
    fs.writeFileSync(tenantFile, "  \n");
    process.env.REVENEXX_TENANT = "from-env";
    expect(readActiveTenant(tenantFile)).toBe("from-env");
  });

  it("trims trailing whitespace from the file value", () => {
    fs.writeFileSync(tenantFile, "  acme-trimmed  \n");
    expect(readActiveTenant(tenantFile)).toBe("acme-trimmed");
  });

  it("overwriting replaces the previous slug", () => {
    writeActiveTenant("first", tenantFile);
    writeActiveTenant("second", tenantFile);
    expect(readActiveTenant(tenantFile)).toBe("second");
  });
});

describe("collectKnownTenants", () => {
  it("returns empty list when no sources provide a tenant", () => {
    expect(collectKnownTenants({})).toEqual([]);
  });

  it("aggregates and dedupes slugs across sources", () => {
    const result = collectKnownTenants({
      env: "acme",
      projectFile: "acme",
      tenantFile: "globex",
      sessionEmails: ["apikey:acme", "user@example.com", "apikey:initech"],
    });
    const bySlug = Object.fromEntries(result.map((t) => [t.slug, t]));
    expect(Object.keys(bySlug).sort()).toEqual(["acme", "globex", "initech"]);
    expect(bySlug["acme"].sources).toContain("REVENEXX_TENANT");
    expect(bySlug["acme"].sources).toContain(".revenexx.yaml");
    expect(bySlug["acme"].sources).toContain("login session");
    expect(bySlug["globex"].sources).toEqual(["~/.revenexx/tenant"]);
  });

  it("ignores non-apikey session emails and blank values", () => {
    const result = collectKnownTenants({
      env: "  ",
      sessionEmails: ["user@example.com", "apikey: ", "apikey:acme"],
    });
    expect(result.map((t) => t.slug)).toEqual(["acme"]);
  });

  it("lists the account's SSO memberships first, labelled as such (DX-230)", () => {
    const result = collectKnownTenants({
      accountTenants: ["acme", "globex"],
      tenantFile: "initech",
      sessionEmails: ["user@example.com"],
    });
    expect(result.map((t) => t.slug)).toEqual(["acme", "globex", "initech"]);
    expect(result[0].sources).toEqual([ACCOUNT_SOURCE]);
    expect(result[2].sources).toEqual(["~/.revenexx/tenant"]);
  });

  it("merges an account membership with the same slug from other sources", () => {
    const result = collectKnownTenants({
      accountTenants: ["acme", " ", ""],
      env: "acme",
    });
    expect(result).toHaveLength(1);
    expect(result[0].sources).toEqual([ACCOUNT_SOURCE, "REVENEXX_TENANT"]);
  });

  it("marks the active slug", () => {
    const result = collectKnownTenants({
      env: "acme",
      tenantFile: "globex",
      active: "globex",
    });
    const bySlug = Object.fromEntries(result.map((t) => [t.slug, t]));
    expect(bySlug["globex"].active).toBe(true);
    expect(bySlug["acme"].active).toBe(false);
  });
});

describe("tenants use (DX-460)", () => {
  it("takes the slug as optional so a bare `tenants use` can list tenants", () => {
    const use = tenants.commands.find((c) => c.name() === "use");
    expect(use).toBeDefined();
    expect(use!.usage()).toBe("[options] [slug]");
  });

  it("offers the account's memberships when the SSO token has any", () => {
    const known = collectKnownTenants({
      accountTenants: ["revenexx", "revenexx-test"],
      tenantFile: "stale-local",
    });
    expect(selectableTenants(["revenexx", "revenexx-test"], known)).toEqual([
      "revenexx",
      "revenexx-test",
    ]);
  });

  it("falls back to every known slug without SSO memberships", () => {
    const known = collectKnownTenants({ env: "acme", tenantFile: "globex" });
    expect(selectableTenants([], known)).toEqual(["acme", "globex"]);
  });

  it("marks and de-duplicates picker entries", () => {
    expect(tenantChoices(["a", "b"], "b")).toEqual([
      { name: "a", value: "a" },
      { name: "b (active)", value: "b" },
    ]);
    expect(selectableTenants(["a", "a", " "], [])).toEqual(["a"]);
  });

  it("warns when the new tenant overrides REVENEXX_TENANT or .revenexx.yaml", () => {
    const notes = tenantOverrideNotes("revenexx-test", {
      env: "revenexx",
      projectFile: "revenexx",
    });
    expect(notes).toHaveLength(2);
    expect(notes[0]).toContain("REVENEXX_TENANT");
    expect(notes[1]).toContain(".revenexx.yaml");
  });

  it("stays quiet when the ambient sources agree or are unset", () => {
    expect(
      tenantOverrideNotes("acme", { env: "acme", projectFile: " " }),
    ).toEqual([]);
    expect(tenantOverrideNotes("acme", {})).toEqual([]);
  });
});

describe("tenants current returns data in every output mode (DX-460)", () => {
  const runCurrent = async (): Promise<unknown[][]> => {
    const lines: unknown[][] = [];
    const spy = vi
      .spyOn(console, "log")
      .mockImplementation((...args: unknown[]) => void lines.push(args));
    try {
      const current = tenants.commands.find((c) => c.name() === "current")!;
      await current.parseAsync([], { from: "user" });
    } finally {
      spy.mockRestore();
    }
    return lines;
  };

  const saved = { output: cliConfig.output, quiet: cliConfig.quiet };
  afterEach(() => {
    cliConfig.output = saved.output;
    cliConfig.quiet = saved.quiet;
  });

  it("emits the slug as JSON rows, which the TUI reads from stdout", async () => {
    process.env.REVENEXX_TENANT = "acme";
    cliConfig.output = "json";
    const slug = readActiveTenant();
    expect(await runCurrent()).toEqual([[[{ Tenant: slug, Active: true }]]]);
  });

  it("prints the bare slug under --quiet so $(… current) works", async () => {
    process.env.REVENEXX_TENANT = "acme";
    cliConfig.output = "table";
    cliConfig.quiet = true;
    expect(await runCurrent()).toEqual([[readActiveTenant()]]);
  });
});
