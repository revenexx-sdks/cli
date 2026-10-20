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

export const campaignsSpend = new Command("campaigns-spend")
  .description(
    commandDescriptions["campaignsSpend"] ??
      `Daily ad spend per campaign and platform, as the ads app books it. Booking a day again replaces it.`,
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
  { key: "budgetId", option: "--budget-id <budget-id>", name: "budget_id", description: "Keep only rows whose `budget_id` equals this.", type: "string", required: false },
  { key: "platform", option: "--platform <platform>", name: "platform", description: "Keep only rows whose `platform` equals this.", type: "string", required: false },
  { key: "spendDate", option: "--spend-date <spend-date>", name: "spend_date", description: "Keep only rows whose `spend_date` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "impressions", option: "--impressions <impressions>", name: "impressions", description: "Keep only rows whose `impressions` equals this.", type: "string", required: false },
  { key: "clicks", option: "--clicks <clicks>", name: "clicks", description: "Keep only rows whose `clicks` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
campaignsSpend
  .command(`list`)
  .description(`List booked days of ad spend`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--campaign-id <campaign-id>`, `Keep only rows whose \`campaign_id\` equals this.`)
  .option(`--budget-id <budget-id>`, `Keep only rows whose \`budget_id\` equals this.`)
  .option(`--platform <platform>`, `Keep only rows whose \`platform\` equals this.`)
  .option(`--spend-date <spend-date>`, `Keep only rows whose \`spend_date\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(`--impressions <impressions>`, `Keep only rows whose \`impressions\` equals this.`)
  .option(`--clicks <clicks>`, `Keep only rows whose \`clicks\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, campaignId, budgetId, platform, spendDate, currency, impressions, clicks, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/spend`;
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
        if (budgetId !== undefined) {
          _payload[`budget_id`] = budgetId;
        }
        if (platform !== undefined) {
          _payload[`platform`] = platform;
        }
        if (spendDate !== undefined) {
          _payload[`spend_date`] = spendDate;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (impressions !== undefined) {
          _payload[`impressions`] = impressions;
        }
        if (clicks !== undefined) {
          _payload[`clicks`] = clicks;
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
registerPromptSpecs(campaignsSpend.commands.at(-1)!, listSpecs, { method: "get" });
const importSpecs: PromptSpec[] = [
  { key: "rows", option: "--rows [rows...]", name: "rows", type: "array", required: true },
];
campaignsSpend
  .command(`import`)
  .description(`At most 500 rows. Each books one day of one platform into the campaign ads budget line, created on first use; booking a day again replaces it.`)
  .option(`--rows [rows...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { rows } = await promptForMissing(
          _options,
          importSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/spend`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (rows !== undefined) {
          _payload[`rows`] = rows;
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
registerPromptSpecs(campaignsSpend.commands.at(-1)!, importSpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/spend", hasLimit: true } },
];
campaignsSpend
  .command(`get`)
  .description(`Read one booked day`)
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
        const _apiPath = `/campaigns/spend/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsSpend.commands.at(-1)!, getSpecs, { method: "get" });
