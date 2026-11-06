import { Command, Help } from "commander";

// DX-739: a renamed command keeps its old name as a commander alias so that
// existing invocations still resolve. Commander prints the first alias next
// to the name (`name|alias`) in help, which would show the old name to users.
// These overrides strip it again. Spread into the service group's
// `.configureHelp()`; subcommands inherit the configuration when they are
// added with `.command()`.

function withoutAlias(term: string, cmd: Command): string {
  const alias = cmd.aliases()[0];
  return alias ? term.replace(`|${alias}`, "") : term;
}

export const hiddenAliasHelp: Partial<Help> = {
  subcommandTerm(this: Help, cmd: Command): string {
    return withoutAlias(Help.prototype.subcommandTerm.call(this, cmd), cmd);
  },
  commandUsage(this: Help, cmd: Command): string {
    return withoutAlias(Help.prototype.commandUsage.call(this, cmd), cmd);
  },
};
