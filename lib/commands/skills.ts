import { Command } from "commander";
import { fetch } from "undici";
import { unzipSync } from "fflate";
import inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";
import {
  actionRunner,
  commandDescriptions,
  success,
  log,
  warn,
  drawTable,
  drawJSON,
  parse,
  cliConfig,
} from "../parser.js";
import { isInteractive } from "../interactive.js";
import { resolveSsoJwt } from "../sdks.js";
import { EXECUTABLE_NAME } from "../constants.js";

/**
 * 'skills' command group — talks to the Revenexx Skill Registry
 * (https://skills.revenexx.ai) to list skills and install/update them into an
 * agent's skill directory.
 *
 * Contributed by the 'skills' plugin.
 */

const SKILLS_API_URL =
  process.env.REVENEXX_SKILLS_API_URL || "https://skills.revenexx.ai";

const DEFAULT_AGENT = "claude";

/** Agent -> project-relative directory the skill bundle is unpacked into. */
const AGENT_TARGETS: Record<string, string> = {
  "claude": ".claude/skills",
  "opencode": ".opencode/skill",
  "copilot": ".github/skills",
};

/**
 * Resolve the bearer token for the Skill Registry. The registry authenticates
 * with a Zitadel-issued OIDC JWT (not a gateway API key), so we use the stored
 * SSO session — auto-refreshed via the shared resolver — with an explicit
 * --token flag as a manual override for scripts/CI.
 */
const resolveToken = async (): Promise<string> => {
  if (cliConfig.token) return cliConfig.token;
  return await resolveSsoJwt();
};

const resolveSkillsEndpoint = (flag?: string): string => {
  const base = flag || SKILLS_API_URL;
  return base.replace(/\/+$/, "");
};

interface SkillsRequestOptions {
  endpoint: string;
  path: string;
  query?: Record<string, string | undefined>;
}

const skillsRequest = async (opts: SkillsRequestOptions): Promise<Response> => {
  const token = await resolveToken();
  if (!token) {
    throw new Error(
      `Not authenticated. Provide a token with --token or run '${EXECUTABLE_NAME} login'.`,
    );
  }

  const url = new URL(opts.endpoint + opts.path);
  for (const [key, value] of Object.entries(opts.query ?? {})) {
    if (value !== undefined && value !== "") url.searchParams.set(key, value);
  }

  const response = (await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  })) as unknown as Response;

  return response;
};

interface SkillListItem {
  vendor: string;
  repo: string;
  name: string;
  slug: string;
  title: string;
  description: string;
  visibility: string;
  category: string;
  /** Comma-separated tag list, e.g. "invoice,erp" (see normalizeTags). */
  tags: string;
  latest_version: string;
}

interface SkillVersion {
  version: string;
  description?: string;
  artifact_hash?: string;
  artifact_bytes?: number;
  source_ref?: string;
  registered_at?: string;
}

interface SkillAuthor {
  name?: string;
  email?: string;
}

interface SkillDetail extends SkillListItem {
  keywords?: string[];
  authors?: SkillAuthor[];
  homepage?: string;
  license?: string;
  targets?: string[];
  allowed_tools?: string[];
  readme?: string;
  source_url?: string;
  versions?: SkillVersion[];
}

/** Build the '<vendor>/<repo>' identifier accepted by `skills add`/`skills show`. */
const skillRepo = (skill: { vendor: string; repo: string }): string =>
  `${skill.vendor}/${skill.repo}`;

/**
 * Flatten a skill's (or the caller's) tags into a clean, lower-cased list.
 * The registry stores tags comma-separated, so a single array entry — or the
 * whole field — may hold several tags like `"invoice, erp"`; split them out so
 * filtering and display treat each tag individually.
 */
const normalizeTags = (tags: unknown): string[] => {
  const raw = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
      ? [tags]
      : [];
  return raw
    .flatMap((entry) => String(entry).split(","))
    .map((tag) => tag.trim().toLowerCase())
    .filter((tag) => tag !== "");
};

/** Split a '<vendor>/<repo>' identifier into its parts, validating the shape. */
const parseRepo = (repo: string): { vendor: string; repoName: string } => {
  const parts = repo.split("/");
  const [vendor, repoName] = parts;
  if (!vendor || !repoName || parts.length !== 2) {
    throw new Error(`Invalid repository '${repo}'. Expected '<owner>/<repo>'.`);
  }
  return { vendor, repoName };
};

/** The skill definition file carrying the YAML frontmatter, at the bundle root. */
const SKILL_FILE = "SKILL.md";

