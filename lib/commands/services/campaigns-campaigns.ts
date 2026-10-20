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

export const campaignsCampaigns = new Command("campaigns-campaigns")
  .description(
    commandDescriptions["campaignsCampaigns"] ??
      `The campaign records: a named marketing effort with a window, a goal, an owner and a UTM value. The stored status is what the marketer set; the effective state is that status read against the window. Attaching and releasing assets, the performance figures and the UTM link builder hang off one campaign.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "trashed", option: "--trashed <trashed>", name: "trashed", description: "`exclude` (default) leaves the trash out, `only` is the trash itself, `include` lists both.", type: "string", required: false, enum: ["exclude","only","include"] },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Keep only rows whose `code` equals this.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Keep only rows whose `name` equals this.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Keep only rows whose `description` equals this.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Keep only rows whose `status` equals this.", type: "string", required: false },
  { key: "effectiveState", option: "--effective-state <effective-state>", name: "effective_state", description: "Keep only rows whose `effective_state` equals this.", type: "string", required: false },
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Keep only rows whose `owner_id` equals this.", type: "string", required: false },
  { key: "utmCampaign", option: "--utm-campaign <utm-campaign>", name: "utm_campaign", description: "Keep only rows whose `utm_campaign` equals this.", type: "string", required: false },
  { key: "goalMetric", option: "--goal-metric <goal-metric>", name: "goal_metric", description: "Keep only rows whose `goal_metric` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "ordersCount", option: "--orders-count <orders-count>", name: "orders_count", description: "Keep only rows whose `orders_count` equals this.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Keep only rows whose `external_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
campaignsCampaigns
  .command(`list`)
  .description(`Every campaign of this tenant. Filter \`?effective_state=running\` for what runs now, \`?utm_campaign=\` to resolve the campaign a tracked landing names.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--trashed <trashed>`, `\`exclude\` (default) leaves the trash out, \`only\` is the trash itself, \`include\` lists both.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--code <code>`, `Keep only rows whose \`code\` equals this.`)
  .option(`--name <name>`, `Keep only rows whose \`name\` equals this.`)
  .option(`--description <description>`, `Keep only rows whose \`description\` equals this.`)
  .option(`--status <status>`, `Keep only rows whose \`status\` equals this.`)
  .option(`--effective-state <effective-state>`, `Keep only rows whose \`effective_state\` equals this.`)
  .option(`--owner-id <owner-id>`, `Keep only rows whose \`owner_id\` equals this.`)
  .option(`--utm-campaign <utm-campaign>`, `Keep only rows whose \`utm_campaign\` equals this.`)
  .option(`--goal-metric <goal-metric>`, `Keep only rows whose \`goal_metric\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(`--orders-count <orders-count>`, `Keep only rows whose \`orders_count\` equals this.`)
  .option(`--external-id <external-id>`, `Keep only rows whose \`external_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, trashed, id, code, name, description, status, effectiveState, ownerId, utmCampaign, goalMetric, currency, ordersCount, externalId, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns`;
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
        if (trashed !== undefined) {
          _payload[`trashed`] = trashed;
        }
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (effectiveState !== undefined) {
          _payload[`effective_state`] = effectiveState;
        }
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (utmCampaign !== undefined) {
          _payload[`utm_campaign`] = utmCampaign;
        }
        if (goalMetric !== undefined) {
          _payload[`goal_metric`] = goalMetric;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (ordersCount !== undefined) {
          _payload[`orders_count`] = ordersCount;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
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
registerPromptSpecs(campaignsCampaigns.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The short identifier a marketer recognises the campaign by. Unique per tenant.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "What the campaign is called, e.g. Black Week 2026.", type: "string", required: true },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency the budget and the revenue figures are stated in.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the campaign is for, in the marketer own words.", type: "string", required: false },
  { key: "endsAt", option: "--ends-at <ends-at>", name: "ends_at", description: "When the window closes. Empty means open-ended. Never before `starts_at`.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "goalMetric", option: "--goal-metric <goal-metric>", name: "goal_metric", description: "The one figure the campaign is judged by: revenue, orders, redemptions, leads, subscriptions or clicks.", type: "string", required: false, enum: ["revenue","orders","redemptions","leads","subscriptions","clicks"] },
  { key: "goalValue", option: "--goal-value <goal-value>", name: "goal_value", description: "The target for `goal_metric`. Needs a metric.", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Who is responsible: a sales-rep code or a platform user.", type: "string", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "startsAt", option: "--starts-at <starts-at>", name: "starts_at", description: "When the campaign window opens. Empty means it runs from its release.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "What the marketer set: `draft`, `active` (released), `completed` or `archived`. What the campaign is doing right now also depends on its window — read `effective_state`.", type: "string", required: false, enum: ["draft","active","completed","archived"] },
  { key: "tags", option: "--tags <tags>", name: "tags", description: "Free labels a marketer groups campaigns by, as a list of words.", type: "any", required: false },
  { key: "utmCampaign", option: "--utm-campaign <utm-campaign>", name: "utm_campaign", description: "The value a tracked link carries as utm_campaign, lower case. Unique per tenant; an order arriving with it is credited to this campaign. Filter `?utm_campaign=` to resolve a campaign from a landing.", type: "string", required: false },
];
campaignsCampaigns
  .command(`create`)
  .description(`Write a campaign down`)
  .option(`--code <code>`, `The short identifier a marketer recognises the campaign by. Unique per tenant.`)
  .option(`--name <name>`, `What the campaign is called, e.g. Black Week 2026.`)
  .option(`--currency <currency>`, `The currency the budget and the revenue figures are stated in.`)
  .option(`--description <description>`, `What the campaign is for, in the marketer own words.`)
  .option(`--ends-at <ends-at>`, `When the window closes. Empty means open-ended. Never before \`starts_at\`.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--goal-metric <goal-metric>`, `The one figure the campaign is judged by: revenue, orders, redemptions, leads, subscriptions or clicks.`)
  .option(`--goal-value <goal-value>`, `The target for \`goal_metric\`. Needs a metric.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--owner-id <owner-id>`, `Who is responsible: a sales-rep code or a platform user.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--starts-at <starts-at>`, `When the campaign window opens. Empty means it runs from its release.`)
  .option(`--status <status>`, `What the marketer set: \`draft\`, \`active\` (released), \`completed\` or \`archived\`. What the campaign is doing right now also depends on its window — read \`effective_state\`.`)
  .option(`--tags <tags>`, `Free labels a marketer groups campaigns by, as a list of words.`)
  .option(`--utm-campaign <utm-campaign>`, `The value a tracked link carries as utm_campaign, lower case. Unique per tenant; an order arriving with it is credited to this campaign. Filter \`?utm_campaign=\` to resolve a campaign from a landing.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, currency, description, endsAt, externalId, externalRefs, goalMetric, goalValue, metadata, ownerId, sourceData, sourceSyncedAt, startsAt, status, tags, utmCampaign } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (endsAt !== undefined) {
          _payload[`ends_at`] = endsAt;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (goalMetric !== undefined) {
          _payload[`goal_metric`] = goalMetric;
        }
        if (goalValue !== undefined) {
          _payload[`goal_value`] = goalValue;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = sourceData;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (startsAt !== undefined) {
          _payload[`starts_at`] = startsAt;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (tags !== undefined) {
          _payload[`tags`] = tags;
        }
        if (utmCampaign !== undefined) {
          _payload[`utm_campaign`] = utmCampaign;
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
registerPromptSpecs(campaignsCampaigns.commands.at(-1)!, createSpecs, { method: "post" });
campaignsCampaigns
  .command(`empty-trash`)
  .description(`Every campaign in the trash is deleted for good on its own terms. One that something still blocks stays in the trash and is named with its reason, so a partial success says exactly what remained. Not for a storefront contact.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns/trash/empty`;
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
campaignsCampaigns
  .command(`purge`)
  .description(`What the nightly purge does, callable by hand: every campaign in the trash for longer than the tenant trash retention (90 days unless the tenant set another) is deleted for good through the same rules as a second delete. A blocked one stays and carries its reason. When the retention cannot be read, nothing is deleted. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns/trash/purge`;
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
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/campaigns", hasLimit: true } },
];
campaignsCampaigns
  .command(`delete`)
  .description(`The first DELETE moves the campaign into the trash: it stays, with everything hanging off it, and counts nowhere until it is restored. A campaign with attribution facts or touches is refused (\`trash_blocked\`, blocker \`campaign_in_use\`) — archive it instead; one still holding assets is not deleted for good (\`delete_blocked\`, blocker \`campaign_has_assets\`). A DELETE on a campaign already in the trash deletes it for good — refused while something still needs it, and not for a storefront contact.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`campaigns-campaigns delete`);
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsCampaigns.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/campaigns", hasLimit: true } },
];
campaignsCampaigns
  .command(`get`)
  .description(`Read one campaign`)
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
        const _apiPath = `/campaigns/campaigns/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsCampaigns.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/campaigns", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "The short identifier a marketer recognises the campaign by. Unique per tenant.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency the budget and the revenue figures are stated in.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the campaign is for, in the marketer own words.", type: "string", required: false },
  { key: "endsAt", option: "--ends-at <ends-at>", name: "ends_at", description: "When the window closes. Empty means open-ended. Never before `starts_at`.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "goalMetric", option: "--goal-metric <goal-metric>", name: "goal_metric", description: "The one figure the campaign is judged by: revenue, orders, redemptions, leads, subscriptions or clicks.", type: "string", required: false, enum: ["revenue","orders","redemptions","leads","subscriptions","clicks"] },
  { key: "goalValue", option: "--goal-value <goal-value>", name: "goal_value", description: "The target for `goal_metric`. Needs a metric.", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the campaign is called, e.g. Black Week 2026.", type: "string", required: false },
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Who is responsible: a sales-rep code or a platform user.", type: "string", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "startsAt", option: "--starts-at <starts-at>", name: "starts_at", description: "When the campaign window opens. Empty means it runs from its release.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "What the marketer set: `draft`, `active` (released), `completed` or `archived`. What the campaign is doing right now also depends on its window — read `effective_state`.", type: "string", required: false, enum: ["draft","active","completed","archived"] },
  { key: "tags", option: "--tags <tags>", name: "tags", description: "Free labels a marketer groups campaigns by, as a list of words.", type: "any", required: false },
  { key: "utmCampaign", option: "--utm-campaign <utm-campaign>", name: "utm_campaign", description: "The value a tracked link carries as utm_campaign, lower case. Unique per tenant; an order arriving with it is credited to this campaign. Filter `?utm_campaign=` to resolve a campaign from a landing.", type: "string", required: false },
];
campaignsCampaigns
  .command(`update`)
  .description(`Correct a campaign`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--code <code>`, `The short identifier a marketer recognises the campaign by. Unique per tenant.`)
  .option(`--currency <currency>`, `The currency the budget and the revenue figures are stated in.`)
  .option(`--description <description>`, `What the campaign is for, in the marketer own words.`)
  .option(`--ends-at <ends-at>`, `When the window closes. Empty means open-ended. Never before \`starts_at\`.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--goal-metric <goal-metric>`, `The one figure the campaign is judged by: revenue, orders, redemptions, leads, subscriptions or clicks.`)
  .option(`--goal-value <goal-value>`, `The target for \`goal_metric\`. Needs a metric.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--name <name>`, `What the campaign is called, e.g. Black Week 2026.`)
  .option(`--owner-id <owner-id>`, `Who is responsible: a sales-rep code or a platform user.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--starts-at <starts-at>`, `When the campaign window opens. Empty means it runs from its release.`)
  .option(`--status <status>`, `What the marketer set: \`draft\`, \`active\` (released), \`completed\` or \`archived\`. What the campaign is doing right now also depends on its window — read \`effective_state\`.`)
  .option(`--tags <tags>`, `Free labels a marketer groups campaigns by, as a list of words.`)
  .option(`--utm-campaign <utm-campaign>`, `The value a tracked link carries as utm_campaign, lower case. Unique per tenant; an order arriving with it is credited to this campaign. Filter \`?utm_campaign=\` to resolve a campaign from a landing.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, currency, description, endsAt, externalId, externalRefs, goalMetric, goalValue, metadata, name, ownerId, sourceData, sourceSyncedAt, startsAt, status, tags, utmCampaign } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (endsAt !== undefined) {
          _payload[`ends_at`] = endsAt;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (goalMetric !== undefined) {
          _payload[`goal_metric`] = goalMetric;
        }
        if (goalValue !== undefined) {
          _payload[`goal_value`] = goalValue;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = sourceData;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (startsAt !== undefined) {
          _payload[`starts_at`] = startsAt;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (tags !== undefined) {
          _payload[`tags`] = tags;
        }
        if (utmCampaign !== undefined) {
          _payload[`utm_campaign`] = utmCampaign;
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
registerPromptSpecs(campaignsCampaigns.commands.at(-1)!, updateSpecs, { method: "put" });
const attachSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/campaigns", hasLimit: true } },
  { key: "adCampaignLinkId", option: "--ad-campaign-link-id <ad-campaign-link-id>", name: "ad_campaign_link_id", description: "Shorthand for an ad campaign link of the ads app.", type: "string", required: false },
  { key: "assetApp", option: "--asset-app <asset-app>", name: "asset_app", description: "The app that owns the asset.", type: "string", required: false, enum: ["promotions","mailings","journeys","forms","pages","ads"] },
  { key: "assetEntity", option: "--asset-entity <asset-entity>", name: "asset_entity", description: "The kind of record in that app. Defaults per app: promotions, mailings, journeys, forms, pages, ad_campaign_links.", type: "string", required: false },
  { key: "assetId", option: "--asset-id <asset-id>", name: "asset_id", description: "The asset id in its own app.", type: "string", required: false },
  { key: "formId", option: "--form-id <form-id>", name: "form_id", description: "Shorthand for a form.", type: "string", required: false },
  { key: "journeyId", option: "--journey-id <journey-id>", name: "journey_id", description: "Shorthand for an automation.", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "What to call the asset here. Defaults to its own name.", type: "string", required: false },
  { key: "libraryItemId", option: "--library-item-id <library-item-id>", name: "library_item_id", description: "Shorthand for a page library item, such as a pop-up.", type: "string", required: false },
  { key: "mailingId", option: "--mailing-id <mailing-id>", name: "mailing_id", description: "Shorthand for a marketing mail.", type: "string", required: false },
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "Shorthand for a page.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "Shorthand for a promotion.", type: "string", required: false },
];
campaignsCampaigns
  .command(`attach`)
  .description(`Claims a promotion, mailing, journey or form by writing the campaign id into its own campaign_ref through the owning app, and records the asset here. Pages and ad campaigns are recorded here only. Attaching what is already attached to this campaign answers the existing row.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--ad-campaign-link-id <ad-campaign-link-id>`, `Shorthand for an ad campaign link of the ads app.`)
  .option(`--asset-app <asset-app>`, `The app that owns the asset.`)
  .option(`--asset-entity <asset-entity>`, `The kind of record in that app. Defaults per app: promotions, mailings, journeys, forms, pages, ad_campaign_links.`)
  .option(`--asset-id <asset-id>`, `The asset id in its own app.`)
  .option(`--form-id <form-id>`, `Shorthand for a form.`)
  .option(`--journey-id <journey-id>`, `Shorthand for an automation.`)
  .option(`--label <label>`, `What to call the asset here. Defaults to its own name.`)
  .option(`--library-item-id <library-item-id>`, `Shorthand for a page library item, such as a pop-up.`)
  .option(`--mailing-id <mailing-id>`, `Shorthand for a marketing mail.`)
  .option(`--page-id <page-id>`, `Shorthand for a page.`)
  .option(`--promotion-id <promotion-id>`, `Shorthand for a promotion.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, adCampaignLinkId, assetApp, assetEntity, assetId, formId, journeyId, label, libraryItemId, mailingId, pageId, promotionId } = await promptForMissing(
          _options,
          attachSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns/{id}/attach`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (adCampaignLinkId !== undefined) {
          _payload[`ad_campaign_link_id`] = adCampaignLinkId;
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
        if (formId !== undefined) {
          _payload[`form_id`] = formId;
        }
        if (journeyId !== undefined) {
          _payload[`journey_id`] = journeyId;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (libraryItemId !== undefined) {
          _payload[`library_item_id`] = libraryItemId;
        }
        if (mailingId !== undefined) {
          _payload[`mailing_id`] = mailingId;
        }
        if (pageId !== undefined) {
          _payload[`page_id`] = pageId;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
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
registerPromptSpecs(campaignsCampaigns.commands.at(-1)!, attachSpecs, { method: "post" });
const detachSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/campaigns", hasLimit: true } },
  { key: "adCampaignLinkId", option: "--ad-campaign-link-id <ad-campaign-link-id>", name: "ad_campaign_link_id", description: "Shorthand for an ad campaign link of the ads app.", type: "string", required: false },
  { key: "assetApp", option: "--asset-app <asset-app>", name: "asset_app", description: "The app that owns the asset.", type: "string", required: false, enum: ["promotions","mailings","journeys","forms","pages","ads"] },
  { key: "assetEntity", option: "--asset-entity <asset-entity>", name: "asset_entity", description: "The kind of record in that app. Defaults per app: promotions, mailings, journeys, forms, pages, ad_campaign_links.", type: "string", required: false },
  { key: "assetId", option: "--asset-id <asset-id>", name: "asset_id", description: "The asset id in its own app.", type: "string", required: false },
  { key: "formId", option: "--form-id <form-id>", name: "form_id", description: "Shorthand for a form.", type: "string", required: false },
  { key: "journeyId", option: "--journey-id <journey-id>", name: "journey_id", description: "Shorthand for an automation.", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "What to call the asset here. Defaults to its own name.", type: "string", required: false },
  { key: "libraryItemId", option: "--library-item-id <library-item-id>", name: "library_item_id", description: "Shorthand for a page library item, such as a pop-up.", type: "string", required: false },
  { key: "mailingId", option: "--mailing-id <mailing-id>", name: "mailing_id", description: "Shorthand for a marketing mail.", type: "string", required: false },
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", description: "Shorthand for a page.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "Shorthand for a promotion.", type: "string", required: false },
];
campaignsCampaigns
  .command(`detach`)
  .description(`Clears the campaign_ref on the asset, if it still names this campaign, and removes the asset row.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--ad-campaign-link-id <ad-campaign-link-id>`, `Shorthand for an ad campaign link of the ads app.`)
  .option(`--asset-app <asset-app>`, `The app that owns the asset.`)
  .option(`--asset-entity <asset-entity>`, `The kind of record in that app. Defaults per app: promotions, mailings, journeys, forms, pages, ad_campaign_links.`)
  .option(`--asset-id <asset-id>`, `The asset id in its own app.`)
  .option(`--form-id <form-id>`, `Shorthand for a form.`)
  .option(`--journey-id <journey-id>`, `Shorthand for an automation.`)
  .option(`--label <label>`, `What to call the asset here. Defaults to its own name.`)
  .option(`--library-item-id <library-item-id>`, `Shorthand for a page library item, such as a pop-up.`)
  .option(`--mailing-id <mailing-id>`, `Shorthand for a marketing mail.`)
  .option(`--page-id <page-id>`, `Shorthand for a page.`)
  .option(`--promotion-id <promotion-id>`, `Shorthand for a promotion.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, adCampaignLinkId, assetApp, assetEntity, assetId, formId, journeyId, label, libraryItemId, mailingId, pageId, promotionId } = await promptForMissing(
          _options,
          detachSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns/{id}/detach`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (adCampaignLinkId !== undefined) {
          _payload[`ad_campaign_link_id`] = adCampaignLinkId;
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
        if (formId !== undefined) {
          _payload[`form_id`] = formId;
        }
        if (journeyId !== undefined) {
          _payload[`journey_id`] = journeyId;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (libraryItemId !== undefined) {
          _payload[`library_item_id`] = libraryItemId;
        }
        if (mailingId !== undefined) {
          _payload[`mailing_id`] = mailingId;
        }
        if (pageId !== undefined) {
          _payload[`page_id`] = pageId;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
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
registerPromptSpecs(campaignsCampaigns.commands.at(-1)!, detachSpecs, { method: "post" });
const linksSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/campaigns", hasLimit: true } },
  { key: "medium", option: "--medium <medium>", name: "medium", description: "The channel the link travels in, e.g. email, social, print.", type: "string", required: true },
  { key: "url", option: "--url <url>", name: "url", description: "The absolute http(s) address to tag.", type: "string", required: true },
  { key: "content", option: "--content <content>", name: "content", description: "Tells two links of one campaign apart.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Overrides the default source.", type: "string", required: false },
  { key: "term", option: "--term <term>", name: "term", description: "A paid search term.", type: "string", required: false },
];
campaignsCampaigns
  .command(`links`)
  .description(`Adds utm_source (default from the settings), utm_medium, utm_campaign and optionally utm_content and utm_term to a URL, replacing UTM values it already carried. A campaign without a UTM value gets its code slug the first time.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--medium <medium>`, `The channel the link travels in, e.g. email, social, print.`)
  .option(`--url <url>`, `The absolute http(s) address to tag.`)
  .option(`--content <content>`, `Tells two links of one campaign apart.`)
  .option(`--source <source>`, `Overrides the default source.`)
  .option(`--term <term>`, `A paid search term.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, medium, url, content, source, term } = await promptForMissing(
          _options,
          linksSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns/{id}/links`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (content !== undefined) {
          _payload[`content`] = content;
        }
        if (medium !== undefined) {
          _payload[`medium`] = medium;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (term !== undefined) {
          _payload[`term`] = term;
        }
        if (url !== undefined) {
          _payload[`url`] = url;
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
registerPromptSpecs(campaignsCampaigns.commands.at(-1)!, linksSpecs, { method: "post" });
const performanceSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/campaigns", hasLimit: true } },
  { key: "model", option: "--model <model>", name: "model", description: "Attribution model. Defaults to the tenant setting.", type: "string", required: false, enum: ["first_touch","last_touch"] },
];
campaignsCampaigns
  .command(`performance`)
  .description(`Revenue and orders under the chosen model, returns netted out; redemptions, clicks, impressions, subscriptions and leads; goal progress; budget planned and spent with return on ad spend; the same figures per attached asset. \`results\`, \`goal_rows\`, \`budget_rows\` and \`asset_rows\` carry the same figures as rows of label and value, worded and formatted in the caller language (Accept-Language; German unless English is asked for); \`days\` carries clicks, redemptions, sign-ups and credited orders per day.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--model <model>`, `Attribution model. Defaults to the tenant setting.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, model } = await promptForMissing(
          _options,
          performanceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns/{id}/performance`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsCampaigns.commands.at(-1)!, performanceSpecs, { method: "get" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/campaigns/campaigns", hasLimit: true } },
];
campaignsCampaigns
  .command(`restore`)
  .description(`Clears the trash marks on the campaign. Its parts were never touched, so they come back with it, in the state it was in. The same right as deleting.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          restoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/campaigns/campaigns/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(campaignsCampaigns.commands.at(-1)!, restoreSpecs, { method: "post" });
