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

export const procurement = new Command("procurement")
  .description(
    commandDescriptions["procurement"] ??
      `Commerce Studio Procurement App — the approval-workflow half of B2B procurement (ADR-0097). Owns approval rules (global or cost-centre-scoped), purchase requests (order-shaped, with their own pending→approved→ordered lifecycle) and pending approvals. Cart → Purchase Request → Order, with the Order created only at final approval; spend with no applicable rule goes Cart → Order directly. Authoritative checkout-submit entry for approval-enabled tenants. Calls the cost-centers app for budget-aware condition evaluation and budget movement, and the orders app to create the placed Order. Ports the approval-workflow parts of IntelliShop V8 module-booking-accounts.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const approvalRulesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
procurement
  .command(`approval-rules-list`)
  .description(`List ApprovalRule`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          approvalRulesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/approval-rules`;
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
registerPromptSpecs(procurement.commands.at(-1)!, approvalRulesListSpecs, { method: "get" });
const approvalRulesCreateSpecs: PromptSpec[] = [
  { key: "condition", option: "--condition <condition>", name: "condition", type: "string", required: true, enum: ["always","constantLimit","availableBudget","personalLimit","contactHasRole","contactMissingPermission"] },
  { key: "effect", option: "--effect <effect>", name: "effect", type: "string", required: true, enum: ["pendingOrder","prevent","sendEmail"] },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", type: "boolean", required: false },
  { key: "approverContactId", option: "--approver-contact-id <approver-contact-id>", name: "approver_contact_id", type: "string", required: false },
  { key: "approverRole", option: "--approver-role <approver-role>", name: "approver_role", type: "string", required: false },
  { key: "approverType", option: "--approver-type <approver-type>", name: "approver_type", type: "string", required: false, enum: ["contact","role","default"] },
  { key: "conditionParameters", option: "--condition-parameters <condition-parameters>", name: "condition_parameters", type: "object", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", type: "string", required: false },
  { key: "effectParameters", option: "--effect-parameters <effect-parameters>", name: "effect_parameters", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "sequence", option: "--sequence <sequence>", name: "sequence", type: "integer", required: false },
  { key: "showCondition", option: "--show-condition <show-condition>", name: "show_condition", type: "boolean", required: false },
];
procurement
  .command(`approval-rules-create`)
  .description(`Create a approval rule`)
  .option(`--condition <condition>`, ``)
  .option(`--effect <effect>`, ``)
  .option(`--name <name>`, ``)
  .option(
    `--active [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--approver-contact-id <approver-contact-id>`, ``)
  .option(`--approver-role <approver-role>`, ``)
  .option(`--approver-type <approver-type>`, ``)
  .option(`--condition-parameters <condition-parameters>`, ``)
  .option(`--cost-center-id <cost-center-id>`, ``)
  .option(`--effect-parameters <effect-parameters>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--sequence <sequence>`, ``, parseInteger)
  .option(
    `--show-condition [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { condition, effect, name, active, approverContactId, approverRole, approverType, conditionParameters, costCenterId, effectParameters, metadata, sequence, showCondition } = await promptForMissing(
          _options,
          approvalRulesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/approval-rules`;
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
        if (approverContactId !== undefined) {
          _payload[`approver_contact_id`] = approverContactId;
        }
        if (approverRole !== undefined) {
          _payload[`approver_role`] = approverRole;
        }
        if (approverType !== undefined) {
          _payload[`approver_type`] = approverType;
        }
        if (condition !== undefined) {
          _payload[`condition`] = condition;
        }
        if (conditionParameters !== undefined) {
          _payload[`condition_parameters`] = resolveBodyParam(conditionParameters);
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (effect !== undefined) {
          _payload[`effect`] = effect;
        }
        if (effectParameters !== undefined) {
          _payload[`effect_parameters`] = resolveBodyParam(effectParameters);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (sequence !== undefined) {
          _payload[`sequence`] = sequence;
        }
        if (showCondition !== undefined) {
          _payload[`show_condition`] = showCondition;
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
registerPromptSpecs(procurement.commands.at(-1)!, approvalRulesCreateSpecs, { method: "post" });
const approvalRulesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/approval-rules", hasLimit: true } },
];
procurement
  .command(`approval-rules-delete`)
  .description(`Delete a approval rule`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          approvalRulesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`procurement approval-rules-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/procurement/approval-rules/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, approvalRulesDeleteSpecs, { method: "delete", destructive: true });
const approvalRulesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/approval-rules", hasLimit: true } },
];
procurement
  .command(`approval-rules-get`)
  .description(`Read one approval rule`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          approvalRulesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/approval-rules/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, approvalRulesGetSpecs, { method: "get" });
const approvalRulesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/approval-rules", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", type: "boolean", required: false },
  { key: "approverContactId", option: "--approver-contact-id <approver-contact-id>", name: "approver_contact_id", type: "string", required: false },
  { key: "approverRole", option: "--approver-role <approver-role>", name: "approver_role", type: "string", required: false },
  { key: "approverType", option: "--approver-type <approver-type>", name: "approver_type", type: "string", required: false, enum: ["contact","role","default"] },
  { key: "condition", option: "--condition <condition>", name: "condition", type: "string", required: false, enum: ["always","constantLimit","availableBudget","personalLimit","contactHasRole","contactMissingPermission"] },
  { key: "conditionParameters", option: "--condition-parameters <condition-parameters>", name: "condition_parameters", type: "object", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", type: "string", required: false },
  { key: "effect", option: "--effect <effect>", name: "effect", type: "string", required: false, enum: ["pendingOrder","prevent","sendEmail"] },
  { key: "effectParameters", option: "--effect-parameters <effect-parameters>", name: "effect_parameters", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "sequence", option: "--sequence <sequence>", name: "sequence", type: "integer", required: false },
  { key: "showCondition", option: "--show-condition <show-condition>", name: "show_condition", type: "boolean", required: false },
];
procurement
  .command(`approval-rules-update`)
  .description(`Update a approval rule`)
  .option(`--id <id>`, ``)
  .option(
    `--active [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--approver-contact-id <approver-contact-id>`, ``)
  .option(`--approver-role <approver-role>`, ``)
  .option(`--approver-type <approver-type>`, ``)
  .option(`--condition <condition>`, ``)
  .option(`--condition-parameters <condition-parameters>`, ``)
  .option(`--cost-center-id <cost-center-id>`, ``)
  .option(`--effect <effect>`, ``)
  .option(`--effect-parameters <effect-parameters>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, ``)
  .option(`--sequence <sequence>`, ``, parseInteger)
  .option(
    `--show-condition [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, approverContactId, approverRole, approverType, condition, conditionParameters, costCenterId, effect, effectParameters, metadata, name, sequence, showCondition } = await promptForMissing(
          _options,
          approvalRulesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/approval-rules/{id}`.replace(`{id}`, id);
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
        if (approverContactId !== undefined) {
          _payload[`approver_contact_id`] = approverContactId;
        }
        if (approverRole !== undefined) {
          _payload[`approver_role`] = approverRole;
        }
        if (approverType !== undefined) {
          _payload[`approver_type`] = approverType;
        }
        if (condition !== undefined) {
          _payload[`condition`] = condition;
        }
        if (conditionParameters !== undefined) {
          _payload[`condition_parameters`] = resolveBodyParam(conditionParameters);
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (effect !== undefined) {
          _payload[`effect`] = effect;
        }
        if (effectParameters !== undefined) {
          _payload[`effect_parameters`] = resolveBodyParam(effectParameters);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (sequence !== undefined) {
          _payload[`sequence`] = sequence;
        }
        if (showCondition !== undefined) {
          _payload[`show_condition`] = showCondition;
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
registerPromptSpecs(procurement.commands.at(-1)!, approvalRulesUpdateSpecs, { method: "put" });
const budgetReleasesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
procurement
  .command(`budget-releases-list`)
  .description(`List BudgetRelease`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          budgetReleasesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/budget-releases`;
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
registerPromptSpecs(procurement.commands.at(-1)!, budgetReleasesListSpecs, { method: "get" });
const budgetReleasesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/budget-releases", hasLimit: true } },
];
procurement
  .command(`budget-releases-get`)
  .description(`Read one budget release`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          budgetReleasesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/budget-releases/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, budgetReleasesGetSpecs, { method: "get" });
const budgetReleasesRetrySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/budget-releases", hasLimit: true } },
];
procurement
  .command(`budget-releases-retry`)
  .description(`Retry giving back a cancelled order's budget — from pending or refused (409 otherwise)`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          budgetReleasesRetrySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/budget-releases/{id}/retry`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, budgetReleasesRetrySpecs, { method: "post" });
const budgetReleasesSettleSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/budget-releases", hasLimit: true } },
  { key: "note", option: "--note <note>", name: "note", description: "Required free-text reason, kept on the record.", type: "string", required: true },
];
procurement
  .command(`budget-releases-settle`)
  .description(`Settle a refused budget release by hand, with a note — the budget then stays booked for that order (administrator; 409 unless refused)`)
  .option(`--id <id>`, ``)
  .option(`--note <note>`, `Required free-text reason, kept on the record.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, note } = await promptForMissing(
          _options,
          budgetReleasesSettleSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/budget-releases/{id}/settle`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (note !== undefined) {
          _payload[`note`] = note;
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
registerPromptSpecs(procurement.commands.at(-1)!, budgetReleasesSettleSpecs, { method: "post" });
const directOrdersListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
procurement
  .command(`direct-orders-list`)
  .description(`List DirectOrder`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          directOrdersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/direct-orders`;
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
registerPromptSpecs(procurement.commands.at(-1)!, directOrdersListSpecs, { method: "get" });
const directOrdersGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/direct-orders", hasLimit: true } },
];
procurement
  .command(`direct-orders-get`)
  .description(`Read one direct order`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          directOrdersGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/direct-orders/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, directOrdersGetSpecs, { method: "get" });
const directOrdersCommitSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/direct-orders", hasLimit: true } },
];
procurement
  .command(`direct-orders-commit`)
  .description(`Retry a direct order's budget commit from the movement recorded at submit — from commit_pending or commit_refused (409 otherwise)`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          directOrdersCommitSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/direct-orders/{id}/commit`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, directOrdersCommitSpecs, { method: "post" });
const directOrdersSettleSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/direct-orders", hasLimit: true } },
  { key: "note", option: "--note <note>", name: "note", description: "Required free-text reason, kept on the record.", type: "string", required: true },
];
procurement
  .command(`direct-orders-settle`)
  .description(`Settle a refused budget commit by hand, with a note — the budget is then never booked for that order (administrator; 409 unless commit_refused)`)
  .option(`--id <id>`, ``)
  .option(`--note <note>`, `Required free-text reason, kept on the record.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, note } = await promptForMissing(
          _options,
          directOrdersSettleSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/direct-orders/{id}/settle`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (note !== undefined) {
          _payload[`note`] = note;
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
registerPromptSpecs(procurement.commands.at(-1)!, directOrdersSettleSpecs, { method: "post" });
const pendingApprovalsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
procurement
  .command(`pending-approvals-list`)
  .description(`List PendingApproval`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          pendingApprovalsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/pending-approvals`;
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
registerPromptSpecs(procurement.commands.at(-1)!, pendingApprovalsListSpecs, { method: "get" });
const pendingApprovalsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/pending-approvals", hasLimit: true } },
];
procurement
  .command(`pending-approvals-get`)
  .description(`Read one pending approval`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          pendingApprovalsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/pending-approvals/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, pendingApprovalsGetSpecs, { method: "get" });
const pendingApprovalsApproveSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/pending-approvals", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Free-text note (decline/cancel reason, approval remark).", type: "string", required: false },
];
procurement
  .command(`pending-approvals-approve`)
  .description(`Approve one pending approval layer; unlocks the next, or approves the PR when all chains clear`)
  .option(`--id <id>`, ``)
  .option(`--reason <reason>`, `Free-text note (decline/cancel reason, approval remark).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          pendingApprovalsApproveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/pending-approvals/{id}/approve`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, pendingApprovalsApproveSpecs, { method: "post" });
const pendingApprovalsDeclineSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/pending-approvals", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Free-text note (decline/cancel reason, approval remark).", type: "string", required: false },
];
procurement
  .command(`pending-approvals-decline`)
  .description(`Decline one pending approval — terminates the whole purchase request and withdraws its budget`)
  .option(`--id <id>`, ``)
  .option(`--reason <reason>`, `Free-text note (decline/cancel reason, approval remark).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          pendingApprovalsDeclineSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/pending-approvals/{id}/decline`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, pendingApprovalsDeclineSpecs, { method: "post" });
const purchaseRequestEventsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
procurement
  .command(`purchase-request-events-list`)
  .description(`List PurchaseRequestEvent`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          purchaseRequestEventsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-request-events`;
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestEventsListSpecs, { method: "get" });
const purchaseRequestEventsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/purchase-request-events", hasLimit: true } },
];
procurement
  .command(`purchase-request-events-get`)
  .description(`Read one purchase request outcome event`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          purchaseRequestEventsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-request-events/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestEventsGetSpecs, { method: "get" });
const purchaseRequestItemsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
procurement
  .command(`purchase-request-items-list`)
  .description(`List PurchaseRequestItem`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          purchaseRequestItemsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-request-items`;
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestItemsListSpecs, { method: "get" });
const purchaseRequestItemsCreateSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "purchaseRequestId", option: "--purchase-request-id <purchase-request-id>", name: "purchase_request_id", type: "string", required: true },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", type: "number", required: true },
  { key: "configuration", option: "--configuration <configuration>", name: "configuration", type: "object", required: false },
  { key: "costCenter", option: "--cost-center <cost-center>", name: "cost_center", type: "string", required: false },
  { key: "lineTotal", option: "--line-total <line-total>", name: "line_total", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "positionText", option: "--position-text <position-text>", name: "position_text", type: "string", required: false },
  { key: "product", option: "--product <product>", name: "product", type: "object", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", type: "string", required: false },
  { key: "taxAmount", option: "--tax-amount <tax-amount>", name: "tax_amount", type: "number", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", type: "number", required: false },
  { key: "type", option: "--type <type>", name: "type", type: "string", required: false, enum: ["product","configuration","custom"] },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", type: "number", required: false },
  { key: "userData", option: "--user-data <user-data>", name: "user_data", type: "object", required: false },
];
procurement
  .command(`purchase-request-items-create`)
  .description(`Create a purchase request item`)
  .option(`--name <name>`, ``)
  .option(`--purchase-request-id <purchase-request-id>`, ``)
  .option(`--quantity <quantity>`, ``, parseInteger)
  .option(`--configuration <configuration>`, ``)
  .option(`--cost-center <cost-center>`, ``)
  .option(`--line-total <line-total>`, ``, parseInteger)
  .option(`--metadata <metadata>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--position-text <position-text>`, ``)
  .option(`--product <product>`, ``)
  .option(`--product-id <product-id>`, ``)
  .option(`--sku <sku>`, ``)
  .option(`--tax-amount <tax-amount>`, ``, parseInteger)
  .option(`--tax-rate <tax-rate>`, ``, parseInteger)
  .option(`--type <type>`, ``)
  .option(`--unit <unit>`, ``)
  .option(`--unit-price <unit-price>`, ``, parseInteger)
  .option(`--user-data <user-data>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, purchaseRequestId, quantity, configuration, costCenter, lineTotal, metadata, position, positionText, product, productId, sku, taxAmount, taxRate, type, unit, unitPrice, userData } = await promptForMissing(
          _options,
          purchaseRequestItemsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-request-items`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (configuration !== undefined) {
          _payload[`configuration`] = resolveBodyParam(configuration);
        }
        if (costCenter !== undefined) {
          _payload[`cost_center`] = costCenter;
        }
        if (lineTotal !== undefined) {
          _payload[`line_total`] = lineTotal;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (positionText !== undefined) {
          _payload[`position_text`] = positionText;
        }
        if (product !== undefined) {
          _payload[`product`] = resolveBodyParam(product);
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (purchaseRequestId !== undefined) {
          _payload[`purchase_request_id`] = purchaseRequestId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (taxAmount !== undefined) {
          _payload[`tax_amount`] = taxAmount;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unitPrice !== undefined) {
          _payload[`unit_price`] = unitPrice;
        }
        if (userData !== undefined) {
          _payload[`user_data`] = resolveBodyParam(userData);
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestItemsCreateSpecs, { method: "post" });
const purchaseRequestItemsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/purchase-request-items", hasLimit: true } },
];
procurement
  .command(`purchase-request-items-delete`)
  .description(`Delete a purchase request item`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          purchaseRequestItemsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`procurement purchase-request-items-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-request-items/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestItemsDeleteSpecs, { method: "delete", destructive: true });
const purchaseRequestItemsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/purchase-request-items", hasLimit: true } },
];
procurement
  .command(`purchase-request-items-get`)
  .description(`Read one purchase request item`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          purchaseRequestItemsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-request-items/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestItemsGetSpecs, { method: "get" });
const purchaseRequestItemsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/purchase-request-items", hasLimit: true } },
  { key: "configuration", option: "--configuration <configuration>", name: "configuration", type: "object", required: false },
  { key: "costCenter", option: "--cost-center <cost-center>", name: "cost_center", type: "string", required: false },
  { key: "lineTotal", option: "--line-total <line-total>", name: "line_total", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "positionText", option: "--position-text <position-text>", name: "position_text", type: "string", required: false },
  { key: "product", option: "--product <product>", name: "product", type: "object", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: false },
  { key: "purchaseRequestId", option: "--purchase-request-id <purchase-request-id>", name: "purchase_request_id", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", type: "string", required: false },
  { key: "taxAmount", option: "--tax-amount <tax-amount>", name: "tax_amount", type: "number", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", type: "number", required: false },
  { key: "type", option: "--type <type>", name: "type", type: "string", required: false, enum: ["product","configuration","custom"] },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", type: "number", required: false },
  { key: "userData", option: "--user-data <user-data>", name: "user_data", type: "object", required: false },
];
procurement
  .command(`purchase-request-items-update`)
  .description(`Update a purchase request item`)
  .option(`--id <id>`, ``)
  .option(`--configuration <configuration>`, ``)
  .option(`--cost-center <cost-center>`, ``)
  .option(`--line-total <line-total>`, ``, parseInteger)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--position-text <position-text>`, ``)
  .option(`--product <product>`, ``)
  .option(`--product-id <product-id>`, ``)
  .option(`--purchase-request-id <purchase-request-id>`, ``)
  .option(`--quantity <quantity>`, ``, parseInteger)
  .option(`--sku <sku>`, ``)
  .option(`--tax-amount <tax-amount>`, ``, parseInteger)
  .option(`--tax-rate <tax-rate>`, ``, parseInteger)
  .option(`--type <type>`, ``)
  .option(`--unit <unit>`, ``)
  .option(`--unit-price <unit-price>`, ``, parseInteger)
  .option(`--user-data <user-data>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, configuration, costCenter, lineTotal, metadata, name, position, positionText, product, productId, purchaseRequestId, quantity, sku, taxAmount, taxRate, type, unit, unitPrice, userData } = await promptForMissing(
          _options,
          purchaseRequestItemsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-request-items/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (configuration !== undefined) {
          _payload[`configuration`] = resolveBodyParam(configuration);
        }
        if (costCenter !== undefined) {
          _payload[`cost_center`] = costCenter;
        }
        if (lineTotal !== undefined) {
          _payload[`line_total`] = lineTotal;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (positionText !== undefined) {
          _payload[`position_text`] = positionText;
        }
        if (product !== undefined) {
          _payload[`product`] = resolveBodyParam(product);
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (purchaseRequestId !== undefined) {
          _payload[`purchase_request_id`] = purchaseRequestId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (taxAmount !== undefined) {
          _payload[`tax_amount`] = taxAmount;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unitPrice !== undefined) {
          _payload[`unit_price`] = unitPrice;
        }
        if (userData !== undefined) {
          _payload[`user_data`] = resolveBodyParam(userData);
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestItemsUpdateSpecs, { method: "put" });
const purchaseRequestsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
procurement
  .command(`purchase-requests-list`)
  .description(`List PurchaseRequest`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          purchaseRequestsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-requests`;
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestsListSpecs, { method: "get" });
const purchaseRequestsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/purchase-requests", hasLimit: true } },
];
procurement
  .command(`purchase-requests-get`)
  .description(`Read one purchase request`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          purchaseRequestsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-requests/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestsGetSpecs, { method: "get" });
const purchaseRequestsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/purchase-requests", hasLimit: true } },
  { key: "billingAddress", option: "--billing-address <billing-address>", name: "billing_address", type: "object", required: false },
  { key: "buyer", option: "--buyer <buyer>", name: "buyer", type: "object", required: false },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", type: "string", required: false },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", type: "string", required: false },
  { key: "customerOrderNumber", option: "--customer-order-number <customer-order-number>", name: "customer_order_number", type: "string", required: false },
  { key: "externalRef", option: "--external-ref <external-ref>", name: "external_ref", type: "string", required: false },
  { key: "grandTotal", option: "--grand-total <grand-total>", name: "grand_total", type: "number", required: false },
  { key: "itemCount", option: "--item-count <item-count>", name: "item_count", type: "integer", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "number", option: "--number <number>", name: "number", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
  { key: "payment", option: "--payment <payment>", name: "payment", type: "object", required: false },
  { key: "shipping", option: "--shipping <shipping>", name: "shipping", type: "object", required: false },
  { key: "shippingAddress", option: "--shipping-address <shipping-address>", name: "shipping_address", type: "object", required: false },
  { key: "shippingTotal", option: "--shipping-total <shipping-total>", name: "shipping_total", type: "number", required: false },
  { key: "subtotal", option: "--subtotal <subtotal>", name: "subtotal", type: "number", required: false },
  { key: "taxTotal", option: "--tax-total <tax-total>", name: "tax_total", type: "number", required: false },
  { key: "userData", option: "--user-data <user-data>", name: "user_data", type: "object", required: false },
];
procurement
  .command(`purchase-requests-update`)
  .description(`Update a purchase request`)
  .option(`--id <id>`, ``)
  .option(`--billing-address <billing-address>`, ``)
  .option(`--buyer <buyer>`, ``)
  .option(`--cart-id <cart-id>`, ``)
  .option(`--channel-id <channel-id>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--currency <currency>`, ``)
  .option(`--customer-order-number <customer-order-number>`, ``)
  .option(`--external-ref <external-ref>`, ``)
  .option(`--grand-total <grand-total>`, ``, parseInteger)
  .option(`--item-count <item-count>`, ``, parseInteger)
  .option(`--metadata <metadata>`, ``)
  .option(`--number <number>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--payment <payment>`, ``)
  .option(`--shipping <shipping>`, ``)
  .option(`--shipping-address <shipping-address>`, ``)
  .option(`--shipping-total <shipping-total>`, ``, parseInteger)
  .option(`--subtotal <subtotal>`, ``, parseInteger)
  .option(`--tax-total <tax-total>`, ``, parseInteger)
  .option(`--user-data <user-data>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, billingAddress, buyer, cartId, channelId, contactId, currency, customerOrderNumber, externalRef, grandTotal, itemCount, metadata, number, organizationId, payment, shipping, shippingAddress, shippingTotal, subtotal, taxTotal, userData } = await promptForMissing(
          _options,
          purchaseRequestsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-requests/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (billingAddress !== undefined) {
          _payload[`billing_address`] = resolveBodyParam(billingAddress);
        }
        if (buyer !== undefined) {
          _payload[`buyer`] = resolveBodyParam(buyer);
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (customerOrderNumber !== undefined) {
          _payload[`customer_order_number`] = customerOrderNumber;
        }
        if (externalRef !== undefined) {
          _payload[`external_ref`] = externalRef;
        }
        if (grandTotal !== undefined) {
          _payload[`grand_total`] = grandTotal;
        }
        if (itemCount !== undefined) {
          _payload[`item_count`] = itemCount;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (number !== undefined) {
          _payload[`number`] = number;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (payment !== undefined) {
          _payload[`payment`] = resolveBodyParam(payment);
        }
        if (shipping !== undefined) {
          _payload[`shipping`] = resolveBodyParam(shipping);
        }
        if (shippingAddress !== undefined) {
          _payload[`shipping_address`] = resolveBodyParam(shippingAddress);
        }
        if (shippingTotal !== undefined) {
          _payload[`shipping_total`] = shippingTotal;
        }
        if (subtotal !== undefined) {
          _payload[`subtotal`] = subtotal;
        }
        if (taxTotal !== undefined) {
          _payload[`tax_total`] = taxTotal;
        }
        if (userData !== undefined) {
          _payload[`user_data`] = resolveBodyParam(userData);
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestsUpdateSpecs, { method: "put" });
const purchaseRequestsApproveSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/purchase-requests", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Free-text note (decline/cancel reason, approval remark).", type: "string", required: false },
];
procurement
  .command(`purchase-requests-approve`)
  .description(`Super-approve — clear all outstanding approval layers at once and drive the PR to ordered`)
  .option(`--id <id>`, ``)
  .option(`--reason <reason>`, `Free-text note (decline/cancel reason, approval remark).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          purchaseRequestsApproveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-requests/{id}/approve`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestsApproveSpecs, { method: "post" });
const purchaseRequestsCancelSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/purchase-requests", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Free-text note (decline/cancel reason, approval remark).", type: "string", required: false },
];
procurement
  .command(`purchase-requests-cancel`)
  .description(`Cancel a pending purchase request (admin) and withdraw its budget`)
  .option(`--id <id>`, ``)
  .option(`--reason <reason>`, `Free-text note (decline/cancel reason, approval remark).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          purchaseRequestsCancelSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-requests/{id}/cancel`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestsCancelSpecs, { method: "post" });
const purchaseRequestsOrderSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/procurement/purchase-requests", hasLimit: true } },
];
procurement
  .command(`purchase-requests-order`)
  .description(`Retry-safe approved→ordered: idempotently place the Order and confirm the budget`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          purchaseRequestsOrderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/purchase-requests/{id}/order`.replace(`{id}`, id);
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
registerPromptSpecs(procurement.commands.at(-1)!, purchaseRequestsOrderSpecs, { method: "post" });
const reconcileSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Records examined per status (default 50, max 200).", type: "integer", required: false },
];
procurement
  .command(`reconcile`)
  .description(`Reconciliation sweep — complete stuck approved→ordered promotions, release orphaned budget reservations, record any outcome whose write failed, finish direct orders whose budget commit is owed, and retry budget releases of cancelled orders`)
  .option(`--limit <limit>`, `Records examined per status (default 50, max 200).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit } = await promptForMissing(
          _options,
          reconcileSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/reconcile`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (limit !== undefined) {
          _payload[`limit`] = limit;
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
registerPromptSpecs(procurement.commands.at(-1)!, reconcileSpecs, { method: "post" });
const submitSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "Idempotency key — a re-submit for the same cart returns the existing PR/Order; a cart whose request was declined or cancelled is refused (409).", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", type: "array", required: true },
  { key: "billingAddress", option: "--billing-address <billing-address>", name: "billing_address", type: "object", required: false },
  { key: "buyer", option: "--buyer <buyer>", name: "buyer", type: "object", required: false },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the line amounts are stated in. It travels with every question and every movement put to cost-centers; a cost centre or personal limit holding another currency refuses the submission (409, outcome `currency_mismatch`). Omit to be read in the record's own currency.", type: "string", required: false },
  { key: "customerOrderNumber", option: "--customer-order-number <customer-order-number>", name: "customer_order_number", type: "string", required: false },
  { key: "externalRef", option: "--external-ref <external-ref>", name: "external_ref", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
  { key: "payment", option: "--payment <payment>", name: "payment", type: "object", required: false },
  { key: "shipping", option: "--shipping <shipping>", name: "shipping", type: "object", required: false },
  { key: "shippingAddress", option: "--shipping-address <shipping-address>", name: "shipping_address", type: "object", required: false },
  { key: "userData", option: "--user-data <user-data>", name: "user_data", type: "object", required: false },
];
procurement
  .command(`submit`)
  .description(`Authoritative checkout submit — evaluate approval rules and create a direct Order, a Purchase Request, or block (409)`)
  .option(`--cart-id <cart-id>`, `Idempotency key — a re-submit for the same cart returns the existing PR/Order; a cart whose request was declined or cancelled is refused (409).`)
  .option(`--items [items...]`, ``)
  .option(`--billing-address <billing-address>`, ``)
  .option(`--buyer <buyer>`, ``)
  .option(`--channel-id <channel-id>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code the line amounts are stated in. It travels with every question and every movement put to cost-centers; a cost centre or personal limit holding another currency refuses the submission (409, outcome \`currency_mismatch\`). Omit to be read in the record's own currency.`)
  .option(`--customer-order-number <customer-order-number>`, ``)
  .option(`--external-ref <external-ref>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--payment <payment>`, ``)
  .option(`--shipping <shipping>`, ``)
  .option(`--shipping-address <shipping-address>`, ``)
  .option(`--user-data <user-data>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, items, billingAddress, buyer, channelId, contactId, currency, customerOrderNumber, externalRef, metadata, organizationId, payment, shipping, shippingAddress, userData } = await promptForMissing(
          _options,
          submitSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/submit`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (billingAddress !== undefined) {
          _payload[`billing_address`] = resolveBodyParam(billingAddress);
        }
        if (buyer !== undefined) {
          _payload[`buyer`] = resolveBodyParam(buyer);
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (customerOrderNumber !== undefined) {
          _payload[`customer_order_number`] = customerOrderNumber;
        }
        if (externalRef !== undefined) {
          _payload[`external_ref`] = externalRef;
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (payment !== undefined) {
          _payload[`payment`] = resolveBodyParam(payment);
        }
        if (shipping !== undefined) {
          _payload[`shipping`] = resolveBodyParam(shipping);
        }
        if (shippingAddress !== undefined) {
          _payload[`shipping_address`] = resolveBodyParam(shippingAddress);
        }
        if (userData !== undefined) {
          _payload[`user_data`] = resolveBodyParam(userData);
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
registerPromptSpecs(procurement.commands.at(-1)!, submitSpecs, { method: "post" });
const submitCartSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart to check out. It must be active (409 `cart_not_active` otherwise); a re-submit answers the order or request already made for it.", type: "string", required: true },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", description: "The cost centre every line books to. A cart line names none, so without one no budget moves.", type: "string", required: false },
  { key: "customerOrderNumber", option: "--customer-order-number <customer-order-number>", name: "customer_order_number", type: "string", required: false },
];
procurement
  .command(`submit-cart`)
  .description(`Check out a stored cart by id — read it from carts and submit it as /procurement/submit does, then mark the cart ordered once an Order exists`)
  .option(`--cart-id <cart-id>`, `The cart to check out. It must be active (409 \`cart_not_active\` otherwise); a re-submit answers the order or request already made for it.`)
  .option(`--cost-center-id <cost-center-id>`, `The cost centre every line books to. A cart line names none, so without one no budget moves.`)
  .option(`--customer-order-number <customer-order-number>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, costCenterId, customerOrderNumber } = await promptForMissing(
          _options,
          submitCartSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/submit-cart`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (customerOrderNumber !== undefined) {
          _payload[`customer_order_number`] = customerOrderNumber;
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
registerPromptSpecs(procurement.commands.at(-1)!, submitCartSpecs, { method: "post" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
procurement
  .command(`vocabularies-list`)
  .description(`List the enums this app publishes, by name and title, without their values`)
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
          vocabulariesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/vocabularies`;
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
registerPromptSpecs(procurement.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Which vocabulary to read — the part after the dot in `procurement.<name>`.", type: "string", required: true, enum: ["approval-statuses","approver-types","budget-release-scopes","budget-release-statuses","direct-order-statuses","event-names","item-types","request-statuses","rule-conditions","rule-effects"], resource: { listPath: "/procurement/vocabularies", hasLimit: false } },
];
procurement
  .command(`vocabularies-get`)
  .description(`Read one vocabulary — every permitted value in constraint order, with its title and badge tone; 404 for a name that is not one`)
  .option(`--name <name>`, `Which vocabulary to read — the part after the dot in \`procurement.<name>\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          vocabulariesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/procurement/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(procurement.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
