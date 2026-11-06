import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

/**
 * `deploy integration` / `preview integration` (PE-1256): detect the node
 * package, find-or-create the integration, upload (or trigger a Git build),
 * wait for the build and then for the release round, like an app.
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

import {
  deployIntegration,
  readIntegrationPackage,
  detectReleaseKind,
  packDirectory,
  previewAccept,
  releaseStatus,
  type DeployIntegrationFlags,
} from "../lib/commands/deploy.js";
import { cliConfig } from "../lib/parser.js";

const INTEGRATION_ID = "int-123";
const DEPLOYMENT_ID = "dep-456";

const PACKAGE = {
  name: "@acme/integrations-nodes-shopware",
  version: "0.3.0",
  scripts: { build: "tsup && rvnxx-nodes manifest" },
  dependencies: { "@revenexx/integrations-node-sdk": "^0.9.0" },
};
const MANIFEST = { name: "integrations-nodes-shopware", vendor: "acme", version: "0.3.0", title: "Shopware" };

const baseFlags = (overrides: Partial<DeployIntegrationFlags> = {}): DeployIntegrationFlags => ({
  timeout: 0,
  releaseWait: 0,
  ...overrides,
});

const round = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  version: "0.3.0",
  rc_number: 2,
  mode: "deploy",
  state: "approved",
  deployment_id: DEPLOYMENT_ID,
  gate_results: { pre: { results: [{ id: "manifest", status: "passed" }] }, post: { results: [] } },
  decision_due_at: null,
  rejection: null,
  ...overrides,
});

interface GatewayOptions {
  status?: string;
  buildLogs?: string;
  existing?: boolean;
  integration?: Record<string, unknown>;
  rounds?: Record<string, unknown>[] | null;
}

const gateway = (opts: GatewayOptions = {}) => (call: Call): unknown => {
  const { status = "ready", buildLogs = "Published @acme/integrations-nodes-shopware@0.3.0 to org acme.", existing = true } = opts;
  const integration = { $id: INTEGRATION_ID, name: "integrations-nodes-shopware", installationId: "", providerRepositoryId: "", providerBranch: "", ...opts.integration };
  const rounds = opts.rounds === undefined ? [round()] : opts.rounds;
  const base = `/integrations/${INTEGRATION_ID}`;
  if (call.method === "get" && call.path === `${base}/releases`) {
    if (rounds === null) throw Object.assign(new Error("Route not found"), { code: 404 });
    return { data: rounds };
  }
  if (call.method === "post" && call.path === `${base}/releases/accept`) return round({ mode: "preview", state: "in_review", version: call.params.version });
  if (call.method === "get" && call.path === "/integrations") return { total: existing ? 1 : 0, integrations: existing ? [integration] : [] };
  if (call.method === "post" && call.path === "/integrations") return integration;
  if (call.method === "get" && call.path === base) return integration;
  if (call.method === "post" && call.path === `${base}/deployments`) return { $id: DEPLOYMENT_ID, status: "waiting" };
  if (call.method === "post" && call.path === `${base}/deployments/vcs`) return { $id: DEPLOYMENT_ID, status: "waiting" };
  if (call.method === "get" && call.path === `${base}/deployments/${DEPLOYMENT_ID}`) {
    return { $id: DEPLOYMENT_ID, status, buildLogs, manifestJson: status === "ready" ? JSON.stringify(MANIFEST) : "" };
  }
  return {};
};

const paths = (method: string): string[] => calls.filter((c) => c.method === method).map((c) => c.path);

let workdir: string;
const stdout: string[] = [];
let stderr: string[] = [];

const write = (file: string, doc: unknown): void => {
  fs.writeFileSync(path.join(workdir, file), typeof doc === "string" ? doc : JSON.stringify(doc));
};

const asJson = async (fn: () => Promise<void>): Promise<void> => {
  cliConfig.output = "json";
  cliConfig.json = true;
  try {
    await fn();
  } finally {
    cliConfig.output = "table";
    cliConfig.json = false;
  }
};

beforeEach(() => {
  calls.length = 0;
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-deploy-integration-"));
  write("package.json", PACKAGE);
  write("manifest.json", MANIFEST);
  stdout.length = 0;
  stderr = [];
  vi.spyOn(console, "log").mockImplementation((...args: unknown[]) => {
    stdout.push(args.map((arg) => String(arg ?? "")).join(" "));
  });
  vi.spyOn(process.stderr, "write").mockImplementation((chunk: unknown) => {
    stderr.push(String(chunk));
    return true;
  });
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
  vi.restoreAllMocks();
});

describe("readIntegrationPackage", () => {
  it("reads name, vendor and version from manifest.json", () => {
    expect(readIntegrationPackage(workdir)).toEqual({
      name: "integrations-nodes-shopware",
      vendor: "acme",
      version: "0.3.0",
      packageName: "@acme/integrations-nodes-shopware",
    });
  });

  it("falls back to the unscoped package name and version without manifest.json", () => {
    fs.rmSync(path.join(workdir, "manifest.json"));
    expect(readIntegrationPackage(workdir)).toMatchObject({ name: "integrations-nodes-shopware", vendor: "", version: "0.3.0" });
  });

  it("recognises a package by its build script alone", () => {
    write("package.json", { name: "x-nodes", version: "1.0.0", scripts: { build: "tsup && rvnxx-nodes manifest" } });
    expect(readIntegrationPackage(workdir)?.packageName).toBe("x-nodes");
  });

  it("ignores ordinary node packages and the node SDK itself", () => {
    write("package.json", { name: "some-site", dependencies: { nuxt: "^4.0.0" } });
    expect(readIntegrationPackage(workdir)).toBeNull();
    write("package.json", { name: "@revenexx/integrations-node-sdk", scripts: { build: "tsup" } });
    expect(readIntegrationPackage(workdir)).toBeNull();
  });
});

describe("detectReleaseKind", () => {
  it("prefers the integration package over its manifest.json", () => {
    expect(detectReleaseKind(workdir)).toEqual({ kind: "integration", name: "integrations-nodes-shopware", version: "0.3.0" });
  });

  it("still reads an app from manifest.json without an integration package.json", () => {
    fs.rmSync(path.join(workdir, "package.json"));
    expect(detectReleaseKind(workdir)?.kind).toBe("app");
  });

  it("reads a Cube from cube.json", () => {
    write("cube.json", { vendor: "acme", name: "ads", version: "1.0.0" });
    expect(detectReleaseKind(workdir)).toEqual({ kind: "cube", name: "ads", version: "1.0.0" });
  });
});

describe("deploy integration", () => {
  it("creates a new integration, uploads an activated deploy-mode build and reports the approved round", async () => {
    respond = gateway({ existing: false });
    await deployIntegration(workdir, baseFlags());

    expect(paths("post")).toEqual(["/integrations", `/integrations/${INTEGRATION_ID}/deployments`]);
    expect(calls.find((c) => c.method === "post" && c.path === "/integrations")?.params).toEqual({
      integrationId: "unique()",
      name: "integrations-nodes-shopware",
    });
    const upload = calls.find((c) => c.path === `/integrations/${INTEGRATION_ID}/deployments`);
    expect(upload?.params).toMatchObject({ activate: true, releaseMode: "deploy" });
    expect(upload?.params.code).toBeInstanceOf(File);
    expect(stdout.join("\n")).toContain("Integration acme/integrations-nodes-shopware@0.3.0 approved and deployed");
  });

  it("reuses an integration found by name, and --integration-id skips the lookup", async () => {
    respond = gateway();
    await deployIntegration(workdir, baseFlags());
    expect(paths("post")).toEqual([`/integrations/${INTEGRATION_ID}/deployments`]);
    calls.length = 0;
    await deployIntegration(workdir, baseFlags({ integrationId: INTEGRATION_ID }));
    expect(paths("get")).not.toContain("/integrations");
  });

  it("--name overrides the registry name", async () => {
    respond = gateway({ existing: false });
    await deployIntegration(workdir, baseFlags({ name: "shopware" }));
    expect(calls.find((c) => c.method === "post" && c.path === "/integrations")?.params.name).toBe("shopware");
  });

  it("writes only the result document to stdout under --json", async () => {
    respond = gateway();
    await asJson(() => deployIntegration(workdir, baseFlags()));
    expect(JSON.parse(stdout.join("\n"))).toEqual({
      integration: "acme/integrations-nodes-shopware",
      version: "0.3.0",
      integrationId: INTEGRATION_ID,
      deploymentId: DEPLOYMENT_ID,
      resumed: false,
      source: "upload",
      releaseMode: "deploy",
      status: "approved",
      review: "approved",
      release: { version: "0.3.0", rc: 2, mode: "deploy", state: "approved", gates: "pre passed · post passed", decisionDueAt: null, rejection: null },
    });
  });

  it("preview integration uploads a preview candidate and holds it", async () => {
    respond = gateway({ rounds: [round({ mode: "preview", state: "candidate" })] });
    await deployIntegration(workdir, baseFlags({ releaseMode: "preview" }));
    expect(calls.find((c) => c.path === `/integrations/${INTEGRATION_ID}/deployments`)?.params).toMatchObject({ releaseMode: "preview" });
    const out = stdout.join("\n");
    expect(out).toContain("is candidate: the build is uploaded but not live until it is approved");
    expect(out).toContain(`preview accept --integration-id ${INTEGRATION_ID}`);
    expect(out).toContain("waiting for release approval");
  });

  it("fails with the reviewer's reason when the round was rejected", async () => {
    respond = gateway({ rounds: [round({ state: "rejected", rejection: { message: "missing billing.json" } })] });
    await expect(deployIntegration(workdir, baseFlags())).rejects.toThrow(/rc 2 was rejected: missing billing\.json/);
  });

  it("names the problems of a failed build", async () => {
    const logs = ["npm pack", "Release rejected by integrations registry: 1 problem", "  manifest /title → required", ""].join("\n");
    respond = gateway({ status: "failed", buildLogs: logs });
    await expect(deployIntegration(workdir, baseFlags())).rejects.toThrow(/was rejected \(1 problem\)/);
    expect(stdout.join("\n")).toContain("manifest /title → required");
  });

  it("prints the raw build logs when a failure names no problem", async () => {
    respond = gateway({ status: "failed", buildLogs: "npm ERR! code E404" });
    await expect(deployIntegration(workdir, baseFlags())).rejects.toThrow(/the integration build failed/);
    expect(stderr.join("")).toContain("npm ERR! code E404");
  });

  it("names the resume command when the build wait runs out", async () => {
    respond = gateway({ status: "building" });
    await expect(deployIntegration(workdir, baseFlags())).rejects.toThrow(
      new RegExp(`deploy integration --integration-id ${INTEGRATION_ID} --deployment-id ${DEPLOYMENT_ID}`),
    );
  });

  it("resumes outside the package directory with the name from the integration", async () => {
    fs.rmSync(path.join(workdir, "package.json"));
    fs.rmSync(path.join(workdir, "manifest.json"));
    respond = gateway();
    await deployIntegration(workdir, baseFlags({ integrationId: INTEGRATION_ID, deploymentId: DEPLOYMENT_ID }));
    expect(paths("post")).toEqual([]);
    expect(paths("get")).toContain(`/integrations/${INTEGRATION_ID}`);
  });

  it("refuses a directory that is no integration package", async () => {
    write("package.json", { name: "some-site" });
    respond = gateway();
    await expect(deployIntegration(workdir, baseFlags())).rejects.toThrow(/not an integration package/);
    expect(calls).toEqual([]);
  });

  it("--from-git triggers a deploy-mode build of the production branch", async () => {
    respond = gateway({ integration: { installationId: "inst-1", providerRepositoryId: "repo-1", providerBranch: "main" } });
    await asJson(() => deployIntegration(workdir, baseFlags({ fromGit: true })));
    expect(calls.find((c) => c.path === `/integrations/${INTEGRATION_ID}/deployments/vcs`)?.params).toEqual({ type: "branch", reference: "main", activate: true });
    expect(JSON.parse(stdout.join("\n"))).toMatchObject({ source: "git", releaseMode: "deploy" });
  });

  it("--from-git refuses an integration that is not connected", async () => {
    respond = gateway();
    await expect(deployIntegration(workdir, baseFlags({ fromGit: true }))).rejects.toThrow(/Integration 'integrations-nodes-shopware' \(int-123\) is not connected/);
    expect(paths("post")).toEqual([]);
  });
});

describe("integration release commands", () => {
  it("release status detects the package and reads the integration's rounds", async () => {
    respond = gateway({ rounds: [round({ state: "in_review" })] });
    await asJson(() => releaseStatus(workdir, {}));
    expect(paths("get")).toEqual(["/integrations", `/integrations/${INTEGRATION_ID}/releases`]);
    expect(JSON.parse(stdout.join("\n"))).toMatchObject({ integration: "integrations-nodes-shopware", id: INTEGRATION_ID });
  });

  it("preview accept --integration-id posts to the integration's accept path", async () => {
    respond = gateway();
    await previewAccept(workdir, { integrationId: INTEGRATION_ID, rc: 2 });
    const accept = calls.find((c) => c.method === "post");
    expect(accept?.path).toBe(`/integrations/${INTEGRATION_ID}/releases/accept`);
    expect(accept?.params).toEqual({ version: "0.3.0", rc: 2 });
  });
});

describe("packDirectory for integrations", () => {
  it("leaves out dist/ and top-level tarballs", async () => {
    fs.mkdirSync(path.join(workdir, "dist"));
    fs.writeFileSync(path.join(workdir, "dist", "index.js"), "export {}");
    fs.writeFileSync(path.join(workdir, "acme-shopware-0.3.0.tgz"), "x");
    const { gunzipSync } = await import("node:zlib");
    const file = await packDirectory(workdir, ["dist", "*.tgz"]);
    const tarball = gunzipSync(Buffer.from(await file.arrayBuffer())).toString("binary");
    expect(tarball).toContain("package.json");
    expect(tarball).not.toContain("index.js");
    expect(tarball).not.toContain("0.3.0.tgz");
  });
});
