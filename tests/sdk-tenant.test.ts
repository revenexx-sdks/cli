import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

vi.mock("../lib/config.js", () => ({
  globalConfig: {
    getEndpoint: () => "",
    getProject: () => "",
    getKey: () => "",
    getJWT: () => "",
    getSelfSigned: () => false,
  },
  localConfig: {
    getEndpoint: () => "",
    getProject: () => ({}),
  },
}));

import { sdkForProject } from "../lib/sdks.js";
import { cliConfig } from "../lib/parser.js";

// resolveTenant() reads ~/.revenexx/tenant through os.homedir(), which follows
// $HOME on POSIX — point it at a tmpdir so the real file is never touched.
let home: string;
const originalHome = process.env.HOME;
const originalTenant = process.env.REVENEXX_TENANT;
const originalKey = process.env.REVENEXX_API_KEY;

const writeTenantFile = (slug: string): void => {
  fs.mkdirSync(path.join(home, ".revenexx"), { recursive: true });
  fs.writeFileSync(path.join(home, ".revenexx", "tenant"), slug);
};

const restore = (name: string, value: string | undefined): void => {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
};

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-sdk-tenant-"));
  process.env.HOME = home;
  process.env.REVENEXX_API_KEY = "standard_test";
  delete process.env.REVENEXX_TENANT;
  cliConfig.tenant = undefined;
});

afterEach(() => {
  fs.rmSync(home, { recursive: true, force: true });
  restore("HOME", originalHome);
  restore("REVENEXX_TENANT", originalTenant);
  restore("REVENEXX_API_KEY", originalKey);
  cliConfig.tenant = undefined;
});

describe("sdkForProject tenant header", () => {
  it("--tenant beats the file written by `tenants use`", async () => {
    writeTenantFile("prod");
    cliConfig.tenant = "staging";
    const client = await sdkForProject();
    expect(client.headers["x-revenexx-tenant"]).toBe("staging");
  });

  it("--tenant beats REVENEXX_TENANT", async () => {
    process.env.REVENEXX_TENANT = "prod";
    cliConfig.tenant = "staging";
    const client = await sdkForProject();
    expect(client.headers["x-revenexx-tenant"]).toBe("staging");
  });

  it("without --tenant, the file still beats REVENEXX_TENANT", async () => {
    writeTenantFile("from-file");
    process.env.REVENEXX_TENANT = "from-env";
    const client = await sdkForProject();
    expect(client.headers["x-revenexx-tenant"]).toBe("from-file");
  });
});
