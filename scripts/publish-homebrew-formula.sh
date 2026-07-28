#!/usr/bin/env bash
# Publish the Homebrew formula for a released Revenexx CLI version to the tap
# repo revenexx-sdks/homebrew-cli — the repo behind:
#
#   brew install revenexx-sdks/cli/revenexx
#
# Renders Formula/revenexx.rb (a template carrying `@@…@@` tokens) with the
# release version and the sha256 digests of the published binaries, then commits
# the result to the tap.
#
# Digests come from the GitHub release itself (the API reports one per asset),
# so they always describe the exact bytes Homebrew will download. When the API
# reports no digest for an asset, the local build/ artifact is hashed instead.
#
# Usage:
#   scripts/publish-homebrew-formula.sh                    # version from $GITHUB_REF_NAME
#   scripts/publish-homebrew-formula.sh --version v1.2.3   # explicit release tag
#   scripts/publish-homebrew-formula.sh --dry-run          # print the formula, push nothing
#
# Environment (either credential works; with neither the script warns and exits
# 0 — a missing tap credential must never fail a release):
#   HOMEBREW_TAP_SSH_KEY  private half of a write-enabled deploy key on the tap
#                         repo. Needs no organisation approval.
#   HOMEBREW_TAP_TOKEN    token with `contents: write` on the tap repo.
#   GH_TOKEN            token used for the release API read (the ambient
#                       GITHUB_TOKEN is enough).
#   TAP_REPO            override the tap repo (default revenexx-sdks/homebrew-cli).
#
# Requires: gh, git, shasum/sha256sum.

set -euo pipefail

SOURCE_REPO="revenexx-sdks/cli"
TAP_REPO="${TAP_REPO:-revenexx-sdks/homebrew-cli}"
EXECUTABLE="revenexx"
FORMULA_TEMPLATE="Formula/${EXECUTABLE}.rb"

version=""
dry_run="false"

while [ $# -gt 0 ]; do
  case "$1" in
    --version) version="$2"; shift 2 ;;
    --dry-run) dry_run="true"; shift ;;
    -h|--help) sed -n '2,30p' "$0"; exit 0 ;;
    *)
      echo "unknown arg: $1" >&2
      exit 2
      ;;
  esac
done

cd "$(dirname "$0")/.."

version="${version:-${GITHUB_REF_NAME:-}}"
version="${version#v}"

