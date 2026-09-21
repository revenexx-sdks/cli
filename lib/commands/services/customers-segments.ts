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

export const customersSegments = new Command("customers-segments")
  .description(
    commandDescriptions["customersSegments"] ??
      `Named groups of ORGANIZATIONS — never of people — built by hand, by rule, or both at once, plus the memberships that record which of the two a company came in by. The rule language is the one product categories use, evaluated over organization columns and settings AND over order behaviour (revenue, order count, average order value, days since the last order) read from this app's own metrics projection, because the orders app may not be joined. Rules are materialized rather than live: preview one before storing it, then recompute one segment or every segment that carries rules.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const customersSegmentMembersListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. Primary key of the membership row.", type: "string", required: false },
  { key: "segmentId", option: "--segment-id <segment-id>", name: "segment_id", description: "Filter to one segment — its members.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one company — the segments it belongs to. The same route answers both questions.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Filter by how the membership came about. `manual` is the hand-picked set a recompute will never touch.", type: "string", required: false, enum: ["manual","rule"] },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the organization joined the segment.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersSegments
  .command(`customers-segment-members-list`)
  .description(`One organization inside one segment, plus the record of how it got there: \`source: "manual"\` for a company somebody put in, \`source: "rule"\` for one the rule engine matched. That distinction is what lets a recompute rewrite its own rows and leave every hand-picked one alone. The membership rows themselves — the answer to "which companies are in this segment" (\`segment_id\`) and to "which segments is this company in" (\`organization_id\`). Paged with \`limit\`/\`offset\`/\`order\`.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. Primary key of the membership row.`)
  .option(`--segment-id <segment-id>`, `Filter to one segment — its members.`)
  .option(`--organization-id <organization-id>`, `Filter to one company — the segments it belongs to. The same route answers both questions.`)
  .option(`--source <source>`, `Filter by how the membership came about. \`manual\` is the hand-picked set a recompute will never touch.`)
  .option(`--created-at <created-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the organization joined the segment.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, segmentId, organizationId, source, createdAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          customersSegmentMembersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segment_members`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (segmentId !== undefined) {
          _payload[`segment_id`] = segmentId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
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
registerPromptSpecs(customersSegments.commands.at(-1)!, customersSegmentMembersListSpecs, { method: "get" });
const customersSegmentMembersCreateSpecs: PromptSpec[] = [
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The member company. Segments group companies, never people — a person is reached through their organization.", type: "string", required: true },
  { key: "segmentId", option: "--segment-id <segment-id>", name: "segment_id", description: "The segment.", type: "string", required: true },
  { key: "source", option: "--source <source>", name: "source", description: "How this membership came about: 'manual' is hand-picked, 'rule' was materialized by a recompute. The distinction is load-bearing — a recompute only ever inserts and deletes 'rule' rows, so a hand-picked member survives every rule change. Default 'manual'.", type: "string", required: false, enum: ["manual","rule"] },
];
customersSegments
  .command(`customers-segment-members-create`)
  .description(`One organization inside one segment, plus the record of how it got there: \`source: "manual"\` for a company somebody put in, \`source: "rule"\` for one the rule engine matched. That distinction is what lets a recompute rewrite its own rows and leave every hand-picked one alone. Adds a company to a segment BY HAND. The row is \`source: "manual"\`, which is what protects it: a rule recompute rewrites the rule-derived rows of that segment and never touches this one. A create cannot omit \`segment_id\` and \`organization_id\`; everything else is optional or defaulted by the database. Two rows of this tenant may not share the combination of \`segment_id\` + \`organization_id\`.`)
  .option(`--organization-id <organization-id>`, `The member company. Segments group companies, never people — a person is reached through their organization.`)
  .option(`--segment-id <segment-id>`, `The segment.`)
  .option(`--source <source>`, `How this membership came about: 'manual' is hand-picked, 'rule' was materialized by a recompute. The distinction is load-bearing — a recompute only ever inserts and deletes 'rule' rows, so a hand-picked member survives every rule change. Default 'manual'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { organizationId, segmentId, source } = await promptForMissing(
          _options,
          customersSegmentMembersCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segment_members`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (segmentId !== undefined) {
          _payload[`segment_id`] = segmentId;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
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
registerPromptSpecs(customersSegments.commands.at(-1)!, customersSegmentMembersCreateSpecs, { method: "post" });
const customersSegmentMembersDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The segment membership to delete.", type: "string", required: true, resource: { listPath: "/customers/segment_members", hasLimit: true } },
];
customersSegments
  .command(`customers-segment-members-delete`)
  .description(`One organization inside one segment, plus the record of how it got there: \`source: "manual"\` for a company somebody put in, \`source: "rule"\` for one the rule engine matched. That distinction is what lets a recompute rewrite its own rows and leave every hand-picked one alone. Takes the company out of the segment. If the segment carries rules and the company still matches them, the next recompute puts it back; remove it from the rule, not from the list. Nothing else in this app points at it, so nothing else goes with it.`)
  .option(`--id <id>`, `The segment membership to delete.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersSegmentMembersDeleteSpecs,
          _command,
        );
        await confirmDestructive(`customers-segments customers-segment-members-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/segment_members/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customersSegments.commands.at(-1)!, customersSegmentMembersDeleteSpecs, { method: "delete", destructive: true });
const customersSegmentMembersGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The segment membership to read.", type: "string", required: true, resource: { listPath: "/customers/segment_members", hasLimit: true } },
];
customersSegments
  .command(`customers-segment-members-get`)
  .description(`One organization inside one segment, plus the record of how it got there: \`source: "manual"\` for a company somebody put in, \`source: "rule"\` for one the rule engine matched. That distinction is what lets a recompute rewrite its own rows and leave every hand-picked one alone. One membership row by id, with the \`source\` that says how it came about.`)
  .option(`--id <id>`, `The segment membership to read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersSegmentMembersGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segment_members/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customersSegments.commands.at(-1)!, customersSegmentMembersGetSpecs, { method: "get" });
const customersSegmentMembersUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The segment membership to update.", type: "string", required: true, resource: { listPath: "/customers/segment_members", hasLimit: true } },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The member company. Segments group companies, never people — a person is reached through their organization.", type: "string", required: false },
  { key: "segmentId", option: "--segment-id <segment-id>", name: "segment_id", description: "The segment.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "How this membership came about: 'manual' is hand-picked, 'rule' was materialized by a recompute. The distinction is load-bearing — a recompute only ever inserts and deletes 'rule' rows, so a hand-picked member survives every rule change. Default 'manual'.", type: "string", required: false, enum: ["manual","rule"] },
];
customersSegments
  .command(`customers-segment-members-update`)
  .description(`One organization inside one segment, plus the record of how it got there: \`source: "manual"\` for a company somebody put in, \`source: "rule"\` for one the rule engine matched. That distinction is what lets a recompute rewrite its own rows and leave every hand-picked one alone. A partial update. In practice there is little to change — a membership is a pair of ids — so this exists for the \`source\` correction rather than as the normal path. Two rows of this tenant may not share the combination of \`segment_id\` + \`organization_id\`.`)
  .option(`--id <id>`, `The segment membership to update.`)
  .option(`--organization-id <organization-id>`, `The member company. Segments group companies, never people — a person is reached through their organization.`)
  .option(`--segment-id <segment-id>`, `The segment.`)
  .option(`--source <source>`, `How this membership came about: 'manual' is hand-picked, 'rule' was materialized by a recompute. The distinction is load-bearing — a recompute only ever inserts and deletes 'rule' rows, so a hand-picked member survives every rule change. Default 'manual'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, organizationId, segmentId, source } = await promptForMissing(
          _options,
          customersSegmentMembersUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segment_members/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (segmentId !== undefined) {
          _payload[`segment_id`] = segmentId;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
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
registerPromptSpecs(customersSegments.commands.at(-1)!, customersSegmentMembersUpdateSpecs, { method: "put" });
const listSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. Primary key of the segment.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Filter by exact segment code.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Filter to rows whose `position` is exactly this value. Sort order in the cockpit, ascending. Ties fall back to insertion order.", type: "integer", required: false },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", description: "Filter to rows whose `rule_match` is exactly this value. How the conditions combine: 'all' (default) is AND, 'any' is OR. Null means the same as 'all'.", type: "string", required: false, enum: ["all","any"] },
  { key: "rulesComputedAt", option: "--rules-computed-at <rules-computed-at>", name: "rules_computed_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the rule last finished a COMPLETE recompute. Null after a rule change, and while a chunked recompute is still running — so it doubles as \"are the rule memberships trustworthy right now?\".", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the segment was created.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When any column of this row last changed.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersSegments
  .command(`list`)
  .description(`A segment is a named group of ORGANIZATIONS — never of people — built by hand, by rule, or both at once. It is what a price list, a campaign or a shipping option is pointed at when the answer is "these customers, not those". Every segment this tenant keeps, with its stored rules. Any column filters and the page is \`limit\`/\`offset\`/\`order\`. Which companies are actually IN one is \`segment_members\`, because the rule half is materialized rather than evaluated on read.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. Primary key of the segment.`)
  .option(`--code <code>`, `Filter by exact segment code.`)
  .option(`--position <position>`, `Filter to rows whose \`position\` is exactly this value. Sort order in the cockpit, ascending. Ties fall back to insertion order.`, parseInteger)
  .option(`--rule-match <rule-match>`, `Filter to rows whose \`rule_match\` is exactly this value. How the conditions combine: 'all' (default) is AND, 'any' is OR. Null means the same as 'all'.`)
  .option(`--rules-computed-at <rules-computed-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the rule last finished a COMPLETE recompute. Null after a rule change, and while a chunked recompute is still running — so it doubles as "are the rule memberships trustworthy right now?".`)
  .option(`--created-at <created-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the segment was created.`)
  .option(`--updated-at <updated-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When any column of this row last changed.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, position, ruleMatch, rulesComputedAt, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
        }
        if (rulesComputedAt !== undefined) {
          _payload[`rules_computed_at`] = rulesComputedAt;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (updatedAt !== undefined) {
          _payload[`updated_at`] = updatedAt;
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
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
registerPromptSpecs(customersSegments.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable identifier, unique per tenant — what other apps and integrations name the segment by. Free text, but lowercase with underscores is the convention every seeded vocabulary follows.", type: "string", required: true },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by language tag. Null means nobody translated it and a client falls back to showing the code.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in the cockpit, ascending. Ties fall back to insertion order. Default 0.", type: "integer", required: false },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", description: "How the conditions combine: 'all' (default) is AND, 'any' is OR. Null means the same as 'all'.", type: "string", required: false, enum: ["all","any"] },
  { key: "rules", option: "--rules <rules>", name: "rules", description: "The selector that decides membership, stored verbatim. Null means the segment is manual-only. The same rule language product categories use, evaluated over organization columns, `setting:<key>` entries and the organization_metrics projection — so 'no order in 365 days' is expressible without joining the orders app. Null makes the segment manual-only. Changing it does not move a single membership — run the recompute.", type: "object", required: false },
];
customersSegments
  .command(`create`)
  .description(`A segment is a named group of ORGANIZATIONS — never of people — built by hand, by rule, or both at once. It is what a price list, a campaign or a shipping option is pointed at when the answer is "these customers, not those". Creates the group. Rules are optional: leave them out for a hand-picked list, or store a rule document and let the recompute keep the membership up to date. The \`code\` is what other apps point at, so pick it deliberately. \`code\` is the only field a create cannot omit; everything else is optional or defaulted by the database. Two rows of this tenant may not share \`code\`.`)
  .option(`--code <code>`, `Stable identifier, unique per tenant — what other apps and integrations name the segment by. Free text, but lowercase with underscores is the convention every seeded vocabulary follows.`)
  .option(`--labels <labels>`, `Localized display names keyed by language tag. Null means nobody translated it and a client falls back to showing the code.`)
  .option(`--position <position>`, `Sort order in the cockpit, ascending. Ties fall back to insertion order. Default 0.`, parseInteger)
  .option(`--rule-match <rule-match>`, `How the conditions combine: 'all' (default) is AND, 'any' is OR. Null means the same as 'all'.`)
  .option(`--rules <rules>`, `The selector that decides membership, stored verbatim. Null means the segment is manual-only. The same rule language product categories use, evaluated over organization columns, \`setting:<key>\` entries and the organization_metrics projection — so 'no order in 365 days' is expressible without joining the orders app. Null makes the segment manual-only. Changing it does not move a single membership — run the recompute.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, labels, position, ruleMatch, rules } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments`;
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
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
        }
        if (rules !== undefined) {
          _payload[`rules`] = resolveBodyParam(rules);
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
registerPromptSpecs(customersSegments.commands.at(-1)!, createSpecs, { method: "post" });
const rulesRecomputeAllSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
customersSegments
  .command(`rules-recompute-all`)
  .description(`Same sync as the single-segment recompute, applied to every segment with non-null rules. A failing segment is reported in its result entry instead of aborting the run. The run shares one budget: a segment that does not fit reports done:false (or skipped:true) and keeps rules_computed_at null, so the next call resumes it from its own data. Repeat until the top-level done is true.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { body } = await promptForMissing(
          _options,
          rulesRecomputeAllSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/rules/recompute-all`;
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
registerPromptSpecs(customersSegments.commands.at(-1)!, rulesRecomputeAllSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The segment to delete.", type: "string", required: true, resource: { listPath: "/customers/segments", hasLimit: true } },
];
customersSegments
  .command(`delete`)
  .description(`A segment is a named group of ORGANIZATIONS — never of people — built by hand, by rule, or both at once. It is what a price list, a campaign or a shipping option is pointed at when the answer is "these customers, not those". Removes the segment. Anything in another app that points at its \`code\` — a price list, a campaign — is left pointing at nothing, because no app may hold a foreign key into another (ADR-0055). Deleting one takes every \`segment_members\` row that points at it with it — the foreign keys decide, not this route.`)
  .option(`--id <id>`, `The segment to delete.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`customers-segments delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customersSegments.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The segment to read.", type: "string", required: true, resource: { listPath: "/customers/segments", hasLimit: true } },
];
customersSegments
  .command(`get`)
  .description(`A segment is a named group of ORGANIZATIONS — never of people — built by hand, by rule, or both at once. It is what a price list, a campaign or a shipping option is pointed at when the answer is "these customers, not those". One segment by id, including the rule document it carries. A segment with no rules is hand-picked and completely valid.`)
  .option(`--id <id>`, `The segment to read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customersSegments.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The segment to update.", type: "string", required: true, resource: { listPath: "/customers/segments", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Stable identifier, unique per tenant — what other apps and integrations name the segment by. Free text, but lowercase with underscores is the convention every seeded vocabulary follows.", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by language tag. Null means nobody translated it and a client falls back to showing the code.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in the cockpit, ascending. Ties fall back to insertion order. Default 0.", type: "integer", required: false },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", description: "How the conditions combine: 'all' (default) is AND, 'any' is OR. Null means the same as 'all'.", type: "string", required: false, enum: ["all","any"] },
  { key: "rules", option: "--rules <rules>", name: "rules", description: "The selector that decides membership, stored verbatim. Null means the segment is manual-only. The same rule language product categories use, evaluated over organization columns, `setting:<key>` entries and the organization_metrics projection — so 'no order in 365 days' is expressible without joining the orders app. Null makes the segment manual-only. Changing it does not move a single membership — run the recompute.", type: "object", required: false },
];
customersSegments
  .command(`update`)
  .description(`A segment is a named group of ORGANIZATIONS — never of people — built by hand, by rule, or both at once. It is what a price list, a campaign or a shipping option is pointed at when the answer is "these customers, not those". A partial update — send only what changes. Editing the rules does NOT re-evaluate them: that is \`POST /customers/segments/{segment_id}/rules/recompute\`, so a half-typed rule never silently empties a live segment. Two rows of this tenant may not share \`code\`.`)
  .option(`--id <id>`, `The segment to update.`)
  .option(`--code <code>`, `Stable identifier, unique per tenant — what other apps and integrations name the segment by. Free text, but lowercase with underscores is the convention every seeded vocabulary follows.`)
  .option(`--labels <labels>`, `Localized display names keyed by language tag. Null means nobody translated it and a client falls back to showing the code.`)
  .option(`--position <position>`, `Sort order in the cockpit, ascending. Ties fall back to insertion order. Default 0.`, parseInteger)
  .option(`--rule-match <rule-match>`, `How the conditions combine: 'all' (default) is AND, 'any' is OR. Null means the same as 'all'.`)
  .option(`--rules <rules>`, `The selector that decides membership, stored verbatim. Null means the segment is manual-only. The same rule language product categories use, evaluated over organization columns, \`setting:<key>\` entries and the organization_metrics projection — so 'no order in 365 days' is expressible without joining the orders app. Null makes the segment manual-only. Changing it does not move a single membership — run the recompute.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, labels, position, ruleMatch, rules } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/{id}`.replace(`{id}`, id);
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
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
        }
        if (rules !== undefined) {
          _payload[`rules`] = resolveBodyParam(rules);
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
registerPromptSpecs(customersSegments.commands.at(-1)!, updateSpecs, { method: "put" });
const rulesPreviewSpecs: PromptSpec[] = [
  { key: "segmentId", option: "--segment-id <segment-id>", name: "segment_id", description: "The segment the preview is filed under. Its stored rules are NOT read — the rule comes from the body — but it has to exist.", type: "string", required: true, resource: { listPath: "/customers/segments", hasLimit: true } },
  { key: "conditions", option: "--conditions [conditions...]", name: "conditions", description: "The conditions, combined by `rule_match`. At least one, at most 25.", type: "array", required: true },
  { key: "ruleMatch", option: "--rule-match <rule-match>", name: "rule_match", description: "How the conditions combine. Default 'all'.", type: "string", required: false, enum: ["all","any"] },
  { key: "target", option: "--target <target>", name: "target", description: "Only 'organizations' is supported; any other value is rejected. A segment groups COMPANIES — the people are reached through them.", type: "string", required: false, enum: ["organizations"] },
];
customersSegments
  .command(`rules-preview`)
  .description(`A dry run: it answers how many organizations the rule would select, with a handful of them by name, and writes nothing at all. Evaluates the rule document in the REQUEST BODY (not the stored segments.rules), so the cockpit can preview an unsaved rule. Costs a single count query for the common single-query rule; 'any' rules and rules repeating a column are combined in the app and capped at 5000 ids, in which case 'capped' is true and 'count' is a LOWER bound. Membership is never touched.`)
  .option(`--segment-id <segment-id>`, `The segment the preview is filed under. Its stored rules are NOT read — the rule comes from the body — but it has to exist.`)
  .option(`--conditions [conditions...]`, `The conditions, combined by \`rule_match\`. At least one, at most 25.`)
  .option(`--rule-match <rule-match>`, `How the conditions combine. Default 'all'.`)
  .option(`--target <target>`, `Only 'organizations' is supported; any other value is rejected. A segment groups COMPANIES — the people are reached through them.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { segmentId, conditions, ruleMatch, target } = await promptForMissing(
          _options,
          rulesPreviewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/{segment_id}/rules/preview`.replace(`{segment_id}`, segmentId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (conditions !== undefined) {
          _payload[`conditions`] = conditions;
        }
        if (ruleMatch !== undefined) {
          _payload[`rule_match`] = ruleMatch;
        }
        if (target !== undefined) {
          _payload[`target`] = target;
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
registerPromptSpecs(customersSegments.commands.at(-1)!, rulesPreviewSpecs, { method: "post" });
const rulesRecomputeSpecs: PromptSpec[] = [
  { key: "segmentId", option: "--segment-id <segment-id>", name: "segment_id", description: "The segment whose stored rules are evaluated.", type: "string", required: true, resource: { listPath: "/customers/segments", hasLimit: true } },
  { key: "cursor", option: "--cursor <cursor>", name: "cursor", description: "Continuation token from a previous response — the id of the last organization the pass touched. Omit to resume or start automatically; pass null to force a restart from the beginning.", type: "string", required: false },
];
customersSegments
  .command(`rules-recompute`)
  .description(`Evaluates segments.rules (NOT the request body), then inserts the newly matching organizations as source='rule' rows and deletes the rule rows that no longer match. Manual (source='manual') memberships are never inserted, deleted or shadowed. Bounded by a wall-clock budget below the gateway's upstream timeout: when 'done' is false, POST again with the returned 'cursor' until it is true. added/removed/processed count THIS call only. Omitting 'cursor' resumes an unfinished pass and starts a fresh one after a completed pass; an explicit null always restarts. segments.rules_computed_at is stamped only when the pass completes.`)
  .option(`--segment-id <segment-id>`, `The segment whose stored rules are evaluated.`)
  .option(`--cursor <cursor>`, `Continuation token from a previous response — the id of the last organization the pass touched. Omit to resume or start automatically; pass null to force a restart from the beginning.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { segmentId, cursor } = await promptForMissing(
          _options,
          rulesRecomputeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/segments/{segment_id}/rules/recompute`.replace(`{segment_id}`, segmentId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (cursor !== undefined) {
          _payload[`cursor`] = cursor;
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
registerPromptSpecs(customersSegments.commands.at(-1)!, rulesRecomputeSpecs, { method: "post" });
