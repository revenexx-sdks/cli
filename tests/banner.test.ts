import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const sensitiveTenants = vi.hoisted(() => [] as string[]);
vi.mock("../lib/config.js", () => ({
  globalConfig: {
    getSensitiveTenants: () => sensitiveTenants,
    getEndpoint: () => "",
    getProject: () => "",
    getAliases: () => ({}),
    getSelfSigned: () => false,
    getKey: () => "",
    getJWT: () => "",
  },
  localConfig: {},
}));

import { Command } from "commander";
import {
  isSensitiveContext,
  renderContextBanner,
  cliConfig,
} from "../lib/parser.js";

const originalStderrTTY = process.stderr.isTTY;
const setStderrTTY = (value: boolean): void => {
  Object.defineProperty(process.stderr, "isTTY", {
    value,
    configurable: true,
  });
};

beforeEach(() => {
  sensitiveTenants.length = 0;
  delete process.env.REVENEXX_SENSITIVE_TENANTS;
  cliConfig.json = false;
  cliConfig.quiet = false;
  cliConfig.endpoint = "https://staging.internal.test";
  cliConfig.tenant = "dev";
  setStderrTTY(true);
});

afterEach(() => {
  Object.defineProperty(process.stderr, "isTTY", {
    value: originalStderrTTY,
    configurable: true,
  });
  cliConfig.endpoint = undefined;
  cliConfig.tenant = undefined;
});

describe("isSensitiveContext", () => {
  it("flags an endpoint containing 'prod'", () => {
    expect(isSensitiveContext("https://api-prod.test", "dev")).toBe(true);
  });

  it("flags a tenant slug containing 'prod'", () => {
    expect(isSensitiveContext("https://staging.internal.test", "prod-eu")).toBe(
      true,
    );
  });

  it("flags a configured sensitive tenant", () => {
    sensitiveTenants.push("acme");
    expect(isSensitiveContext("https://staging.internal.test", "acme")).toBe(
      true,
    );
  });

  it("flags a tenant listed in REVENEXX_SENSITIVE_TENANTS", () => {
    process.env.REVENEXX_SENSITIVE_TENANTS = "globex, acme";
    expect(isSensitiveContext("https://staging.internal.test", "acme")).toBe(
      true,
    );
  });

  it("is calm for a non-default, non-prod context", () => {
    expect(isSensitiveContext("https://staging.internal.test", "dev")).toBe(
      false,
    );
  });
});

describe("renderContextBanner suppression", () => {
  const products = new Command("products");

  const capture = (): string => {
    let out = "";
    const spy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk: unknown) => {
        out += String(chunk);
        return true;
      });
    renderContextBanner(new Command("root"), products);
    spy.mockRestore();
    return out;
  };

  it("prints a banner for a normal command on a TTY", () => {
    expect(capture()).not.toBe("");
  });

  it("is silent under --json", () => {
    cliConfig.json = true;
    expect(capture()).toBe("");
  });

  it("is silent under --quiet", () => {
    cliConfig.quiet = true;
    expect(capture()).toBe("");
  });

  it("is silent when stderr is not a TTY", () => {
    setStderrTTY(false);
    expect(capture()).toBe("");
  });

  it("is silent for context-free commands like status", () => {
    let out = "";
    const spy = vi
      .spyOn(process.stderr, "write")
      .mockImplementation((chunk: unknown) => {
        out += String(chunk);
        return true;
      });
    renderContextBanner(new Command("root"), new Command("status"));
    spy.mockRestore();
    expect(out).toBe("");
  });

  it("shows the PRODUCTION badge for a sensitive context", () => {
    cliConfig.endpoint = "https://api-prod.test";
    expect(capture()).toContain("PRODUCTION");
  });
});
