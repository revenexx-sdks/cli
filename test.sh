#!/usr/bin/env bash
# Run the CLI from this checkout without installing it globally.
#
# Usage:
#   ./test.sh [args...]
#
# Examples:
#   ./test.sh --help
#   ./test.sh --version
#   ./test.sh login
#
# By default this builds dist/cli.mjs (only when missing or out of date) and
# runs it with node. Set CLI_REBUILD=1 to force a rebuild before running.

set -euo pipefail

cd "$(dirname "$0")"

if [ ! -d node_modules ]; then
  echo "[test.sh] installing dependencies..."
  npm install
fi

needs_build=0
if [ "${CLI_REBUILD:-0}" = "1" ]; then
  needs_build=1
elif [ ! -f dist/cli.mjs ]; then
  needs_build=1
else
  # Rebuild if any source file is newer than the built CLI.
  newest_src=$(find cli.ts index.ts lib scripts -type f \
    \( -name '*.ts' -o -name '*.hbs' \) -newer dist/cli.mjs -print -quit 2>/dev/null || true)
  if [ -n "$newest_src" ]; then
    needs_build=1
  fi
fi

if [ "$needs_build" = "1" ]; then
  echo "[test.sh] building dist/cli.mjs..."
  npm run build:cli
fi

exec node dist/cli.mjs "$@"
