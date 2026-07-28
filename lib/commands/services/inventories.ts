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

export const inventories = new Command("inventories")
  .description(
    commandDescriptions["inventories"] ??
      `Manage inventories resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const adjustSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The corrections — quantities are SIGNED deltas (at most 200).", type: "array", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Adjusted location (default: the default_location_code setting).", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Inline single-item form: the product to move.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Inline single-item form: the SIGNED correction (negative removes stock).", type: "number", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Audit reason for the correction. Mandatory unless movement_reason_required is 'none'.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Inline single-item form: the SKU to move (alternative to product_id).", type: "string", required: false },
];
inventories
  .command(`adjust`)
  .description(`The batch correction route — a stocktake, breakage, shrinkage. Quantities are SIGNED. Refuses to take on_hand below zero (422) and, unless allow_negative_stock is on, below the item's reservations. A reason is mandatory unless movement_reason_required is 'none'.`)
  .option(`--items [items...]`, `The corrections — quantities are SIGNED deltas (at most 200).`)
  .option(`--location-code <location-code>`, `Adjusted location (default: the default_location_code setting).`)
  .option(`--product-id <product-id>`, `Inline single-item form: the product to move.`)
  .option(`--quantity <quantity>`, `Inline single-item form: the SIGNED correction (negative removes stock).`, parseInteger)
  .option(`--reason <reason>`, `Audit reason for the correction. Mandatory unless movement_reason_required is 'none'.`)
  .option(`--sku <sku>`, `Inline single-item form: the SKU to move (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode, productId, quantity, reason, sku } = await promptForMissing(
          _options,
          adjustSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/adjust`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
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
registerPromptSpecs(inventories.commands.at(-1)!, adjustSpecs, { method: "post" });
const availabilitySpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The items to check (batch, at most 200).", type: "array", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Restrict the check to one location (default: all enabled locations).", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Inline single-item form: the product to move.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Requested quantity for the orderable check (default 1).", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Inline single-item form: the SKU to move (alternative to product_id).", type: "string", required: false },
];
inventories
  .command(`availability`)
  .description(`THE stock call (batch): on_hand/reserved/available + orderable per item across locations. Most-customised surface in the field — designed to be replaced 1:1 by a custom app via the gateway capability override (ERP/SAP live stock).`)
  .option(`--items [items...]`, `The items to check (batch, at most 200).`)
  .option(`--location-code <location-code>`, `Restrict the check to one location (default: all enabled locations).`)
  .option(`--product-id <product-id>`, `Inline single-item form: the product to move.`)
  .option(`--quantity <quantity>`, `Requested quantity for the orderable check (default 1).`, parseInteger)
  .option(`--sku <sku>`, `Inline single-item form: the SKU to move (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode, productId, quantity, sku } = await promptForMissing(
          _options,
          availabilitySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/availability`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
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
registerPromptSpecs(inventories.commands.at(-1)!, availabilitySpecs, { method: "post" });
const commitSpecs: PromptSpec[] = [
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order whose active reservations are committed (shipment).", type: "string", required: true },
];
inventories
  .command(`commit`)
  .description(`Commit an order_ref's reservations on shipment (−on_hand −reserved)`)
  .option(`--order-ref <order-ref>`, `The order whose active reservations are committed (shipment).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderRef } = await promptForMissing(
          _options,
          commitSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/commit`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
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
registerPromptSpecs(inventories.commands.at(-1)!, commitSpecs, { method: "post" });
const locationsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventories
  .command(`locations-list`)
  .description(`List stock locations`)
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
          locationsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations`;
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
registerPromptSpecs(inventories.commands.at(-1)!, locationsListSpecs, { method: "get" });
const locationsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Unique location code (per tenant).", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "address", option: "--address <address>", name: "address", type: "object", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Disabled locations are skipped by availability and reserve (default true).", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localised display names ({de, en, …}).", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Sourcing order — lower wins (default 0).", type: "integer", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Default 'warehouse'.", type: "string", required: false, enum: ["warehouse","store","dropship","virtual"] },
];
inventories
  .command(`locations-create`)
  .description(`Create a location (warehouse, store, dropship, virtual)`)
  .option(`--code <code>`, `Unique location code (per tenant).`)
  .option(`--name <name>`, ``)
  .option(`--address <address>`, ``)
  .option(
    `--enabled [value]`,
    `Disabled locations are skipped by availability and reserve (default true).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localised display names ({de, en, …}).`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--priority <priority>`, `Sourcing order — lower wins (default 0).`, parseInteger)
  .option(`--type <type>`, `Default 'warehouse'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, address, enabled, labels, metadata, priority, type } = await promptForMissing(
          _options,
          locationsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (address !== undefined) {
          _payload[`address`] = resolveBodyParam(address);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
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
registerPromptSpecs(inventories.commands.at(-1)!, locationsCreateSpecs, { method: "post" });
inventories
  .command(`locations-defaults`)
  .description(`Seed the main warehouse — idempotent, also runs on app.installed`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations/defaults`;
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
const locationsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/locations", hasLimit: true } },
];
inventories
  .command(`locations-delete`)
  .description(`Delete a location including its stock`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          locationsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`inventories locations-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, locationsDeleteSpecs, { method: "delete", destructive: true });
const locationsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/locations", hasLimit: true } },
];
inventories
  .command(`locations-get`)
  .description(`Read one location`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          locationsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, locationsGetSpecs, { method: "get" });
const locationsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/locations", hasLimit: true } },
  { key: "address", option: "--address <address>", name: "address", type: "object", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Unique location code (per tenant).", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Disabled locations are skipped by availability and reserve (default true).", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localised display names ({de, en, …}).", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Sourcing order — lower wins (default 0).", type: "integer", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Default 'warehouse'.", type: "string", required: false, enum: ["warehouse","store","dropship","virtual"] },
];
inventories
  .command(`locations-update`)
  .description(`Update a location`)
  .option(`--id <id>`, ``)
  .option(`--address <address>`, ``)
  .option(`--code <code>`, `Unique location code (per tenant).`)
  .option(
    `--enabled [value]`,
    `Disabled locations are skipped by availability and reserve (default true).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localised display names ({de, en, …}).`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, ``)
  .option(`--priority <priority>`, `Sourcing order — lower wins (default 0).`, parseInteger)
  .option(`--type <type>`, `Default 'warehouse'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, address, code, enabled, labels, metadata, name, priority, type } = await promptForMissing(
          _options,
          locationsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (address !== undefined) {
          _payload[`address`] = resolveBodyParam(address);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
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
registerPromptSpecs(inventories.commands.at(-1)!, locationsUpdateSpecs, { method: "put" });
const movementsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventories
  .command(`movements-list`)
  .description(`The movements ledger — every stock change as a booking row (audit trail + event feed)`)
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
          movementsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/movements`;
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
registerPromptSpecs(inventories.commands.at(-1)!, movementsListSpecs, { method: "get" });
const movementsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/movements", hasLimit: true } },
];
inventories
  .command(`movements-get`)
  .description(`Read one movement`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          movementsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/movements/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, movementsGetSpecs, { method: "get" });
const receiveSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The inbound items (at most 200).", type: "array", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Receiving location (default: the default_location_code setting).", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Inline single-item form: the product to move.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Inline single-item form: the quantity received.", type: "number", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Ledger note (e.g. delivery note number). Mandatory when movement_reason_required is 'all'.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Inline single-item form: the SKU to move (alternative to product_id).", type: "string", required: false },
];
inventories
  .command(`receive`)
  .description(`Books a delivery into the receiving location (the caller's location_code, else the default_location_code setting), creating the stock row if the item is new. A reason is optional unless movement_reason_required is 'all'. Takes a batch or one item inline.`)
  .option(`--items [items...]`, `The inbound items (at most 200).`)
  .option(`--location-code <location-code>`, `Receiving location (default: the default_location_code setting).`)
  .option(`--product-id <product-id>`, `Inline single-item form: the product to move.`)
  .option(`--quantity <quantity>`, `Inline single-item form: the quantity received.`, parseInteger)
  .option(`--reason <reason>`, `Ledger note (e.g. delivery note number). Mandatory when movement_reason_required is 'all'.`)
  .option(`--sku <sku>`, `Inline single-item form: the SKU to move (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode, productId, quantity, reason, sku } = await promptForMissing(
          _options,
          receiveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/receive`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
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
registerPromptSpecs(inventories.commands.at(-1)!, receiveSpecs, { method: "post" });
const releaseSpecs: PromptSpec[] = [
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order whose active reservations are released.", type: "string", required: true },
];
inventories
  .command(`release`)
  .description(`Release an order_ref's active reservations (cancellation)`)
  .option(`--order-ref <order-ref>`, `The order whose active reservations are released.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderRef } = await promptForMissing(
          _options,
          releaseSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/release`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
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
registerPromptSpecs(inventories.commands.at(-1)!, releaseSpecs, { method: "post" });
inventories
  .command(`reorder-alerts`)
  .description(`Computed on read, so it is never stale: a row alerts when available (on_hand − reserved) has fallen to or below its own reorder_point, or the reorder_point_default setting when it carries none. A point of 0 never alerts. Answers enabled:false with an empty list when reorder_alert_enabled is off — a tenant replenishing from an ERP should not be told twice.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reorder-alerts`;
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
const reservationsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventories
  .command(`reservations-list`)
  .description(`List reservations (filter by order_ref/status)`)
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
          reservationsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reservations`;
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
registerPromptSpecs(inventories.commands.at(-1)!, reservationsListSpecs, { method: "get" });
const reservationsSweepSpecs: PromptSpec[] = [
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
inventories
  .command(`reservations-sweep`)
  .description(`The expiry sweeper, also run by the 'expire-reservations' schedule every 15 minutes. Releases reservations past their own expires_at and — once reservation_ttl_minutes is above 0 — reservations older than that lifetime which never carried a deadline. Each release gives the stock back and writes a 'release' booking, exactly like a cancellation. Idempotent: a second run finds nothing.`)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { data } = await promptForMissing(
          _options,
          reservationsSweepSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reservations/sweep`;
        const _payload: RequestParams = {};
        if (data !== undefined) {
          Object.assign(_payload, resolveBodyParam(data));
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
registerPromptSpecs(inventories.commands.at(-1)!, reservationsSweepSpecs, { method: "post" });
const reservationsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/reservations", hasLimit: true } },
];
inventories
  .command(`reservations-get`)
  .description(`Read one reservation`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          reservationsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reservations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, reservationsGetSpecs, { method: "get" });
const reserveSpecs: PromptSpec[] = [
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order this reservation belongs to.", type: "string", required: true },
  { key: "expiresAt", option: "--expires-at <expires-at>", name: "expires_at", description: "Reservation expiry. Omit to let reservation_ttl_minutes stamp one; the sweeper releases whatever is past its deadline.", type: "string", required: false },
  { key: "items", option: "--items [items...]", name: "items", description: "The items to reserve (at most 200).", type: "array", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Fallback location for a backordered item that has no stock row anywhere (default: the default_location_code setting).", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Inline single-item form: the product to move.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Inline single-item form: the quantity to reserve.", type: "number", required: false },
  { key: "shipTo", option: "--ship-to <ship-to>", name: "ship_to", type: "object", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Inline single-item form: the SKU to move (alternative to product_id).", type: "string", required: false },
];
inventories
  .command(`reserve`)
  .description(`Plans the whole call before writing anything, so a reservation that cannot be satisfied changes nothing. allocation_strategy decides which location serves an item ('priority', 'nearest' against ship_to, or 'single_location' for the whole order); backorder_policy decides what happens when none can — refuse (422), or reserve anyway and let availability go negative. expires_at defaults from reservation_ttl_minutes and the sweeper enforces it.`)
  .option(`--order-ref <order-ref>`, `The order this reservation belongs to.`)
  .option(`--expires-at <expires-at>`, `Reservation expiry. Omit to let reservation_ttl_minutes stamp one; the sweeper releases whatever is past its deadline.`)
  .option(`--items [items...]`, `The items to reserve (at most 200).`)
  .option(`--location-code <location-code>`, `Fallback location for a backordered item that has no stock row anywhere (default: the default_location_code setting).`)
  .option(`--product-id <product-id>`, `Inline single-item form: the product to move.`)
  .option(`--quantity <quantity>`, `Inline single-item form: the quantity to reserve.`, parseInteger)
  .option(`--ship-to <ship-to>`, ``)
  .option(`--sku <sku>`, `Inline single-item form: the SKU to move (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderRef, expiresAt, items, locationCode, productId, quantity, shipTo, sku } = await promptForMissing(
          _options,
          reserveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reserve`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (expiresAt !== undefined) {
          _payload[`expires_at`] = expiresAt;
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (shipTo !== undefined) {
          _payload[`ship_to`] = resolveBodyParam(shipTo);
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
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
registerPromptSpecs(inventories.commands.at(-1)!, reserveSpecs, { method: "post" });
const restockSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The returned items (at most 200).", type: "array", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Restocking location (default: the default_location_code setting).", type: "string", required: false },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "Originating order (ledger reference).", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Inline single-item form: the product to move.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Inline single-item form: the quantity returned.", type: "number", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Ledger note (e.g. return reason). Mandatory when movement_reason_required is 'all'.", type: "string", required: false },
  { key: "restock", option: "--restock <restock>", name: "restock", description: "Do the goods rejoin sellable stock? Omit to follow the restock_on_return_default setting. false records the decision and moves nothing.", type: "boolean", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Inline single-item form: the SKU to move (alternative to product_id).", type: "string", required: false },
];
inventories
  .command(`restock`)
  .description(`Whether a return rejoins sellable stock follows restock_on_return_default, overridable per call with 'restock'. When the answer is no the response says restocked:false and nothing moves — there is no movement to book, because no stock moved.`)
  .option(`--items [items...]`, `The returned items (at most 200).`)
  .option(`--location-code <location-code>`, `Restocking location (default: the default_location_code setting).`)
  .option(`--order-ref <order-ref>`, `Originating order (ledger reference).`)
  .option(`--product-id <product-id>`, `Inline single-item form: the product to move.`)
  .option(`--quantity <quantity>`, `Inline single-item form: the quantity returned.`, parseInteger)
  .option(`--reason <reason>`, `Ledger note (e.g. return reason). Mandatory when movement_reason_required is 'all'.`)
  .option(
    `--restock [value]`,
    `Do the goods rejoin sellable stock? Omit to follow the restock_on_return_default setting. false records the decision and moves nothing.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--sku <sku>`, `Inline single-item form: the SKU to move (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode, orderRef, productId, quantity, reason, restock, sku } = await promptForMissing(
          _options,
          restockSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/restock`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (restock !== undefined) {
          _payload[`restock`] = restock;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
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
registerPromptSpecs(inventories.commands.at(-1)!, restockSpecs, { method: "post" });
const stockListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventories
  .command(`stock-list`)
  .description(`List stock levels (filter by location_id/product_id/sku)`)
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
          stockListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock`;
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
registerPromptSpecs(inventories.commands.at(-1)!, stockListSpecs, { method: "get" });
const stockCreateSpecs: PromptSpec[] = [
  { key: "locationId", option: "--location-id <location-id>", name: "location_id", description: "Owning location.", type: "string", required: true },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata. 'backorder: true' opts this item into backorders when backorder_policy is 'allow_per_sku'.", type: "object", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Tracked product.", type: "string", required: false },
  { key: "reorderPoint", option: "--reorder-point <reorder-point>", name: "reorder_point", description: "Low-stock threshold — see GET /inventories/reorder-alerts.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Tracked SKU (alternative to product_id).", type: "string", required: false },
];
inventories
  .command(`stock-create`)
  .description(`Registers an item at a location. on_hand and reserved are NOT accepted: they are the running total of the movements ledger, so an opening balance is a receipt (POST /inventories/receive), not a field. What this row carries is its identity (location + product_id/sku), its reorder_point and its metadata.`)
  .option(`--location-id <location-id>`, `Owning location.`)
  .option(`--metadata <metadata>`, `Free-form metadata. 'backorder: true' opts this item into backorders when backorder_policy is 'allow_per_sku'.`)
  .option(`--product-id <product-id>`, `Tracked product.`)
  .option(`--reorder-point <reorder-point>`, `Low-stock threshold — see GET /inventories/reorder-alerts.`, parseInteger)
  .option(`--sku <sku>`, `Tracked SKU (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { locationId, metadata, productId, reorderPoint, sku } = await promptForMissing(
          _options,
          stockCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (locationId !== undefined) {
          _payload[`location_id`] = locationId;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (reorderPoint !== undefined) {
          _payload[`reorder_point`] = reorderPoint;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
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
registerPromptSpecs(inventories.commands.at(-1)!, stockCreateSpecs, { method: "post" });
const stockDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
];
inventories
  .command(`stock-delete`)
  .description(`Delete a stock level row`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          stockDeleteSpecs,
          _command,
        );
        await confirmDestructive(`inventories stock-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, stockDeleteSpecs, { method: "delete", destructive: true });
const stockGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
];
inventories
  .command(`stock-get`)
  .description(`Read one stock level`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          stockGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, stockGetSpecs, { method: "get" });
const stockUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
  { key: "locationId", option: "--location-id <location-id>", name: "location_id", description: "Owning location.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata. 'backorder: true' opts this item into backorders when backorder_policy is 'allow_per_sku'.", type: "object", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Tracked product.", type: "string", required: false },
  { key: "reorderPoint", option: "--reorder-point <reorder-point>", name: "reorder_point", description: "Low-stock threshold — see GET /inventories/reorder-alerts.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Tracked SKU (alternative to product_id).", type: "string", required: false },
];
inventories
  .command(`stock-update`)
  .description(`Partial update of reorder_point / metadata / identity. on_hand and reserved are dropped from the body — every stock change is a movement, and a body carrying nothing else is answered 422 with the route that was meant (POST /inventories/stock/{id}/adjust).`)
  .option(`--id <id>`, ``)
  .option(`--location-id <location-id>`, `Owning location.`)
  .option(`--metadata <metadata>`, `Free-form metadata. 'backorder: true' opts this item into backorders when backorder_policy is 'allow_per_sku'.`)
  .option(`--product-id <product-id>`, `Tracked product.`)
  .option(`--reorder-point <reorder-point>`, `Low-stock threshold — see GET /inventories/reorder-alerts.`, parseInteger)
  .option(`--sku <sku>`, `Tracked SKU (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, locationId, metadata, productId, reorderPoint, sku } = await promptForMissing(
          _options,
          stockUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (locationId !== undefined) {
          _payload[`location_id`] = locationId;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (reorderPoint !== undefined) {
          _payload[`reorder_point`] = reorderPoint;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
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
registerPromptSpecs(inventories.commands.at(-1)!, stockUpdateSpecs, { method: "put" });
const stockAdjustSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Signed correction (negative removes stock). Must be non-zero.", type: "number", required: true },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Audit reason. Mandatory unless movement_reason_required is 'none'.", type: "string", required: false },
];
inventories
  .command(`stock-adjust`)
  .description(`The row-scoped twin of POST /inventories/adjust: the row already knows its location and item, so a caller owes only the signed delta and a reason. This is the route that replaced the Cockpit's editable on_hand field. Refuses to take on_hand below zero (422), and below the row's reservations unless allow_negative_stock is on.`)
  .option(`--id <id>`, ``)
  .option(`--quantity <quantity>`, `Signed correction (negative removes stock). Must be non-zero.`, parseInteger)
  .option(`--reason <reason>`, `Audit reason. Mandatory unless movement_reason_required is 'none'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, quantity, reason } = await promptForMissing(
          _options,
          stockAdjustSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock/{id}/adjust`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
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
registerPromptSpecs(inventories.commands.at(-1)!, stockAdjustSpecs, { method: "post" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventories
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes. Names: location-types, movement-types, reservation-statuses. Fetch one with GET /inventories/vocabularies/{name}; a client holding the qualified pair 'inventories.<name>' builds that URL from the pair alone.`)
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
        const _apiPath = `/inventories/vocabularies`;
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
registerPromptSpecs(inventories.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["location-types","movement-types","reservation-statuses"], resource: { listPath: "/inventories/vocabularies", hasLimit: false } },
];
inventories
  .command(`vocabularies-get`)
  .description(`The values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift — a value added to the constraint appears here even before anyone labels it, titled from its own key. Values come back in constraint order, which is lifecycle order for a status. 'closed' says the set is exhaustive, so a value outside it is stale data rather than a missing label. Answers 404 for an unknown name. Names: location-types, movement-types, reservation-statuses.`)
  .option(`--name <name>`, `The vocabulary name — the part after the dot in the qualified id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          vocabulariesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(inventories.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
