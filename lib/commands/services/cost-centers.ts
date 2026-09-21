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

export const costCenters = new Command("cost-centers")
  .description(
    commandDescriptions["costCenters"] ??
      `Commerce Studio Cost Centers App — the money/data half of B2B procurement (ADR-0074). Cost centres (booking accounts) with restrictions and an accountable contact, budgets with a change LEDGER (sequential consumption, last budget may go negative), and per-contact personal spending limits. Has zero approval concept: the procurement app owns approval rules, purchase requests and the workflow, and calls this app for condition evaluation (the budget-aware availableBudget plus the per-contact personalLimit gate) and budget movement (reserve, adjusting a held reservation, confirm/withdraw/commit). Ports the cost-centre parts of IntelliShop V8 module-booking-accounts.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const budgetChangesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
costCenters
  .command(`budget-changes-list`)
  .description(`List BudgetChange`)
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
          budgetChangesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/budget-changes`;
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
registerPromptSpecs(costCenters.commands.at(-1)!, budgetChangesListSpecs, { method: "get" });
const budgetChangesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/budget-changes", hasLimit: true } },
];
costCenters
  .command(`budget-changes-get`)
  .description(`Read one budget change`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          budgetChangesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/budget-changes/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(costCenters.commands.at(-1)!, budgetChangesGetSpecs, { method: "get" });
const budgetsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
costCenters
  .command(`budgets-list`)
  .description(`List Budget`)
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
          budgetsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/budgets`;
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
registerPromptSpecs(costCenters.commands.at(-1)!, budgetsListSpecs, { method: "get" });
const budgetsCreateSpecs: PromptSpec[] = [
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "active", option: "--active <active>", name: "active", type: "boolean", required: false },
  { key: "initialValue", option: "--initial-value <initial-value>", name: "initial_value", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "periodLength", option: "--period-length <period-length>", name: "period_length", type: "integer", required: false },
  { key: "periodStart", option: "--period-start <period-start>", name: "period_start", type: "string", required: false },
  { key: "recurring", option: "--recurring <recurring>", name: "recurring", type: "boolean", required: false },
  { key: "sequence", option: "--sequence <sequence>", name: "sequence", type: "integer", required: false },
  { key: "takeover", option: "--takeover <takeover>", name: "takeover", type: "object", required: false },
];
costCenters
  .command(`budgets-create`)
  .description(`Create a budget`)
  .option(`--cost-center-id <cost-center-id>`, ``)
  .option(`--name <name>`, ``)
  .option(
    `--active [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--initial-value <initial-value>`, ``, parseInteger)
  .option(`--metadata <metadata>`, ``)
  .option(`--period-length <period-length>`, ``, parseInteger)
  .option(`--period-start <period-start>`, ``)
  .option(
    `--recurring [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--sequence <sequence>`, ``, parseInteger)
  .option(`--takeover <takeover>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { costCenterId, name, active, initialValue, metadata, periodLength, periodStart, recurring, sequence, takeover } = await promptForMissing(
          _options,
          budgetsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/budgets`;
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
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (initialValue !== undefined) {
          _payload[`initial_value`] = initialValue;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (periodLength !== undefined) {
          _payload[`period_length`] = periodLength;
        }
        if (periodStart !== undefined) {
          _payload[`period_start`] = periodStart;
        }
        if (recurring !== undefined) {
          _payload[`recurring`] = recurring;
        }
        if (sequence !== undefined) {
          _payload[`sequence`] = sequence;
        }
        if (takeover !== undefined) {
          _payload[`takeover`] = resolveBodyParam(takeover);
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
registerPromptSpecs(costCenters.commands.at(-1)!, budgetsCreateSpecs, { method: "post" });
const budgetsRolloverSpecs: PromptSpec[] = [
  { key: "today", option: "--today <today>", name: "today", type: "string", required: false },
];
costCenters
  .command(`budgets-rollover`)
  .description(`Run one budget period rollover pass (idempotent; a rolled period is skipped)`)
  .option(`--today <today>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { today } = await promptForMissing(
          _options,
          budgetsRolloverSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/budgets/rollover/run`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (today !== undefined) {
          _payload[`today`] = today;
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
registerPromptSpecs(costCenters.commands.at(-1)!, budgetsRolloverSpecs, { method: "post" });
const budgetsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/budgets", hasLimit: true } },
];
costCenters
  .command(`budgets-get`)
  .description(`Read one budget`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          budgetsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/budgets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(costCenters.commands.at(-1)!, budgetsGetSpecs, { method: "get" });
const budgetsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/budgets", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", type: "boolean", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", type: "string", required: false },
  { key: "initialValue", option: "--initial-value <initial-value>", name: "initial_value", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "periodLength", option: "--period-length <period-length>", name: "period_length", type: "integer", required: false },
  { key: "periodStart", option: "--period-start <period-start>", name: "period_start", type: "string", required: false },
  { key: "recurring", option: "--recurring <recurring>", name: "recurring", type: "boolean", required: false },
  { key: "sequence", option: "--sequence <sequence>", name: "sequence", type: "integer", required: false },
  { key: "takeover", option: "--takeover <takeover>", name: "takeover", type: "object", required: false },
];
costCenters
  .command(`budgets-update`)
  .description(`Update a budget`)
  .option(`--id <id>`, ``)
  .option(
    `--active [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--cost-center-id <cost-center-id>`, ``)
  .option(`--initial-value <initial-value>`, ``, parseInteger)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, ``)
  .option(`--period-length <period-length>`, ``, parseInteger)
  .option(`--period-start <period-start>`, ``)
  .option(
    `--recurring [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--sequence <sequence>`, ``, parseInteger)
  .option(`--takeover <takeover>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, costCenterId, initialValue, metadata, name, periodLength, periodStart, recurring, sequence, takeover } = await promptForMissing(
          _options,
          budgetsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/budgets/{id}`.replace(`{id}`, id);
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
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (initialValue !== undefined) {
          _payload[`initial_value`] = initialValue;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (periodLength !== undefined) {
          _payload[`period_length`] = periodLength;
        }
        if (periodStart !== undefined) {
          _payload[`period_start`] = periodStart;
        }
        if (recurring !== undefined) {
          _payload[`recurring`] = recurring;
        }
        if (sequence !== undefined) {
          _payload[`sequence`] = sequence;
        }
        if (takeover !== undefined) {
          _payload[`takeover`] = resolveBodyParam(takeover);
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
registerPromptSpecs(costCenters.commands.at(-1)!, budgetsUpdateSpecs, { method: "put" });
const budgetsAdjustSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/budgets", hasLimit: true } },
  { key: "actor", option: "--actor <actor>", name: "actor", type: "string", required: true },
  { key: "amount", option: "--amount <amount>", name: "amount", type: "number", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
  { key: "target", option: "--target <target>", name: "target", type: "number", required: false },
];
costCenters
  .command(`budgets-adjust`)
  .description(`Manually adjust a budget; appends a manual ledger row with an actor`)
  .option(`--id <id>`, ``)
  .option(`--actor <actor>`, ``)
  .option(`--amount <amount>`, ``, parseInteger)
  .option(`--currency <currency>`, `ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.`)
  .option(`--note <note>`, ``)
  .option(`--target <target>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, actor, amount, currency, note, target } = await promptForMissing(
          _options,
          budgetsAdjustSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/budgets/{id}/adjust`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (actor !== undefined) {
          _payload[`actor`] = actor;
        }
        if (amount !== undefined) {
          _payload[`amount`] = amount;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
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
registerPromptSpecs(costCenters.commands.at(-1)!, budgetsAdjustSpecs, { method: "post" });
const commitSpecs: PromptSpec[] = [
  { key: "allocations", option: "--allocations [allocations...]", name: "allocations", type: "array", required: true },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
];
costCenters
  .command(`commit`)
  .description(`Commit a direct order against budgets, no reservation (idempotent on order_id)`)
  .option(`--allocations [allocations...]`, ``)
  .option(`--order-id <order-id>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.`)
  .option(`--note <note>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { allocations, orderId, contactId, currency, note } = await promptForMissing(
          _options,
          commitSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/commit`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (allocations !== undefined) {
          _payload[`allocations`] = allocations;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
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
registerPromptSpecs(costCenters.commands.at(-1)!, commitSpecs, { method: "post" });
const confirmSpecs: PromptSpec[] = [
  { key: "purchaseRequestId", option: "--purchase-request-id <purchase-request-id>", name: "purchase_request_id", type: "string", required: true },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", type: "string", required: false },
];
costCenters
  .command(`confirm`)
  .description(`Confirm a purchase request reservation as an order (idempotent)`)
  .option(`--purchase-request-id <purchase-request-id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.`)
  .option(`--note <note>`, ``)
  .option(`--order-id <order-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { purchaseRequestId, currency, note, orderId } = await promptForMissing(
          _options,
          confirmSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/confirm`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (purchaseRequestId !== undefined) {
          _payload[`purchase_request_id`] = purchaseRequestId;
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
registerPromptSpecs(costCenters.commands.at(-1)!, confirmSpecs, { method: "post" });
const contactLimitsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
costCenters
  .command(`contact-limits-list`)
  .description(`List ContactLimit`)
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
          contactLimitsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/contact-limits`;
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
registerPromptSpecs(costCenters.commands.at(-1)!, contactLimitsListSpecs, { method: "get" });
const contactLimitsCreateSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: true },
  { key: "currency", option: "--currency <currency>", name: "currency", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "monetaryLimit", option: "--monetary-limit <monetary-limit>", name: "monetary_limit", type: "number", required: false },
];
costCenters
  .command(`contact-limits-create`)
  .description(`Create a contact limit`)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--currency <currency>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--monetary-limit <monetary-limit>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, currency, metadata, monetaryLimit } = await promptForMissing(
          _options,
          contactLimitsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/contact-limits`;
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
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (monetaryLimit !== undefined) {
          _payload[`monetary_limit`] = monetaryLimit;
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
registerPromptSpecs(costCenters.commands.at(-1)!, contactLimitsCreateSpecs, { method: "post" });
const contactLimitsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/contact-limits", hasLimit: true } },
];
costCenters
  .command(`contact-limits-delete`)
  .description(`Delete a contact limit`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          contactLimitsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`cost-centers contact-limits-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/contact-limits/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(costCenters.commands.at(-1)!, contactLimitsDeleteSpecs, { method: "delete", destructive: true });
const contactLimitsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/contact-limits", hasLimit: true } },
];
costCenters
  .command(`contact-limits-get`)
  .description(`Read one contact limit`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          contactLimitsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/contact-limits/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(costCenters.commands.at(-1)!, contactLimitsGetSpecs, { method: "get" });
const contactLimitsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/contact-limits", hasLimit: true } },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "monetaryLimit", option: "--monetary-limit <monetary-limit>", name: "monetary_limit", type: "number", required: false },
];
costCenters
  .command(`contact-limits-update`)
  .description(`Update a contact limit`)
  .option(`--id <id>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--currency <currency>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--monetary-limit <monetary-limit>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId, currency, metadata, monetaryLimit } = await promptForMissing(
          _options,
          contactLimitsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/contact-limits/{id}`.replace(`{id}`, id);
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
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (monetaryLimit !== undefined) {
          _payload[`monetary_limit`] = monetaryLimit;
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
registerPromptSpecs(costCenters.commands.at(-1)!, contactLimitsUpdateSpecs, { method: "put" });
const costCentersListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "punchoutAccountCode", option: "--punchout-account-code <punchout-account-code>", name: "punchout_account_code", description: "Code of the punchout account the list is read for. Centres a punchout restriction keeps out of reach of that account are left out (and the total counts only what is returned). Omit for the administrative list, which holds nothing back. A value that is not a non-empty string is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
costCenters
  .command(`cost-centers-list`)
  .description(`List CostCenter`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(`--punchout-account-code <punchout-account-code>`, `Code of the punchout account the list is read for. Centres a punchout restriction keeps out of reach of that account are left out (and the total counts only what is returned). Omit for the administrative list, which holds nothing back. A value that is not a non-empty string is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, punchoutAccountCode, filter } = await promptForMissing(
          _options,
          costCentersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/cost-centers`;
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
        if (punchoutAccountCode !== undefined) {
          _payload[`punchout_account_code`] = punchoutAccountCode;
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
registerPromptSpecs(costCenters.commands.at(-1)!, costCentersListSpecs, { method: "get" });
const costCentersCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "accountableContactId", option: "--accountable-contact-id <accountable-contact-id>", name: "accountable_contact_id", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", type: "boolean", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
];
costCenters
  .command(`cost-centers-create`)
  .description(`Create a cost centre`)
  .option(`--code <code>`, ``)
  .option(`--name <name>`, ``)
  .option(`--accountable-contact-id <accountable-contact-id>`, ``)
  .option(
    `--active [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--currency <currency>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, accountableContactId, active, currency, metadata, organizationId } = await promptForMissing(
          _options,
          costCentersCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/cost-centers`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountableContactId !== undefined) {
          _payload[`accountable_contact_id`] = accountableContactId;
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
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
registerPromptSpecs(costCenters.commands.at(-1)!, costCentersCreateSpecs, { method: "post" });
const costCentersDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/cost-centers", hasLimit: true } },
];
costCenters
  .command(`cost-centers-delete`)
  .description(`Delete a cost centre`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          costCentersDeleteSpecs,
          _command,
        );
        await confirmDestructive(`cost-centers cost-centers-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/cost-centers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(costCenters.commands.at(-1)!, costCentersDeleteSpecs, { method: "delete", destructive: true });
const costCentersGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/cost-centers", hasLimit: true } },
];
costCenters
  .command(`cost-centers-get`)
  .description(`Read one cost centre`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          costCentersGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/cost-centers/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(costCenters.commands.at(-1)!, costCentersGetSpecs, { method: "get" });
const costCentersUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/cost-centers", hasLimit: true } },
  { key: "accountableContactId", option: "--accountable-contact-id <accountable-contact-id>", name: "accountable_contact_id", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", type: "boolean", required: false },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
];
costCenters
  .command(`cost-centers-update`)
  .description(`Update a cost centre`)
  .option(`--id <id>`, ``)
  .option(`--accountable-contact-id <accountable-contact-id>`, ``)
  .option(
    `--active [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--code <code>`, ``)
  .option(`--currency <currency>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, accountableContactId, active, code, currency, metadata, name, organizationId } = await promptForMissing(
          _options,
          costCentersUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/cost-centers/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (accountableContactId !== undefined) {
          _payload[`accountable_contact_id`] = accountableContactId;
        }
        if (active !== undefined) {
          _payload[`active`] = active;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
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
registerPromptSpecs(costCenters.commands.at(-1)!, costCentersUpdateSpecs, { method: "put" });
const costCentersConsumeSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/cost-centers", hasLimit: true } },
  { key: "amount", option: "--amount <amount>", name: "amount", type: "number", required: true },
  { key: "actor", option: "--actor <actor>", name: "actor", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", type: "string", required: false },
  { key: "purchaseRequestId", option: "--purchase-request-id <purchase-request-id>", name: "purchase_request_id", type: "string", required: false },
];
costCenters
  .command(`cost-centers-consume`)
  .description(`Spend across a cost centre budget stack in sequence (last may go negative)`)
  .option(`--id <id>`, ``)
  .option(`--amount <amount>`, ``, parseInteger)
  .option(`--actor <actor>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.`)
  .option(`--note <note>`, ``)
  .option(`--order-id <order-id>`, ``)
  .option(`--purchase-request-id <purchase-request-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, amount, actor, currency, note, orderId, purchaseRequestId } = await promptForMissing(
          _options,
          costCentersConsumeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/cost-centers/{id}/consume`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (actor !== undefined) {
          _payload[`actor`] = actor;
        }
        if (amount !== undefined) {
          _payload[`amount`] = amount;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (purchaseRequestId !== undefined) {
          _payload[`purchase_request_id`] = purchaseRequestId;
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
registerPromptSpecs(costCenters.commands.at(-1)!, costCentersConsumeSpecs, { method: "post" });
const evaluateSpecs: PromptSpec[] = [
  { key: "amount", option: "--amount <amount>", name: "amount", type: "number", required: true },
  { key: "conditions", option: "--conditions [conditions...]", name: "conditions", type: "array", required: false, enum: ["availableBudget","personalLimit"] },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.", type: "string", required: false },
  { key: "punchoutAccountCode", option: "--punchout-account-code <punchout-account-code>", name: "punchout_account_code", description: "Code of the punchout account the request is made in. Omit outside a punchout session: a cost centre restricted with mode 'only' is then out of reach, and one restricted with 'except' is offered. A value that is not a non-empty string is refused with 400.", type: "string", required: false },
];
costCenters
  .command(`evaluate`)
  .description(`Evaluate budget-aware conditions (availableBudget, personalLimit) for a spend; refuses a cost centre this punchout session may not book to`)
  .option(`--amount <amount>`, ``, parseInteger)
  .option(`--conditions [conditions...]`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--cost-center-id <cost-center-id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.`)
  .option(`--punchout-account-code <punchout-account-code>`, `Code of the punchout account the request is made in. Omit outside a punchout session: a cost centre restricted with mode 'only' is then out of reach, and one restricted with 'except' is offered. A value that is not a non-empty string is refused with 400.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { amount, conditions, contactId, costCenterId, currency, punchoutAccountCode } = await promptForMissing(
          _options,
          evaluateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/evaluate`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (amount !== undefined) {
          _payload[`amount`] = amount;
        }
        if (conditions !== undefined) {
          _payload[`conditions`] = conditions;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (punchoutAccountCode !== undefined) {
          _payload[`punchout_account_code`] = punchoutAccountCode;
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
registerPromptSpecs(costCenters.commands.at(-1)!, evaluateSpecs, { method: "post" });
const reserveSpecs: PromptSpec[] = [
  { key: "allocations", option: "--allocations [allocations...]", name: "allocations", type: "array", required: true },
  { key: "purchaseRequestId", option: "--purchase-request-id <purchase-request-id>", name: "purchase_request_id", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
];
costCenters
  .command(`reserve`)
  .description(`Reserve budget for a purchase request (idempotent on purchase_request_id)`)
  .option(`--allocations [allocations...]`, ``)
  .option(`--purchase-request-id <purchase-request-id>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.`)
  .option(`--note <note>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { allocations, purchaseRequestId, contactId, currency, note } = await promptForMissing(
          _options,
          reserveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/reserve`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (allocations !== undefined) {
          _payload[`allocations`] = allocations;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (purchaseRequestId !== undefined) {
          _payload[`purchase_request_id`] = purchaseRequestId;
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
registerPromptSpecs(costCenters.commands.at(-1)!, reserveSpecs, { method: "post" });
const reserveAdjustSpecs: PromptSpec[] = [
  { key: "allocations", option: "--allocations [allocations...]", name: "allocations", type: "array", required: true },
  { key: "purchaseRequestId", option: "--purchase-request-id <purchase-request-id>", name: "purchase_request_id", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
];
costCenters
  .command(`reserve-adjust`)
  .description(`Move a held reservation to a new amount; the allocations are its new shape in full (idempotent)`)
  .option(`--allocations [allocations...]`, ``)
  .option(`--purchase-request-id <purchase-request-id>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.`)
  .option(`--note <note>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { allocations, purchaseRequestId, contactId, currency, note } = await promptForMissing(
          _options,
          reserveAdjustSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/reserve/adjust`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (allocations !== undefined) {
          _payload[`allocations`] = allocations;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (purchaseRequestId !== undefined) {
          _payload[`purchase_request_id`] = purchaseRequestId;
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
registerPromptSpecs(costCenters.commands.at(-1)!, reserveAdjustSpecs, { method: "post" });
const restrictionsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
costCenters
  .command(`restrictions-list`)
  .description(`List CostCenterRestriction`)
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
          restrictionsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/restrictions`;
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
registerPromptSpecs(costCenters.commands.at(-1)!, restrictionsListSpecs, { method: "get" });
const restrictionsCreateSpecs: PromptSpec[] = [
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", type: "string", required: true },
  { key: "parameters", option: "--parameters <parameters>", name: "parameters", type: "object", required: true },
  { key: "type", option: "--type <type>", name: "type", type: "string", required: true, enum: ["contact","role","product","category","catalog","punchout"] },
  { key: "active", option: "--active <active>", name: "active", type: "boolean", required: false },
];
costCenters
  .command(`restrictions-create`)
  .description(`Create a restriction`)
  .option(`--cost-center-id <cost-center-id>`, ``)
  .option(`--parameters <parameters>`, ``)
  .option(`--type <type>`, ``)
  .option(
    `--active [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { costCenterId, parameters, type, active } = await promptForMissing(
          _options,
          restrictionsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/restrictions`;
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
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (parameters !== undefined) {
          _payload[`parameters`] = resolveBodyParam(parameters);
        }
        if (type !== undefined) {
          _payload[`type`] = type;
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
registerPromptSpecs(costCenters.commands.at(-1)!, restrictionsCreateSpecs, { method: "post" });
const restrictionsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/restrictions", hasLimit: true } },
];
costCenters
  .command(`restrictions-delete`)
  .description(`Delete a restriction`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          restrictionsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`cost-centers restrictions-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/restrictions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(costCenters.commands.at(-1)!, restrictionsDeleteSpecs, { method: "delete", destructive: true });
const restrictionsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/restrictions", hasLimit: true } },
];
costCenters
  .command(`restrictions-get`)
  .description(`Read one restriction`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          restrictionsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/restrictions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(costCenters.commands.at(-1)!, restrictionsGetSpecs, { method: "get" });
const restrictionsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/cost-centers/restrictions", hasLimit: true } },
  { key: "active", option: "--active <active>", name: "active", type: "boolean", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", type: "string", required: false },
  { key: "parameters", option: "--parameters <parameters>", name: "parameters", type: "object", required: false },
  { key: "type", option: "--type <type>", name: "type", type: "string", required: false, enum: ["contact","role","product","category","catalog","punchout"] },
];
costCenters
  .command(`restrictions-update`)
  .description(`Update a restriction`)
  .option(`--id <id>`, ``)
  .option(
    `--active [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--cost-center-id <cost-center-id>`, ``)
  .option(`--parameters <parameters>`, ``)
  .option(`--type <type>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, active, costCenterId, parameters, type } = await promptForMissing(
          _options,
          restrictionsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/restrictions/{id}`.replace(`{id}`, id);
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
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (parameters !== undefined) {
          _payload[`parameters`] = resolveBodyParam(parameters);
        }
        if (type !== undefined) {
          _payload[`type`] = type;
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
registerPromptSpecs(costCenters.commands.at(-1)!, restrictionsUpdateSpecs, { method: "put" });
const usableSpecs: PromptSpec[] = [
  { key: "lines", option: "--lines [lines...]", name: "lines", type: "array", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", type: "string", required: false },
  { key: "punchoutAccountCode", option: "--punchout-account-code <punchout-account-code>", name: "punchout_account_code", description: "Code of the punchout account the request is made in. Omit outside a punchout session: a cost centre restricted with mode 'only' is then out of reach, and one restricted with 'except' is offered. A value that is not a non-empty string is refused with 400.", type: "string", required: false },
  { key: "roles", option: "--roles [roles...]", name: "roles", type: "array", required: false },
];
costCenters
  .command(`usable`)
  .description(`Usable cost centres per line for a buyer (restriction eval incl. punchout + auto-select)`)
  .option(`--lines [lines...]`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--organization-id <organization-id>`, ``)
  .option(`--punchout-account-code <punchout-account-code>`, `Code of the punchout account the request is made in. Omit outside a punchout session: a cost centre restricted with mode 'only' is then out of reach, and one restricted with 'except' is offered. A value that is not a non-empty string is refused with 400.`)
  .option(`--roles [roles...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { lines, contactId, organizationId, punchoutAccountCode, roles } = await promptForMissing(
          _options,
          usableSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/usable`;
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
        if (lines !== undefined) {
          _payload[`lines`] = lines;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (punchoutAccountCode !== undefined) {
          _payload[`punchout_account_code`] = punchoutAccountCode;
        }
        if (roles !== undefined) {
          _payload[`roles`] = roles;
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
registerPromptSpecs(costCenters.commands.at(-1)!, usableSpecs, { method: "post" });
const withdrawSpecs: PromptSpec[] = [
  { key: "purchaseRequestId", option: "--purchase-request-id <purchase-request-id>", name: "purchase_request_id", type: "string", required: true },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.", type: "string", required: false },
  { key: "note", option: "--note <note>", name: "note", type: "string", required: false },
];
costCenters
  .command(`withdraw`)
  .description(`Withdraw a purchase request reservation, crediting budgets back (idempotent)`)
  .option(`--purchase-request-id <purchase-request-id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code the amount is stated in. Omit to be read in the cost centre's (or the personal limit's) own currency; a code that differs from it is refused with 409 currency_mismatch.`)
  .option(`--note <note>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { purchaseRequestId, currency, note } = await promptForMissing(
          _options,
          withdrawSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/cost-centers/withdraw`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (purchaseRequestId !== undefined) {
          _payload[`purchase_request_id`] = purchaseRequestId;
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
registerPromptSpecs(costCenters.commands.at(-1)!, withdrawSpecs, { method: "post" });
