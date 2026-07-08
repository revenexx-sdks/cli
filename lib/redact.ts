/**
 * Strip token-like and credential-like substrings from text before it ever
 * reaches stdout/stderr or a bug-report URL. Conservative: prefers to over-
 * redact rather than leak. Patterns kept simple and ordered.
 *
 * Lives in its own module (rather than parser.ts) so low-level code such as
 * the HTTP client can redact debug output without importing parser.ts, which
 * would create an import cycle (parser.ts imports the client). parser.ts
 * re-exports `redactSecrets` for existing callers.
 */
export const redactSecrets = (input: unknown): string => {
  if (input === null || input === undefined) return "";
  let s = typeof input === "string" ? input : String(input);

  // Server-issued API keys (long opaque tokens with a `standard_` prefix)
  s = s.replace(/standard_[A-Za-z0-9]{32,}/g, "standard_***");
  // Gateway-issued API keys (`rvxk_…`)
  s = s.replace(/rvxk_[A-Za-z0-9]{16,}/g, "rvxk_***");
  // Auth-related headers
  s = s.replace(
    /(X-Revenexx-(?:Api-Key|Key|Cookie|JWT|Session|Dev-Key|Mode))(\s*[:=]\s*)([^\s,'"`}\]]+)/gi,
    "$1$2***",
  );
  // `Authorization: Bearer …`
  s = s.replace(/(Bearer\s+)([A-Za-z0-9._\-]{20,})/gi, "$1***");
  // Raw session cookies (`a_session_console=…`, `a_session_<project>=…`) as
  // captured from Set-Cookie and stored in prefs — the `cookie` kv pattern
  // below doesn't catch this bare `a_session…=value` form.
  s = s.replace(/(a_session[a-z0-9_]*=)([^\s;,'"`]+)/gi, "$1***");
  // Inline shell env assignments
  s = s.replace(
    /\b(REVENEXX_(?:TOKEN|API_KEY|KEY|COOKIE)\s*=\s*)([^\s;'"`]+)/g,
    "$1***",
  );
  // JSON / kv: token / api_key / secret / password / cookie / key, plus the
  // OAuth/OIDC token fields returned by the SSO token endpoint.
  s = s.replace(
    /(["'`]?(?:token|api[_-]?key|secret|password|cookie|key|access_token|id_token|refresh_token)["'`]?\s*[:=]\s*["'`]?)([^"'`\s,;}\]]{4,})/gi,
    "$1***",
  );
  // Raw JWTs (e.g. a leaked X-Revenexx-JWT value or a decoded token in a trace).
  s = s.replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]+/g, "eyJ***");
  return s;
};
