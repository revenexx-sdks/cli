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

export const loyaltyTiers = new Command("loyalty-tiers")
  .description(
    commandDescriptions["loyaltyTiers"] ??
      `Tiers of a programme: a threshold in points or turnover, or a percentage of last year's turnover, a bonus percentage, a points multiplier and the perks a tier stands for. Perks are promotions with a loyalty_tier condition; a tier discounts nothing by itself.`,
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
  { key: "programId", option: "--program-id <program-id>", name: "program_id", description: "Keep only rows whose `program_id` equals this.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Keep only rows whose `code` equals this.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Keep only rows whose `position` equals this.", type: "string", required: false },
  { key: "thresholdKind", option: "--threshold-kind <threshold-kind>", name: "threshold_kind", description: "Keep only rows whose `threshold_kind` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Keep only rows whose `external_id` equals this.", type: "string", required: false },
  { key: "deletedBy", option: "--deleted-by <deleted-by>", name: "deleted_by", description: "Keep only rows whose `deleted_by` equals this.", type: "string", required: false },
  { key: "deletedById", option: "--deleted-by-id <deleted-by-id>", name: "deleted_by_id", description: "Keep only rows whose `deleted_by_id` equals this.", type: "string", required: false },
  { key: "trashBatch", option: "--trash-batch <trash-batch>", name: "trash_batch", description: "Keep only rows whose `trash_batch` equals this.", type: "string", required: false },
  { key: "purgeBlockedReason", option: "--purge-blocked-reason <purge-blocked-reason>", name: "purge_blocked_reason", description: "Keep only rows whose `purge_blocked_reason` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
loyaltyTiers
  .command(`list`)
  .description(`Filter \`?program_id=\` for one programme, \`?code=\` to find a tier by the code a promotion or an audience names.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--trashed <trashed>`, `\`exclude\` (default) leaves the trash out, \`only\` is the trash itself, \`include\` lists both.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--program-id <program-id>`, `Keep only rows whose \`program_id\` equals this.`)
  .option(`--code <code>`, `Keep only rows whose \`code\` equals this.`)
  .option(`--position <position>`, `Keep only rows whose \`position\` equals this.`)
  .option(`--threshold-kind <threshold-kind>`, `Keep only rows whose \`threshold_kind\` equals this.`)
  .option(`--active <active>`, `Keep only rows whose \`active\` equals this.`)
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
        const { limit, offset, order, trashed, id, programId, code, position, thresholdKind, active, externalId, deletedBy, deletedById, trashBatch, purgeBlockedReason, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/tiers`;
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
        if (programId !== undefined) {
          _payload[`program_id`] = programId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (thresholdKind !== undefined) {
          _payload[`threshold_kind`] = thresholdKind;
        }
        if (active !== undefined) {
          _payload[`active`] = active;
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
registerPromptSpecs(loyaltyTiers.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The tier code, unique within the programme. This is what a promotion condition and an audience rule name.", type: "string", required: true },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "What it is called, as `{ de, en }`. A bare string is taken for both.", type: "any", required: true },
  { key: "programId", option: "--program-id <program-id>", name: "program_id", description: "The programme this row belongs to.", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and is not offered.", type: "boolean", required: false },
  { key: "bonusPercent", option: "--bonus-percent <bonus-percent>", name: "bonus_percent", description: "Turnover bonus: the percentage of the whole year turnover paid at this tier. Not cumulative.", type: "number", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "perks", option: "--perks <perks>", name: "perks", description: "What the tier stands for, as a list of `{ de, en }` texts the storefront shows. The perk itself is a promotion.", type: "any", required: false },
  { key: "pointsMultiplier", option: "--points-multiplier <points-multiplier>", name: "points_multiplier", description: "Points programme: earnings are multiplied by this while a member holds the tier.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Order among tiers with the same threshold.", type: "integer", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "thresholdKind", option: "--threshold-kind <threshold-kind>", name: "threshold_kind", description: "`absolute`: points earned in the period, or turnover in the programme currency. `relative_to_base`: a percentage of an agreement base turnover (100 = last year reached).", type: "string", required: false, enum: ["absolute","relative_to_base"] },
  { key: "thresholdValue", option: "--threshold-value <threshold-value>", name: "threshold_value", description: "The threshold. 0 makes an entry tier every member holds.", type: "number", required: false },
];
loyaltyTiers
  .command(`create`)
  .description(`Add a tier to a programme`)
  .option(`--code <code>`, `The tier code, unique within the programme. This is what a promotion condition and an audience rule name.`)
  .option(`--labels <labels>`, `What it is called, as \`{ de, en }\`. A bare string is taken for both.`)
  .option(`--program-id <program-id>`, `The programme this row belongs to.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and is not offered.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--bonus-percent <bonus-percent>`, `Turnover bonus: the percentage of the whole year turnover paid at this tier. Not cumulative.`, parseInteger)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--perks <perks>`, `What the tier stands for, as a list of \`{ de, en }\` texts the storefront shows. The perk itself is a promotion.`)
  .option(`--points-multiplier <points-multiplier>`, `Points programme: earnings are multiplied by this while a member holds the tier.`, parseInteger)
  .option(`--position <position>`, `Order among tiers with the same threshold.`, parseInteger)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--threshold-kind <threshold-kind>`, `\`absolute\`: points earned in the period, or turnover in the programme currency. \`relative_to_base\`: a percentage of an agreement base turnover (100 = last year reached).`)
  .option(`--threshold-value <threshold-value>`, `The threshold. 0 makes an entry tier every member holds.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, labels, programId, active, bonusPercent, externalId, externalRefs, metadata, perks, pointsMultiplier, position, sourceData, sourceSyncedAt, thresholdKind, thresholdValue } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/tiers`;
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
        if (bonusPercent !== undefined) {
          _payload[`bonus_percent`] = bonusPercent;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (perks !== undefined) {
          _payload[`perks`] = perks;
        }
        if (pointsMultiplier !== undefined) {
          _payload[`points_multiplier`] = pointsMultiplier;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (programId !== undefined) {
          _payload[`program_id`] = programId;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = sourceData;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (thresholdKind !== undefined) {
          _payload[`threshold_kind`] = thresholdKind;
        }
        if (thresholdValue !== undefined) {
          _payload[`threshold_value`] = thresholdValue;
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
registerPromptSpecs(loyaltyTiers.commands.at(-1)!, createSpecs, { method: "post" });
loyaltyTiers
  .command(`empty-trash`)
  .description(`Every tier in the trash is deleted for good on its own terms. One that something still blocks stays in the trash and is named with its reason, so a partial success says exactly what remained. Not for a storefront contact.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/tiers/trash/empty`;
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
loyaltyTiers
  .command(`purge`)
  .description(`What the nightly purge does, callable by hand: every tier in the trash for longer than the tenant trash retention (90 days unless the tenant set another) is deleted for good through the same rules as a second delete. A blocked one stays and carries its reason. When the retention cannot be read, nothing is deleted. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/tiers/trash/purge`;
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
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/tiers", hasLimit: true } },
];
loyaltyTiers
  .command(`delete`)
  .description(`The first DELETE moves the tier into the trash: it stays, with everything hanging off it, and counts nowhere until it is restored. A tier active members hold is refused (\`trash_blocked\`, blocker \`tier_in_use\`). Restoring waits for its programme to be restored (\`parent_in_trash\`). A DELETE on a tier already in the trash deletes it for good — refused while something still needs it, and not for a storefront contact.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`loyalty-tiers delete`);
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/tiers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyTiers.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/tiers", hasLimit: true } },
];
loyaltyTiers
  .command(`get`)
  .description(`Read one tier`)
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
        const _apiPath = `/loyalty/tiers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyTiers.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/tiers", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and is not offered.", type: "boolean", required: false },
  { key: "bonusPercent", option: "--bonus-percent <bonus-percent>", name: "bonus_percent", description: "Turnover bonus: the percentage of the whole year turnover paid at this tier. Not cumulative.", type: "number", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "The tier code, unique within the programme. This is what a promotion condition and an audience rule name.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "What it is called, as `{ de, en }`. A bare string is taken for both.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "perks", option: "--perks <perks>", name: "perks", description: "What the tier stands for, as a list of `{ de, en }` texts the storefront shows. The perk itself is a promotion.", type: "any", required: false },
  { key: "pointsMultiplier", option: "--points-multiplier <points-multiplier>", name: "points_multiplier", description: "Points programme: earnings are multiplied by this while a member holds the tier.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Order among tiers with the same threshold.", type: "integer", required: false },
  { key: "programId", option: "--program-id <program-id>", name: "program_id", description: "The programme this row belongs to.", type: "string", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "thresholdKind", option: "--threshold-kind <threshold-kind>", name: "threshold_kind", description: "`absolute`: points earned in the period, or turnover in the programme currency. `relative_to_base`: a percentage of an agreement base turnover (100 = last year reached).", type: "string", required: false, enum: ["absolute","relative_to_base"] },
  { key: "thresholdValue", option: "--threshold-value <threshold-value>", name: "threshold_value", description: "The threshold. 0 makes an entry tier every member holds.", type: "number", required: false },
];
loyaltyTiers
  .command(`update`)
  .description(`Correct a tier`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and is not offered.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--bonus-percent <bonus-percent>`, `Turnover bonus: the percentage of the whole year turnover paid at this tier. Not cumulative.`, parseInteger)
  .option(`--code <code>`, `The tier code, unique within the programme. This is what a promotion condition and an audience rule name.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--labels <labels>`, `What it is called, as \`{ de, en }\`. A bare string is taken for both.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--perks <perks>`, `What the tier stands for, as a list of \`{ de, en }\` texts the storefront shows. The perk itself is a promotion.`)
  .option(`--points-multiplier <points-multiplier>`, `Points programme: earnings are multiplied by this while a member holds the tier.`, parseInteger)
  .option(`--position <position>`, `Order among tiers with the same threshold.`, parseInteger)
  .option(`--program-id <program-id>`, `The programme this row belongs to.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--threshold-kind <threshold-kind>`, `\`absolute\`: points earned in the period, or turnover in the programme currency. \`relative_to_base\`: a percentage of an agreement base turnover (100 = last year reached).`)
  .option(`--threshold-value <threshold-value>`, `The threshold. 0 makes an entry tier every member holds.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, bonusPercent, code, externalId, externalRefs, labels, metadata, perks, pointsMultiplier, position, programId, sourceData, sourceSyncedAt, thresholdKind, thresholdValue } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/tiers/{id}`.replace(`{id}`, id);
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
        if (bonusPercent !== undefined) {
          _payload[`bonus_percent`] = bonusPercent;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (perks !== undefined) {
          _payload[`perks`] = perks;
        }
        if (pointsMultiplier !== undefined) {
          _payload[`points_multiplier`] = pointsMultiplier;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (programId !== undefined) {
          _payload[`program_id`] = programId;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = sourceData;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (thresholdKind !== undefined) {
          _payload[`threshold_kind`] = thresholdKind;
        }
        if (thresholdValue !== undefined) {
          _payload[`threshold_value`] = thresholdValue;
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
registerPromptSpecs(loyaltyTiers.commands.at(-1)!, updateSpecs, { method: "put" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/tiers", hasLimit: true } },
];
loyaltyTiers
  .command(`restore`)
  .description(`Clears the trash marks on the tier. Its parts were never touched, so they come back with it, in the state it was in. The same right as deleting.`)
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
        const _apiPath = `/loyalty/tiers/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyTiers.commands.at(-1)!, restoreSpecs, { method: "post" });
