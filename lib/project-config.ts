import * as fs from "fs";
import * as path from "path";
import * as os from "os";

/**
 * Minimal loader for a project-local `.revenexx.yaml`.
 *
 * Supported syntax: flat `key: value` pairs, `#` comments, blank lines.
 * Walks up from the current working directory to find the nearest file —
 * mirroring the `auth.json` discovery pattern from Composer.
 */
export interface ProjectConfig {
  token?: string;
  apiUrl?: string;
  projectId?: string;
  tenant?: string;
  raw: Record<string, string>;
  source: string | null;
}

const CANDIDATE_NAMES = [".revenexx.yaml", ".revenexx.yml"];

const parseFlatYaml = (input: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const line of input.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    const hash = value.indexOf(" #");
    if (hash !== -1) value = value.slice(0, hash).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (key) out[key] = value;
  }
  return out;
};

const findFile = (start: string): string | null => {
  let dir = path.resolve(start);
  for (;;) {
    for (const name of CANDIDATE_NAMES) {
      const candidate = path.join(dir, name);
      if (fs.existsSync(candidate)) return candidate;
    }
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
};

let cached: ProjectConfig | null = null;
let cachedStart: string | null = null;

export const loadProjectConfig = (
  start: string = process.cwd(),
): ProjectConfig => {
  if (cached && cachedStart === start) return cached;
  const source = findFile(start);
  if (!source) {
    cached = { raw: {}, source: null };
    cachedStart = start;
    return cached;
  }
  const raw = parseFlatYaml(fs.readFileSync(source, "utf-8"));
  cached = {
    token: raw.token || raw.api_key || raw.apiKey,
    apiUrl: raw.api_url || raw.apiUrl || raw.endpoint,
    projectId: raw.project_id || raw.projectId || raw.project,
    tenant: raw.tenant,
    raw,
    source,
  };
  cachedStart = start;
  return cached;
};

/** Landing experience for a bare `revenexx` on an interactive TTY (DX-140). */
export type DefaultMode = "tui" | "guided" | "help";

/**
 * Resolve what a bare `revenexx` opens on an interactive TTY:
 *
 * - `tui` (default) — launch the full-screen Ink app.
 * - `guided` — the DX-98 searchable command picker.
 * - `help` — print usage, like a non-TTY invocation.
 *
 * `REVENEXX_NO_TUI` (any value other than `0`/`false`) forces `guided`;
 * otherwise a `defaultMode:` key in `.revenexx.yaml` wins; else `tui`.
 * Only the empty invocation consults this — partial/named commands and
 * explicit subcommands are unaffected.
 */
export const resolveDefaultMode = (): DefaultMode => {
  const noTui = process.env.REVENEXX_NO_TUI?.toLowerCase();
  if (noTui !== undefined && noTui !== "" && noTui !== "0" && noTui !== "false") {
    return "guided";
  }
  const configured = loadProjectConfig().raw.defaultMode?.toLowerCase();
  if (configured === "tui" || configured === "guided" || configured === "help") {
    return configured;
  }
  return "tui";
};

/**
 * Resolve the tenant slug for API requests. The gateway requires an
 * `X-Revenexx-Tenant` header on every request.
 *
 * Resolution order: ~/.revenexx/tenant (explicit `tenants use` switch) →
 * REVENEXX_TENANT env → `tenant:` in .revenexx.yaml → fallback (usually
 * the project ID).
 */
export const resolveTenant = (fallback: string = ""): string => {
  try {
    const fromDisk = fs
      .readFileSync(path.join(os.homedir(), ".revenexx", "tenant"), "utf-8")
      .trim();
    if (fromDisk) return fromDisk;
  } catch {
    // No tenant file — fall through.
  }
  if (process.env.REVENEXX_TENANT) return process.env.REVENEXX_TENANT;
  const projectFile = loadProjectConfig();
  if (projectFile.tenant) return projectFile.tenant;
  return fallback;
};
