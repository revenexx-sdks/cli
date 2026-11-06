/**
 * `revenexx create cube` — start an analytics Cube from the Cube template.
 *
 * Unlike `create app` / `create theme`, the skeleton is not written from here:
 * the template repository (`revenexx-cubes/template`) is the source of truth
 * and changes with the Cube contract. The command downloads it, then does what
 * the template's own `scripts/init.mjs` does — write the identity into the
 * contract and docs files, and delete the init script.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { extract as extractTar } from "tar";

export const DEFAULT_CUBE_TEMPLATE = "revenexx-cubes/template";

export interface CubeScaffoldOptions {
  name: string;
  vendor: string;
  titleEn: string;
  titleDe: string;
}

export interface CubeScaffoldResult {
  root: string;
  cube: string;
  template: string;
  files: string[];
  nextSteps: string[];
}

const NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

/** The template's rule: lowercase letters, digits and single hyphens, 2–40 characters. */
export function validateCubeName(name: string): string | null {
  if (!NAME_RE.test(name) || name.length < 2 || name.length > 40) {
    return `cube name '${name}' must be lowercase letters, digits and single hyphens, 2–40 characters`;
  }
  return null;
}

const TEMPLATE_RE = /^[\w.-]+\/[\w.-]+$/;

/** Download `owner/repo` at `ref` and unpack it into `target`, which must not exist yet. */
export async function fetchCubeTemplate(template: string, ref: string, target: string): Promise<void> {
  if (!TEMPLATE_RE.test(template)) throw new Error(`template '${template}' is not an owner/repo name`);
  const url = `https://codeload.github.com/${template}/tar.gz/${encodeURIComponent(ref)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`could not download the Cube template ${template}@${ref} (HTTP ${response.status})`);
  }
  const archive = path.join(os.tmpdir(), `revenexx-cube-template-${process.pid}-${Date.now()}.tar.gz`);
  fs.writeFileSync(archive, Buffer.from(await response.arrayBuffer()));
  try {
    fs.mkdirSync(target, { recursive: true });
    // GitHub wraps the tree in a single `<repo>-<ref>/` directory.
    await extractTar({ file: archive, cwd: target, strip: 1 });
  } finally {
    fs.rmSync(archive, { force: true });
  }
}

/**
 * Turn a fresh copy of the template into a named Cube — the same rewrite the
 * template's `scripts/init.mjs` performs, which is deleted afterwards.
 * Returns the files it touched, relative to `root`.
 */
export function stampCube(root: string, opts: CubeScaffoldOptions): string[] {
  const { name, vendor, titleEn, titleDe } = opts;
  const touched: string[] = [];
  const cubePath = path.join(root, "cube.json");
  if (!fs.existsSync(cubePath)) throw new Error(`${root} has no cube.json — is it a copy of the Cube template?`);

  const cube = JSON.parse(fs.readFileSync(cubePath, "utf8")) as Record<string, unknown>;
  Object.assign(cube, { name, vendor, version: "0.1.0", title: { en: titleEn, de: titleDe } });
  cube.tags = (Array.isArray(cube.tags) ? cube.tags : []).filter((tag) => tag !== "template");
  fs.writeFileSync(cubePath, JSON.stringify(cube, null, 2) + "\n");
  touched.push("cube.json");

  const pkgPath = path.join(root, "package.json");
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as Record<string, unknown>;
    Object.assign(pkg, { name: `@revenexx-cubes/${name}`, version: "0.1.0", description: `revenexx Cube ${vendor}/${name}.` });
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    touched.push("package.json");
  }

  const rewrite = (file: string, fn: (text: string) => string): void => {
    const abs = path.join(root, file);
    if (!fs.existsSync(abs)) return;
    fs.writeFileSync(abs, fn(fs.readFileSync(abs, "utf8")));
    touched.push(file);
  };
  const identity = (text: string): string =>
    text
      .replaceAll("revenexx-cubes/template", `revenexx-cubes/${name}`)
      .replaceAll("cube-template", `cube-${name}`)
      .replaceAll("revenexx/template", `${vendor}/${name}`)
      .replaceAll("Template Cube", titleEn)
      .replaceAll("Vorlage-Cube", titleDe)
      .replaceAll("# template", `# ${name}`);

  for (const file of ["catalog-info.yaml", "mkdocs.yml", "README.md", "CLAUDE.md", "docs/index.md", "billing.json"]) {
    rewrite(file, identity);
  }
  rewrite("CHANGELOG.md", (text) =>
    text.replace(/## \[0\.1\.0\][\s\S]*$/, `## [0.1.0] — unreleased\n\n### Added\n\n- First version of ${vendor}/${name}.\n`),
  );

  fs.rmSync(path.join(root, "scripts", "init.mjs"), { force: true });
  return touched;
}

/** A path relative to the working directory when it lies below it, else absolute. */
const displayPath = (target: string): string => {
  const relative = path.relative(process.cwd(), target);
  return relative && !relative.startsWith("..") && !path.isAbsolute(relative) ? relative : target;
};

/** Download the template into `<parent>/<name>` and stamp the identity. */
export async function scaffoldCube(
  opts: CubeScaffoldOptions & { dir: string; template: string; ref: string },
): Promise<CubeScaffoldResult> {
  const root = path.resolve(opts.dir, opts.name);
  if (fs.existsSync(root) && fs.readdirSync(root).length > 0) {
    throw new Error(`${root} already exists and is not empty`);
  }
  try {
    await fetchCubeTemplate(opts.template, opts.ref, root);
    const files = stampCube(root, opts);
    return {
      root,
      cube: `${opts.vendor}/${opts.name}`,
      template: `${opts.template}@${opts.ref}`,
      files,
      nextSteps: [
        `cd ${displayPath(root)}`,
        "replace the example dataset, metric, report and dashboard with the Cube's own",
        "npm install && npm run validate",
        "revenexx deploy cube",
      ],
    };
  } catch (err) {
    // Leave nothing half-written behind.
    fs.rmSync(root, { recursive: true, force: true });
    throw err;
  }
}
