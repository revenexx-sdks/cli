#!/usr/bin/env bash
# Verify the CLI can be installed and run on a clean machine.
#
# Spawns a throwaway container, runs `npm install -g @revenexx/cli`
# from the npm registry, then asserts the binary responds to
# --version and --help.
#
# Usage:
#   ./scripts/verify-install.sh                                      # install from npmjs
#   ./scripts/verify-install.sh --local                              # install from `npm pack` of the current checkout
#   ./scripts/verify-install.sh --image node:20-bookworm-slim        # override base image
#
# Requires: docker.

set -euo pipefail

mode="npm"
image="node:20-bookworm-slim"

while [ $# -gt 0 ]; do
  case "$1" in
    --local) mode="local"; shift ;;
    --image) image="$2"; shift 2 ;;
    -h|--help)
      sed -n '2,16p' "$0"
      exit 0
      ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

cd "$(dirname "$0")/.."

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

case "$mode" in
  npm)
    install_cmd='npm install -g @revenexx/cli'
    docker_extra=()
    mount_args=()
    ;;
  local)
    echo "[verify-install] packing local checkout…"
    if [ ! -f dist/cli.mjs ]; then
      echo "[verify-install] dist/ missing — running npm run build first"
      npm install >/dev/null 2>&1 || true
      npm run build
    fi
    rm -f revenexx-cli-*.tgz
    npm pack >/dev/null
    tarball=$(ls -1 revenexx-cli-*.tgz | head -1)
    if [ -z "$tarball" ]; then
      echo "npm pack did not produce a tarball" >&2
      exit 1
    fi
    install_cmd='npm install -g /work/'"$tarball"
    docker_extra=()
    mount_args=(-v "$PWD:/work")
    ;;
esac

echo "[verify-install] booting $image, mode=$mode…"

docker run --rm \
  "${mount_args[@]}" \
  "${docker_extra[@]}" \
  "$image" \
  bash -c "set -euo pipefail
echo '== node =='; node -v
echo '== install =='; $install_cmd
echo '== which =='; command -v revenexx
echo '== version =='; revenexx -v
echo '== help (top-level) =='; revenexx --help | head -20
echo '== login --help =='; revenexx login --help
echo '== whoami without session =='; revenexx whoami || true
echo
echo '[verify-install] PASS'
"
