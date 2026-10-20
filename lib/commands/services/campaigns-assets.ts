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

export const campaignsAssets = new Command("campaigns-assets")
  .description(
    commandDescriptions["campaignsAssets"] ??
      `What each campaign holds: promotions, marketing mails, automations and forms that carry the campaign in their own campaign reference, and pages and ad campaigns listed here only. Written through attach and detach, never directly.`,
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
  { key: "assetApp", option: "--asset-app <asset-app>", name: "asset_app", description: "Keep only rows whose `asset_app` equals this.", type: "string", required: false },
  { key: "assetEntity", option: "--asset-entity <asset-entity>", name: "asset_entity", description: "Keep only rows whose `asset_entity` equals this.", type: "string", required: false },
  { key: "assetId", option: "--asset-id <asset-id>", name: "asset_id", description: "Keep only rows whose `asset_id` equals this.", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "Keep only rows whose `label` equals this.", type: "string", required: false },
  { key: "claim", option: "--claim <claim>", name: "claim", description: "Keep only rows whose `claim` equals this.", type: "string", required: false },
  { key: "addedBy", option: "--added-by <added-by>", name: "added_by", description: "Keep only rows whose `added_by` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
campaignsAssets
  .command(`list`)
  .description(`Filter \`?campaign_id=\` for one campaign, \`?asset_app=&asset_id=\` for the campaign that holds an asset. Written only through attach and detach.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--campaign-id <campaign-id>`, `Keep only rows whose \`campaign_id\` equals this.`)
  .option(`--asset-app <asset-app>`, `Keep only rows whose \`asset_app\` equals this.`)
  .option(`--asset-entity <asset-entity>`, `Keep only rows whose \`asset_entity\` equals this.`)
  .option(`--asset-id <asset-id>`, `Keep only rows whose \`asset_id\` equals this.`)
  .option(`--label <label>`, `Keep only rows whose \`label\` equals this.`)
  .option(`--claim <claim>`, `Keep only rows whose \`claim\` equals this.`)
  .option(`--added-by <added-by>`, `Keep only rows whose \`added_by\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, campaignId, assetApp, assetEntity, assetId, label, claim, addedBy, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/assets`;
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
        if (assetApp !== undefined) {
          _payload[`asset_app`] = assetApp;
        }
        if (assetEntity !== undefined) {
          _payload[`asset_entity`] = assetEntity;
        }
        if (assetId !== undefined) {
          _payload[`asset_id`] = assetId;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (claim !== undefined) {
          _payload[`claim`] = claim;
        }
        if (addedBy !== undefined) {
          _payload[`added_by`] = addedBy;
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
registerPromptSpecs(campaignsAssets.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/assets", hasLimit: true } },
];
campaignsAssets
  .command(`get`)
  .description(`Read one asset row`)
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
        const _apiPath = `/campaigns/assets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsAssets.commands.at(-1)!, getSpecs, { method: "get" });
const detachSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/assets", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
campaignsAssets
  .command(`detach`)
  .description(`The same as detaching from the campaign, addressed by the asset row — what a list row offers.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { id, body } = await promptForMissing(
          _options,
          detachSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/assets/{id}/detach`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsAssets.commands.at(-1)!, detachSpecs, { method: "post" });
