import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
} from "../../interactive.js";

export const inventories = new Command("inventories")
  .description(
    commandDescriptions["inventories"] ??
      `Manage inventories resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

inventories
  .command(`adjust`)
  .description(`Manual correction: ±on_hand with mandatory reason`)
  .option(`--items [items...]`, `The corrections — quantities are SIGNED deltas (at most 200).`)
  .option(`--reason <reason>`, `Mandatory audit reason — every adjustment is a ledger row.`)
  .option(`--location-_code <location-_code>`, `Adjusted location (default 'main').`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, reason, location_code } = await promptForMissing(
          _options,
          [
            { key: "items", option: "--items [items...]", name: "items", description: "The corrections — quantities are SIGNED deltas (at most 200).", type: "array", required: true },
            { key: "reason", option: "--reason <reason>", name: "reason", description: "Mandatory audit reason — every adjustment is a ledger row.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/adjust`;
        const _payload: RequestParams = {};
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (location_code !== undefined) {
          _payload[`location_code`] = location_code;
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
inventories
  .command(`availability`)
  .description(`THE stock call (batch): on_hand/reserved/available + orderable per item across locations. Most-customised surface in the field — designed to be replaced 1:1 by a custom app via the gateway capability override (ERP/SAP live stock).`)
  .option(`--items [items...]`, `The items to check (batch, at most 200).`)
  .option(`--location-_code <location-_code>`, `Restrict the check to one location (default: all enabled locations).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, location_code } = await promptForMissing(
          _options,
          [
            { key: "items", option: "--items [items...]", name: "items", description: "The items to check (batch, at most 200).", type: "array", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/availability`;
        const _payload: RequestParams = {};
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (location_code !== undefined) {
          _payload[`location_code`] = location_code;
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
inventories
  .command(`commit`)
  .description(`Commit an order_ref's reservations on shipment (−on_hand −reserved)`)
  .option(`--order-_ref <order-_ref>`, `The order whose active reservations are committed (shipment).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { order_ref } = await promptForMissing(
          _options,
          [
            { key: "order_ref", option: "--order-_ref <order-_ref>", name: "order_ref", description: "The order whose active reservations are committed (shipment).", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/commit`;
        const _payload: RequestParams = {};
        if (order_ref !== undefined) {
          _payload[`order_ref`] = order_ref;
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
inventories
  .command(`locations-list`)
  .description(`List stock locations`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
          [
            { key: "code", option: "--code <code>", name: "code", description: "Unique location code (per tenant).", type: "string", required: true },
            { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations`;
        const _payload: RequestParams = {};
        if (address !== undefined) {
          _payload[`address`] = JSON.parse(address);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
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
inventories
  .command(`locations-delete`)
  .description(`Delete a location including its stock`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/locations", hasLimit: true } },
          ],
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
inventories
  .command(`locations-get`)
  .description(`Read one location`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/locations", hasLimit: true } },
          ],
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
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/locations", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (address !== undefined) {
          _payload[`address`] = JSON.parse(address);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
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
inventories
  .command(`movements-list`)
  .description(`The movements ledger — every stock change as a booking row (audit trail + event feed)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
inventories
  .command(`movements-get`)
  .description(`Read one movement`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/movements", hasLimit: true } },
          ],
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
inventories
  .command(`receive`)
  .description(`Goods inbound: +on_hand with a ledger row`)
  .option(`--items [items...]`, `The inbound items (at most 200).`)
  .option(`--location-_code <location-_code>`, `Receiving location (default 'main').`)
  .option(`--reason <reason>`, `Ledger note (e.g. delivery note number).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, location_code, reason } = await promptForMissing(
          _options,
          [
            { key: "items", option: "--items [items...]", name: "items", description: "The inbound items (at most 200).", type: "array", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/receive`;
        const _payload: RequestParams = {};
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (location_code !== undefined) {
          _payload[`location_code`] = location_code;
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
inventories
  .command(`release`)
  .description(`Release an order_ref's active reservations (cancellation)`)
  .option(`--order-_ref <order-_ref>`, `The order whose active reservations are released.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { order_ref } = await promptForMissing(
          _options,
          [
            { key: "order_ref", option: "--order-_ref <order-_ref>", name: "order_ref", description: "The order whose active reservations are released.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/release`;
        const _payload: RequestParams = {};
        if (order_ref !== undefined) {
          _payload[`order_ref`] = order_ref;
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
inventories
  .command(`reservations-list`)
  .description(`List reservations (filter by order_ref/status)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
inventories
  .command(`reservations-get`)
  .description(`Read one reservation`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/reservations", hasLimit: true } },
          ],
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
inventories
  .command(`reserve`)
  .description(`Reserve stock for an order_ref (all-or-nothing, location by priority)`)
  .option(`--items [items...]`, `The items to reserve — all-or-nothing (at most 200).`)
  .option(`--order-_ref <order-_ref>`, `The order this reservation belongs to.`)
  .option(`--expires-_at <expires-_at>`, `Optional reservation expiry.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, order_ref, expires_at } = await promptForMissing(
          _options,
          [
            { key: "items", option: "--items [items...]", name: "items", description: "The items to reserve — all-or-nothing (at most 200).", type: "array", required: true },
            { key: "order_ref", option: "--order-_ref <order-_ref>", name: "order_ref", description: "The order this reservation belongs to.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reserve`;
        const _payload: RequestParams = {};
        if (expires_at !== undefined) {
          _payload[`expires_at`] = expires_at;
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (order_ref !== undefined) {
          _payload[`order_ref`] = order_ref;
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
inventories
  .command(`restock`)
  .description(`Returns back to stock: +on_hand with a ledger row`)
  .option(`--items [items...]`, `The returned items (at most 200).`)
  .option(`--location-_code <location-_code>`, `Restocking location (default 'main').`)
  .option(`--order-_ref <order-_ref>`, `Originating order (ledger reference).`)
  .option(`--reason <reason>`, `Ledger note (e.g. return reason).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, location_code, order_ref, reason } = await promptForMissing(
          _options,
          [
            { key: "items", option: "--items [items...]", name: "items", description: "The returned items (at most 200).", type: "array", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/restock`;
        const _payload: RequestParams = {};
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (location_code !== undefined) {
          _payload[`location_code`] = location_code;
        }
        if (order_ref !== undefined) {
          _payload[`order_ref`] = order_ref;
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
inventories
  .command(`stock-list`)
  .description(`List stock levels (filter by location_id/product_id/sku)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
inventories
  .command(`stock-create`)
  .description(`Create a stock level row`)
  .option(`--location-_id <location-_id>`, `Owning location.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--on-_hand <on-_hand>`, `Physical stock (default 0).`, parseInteger)
  .option(`--product-_id <product-_id>`, `Tracked product.`)
  .option(`--reorder-_point <reorder-_point>`, ``, parseInteger)
  .option(`--reserved <reserved>`, `Reserved stock (default 0) — normally managed by reserve/release/commit.`, parseInteger)
  .option(`--sku <sku>`, `Tracked SKU (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { location_id, metadata, on_hand, product_id, reorder_point, reserved, sku } = await promptForMissing(
          _options,
          [
            { key: "location_id", option: "--location-_id <location-_id>", name: "location_id", description: "Owning location.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock`;
        const _payload: RequestParams = {};
        if (location_id !== undefined) {
          _payload[`location_id`] = location_id;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (on_hand !== undefined) {
          _payload[`on_hand`] = on_hand;
        }
        if (product_id !== undefined) {
          _payload[`product_id`] = product_id;
        }
        if (reorder_point !== undefined) {
          _payload[`reorder_point`] = reorder_point;
        }
        if (reserved !== undefined) {
          _payload[`reserved`] = reserved;
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
inventories
  .command(`stock-delete`)
  .description(`Delete a stock level row`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
          ],
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
inventories
  .command(`stock-get`)
  .description(`Read one stock level`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
          ],
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
inventories
  .command(`stock-update`)
  .description(`Update a stock level row`)
  .option(`--id <id>`, ``)
  .option(`--location-_id <location-_id>`, `Owning location.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--on-_hand <on-_hand>`, `Physical stock (default 0).`, parseInteger)
  .option(`--product-_id <product-_id>`, `Tracked product.`)
  .option(`--reorder-_point <reorder-_point>`, ``, parseInteger)
  .option(`--reserved <reserved>`, `Reserved stock (default 0) — normally managed by reserve/release/commit.`, parseInteger)
  .option(`--sku <sku>`, `Tracked SKU (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, location_id, metadata, on_hand, product_id, reorder_point, reserved, sku } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (location_id !== undefined) {
          _payload[`location_id`] = location_id;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (on_hand !== undefined) {
          _payload[`on_hand`] = on_hand;
        }
        if (product_id !== undefined) {
          _payload[`product_id`] = product_id;
        }
        if (reorder_point !== undefined) {
          _payload[`reorder_point`] = reorder_point;
        }
        if (reserved !== undefined) {
          _payload[`reserved`] = reserved;
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
