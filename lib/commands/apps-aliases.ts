import * as fs from "fs";
import * as path from "path";
import { sdkForProject } from "../sdks.js";
import type { RequestParams } from "../types.js";
import {
  actionRunner,
  parse,
  parseBool,
  parseInteger,
  log,
  error,
} from "../parser.js";
import { apps } from "./services/apps.js";

/**
 * Surface the DX-22 command shapes (`revenexx apps list` and
 * `revenexx apps register --manifest …`) on top of the generated
 * `apps apps-list` / `apps apps-create` subcommands. The underlying API
 * calls are identical — these are thin, manifest-aware wrappers.
 */

const callApps = async (
  method: string,
  payload: RequestParams,
): Promise<Record<string, unknown>> => {
  const client = await sdkForProject();
  return (await client.call(
    method,
    "/apps",
    { "content-type": "application/json" },
    payload,
  )) as Record<string, unknown>;
};

export interface AppManifest {
  id?: string;
  functionId?: string;
  "function-id"?: string;
  name?: string;
  runtime?: string;
  execute?: string[];
  events?: string[];
  schedule?: string;
  timeout?: number;
  enabled?: boolean;
  logging?: boolean;
  entrypoint?: string;
  commands?: string;
  scopes?: string[];
  installationId?: string;
  "installation-id"?: string;
  providerRepositoryId?: string;
  "provider-repository-id"?: string;
  providerBranch?: string;
  "provider-branch"?: string;
  providerSilentMode?: boolean;
  "provider-silent-mode"?: boolean;
  providerRootDirectory?: string;
  "provider-root-directory"?: string;
  specification?: string;
}

export const pickManifestValue = <T,>(
  m: AppManifest,
  ...keys: (keyof AppManifest)[]
): T | undefined => {
  for (const k of keys) {
    const v = m[k];
    if (v !== undefined) return v as T;
  }
  return undefined;
};

/** Canonicalised view of a manifest, ready to feed `Apps.create`. */
export interface ResolvedManifest {
  functionId: string;
  name: string;
  runtime: string;
  execute?: string[];
  events?: string[];
  schedule?: string;
  timeout?: number;
  enabled?: boolean;
  logging?: boolean;
  entrypoint?: string;
  commands?: string;
  scopes?: string[];
  installationId?: string;
  providerRepositoryId?: string;
  providerBranch?: string;
  providerSilentMode?: boolean;
  providerRootDirectory?: string;
  specification?: string;
}

export type ParseManifestResult =
  | { ok: true; value: ResolvedManifest; source: string; reason?: undefined }
  | { ok: false; reason: string; source: string };

/**
 * Read and validate a manifest file. Pure aside from `fs` access — designed
 * to be unit-testable without mocking the SDK or commander.
 */
export const parseManifest = (file: string): ParseManifestResult => {
  const source = path.resolve(file);
  if (!fs.existsSync(source)) {
    return { ok: false, reason: `Manifest not found: ${source}`, source };
  }

  let raw: AppManifest;
  try {
    raw = JSON.parse(fs.readFileSync(source, "utf-8"));
  } catch (e) {
    return {
      ok: false,
      reason: `Manifest is not valid JSON: ${(e as Error).message}`,
      source,
    };
  }

  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return {
      ok: false,
      reason: "Manifest must be a JSON object",
      source,
    };
  }

  const functionId = pickManifestValue<string>(
    raw,
    "function-id",
    "functionId",
    "id",
  );
  const name = pickManifestValue<string>(raw, "name");
  const runtime = pickManifestValue<string>(raw, "runtime");

  const missing: string[] = [];
  if (!functionId) missing.push("function-id / functionId / id");
  if (!name) missing.push("name");
  if (!runtime) missing.push("runtime");
  if (missing.length) {
    return {
      ok: false,
      reason: `Manifest is missing required field(s): ${missing.join(", ")}`,
      source,
    };
  }

  return {
    ok: true,
    source,
    value: {
      functionId: functionId!,
      name: name!,
      runtime: runtime!,
      execute: pickManifestValue<string[]>(raw, "execute"),
      events: pickManifestValue<string[]>(raw, "events"),
      schedule: pickManifestValue<string>(raw, "schedule"),
      timeout: pickManifestValue<number>(raw, "timeout"),
      enabled: pickManifestValue<boolean>(raw, "enabled"),
      logging: pickManifestValue<boolean>(raw, "logging"),
      entrypoint: pickManifestValue<string>(raw, "entrypoint"),
      commands: pickManifestValue<string>(raw, "commands"),
      scopes: pickManifestValue<string[]>(raw, "scopes"),
      installationId: pickManifestValue<string>(
        raw,
        "installation-id",
        "installationId",
      ),
      providerRepositoryId: pickManifestValue<string>(
        raw,
        "provider-repository-id",
        "providerRepositoryId",
      ),
      providerBranch: pickManifestValue<string>(
        raw,
        "provider-branch",
        "providerBranch",
      ),
      providerSilentMode: pickManifestValue<boolean>(
        raw,
        "provider-silent-mode",
        "providerSilentMode",
      ),
      providerRootDirectory: pickManifestValue<string>(
        raw,
        "provider-root-directory",
        "providerRootDirectory",
      ),
      specification: pickManifestValue<string>(raw, "specification"),
    },
  };
};

apps
  .command("list")
  .description("List all Apps in the active project (alias of `apps-list`).")
  .option(`--queries [queries...]`, `Optional filter queries.`)
  .option(`--search <search>`, `Free-text filter (max 256 chars).`)
  .option(
    `--total [value]`,
    `When false, skips counting the total. Defaults to true.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({
        queries,
        search,
        total,
      }: {
        queries?: string[];
        search?: string;
        total?: boolean;
      }) => {
        const payload: RequestParams = {};
        if (queries !== undefined) payload["queries"] = queries;
        if (search !== undefined) payload["search"] = search;
        if (total !== undefined) payload["total"] = total;
        parse(await callApps("get", payload));
      },
    ),
  );

apps
  .command("register")
  .description(
    "Register a new App from a manifest file (wraps `apps-create`).",
  )
  .requiredOption(
    "--manifest <path>",
    "Path to a JSON manifest describing the App.",
  )
  .option(
    "--timeout <seconds>",
    "Override the manifest timeout (in seconds).",
    parseInteger,
  )
  .action(
    actionRunner(
      async ({
        manifest,
        timeout,
      }: {
        manifest: string;
        timeout?: number;
      }) => {
        const result = parseManifest(manifest);
        if (!result.ok) {
          error(result.reason);
          return;
        }
        const m = result.value;
        log(`Registering App '${m.name}' (runtime: ${m.runtime}) from ${result.source}…`);

        const payload: RequestParams = {
          functionId: m.functionId,
          name: m.name,
          runtime: m.runtime,
        };
        const optional: Record<string, unknown> = {
          execute: m.execute,
          events: m.events,
          schedule: m.schedule,
          timeout: timeout ?? m.timeout,
          enabled: m.enabled,
          logging: m.logging,
          entrypoint: m.entrypoint,
          commands: m.commands,
          scopes: m.scopes,
          installationId: m.installationId,
          providerRepositoryId: m.providerRepositoryId,
          providerBranch: m.providerBranch,
          providerSilentMode: m.providerSilentMode,
          providerRootDirectory: m.providerRootDirectory,
          specification: m.specification,
        };
        for (const [key, value] of Object.entries(optional)) {
          if (value !== undefined) payload[key] = value;
        }
        parse(await callApps("post", payload));
      },
    ),
  );

export { apps };