if ! [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
  echo "::warning::'${version:-<empty>}' is not a release version — skipping Homebrew formula publish."
  exit 0
fi

tag="v${version}"

if [ ! -f "$FORMULA_TEMPLATE" ]; then
  echo "$FORMULA_TEMPLATE not found — nothing to render" >&2
  exit 1
fi

echo "[homebrew] publishing formula for $tag to $TAP_REPO"

# --- digests -----------------------------------------------------------------

# The release API reports a per-asset `digest` of the form "sha256:<hex>".
sha_for() {
  local asset="$1" sha=""

  sha="$(gh api "repos/${SOURCE_REPO}/releases/tags/${tag}" \
    --jq ".assets[] | select(.name == \"${asset}\") | .digest // empty" \
    | sed 's/^sha256://')"

  if [ -n "$sha" ]; then
    printf '%s' "$sha"
    return 0
  fi

  # The release reported no digest — hash the artifact we just built instead.
  if [ -f "build/$asset" ]; then
    if command -v sha256sum > /dev/null 2>&1 ; then
      sha256sum "build/$asset" | cut -d' ' -f1 | tr -d '\n'
    else
      shasum -a 256 "build/$asset" | cut -d' ' -f1 | tr -d '\n'
    fi
    return 0
  fi

  echo "no sha256 available for '$asset' (not reported by the release, not in build/)" >&2
  return 1
}

sha_darwin_arm64="$(sha_for "${EXECUTABLE}-darwin-arm64")"
sha_darwin_x64="$(sha_for "${EXECUTABLE}-darwin-x64")"
sha_linux_arm64="$(sha_for "${EXECUTABLE}-linux-arm64")"
sha_linux_x64="$(sha_for "${EXECUTABLE}-linux-x64")"

# --- render ------------------------------------------------------------------

rendered="$(mktemp)"
trap 'rm -f "$rendered"' EXIT

sed \
  -e "s|@@VERSION@@|${version}|g" \
  -e "s|@@SHA256_DARWIN_ARM64@@|${sha_darwin_arm64}|g" \
  -e "s|@@SHA256_DARWIN_X64@@|${sha_darwin_x64}|g" \
  -e "s|@@SHA256_LINUX_ARM64@@|${sha_linux_arm64}|g" \
  -e "s|@@SHA256_LINUX_X64@@|${sha_linux_x64}|g" \
  "$FORMULA_TEMPLATE" > "$rendered"

# The tap copy is a real formula, not a template — drop the template preamble
# and point readers at the source of truth instead.
{
  echo "# ${EXECUTABLE} — the ${SOURCE_REPO} CLI, as a Homebrew formula."
  echo "#"
  echo "# Generated on release by ${SOURCE_REPO}'s scripts/publish-homebrew-formula.sh."
  echo "# Do not edit by hand: the next release overwrites this file."
  echo
  grep -v '^#' "$rendered"
} > "${rendered}.tap"
mv "${rendered}.tap" "$rendered"

if grep -q '@@' "$rendered"; then
  echo "unsubstituted tokens left in the rendered formula:" >&2
  grep -n '@@' "$rendered" >&2
  exit 1
fi

if [ "$dry_run" = "true" ]; then
  echo "[homebrew] --dry-run — rendered formula:"
  echo
  cat "$rendered"
  exit 0
fi

# --- publish -----------------------------------------------------------------

# Either credential works, checked in order of least privilege:
#
#   HOMEBREW_TAP_SSH_KEY  private half of a write-enabled *deploy key* on the tap
#                         repo. Scoped to that one repo and created by any repo
#                         admin — notably it needs no organisation approval,
#                         unlike a fine-grained PAT whose resource owner is the
#                         org (those sit in "pending" until an owner approves).
#   HOMEBREW_TAP_TOKEN    PAT / App token with `contents: write` on the tap.
ssh_key="${HOMEBREW_TAP_SSH_KEY:-}"
token="${HOMEBREW_TAP_TOKEN:-}"

if [ -z "$ssh_key" ] && [ -z "$token" ]; then
  echo "::warning::Neither HOMEBREW_TAP_SSH_KEY nor HOMEBREW_TAP_TOKEN is set — skipping the formula push to ${TAP_REPO}."
  echo "Add a write-enabled deploy key for ${TAP_REPO} as HOMEBREW_TAP_SSH_KEY, or a token with 'contents: write' as HOMEBREW_TAP_TOKEN."
  exit 0
fi

tap_dir="$(mktemp -d)"
key_file=""
cleanup() {
  rm -f "$rendered"
  rm -rf "$tap_dir"
  if [ -n "$key_file" ]; then
    rm -f "$key_file"
  fi
}
trap cleanup EXIT

if [ -n "$ssh_key" ]; then
  key_file="$(mktemp)"
  chmod 600 "$key_file"
  # A key without a trailing newline makes ssh reject it as malformed.
  printf '%s\n' "$ssh_key" > "$key_file"
  # IdentitiesOnly: never fall back to an agent key that may lack tap access.
  export GIT_SSH_COMMAND="ssh -i ${key_file} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
  remote="git@github.com:${TAP_REPO}.git"
  echo "[homebrew] authenticating with the tap deploy key"
else
  # Token stays out of the log: it is only ever expanded inside this URL.
  remote="https://x-access-token:${token}@github.com/${TAP_REPO}.git"
  echo "[homebrew] authenticating with HOMEBREW_TAP_TOKEN"
fi

if ! git clone --depth 1 --quiet "$remote" "$tap_dir"; then
  echo "could not clone ${TAP_REPO}. Check that the tap repo exists and that the" >&2
  echo "credential grants write access to it — a fine-grained PAT owned by an" >&2
  echo "organisation stays unusable while it is pending owner approval." >&2
  exit 1
fi

mkdir -p "${tap_dir}/Formula"
cp "$rendered" "${tap_dir}/Formula/${EXECUTABLE}.rb"

cd "$tap_dir"

git config user.name "revenexx-sdks"
git config user.email "revenexx-sdks@users.noreply.github.com"
# core.hooksPath=/dev/null: never run hooks from a foreign checkout while the
# tap token is in the environment.
git -c core.hooksPath=/dev/null add "Formula/${EXECUTABLE}.rb"

# Staged-vs-HEAD, not worktree-vs-HEAD: on a tap that does not carry the formula
# yet the file is untracked, and `git diff` would call that "no change".
if git diff --cached --quiet; then
  echo "[homebrew] formula already up to date for ${tag} — nothing to push"
  exit 0
fi

git -c core.hooksPath=/dev/null commit -m "${EXECUTABLE} ${version}"
git -c core.hooksPath=/dev/null push origin HEAD

echo "[homebrew] published ${EXECUTABLE} ${version} to ${TAP_REPO}"
