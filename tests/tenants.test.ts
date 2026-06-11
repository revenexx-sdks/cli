import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  readActiveTenant,
  writeActiveTenant,
  collectKnownTenants,
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
