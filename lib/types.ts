import type { File } from "undici";
import type { ReadableStream } from "node:stream/web";

export type ResponseType = "json" | "arraybuffer";

export interface Headers {
  [key: string]: string;
}

export interface RequestParams {
  [key: string]: unknown;
}

export interface FileUpload {
  type: "file";
  file: File;
  filename: string;
}

export interface FileInput {
  type: "file";
  stream: ReadableStream;
  filename: string;
  size: number;
}

export interface UploadProgress {
  $id: string;
  progress: number;
  sizeUploaded: number;
  chunksTotal: number;
  chunksUploaded: number;
}

export interface ConfigData {
  [key: string]: unknown;
}

export interface Entity {
  $id: string;
  [key: string]: unknown;
}

export interface ParsedData {
  [key: string]: unknown;
}

export interface CommandDescription {
  [key: string]: string;
}

/** Machine- or human-readable renderer chosen with `-o/--output`. */
export type OutputFormat =
  | "table"
  | "json"
  | "jsonl"
  | "csv"
  | "yaml"
  | "markdown";

export const OUTPUT_FORMATS: readonly OutputFormat[] = [
  "table",
  "json",
  "jsonl",
  "csv",
  "yaml",
  "markdown",
];

export interface CliConfig {
  verbose: boolean;
  /** Selected output renderer (`-o/--output`). Default `table`. */
  output: OutputFormat;
  /**
   * Legacy alias kept in sync with `output === "json"`. Existing call sites
   * (byte-stable JSON path, non-interactive gating) still read this boolean;
   * `--json` is the documented shorthand for `--output json`.
   */
  json: boolean;
  /** Column/field projection (`--fields a,b,c`) applied before rendering. */
  fields?: string[];
  /**
   * Suppress human chrome and emit machine-readable errors to stderr with a
   * meaningful exit code (`--quiet`), without forcing a specific stdout format.
   */
  quiet: boolean;
  /** Raw `--data` value (inline JSON, `@file`, or `-` for stdin) for bodies. */
  data?: string;
  force: boolean;
  report: boolean;
  reportData: Record<string, unknown>;
  endpoint?: string;
  token?: string;
  tenant?: string;
  /** Per-request timeout in ms (--timeout). Undefined → client default. */
  timeout?: number;
  /** Auto-retry idempotent requests. False when --no-retry is passed. */
  retry: boolean;
  /** Redacted HTTP debug logging on stderr (--debug). */
  debug: boolean;
}

export interface SessionData {
  endpoint: string;
  email?: string;
  phone?: string;
  cookie?: string;
  jwt?: string;
  refreshToken?: string;
  jwtExpiresAt?: number;
  authMethod?: "apikey" | "sso";
}

export interface GlobalConfigData extends ConfigData {
  sessions: {
    [key: string]: SessionData;
  };
  current: string;
  cookie?: string;
}
