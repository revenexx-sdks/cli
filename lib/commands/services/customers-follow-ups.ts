import { Command } from "commander";
import { hiddenAliasHelp } from "../../legacy-names.js";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
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
    ...hiddenAliasHelp,
    helpWidth: process.stdout.columns || 80,
  });

const contactEventsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The timeline entry.", type: "string", required: true },
  { key: "assignee", option: "--assignee <assignee>", name: "assignee", description: "Who does the follow-up — a name or a sales-rep code. Free text; null or empty clears it.", type: "string", required: false },
  { key: "doneAt", option: "--done-at <done-at>", name: "done_at", description: "When the follow-up was done. Null reopens it. POST /customers/contact_events/{id}/done stamps it with now.", type: "string", required: false },
  { key: "dueAt", option: "--due-at <due-at>", name: "due_at", description: "When the follow-up is due. Null makes the entry a plain one again.", type: "string", required: false },
];
customersFollowUps
  .command(`contact-events-update`)
  .description(`Changes who does a follow-up (\`assignee\`), when it is due (\`due_at\`) and when it was done (\`done_at\`) — the address every Cockpit surface edits an entry through. Send only what changes; \`null\` clears a field: a cleared \`done_at\` reopens the follow-up, a cleared \`due_at\` makes it a plain entry again. What was filed stays as filed: \`contact_id\`, \`organization_id\`, \`kind\`, \`name\`, \`subject\`, \`payload\`, \`actor\` and \`occurred_at\` — and the store's \`id\` and \`created_at\` — are accepted when sent back exactly as stored (a form echoing the whole entry) and refused when they differ. Only a follow-up — a task, or an entry that has a due date once this write lands — can carry \`done_at\`. A write that changes nothing answers the entry as it is.`)
  .alias("customers-contact-events-update")
  .option(`--id <id>`, `The timeline entry.`)
  .option(`--assignee <assignee>`, `Who does the follow-up — a name or a sales-rep code. Free text; null or empty clears it.`)
  .option(`--done-at <done-at>`, `When the follow-up was done. Null reopens it. POST /customers/contact_events/{id}/done stamps it with now.`)
  .option(`--due-at <due-at>`, `When the follow-up is due. Null makes the entry a plain one again.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, assignee, doneAt, dueAt } = await promptForMissing(
          _options,
          contactEventsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_events/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (assignee !== undefined) {
          _payload[`assignee`] = assignee;
        }
        if (doneAt !== undefined) {
          _payload[`done_at`] = doneAt;
        }
        if (dueAt !== undefined) {
          _payload[`due_at`] = dueAt;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `put`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(customersFollowUps.commands.at(-1)!, contactEventsUpdateSpecs, { method: "put" });
const contactEventsDoneSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The timeline entry.", type: "string", required: true },
];
customersFollowUps
  .command(`contact-events-done`)
  .description(`A follow-up — a task, or any entry with a due date — is done: \`done_at\` is set and it leaves every list of open tasks. The entry stays on the timeline as it was filed. Done twice answers the entry as it is.`)
  .alias("customers-contact-events-done")
  .option(`--id <id>`, `The timeline entry.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          contactEventsDoneSpecs,
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
registerPromptSpecs(customersFollowUps.commands.at(-1)!, contactEventsDoneSpecs, { method: "post" });
