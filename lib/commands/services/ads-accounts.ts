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

export const adsAccounts = new Command("ads-accounts")
  .description(
    commandDescriptions["adsAccounts"] ??
      `Ad accounts on Meta, Google Ads and LinkedIn, each backed by an Integration Studio connection. Platform and account id are fixed once added.`,
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
  { key: "platform", option: "--platform <platform>", name: "platform", description: "Keep only rows whose `platform` equals this.", type: "string", required: false },
  { key: "externalAccountId", option: "--external-account-id <external-account-id>", name: "external_account_id", description: "Keep only rows whose `external_account_id` equals this.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Keep only rows whose `name` equals this.", type: "string", required: false },
  { key: "connectionRef", option: "--connection-ref <connection-ref>", name: "connection_ref", description: "Keep only rows whose `connection_ref` equals this.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Keep only rows whose `status` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "lastError", option: "--last-error <last-error>", name: "last_error", description: "Keep only rows whose `last_error` equals this.", type: "string", required: false },
  { key: "clicksTotal", option: "--clicks-total <clicks-total>", name: "clicks_total", description: "Keep only rows whose `clicks_total` equals this.", type: "string", required: false },
  { key: "conversionsTotal", option: "--conversions-total <conversions-total>", name: "conversions_total", description: "Keep only rows whose `conversions_total` equals this.", type: "string", required: false },
  { key: "deletedBy", option: "--deleted-by <deleted-by>", name: "deleted_by", description: "Keep only rows whose `deleted_by` equals this.", type: "string", required: false },
  { key: "deletedById", option: "--deleted-by-id <deleted-by-id>", name: "deleted_by_id", description: "Keep only rows whose `deleted_by_id` equals this.", type: "string", required: false },
  { key: "trashBatch", option: "--trash-batch <trash-batch>", name: "trash_batch", description: "Keep only rows whose `trash_batch` equals this.", type: "string", required: false },
  { key: "purgeBlockedReason", option: "--purge-blocked-reason <purge-blocked-reason>", name: "purge_blocked_reason", description: "Keep only rows whose `purge_blocked_reason` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
adsAccounts
  .command(`list`)
  .description(`Every ad account, without the trash unless \`trashed\` asks for it. Filter \`?platform=\`, \`?status=connected\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--trashed <trashed>`, `\`exclude\` (default) leaves the trash out, \`only\` is the trash itself, \`include\` lists both.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--platform <platform>`, `Keep only rows whose \`platform\` equals this.`)
  .option(`--external-account-id <external-account-id>`, `Keep only rows whose \`external_account_id\` equals this.`)
  .option(`--name <name>`, `Keep only rows whose \`name\` equals this.`)
  .option(`--connection-ref <connection-ref>`, `Keep only rows whose \`connection_ref\` equals this.`)
  .option(`--status <status>`, `Keep only rows whose \`status\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(`--last-error <last-error>`, `Keep only rows whose \`last_error\` equals this.`)
  .option(`--clicks-total <clicks-total>`, `Keep only rows whose \`clicks_total\` equals this.`)
  .option(`--conversions-total <conversions-total>`, `Keep only rows whose \`conversions_total\` equals this.`)
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
        const { limit, offset, order, trashed, id, platform, externalAccountId, name, connectionRef, status, currency, lastError, clicksTotal, conversionsTotal, deletedBy, deletedById, trashBatch, purgeBlockedReason, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/accounts`;
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
        if (platform !== undefined) {
          _payload[`platform`] = platform;
        }
        if (externalAccountId !== undefined) {
          _payload[`external_account_id`] = externalAccountId;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (connectionRef !== undefined) {
          _payload[`connection_ref`] = connectionRef;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (lastError !== undefined) {
          _payload[`last_error`] = lastError;
        }
        if (clicksTotal !== undefined) {
          _payload[`clicks_total`] = clicksTotal;
        }
        if (conversionsTotal !== undefined) {
          _payload[`conversions_total`] = conversionsTotal;
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
registerPromptSpecs(adsAccounts.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "externalAccountId", option: "--external-account-id <external-account-id>", name: "external_account_id", description: "The account id on the platform (ad account, customer id, LinkedIn account).", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "What the merchant calls the account.", type: "string", required: true },
  { key: "platform", option: "--platform <platform>", name: "platform", description: "`meta`, `google_ads` or `linkedin`.", type: "string", required: true, enum: ["meta","google_ads","linkedin"] },
  { key: "clicksTotal", option: "--clicks-total <clicks-total>", name: "clicks_total", description: "All clicks the spend imports reported. Recounted with spend_total.", type: "integer", required: false },
  { key: "connectionRef", option: "--connection-ref <connection-ref>", name: "connection_ref", description: "The Integration Studio connection that holds the platform login. Without one the account is not connected.", type: "string", required: false },
  { key: "conversionValueTotal", option: "--conversion-value-total <conversion-value-total>", name: "conversion_value_total", description: "The value of those conversions in the account's currency. Recounted with spend_total.", type: "number", required: false },
  { key: "conversionsTotal", option: "--conversions-total <conversions-total>", name: "conversions_total", description: "Conversions recorded with consent — skipped ones not counted. Recounted with spend_total.", type: "integer", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Three-letter currency code, e.g. EUR.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "figuresAt", option: "--figures-at <figures-at>", name: "figures_at", description: "When the totals were last recounted.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "roas", option: "--roas <roas>", name: "roas", description: "conversion_value_total divided by spend_total, two decimals; empty while nothing was spent.", type: "number", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "spendTotal", option: "--spend-total <spend-total>", name: "spend_total", description: "All spend imported for the account, in its currency. Recounted by the hourly run and after each spend import; never written by a caller.", type: "number", required: false },
];
adsAccounts
  .command(`create`)
  .description(`Add an ad account`)
  .option(`--external-account-id <external-account-id>`, `The account id on the platform (ad account, customer id, LinkedIn account).`)
  .option(`--name <name>`, `What the merchant calls the account.`)
  .option(`--platform <platform>`, `\`meta\`, \`google_ads\` or \`linkedin\`.`)
  .option(`--clicks-total <clicks-total>`, `All clicks the spend imports reported. Recounted with spend_total.`, parseInteger)
  .option(`--connection-ref <connection-ref>`, `The Integration Studio connection that holds the platform login. Without one the account is not connected.`)
  .option(`--conversion-value-total <conversion-value-total>`, `The value of those conversions in the account's currency. Recounted with spend_total.`, parseInteger)
  .option(`--conversions-total <conversions-total>`, `Conversions recorded with consent — skipped ones not counted. Recounted with spend_total.`, parseInteger)
  .option(`--currency <currency>`, `Three-letter currency code, e.g. EUR.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--figures-at <figures-at>`, `When the totals were last recounted.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--roas <roas>`, `conversion_value_total divided by spend_total, two decimals; empty while nothing was spent.`, parseInteger)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--spend-total <spend-total>`, `All spend imported for the account, in its currency. Recounted by the hourly run and after each spend import; never written by a caller.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { externalAccountId, name, platform, clicksTotal, connectionRef, conversionValueTotal, conversionsTotal, currency, externalRefs, figuresAt, metadata, roas, sourceData, sourceSyncedAt, spendTotal } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/accounts`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (clicksTotal !== undefined) {
          _payload[`clicks_total`] = clicksTotal;
        }
        if (connectionRef !== undefined) {
          _payload[`connection_ref`] = connectionRef;
        }
        if (conversionValueTotal !== undefined) {
          _payload[`conversion_value_total`] = conversionValueTotal;
        }
        if (conversionsTotal !== undefined) {
          _payload[`conversions_total`] = conversionsTotal;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (externalAccountId !== undefined) {
          _payload[`external_account_id`] = externalAccountId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (figuresAt !== undefined) {
          _payload[`figures_at`] = figuresAt;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (platform !== undefined) {
          _payload[`platform`] = platform;
        }
        if (roas !== undefined) {
          _payload[`roas`] = roas;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = sourceData;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (spendTotal !== undefined) {
          _payload[`spend_total`] = spendTotal;
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
registerPromptSpecs(adsAccounts.commands.at(-1)!, createSpecs, { method: "post" });
adsAccounts
  .command(`empty-trash`)
  .description(`Every ad account in the trash is deleted for good on its own terms. One that something still blocks stays in the trash and is named with its reason, so a partial success says exactly what remained. Not for a storefront contact.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/ads/accounts/trash/empty`;
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
adsAccounts
  .command(`purge`)
  .description(`What the nightly purge does, callable by hand: every ad account in the trash for longer than the tenant trash retention (90 days unless the tenant set another) is deleted for good through the same rules as a second delete. A blocked one stays and carries its reason. When the retention cannot be read, nothing is deleted. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/ads/accounts/trash/purge`;
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
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/accounts", hasLimit: true } },
];
adsAccounts
  .command(`delete`)
  .description(`The first DELETE moves the ad account into the trash: it stays, with everything hanging off it, and counts nowhere until it is restored. Only an account that never booked spend or sent a conversion goes into the trash; one that did is refused (\`trash_blocked\`, blocker \`has_history\`) — disconnect it instead. Its audience syncs, conversion rules and campaign links stay untouched and do nothing while it is in the trash; they are deleted with it for good. A DELETE on a ad account already in the trash deletes it for good — refused while something still needs it, and not for a storefront contact.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`ads-accounts delete`);
        const _client = await sdkForProject();
        const _apiPath = `/ads/accounts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsAccounts.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/accounts", hasLimit: true } },
];
adsAccounts
  .command(`get`)
  .description(`Read one ad account`)
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
        const _apiPath = `/ads/accounts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(adsAccounts.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/accounts", hasLimit: true } },
  { key: "clicksTotal", option: "--clicks-total <clicks-total>", name: "clicks_total", description: "All clicks the spend imports reported. Recounted with spend_total.", type: "integer", required: false },
  { key: "connectionRef", option: "--connection-ref <connection-ref>", name: "connection_ref", description: "The Integration Studio connection that holds the platform login. Without one the account is not connected.", type: "string", required: false },
  { key: "conversionValueTotal", option: "--conversion-value-total <conversion-value-total>", name: "conversion_value_total", description: "The value of those conversions in the account's currency. Recounted with spend_total.", type: "number", required: false },
  { key: "conversionsTotal", option: "--conversions-total <conversions-total>", name: "conversions_total", description: "Conversions recorded with consent — skipped ones not counted. Recounted with spend_total.", type: "integer", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Three-letter currency code, e.g. EUR.", type: "string", required: false },
  { key: "externalAccountId", option: "--external-account-id <external-account-id>", name: "external_account_id", description: "The account id on the platform (ad account, customer id, LinkedIn account).", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "figuresAt", option: "--figures-at <figures-at>", name: "figures_at", description: "When the totals were last recounted.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the merchant calls the account.", type: "string", required: false },
  { key: "platform", option: "--platform <platform>", name: "platform", description: "`meta`, `google_ads` or `linkedin`.", type: "string", required: false, enum: ["meta","google_ads","linkedin"] },
  { key: "roas", option: "--roas <roas>", name: "roas", description: "conversion_value_total divided by spend_total, two decimals; empty while nothing was spent.", type: "number", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "spendTotal", option: "--spend-total <spend-total>", name: "spend_total", description: "All spend imported for the account, in its currency. Recounted by the hourly run and after each spend import; never written by a caller.", type: "number", required: false },
];
adsAccounts
  .command(`update`)
  .description(`Rename an ad account or change its connection`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--clicks-total <clicks-total>`, `All clicks the spend imports reported. Recounted with spend_total.`, parseInteger)
  .option(`--connection-ref <connection-ref>`, `The Integration Studio connection that holds the platform login. Without one the account is not connected.`)
  .option(`--conversion-value-total <conversion-value-total>`, `The value of those conversions in the account's currency. Recounted with spend_total.`, parseInteger)
  .option(`--conversions-total <conversions-total>`, `Conversions recorded with consent — skipped ones not counted. Recounted with spend_total.`, parseInteger)
  .option(`--currency <currency>`, `Three-letter currency code, e.g. EUR.`)
  .option(`--external-account-id <external-account-id>`, `The account id on the platform (ad account, customer id, LinkedIn account).`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--figures-at <figures-at>`, `When the totals were last recounted.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--name <name>`, `What the merchant calls the account.`)
  .option(`--platform <platform>`, `\`meta\`, \`google_ads\` or \`linkedin\`.`)
  .option(`--roas <roas>`, `conversion_value_total divided by spend_total, two decimals; empty while nothing was spent.`, parseInteger)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--spend-total <spend-total>`, `All spend imported for the account, in its currency. Recounted by the hourly run and after each spend import; never written by a caller.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, clicksTotal, connectionRef, conversionValueTotal, conversionsTotal, currency, externalAccountId, externalRefs, figuresAt, metadata, name, platform, roas, sourceData, sourceSyncedAt, spendTotal } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/accounts/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (clicksTotal !== undefined) {
          _payload[`clicks_total`] = clicksTotal;
        }
        if (connectionRef !== undefined) {
          _payload[`connection_ref`] = connectionRef;
        }
        if (conversionValueTotal !== undefined) {
          _payload[`conversion_value_total`] = conversionValueTotal;
        }
        if (conversionsTotal !== undefined) {
          _payload[`conversions_total`] = conversionsTotal;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (externalAccountId !== undefined) {
          _payload[`external_account_id`] = externalAccountId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (figuresAt !== undefined) {
          _payload[`figures_at`] = figuresAt;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (platform !== undefined) {
          _payload[`platform`] = platform;
        }
        if (roas !== undefined) {
          _payload[`roas`] = roas;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = sourceData;
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (spendTotal !== undefined) {
          _payload[`spend_total`] = spendTotal;
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
registerPromptSpecs(adsAccounts.commands.at(-1)!, updateSpecs, { method: "put" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/accounts", hasLimit: true } },
];
adsAccounts
  .command(`restore`)
  .description(`Clears the trash marks on the ad account. Its parts were never touched, so they come back with it, in the state it was in. The same right as deleting.`)
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
        const _apiPath = `/ads/accounts/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(adsAccounts.commands.at(-1)!, restoreSpecs, { method: "post" });
const statusSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/ads/accounts", hasLimit: true } },
  { key: "status", option: "--status <status>", name: "status", type: "string", required: true, enum: ["connected","error","disconnected"] },
  { key: "error", option: "--error <error>", name: "error", type: "string", required: false },
];
adsAccounts
  .command(`status`)
  .description(`Called by a connector workflow when a login expired or works again.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--status <status>`, ``)
  .option(`--error <error>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, status, error } = await promptForMissing(
          _options,
          statusSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/accounts/{id}/status`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (error !== undefined) {
          _payload[`error`] = error;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
registerPromptSpecs(adsAccounts.commands.at(-1)!, statusSpecs, { method: "post" });
