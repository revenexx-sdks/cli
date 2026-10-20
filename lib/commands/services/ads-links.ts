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

export const adsLinks = new Command("ads-links")
  .description(
    commandDescriptions["adsLinks"] ??
      `Ad campaigns of the platforms and the campaign each one belongs to. New ad campaigns appear with their first spend and wait to be mapped.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "adAccountId", option: "--ad-account-id <ad-account-id>", name: "ad_account_id", description: "Keep only rows whose `ad_account_id` equals this.", type: "string", required: false },
  { key: "externalCampaignId", option: "--external-campaign-id <external-campaign-id>", name: "external_campaign_id", description: "Keep only rows whose `external_campaign_id` equals this.", type: "string", required: false },
  { key: "externalName", option: "--external-name <external-name>", name: "external_name", description: "Keep only rows whose `external_name` equals this.", type: "string", required: false },
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "Keep only rows whose `campaign_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
adsLinks
  .command(`list`)
  .description(`Filter \`?campaign_id=\` for one campaign, \`?campaign_id=\` empty via the Cockpit for unmapped ones, \`?ad_account_id=\`. Mapping books the imported spend into the campaign.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--ad-account-id <ad-account-id>`, `Keep only rows whose \`ad_account_id\` equals this.`)
  .option(`--external-campaign-id <external-campaign-id>`, `Keep only rows whose \`external_campaign_id\` equals this.`)
  .option(`--external-name <external-name>`, `Keep only rows whose \`external_name\` equals this.`)
  .option(`--campaign-id <campaign-id>`, `Keep only rows whose \`campaign_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, adAccountId, externalCampaignId, externalName, campaignId, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/campaign-links`;
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
        if (externalName !== undefined) {
          _payload[`external_name`] = externalName;
        }
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
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
registerPromptSpecs(adsLinks.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "adAccountId", option: "--ad-account-id <ad-account-id>", name: "ad_account_id", description: "The ad account this row belongs to.", type: "string", required: true },
  { key: "externalCampaignId", option: "--external-campaign-id <external-campaign-id>", name: "external_campaign_id", description: "The ad campaign id on the platform.", type: "string", required: true },
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "The campaign, as the campaigns app knows it.", type: "string", required: false },
  { key: "externalName", option: "--external-name <external-name>", name: "external_name", description: "Its name on the platform.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
];
adsLinks
  .command(`create`)
  .description(`List an ad campaign`)
  .option(`--ad-account-id <ad-account-id>`, `The ad account this row belongs to.`)
  .option(`--external-campaign-id <external-campaign-id>`, `The ad campaign id on the platform.`)
  .option(`--campaign-id <campaign-id>`, `The campaign, as the campaigns app knows it.`)
  .option(`--external-name <external-name>`, `Its name on the platform.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { adAccountId, externalCampaignId, campaignId, externalName, externalRefs, metadata, sourceData, sourceSyncedAt } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/campaign-links`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (adAccountId !== undefined) {
          _payload[`ad_account_id`] = adAccountId;
        }
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
        }
        if (externalCampaignId !== undefined) {
          _payload[`external_campaign_id`] = externalCampaignId;
        }
        if (externalName !== undefined) {
          _payload[`external_name`] = externalName;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = sourceData;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
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
registerPromptSpecs(adsLinks.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/campaign-links", hasLimit: true } },
];
adsLinks
  .command(`delete`)
  .description(`Remove an ad campaign without spend`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`ads-links delete`);
        const _client = await sdkForProject();
        const _apiPath = `/ads/campaign-links/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsLinks.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/campaign-links", hasLimit: true } },
];
adsLinks
  .command(`get`)
  .description(`Read one ad campaign link`)
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
        const _apiPath = `/ads/campaign-links/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsLinks.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/campaign-links", hasLimit: true } },
  { key: "adAccountId", option: "--ad-account-id <ad-account-id>", name: "ad_account_id", description: "The ad account this row belongs to.", type: "string", required: false },
  { key: "campaignId", option: "--campaign-id <campaign-id>", name: "campaign_id", description: "The campaign, as the campaigns app knows it.", type: "string", required: false },
  { key: "externalCampaignId", option: "--external-campaign-id <external-campaign-id>", name: "external_campaign_id", description: "The ad campaign id on the platform.", type: "string", required: false },
  { key: "externalName", option: "--external-name <external-name>", name: "external_name", description: "Its name on the platform.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
];
adsLinks
  .command(`update`)
  .description(`Map an ad campaign to a campaign`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--ad-account-id <ad-account-id>`, `The ad account this row belongs to.`)
  .option(`--campaign-id <campaign-id>`, `The campaign, as the campaigns app knows it.`)
  .option(`--external-campaign-id <external-campaign-id>`, `The ad campaign id on the platform.`)
  .option(`--external-name <external-name>`, `Its name on the platform.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, adAccountId, campaignId, externalCampaignId, externalName, externalRefs, metadata, sourceData, sourceSyncedAt } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/campaign-links/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (adAccountId !== undefined) {
          _payload[`ad_account_id`] = adAccountId;
        }
        if (campaignId !== undefined) {
          _payload[`campaign_id`] = campaignId;
        }
        if (externalCampaignId !== undefined) {
          _payload[`external_campaign_id`] = externalCampaignId;
        }
        if (externalName !== undefined) {
          _payload[`external_name`] = externalName;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = sourceData;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
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
registerPromptSpecs(adsLinks.commands.at(-1)!, updateSpecs, { method: "put" });
