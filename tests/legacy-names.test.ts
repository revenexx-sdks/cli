import { describe, it, expect } from "vitest";
import { Command } from "commander";
import { hiddenAliasHelp } from "../lib/legacy-names.js";

// DX-739: a renamed command keeps its old name as a hidden alias. The alias
// must resolve but must not show up in help.
function buildProgram(ran: string[]) {
  const group = new Command("group").configureHelp({
    ...hiddenAliasHelp,
    helpWidth: 80,
  });
  group
    .command("vocabularies-get")
    .alias("old-name")
    .description("Get a vocabulary")
    .action(() => {
      ran.push("vocabularies-get");
    });
  const root = new Command("root").exitOverride();
  root.addCommand(group);
  return { root, group };
}

describe("hiddenAliasHelp", () => {
  it("hides the legacy alias in the group's command list", () => {
    const { group } = buildProgram([]);
    const help = group.helpInformation();
    expect(help).toContain("vocabularies-get");
    expect(help).not.toContain("old-name");
  });

  it("hides the legacy alias in the subcommand's usage line", () => {
    const { group } = buildProgram([]);
    const sub = group.commands.find((c) => c.name() === "vocabularies-get");
    expect(sub).toBeDefined();
    const help = sub!.helpInformation();
    expect(help).toContain("vocabularies-get");
    expect(help).not.toContain("old-name");
  });

  it("still resolves the legacy alias to the subcommand's action", async () => {
    const ran: string[] = [];
    const { root } = buildProgram(ran);
    await root.parseAsync(["node", "x", "group", "old-name"]);
    expect(ran).toEqual(["vocabularies-get"]);
  });
});
