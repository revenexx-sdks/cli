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

export const loyaltyMemberships = new Command("loyalty-memberships")
  .description(
    commandDescriptions["loyaltyMemberships"] ??
      `Members of a programme — a contact or a company — with their tier, their balance and the lookup the storefront, promotions and audiences ask which tier a customer holds.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "programId", option: "--program-id <program-id>", name: "program_id", description: "Keep only rows whose `program_id` equals this.", type: "string", required: false },
  { key: "holder", option: "--holder <holder>", name: "holder", description: "Keep only rows whose `holder` equals this.", type: "string", required: false },
  { key: "holderKey", option: "--holder-key <holder-key>", name: "holder_key", description: "Keep only rows whose `holder_key` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Keep only rows whose `organization_id` equals this.", type: "string", required: false },
  { key: "tierId", option: "--tier-id <tier-id>", name: "tier_id", description: "Keep only rows whose `tier_id` equals this.", type: "string", required: false },
  { key: "tierCode", option: "--tier-code <tier-code>", name: "tier_code", description: "Keep only rows whose `tier_code` equals this.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Keep only rows whose `status` equals this.", type: "string", required: false },
  { key: "pointsBalance", option: "--points-balance <points-balance>", name: "points_balance", description: "Keep only rows whose `points_balance` equals this.", type: "string", required: false },
  { key: "pointsPeriod", option: "--points-period <points-period>", name: "points_period", description: "Keep only rows whose `points_period` equals this.", type: "string", required: false },
  { key: "pointsLifetime", option: "--points-lifetime <points-lifetime>", name: "points_lifetime", description: "Keep only rows whose `points_lifetime` equals this.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Keep only rows whose `market` equals this.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Keep only rows whose `external_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
loyaltyMemberships
  .command(`list`)
  .description(`Filter \`?program_id=\`, \`?contact_id=\`, \`?organization_id=\`, \`?tier_id=\` or \`?tier_code=\` (what the audiences rule reads), \`?status=active\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--program-id <program-id>`, `Keep only rows whose \`program_id\` equals this.`)
  .option(`--holder <holder>`, `Keep only rows whose \`holder\` equals this.`)
  .option(`--holder-key <holder-key>`, `Keep only rows whose \`holder_key\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--organization-id <organization-id>`, `Keep only rows whose \`organization_id\` equals this.`)
  .option(`--tier-id <tier-id>`, `Keep only rows whose \`tier_id\` equals this.`)
  .option(`--tier-code <tier-code>`, `Keep only rows whose \`tier_code\` equals this.`)
  .option(`--status <status>`, `Keep only rows whose \`status\` equals this.`)
  .option(`--points-balance <points-balance>`, `Keep only rows whose \`points_balance\` equals this.`)
  .option(`--points-period <points-period>`, `Keep only rows whose \`points_period\` equals this.`)
  .option(`--points-lifetime <points-lifetime>`, `Keep only rows whose \`points_lifetime\` equals this.`)
  .option(`--market <market>`, `Keep only rows whose \`market\` equals this.`)
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
        const { limit, offset, order, id, programId, holder, holderKey, contactId, organizationId, tierId, tierCode, status, pointsBalance, pointsPeriod, pointsLifetime, market, externalId, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/memberships`;
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
        if (programId !== undefined) {
          _payload[`program_id`] = programId;
        }
        if (holder !== undefined) {
          _payload[`holder`] = holder;
        }
        if (holderKey !== undefined) {
          _payload[`holder_key`] = holderKey;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (tierId !== undefined) {
          _payload[`tier_id`] = tierId;
        }
        if (tierCode !== undefined) {
          _payload[`tier_code`] = tierCode;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (pointsBalance !== undefined) {
          _payload[`points_balance`] = pointsBalance;
        }
        if (pointsPeriod !== undefined) {
          _payload[`points_period`] = pointsPeriod;
        }
        if (pointsLifetime !== undefined) {
          _payload[`points_lifetime`] = pointsLifetime;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
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
registerPromptSpecs(loyaltyMemberships.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "programId", option: "--program-id <program-id>", name: "program_id", description: "The programme this row belongs to.", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person, as customers knows them.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "The market the member joined in, when known.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company, as customers knows it.", type: "string", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "`active`, `paused` (nothing earned or redeemed) or `ended` (final).", type: "string", required: false, enum: ["active","paused","ended"] },
];
loyaltyMemberships
  .command(`create`)
  .description(`Enrol a contact or a company`)
  .option(`--program-id <program-id>`, `The programme this row belongs to.`)
  .option(`--contact-id <contact-id>`, `The person, as customers knows them.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--market <market>`, `The market the member joined in, when known.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--organization-id <organization-id>`, `The company, as customers knows it.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--status <status>`, `\`active\`, \`paused\` (nothing earned or redeemed) or \`ended\` (final).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { programId, contactId, externalId, externalRefs, market, metadata, organizationId, sourceData, sourceSyncedAt, status } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/memberships`;
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
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
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
registerPromptSpecs(loyaltyMemberships.commands.at(-1)!, createSpecs, { method: "post" });
const lookupSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person. Their company is looked up with them.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company.", type: "string", required: false },
];
loyaltyMemberships
  .command(`lookup`)
  .description(`What the storefront account page and cart perk hint, the loyalty_tier condition in promotions and the loyalty_tier rule in audiences ask. A contact counts together with its company. Only active memberships of active programmes answer; \`tier_codes\` lists every tier held.`)
  .option(`--contact-id <contact-id>`, `The person. Their company is looked up with them.`)
  .option(`--organization-id <organization-id>`, `The company.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, organizationId } = await promptForMissing(
          _options,
          lookupSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/memberships/lookup`;
        const _payload: RequestParams = {};
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
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
registerPromptSpecs(loyaltyMemberships.commands.at(-1)!, lookupSpecs, { method: "get" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/memberships", hasLimit: true } },
];
loyaltyMemberships
  .command(`delete`)
  .description(`Delete a membership with no bookings`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`loyalty-memberships delete`);
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/memberships/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyMemberships.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/memberships", hasLimit: true } },
];
loyaltyMemberships
  .command(`get`)
  .description(`Read one membership`)
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
        const _apiPath = `/loyalty/memberships/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyMemberships.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/memberships", hasLimit: true } },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person, as customers knows them.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "The market the member joined in, when known.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company, as customers knows it.", type: "string", required: false },
  { key: "programId", option: "--program-id <program-id>", name: "program_id", description: "The programme this row belongs to.", type: "string", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "`active`, `paused` (nothing earned or redeemed) or `ended` (final).", type: "string", required: false, enum: ["active","paused","ended"] },
];
loyaltyMemberships
  .command(`update`)
  .description(`Pause, resume or end a membership`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--contact-id <contact-id>`, `The person, as customers knows them.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--market <market>`, `The market the member joined in, when known.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--organization-id <organization-id>`, `The company, as customers knows it.`)
  .option(`--program-id <program-id>`, `The programme this row belongs to.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--status <status>`, `\`active\`, \`paused\` (nothing earned or redeemed) or \`ended\` (final).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId, externalId, externalRefs, market, metadata, organizationId, programId, sourceData, sourceSyncedAt, status } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/memberships/{id}`.replace(`{id}`, id);
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
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = externalRefs;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
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
        if (status !== undefined) {
          _payload[`status`] = status;
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
registerPromptSpecs(loyaltyMemberships.commands.at(-1)!, updateSpecs, { method: "put" });
const adjustSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/memberships", hasLimit: true } },
  { key: "points", option: "--points <points>", name: "points", description: "Positive to credit, negative to debit.", type: "integer", required: true },
  { key: "reason", option: "--reason <reason>", name: "reason", type: "string", required: true },
  { key: "key", option: "--key <key>", name: "key", type: "string", required: false },
];
loyaltyMemberships
  .command(`adjust`)
  .description(`A credit or a debit with a reason. A debit never takes the balance below zero. A \`key\` makes a retry book once.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--points <points>`, `Positive to credit, negative to debit.`, parseInteger)
  .option(`--reason <reason>`, ``)
  .option(`--key <key>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, points, reason, key } = await promptForMissing(
          _options,
          adjustSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/memberships/{id}/adjust`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (points !== undefined) {
          _payload[`points`] = points;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
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
registerPromptSpecs(loyaltyMemberships.commands.at(-1)!, adjustSpecs, { method: "post" });
const progressSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/memberships", hasLimit: true } },
];
loyaltyMemberships
  .command(`progress`)
  .description(`Every tier of the programme, lowest first, with how far the member has come towards it: points of this period for a points programme, this year's turnover through the agreement for a turnover bonus. Reached tiers say so, the next says how much is missing. No tiers, or no agreement this year, answers no rows.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          progressSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/memberships/{id}/progress`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyMemberships.commands.at(-1)!, progressSpecs, { method: "get" });
const referralCodeSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/memberships", hasLimit: true } },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
];
loyaltyMemberships
  .command(`referral-code`)
  .description(`Answers the active code of the membership, making one on first ask. A company membership names the person who refers with \`contact_id\`.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--contact-id <contact-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId } = await promptForMissing(
          _options,
          referralCodeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/memberships/{id}/referral-code`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyMemberships.commands.at(-1)!, referralCodeSpecs, { method: "post" });
