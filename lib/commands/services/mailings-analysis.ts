import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const mailingsAnalysis = new Command("mailings-analysis")
  .description(
    commandDescriptions["mailingsAnalysis"] ??
      `What a mailing achieved: deliveries, opens with machine opens apart, clicks, rates, unsubscribes, complaints, revenue from the campaign ledger, and the click map. Built from sequencer announcements.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listClicksSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "mailingId", option: "--mailing-id <mailing-id>", name: "mailing_id", description: "Keep only rows whose `mailing_id` equals this.", type: "string", required: false },
  { key: "url", option: "--url <url>", name: "url", description: "Keep only rows whose `url` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
mailingsAnalysis
  .command(`list-clicks`)
  .description(`List clicked links of mailings`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--mailing-id <mailing-id>`, `Keep only rows whose \`mailing_id\` equals this.`)
  .option(`--url <url>`, `Keep only rows whose \`url\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, mailingId, url, filter } = await promptForMissing(
          _options,
          listClicksSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/clicks`;
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
        if (url !== undefined) {
          _payload[`url`] = url;
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
registerPromptSpecs(mailingsAnalysis.commands.at(-1)!, listClicksSpecs, { method: "get" });
const getClickSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/clicks", hasLimit: true } },
];
mailingsAnalysis
  .command(`get-click`)
  .description(`Read one clicked link`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getClickSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/clicks/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsAnalysis.commands.at(-1)!, getClickSpecs, { method: "get" });
const listEngagementsSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "mailingId", option: "--mailing-id <mailing-id>", name: "mailing_id", description: "Keep only rows whose `mailing_id` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "Keep only rows whose `email` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "messageId", option: "--message-id <message-id>", name: "message_id", description: "Keep only rows whose `message_id` equals this.", type: "string", required: false },
  { key: "isMachine", option: "--is-machine <is-machine>", name: "is_machine", description: "Keep only rows whose `is_machine` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
mailingsAnalysis
  .command(`list-engagements`)
  .description(`The ledger of sequencer announcements, one row per announcement. Read-only.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--mailing-id <mailing-id>`, `Keep only rows whose \`mailing_id\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--email <email>`, `Keep only rows whose \`email\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--message-id <message-id>`, `Keep only rows whose \`message_id\` equals this.`)
  .option(`--is-machine <is-machine>`, `Keep only rows whose \`is_machine\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, mailingId, kind, email, contactId, messageId, isMachine, filter } = await promptForMissing(
          _options,
          listEngagementsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/engagements`;
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
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (messageId !== undefined) {
          _payload[`message_id`] = messageId;
        }
        if (isMachine !== undefined) {
          _payload[`is_machine`] = isMachine;
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
registerPromptSpecs(mailingsAnalysis.commands.at(-1)!, listEngagementsSpecs, { method: "get" });
const getEngagementSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/engagements", hasLimit: true } },
];
mailingsAnalysis
  .command(`get-engagement`)
  .description(`Read one recorded reaction`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getEngagementSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/engagements/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsAnalysis.commands.at(-1)!, getEngagementSpecs, { method: "get" });
const clicksSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
];
mailingsAnalysis
  .command(`clicks`)
  .description(`Every clicked link with clicks, unique clickers and its share of all clicks, the most clicked first. \`top\` carries the most clicked links as rows of label and value, worded in the caller language.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          clicksSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/clicks`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsAnalysis.commands.at(-1)!, clicksSpecs, { method: "get" });
const statsSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
];
mailingsAnalysis
  .command(`stats`)
  .description(`Recipient outcomes, deliveries, bounces, opens by people and by machines apart, clicks, click rate, click-to-open, unsubscribes, complaints and revenue. Rates are computed from unique clicks and human opens only. \`funnel\`, \`attention\` and \`outcomes\` carry the same figures as rows of label and value, worded in the caller language.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          statsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/stats`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsAnalysis.commands.at(-1)!, statsSpecs, { method: "get" });
const timelineSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
];
mailingsAnalysis
  .command(`timeline`)
  .description(`Human opens and clicks per day in the tenant time zone, from the first reaction to the last with every day between, at most the latest 60 days. Machine opens are left out.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          timelineSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/mailings/{id}/timeline`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsAnalysis.commands.at(-1)!, timelineSpecs, { method: "get" });
const listStatsSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "mailingId", option: "--mailing-id <mailing-id>", name: "mailing_id", description: "Keep only rows whose `mailing_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
mailingsAnalysis
  .command(`list-stats`)
  .description(`List the figures of mailings`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--mailing-id <mailing-id>`, `Keep only rows whose \`mailing_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, mailingId, filter } = await promptForMissing(
          _options,
          listStatsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/stats`;
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
registerPromptSpecs(mailingsAnalysis.commands.at(-1)!, listStatsSpecs, { method: "get" });
const sweepSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
mailingsAnalysis
  .command(`sweep`)
  .description(`The hourly schedule, callable by hand: recomputes revenue from the campaigns ledger and lifts delivered and clicked figures to what the sequencer messages say.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { body } = await promptForMissing(
          _options,
          sweepSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/stats/sweep`;
        const _payload: RequestParams = {};
        if (body !== undefined || cliConfig.data !== undefined) {
          Object.assign(_payload, resolveBodyParam(body ?? cliConfig.data));
        }
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
registerPromptSpecs(mailingsAnalysis.commands.at(-1)!, sweepSpecs, { method: "post" });
const getStatsSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/mailings/stats", hasLimit: true } },
];
mailingsAnalysis
  .command(`get-stats`)
  .description(`Read one figures row`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getStatsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/mailings/stats/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(mailingsAnalysis.commands.at(-1)!, getStatsSpecs, { method: "get" });
