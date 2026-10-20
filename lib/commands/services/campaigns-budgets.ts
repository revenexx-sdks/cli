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
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const campaignsBudgets = new Command("campaigns-budgets")
  .description(
    commandDescriptions["campaignsBudgets"] ??
      `Budget lines of a campaign: planned money and what was spent. Lines entered by hand are edited here; lines fed by ad spend are booked by the ads app and read-only.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "Keep only rows whose `campaign_id` equals this.", type: "string", required: false },
  { key: "line", option: "--line <line>", name: "line", description: "Keep only rows whose `line` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Keep only rows whose `source` equals this.", type: "string", required: false },
  { key: "platform", option: "--platform <platform>", name: "platform", description: "Keep only rows whose `platform` equals this.", type: "string", required: false },
  { key: "notes", option: "--notes <notes>", name: "notes", description: "Keep only rows whose `notes` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
campaignsBudgets
  .command(`list`)
  .description(`List budget lines`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--campaign-id <campaign-id>`, `Keep only rows whose \`campaign_id\` equals this.`)
  .option(`--line <line>`, `Keep only rows whose \`line\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(`--source <source>`, `Keep only rows whose \`source\` equals this.`)
  .option(`--platform <platform>`, `Keep only rows whose \`platform\` equals this.`)
  .option(`--notes <notes>`, `Keep only rows whose \`notes\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, campaignId, line, currency, source, platform, notes, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/budgets`;
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
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
        }
        if (line !== undefined) {
          _payload[`line`] = line;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (platform !== undefined) {
          _payload[`platform`] = platform;
        }
        if (notes !== undefined) {
          _payload[`notes`] = notes;
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
registerPromptSpecs(campaignsBudgets.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "The campaign this row belongs to.", type: "string", required: true },
  { key: "line", option: "--line <line>", name: "line", description: "The name of the line, unique within the campaign, e.g. Print or ads:meta.", type: "string", required: true },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Three-letter currency code, e.g. EUR.", type: "string", required: false },
  { key: "notes", option: "--notes <notes>", name: "notes", description: "Anything worth saying about the line.", type: "string", required: false },
  { key: "planned", option: "--planned <planned>", name: "planned", description: "Money planned for this line.", type: "number", required: false },
  { key: "spent", option: "--spent <spent>", name: "spent", description: "Money spent. For a line fed by ad spend, the sum of the booked days.", type: "number", required: false },
];
campaignsBudgets
  .command(`create`)
  .description(`Add a budget line`)
  .option(`--campaign-id <campaign-id>`, `The campaign this row belongs to.`)
  .option(`--line <line>`, `The name of the line, unique within the campaign, e.g. Print or ads:meta.`)
  .option(`--currency <currency>`, `Three-letter currency code, e.g. EUR.`)
  .option(`--notes <notes>`, `Anything worth saying about the line.`)
  .option(`--planned <planned>`, `Money planned for this line.`, parseInteger)
  .option(`--spent <spent>`, `Money spent. For a line fed by ad spend, the sum of the booked days.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { campaignId, line, currency, notes, planned, spent } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/budgets`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (line !== undefined) {
          _payload[`line`] = line;
        }
        if (notes !== undefined) {
          _payload[`notes`] = notes;
        }
        if (planned !== undefined) {
          _payload[`planned`] = planned;
        }
        if (spent !== undefined) {
          _payload[`spent`] = spent;
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
registerPromptSpecs(campaignsBudgets.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/budgets", hasLimit: true } },
];
campaignsBudgets
  .command(`delete`)
  .description(`Delete a budget line`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`campaigns-budgets delete`);
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/budgets/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `delete`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(campaignsBudgets.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/budgets", hasLimit: true } },
];
campaignsBudgets
  .command(`get`)
  .description(`Read one budget line`)
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
        const _apiPath = `/campaigns/budgets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsBudgets.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/budgets", hasLimit: true } },
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "The campaign this row belongs to.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Three-letter currency code, e.g. EUR.", type: "string", required: false },
  { key: "line", option: "--line <line>", name: "line", description: "The name of the line, unique within the campaign, e.g. Print or ads:meta.", type: "string", required: false },
  { key: "notes", option: "--notes <notes>", name: "notes", description: "Anything worth saying about the line.", type: "string", required: false },
  { key: "planned", option: "--planned <planned>", name: "planned", description: "Money planned for this line.", type: "number", required: false },
  { key: "spent", option: "--spent <spent>", name: "spent", description: "Money spent. For a line fed by ad spend, the sum of the booked days.", type: "number", required: false },
];
campaignsBudgets
  .command(`update`)
  .description(`Correct a budget line`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--campaign-id <campaign-id>`, `The campaign this row belongs to.`)
  .option(`--currency <currency>`, `Three-letter currency code, e.g. EUR.`)
  .option(`--line <line>`, `The name of the line, unique within the campaign, e.g. Print or ads:meta.`)
  .option(`--notes <notes>`, `Anything worth saying about the line.`)
  .option(`--planned <planned>`, `Money planned for this line.`, parseInteger)
  .option(`--spent <spent>`, `Money spent. For a line fed by ad spend, the sum of the booked days.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, campaignId, currency, line, notes, planned, spent } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/budgets/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (line !== undefined) {
          _payload[`line`] = line;
        }
        if (notes !== undefined) {
          _payload[`notes`] = notes;
        }
        if (planned !== undefined) {
          _payload[`planned`] = planned;
        }
        if (spent !== undefined) {
          _payload[`spent`] = spent;
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
registerPromptSpecs(campaignsBudgets.commands.at(-1)!, updateSpecs, { method: "put" });
