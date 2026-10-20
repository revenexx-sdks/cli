import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const loyaltyPrograms = new Command("loyalty-programs")
  .description(
    commandDescriptions["loyaltyPrograms"] ??
      `Loyalty programmes: points per order for a person or a company, or a yearly turnover bonus for business accounts. Kind and member are fixed when a programme is created.`,
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
  { key: "description", option: "--description <description>", name: "description", description: "Keep only rows whose `description` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "holder", option: "--holder <holder>", name: "holder", description: "Keep only rows whose `holder` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "period", option: "--period <period>", name: "period", description: "Keep only rows whose `period` equals this.", type: "string", required: false },
  { key: "autoEnroll", option: "--auto-enroll <auto-enroll>", name: "auto_enroll", description: "Keep only rows whose `auto_enroll` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "memberCount", option: "--member-count <member-count>", name: "member_count", description: "Keep only rows whose `member_count` equals this.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Keep only rows whose `external_id` equals this.", type: "string", required: false },
  { key: "deletedBy", option: "--deleted-by <deleted-by>", name: "deleted_by", description: "Keep only rows whose `deleted_by` equals this.", type: "string", required: false },
  { key: "deletedById", option: "--deleted-by-id <deleted-by-id>", name: "deleted_by_id", description: "Keep only rows whose `deleted_by_id` equals this.", type: "string", required: false },
  { key: "trashBatch", option: "--trash-batch <trash-batch>", name: "trash_batch", description: "Keep only rows whose `trash_batch` equals this.", type: "string", required: false },
  { key: "purgeBlockedReason", option: "--purge-blocked-reason <purge-blocked-reason>", name: "purge_blocked_reason", description: "Keep only rows whose `purge_blocked_reason` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
loyaltyPrograms
  .command(`list`)
  .description(`Every programme of this tenant. Filter \`?kind=turnover_bonus\` for the B2B bonus programmes, \`?active=true\` for those running.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--trashed <trashed>`, `\`exclude\` (default) leaves the trash out, \`only\` is the trash itself, \`include\` lists both.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--code <code>`, `Keep only rows whose \`code\` equals this.`)
  .option(`--description <description>`, `Keep only rows whose \`description\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--holder <holder>`, `Keep only rows whose \`holder\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(`--period <period>`, `Keep only rows whose \`period\` equals this.`)
  .option(`--auto-enroll <auto-enroll>`, `Keep only rows whose \`auto_enroll\` equals this.`)
  .option(`--active <active>`, `Keep only rows whose \`active\` equals this.`)
  .option(`--member-count <member-count>`, `Keep only rows whose \`member_count\` equals this.`)
  .option(`--external-id <external-id>`, `Keep only rows whose \`external_id\` equals this.`)
  .option(`--deleted-by <deleted-by>`, `Keep only rows whose \`deleted_by\` equals this.`)
  .option(`--deleted-by-id <deleted-by-id>`, `Keep only rows whose \`deleted_by_id\` equals this.`)
  .option(`--trash-batch <trash-batch>`, `Keep only rows whose \`trash_batch\` equals this.`)
  .option(`--purge-blocked-reason <purge-blocked-reason>`, `Keep only rows whose \`purge_blocked_reason\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, trashed, id, code, description, kind, holder, currency, period, autoEnroll, active, memberCount, externalId, deletedBy, deletedById, trashBatch, purgeBlockedReason, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/programs`;
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
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (holder !== undefined) {
          _payload[`holder`] = holder;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (period !== undefined) {
          _payload[`period`] = period;
        }
        if (autoEnroll !== undefined) {
          _payload[`auto_enroll`] = autoEnroll;
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (memberCount !== undefined) {
          _payload[`member_count`] = memberCount;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (deletedBy !== undefined) {
          _payload[`deleted_by`] = deletedBy;
        }
        if (deletedById !== undefined) {
          _payload[`deleted_by_id`] = deletedById;
        }
        if (trashBatch !== undefined) {
          _payload[`trash_batch`] = trashBatch;
        }
        if (purgeBlockedReason !== undefined) {
          _payload[`purge_blocked_reason`] = purgeBlockedReason;
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
registerPromptSpecs(loyaltyPrograms.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The short identifier of the programme, unique per tenant, e.g. premium or club.", type: "string", required: true },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`points` (points per order, rewards) or `turnover_bonus` (a yearly bonus agreement per company). Fixed once created.", type: "string", required: true, enum: ["points","turnover_bonus"] },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "What it is called, as `{ de, en }`. A bare string is taken for both.", type: "any", required: true },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and is not offered.", type: "boolean", required: false },
  { key: "autoEnroll", option: "--auto-enroll <auto-enroll>", name: "auto_enroll", description: "When on, a customer becomes a member with their first credited order (and a contact on registration), without being enrolled by hand.", type: "boolean", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency thresholds and bonuses are stated in.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What it is, in the merchant own words.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "holder", option: "--holder <holder>", name: "holder", description: "Who collects: `contact` (one person) or `organization` (a company whose orders all count together). A turnover bonus is always `organization`. Fixed once created.", type: "string", required: false, enum: ["contact","organization"] },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "period", option: "--period <period>", name: "period", description: "The window tiers are measured over: `calendar_year` or `rolling_12m`. A turnover bonus runs per calendar year.", type: "string", required: false, enum: ["calendar_year","rolling_12m"] },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
];
loyaltyPrograms
  .command(`create`)
  .description(`Create a loyalty programme`)
  .option(`--code <code>`, `The short identifier of the programme, unique per tenant, e.g. premium or club.`)
  .option(`--kind <kind>`, `\`points\` (points per order, rewards) or \`turnover_bonus\` (a yearly bonus agreement per company). Fixed once created.`)
  .option(`--labels <labels>`, `What it is called, as \`{ de, en }\`. A bare string is taken for both.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and is not offered.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--auto-enroll [value]`,
    `When on, a customer becomes a member with their first credited order (and a contact on registration), without being enrolled by hand.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--currency <currency>`, `The currency thresholds and bonuses are stated in.`)
  .option(`--description <description>`, `What it is, in the merchant own words.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--holder <holder>`, `Who collects: \`contact\` (one person) or \`organization\` (a company whose orders all count together). A turnover bonus is always \`organization\`. Fixed once created.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--period <period>`, `The window tiers are measured over: \`calendar_year\` or \`rolling_12m\`. A turnover bonus runs per calendar year.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, kind, labels, active, autoEnroll, currency, description, externalId, externalRefs, holder, metadata, period, sourceData, sourceSyncedAt } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/programs`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (autoEnroll !== undefined) {
          _payload[`auto_enroll`] = autoEnroll;
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
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (holder !== undefined) {
          _payload[`holder`] = holder;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (period !== undefined) {
          _payload[`period`] = period;
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
registerPromptSpecs(loyaltyPrograms.commands.at(-1)!, createSpecs, { method: "post" });
loyaltyPrograms
  .command(`empty-trash`)
  .description(`Every programme in the trash is deleted for good on its own terms. One that something still blocks stays in the trash and is named with its reason, so a partial success says exactly what remained. Not for a storefront contact.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/programs/trash/empty`;
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
loyaltyPrograms
  .command(`purge`)
  .description(`What the nightly purge does, callable by hand: every programme in the trash for longer than the tenant trash retention (90 days unless the tenant set another) is deleted for good through the same rules as a second delete. A blocked one stays and carries its reason. When the retention cannot be read, nothing is deleted. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/programs/trash/purge`;
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
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/programs", hasLimit: true } },
];
loyaltyPrograms
  .command(`delete`)
  .description(`The first DELETE moves the programme into the trash: it stays, with everything hanging off it, and counts nowhere until it is restored. A programme with members or agreements is refused (\`trash_blocked\`, blocker \`has_members\`) — deactivate it instead. Its tiers and rewards go into the trash with it and come back with it. A DELETE on a programme already in the trash deletes it for good — refused while something still needs it, and not for a storefront contact.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`loyalty-programs delete`);
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/programs/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyPrograms.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/programs", hasLimit: true } },
];
loyaltyPrograms
  .command(`get`)
  .description(`Read one programme`)
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
        const _apiPath = `/loyalty/programs/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyPrograms.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/programs", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and is not offered.", type: "boolean", required: false },
  { key: "autoEnroll", option: "--auto-enroll <auto-enroll>", name: "auto_enroll", description: "When on, a customer becomes a member with their first credited order (and a contact on registration), without being enrolled by hand.", type: "boolean", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "The short identifier of the programme, unique per tenant, e.g. premium or club.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency thresholds and bonuses are stated in.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What it is, in the merchant own words.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "holder", option: "--holder <holder>", name: "holder", description: "Who collects: `contact` (one person) or `organization` (a company whose orders all count together). A turnover bonus is always `organization`. Fixed once created.", type: "string", required: false, enum: ["contact","organization"] },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`points` (points per order, rewards) or `turnover_bonus` (a yearly bonus agreement per company). Fixed once created.", type: "string", required: false, enum: ["points","turnover_bonus"] },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "What it is called, as `{ de, en }`. A bare string is taken for both.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "period", option: "--period <period>", name: "period", description: "The window tiers are measured over: `calendar_year` or `rolling_12m`. A turnover bonus runs per calendar year.", type: "string", required: false, enum: ["calendar_year","rolling_12m"] },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
];
loyaltyPrograms
  .command(`update`)
  .description(`Correct a programme`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and is not offered.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--auto-enroll [value]`,
    `When on, a customer becomes a member with their first credited order (and a contact on registration), without being enrolled by hand.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--code <code>`, `The short identifier of the programme, unique per tenant, e.g. premium or club.`)
  .option(`--currency <currency>`, `The currency thresholds and bonuses are stated in.`)
  .option(`--description <description>`, `What it is, in the merchant own words.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--holder <holder>`, `Who collects: \`contact\` (one person) or \`organization\` (a company whose orders all count together). A turnover bonus is always \`organization\`. Fixed once created.`)
  .option(`--kind <kind>`, `\`points\` (points per order, rewards) or \`turnover_bonus\` (a yearly bonus agreement per company). Fixed once created.`)
  .option(`--labels <labels>`, `What it is called, as \`{ de, en }\`. A bare string is taken for both.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--period <period>`, `The window tiers are measured over: \`calendar_year\` or \`rolling_12m\`. A turnover bonus runs per calendar year.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, autoEnroll, code, currency, description, externalId, externalRefs, holder, kind, labels, metadata, period, sourceData, sourceSyncedAt } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/programs/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (autoEnroll !== undefined) {
          _payload[`auto_enroll`] = autoEnroll;
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
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (holder !== undefined) {
          _payload[`holder`] = holder;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (period !== undefined) {
          _payload[`period`] = period;
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
registerPromptSpecs(loyaltyPrograms.commands.at(-1)!, updateSpecs, { method: "put" });
const figuresSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/programs", hasLimit: true } },
];
loyaltyPrograms
  .command(`figures`)
  .description(`Active members per tier, the highest tier first and members without a tier last, each with its share; the total is a \`footer\` row. No active member answers no rows.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          figuresSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/programs/{id}/figures`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyPrograms.commands.at(-1)!, figuresSpecs, { method: "get" });
const openPeriodSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/programs", hasLimit: true } },
  { key: "period", option: "--period <period>", name: "period", description: "The calendar year, e.g. 2027.", type: "string", required: false },
];
loyaltyPrograms
  .command(`open-period`)
  .description(`Opens one agreement per active member for the year (default: this year), each with its base derived from last year. Members who already have one keep it.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--period <period>`, `The calendar year, e.g. 2027.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, period } = await promptForMissing(
          _options,
          openPeriodSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/programs/{id}/open-period`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (period !== undefined) {
          _payload[`period`] = period;
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
registerPromptSpecs(loyaltyPrograms.commands.at(-1)!, openPeriodSpecs, { method: "post" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/programs", hasLimit: true } },
];
loyaltyPrograms
  .command(`restore`)
  .description(`Clears the trash marks on the programme. Its parts were never touched, so they come back with it, in the state it was in. The same right as deleting.`)
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
        const _apiPath = `/loyalty/programs/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyPrograms.commands.at(-1)!, restoreSpecs, { method: "post" });
