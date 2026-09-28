import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

/**
 * `deploy app` orchestration (DX-229 / DX-234): the flow must never abandon a
 * deployment silently. A build wait that runs out names the resume command,
 * `--deployment-id` finishes an existing deployment without re-uploading, and
 * a publish that lands server-side while the client times out is detected
 * through the marketplace status instead of failing the flow.
 */

type Call = { method: string; path: string; params: Record<string, unknown> };

const calls: Call[] = [];
let respond: (call: Call) => unknown = () => ({});

vi.mock("../lib/sdks.js", () => ({
  sdkForProject: async () => ({
    call: async (method: string, apiPath: string, _headers: unknown, params: Record<string, unknown>) => {
      const call = { method: method.toLowerCase(), path: apiPath, params };
      calls.push(call);
      return respond(call);
    },
  }),
}));

vi.mock("../lib/project-config.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../lib/project-config.js")>()),
  resolveTenant: () => "acme",
}));

import { deployApp, deployTheme, parseSeconds, type DeployAppFlags, type DeployThemeFlags } from "../lib/commands/deploy.js";
import { cliConfig } from "../lib/parser.js";

const APP_ID = "app-123";
const DEPLOYMENT_ID = "dep-456";

const baseFlags = (overrides: Partial<DeployAppFlags> = {}): DeployAppFlags => ({
  runtime: "node-25",
  publish: true,
  install: true,
  timeout: 0, // give up right after the first status read — no 5s poll sleeps in tests
  ...overrides,
});

/** Default gateway: app exists, upload succeeds, build is ready, publish + install work. */
const happyGateway = (deploymentStatus = "ready") => (call: Call): unknown => {
  if (call.method === "get" && call.path === "/apps") return { apps: [{ $id: APP_ID, name: "cost-centers" }] };
  if (call.method === "get" && call.path === `/apps/${APP_ID}`) return { $id: APP_ID, name: "cost-centers" };
  if (call.method === "post" && call.path === `/apps/${APP_ID}/deployments`) return { $id: DEPLOYMENT_ID };
  if (call.method === "get" && call.path === `/apps/${APP_ID}/deployments/${DEPLOYMENT_ID}`) return { $id: DEPLOYMENT_ID, status: deploymentStatus };
  if (call.method === "get" && call.path === `/apps/${APP_ID}/marketplace-status`) return { is_published: false };
  return {};
};

const paths = (method: string): string[] => calls.filter((c) => c.method === method).map((c) => c.path);

let workdir: string;
/** Everything the command wrote to stdout, in order (console.log is spied below). */
const stdout: string[] = [];

beforeEach(() => {
  calls.length = 0;
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-deploy-flow-"));
  fs.writeFileSync(path.join(workdir, "manifest.json"), JSON.stringify({ name: "cost-centers" }));
  fs.mkdirSync(path.join(workdir, "src"));
  fs.writeFileSync(path.join(workdir, "src", "main.js"), "export default {};");
  stdout.length = 0;
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    stdout.push(args.map((arg) => String(arg ?? "")).join(" "));
  });
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("parseSeconds (--timeout <seconds>)", () => {
  it("accepts positive whole seconds and rejects everything else", () => {
    expect(parseSeconds("600")).toBe(600);
    expect(parseSeconds("1200")).toBe(1200);
    for (const bad of ["0", "-5", "1.5", "abc", "", "600ms"]) {
      expect(() => parseSeconds(bad)).toThrow(/positive whole number of seconds/);
    }
  });
});

