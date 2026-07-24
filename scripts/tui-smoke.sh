#!/usr/bin/env bash
# pty smoke test for the full-screen TUI (DX-118): drives the built CLI in a
# real pseudo-terminal — launch, open the `/` palette, close it, quit — and
# asserts the app shell rendered and the session exited. Needs no credentials:
# it never runs a command against the gateway. CI calls this after the build;
# locally: npm run test:tui-smoke
set -euo pipefail

CLI="${1:-dist/cli.mjs}"
OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT

if [ ! -f "$CLI" ]; then
  echo "tui-smoke: $CLI not found — run 'npm run build:cli' first" >&2
  exit 1
fi

# One printf per keypress with pauses in between: batched writes arrive as a
# single chunk that ink's key parser treats as one input event.
keys() {
  sleep 3        # let the app boot and attach its stdin listener
  printf '/'     # start the command filter
  sleep 1
  printf 'status' # type-to-search filters the list in place
  sleep 1
  printf '\033'  # esc — clear the filter
  sleep 1
  printf '\033'  # esc at the root — quit
  sleep 1
}

# BSD (macOS) and util-linux script(1) disagree on how to pass the command.
if [ "$(uname)" = "Darwin" ]; then
  keys | script -q /dev/null node "$CLI" tui > "$OUT" 2>&1 || true
else
  keys | script -qec "node $CLI tui" /dev/null > "$OUT" 2>&1 || true
fi

plain="$(perl -pe 's/\e\[[0-9;?]*[a-zA-Z]//g' "$OUT")"

fail() {
  echo "tui-smoke: $1" >&2
  echo "--- captured output (tail) ---" >&2
  printf '%s\n' "$plain" | tail -40 >&2
  exit 1
}

printf '%s' "$plain" | grep -qi "revenexx" || fail "app shell header did not render"
printf '%s' "$plain" | grep -qi "commands"  || fail "commands pane did not render"
printf '%s' "$plain" | grep -q "› status"   || fail "type-to-search filter did not engage"

# A repaint taller than the terminal desyncs ink's screen diff and leaves
# permanent ghost rows — guard the invariant (24-row pty + 2 lines slack).
node -e '
  const fs = require("fs");
  const data = fs.readFileSync(process.argv[1], "utf8");
  const frames = data.split("\x1b[2J").slice(1);
  const max = Math.max(0, ...frames.map((f) => (f.match(/\n/g) ?? []).length));
  if (max > 26) {
    console.error(`tui-smoke: repaint ${max} lines tall exceeds the terminal`);
    process.exit(1);
  }
' "$OUT" || fail "oversized repaint frame detected"

echo "tui-smoke: OK"
