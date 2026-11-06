import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

/**
 * `deploy cube`: validate locally, find-or-create the Cube, upload, wait for
 * the build, then wait for the release round like an app (PE-1256) — or name
 * every problem the registry raised and fail. A gateway without Cube release
 * rounds keeps the "submitted for review" ending.
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
  deployCube,
  parseCubeBuildLogs,
  cubeLabel,
  deploymentCubeIdentity,
  packDirectory,
  previewAccept,
  releaseStatus,
  type DeployCubeFlags,
} from "../lib/commands/deploy.js";
import { cliConfig } from "../lib/parser.js";

const CUBE_ID = "cube-123";
const DEPLOYMENT_ID = "dep-456";

const SUBMITTED_LOGS = [
  "Bundling the Cube",
  "Release submitted for review: acme/google-ads@1.2.0 (review pending).",
].join("\n");

const REJECTED_LOGS = [
  "Bundling the Cube",
  "Release rejected by analytics-api: 2 problems",
  "  metrics /metrics/0/dataset → unknown dataset 'clicks'",
  "  cube /requires/orders → no such app",
  "",
].join("\n");

const MANIFEST = JSON.stringify({ kind: "cube", vendor: "acme", name: "google-ads", version: "1.2.0", review: "pending" });

const baseFlags = (overrides: Partial<DeployCubeFlags> = {}): DeployCubeFlags => ({
  timeout: 0, // give up right after the first status read
  releaseWait: 0, // read the release round once
  ...overrides,
});

/** A Cube release round as the registry lists it. */
const round = (overrides: Record<string, unknown> = {}): Record<string, unknown> => ({
  version: "1.2.0",
  rc_number: 1,
  mode: "deploy",
  state: "approved",
  deployment_id: DEPLOYMENT_ID,
  gate_results: { pre: { results: [{ id: "schema", status: "passed" }] } },
  decision_due_at: null,
  rejection: null,
  ...overrides,
});

interface GatewayOptions {
  status?: string;
  buildLogs?: string;
  existing?: boolean;
  cube?: Record<string, unknown>;
  /** Rounds on /cubes/:id/releases; `null` answers 404 like a gateway without them. */
  rounds?: Record<string, unknown>[] | null;
}

const notFound = (): never => {
  throw Object.assign(new Error("Route not found"), { code: 404 });
};

const gateway = (opts: GatewayOptions = {}) => (call: Call): unknown => {
  const { status = "ready", buildLogs = SUBMITTED_LOGS, existing = true } = opts;
  const rounds = opts.rounds === undefined ? [round()] : opts.rounds;
  if (call.method === "get" && call.path === `/cubes/${CUBE_ID}/releases`) return rounds === null ? notFound() : { data: rounds };
  if (call.method === "post" && call.path === `/cubes/${CUBE_ID}/releases/accept`) {
    return rounds === null ? notFound() : { ...round({ mode: "preview", state: "in_review" }), version: call.params.version };
  }
  const cube = { $id: CUBE_ID, name: "google-ads", installationId: "", providerRepositoryId: "", providerBranch: "", ...opts.cube };
  if (call.method === "get" && call.path === "/cubes") return { total: existing ? 1 : 0, cubes: existing ? [cube] : [] };
  if (call.method === "post" && call.path === "/cubes") return cube;
  if (call.method === "get" && call.path === `/cubes/${CUBE_ID}`) return cube;
  if (call.method === "post" && call.path === `/cubes/${CUBE_ID}/deployments`) return { $id: DEPLOYMENT_ID, status: "waiting" };
  if (call.method === "post" && call.path === `/cubes/${CUBE_ID}/deployments/vcs`) return { $id: DEPLOYMENT_ID, status: "waiting" };
  if (call.method === "get" && call.path === `/cubes/${CUBE_ID}/deployments/${DEPLOYMENT_ID}`) {
    return { $id: DEPLOYMENT_ID, status, buildLogs, manifestJson: status === "ready" ? MANIFEST : "" };
  }
  return {};
};

const paths = (method: string): string[] => calls.filter((c) => c.method === method).map((c) => c.path);

let workdir: string;
const stdout: string[] = [];
let stderr: string[] = [];

