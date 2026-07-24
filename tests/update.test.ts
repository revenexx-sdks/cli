import { describe, it, expect } from "vitest";
import {
  releaseTag,
  npmUpdateCommandLine,
  NPM_UPDATE_ARGS,
} from "../lib/commands/update.js";

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
