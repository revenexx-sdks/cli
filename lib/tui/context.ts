/**
 * Snapshot of the CLI context the TUI shell renders: identity, tenant,
 * endpoint and the production flag. Sourced from the exact same resolution
 * the DX-111 context banner and `status` command use, so the TUI header can
 * never disagree with what a one-shot command would hit. Everything here is
 * derived offline (config files + stored token) — no network calls.
 */
import {
  resolveActiveContext,
  isSensitiveContext,
  safeHostname,
} from "../parser.js";
import { globalConfig } from "../config.js";
import { decodeJwtClaims } from "../oauth.js";
import packageJson from "../../package.json" with { type: "json" };
import type { CommandNode } from "./command-tree.js";

export type TuiContext = {
  version: string;
  /** Signed-in identity, or null when no key/JWT is stored. */
  user: string | null;
  /** Active tenant, or "" when none is scoped. */
  tenant: string;
  /** Hostname of the endpoint the session would hit. */
  host: string;
  /** True when DX-111's sensitivity rules flag this endpoint/tenant. */
  production: boolean;
  /** Command tree for the browser pane / palette. */
  commands: CommandNode[];
};

export const buildTuiContext = (commands: CommandNode[]): TuiContext => {
  const { endpoint, tenant } = resolveActiveContext();

  // Same identity derivation as the `status` command: an API key has no
  // user behind it, so it is named by tenant; SSO prefers the stored email
  // and falls back to the JWT's own claims.
  const key = process.env.REVENEXX_API_KEY || globalConfig.getKey() || "";
  const jwt = globalConfig.getJWT();
  let user: string | null = null;
  if (key !== "") {
    user = `apikey:${tenant || "(no tenant)"}`;
  } else if (jwt !== "") {
    const claims = decodeJwtClaims(jwt);
    user =
      globalConfig.getEmail() ||
      claims?.preferred_username ||
      claims?.name ||
      claims?.sub ||
      "(unknown)";
  }

  return {
    version: packageJson.version,
    user,
    tenant,
    host: safeHostname(endpoint),
    production: isSensitiveContext(endpoint, tenant),
    commands,
  };
};