describe("deploy app", () => {
  it("runs upload → build → publish → install in order on the happy path", async () => {
    respond = happyGateway();
    await deployApp(workdir, baseFlags());

    expect(paths("post")).toEqual([
      `/apps/${APP_ID}/deployments`,
      `/apps/${APP_ID}/publish`,
      "/apps/marketplace/install",
    ]);
    const install = calls.find((c) => c.path === "/apps/marketplace/install");
    expect(install?.params).toEqual({ owner: "acme", name: "cost-centers" });
  });

  it("installs on the --tenant slug over the tenant file and REVENEXX_TENANT", async () => {
    respond = happyGateway();
    cliConfig.tenant = "staging";
    try {
      await deployApp(workdir, baseFlags());
    } finally {
      cliConfig.tenant = undefined;
    }

    const install = calls.find((c) => c.path === "/apps/marketplace/install");
    expect(install?.params).toEqual({ owner: "staging", name: "cost-centers" });
  });

  it("on build timeout says publish + install did NOT run and names the resume command", async () => {
    respond = happyGateway("waiting");

    await expect(deployApp(workdir, baseFlags())).rejects.toThrow(
      /publish \+ install did NOT run[\s\S]*deploy app --function-id app-123 --deployment-id dep-456/,
    );
    // Nothing after the build wait ran, and nothing was re-uploaded.
    expect(paths("post")).toEqual([`/apps/${APP_ID}/deployments`]);
  });

  it("keeps the caller's flags in the resume command", async () => {
    respond = happyGateway("building");

    await expect(deployApp(workdir, baseFlags({ owner: "other", publish: false }))).rejects.toThrow(
      /install did NOT run[\s\S]*deploy app --function-id app-123 --deployment-id dep-456 --owner other --no-publish/,
    );
  });

  it("--deployment-id resumes an existing deployment without packaging or uploading", async () => {
    respond = happyGateway();
    await deployApp(workdir, baseFlags({ functionId: APP_ID, deploymentId: DEPLOYMENT_ID }));

    expect(paths("post")).toEqual([`/apps/${APP_ID}/publish`, "/apps/marketplace/install"]);
    expect(paths("get")).toContain(`/apps/${APP_ID}/deployments/${DEPLOYMENT_ID}`);
  });

  it("resumes from any directory by reading the app name from the registry", async () => {
    respond = happyGateway();
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-not-an-app-"));
    try {
      await deployApp(elsewhere, baseFlags({ functionId: APP_ID, deploymentId: DEPLOYMENT_ID }));
    } finally {
      fs.rmSync(elsewhere, { recursive: true, force: true });
    }

    const install = calls.find((c) => c.path === "/apps/marketplace/install");
    expect(install?.params).toEqual({ owner: "acme", name: "cost-centers" });
  });

  it("skips the publish while resuming when the Marketplace already lists the app", async () => {
    const happy = happyGateway();
    respond = (call) => (call.method === "get" && call.path === `/apps/${APP_ID}/marketplace-status` ? { is_published: true } : happy(call));

    await deployApp(workdir, baseFlags({ functionId: APP_ID, deploymentId: DEPLOYMENT_ID }));
    expect(paths("post")).toEqual(["/apps/marketplace/install"]);
  });

  it("re-publishes while resuming when the Marketplace does not list the app yet", async () => {
    respond = happyGateway();
    await deployApp(workdir, baseFlags({ functionId: APP_ID, deploymentId: DEPLOYMENT_ID }));
    expect(paths("post")).toEqual([`/apps/${APP_ID}/publish`, "/apps/marketplace/install"]);
  });

  it("never registers a new app while resuming", async () => {
    respond = (call) => (call.method === "get" && call.path === "/apps" ? { apps: [] } : {});

    await expect(deployApp(workdir, baseFlags({ deploymentId: DEPLOYMENT_ID }))).rejects.toThrow(/pass --function-id together with --deployment-id/);
    expect(paths("post")).toEqual([]);
  });

  it("continues to install when the publish times out client-side but the Marketplace lists the app", async () => {
    const happy = happyGateway();
    respond = (call) => {
      if (call.method === "post" && call.path === `/apps/${APP_ID}/publish`) {
        throw new Error("Request timed out after 420ms (POST /apps/app-123/publish).");
      }
      if (call.method === "get" && call.path === `/apps/${APP_ID}/marketplace-status`) return { is_published: true };
      return happy(call);
    };

    await deployApp(workdir, baseFlags());
    expect(paths("post")).toEqual([`/apps/${APP_ID}/deployments`, `/apps/${APP_ID}/publish`, "/apps/marketplace/install"]);
  });

  it("when the publish fails and the app is not listed, says install did NOT run and how to check + finish", async () => {
    const happy = happyGateway();
    respond = (call) => {
      if (call.method === "post" && call.path === `/apps/${APP_ID}/publish`) {
        const err = new Error("Request timed out after 420ms (POST /apps/app-123/publish).") as Error & { code?: number };
        err.code = 503;
        throw err;
      }
      return happy(call);
    };

    const failure = (await deployApp(workdir, baseFlags()).then(
      () => null,
      (err: unknown) => err,
    )) as (Error & { code?: number }) | null;
    expect(failure).toBeInstanceOf(Error);
    if (!failure) throw new Error("unreachable");
    expect(failure.message).toMatch(/install did NOT run/);
    expect(failure.message).toMatch(/apps get-marketplace-status --function-id app-123/);
    expect(failure.message).toMatch(/deploy app --function-id app-123 --deployment-id dep-456/);
    // The original error object survives, so exit codes and request details still come from it.
    expect(failure.code).toBe(503);
    expect(paths("post")).not.toContain("/apps/marketplace/install");
  });

  it("does not claim the publish may have landed when the gateway rejected it with a 4xx", async () => {
    const happy = happyGateway();
    respond = (call) => {
      if (call.method === "post" && call.path === `/apps/${APP_ID}/publish`) {
        const err = new Error("Marketplace listing requires a description") as Error & { code?: number };
        err.code = 400;
        throw err;
      }
      return happy(call);
    };

    const failure = (await deployApp(workdir, baseFlags()).then(
      () => null,
      (err: unknown) => err,
    )) as Error | null;
    expect(failure?.message).toMatch(/the gateway rejected the publish, and install did NOT run/);
    expect(failure?.message).not.toMatch(/may still have landed/);
    expect(failure?.message).toMatch(/deploy app --function-id app-123 --deployment-id dep-456/);
  });

  it("when the install fails, says no routes were written and offers an install-only resume", async () => {
    const happy = happyGateway();
    respond = (call) => {
      if (call.method === "post" && call.path === "/apps/marketplace/install") throw new Error("boom");
      return happy(call);
    };

    await expect(deployApp(workdir, baseFlags())).rejects.toThrow(
      /install did NOT run, so no routes were written[\s\S]*deploy app --function-id app-123 --deployment-id dep-456 --no-publish/,
    );
  });

  it("treats a canceled build as terminal instead of waiting for the timeout", async () => {
    respond = happyGateway("canceled");
    await expect(deployApp(workdir, baseFlags({ timeout: 600 }))).rejects.toThrow(/build was canceled/);
  });
});