const writeCube = (doc: Record<string, unknown> = { vendor: "acme", name: "google-ads", version: "1.2.0" }): void => {
  fs.writeFileSync(path.join(workdir, "cube.json"), JSON.stringify(doc));
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
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-deploy-cube-"));
  writeCube();
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

describe("parseCubeBuildLogs", () => {
  it("reads the submitted line", () => {
    expect(parseCubeBuildLogs(SUBMITTED_LOGS)).toEqual({
      submitted: "Release submitted for review: acme/google-ads@1.2.0 (review pending).",
      rejected: null,
      problems: [],
    });
  });

  it("reads the rejection and one problem per indented line", () => {
    const outcome = parseCubeBuildLogs(REJECTED_LOGS);
    expect(outcome.rejected).toBe("Release rejected by analytics-api: 2 problems");
    expect(outcome.problems).toEqual([
      "metrics /metrics/0/dataset → unknown dataset 'clicks'",
      "cube /requires/orders → no such app",
    ]);
  });

  it("tolerates missing logs", () => {
    expect(parseCubeBuildLogs(undefined)).toEqual({ submitted: null, rejected: null, problems: [] });
  });
});

describe("cube identity", () => {
  it("labels vendor/name@version and reads manifestJson as string or object", () => {
    expect(cubeLabel({ vendor: "acme", name: "google-ads", version: "1.2.0" })).toBe("acme/google-ads@1.2.0");
    expect(cubeLabel({ name: "google-ads" })).toBe("google-ads");
    expect(deploymentCubeIdentity({ manifestJson: MANIFEST })).toEqual({ vendor: "acme", name: "google-ads", version: "1.2.0" });
    expect(deploymentCubeIdentity({ manifestJson: { vendor: "acme", name: "x" } })).toEqual({ vendor: "acme", name: "x" });
    expect(deploymentCubeIdentity({ manifestJson: "not json" })).toEqual({});
  });
});

describe("deploy cube", () => {
  it("creates a new Cube, uploads an activated deployment and reports the approved round", async () => {
    respond = gateway({ existing: false });
    await deployCube(workdir, baseFlags());

    expect(paths("post")).toEqual(["/cubes", `/cubes/${CUBE_ID}/deployments`]);
    const create = calls.find((c) => c.method === "post" && c.path === "/cubes");
    expect(create?.params).toEqual({ cubeId: "unique()", name: "google-ads" });
    const upload = calls.find((c) => c.path === `/cubes/${CUBE_ID}/deployments`);
    expect(upload?.params.activate).toBe(true);
    expect(upload?.params.releaseMode).toBe("deploy");
    expect(upload?.params.code).toBeInstanceOf(File);
    expect(paths("get")).toContain(`/cubes/${CUBE_ID}/releases`);
    const out = stdout.join("\n");
    expect(out).toContain("Release submitted for review: acme/google-ads@1.2.0 (review pending).");
    expect(out).toContain("Cube acme/google-ads@1.2.0 approved and deployed");
  });

  it("keeps the submitted-for-review ending on a gateway without Cube release rounds", async () => {
    respond = gateway({ rounds: null });
    await asJson(() => deployCube(workdir, baseFlags()));
    expect(JSON.parse(stdout.join("\n"))).toMatchObject({ status: "submitted", review: "pending", release: null });
  });

  it("reuses a Cube found by name", async () => {
    respond = gateway();
    await deployCube(workdir, baseFlags());
    expect(paths("post")).toEqual([`/cubes/${CUBE_ID}/deployments`]);
  });

  it("skips the lookup with --cube-id", async () => {
    respond = gateway();
    await deployCube(workdir, baseFlags({ cubeId: CUBE_ID }));
    expect(paths("get")).not.toContain("/cubes");
  });

  it("writes only the result document to stdout under --json", async () => {
    respond = gateway();
    await asJson(() => deployCube(workdir, baseFlags()));
    expect(JSON.parse(stdout.join("\n"))).toEqual({
      cube: "acme/google-ads",
      version: "1.2.0",
      cubeId: CUBE_ID,
      deploymentId: DEPLOYMENT_ID,
      resumed: false,
      source: "upload",
      releaseMode: "deploy",
      validation: "skipped",
      status: "approved",
      review: "approved",
      release: { version: "1.2.0", rc: 1, mode: "deploy", state: "approved", gates: "pre passed · post pending", decisionDueAt: null, rejection: null },
    });
  });

  it("holds a round still in review and says how to follow it", async () => {
    respond = gateway({ rounds: [round({ state: "in_review", decision_due_at: "2026-11-06T12:00:00Z" })] });
    await deployCube(workdir, baseFlags());
    const out = stdout.join("\n");
    expect(out).toMatch(/release 1\.2\.0 rc 1 is in_review: the build is uploaded but not live until it is approved/);
    expect(out).not.toMatch(/publish and install/);
    expect(out).toContain(`release status --cube-id ${CUBE_ID}`);
    expect(out).toContain("waiting for release approval");
  });

  it("puts a held round into the --json result", async () => {
    respond = gateway({ rounds: [round({ state: "submitted" })] });
    await asJson(() => deployCube(workdir, baseFlags()));
    expect(JSON.parse(stdout.join("\n"))).toMatchObject({ status: "submitted", review: "submitted", release: { state: "submitted", rc: 1 } });
  });

  it("holds when no round is recorded for the deployment yet", async () => {
    respond = gateway({ rounds: [] });
    await deployCube(workdir, baseFlags());
    expect(stdout.join("\n")).toMatch(/no release round is recorded for this Cube deployment yet/);
  });

  it("fails with the reviewer's reason when the round was rejected", async () => {
    respond = gateway({ rounds: [round({ state: "rejected", rejection: { reason: "metric names clash" } })] });
    await expect(deployCube(workdir, baseFlags())).rejects.toThrow(/release 1\.2\.0 rc 1 was rejected: metric names clash/);
  });

  it("rejected under --json: the result document first, then the failure", async () => {
    respond = gateway({ rounds: [round({ state: "rejected", rejection: "no" })] });
    await asJson(() => expect(deployCube(workdir, baseFlags())).rejects.toThrow(/was rejected: no/));
    expect(JSON.parse(stdout.join("\n"))).toMatchObject({ status: "rejected", review: "rejected", release: { rejection: "no" } });
  });

  it("names every problem of a rejected release and fails", async () => {
    respond = gateway({ status: "failed", buildLogs: REJECTED_LOGS });
    await expect(deployCube(workdir, baseFlags())).rejects.toThrow(/acme\/google-ads@1\.2\.0 was rejected \(2 problems\)/);
    const out = stdout.join("\n");
    expect(out).toContain("Release rejected by analytics-api: 2 problems");
    expect(out).toContain("metrics /metrics/0/dataset → unknown dataset 'clicks'");
    expect(out).toContain("cube /requires/orders → no such app");
  });

  it("puts the problems into the --json result before failing", async () => {
    respond = gateway({ status: "failed", buildLogs: REJECTED_LOGS });
    await asJson(() => expect(deployCube(workdir, baseFlags())).rejects.toThrow(/rejected/));
    const result = JSON.parse(stdout.join("\n"));
    expect(result.status).toBe("rejected");
    expect(result.problems).toEqual([
      "metrics /metrics/0/dataset → unknown dataset 'clicks'",
      "cube /requires/orders → no such app",
    ]);
  });

  it("preview cube uploads with releaseMode preview and points at preview accept", async () => {
    respond = gateway({ rounds: [round({ mode: "preview", state: "candidate" })] });
    await deployCube(workdir, baseFlags({ releaseMode: "preview" }));
    expect(calls.find((c) => c.path === `/cubes/${CUBE_ID}/deployments`)?.params).toMatchObject({ activate: true, releaseMode: "preview" });
    expect(stdout.join("\n")).toContain(`preview accept --cube-id ${CUBE_ID}`);
  });

  it("names the preview resume command when a preview build wait runs out", async () => {
    respond = gateway({ status: "building" });
    await expect(deployCube(workdir, baseFlags({ releaseMode: "preview" }))).rejects.toThrow(
      new RegExp(`preview cube --cube-id ${CUBE_ID} --deployment-id ${DEPLOYMENT_ID}`),
    );
  });

  it("names the resume command when the build wait runs out", async () => {
    respond = gateway({ status: "building" });
    await expect(deployCube(workdir, baseFlags())).rejects.toThrow(
      new RegExp(`deploy cube --cube-id ${CUBE_ID} --deployment-id ${DEPLOYMENT_ID}`),
    );
  });

  it("resumes an existing deployment without uploading, even outside the Cube directory", async () => {
    fs.rmSync(path.join(workdir, "cube.json"));
    respond = gateway();
    await deployCube(workdir, baseFlags({ cubeId: CUBE_ID, deploymentId: DEPLOYMENT_ID }));
    expect(paths("post")).toEqual([]);
    expect(stdout.join("\n")).toContain("acme/google-ads@1.2.0");
  });

  it("refuses a directory without cube.json", async () => {
    fs.rmSync(path.join(workdir, "cube.json"));
    respond = gateway();
    await expect(deployCube(workdir, baseFlags())).rejects.toThrow(/not a Cube directory/);
    expect(calls).toEqual([]);
  });

  it("runs the Cube's own validator and stops before any call when it fails", async () => {
    fs.mkdirSync(path.join(workdir, "scripts"));
    fs.writeFileSync(path.join(workdir, "scripts", "cube.mjs"), "console.log('cube /name → bad'); process.exit(1);\n");
    respond = gateway();
    await expect(deployCube(workdir, baseFlags())).rejects.toThrow(/local validation failed/);
    expect(calls).toEqual([]);
    expect(stderr.join("")).toContain("cube /name → bad");
  });

  it("passes a green validator and records it", async () => {
    fs.mkdirSync(path.join(workdir, "scripts"));
    fs.writeFileSync(path.join(workdir, "scripts", "cube.mjs"), "process.exit(0);\n");
    respond = gateway();
    await asJson(() => deployCube(workdir, baseFlags()));
    expect(JSON.parse(stdout.join("\n")).validation).toBe("passed");
  });

  it("--skip-validate does not run the validator", async () => {
    fs.mkdirSync(path.join(workdir, "scripts"));
    fs.writeFileSync(path.join(workdir, "scripts", "cube.mjs"), "process.exit(1);\n");
    respond = gateway();
    await deployCube(workdir, baseFlags({ skipValidate: true }));
    expect(paths("post")).toEqual([`/cubes/${CUBE_ID}/deployments`]);
  });

  it("--from-git triggers a deployment of the production branch of a connected Cube", async () => {
    respond = gateway({ cube: { installationId: "inst-1", providerRepositoryId: "repo-1", providerBranch: "main" } });
    await deployCube(workdir, baseFlags({ fromGit: true }));
    const vcs = calls.find((c) => c.path === `/cubes/${CUBE_ID}/deployments/vcs`);
    expect(vcs?.params).toEqual({ type: "branch", reference: "main", activate: true });
    expect(paths("post")).toEqual([`/cubes/${CUBE_ID}/deployments/vcs`]);
  });

  it("--from-git always runs in deploy mode", async () => {
    respond = gateway({ cube: { installationId: "inst-1", providerRepositoryId: "repo-1", providerBranch: "main" } });
    await asJson(() => deployCube(workdir, baseFlags({ fromGit: true, releaseMode: "preview" })));
    expect(JSON.parse(stdout.join("\n")).releaseMode).toBe("deploy");
  });

  it("--from-git passes --ref and --ref-type through", async () => {
    respond = gateway({ cube: { installationId: "inst-1", providerRepositoryId: "repo-1", providerBranch: "main" } });
    await deployCube(workdir, baseFlags({ fromGit: true, ref: "v1.2.0", refType: "tag" }));
    const vcs = calls.find((c) => c.path === `/cubes/${CUBE_ID}/deployments/vcs`);
    expect(vcs?.params).toEqual({ type: "tag", reference: "v1.2.0", activate: true });
  });

  it("--from-git refuses a Cube that is not connected", async () => {
    respond = gateway();
    await expect(deployCube(workdir, baseFlags({ fromGit: true }))).rejects.toThrow(/not connected to a repository/);
    expect(paths("post")).toEqual([]);
  });
});

describe("packDirectory for Cubes", () => {
  it("leaves out dist/ when asked to", async () => {
    fs.mkdirSync(path.join(workdir, "dist"));
    fs.writeFileSync(path.join(workdir, "dist", "release.json"), "{}");
    const { gunzipSync } = await import("node:zlib");
    const file = await packDirectory(workdir, ["dist"]);
    const tarball = gunzipSync(Buffer.from(await file.arrayBuffer())).toString("binary");
    expect(tarball).toContain("cube.json");
    expect(tarball).not.toContain("release.json");
  });
});

describe("Cube release commands", () => {
  it("release status finds the Cube by cube.json and reads its rounds", async () => {
    respond = gateway({ rounds: [round({ state: "in_review" })] });
    await asJson(() => releaseStatus(workdir, {}));
    expect(paths("get")).toEqual(["/cubes", `/cubes/${CUBE_ID}/releases`]);
    expect(JSON.parse(stdout.join("\n"))).toMatchObject({ cube: "google-ads", id: CUBE_ID });
  });

  it("release status --cube-id skips the lookup", async () => {
    respond = gateway();
    await asJson(() => releaseStatus(workdir, { cubeId: CUBE_ID }));
    expect(paths("get")).toEqual([`/cubes/${CUBE_ID}/releases`]);
  });

  it("preview accept posts the cube.json version to the Cube's accept path", async () => {
    respond = gateway();
    await previewAccept(workdir, { cubeId: CUBE_ID });
    const accept = calls.find((c) => c.method === "post");
    expect(accept?.path).toBe(`/cubes/${CUBE_ID}/releases/accept`);
    expect(accept?.params).toEqual({ version: "1.2.0" });
  });
});
