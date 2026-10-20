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

export const loyaltyRewards = new Command("loyalty-rewards")
  .description(
    commandDescriptions["loyaltyRewards"] ??
      `Rewards bought with points. Each draws a single-use voucher for the member from a voucher series of a promotion; the promotion decides what it is worth.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const redemptionsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "membershipId", option: "--membership-id <membership-id>", name: "membership_id", description: "Keep only rows whose `membership_id` equals this.", type: "string", required: false },
  { key: "rewardId", option: "--reward-id <reward-id>", name: "reward_id", description: "Keep only rows whose `reward_id` equals this.", type: "string", required: false },
  { key: "points", option: "--points <points>", name: "points", description: "Keep only rows whose `points` equals this.", type: "string", required: false },
  { key: "voucherCode", option: "--voucher-code <voucher-code>", name: "voucher_code", description: "Keep only rows whose `voucher_code` equals this.", type: "string", required: false },
  { key: "ledgerEntryId", option: "--ledger-entry-id <ledger-entry-id>", name: "ledger_entry_id", description: "Keep only rows whose `ledger_entry_id` equals this.", type: "string", required: false },
  { key: "requestKey", option: "--request-key <request-key>", name: "request_key", description: "Keep only rows whose `request_key` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "usedOrderId", option: "--used-order-id <used-order-id>", name: "used_order_id", description: "Keep only rows whose `used_order_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
loyaltyRewards
  .command(`redemptions-list`)
  .description(`Filter \`?membership_id=\`, \`?reward_id=\`, \`?state=\`. Read-only.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--membership-id <membership-id>`, `Keep only rows whose \`membership_id\` equals this.`)
  .option(`--reward-id <reward-id>`, `Keep only rows whose \`reward_id\` equals this.`)
  .option(`--points <points>`, `Keep only rows whose \`points\` equals this.`)
  .option(`--voucher-code <voucher-code>`, `Keep only rows whose \`voucher_code\` equals this.`)
  .option(`--ledger-entry-id <ledger-entry-id>`, `Keep only rows whose \`ledger_entry_id\` equals this.`)
  .option(`--request-key <request-key>`, `Keep only rows whose \`request_key\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--used-order-id <used-order-id>`, `Keep only rows whose \`used_order_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, membershipId, rewardId, points, voucherCode, ledgerEntryId, requestKey, state, usedOrderId, filter } = await promptForMissing(
          _options,
          redemptionsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/reward-redemptions`;
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
        if (membershipId !== undefined) {
          _payload[`membership_id`] = membershipId;
        }
        if (rewardId !== undefined) {
          _payload[`reward_id`] = rewardId;
        }
        if (points !== undefined) {
          _payload[`points`] = points;
        }
        if (voucherCode !== undefined) {
          _payload[`voucher_code`] = voucherCode;
        }
        if (ledgerEntryId !== undefined) {
          _payload[`ledger_entry_id`] = ledgerEntryId;
        }
        if (requestKey !== undefined) {
          _payload[`request_key`] = requestKey;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (usedOrderId !== undefined) {
          _payload[`used_order_id`] = usedOrderId;
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
registerPromptSpecs(loyaltyRewards.commands.at(-1)!, redemptionsListSpecs, { method: "get" });
const redemptionsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/reward-redemptions", hasLimit: true } },
];
loyaltyRewards
  .command(`redemptions-get`)
  .description(`Read one redeemed reward`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          redemptionsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/reward-redemptions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyRewards.commands.at(-1)!, redemptionsGetSpecs, { method: "get" });
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "trashed", option: "--trashed <trashed>", name: "trashed", description: "`exclude` (default) leaves the trash out, `only` is the trash itself, `include` lists both.", type: "string", required: false, enum: ["exclude","only","include"] },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "programId", option: "--program-id <program-id>", name: "program_id", description: "Keep only rows whose `program_id` equals this.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Keep only rows whose `code` equals this.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Keep only rows whose `description` equals this.", type: "string", required: false },
  { key: "pointsCost", option: "--points-cost <points-cost>", name: "points_cost", description: "Keep only rows whose `points_cost` equals this.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "Keep only rows whose `promotion_id` equals this.", type: "string", required: false },
  { key: "voucherBatchId", option: "--voucher-batch-id <voucher-batch-id>", name: "voucher_batch_id", description: "Keep only rows whose `voucher_batch_id` equals this.", type: "string", required: false },
  { key: "minTierId", option: "--min-tier-id <min-tier-id>", name: "min_tier_id", description: "Keep only rows whose `min_tier_id` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "redeemedCount", option: "--redeemed-count <redeemed-count>", name: "redeemed_count", description: "Keep only rows whose `redeemed_count` equals this.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Keep only rows whose `external_id` equals this.", type: "string", required: false },
  { key: "deletedBy", option: "--deleted-by <deleted-by>", name: "deleted_by", description: "Keep only rows whose `deleted_by` equals this.", type: "string", required: false },
  { key: "deletedById", option: "--deleted-by-id <deleted-by-id>", name: "deleted_by_id", description: "Keep only rows whose `deleted_by_id` equals this.", type: "string", required: false },
  { key: "trashBatch", option: "--trash-batch <trash-batch>", name: "trash_batch", description: "Keep only rows whose `trash_batch` equals this.", type: "string", required: false },
  { key: "purgeBlockedReason", option: "--purge-blocked-reason <purge-blocked-reason>", name: "purge_blocked_reason", description: "Keep only rows whose `purge_blocked_reason` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
loyaltyRewards
  .command(`list`)
  .description(`Filter \`?program_id=\`, \`?active=true\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--trashed <trashed>`, `\`exclude\` (default) leaves the trash out, \`only\` is the trash itself, \`include\` lists both.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--program-id <program-id>`, `Keep only rows whose \`program_id\` equals this.`)
  .option(`--code <code>`, `Keep only rows whose \`code\` equals this.`)
  .option(`--description <description>`, `Keep only rows whose \`description\` equals this.`)
  .option(`--points-cost <points-cost>`, `Keep only rows whose \`points_cost\` equals this.`)
  .option(`--promotion-id <promotion-id>`, `Keep only rows whose \`promotion_id\` equals this.`)
  .option(`--voucher-batch-id <voucher-batch-id>`, `Keep only rows whose \`voucher_batch_id\` equals this.`)
  .option(`--min-tier-id <min-tier-id>`, `Keep only rows whose \`min_tier_id\` equals this.`)
  .option(`--active <active>`, `Keep only rows whose \`active\` equals this.`)
  .option(`--redeemed-count <redeemed-count>`, `Keep only rows whose \`redeemed_count\` equals this.`)
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
        const { limit, offset, order, trashed, id, programId, code, description, pointsCost, promotionId, voucherBatchId, minTierId, active, redeemedCount, externalId, deletedBy, deletedById, trashBatch, purgeBlockedReason, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/rewards`;
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
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (pointsCost !== undefined) {
          _payload[`points_cost`] = pointsCost;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (voucherBatchId !== undefined) {
          _payload[`voucher_batch_id`] = voucherBatchId;
        }
        if (minTierId !== undefined) {
          _payload[`min_tier_id`] = minTierId;
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (redeemedCount !== undefined) {
          _payload[`redeemed_count`] = redeemedCount;
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
registerPromptSpecs(loyaltyRewards.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The reward code, unique within the programme.", type: "string", required: true },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "What it is called, as `{ de, en }`. A bare string is taken for both.", type: "any", required: true },
  { key: "pointsCost", option: "--points-cost <points-cost>", name: "points_cost", description: "How many points the reward costs.", type: "integer", required: true },
  { key: "programId", option: "--program-id <program-id>", name: "program_id", description: "The programme this row belongs to.", type: "string", required: true },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion whose voucher the member receives.", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and is not offered.", type: "boolean", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What it is, in the merchant own words.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "minTierId", option: "--min-tier-id <min-tier-id>", name: "min_tier_id", description: "The lowest tier allowed to redeem it. Empty: every member.", type: "string", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "voucherBatchId", option: "--voucher-batch-id <voucher-batch-id>", name: "voucher_batch_id", description: "The voucher series the code is drawn from. Empty: the oldest series of the promotion that can still issue codes.", type: "string", required: false },
];
loyaltyRewards
  .command(`create`)
  .description(`Add a reward to a points programme`)
  .option(`--code <code>`, `The reward code, unique within the programme.`)
  .option(`--labels <labels>`, `What it is called, as \`{ de, en }\`. A bare string is taken for both.`)
  .option(`--points-cost <points-cost>`, `How many points the reward costs.`, parseInteger)
  .option(`--program-id <program-id>`, `The programme this row belongs to.`)
  .option(`--promotion-id <promotion-id>`, `The promotion whose voucher the member receives.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and is not offered.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--description <description>`, `What it is, in the merchant own words.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--min-tier-id <min-tier-id>`, `The lowest tier allowed to redeem it. Empty: every member.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--voucher-batch-id <voucher-batch-id>`, `The voucher series the code is drawn from. Empty: the oldest series of the promotion that can still issue codes.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, labels, pointsCost, programId, promotionId, active, description, externalId, externalRefs, metadata, minTierId, sourceData, sourceSyncedAt, voucherBatchId } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/rewards`;
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
        if (code !== undefined) {
          _payload[`code`] = code;
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
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (minTierId !== undefined) {
          _payload[`min_tier_id`] = minTierId;
        }
        if (pointsCost !== undefined) {
          _payload[`points_cost`] = pointsCost;
        }
        if (programId !== undefined) {
          _payload[`program_id`] = programId;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = sourceData;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (voucherBatchId !== undefined) {
          _payload[`voucher_batch_id`] = voucherBatchId;
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
registerPromptSpecs(loyaltyRewards.commands.at(-1)!, createSpecs, { method: "post" });
loyaltyRewards
  .command(`empty-trash`)
  .description(`Every reward in the trash is deleted for good on its own terms. One that something still blocks stays in the trash and is named with its reason, so a partial success says exactly what remained. Not for a storefront contact.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/rewards/trash/empty`;
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
loyaltyRewards
  .command(`purge`)
  .description(`What the nightly purge does, callable by hand: every reward in the trash for longer than the tenant trash retention (90 days unless the tenant set another) is deleted for good through the same rules as a second delete. A blocked one stays and carries its reason. When the retention cannot be read, nothing is deleted. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/rewards/trash/purge`;
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
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/rewards", hasLimit: true } },
];
loyaltyRewards
  .command(`delete`)
  .description(`The first DELETE moves the reward into the trash: it stays, with everything hanging off it, and counts nowhere until it is restored. A redeemed reward is refused (\`trash_blocked\`, blocker \`redeemed\`) — deactivate it instead. Restoring waits for its programme to be restored (\`parent_in_trash\`). A DELETE on a reward already in the trash deletes it for good — refused while something still needs it, and not for a storefront contact.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`loyalty-rewards delete`);
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/rewards/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyRewards.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/rewards", hasLimit: true } },
];
loyaltyRewards
  .command(`get`)
  .description(`Read one reward`)
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
        const _apiPath = `/loyalty/rewards/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyRewards.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/rewards", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", description: "Switched on. A switched-off row stays for its history and is not offered.", type: "boolean", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "The reward code, unique within the programme.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What it is, in the merchant own words.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "What it is called, as `{ de, en }`. A bare string is taken for both.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "minTierId", option: "--min-tier-id <min-tier-id>", name: "min_tier_id", description: "The lowest tier allowed to redeem it. Empty: every member.", type: "string", required: false },
  { key: "pointsCost", option: "--points-cost <points-cost>", name: "points_cost", description: "How many points the reward costs.", type: "integer", required: false },
  { key: "programId", option: "--program-id <program-id>", name: "program_id", description: "The programme this row belongs to.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "The promotion whose voucher the member receives.", type: "string", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "voucherBatchId", option: "--voucher-batch-id <voucher-batch-id>", name: "voucher_batch_id", description: "The voucher series the code is drawn from. Empty: the oldest series of the promotion that can still issue codes.", type: "string", required: false },
];
loyaltyRewards
  .command(`update`)
  .description(`Correct a reward`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(
    `--active [value]`,
    `Switched on. A switched-off row stays for its history and is not offered.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--code <code>`, `The reward code, unique within the programme.`)
  .option(`--description <description>`, `What it is, in the merchant own words.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--labels <labels>`, `What it is called, as \`{ de, en }\`. A bare string is taken for both.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--min-tier-id <min-tier-id>`, `The lowest tier allowed to redeem it. Empty: every member.`)
  .option(`--points-cost <points-cost>`, `How many points the reward costs.`, parseInteger)
  .option(`--program-id <program-id>`, `The programme this row belongs to.`)
  .option(`--promotion-id <promotion-id>`, `The promotion whose voucher the member receives.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--voucher-batch-id <voucher-batch-id>`, `The voucher series the code is drawn from. Empty: the oldest series of the promotion that can still issue codes.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, code, description, externalId, externalRefs, labels, metadata, minTierId, pointsCost, programId, promotionId, sourceData, sourceSyncedAt, voucherBatchId } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/rewards/{id}`.replace(`{id}`, id);
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
        if (code !== undefined) {
          _payload[`code`] = code;
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
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (minTierId !== undefined) {
          _payload[`min_tier_id`] = minTierId;
        }
        if (pointsCost !== undefined) {
          _payload[`points_cost`] = pointsCost;
        }
        if (programId !== undefined) {
          _payload[`program_id`] = programId;
        }
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = sourceData;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (voucherBatchId !== undefined) {
          _payload[`voucher_batch_id`] = voucherBatchId;
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
registerPromptSpecs(loyaltyRewards.commands.at(-1)!, updateSpecs, { method: "put" });
const redeemSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/rewards", hasLimit: true } },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The member, or for a company membership the person the voucher is for.", type: "string", required: false },
  { key: "key", option: "--key <key>", name: "key", type: "string", required: false },
  { key: "membershipId", option: "--membership-id <membership-id>", name: "membership_id", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
];
loyaltyRewards
  .command(`redeem`)
  .description(`Draws a single-use voucher for the member from promotions, then takes the points. No voucher, no points taken. A \`key\` makes a retry answer the first redemption.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--contact-id <contact-id>`, `The member, or for a company membership the person the voucher is for.`)
  .option(`--key <key>`, ``)
  .option(`--membership-id <membership-id>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId, key, membershipId, organizationId } = await promptForMissing(
          _options,
          redeemSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/rewards/{id}/redeem`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (membershipId !== undefined) {
          _payload[`membership_id`] = membershipId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
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
registerPromptSpecs(loyaltyRewards.commands.at(-1)!, redeemSpecs, { method: "post" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/rewards", hasLimit: true } },
];
loyaltyRewards
  .command(`restore`)
  .description(`Clears the trash marks on the reward. Its parts were never touched, so they come back with it, in the state it was in. The same right as deleting.`)
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
        const _apiPath = `/loyalty/rewards/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyRewards.commands.at(-1)!, restoreSpecs, { method: "post" });
