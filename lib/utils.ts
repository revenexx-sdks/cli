import fs from "fs";
import path from "path";
import net from "net";
import childProcess from "child_process";
import { fetch } from "undici";
import { z } from "zod";
import { globalConfig } from "./config.js";
import { NPM_REGISTRY_URL, DEFAULT_ENDPOINT } from "./constants.js";

export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
};

/**
 * Get the latest version from npm registry
 */
export async function getLatestVersion(): Promise<string> {
  try {
    const response = await fetch(NPM_REGISTRY_URL);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = (await response.json()) as { version: string };
    return data.version;
  } catch (e) {
    throw new Error(`Failed to fetch latest version: ${(e as Error).message}`);
  }
}

/**
 * Compare versions using semantic versioning
 */
export function compareVersions(current: string, latest: string): number {
  const currentParts = current.split(".").map(Number);
  const latestParts = latest.split(".").map(Number);

  for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
    const currentPart = currentParts[i] || 0;
    const latestPart = latestParts[i] || 0;

    if (latestPart > currentPart) return 1; // Latest is newer
    if (latestPart < currentPart) return -1; // Current is newer
  }

  return 0; // Same version
}

/**
 * Resolve a `--data`-style body argument into a parsed JSON value. Accepts an
 * inline JSON string, `@path/to/file.json` to read the body from a file, or `-`
 * to read the whole of stdin — enabling round-trips such as
 * `… get -o json > body.json` → edit → `… update --data @body.json`.
 *
 * Throws a clear, user-facing error when the file can't be read or the payload
 * isn't valid JSON.
 */
export function resolveBodyParam(value: string): unknown {
  let raw: string;
  if (value === "-") {
    // fd 0 = stdin; blocks until EOF, which is the expected behavior for a pipe.
    raw = fs.readFileSync(0, "utf8");
  } else if (value.startsWith("@")) {
    const filePath = value.slice(1);
    try {
      raw = fs.readFileSync(filePath, "utf8");
    } catch (error) {
      throw new Error(
        `Could not read --data file '${filePath}': ${getErrorMessage(error)}`,
      );
    }
  } else {
    raw = value;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    const source =
      value === "-"
        ? "stdin"
        : value.startsWith("@")
          ? `file '${value.slice(1)}'`
          : "inline --data";
    throw new Error(
      `Invalid JSON body from ${source}: ${getErrorMessage(error)}`,
    );
  }
}

export function getAllFiles(folder: string): string[] {
  const files: string[] = [];
  for (const pathDir of fs.readdirSync(folder)) {
    const pathAbsolute = path.join(folder, pathDir);
    let stats: fs.Stats;
    try {
      stats = fs.statSync(pathAbsolute);
    } catch (_error) {
      continue;
    }
    if (stats.isDirectory()) {
      files.push(...getAllFiles(pathAbsolute));
    } else {
      files.push(pathAbsolute);
    }
  }
  return files;
}

export async function isPortTaken(port: number): Promise<boolean> {
  const taken = await new Promise<boolean>((res, rej) => {
    const tester = net
      .createServer()
      .once("error", function (err: NodeJS.ErrnoException) {
        if (err.code != "EADDRINUSE") return rej(err);
        res(true);
      })
      .once("listening", function () {
        tester
          .once("close", function () {
            res(false);
          })
          .close();
      })
      .listen(port);
  });

  return taken;
}

export function systemHasCommand(command: string): boolean {
  const isUsingWindows = process.platform == "win32";

  try {
    if (isUsingWindows) {
      childProcess.execSync("where " + command, { stdio: "pipe" });
    } else {
      childProcess.execSync(
        `[[ $(${command} --version) ]] || { exit 1; } && echo "OK"`,
        {
          stdio: "pipe",
          shell: "/bin/bash",
        },
      );
    }
  } catch (error) {
    console.log(error);
    return false;
  }

  return true;
}

export function isCloud(): boolean {
  const endpoint = globalConfig.getEndpoint() || DEFAULT_ENDPOINT;
  const hostname = new URL(endpoint).hostname;
  return hostname.endsWith("appwrite.io");
}

export function arrayEqualsUnordered(left: unknown, right: unknown): boolean {
  const a = Array.isArray(left)
    ? [...left].map((item) => String(item)).sort()
    : [];
  const b = Array.isArray(right)
    ? [...right].map((item) => String(item)).sort()
    : [];

  if (a.length !== b.length) {
    return false;
  }

  return a.every((value, index) => value === b[index]);
}

/**
 * Filters an object to only include fields defined in a Zod object schema.
 * Uses the schema's shape to determine allowed keys.
 *
 * @param data - The data to filter
 * @param schema - A Zod object schema with a shape property
 * @returns The filtered data with only schema-defined fields
 */
export function filterBySchema<T extends z.ZodObject<z.ZodRawShape>>(
  data: Record<string, unknown>,
  schema: T,
): z.infer<T> {
  const allowedKeys = Object.keys(schema.shape);
  const result: Record<string, unknown> = {};

  for (const key of allowedKeys) {
    if (key in data) {
      result[key] = data[key];
    }
  }

  return result as z.infer<T>;
}
