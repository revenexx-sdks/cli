import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { create as createTar } from "tar";
import { scaffoldCube, stampCube, validateCubeName } from "../lib/commands/create/scaffold-cube.js";

/**
 * `create cube`: download the Cube template and write the new Cube's identity
 * the way the template's own scripts/init.mjs does.
 */

let workdir: string;

/** A minimal copy of the template: the files init.mjs rewrites. */
const writeTemplate = (root: string): void => {
  fs.mkdirSync(path.join(root, "scripts"), { recursive: true });
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "cube.json"),
    JSON.stringify({ name: "template", vendor: "revenexx", version: "0.3.0", title: { en: "Template Cube", de: "Vorlage-Cube" }, tags: ["template", "ads"] }),
  );
  fs.writeFileSync(path.join(root, "package.json"), JSON.stringify({ name: "@revenexx-cubes/template", version: "0.3.0", private: true }));
  fs.writeFileSync(path.join(root, "README.md"), "# template\n\nThe Template Cube. gh repo create --template revenexx-cubes/template\n");
  fs.writeFileSync(path.join(root, "catalog-info.yaml"), "metadata:\n  name: cube-template\n");
  fs.writeFileSync(path.join(root, "docs", "index.md"), "# template\n\nrevenexx/template — Vorlage-Cube\n");
  fs.writeFileSync(path.join(root, "CHANGELOG.md"), "# Changelog\n\n## [0.1.0] — 2026-10-01\n\n- Template.\n");
  fs.writeFileSync(path.join(root, "scripts", "init.mjs"), "// init\n");
  fs.writeFileSync(path.join(root, "scripts", "cube.mjs"), "// validator\n");
};

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-create-cube-"));
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
  vi.unstubAllGlobals();
});

describe("validateCubeName", () => {
  it("follows the template's naming rule", () => {
    for (const ok of ["ga", "google-ads", "ads2", "a1-b2"]) expect(validateCubeName(ok)).toBeNull();
    for (const bad of ["a", "Google", "google--ads", "-ads", "ads-", "2ads", "google_ads", "x".repeat(41)]) {
      expect(validateCubeName(bad)).toMatch(/lowercase letters, digits and single hyphens/);
    }
  });
});

describe("stampCube", () => {
  it("writes the identity like init.mjs and deletes the init script", () => {
    writeTemplate(workdir);
    const touched = stampCube(workdir, { name: "google-ads", vendor: "acme", titleEn: "Google Ads", titleDe: "Google-Anzeigen" });

    const cube = JSON.parse(fs.readFileSync(path.join(workdir, "cube.json"), "utf8"));
    expect(cube).toMatchObject({ name: "google-ads", vendor: "acme", version: "0.1.0", title: { en: "Google Ads", de: "Google-Anzeigen" }, tags: ["ads"] });
    const pkg = JSON.parse(fs.readFileSync(path.join(workdir, "package.json"), "utf8"));
    expect(pkg).toMatchObject({ name: "@revenexx-cubes/google-ads", version: "0.1.0", description: "revenexx Cube acme/google-ads." });

    expect(fs.readFileSync(path.join(workdir, "README.md"), "utf8")).toBe("# google-ads\n\nThe Google Ads. gh repo create --template revenexx-cubes/google-ads\n");
    expect(fs.readFileSync(path.join(workdir, "catalog-info.yaml"), "utf8")).toContain("name: cube-google-ads");
    expect(fs.readFileSync(path.join(workdir, "docs", "index.md"), "utf8")).toContain("acme/google-ads — Google-Anzeigen");
    expect(fs.readFileSync(path.join(workdir, "CHANGELOG.md"), "utf8")).toContain("## [0.1.0] — unreleased\n\n### Added\n\n- First version of acme/google-ads.\n");

    expect(fs.existsSync(path.join(workdir, "scripts", "init.mjs"))).toBe(false);
    expect(fs.existsSync(path.join(workdir, "scripts", "cube.mjs"))).toBe(true);
    expect(touched).toEqual(expect.arrayContaining(["cube.json", "package.json", "README.md", "CHANGELOG.md"]));
  });

  it("refuses a directory that is not a copy of the template", () => {
    expect(() => stampCube(workdir, { name: "x1", vendor: "acme", titleEn: "X", titleDe: "X" })).toThrow(/no cube\.json/);
  });
});

describe("scaffoldCube", () => {
  /** Serve a GitHub-style archive (one wrapping directory) of the fixture template. */
  const stubCodeload = async (): Promise<string[]> => {
    const source = path.join(workdir, "src", "template-main");
    writeTemplate(source);
    const archive = path.join(workdir, "template.tar.gz");
    await createTar({ gzip: true, file: archive, cwd: path.join(workdir, "src") }, ["template-main"]);
    const requested: string[] = [];
    vi.stubGlobal("fetch", async (url: string) => {
      requested.push(url);
      const body = fs.readFileSync(archive);
      return new Response(body, { status: 200 });
    });
    return requested;
  };

  it("downloads the template into <dir>/<name> and stamps it", async () => {
    const requested = await stubCodeload();
    const result = await scaffoldCube({
      name: "google-ads",
      vendor: "acme",
      titleEn: "Google Ads",
      titleDe: "Google Ads",
      dir: path.join(workdir, "out"),
      template: "revenexx-cubes/template",
      ref: "main",
    });

    expect(requested).toEqual(["https://codeload.github.com/revenexx-cubes/template/tar.gz/main"]);
    expect(result.root).toBe(path.join(workdir, "out", "google-ads"));
    expect(result.cube).toBe("acme/google-ads");
    expect(JSON.parse(fs.readFileSync(path.join(result.root, "cube.json"), "utf8")).name).toBe("google-ads");
    expect(fs.existsSync(path.join(result.root, "scripts", "init.mjs"))).toBe(false);
  });

  it("refuses to write into a non-empty directory", async () => {
    await stubCodeload();
    fs.mkdirSync(path.join(workdir, "out", "google-ads"), { recursive: true });
    fs.writeFileSync(path.join(workdir, "out", "google-ads", "keep.txt"), "");
    await expect(
      scaffoldCube({ name: "google-ads", vendor: "acme", titleEn: "G", titleDe: "G", dir: path.join(workdir, "out"), template: "revenexx-cubes/template", ref: "main" }),
    ).rejects.toThrow(/not empty/);
    expect(fs.existsSync(path.join(workdir, "out", "google-ads", "keep.txt"))).toBe(true);
  });

  it("leaves nothing behind when the download fails", async () => {
    vi.stubGlobal("fetch", async () => new Response("", { status: 404 }));
    await expect(
      scaffoldCube({ name: "google-ads", vendor: "acme", titleEn: "G", titleDe: "G", dir: workdir, template: "revenexx-cubes/nope", ref: "main" }),
    ).rejects.toThrow(/HTTP 404/);
    expect(fs.existsSync(path.join(workdir, "google-ads"))).toBe(false);
  });
});
