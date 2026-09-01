import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { packDirectory } from "../lib/commands/deploy.js";

let workdir: string;

beforeEach(() => {
  workdir = fs.mkdtempSync(path.join(os.tmpdir(), "revenexx-pack-"));
});

afterEach(() => {
  fs.rmSync(workdir, { recursive: true, force: true });
});

/**
 * Parse tar entry names the way the platform's manifest extractor does:
 * name from bytes 0-99, prefix from the 155-byte POSIX region at offset 345,
 * both rtrim'd of NULs only. node-tar's non-portable default writes
 * atime/ctime into that prefix region (old-GNU layout), which this parser
 * turns into garbage names — the DX-231 bug. The pack must stay clean for it.
 */
function extractorEntryNames(tarball: Buffer): string[] {
  const names: string[] = [];
  let offset = 0;
  while (offset + 512 <= tarball.length) {
    const header = tarball.subarray(offset, offset + 512);
    if (header.every((b) => b === 0)) break; // end-of-archive
    const rtrimNul = (b: Buffer) => b.toString("binary").replace(/\0+$/, "");
    const name = rtrimNul(header.subarray(0, 100));
    const prefix = rtrimNul(header.subarray(345, 500));
    names.push(prefix ? `${prefix}/${name}` : name);
    const size = parseInt(header.subarray(124, 136).toString("ascii").trim() || "0", 8);
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return names;
}

describe("packDirectory", () => {
  it("produces POSIX-clean headers the platform's manifest extractor can parse", async () => {
    fs.writeFileSync(path.join(workdir, "manifest.json"), "{}");
    fs.mkdirSync(path.join(workdir, "src"));
    fs.writeFileSync(path.join(workdir, "src", "main.js"), "export default {};");
    fs.mkdirSync(path.join(workdir, "node_modules"));
    fs.writeFileSync(path.join(workdir, "node_modules", "dep.js"), "");

    const file = await packDirectory(workdir);
    const tarball = zlib.gunzipSync(Buffer.from(await file.arrayBuffer()));

    const names = extractorEntryNames(tarball);
    // Every name must be a plain relative path — no NULs, no timestamp
    // garbage leaking in from the header's prefix region.
    for (const name of names) {
      expect(name).toMatch(/^\.\/[\w./-]*$/);
    }
    expect(names).toContain("./manifest.json");
    expect(names).toContain("./src/main.js");
    expect(names.some((n) => n.includes("node_modules"))).toBe(false);
  });
});
