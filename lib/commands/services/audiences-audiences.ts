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

export const audiencesAudiences = new Command("audiences-audiences")
  .description(
    commandDescriptions["audiencesAudiences"] ??
      `Named sets of people a marketing send or a journey is pointed at. An active audience is defined by rules and recomputed in budgeted, resumable passes; a static one holds an import, a hand-picked list or a frozen copy of an active one. Preview counts who would be in without writing anything. The closed lists the rules are written in are published here too.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "trashed", option: "--trashed <trashed>", name: "trashed", description: "`exclude` (default) leaves the trash out, `only` is the trash itself, `include` lists both.", type: "string", required: false, enum: ["exclude","only","include"] },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Keep only rows whose `code` equals this.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Keep only rows whose `description` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", description: "Keep only rows whose `rule_match` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "memberCount", option: "--member-count <member-count>", name: "member_count", description: "Keep only rows whose `member_count` equals this.", type: "string", required: false },
  { key: "eligibleCount", option: "--eligible-count <eligible-count>", name: "eligible_count", description: "Keep only rows whose `eligible_count` equals this.", type: "string", required: false },
  { key: "rulesSummary", option: "--rules-summary <rules-summary>", name: "rules_summary", description: "Keep only rows whose `rules_summary` equals this.", type: "string", required: false },
  { key: "recomputeState", option: "--recompute-state <recompute-state>", name: "recompute_state", description: "Keep only rows whose `recompute_state` equals this.", type: "string", required: false },
  { key: "recomputeError", option: "--recompute-error <recompute-error>", name: "recompute_error", description: "Keep only rows whose `recompute_error` equals this.", type: "string", required: false },
  { key: "frozenFromId", option: "--frozen-from-id <frozen-from-id>", name: "frozen_from_id", description: "Keep only rows whose `frozen_from_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
audiencesAudiences
  .command(`list`)
  .description(`Every audience of this tenant, active and static, with its member count and how many of them someone may write to.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--trashed <trashed>`, `\`exclude\` (default) leaves the trash out, \`only\` is the trash itself, \`include\` lists both.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--code <code>`, `Keep only rows whose \`code\` equals this.`)
  .option(`--description <description>`, `Keep only rows whose \`description\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--rule-match <rule-match>`, `Keep only rows whose \`rule_match\` equals this.`)
  .option(`--active <active>`, `Keep only rows whose \`active\` equals this.`)
  .option(`--member-count <member-count>`, `Keep only rows whose \`member_count\` equals this.`)
  .option(`--eligible-count <eligible-count>`, `Keep only rows whose \`eligible_count\` equals this.`)
  .option(`--rules-summary <rules-summary>`, `Keep only rows whose \`rules_summary\` equals this.`)
  .option(`--recompute-state <recompute-state>`, `Keep only rows whose \`recompute_state\` equals this.`)
  .option(`--recompute-error <recompute-error>`, `Keep only rows whose \`recompute_error\` equals this.`)
  .option(`--frozen-from-id <frozen-from-id>`, `Keep only rows whose \`frozen_from_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, trashed, id, code, description, kind, ruleMatch, active, memberCount, eligibleCount, rulesSummary, recomputeState, recomputeError, frozenFromId, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences`;
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
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (memberCount !== undefined) {
          _payload[`member_count`] = memberCount;
        }
        if (eligibleCount !== undefined) {
          _payload[`eligible_count`] = eligibleCount;
        }
        if (rulesSummary !== undefined) {
          _payload[`rules_summary`] = rulesSummary;
        }
        if (recomputeState !== undefined) {
          _payload[`recompute_state`] = recomputeState;
        }
        if (recomputeError !== undefined) {
          _payload[`recompute_error`] = recomputeError;
        }
        if (frozenFromId !== undefined) {
          _payload[`frozen_from_id`] = frozenFromId;
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The stable identifier other apps and the storefront refer to the audience by. Unique per tenant, and fixed once created.", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", description: "An inactive audience is not recomputed and is left out of a person's memberships; its members stay as they are.", type: "boolean", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the audience is for, in the merchant's own words.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`active` — defined by rules and recomputed; `static` — holds an import, a hand-picked list or a frozen copy. Fixed once created.", type: "string", required: false, enum: ["active","static"] },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Display text per locale, e.g. `{\"de\": \"Newsletter DE\", \"en\": \"Newsletter DE\"}`.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", description: "How the top-level rules of an active audience are held together: `all` or `any`.", type: "string", required: false, enum: ["all","any"] },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
];
audiencesAudiences
  .command(`create`)
  .description(`Create an audience`)
  .option(`--code <code>`, `The stable identifier other apps and the storefront refer to the audience by. Unique per tenant, and fixed once created.`)
  .option(
    `--active [value]`,
    `An inactive audience is not recomputed and is left out of a person's memberships; its members stay as they are.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--description <description>`, `What the audience is for, in the merchant's own words.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--kind <kind>`, `\`active\` — defined by rules and recomputed; \`static\` — holds an import, a hand-picked list or a frozen copy. Fixed once created.`)
  .option(`--labels <labels>`, `Display text per locale, e.g. \`{"de": "Newsletter DE", "en": "Newsletter DE"}\`.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--rule-match <rule-match>`, `How the top-level rules of an active audience are held together: \`all\` or \`any\`.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, active, description, externalId, externalRefs, kind, labels, metadata, ruleMatch, sourceData, sourceSyncedAt } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences`;
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
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, createSpecs, { method: "post" });
audiencesAudiences
  .command(`recompute-all`)
  .description(`What the hourly schedule runs, by hand: every active audience, unfinished passes first, one shared budget. One audience failing does not stop the others.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/recompute-all`;
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
audiencesAudiences
  .command(`empty-trash`)
  .description(`Every audience in the trash is deleted for good on its own terms. One that something still blocks stays in the trash and is named with its reason, so a partial success says exactly what remained. Not for a storefront contact.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/trash/empty`;
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
audiencesAudiences
  .command(`purge`)
  .description(`What the nightly purge does, callable by hand: every audience in the trash for longer than the tenant trash retention (90 days unless the tenant set another) is deleted for good through the same rules as a second delete. A blocked one stays and carries its reason. When the retention cannot be read, nothing is deleted. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/trash/purge`;
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
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/audiences", hasLimit: true } },
];
audiencesAudiences
  .command(`delete`)
  .description(`The first DELETE moves the audience into the trash: it stays, with everything hanging off it, and counts nowhere until it is restored. An audience another audience asks for members of is refused (\`trash_blocked\`, blocker \`audience_in_use\` with \`audience_ids\`) — change their rules first. Its rules and members stay with it. A DELETE on a audience already in the trash deletes it for good — refused while something still needs it, and not for a storefront contact.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`audiences-audiences delete`);
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/audiences", hasLimit: true } },
];
audiencesAudiences
  .command(`get`)
  .description(`Read one audience`)
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
        const _apiPath = `/audiences/audiences/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/audiences", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", description: "An inactive audience is not recomputed and is left out of a person's memberships; its members stay as they are.", type: "boolean", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "The stable identifier other apps and the storefront refer to the audience by. Unique per tenant, and fixed once created.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "What the audience is for, in the merchant's own words.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "any", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "`active` — defined by rules and recomputed; `static` — holds an import, a hand-picked list or a frozen copy. Fixed once created.", type: "string", required: false, enum: ["active","static"] },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Display text per locale, e.g. `{\"de\": \"Newsletter DE\", \"en\": \"Newsletter DE\"}`.", type: "any", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", description: "How the top-level rules of an active audience are held together: `all` or `any`.", type: "string", required: false, enum: ["all","any"] },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "any", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
];
audiencesAudiences
  .command(`update`)
  .description(`Correct an audience`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(
    `--active [value]`,
    `An inactive audience is not recomputed and is left out of a person's memberships; its members stay as they are.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--code <code>`, `The stable identifier other apps and the storefront refer to the audience by. Unique per tenant, and fixed once created.`)
  .option(`--description <description>`, `What the audience is for, in the merchant's own words.`)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--kind <kind>`, `\`active\` — defined by rules and recomputed; \`static\` — holds an import, a hand-picked list or a frozen copy. Fixed once created.`)
  .option(`--labels <labels>`, `Display text per locale, e.g. \`{"de": "Newsletter DE", "en": "Newsletter DE"}\`.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--rule-match <rule-match>`, `How the top-level rules of an active audience are held together: \`all\` or \`any\`.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, code, description, externalId, externalRefs, kind, labels, metadata, ruleMatch, sourceData, sourceSyncedAt } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/{id}`.replace(`{id}`, id);
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
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, updateSpecs, { method: "put" });
const freezeSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/audiences", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "The new audience's code. Required on the first call.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "targetId", option: "--target-id <target-id>", name: "target_id", description: "Continue an unfinished freeze into this audience.", type: "string", required: false },
];
audiencesAudiences
  .command(`freeze`)
  .description(`Creates a static audience holding exactly who is in the active one now, so a big send's list does not move. Chunked: an unfinished copy answers \`done: false\` with the new audience's id, and a call naming it in \`target_id\` continues.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--code <code>`, `The new audience's code. Required on the first call.`)
  .option(`--description <description>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--target-id <target-id>`, `Continue an unfinished freeze into this audience.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, description, labels, targetId } = await promptForMissing(
          _options,
          freezeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/{id}/freeze`.replace(`{id}`, id);
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
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (targetId !== undefined) {
          _payload[`target_id`] = targetId;
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, freezeSpecs, { method: "post" });
const previewSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/audiences", hasLimit: true } },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", type: "string", required: false, enum: ["all","any"] },
  { key: "rules", option: "--rules [rules...]", name: "rules", description: "A candidate rule tree. Omitted: the stored rules.", type: "array", required: false },
];
audiencesAudiences
  .command(`preview`)
  .description(`Evaluates the stored rules — or a candidate tree sent in \`rules\`, for a form not yet saved — over the tenant's contacts and counts the matches. Bounded by a short budget: when the population does not fit, the answer says how many were examined and estimates the rest. Nothing is written.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--rule-match <rule-match>`, ``)
  .option(`--rules [rules...]`, `A candidate rule tree. Omitted: the stored rules.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, ruleMatch, rules } = await promptForMissing(
          _options,
          previewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/{id}/preview`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
        }
        if (rules !== undefined) {
          _payload[`rules`] = rules;
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, previewSpecs, { method: "post" });
const recomputeSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/audiences", hasLimit: true } },
  { key: "restart", option: "--restart <restart>", name: "restart", description: "Start a fresh pass even if one is unfinished.", type: "boolean", required: false },
];
audiencesAudiences
  .command(`recompute`)
  .description(`Evaluates the rules over the tenant's contacts and writes who joined and who left, for as long as the tenant's budget allows. An unfinished pass answers \`done: false\` and continues on the next call. \`restart: true\` drops an unfinished pass and starts over.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(
    `--restart [value]`,
    `Start a fresh pass even if one is unfinished.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, restart } = await promptForMissing(
          _options,
          recomputeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/audiences/{id}/recompute`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (restart !== undefined) {
          _payload[`restart`] = restart;
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, recomputeSpecs, { method: "post" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/audiences/audiences", hasLimit: true } },
];
audiencesAudiences
  .command(`restore`)
  .description(`Clears the trash marks on the audience. Its parts were never touched, so they come back with it, in the state it was in. The same right as deleting.`)
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
        const _apiPath = `/audiences/audiences/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, restoreSpecs, { method: "post" });
const audiencesVocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
audiencesAudiences
  .command(`audiences-vocabularies-list`)
  .description(`List the closed lists this app enforces`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { filter } = await promptForMissing(
          _options,
          audiencesVocabulariesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/vocabularies`;
        const _payload: RequestParams = {};
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, audiencesVocabulariesListSpecs, { method: "get" });
const audiencesVocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary, e.g. `subjects` or `operators`.", type: "string", required: true, resource: { listPath: "/audiences/vocabularies", hasLimit: false } },
];
audiencesAudiences
  .command(`audiences-vocabularies-get`)
  .description(`Read one closed list with its values and labels`)
  .option(`--name <name>`, `The vocabulary, e.g. \`subjects\` or \`operators\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          audiencesVocabulariesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/audiences/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(audiencesAudiences.commands.at(-1)!, audiencesVocabulariesGetSpecs, { method: "get" });
