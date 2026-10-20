import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const mailingsRecipients = new Command("mailings-recipients")
  .description(
    commandDescriptions["mailingsRecipients"] ??
      `One row per audience member of a sent mailing: sent, or held back with a reason — no consent, graymail, suppressed, invalid or excluded. Written by the send pipeline only.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "mailingId", option: "--mailing-id <mailing-id>", name: "mailing_id", description: "Keep only rows whose `mailing_id` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "Keep only rows whose `email` equals this.", type: "string", required: false },
  { key: "outcome", option: "--outcome <outcome>", name: "outcome", description: "Keep only rows whose `outcome` equals this.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Keep only rows whose `reason` equals this.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Keep only rows whose `market` equals this.", type: "string", required: false },
  { key: "messageId", option: "--message-id <message-id>", name: "message_id", description: "Keep only rows whose `message_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
mailingsRecipients
  .command(`list`)
  .description(`Filter \`?mailing_id=\` for one mailing, \`?outcome=\` for one outcome. Written by the send pipeline only.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--mailing-id <mailing-id>`, `Keep only rows whose \`mailing_id\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--email <email>`, `Keep only rows whose \`email\` equals this.`)
  .option(`--outcome <outcome>`, `Keep only rows whose \`outcome\` equals this.`)
  .option(`--reason <reason>`, `Keep only rows whose \`reason\` equals this.`)
  .option(`--market <market>`, `Keep only rows whose \`market\` equals this.`)
  .option(`--message-id <message-id>`, `Keep only rows whose \`message_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, mailingId, contactId, email, outcome, reason, market, messageId, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/recipients`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
        }
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (mailingId !== undefined) {
          _payload[`mailing_id`] = mailingId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (outcome !== undefined) {
          _payload[`outcome`] = outcome;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (messageId !== undefined) {
          _payload[`message_id`] = messageId;
        }
        for (const _filter of filter as string[]) {
          const _eq = _filter.indexOf("=");
          if (_eq <= 0) {
            throw new Error(`--filter expects column=value, got "${_filter}"`);
          }
          _payload[_filter.slice(0, _eq)] = _filter.slice(_eq + 1);
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `get`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(mailingsRecipients.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/recipients", hasLimit: true } },
];
mailingsRecipients
  .command(`get`)
  .description(`Read one recipient row`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/recipients/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `get`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(mailingsRecipients.commands.at(-1)!, getSpecs, { method: "get" });
