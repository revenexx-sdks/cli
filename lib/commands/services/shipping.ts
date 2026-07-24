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

export const shipping = new Command("shipping")
  .description(
    commandDescriptions["shipping"] ??
      `Manage shipping resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const methodsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shipping
  .command(`methods-list`)
  .description(`List shipping method configurations`)
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
          methodsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods`;
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
registerPromptSpecs(shipping.commands.at(-1)!, methodsListSpecs, { method: "get" });
const methodsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable method code, unique per tenant (e.g. standard, express).", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: true },
  { key: "carrier", option: "--carrier <carrier>", name: "carrier", description: "Carrier anchor for the upcoming carrier connect (dynamic rates, tracking links).", type: "string", required: false },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "Allowed ISO 3166-1 alpha-2 codes; null or empty = worldwide.", type: "array", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR).", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Only enabled methods appear in rate responses (default false).", type: "boolean", required: false },
  { key: "etaDaysMax", option: "--eta-days-max <eta-days-max>", name: "eta_days_max", description: "Delivery-time estimate for the checkout (days, upper bound).", type: "integer", required: false },
  { key: "etaDaysMin", option: "--eta-days-min <eta-days-min>", name: "eta_days_min", description: "Delivery-time estimate for the checkout (days, lower bound).", type: "integer", required: false },
  { key: "freeAbove", option: "--free-above <free-above>", name: "free_above", description: "Free shipping at or above this order value — wins over every pricing model.", type: "number", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by locale (e.g. {de, en}).", type: "object", required: false },
  { key: "matrixAttribute", option: "--matrix-attribute <matrix-attribute>", name: "matrix_attribute", description: "Attribute name for matrix_basis 'attribute'.", type: "string", required: false },
  { key: "matrixBasis", option: "--matrix-basis <matrix-basis>", name: "matrix_basis", description: "The measure a matrix method prices over; 'attribute' reads matrix_attribute from the rate request.", type: "string", required: false, enum: ["weight","quantity","order_value","attribute"] },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in the checkout (default 0).", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "The fixed price (default 0) — ignored for 'free' and 'matrix'.", type: "number", required: false },
  { key: "pricingType", option: "--pricing-type <pricing-type>", name: "pricing_type", description: "Pricing model (default 'fixed'): one price, no price, or tiered over a measure.", type: "string", required: false, enum: ["fixed","free","matrix"] },
];
shipping
  .command(`methods-create`)
  .description(`Create a shipping method (fixed, free or matrix pricing)`)
  .option(`--code <code>`, `Stable method code, unique per tenant (e.g. standard, express).`)
  .option(`--name <name>`, `Display name.`)
  .option(`--carrier <carrier>`, `Carrier anchor for the upcoming carrier connect (dynamic rates, tracking links).`)
  .option(`--countries [countries...]`, `Allowed ISO 3166-1 alpha-2 codes; null or empty = worldwide.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--description <description>`, ``)
  .option(
    `--enabled [value]`,
    `Only enabled methods appear in rate responses (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--eta-days-max <eta-days-max>`, `Delivery-time estimate for the checkout (days, upper bound).`, parseInteger)
  .option(`--eta-days-min <eta-days-min>`, `Delivery-time estimate for the checkout (days, lower bound).`, parseInteger)
  .option(`--free-above <free-above>`, `Free shipping at or above this order value — wins over every pricing model.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names keyed by locale (e.g. {de, en}).`)
  .option(`--matrix-attribute <matrix-attribute>`, `Attribute name for matrix_basis 'attribute'.`)
  .option(`--matrix-basis <matrix-basis>`, `The measure a matrix method prices over; 'attribute' reads matrix_attribute from the rate request.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--position <position>`, `Sort order in the checkout (default 0).`, parseInteger)
  .option(`--price <price>`, `The fixed price (default 0) — ignored for 'free' and 'matrix'.`, parseInteger)
  .option(`--pricing-type <pricing-type>`, `Pricing model (default 'fixed'): one price, no price, or tiered over a measure.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, carrier, countries, currency, description, enabled, etaDaysMax, etaDaysMin, freeAbove, labels, matrixAttribute, matrixBasis, metadata, position, price, pricingType } = await promptForMissing(
          _options,
          methodsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (carrier !== undefined) {
          _payload[`carrier`] = carrier;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (countries !== undefined) {
          _payload[`countries`] = countries;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (etaDaysMax !== undefined) {
          _payload[`eta_days_max`] = etaDaysMax;
        }
        if (etaDaysMin !== undefined) {
          _payload[`eta_days_min`] = etaDaysMin;
        }
        if (freeAbove !== undefined) {
          _payload[`free_above`] = freeAbove;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (matrixAttribute !== undefined) {
          _payload[`matrix_attribute`] = matrixAttribute;
        }
        if (matrixBasis !== undefined) {
          _payload[`matrix_basis`] = matrixBasis;
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
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (pricingType !== undefined) {
          _payload[`pricing_type`] = pricingType;
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
registerPromptSpecs(shipping.commands.at(-1)!, methodsCreateSpecs, { method: "post" });
shipping
  .command(`methods-defaults`)
  .description(`Seed the standard methods (standard, express, pickup) — idempotent, also runs on app.installed`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/defaults`;
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
const methodsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
];
shipping
  .command(`methods-delete`)
  .description(`Delete a shipping method including its matrix tiers`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          methodsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping methods-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, methodsDeleteSpecs, { method: "delete", destructive: true });
const methodsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
];
shipping
  .command(`methods-get`)
  .description(`Read one shipping method`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          methodsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, methodsGetSpecs, { method: "get" });
const methodsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "carrier", option: "--carrier <carrier>", name: "carrier", description: "Carrier anchor for the upcoming carrier connect (dynamic rates, tracking links).", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Stable method code, unique per tenant (e.g. standard, express).", type: "string", required: false },
  { key: "countries", option: "--countries [countries...]", name: "countries", description: "Allowed ISO 3166-1 alpha-2 codes; null or empty = worldwide.", type: "array", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR).", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Only enabled methods appear in rate responses (default false).", type: "boolean", required: false },
  { key: "etaDaysMax", option: "--eta-days-max <eta-days-max>", name: "eta_days_max", description: "Delivery-time estimate for the checkout (days, upper bound).", type: "integer", required: false },
  { key: "etaDaysMin", option: "--eta-days-min <eta-days-min>", name: "eta_days_min", description: "Delivery-time estimate for the checkout (days, lower bound).", type: "integer", required: false },
  { key: "freeAbove", option: "--free-above <free-above>", name: "free_above", description: "Free shipping at or above this order value — wins over every pricing model.", type: "number", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by locale (e.g. {de, en}).", type: "object", required: false },
  { key: "matrixAttribute", option: "--matrix-attribute <matrix-attribute>", name: "matrix_attribute", description: "Attribute name for matrix_basis 'attribute'.", type: "string", required: false },
  { key: "matrixBasis", option: "--matrix-basis <matrix-basis>", name: "matrix_basis", description: "The measure a matrix method prices over; 'attribute' reads matrix_attribute from the rate request.", type: "string", required: false, enum: ["weight","quantity","order_value","attribute"] },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order in the checkout (default 0).", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "The fixed price (default 0) — ignored for 'free' and 'matrix'.", type: "number", required: false },
  { key: "pricingType", option: "--pricing-type <pricing-type>", name: "pricing_type", description: "Pricing model (default 'fixed'): one price, no price, or tiered over a measure.", type: "string", required: false, enum: ["fixed","free","matrix"] },
];
shipping
  .command(`methods-update`)
  .description(`Update a shipping method (enable/disable, pricing, restrictions, ETA)`)
  .option(`--id <id>`, ``)
  .option(`--carrier <carrier>`, `Carrier anchor for the upcoming carrier connect (dynamic rates, tracking links).`)
  .option(`--code <code>`, `Stable method code, unique per tenant (e.g. standard, express).`)
  .option(`--countries [countries...]`, `Allowed ISO 3166-1 alpha-2 codes; null or empty = worldwide.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--description <description>`, ``)
  .option(
    `--enabled [value]`,
    `Only enabled methods appear in rate responses (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--eta-days-max <eta-days-max>`, `Delivery-time estimate for the checkout (days, upper bound).`, parseInteger)
  .option(`--eta-days-min <eta-days-min>`, `Delivery-time estimate for the checkout (days, lower bound).`, parseInteger)
  .option(`--free-above <free-above>`, `Free shipping at or above this order value — wins over every pricing model.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names keyed by locale (e.g. {de, en}).`)
  .option(`--matrix-attribute <matrix-attribute>`, `Attribute name for matrix_basis 'attribute'.`)
  .option(`--matrix-basis <matrix-basis>`, `The measure a matrix method prices over; 'attribute' reads matrix_attribute from the rate request.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Display name.`)
  .option(`--position <position>`, `Sort order in the checkout (default 0).`, parseInteger)
  .option(`--price <price>`, `The fixed price (default 0) — ignored for 'free' and 'matrix'.`, parseInteger)
  .option(`--pricing-type <pricing-type>`, `Pricing model (default 'fixed'): one price, no price, or tiered over a measure.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, carrier, code, countries, currency, description, enabled, etaDaysMax, etaDaysMin, freeAbove, labels, matrixAttribute, matrixBasis, metadata, name, position, price, pricingType } = await promptForMissing(
          _options,
          methodsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (carrier !== undefined) {
          _payload[`carrier`] = carrier;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (countries !== undefined) {
          _payload[`countries`] = countries;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (etaDaysMax !== undefined) {
          _payload[`eta_days_max`] = etaDaysMax;
        }
        if (etaDaysMin !== undefined) {
          _payload[`eta_days_min`] = etaDaysMin;
        }
        if (freeAbove !== undefined) {
          _payload[`free_above`] = freeAbove;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (matrixAttribute !== undefined) {
          _payload[`matrix_attribute`] = matrixAttribute;
        }
        if (matrixBasis !== undefined) {
          _payload[`matrix_basis`] = matrixBasis;
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
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (pricingType !== undefined) {
          _payload[`pricing_type`] = pricingType;
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
registerPromptSpecs(shipping.commands.at(-1)!, methodsUpdateSpecs, { method: "put" });
const tiersListSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
shipping
  .command(`tiers-list`)
  .description(`List the matrix tiers of a method (from_value → price)`)
  .option(`--method-id <method-id>`, ``)
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
        const { methodId, limit, offset, order, filter } = await promptForMissing(
          _options,
          tiersListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, methodId);
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersListSpecs, { method: "get" });
const tiersCreateSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "fromValue", option: "--from-value <from-value>", name: "from_value", description: "Tier threshold (default 0) — the tier with the highest from_value at or below the measured value wins.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order (default 0; bulk replace derives it from the array index).", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Price of this tier (default 0).", type: "number", required: false },
];
shipping
  .command(`tiers-create`)
  .description(`Add a matrix tier`)
  .option(`--method-id <method-id>`, ``)
  .option(`--from-value <from-value>`, `Tier threshold (default 0) — the tier with the highest from_value at or below the measured value wins.`, parseInteger)
  .option(`--position <position>`, `Sort order (default 0; bulk replace derives it from the array index).`, parseInteger)
  .option(`--price <price>`, `Price of this tier (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, fromValue, position, price } = await promptForMissing(
          _options,
          tiersCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, methodId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (fromValue !== undefined) {
          _payload[`from_value`] = fromValue;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersCreateSpecs, { method: "post" });
const tiersReplaceSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "tiers", option: "--tiers [tiers...]", name: "tiers", description: "The complete new tier set (set semantics) — positions are derived from the array order.", type: "array", required: true },
];
shipping
  .command(`tiers-replace`)
  .description(`Replace ALL matrix tiers of a method (table editing)`)
  .option(`--method-id <method-id>`, ``)
  .option(`--tiers [tiers...]`, `The complete new tier set (set semantics) — positions are derived from the array order.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, tiers } = await promptForMissing(
          _options,
          tiersReplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, methodId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (tiers !== undefined) {
          _payload[`tiers`] = tiers;
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersReplaceSpecs, { method: "put" });
const tiersDeleteSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods/{method_id}/tiers", hasLimit: true } },
];
shipping
  .command(`tiers-delete`)
  .description(`Delete a matrix tier`)
  .option(`--method-id <method-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, id } = await promptForMissing(
          _options,
          tiersDeleteSpecs,
          _command,
        );
        await confirmDestructive(`shipping tiers-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, methodId).replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersDeleteSpecs, { method: "delete", destructive: true });
const tiersGetSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods/{method_id}/tiers", hasLimit: true } },
];
shipping
  .command(`tiers-get`)
  .description(`Read one matrix tier`)
  .option(`--method-id <method-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, id } = await promptForMissing(
          _options,
          tiersGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, methodId).replace(`{id}`, id);
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersGetSpecs, { method: "get" });
const tiersUpdateSpecs: PromptSpec[] = [
  { key: "methodId", option: "--method-id <method-id>", name: "method_id", type: "string", required: true, resource: { listPath: "/shipping/methods", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/shipping/methods/{method_id}/tiers", hasLimit: true } },
  { key: "fromValue", option: "--from-value <from-value>", name: "from_value", description: "Tier threshold (default 0) — the tier with the highest from_value at or below the measured value wins.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order (default 0; bulk replace derives it from the array index).", type: "integer", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Price of this tier (default 0).", type: "number", required: false },
];
shipping
  .command(`tiers-update`)
  .description(`Update a matrix tier`)
  .option(`--method-id <method-id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--from-value <from-value>`, `Tier threshold (default 0) — the tier with the highest from_value at or below the measured value wins.`, parseInteger)
  .option(`--position <position>`, `Sort order (default 0; bulk replace derives it from the array index).`, parseInteger)
  .option(`--price <price>`, `Price of this tier (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { methodId, id, fromValue, position, price } = await promptForMissing(
          _options,
          tiersUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, methodId).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (fromValue !== undefined) {
          _payload[`from_value`] = fromValue;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
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
registerPromptSpecs(shipping.commands.at(-1)!, tiersUpdateSpecs, { method: "put" });
const ratesSpecs: PromptSpec[] = [
  { key: "attributes", option: "--attributes <attributes>", name: "attributes", description: "Measure values for attribute matrices, keyed by attribute name.", type: "object", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "Destination ISO 3166-1 alpha-2 code — checked against method country restrictions.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Echoed into the rates (default 'EUR').", type: "string", required: false },
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "Buyer market for tax resolution (else inferred from country, else first market).", type: "string", required: false },
  { key: "orderValue", option: "--order-value <order-value>", name: "order_value", description: "Order value (default 0) — drives free-above thresholds and order_value matrices.", type: "number", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Total quantity — measure for quantity matrices.", type: "number", required: false },
  { key: "weight", option: "--weight <weight>", name: "weight", description: "Total weight — measure for weight matrices.", type: "number", required: false },
];
shipping
  .command(`rates`)
  .description(`Resolve shipping rates for a buyer context (country, order value, weight/quantity/attribute measures) — the checkout question`)
  .option(`--attributes <attributes>`, `Measure values for attribute matrices, keyed by attribute name.`)
  .option(`--country <country>`, `Destination ISO 3166-1 alpha-2 code — checked against method country restrictions.`)
  .option(`--currency <currency>`, `Echoed into the rates (default 'EUR').`)
  .option(`--market-id <market-id>`, `Buyer market for tax resolution (else inferred from country, else first market).`)
  .option(`--order-value <order-value>`, `Order value (default 0) — drives free-above thresholds and order_value matrices.`, parseInteger)
  .option(`--quantity <quantity>`, `Total quantity — measure for quantity matrices.`, parseInteger)
  .option(`--weight <weight>`, `Total weight — measure for weight matrices.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { attributes, country, currency, marketId, orderValue, quantity, weight } = await promptForMissing(
          _options,
          ratesSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/shipping/rates`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attributes !== undefined) {
          _payload[`attributes`] = resolveBodyParam(attributes);
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (marketId !== undefined) {
          _payload[`market_id`] = marketId;
        }
        if (orderValue !== undefined) {
          _payload[`order_value`] = orderValue;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (weight !== undefined) {
          _payload[`weight`] = weight;
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
registerPromptSpecs(shipping.commands.at(-1)!, ratesSpecs, { method: "post" });