describe("deploy theme", () => {
  const SITE_ID = "site-789";

  const themeFlags = (overrides: Partial<DeployThemeFlags> = {}): DeployThemeFlags => ({
    framework: "nuxt",
    adapter: "ssr",
    buildRuntime: "node-25",
    installCommand: "npm install",
    buildCommand: "npm run build",
    outputDirectory: ".output",
    publish: true,
    install: true,
    timeout: 0,
    ...overrides,
  });

  const siteGateway = (call: Call): unknown => {
    if (call.method === "get" && call.path === `/sites/${SITE_ID}`) return { $id: SITE_ID, name: "midnight" };
    if (call.method === "get" && call.path === `/sites/${SITE_ID}/deployments/${DEPLOYMENT_ID}`) return { $id: DEPLOYMENT_ID, status: "ready" };
    return {};
  };

  it("resumes from any directory by reading the theme name from the site", async () => {
    respond = siteGateway;
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-not-a-theme-"));
    try {
      await deployTheme(elsewhere, themeFlags({ siteId: SITE_ID, deploymentId: DEPLOYMENT_ID }));
    } finally {
      fs.rmSync(elsewhere, { recursive: true, force: true });
    }

    expect(paths("post")).toEqual([`/sites/${SITE_ID}/publish`, "/apps/marketplace/install"]);
    const install = calls.find((c) => c.path === "/apps/marketplace/install");
    expect(install?.params).toEqual({ owner: "acme", name: "midnight" });
  });

  it("tells a resume without theme.json and without --site-id where to run from", async () => {
    respond = siteGateway;
    const elsewhere = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-not-a-theme-"));
    try {
      await expect(deployTheme(elsewhere, themeFlags({ deploymentId: DEPLOYMENT_ID }))).rejects.toThrow(
        /run the resume from the theme directory, or pass --site-id together with --deployment-id/,
      );
    } finally {
      fs.rmSync(elsewhere, { recursive: true, force: true });
    }
    expect(calls).toEqual([]);
  });
});

/**
 * DX-241: in every machine-readable format stdout holds the result document
 * and nothing else, so `deploy … --json | jq` works. The progress lines stay
 * visible — on stderr, where a long build wait is still readable in a CI log.
 */
describe("machine-readable stdout (DX-241)", () => {
  const deployWithOutput = async (
    output: "json" | "yaml",
  ): Promise<{ out: string; err: string }> => {
    const stderr = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    cliConfig.output = output;
    cliConfig.json = output === "json";
    try {
      respond = happyGateway();
      await deployApp(workdir, baseFlags());
      return {
        out: stdout.join("\n"),
        err: stderr.mock.calls.map((args) => String(args[0])).join(""),
      };
    } finally {
      cliConfig.output = "table";
      cliConfig.json = false;
    }
  };

  it("--json writes only the result document to stdout", async () => {
    const { out, err } = await deployWithOutput("json");

    expect(JSON.parse(out)).toEqual({
      app: "cost-centers",
      functionId: APP_ID,
      deploymentId: DEPLOYMENT_ID,
      resumed: false,
      published: true,
      installed: true,
    });
    expect(err).toContain("Waiting for the platform build");
    expect(err).toContain("Publishing to the Marketplace");
  });

  it("renders the result document in the other machine-readable formats", async () => {
    const { out, err } = await deployWithOutput("yaml");

    expect(out).toContain("app: cost-centers");
    expect(out).toContain("installed: true");
    expect(out).not.toContain("\u2139");
    expect(err).toContain("Waiting for the platform build");
  });

  it("keeps the status lines on stdout for human output", async () => {
    respond = happyGateway();
    await deployApp(workdir, baseFlags());

    expect(stdout.join("\n")).toContain("Waiting for the platform build");
  });
});
