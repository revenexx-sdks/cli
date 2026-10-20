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
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const loyaltyBonus = new Command("loyalty-bonus")
  .description(
    commandDescriptions["loyaltyBonus"] ??
      `Yearly turnover bonus agreements per company: base turnover of last year, frozen tiers, turnover from orders or ERP imports, progress and projection, and the close of the year — calculate, approve once receivables are paid, pay or forfeit.`,
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
  { key: "membershipId", option: "--membership-id <membership-id>", name: "membership_id", description: "Keep only rows whose `membership_id` equals this.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Keep only rows whose `organization_id` equals this.", type: "string", required: false },
  { key: "period", option: "--period <period>", name: "period", description: "Keep only rows whose `period` equals this.", type: "string", required: false },
  { key: "periodStart", option: "--period-start <period-start>", name: "period_start", description: "Keep only rows whose `period_start` equals this.", type: "string", required: false },
  { key: "periodEnd", option: "--period-end <period-end>", name: "period_end", description: "Keep only rows whose `period_end` equals this.", type: "string", required: false },
  { key: "baseSource", option: "--base-source <base-source>", name: "base_source", description: "Keep only rows whose `base_source` equals this.", type: "string", required: false },
  { key: "turnoverSource", option: "--turnover-source <turnover-source>", name: "turnover_source", description: "Keep only rows whose `turnover_source` equals this.", type: "string", required: false },
  { key: "reachedTierId", option: "--reached-tier-id <reached-tier-id>", name: "reached_tier_id", description: "Keep only rows whose `reached_tier_id` equals this.", type: "string", required: false },
  { key: "reachedTierCode", option: "--reached-tier-code <reached-tier-code>", name: "reached_tier_code", description: "Keep only rows whose `reached_tier_code` equals this.", type: "string", required: false },
  { key: "projectedTierCode", option: "--projected-tier-code <projected-tier-code>", name: "projected_tier_code", description: "Keep only rows whose `projected_tier_code` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "receivablesCleared", option: "--receivables-cleared <receivables-cleared>", name: "receivables_cleared", description: "Keep only rows whose `receivables_cleared` equals this.", type: "string", required: false },
  { key: "receivablesCheckedBy", option: "--receivables-checked-by <receivables-checked-by>", name: "receivables_checked_by", description: "Keep only rows whose `receivables_checked_by` equals this.", type: "string", required: false },
  { key: "forfeitReason", option: "--forfeit-reason <forfeit-reason>", name: "forfeit_reason", description: "Keep only rows whose `forfeit_reason` equals this.", type: "string", required: false },
  { key: "documentRef", option: "--document-ref <document-ref>", name: "document_ref", description: "Keep only rows whose `document_ref` equals this.", type: "string", required: false },
  { key: "payoutRef", option: "--payout-ref <payout-ref>", name: "payout_ref", description: "Keep only rows whose `payout_ref` equals this.", type: "string", required: false },
  { key: "approvedBy", option: "--approved-by <approved-by>", name: "approved_by", description: "Keep only rows whose `approved_by` equals this.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Keep only rows whose `external_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
loyaltyBonus
  .command(`list`)
  .description(`Filter \`?organization_id=\`, \`?period=2026\`, \`?state=calculated\` for the year-end queue.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--program-id <program-id>`, `Keep only rows whose \`program_id\` equals this.`)
  .option(`--membership-id <membership-id>`, `Keep only rows whose \`membership_id\` equals this.`)
  .option(`--organization-id <organization-id>`, `Keep only rows whose \`organization_id\` equals this.`)
  .option(`--period <period>`, `Keep only rows whose \`period\` equals this.`)
  .option(`--period-start <period-start>`, `Keep only rows whose \`period_start\` equals this.`)
  .option(`--period-end <period-end>`, `Keep only rows whose \`period_end\` equals this.`)
  .option(`--base-source <base-source>`, `Keep only rows whose \`base_source\` equals this.`)
  .option(`--turnover-source <turnover-source>`, `Keep only rows whose \`turnover_source\` equals this.`)
  .option(`--reached-tier-id <reached-tier-id>`, `Keep only rows whose \`reached_tier_id\` equals this.`)
  .option(`--reached-tier-code <reached-tier-code>`, `Keep only rows whose \`reached_tier_code\` equals this.`)
  .option(`--projected-tier-code <projected-tier-code>`, `Keep only rows whose \`projected_tier_code\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--receivables-cleared <receivables-cleared>`, `Keep only rows whose \`receivables_cleared\` equals this.`)
  .option(`--receivables-checked-by <receivables-checked-by>`, `Keep only rows whose \`receivables_checked_by\` equals this.`)
  .option(`--forfeit-reason <forfeit-reason>`, `Keep only rows whose \`forfeit_reason\` equals this.`)
  .option(`--document-ref <document-ref>`, `Keep only rows whose \`document_ref\` equals this.`)
  .option(`--payout-ref <payout-ref>`, `Keep only rows whose \`payout_ref\` equals this.`)
  .option(`--approved-by <approved-by>`, `Keep only rows whose \`approved_by\` equals this.`)
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
        const { limit, offset, order, id, programId, membershipId, organizationId, period, periodStart, periodEnd, baseSource, turnoverSource, reachedTierId, reachedTierCode, projectedTierCode, currency, state, receivablesCleared, receivablesCheckedBy, forfeitReason, documentRef, payoutRef, approvedBy, externalId, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/bonus-agreements`;
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
        if (membershipId !== undefined) {
          _payload[`membership_id`] = membershipId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (period !== undefined) {
          _payload[`period`] = period;
        }
        if (periodStart !== undefined) {
          _payload[`period_start`] = periodStart;
        }
        if (periodEnd !== undefined) {
          _payload[`period_end`] = periodEnd;
        }
        if (baseSource !== undefined) {
          _payload[`base_source`] = baseSource;
        }
        if (turnoverSource !== undefined) {
          _payload[`turnover_source`] = turnoverSource;
        }
        if (reachedTierId !== undefined) {
          _payload[`reached_tier_id`] = reachedTierId;
        }
        if (reachedTierCode !== undefined) {
          _payload[`reached_tier_code`] = reachedTierCode;
        }
        if (projectedTierCode !== undefined) {
          _payload[`projected_tier_code`] = projectedTierCode;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (receivablesCleared !== undefined) {
          _payload[`receivables_cleared`] = receivablesCleared;
        }
        if (receivablesCheckedBy !== undefined) {
          _payload[`receivables_checked_by`] = receivablesCheckedBy;
        }
        if (forfeitReason !== undefined) {
          _payload[`forfeit_reason`] = forfeitReason;
        }
        if (documentRef !== undefined) {
          _payload[`document_ref`] = documentRef;
        }
        if (payoutRef !== undefined) {
          _payload[`payout_ref`] = payoutRef;
        }
        if (approvedBy !== undefined) {
          _payload[`approved_by`] = approvedBy;
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: true },
  { key: "programId", option: "--program-id <program-id>", name: "program_id", type: "string", required: true },
  { key: "baseTurnover", option: "--base-turnover <base-turnover>", name: "base_turnover", type: "number", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "documentRef", option: "--document-ref <document-ref>", name: "document_ref", type: "string", required: false },
  { key: "period", option: "--period <period>", name: "period", type: "string", required: false },
];
loyaltyBonus
  .command(`create`)
  .description(`Enrols the company if needed, freezes the programme tiers against the base, and reads the year so far from orders. Without \`base_turnover\` the base is last year: the previous agreement, else last year completed orders.`)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--program-id <program-id>`, ``)
  .option(`--base-turnover <base-turnover>`, ``, parseInteger)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--document-ref <document-ref>`, ``)
  .option(`--period <period>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { organizationId, programId, baseTurnover, contactId, documentRef, period } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/bonus-agreements`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (baseTurnover !== undefined) {
          _payload[`base_turnover`] = baseTurnover;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (documentRef !== undefined) {
          _payload[`document_ref`] = documentRef;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (period !== undefined) {
          _payload[`period`] = period;
        }
        if (programId !== undefined) {
          _payload[`program_id`] = programId;
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, createSpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/bonus-agreements", hasLimit: true } },
];
loyaltyBonus
  .command(`get`)
  .description(`Read one bonus agreement`)
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
        const _apiPath = `/loyalty/bonus-agreements/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/bonus-agreements", hasLimit: true } },
  { key: "baseTurnover", option: "--base-turnover <base-turnover>", name: "base_turnover", type: "number", required: false },
  { key: "documentRef", option: "--document-ref <document-ref>", name: "document_ref", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data kept with the agreement, stored as given.", type: "any", required: false },
  { key: "turnoverSource", option: "--turnover-source <turnover-source>", name: "turnover_source", type: "string", required: false, enum: ["orders","import"] },
];
loyaltyBonus
  .command(`update`)
  .description(`Changing the base re-prices the frozen tiers; only while the year runs. Everything else on an agreement is kept by this app.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--base-turnover <base-turnover>`, ``, parseInteger)
  .option(`--document-ref <document-ref>`, ``)
  .option(`--metadata <metadata>`, `Free-form data kept with the agreement, stored as given.`)
  .option(`--turnover-source <turnover-source>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, baseTurnover, documentRef, metadata, turnoverSource } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/bonus-agreements/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (baseTurnover !== undefined) {
          _payload[`base_turnover`] = baseTurnover;
        }
        if (documentRef !== undefined) {
          _payload[`document_ref`] = documentRef;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (turnoverSource !== undefined) {
          _payload[`turnover_source`] = turnoverSource;
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, updateSpecs, { method: "put" });
const approveSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/bonus-agreements", hasLimit: true } },
  { key: "checkedBy", option: "--checked-by <checked-by>", name: "checked_by", type: "string", required: false },
  { key: "receivablesCleared", option: "--receivables-cleared <receivables-cleared>", name: "receivables_cleared", description: "All receivables due at settlement are paid.", type: "boolean", required: false },
];
loyaltyBonus
  .command(`approve`)
  .description(`Approve a calculated bonus`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--checked-by <checked-by>`, ``)
  .option(
    `--receivables-cleared [value]`,
    `All receivables due at settlement are paid.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, checkedBy, receivablesCleared } = await promptForMissing(
          _options,
          approveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/bonus-agreements/{id}/approve`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (checkedBy !== undefined) {
          _payload[`checked_by`] = checkedBy;
        }
        if (receivablesCleared !== undefined) {
          _payload[`receivables_cleared`] = receivablesCleared;
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, approveSpecs, { method: "post" });
const calculateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/bonus-agreements", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
loyaltyBonus
  .command(`calculate`)
  .description(`Final turnover, reached tier and bonus (that tier percentage of the whole year). Announces bonus_agreement.calculated. A calculated agreement may be calculated again after a late return.`)
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
          calculateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/bonus-agreements/{id}/calculate`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, calculateSpecs, { method: "post" });
const forfeitSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/bonus-agreements", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", type: "string", required: true },
];
loyaltyBonus
  .command(`forfeit`)
  .description(`Forfeit a calculated bonus with a reason`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          forfeitSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/bonus-agreements/{id}/forfeit`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, forfeitSpecs, { method: "post" });
const paySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/bonus-agreements", hasLimit: true } },
  { key: "payoutRef", option: "--payout-ref <payout-ref>", name: "payout_ref", description: "The credit note or payment.", type: "string", required: false },
];
loyaltyBonus
  .command(`pay`)
  .description(`Record that an approved bonus was paid`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--payout-ref <payout-ref>`, `The credit note or payment.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, payoutRef } = await promptForMissing(
          _options,
          paySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/bonus-agreements/{id}/pay`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (payoutRef !== undefined) {
          _payload[`payout_ref`] = payoutRef;
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, paySpecs, { method: "post" });
const progressSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/bonus-agreements", hasLimit: true } },
];
loyaltyBonus
  .command(`progress`)
  .description(`Turnover so far, projection to year end, every tier with its range, the tier reached, the gap to the next with its projected date, the bonus now and the expected bonus — the storefront Premium page and the cockpit panel read it. \`bars\` carries the tiers as rows of label and value, worded in the caller language, with the year gone and the bonus now as \`footer\` rows.`)
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
        const _apiPath = `/loyalty/bonus-agreements/{id}/progress`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, progressSpecs, { method: "get" });
const rebuildSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/bonus-agreements", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
loyaltyBonus
  .command(`rebuild`)
  .description(`Adds every completed order of the year not yet counted; an order already counted is not counted twice. Not for agreements fed by ERP imports.`)
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
          rebuildSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/bonus-agreements/{id}/rebuild`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, rebuildSpecs, { method: "post" });
const entriesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "agreementId", option: "--agreement-id <agreement-id>", name: "agreement_id", description: "Keep only rows whose `agreement_id` equals this.", type: "string", required: false },
  { key: "entryKey", option: "--entry-key <entry-key>", name: "entry_key", description: "Keep only rows whose `entry_key` equals this.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Keep only rows whose `source` equals this.", type: "string", required: false },
  { key: "ref", option: "--ref <ref>", name: "ref", description: "Keep only rows whose `ref` equals this.", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "Keep only rows whose `order_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
loyaltyBonus
  .command(`entries-list`)
  .description(`Filter \`?agreement_id=\`, \`?source=\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--agreement-id <agreement-id>`, `Keep only rows whose \`agreement_id\` equals this.`)
  .option(`--entry-key <entry-key>`, `Keep only rows whose \`entry_key\` equals this.`)
  .option(`--source <source>`, `Keep only rows whose \`source\` equals this.`)
  .option(`--ref <ref>`, `Keep only rows whose \`ref\` equals this.`)
  .option(`--order-id <order-id>`, `Keep only rows whose \`order_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, agreementId, entryKey, source, ref, orderId, filter } = await promptForMissing(
          _options,
          entriesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/turnover-entries`;
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
        if (agreementId !== undefined) {
          _payload[`agreement_id`] = agreementId;
        }
        if (entryKey !== undefined) {
          _payload[`entry_key`] = entryKey;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (ref !== undefined) {
          _payload[`ref`] = ref;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, entriesListSpecs, { method: "get" });
const entriesCorrectSpecs: PromptSpec[] = [
  { key: "agreementId", option: "--agreement-id <agreement-id>", name: "agreement_id", type: "string", required: true },
  { key: "amount", option: "--amount <amount>", name: "amount", type: "number", required: true },
  { key: "ref", option: "--ref <ref>", name: "ref", type: "string", required: true },
  { key: "at", option: "--at <at>", name: "at", type: "string", required: false },
  { key: "key", option: "--key <key>", name: "key", type: "string", required: false },
];
loyaltyBonus
  .command(`entries-correct`)
  .description(`A signed correction line with a reason (\`ref\`). A \`key\` makes a retry book once.`)
  .option(`--agreement-id <agreement-id>`, ``)
  .option(`--amount <amount>`, ``, parseInteger)
  .option(`--ref <ref>`, ``)
  .option(`--at <at>`, ``)
  .option(`--key <key>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { agreementId, amount, ref, at, key } = await promptForMissing(
          _options,
          entriesCorrectSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/turnover-entries`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (agreementId !== undefined) {
          _payload[`agreement_id`] = agreementId;
        }
        if (amount !== undefined) {
          _payload[`amount`] = amount;
        }
        if (at !== undefined) {
          _payload[`at`] = at;
        }
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (ref !== undefined) {
          _payload[`ref`] = ref;
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, entriesCorrectSpecs, { method: "post" });
const entriesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/loyalty/turnover-entries", hasLimit: true } },
];
loyaltyBonus
  .command(`entries-get`)
  .description(`Read one turnover line`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          entriesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/turnover-entries/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, entriesGetSpecs, { method: "get" });
const importSpecs: PromptSpec[] = [
  { key: "rows", option: "--rows [rows...]", name: "rows", type: "array", required: true },
];
loyaltyBonus
  .command(`import`)
  .description(`At most 500 rows, each one line under its own reference. From the first imported line an agreement counts imported lines only.`)
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
        const _apiPath = `/loyalty/turnover-imports`;
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
registerPromptSpecs(loyaltyBonus.commands.at(-1)!, importSpecs, { method: "post" });