interface InstallStatus {
  installed: boolean;
  /** Installed version, read from the SKILL.md frontmatter, if present. */
  version?: string;
  outdated: boolean;
}

/** Resolve where an agent unpacks the given skill, or `null` for an unknown agent. */
const skillTargetDir = (agent: string, name: string): string | null => {
  const targetBase = AGENT_TARGETS[agent];
  if (!targetBase) return null;
  return path.join(process.cwd(), targetBase, name);
};

/**
 * Read the `version` from a SKILL.md's YAML frontmatter (the `---` fenced block
 * at the top of the file), or `undefined` if the file, the block, or the field
 * is missing.
 */
const readSkillVersion = (skillFilePath: string): string | undefined => {
  let content: string;
  try {
    content = fs.readFileSync(skillFilePath, "utf8");
  } catch {
    return undefined;
  }
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1];
  if (!frontmatter) return undefined;
  const version = frontmatter.match(/^version:[ \t]*(.+?)[ \t]*$/m)?.[1];
  return version?.replace(/^["']|["']$/g, "").trim() || undefined;
};

/**
 * Inspect the local filesystem to determine whether `skill` is installed for
 * `agent` and, comparing the SKILL.md frontmatter version against the
 * registry's latest, whether the installed copy is outdated.
 */
const readInstallStatus = (agent: string, skill: SkillListItem): InstallStatus => {
  const targetDir = skillTargetDir(agent, skill.name);
  if (!targetDir || !fs.existsSync(targetDir)) {
    return { installed: false, outdated: false };
  }

  const version = readSkillVersion(path.join(targetDir, SKILL_FILE));
  const outdated =
    version !== undefined &&
    !!skill.latest_version &&
    version !== skill.latest_version;

  return { installed: true, version, outdated };
};

/** Human-readable install status for the 'Installed' table column. */
const formatInstallStatus = (
  status: InstallStatus,
  latestVersion: string,
): string => {
  if (!status.installed) return "no";
  if (status.outdated) {
    return `outdated (${status.version ?? "?"} → ${latestVersion})`;
  }
  return status.version ? `yes (${status.version})` : "yes";
};

/** GET /api/v1/skills and return the (optionally filtered) list. */
const fetchSkills = async (
  endpoint: string,
  query?: Record<string, string | undefined>,
): Promise<SkillListItem[]> => {
  const response = await skillsRequest({
    endpoint,
    path: "/api/v1/skills",
    query,
  });
  if (!response.ok) {
    throw new Error(
      `Failed to list skills (${response.status} ${response.statusText})`,
    );
  }
  const body = (await response.json()) as { data?: SkillListItem[] };
  return body.data ?? [];
};

/** Fully-qualified '<vendor>/<repo>/<name>' identifier for a listed skill. */
const skillSlug = (skill: SkillListItem): string =>
  `${skillRepo(skill)}/${skill.name}`;

/** Prompt the user to pick one skill from a candidate list. */
const selectSkill = async (
  candidates: SkillListItem[],
): Promise<SkillListItem> => {
  const byKey = new Map(candidates.map((skill) => [skillSlug(skill), skill]));
  const choices = candidates.map((skill) => ({
    name: skill.title ? `${skillSlug(skill)} — ${skill.title}` : skillSlug(skill),
    value: skillSlug(skill),
  }));
  const { key } = (await inquirer.prompt([
    {
      type: "search-list",
      name: "key",
      message: "Select a skill",
      choices,
    },
  ])) as { key: string };
  return byKey.get(key)!;
};

export const skills = new Command("skills")
  .description(
    commandDescriptions["skills"] ??
      "List and install AI agent skills from the Revenexx Skill Registry",
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

skills
  .command("list")
  .description("List skills visible to your organisation")
  .option("--search <query>", "Filter by name, title, description or tags")
  .option("--category <category>", "Filter by category")
  .option(
    "--tag <tag>",
    "Filter by tag (repeatable; skills carrying any given tag match)",
    (value: string, previous: string[]) => [...previous, value],
    [],
  )
  .option(
    "--agent <agent>",
    `Agent whose install directory the 'Installed' column reflects: ${Object.keys(AGENT_TARGETS).join(", ")}`,
    DEFAULT_AGENT,
  )
  .option("--skills-endpoint <url>", "Override the Skill Registry base URL")
  .action(
    actionRunner(
      async ({
        search,
        category,
        tag,
        agent,
        skillsEndpoint,
      }: {
        search?: string;
        category?: string;
        tag?: string[];
        agent: string;
        skillsEndpoint?: string;
      }) => {
        if (!AGENT_TARGETS[agent]) {
          throw new Error(
            `Unknown agent '${agent}'. Supported: ${Object.keys(AGENT_TARGETS).join(", ")}.`,
          );
        }

        const endpoint = resolveSkillsEndpoint(skillsEndpoint);
        // The registry filters server-side: `q` searches
        // name/title/description/tags, `category` is an exact match, and
        // `tags` is a comma-separated OR filter.
        const items = await fetchSkills(endpoint, {
          q: search,
          category,
          tags: normalizeTags(tag).join(",") || undefined,
        });

        if (cliConfig.json) {
          drawJSON(
            items.map((skill) => {
              const status = readInstallStatus(agent, skill);
              return {
                ...skill,
                installed: status.installed,
                installed_version: status.version ?? null,
                outdated: status.outdated,
              };
            }),
          );
          return;
        }

        if (items.length === 0) {
          log("No skills found.");
          return;
        }

        drawTable(
          items.map((skill) => ({
            Repo: skillRepo(skill),
            Name: skill.name,
            Title: skill.title,
            Visibility: skill.visibility,
            Category: skill.category,
            Latest: skill.latest_version,
            Installed: formatInstallStatus(
              readInstallStatus(agent, skill),
              skill.latest_version,
            ),
          })),
        );
      },
    ),
  );

skills
  .command("show [repo] [name]")
  .description(
    "Show details for a single skill. <repo> is '<owner>/<repo>'. " +
      "Omit arguments to pick interactively: no args lists every skill, " +
      "just <repo> narrows to that repository.",
  )
  .option("--readme", "Also print the skill's README")
  .option(
    "--agent <agent>",
    `Agent whose install directory the 'Installed' line reflects: ${Object.keys(AGENT_TARGETS).join(", ")}`,
    DEFAULT_AGENT,
  )
  .option("--skills-endpoint <url>", "Override the Skill Registry base URL")
  .action(
    actionRunner(
      async (
        repo: string | undefined,
        name: string | undefined,
        {
          readme,
          agent,
          skillsEndpoint,
        }: { readme?: boolean; agent: string; skillsEndpoint?: string },
      ) => {
        if (!AGENT_TARGETS[agent]) {
          throw new Error(
            `Unknown agent '${agent}'. Supported: ${Object.keys(AGENT_TARGETS).join(", ")}.`,
          );
        }

        const endpoint = resolveSkillsEndpoint(skillsEndpoint);

        let vendor: string;
        let repoName: string;
        let skillName: string;

        if (repo && name) {
          // Fully specified — resolve directly.
          ({ vendor, repoName } = parseRepo(repo));
          skillName = name;
        } else {
          // Something is missing: fall back to an interactive picker.
          if (!isInteractive()) {
            throw new Error(
              "Specify '<repo> <name>' — interactive selection needs a terminal.",
            );
          }

          const all = await fetchSkills(endpoint);
          if (all.length === 0) {
            log("No skills found.");
            return;
          }

          let candidates = all;
          if (repo) {
            // A repo was given: narrow to it, but fall back to the full list
            // (with a hint) when it has no visible skills.
            const parsed = parseRepo(repo);
            candidates = all.filter(
              (skill) =>
                skill.vendor === parsed.vendor && skill.repo === parsed.repoName,
            );
            if (candidates.length === 0) {
              warn(
                `No skills found for repository '${parsed.vendor}/${parsed.repoName}'. Showing all skills instead.`,
              );
              candidates = all;
            }
          }

          const chosen = await selectSkill(candidates);
          vendor = chosen.vendor;
          repoName = chosen.repo;
          skillName = chosen.name;
        }

        const skillPath = `/api/v1/skills/${encodeURIComponent(vendor)}/${encodeURIComponent(repoName)}/${encodeURIComponent(skillName)}`;

        const response = await skillsRequest({ endpoint, path: skillPath });
        if (response.status === 404) {
          throw new Error(
            `Skill '${vendor}/${repoName}/${skillName}' not found or not visible to you.`,
          );
        }
        if (!response.ok) {
          throw new Error(
            `Failed to show skill (${response.status} ${response.statusText})`,
          );
        }

        const body = (await response.json()) as { data?: SkillDetail };
        const skill = body.data;
        if (!skill) {
          throw new Error(
            `Skill '${vendor}/${repoName}/${skillName}' has no data.`,
          );
        }

        if (cliConfig.json) {
          drawJSON(skill);
          return;
        }

        const authors = (skill.authors ?? [])
          .map((author) =>
            author.email
              ? `${author.name ?? ""} <${author.email}>`.trim()
              : (author.name ?? ""),
          )
          .filter((author) => author !== "");

        parse({
          Repo: skillRepo(skill),
          Name: skill.name,
          Title: skill.title,
          Description: skill.description,
          Visibility: skill.visibility,
          Category: skill.category,
          License: skill.license ?? "",
          Homepage: skill.homepage ?? "",
          Tags: normalizeTags(skill.tags).join(", "),
          Keywords: (skill.keywords ?? []).join(", "),
          Targets: (skill.targets ?? []).join(", "),
          "Allowed tools": (skill.allowed_tools ?? []).join(", "),
          Authors: authors.join(", "),
          "Latest version": skill.latest_version,
          Installed: formatInstallStatus(
            readInstallStatus(agent, skill),
            skill.latest_version,
          ),
          Source: skill.source_url ?? "",
        });

        if (readme && skill.readme) {
          log("");
          log(skill.readme);
        }
      },
    ),
  );

skills
  .command("add <repo> <name>")
  .description(
    "Install (or update) a skill into an agent's skill directory. <repo> is '<owner>/<repo>'.",
  )
  .option(
    "--agent <agent>",
    `Target agent: ${Object.keys(AGENT_TARGETS).join(", ")}`,
    DEFAULT_AGENT,
  )
  .option("--version <version>", "Skill version to install (defaults to latest)")
  .option("--skills-endpoint <url>", "Override the Skill Registry base URL")
  .action(
    actionRunner(
      async (
        repo: string,
        name: string,
        {
          agent,
          version,
          skillsEndpoint,
        }: { agent: string; version?: string; skillsEndpoint?: string },
      ) => {
        const { vendor, repoName } = parseRepo(repo);

        const targetBase = AGENT_TARGETS[agent];
        if (!targetBase) {
          throw new Error(
            `Unknown agent '${agent}'. Supported: ${Object.keys(AGENT_TARGETS).join(", ")}.`,
          );
        }

        const endpoint = resolveSkillsEndpoint(skillsEndpoint);
        const skillPath = `/api/v1/skills/${encodeURIComponent(vendor)}/${encodeURIComponent(repoName)}/${encodeURIComponent(name)}`;

        // Resolve the version to install (latest if not pinned).
        let resolvedVersion = version;
        if (!resolvedVersion) {
          const showResponse = await skillsRequest({ endpoint, path: skillPath });
          if (showResponse.status === 404) {
            throw new Error(
              `Skill '${vendor}/${repoName}/${name}' not found or not visible to you.`,
            );
          }
          if (!showResponse.ok) {
            throw new Error(
              `Failed to resolve skill (${showResponse.status} ${showResponse.statusText})`,
            );
          }
          const showBody = (await showResponse.json()) as {
            data?: { latest_version?: string };
          };
          resolvedVersion = showBody.data?.latest_version;
          if (!resolvedVersion) {
            throw new Error(
              `Skill '${vendor}/${repoName}/${name}' has no published version.`,
            );
          }
        }

        // Download the zip bundle.
        const downloadResponse = await skillsRequest({
          endpoint,
          path: `${skillPath}/versions/${encodeURIComponent(resolvedVersion)}/download`,
        });
        if (downloadResponse.status === 404) {
          throw new Error(
            `Skill '${vendor}/${repoName}/${name}' version '${resolvedVersion}' not found.`,
          );
        }
        if (!downloadResponse.ok) {
          throw new Error(
            `Failed to download skill (${downloadResponse.status} ${downloadResponse.statusText})`,
          );
        }

        const buffer = new Uint8Array(await downloadResponse.arrayBuffer());
        const entries = unzipSync(buffer);

        // Target directory is project-relative and named after the skill.
        const targetDir = path.join(process.cwd(), targetBase, name);
        const isUpdate = fs.existsSync(targetDir);
        if (isUpdate) {
          fs.rmSync(targetDir, { recursive: true, force: true });
        }

        for (const [entryPath, contents] of Object.entries(entries)) {
          // Directory entries are keyed with a trailing slash.
          if (entryPath.endsWith("/")) continue;
          const destination = path.join(targetDir, entryPath);
          fs.mkdirSync(path.dirname(destination), { recursive: true });
          fs.writeFileSync(destination, contents);
        }

        const relDir = path.relative(process.cwd(), targetDir) || targetDir;
        if (isUpdate) {
          success(
            `Updated ${name}@${resolvedVersion} in ${relDir} (agent: ${agent})`,
          );
        } else {
          success(
            `Installed ${name}@${resolvedVersion} into ${relDir} (agent: ${agent})`,
          );
        }
        warn(`Review the skill contents before trusting it.`);
      },
    ),
  );
