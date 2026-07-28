import { describe, it, expect } from "vitest";
import {
  releaseTag,
  npmUpdateCommandLine,
  NPM_UPDATE_ARGS,
  brewUpdateCommandLine,
  BREW_UPDATE_ARGS,
  isHomebrewPath,
} from "../lib/commands/update.js";
import { HOMEBREW_FORMULA, HOMEBREW_TAP } from "../lib/constants.js";

describe("releaseTag", () => {
  it("prefixes a bare npm version with v so the releases page resolves", () => {
    // npm's registry reports the bare version; GitHub tags are v-prefixed.
    expect(releaseTag("0.1.1")).toBe("v0.1.1");
    expect(releaseTag("1.2.3")).toBe("v1.2.3");
  });

  it("does not double up an already-prefixed version", () => {
    expect(releaseTag("v0.1.1")).toBe("v0.1.1");
  });
});

describe("npmUpdateCommandLine", () => {
  it("is the exact command --dry-run prints and update runs", () => {
    // Both the shown and executed command come from NPM_UPDATE_ARGS, so this
    // pins them together — a drift would fail here.
    expect(npmUpdateCommandLine()).toBe(`npm ${NPM_UPDATE_ARGS.join(" ")}`);
    expect(npmUpdateCommandLine()).toBe("npm install -g @revenexx/cli@latest");
  });
});

describe("brewUpdateCommandLine", () => {
  it("is the exact command --dry-run prints and update runs", () => {
    expect(brewUpdateCommandLine()).toBe(`brew update && brew ${BREW_UPDATE_ARGS.join(" ")}`);
    expect(brewUpdateCommandLine()).toBe(
      "brew update && brew upgrade revenexx-sdks/cli/revenexx",
    );
  });

  it("refreshes the tap before upgrading", () => {
    // Without `brew update` the tap still carries the formula revision from
    // install time, so `brew upgrade` would report nothing to do after a release.
    expect(brewUpdateCommandLine().startsWith("brew update &&")).toBe(true);
  });
});

describe("isHomebrewPath", () => {
  it("detects a Cellar install under either macOS prefix", () => {
    expect(
      isHomebrewPath(["/opt/homebrew/Cellar/revenexx/0.2.0/bin/revenexx"]),
    ).toBe(true);
    expect(
      isHomebrewPath(["/usr/local/Cellar/revenexx/0.2.0/bin/revenexx"]),
    ).toBe(true);
    expect(
      isHomebrewPath([
        "/home/linuxbrew/.linuxbrew/Cellar/revenexx/0.2.0/bin/revenexx",
      ]),
    ).toBe(true);
  });

  it("detects the Homebrew binary even when argv[1] is Bun's virtual path", () => {
    // The Homebrew artifact is the Bun-compiled binary: argv[1] names a file
    // inside the executable, so execPath is the only usable signal.
    expect(
      isHomebrewPath([
        "/opt/homebrew/Cellar/revenexx/0.2.0/bin/revenexx",
        "/$bunfs/root/cli",
      ]),
    ).toBe(true);
  });

  it("does not mistake a Homebrew-installed node running an npm install", () => {
    // Homebrew's node lives in /opt/homebrew/bin — matching the bare prefix
    // would classify every npm install on such a machine as Homebrew.
    expect(
      isHomebrewPath([
        "/opt/homebrew/bin/node",
        "/opt/homebrew/lib/node_modules/@revenexx/cli/dist/cli.mjs",
      ]),
    ).toBe(false);
  });

  it("is false for a plain npm or nvm install", () => {
    expect(
      isHomebrewPath([
        "/Users/dev/.nvm/versions/node/v20.11.0/bin/node",
        "/Users/dev/.nvm/versions/node/v20.11.0/lib/node_modules/@revenexx/cli/dist/cli.mjs",
      ]),
    ).toBe(false);
    expect(isHomebrewPath([""])).toBe(false);
  });
});

describe("Homebrew tap addressing", () => {
  it("drops the homebrew- prefix Homebrew strips from the tap repo name", () => {
    // Repo revenexx-sdks/homebrew-cli is tapped as revenexx-sdks/cli, so the
    // formula resolves as `brew install revenexx-sdks/cli/revenexx`.
    expect(HOMEBREW_TAP).toBe("revenexx-sdks/cli");
    expect(HOMEBREW_FORMULA).toBe("revenexx-sdks/cli/revenexx");
  });
});
