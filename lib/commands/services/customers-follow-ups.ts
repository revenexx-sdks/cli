import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const customersFollowUps = new Command("customers-follow-ups")
  .description(
    commandDescriptions["customersFollowUps"] ??
      `The follow-ups across every customer: timeline entries with a due date — a task, a call to return — that are still open, and the one call that marks one done. The entries themselves are written from a contact or a company page; this group is the worklist over them.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const customersContactEventsDoneSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The timeline entry.", type: "string", required: true },
];
customersFollowUps
  .command(`customers-contact-events-done`)
  .description(`A follow-up — a task, or any entry with a due date — is done: \`done_at\` is set and it leaves every list of open tasks. The entry stays on the timeline as it was filed. Done twice answers the entry as it is.`)
  .option(`--id <id>`, `The timeline entry.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersContactEventsDoneSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_events/{id}/done`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `post`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(customersFollowUps.commands.at(-1)!, customersContactEventsDoneSpecs, { method: "post" });
