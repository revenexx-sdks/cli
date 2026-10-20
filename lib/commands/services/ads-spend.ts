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

export const adsSpend = new Command("ads-spend")
  .description(
    commandDescriptions["adsSpend"] ??
      `Daily ad spend per ad campaign, booked into the budget of the mapped campaign, and return on ad spend per campaign.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const figuresSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The ad account.", type: "string", required: true },
];
adsSpend
  .command(`figures`)
  .description(`Spend per day, clicks and consented conversions per day, from the first active day to the last with every day between, at most the latest 60; and spend per ad campaign, largest first. Spend in the account's currency only; words in the caller's language. Reads only.`)
  .option(`--id <id>`, `The ad account.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          figuresSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/accounts/{id}/figures`.replace(`{id}`, id);
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
registerPromptSpecs(adsSpend.commands.at(-1)!, figuresSpecs, { method: "get" });
const roasSpecs: PromptSpec[] = [
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "The campaign.", type: "string", required: true },
  { key: "model", option: "--model <model>", name: "model", description: "Default last_touch.", type: "string", required: false, enum: ["first_touch","last_touch"] },
];
adsSpend
  .command(`roas`)
  .description(`Revenue as campaigns attributes it under the model, divided by the ad spend booked here in the campaign's currency, with spend per platform.`)
  .option(`--campaign-id <campaign-id>`, `The campaign.`)
  .option(`--model <model>`, `Default last_touch.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { campaignId, model } = await promptForMissing(
          _options,
          roasSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/campaigns/{campaign_id}/roas`.replace(`{campaign_id}`, campaignId);
        const _payload: RequestParams = {};
        if (model !== undefined) {
          _payload[`model`] = model;
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
registerPromptSpecs(adsSpend.commands.at(-1)!, roasSpecs, { method: "get" });
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "adAccountId", option: "--ad-account-id <ad-account-id>", name: "ad_account_id", description: "Keep only rows whose `ad_account_id` equals this.", type: "string", required: false },
  { key: "externalCampaignId", option: "--external-campaign-id <external-campaign-id>", name: "external_campaign_id", description: "Keep only rows whose `external_campaign_id` equals this.", type: "string", required: false },
  { key: "linkId", option: "--link-id <link-id>", name: "link_id", description: "Keep only rows whose `link_id` equals this.", type: "string", required: false },
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "Keep only rows whose `campaign_id` equals this.", type: "string", required: false },
  { key: "platform", option: "--platform <platform>", name: "platform", description: "Keep only rows whose `platform` equals this.", type: "string", required: false },
  { key: "spendDate", option: "--spend-date <spend-date>", name: "spend_date", description: "Keep only rows whose `spend_date` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "impressions", option: "--impressions <impressions>", name: "impressions", description: "Keep only rows whose `impressions` equals this.", type: "string", required: false },
  { key: "clicks", option: "--clicks <clicks>", name: "clicks", description: "Keep only rows whose `clicks` equals this.", type: "string", required: false },
  { key: "bookingState", option: "--booking-state <booking-state>", name: "booking_state", description: "Keep only rows whose `booking_state` equals this.", type: "string", required: false },
  { key: "bookingError", option: "--booking-error <booking-error>", name: "booking_error", description: "Keep only rows whose `booking_error` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
adsSpend
  .command(`list`)
  .description(`Filter \`?campaign_id=\`, \`?ad_account_id=\`, \`?booking_state=unlinked\`, \`?spend_date=\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--ad-account-id <ad-account-id>`, `Keep only rows whose \`ad_account_id\` equals this.`)
  .option(`--external-campaign-id <external-campaign-id>`, `Keep only rows whose \`external_campaign_id\` equals this.`)
  .option(`--link-id <link-id>`, `Keep only rows whose \`link_id\` equals this.`)
  .option(`--campaign-id <campaign-id>`, `Keep only rows whose \`campaign_id\` equals this.`)
  .option(`--platform <platform>`, `Keep only rows whose \`platform\` equals this.`)
  .option(`--spend-date <spend-date>`, `Keep only rows whose \`spend_date\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(`--impressions <impressions>`, `Keep only rows whose \`impressions\` equals this.`)
  .option(`--clicks <clicks>`, `Keep only rows whose \`clicks\` equals this.`)
  .option(`--booking-state <booking-state>`, `Keep only rows whose \`booking_state\` equals this.`)
  .option(`--booking-error <booking-error>`, `Keep only rows whose \`booking_error\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, adAccountId, externalCampaignId, linkId, campaignId, platform, spendDate, currency, impressions, clicks, bookingState, bookingError, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/spend`;
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
        if (adAccountId !== undefined) {
          _payload[`ad_account_id`] = adAccountId;
        }
        if (externalCampaignId !== undefined) {
          _payload[`external_campaign_id`] = externalCampaignId;
        }
        if (linkId !== undefined) {
          _payload[`link_id`] = linkId;
        }
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
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
        if (bookingState !== undefined) {
          _payload[`booking_state`] = bookingState;
        }
        if (bookingError !== undefined) {
          _payload[`booking_error`] = bookingError;
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
registerPromptSpecs(adsSpend.commands.at(-1)!, listSpecs, { method: "get" });
const importSpecs: PromptSpec[] = [
  { key: "rows", option: "--rows [rows...]", name: "rows", type: "array", required: true },
];
adsSpend
  .command(`import`)
  .description(`Called by the daily spend workflow. Each row is kept per account, ad campaign and day; a second import of a day replaces it. Mapped spend is booked into the campaign budget, summed per campaign, platform and day.`)
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
        const _apiPath = `/ads/spend`;
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
registerPromptSpecs(adsSpend.commands.at(-1)!, importSpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/spend", hasLimit: true } },
];
adsSpend
  .command(`get`)
  .description(`Read one day of ad spend`)
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
        const _apiPath = `/ads/spend/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsSpend.commands.at(-1)!, getSpecs, { method: "get" });
