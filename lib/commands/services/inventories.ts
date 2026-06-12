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

export const inventories = new Command("inventories")
  .description(commandDescriptions["inventories"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

inventories
  .command(`inventories-adjust`)
  .description(``)
  .requiredOption(`--items [items...]`, `The corrections — quantities are SIGNED deltas (at most 200).`)
  .requiredOption(`--reason <reason>`, `Mandatory audit reason — every adjustment is a ledger row.`)
  .option(`--location-_code <location-_code>`, `Adjusted location (default 'main').`)
  .action(
    actionRunner(
      async ({ items, reason, location_code }) => {
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
  .command(`inventories-availability`)
  .description(``)
  .requiredOption(`--items [items...]`, `The items to check (batch, at most 200).`)
  .option(`--location-_code <location-_code>`, `Restrict the check to one location (default: all enabled locations).`)
  .action(
    actionRunner(
      async ({ items, location_code }) => {
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
  .command(`inventories-commit`)
  .description(``)
  .requiredOption(`--order-_ref <order-_ref>`, `The order whose active reservations are committed (shipment).`)
  .action(
    actionRunner(
      async ({ order_ref }) => {
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
  .command(`inventories-locations-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations`;
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
  .command(`inventories-locations-create`)
  .description(``)
  .requiredOption(`--code <code>`, `Unique location code (per tenant).`)
  .requiredOption(`--name <name>`, ``)
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
      async ({ code, name, address, enabled, labels, metadata, priority, type }) => {
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
  .command(`inventories-locations-defaults`)
  .description(``)
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
  .command(`inventories-locations-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`inventories-locations-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`inventories-locations-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, address, code, enabled, labels, metadata, name, priority, type }) => {
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
  .command(`inventories-movements-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/inventories/movements`;
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
  .command(`inventories-movements-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`inventories-receive`)
  .description(``)
  .requiredOption(`--items [items...]`, `The inbound items (at most 200).`)
  .option(`--location-_code <location-_code>`, `Receiving location (default 'main').`)
  .option(`--reason <reason>`, `Ledger note (e.g. delivery note number).`)
  .action(
    actionRunner(
      async ({ items, location_code, reason }) => {
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
  .command(`inventories-release`)
  .description(``)
  .requiredOption(`--order-_ref <order-_ref>`, `The order whose active reservations are released.`)
  .action(
    actionRunner(
      async ({ order_ref }) => {
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
  .command(`inventories-reservations-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reservations`;
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
  .command(`inventories-reservations-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`inventories-reserve`)
  .description(``)
  .requiredOption(`--items [items...]`, `The items to reserve — all-or-nothing (at most 200).`)
  .requiredOption(`--order-_ref <order-_ref>`, `The order this reservation belongs to.`)
  .option(`--expires-_at <expires-_at>`, `Optional reservation expiry.`)
  .action(
    actionRunner(
      async ({ items, order_ref, expires_at }) => {
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
  .command(`inventories-restock`)
  .description(``)
  .requiredOption(`--items [items...]`, `The returned items (at most 200).`)
  .option(`--location-_code <location-_code>`, `Restocking location (default 'main').`)
  .option(`--order-_ref <order-_ref>`, `Originating order (ledger reference).`)
  .option(`--reason <reason>`, `Ledger note (e.g. return reason).`)
  .action(
    actionRunner(
      async ({ items, location_code, order_ref, reason }) => {
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
  .command(`inventories-stock-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock`;
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
  .command(`inventories-stock-create`)
  .description(``)
  .requiredOption(`--location-_id <location-_id>`, `Owning location.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--on-_hand <on-_hand>`, `Physical stock (default 0).`, parseInteger)
  .option(`--product-_id <product-_id>`, `Tracked product.`)
  .option(`--reorder-_point <reorder-_point>`, ``, parseInteger)
  .option(`--reserved <reserved>`, `Reserved stock (default 0) — normally managed by reserve/release/commit.`, parseInteger)
  .option(`--sku <sku>`, `Tracked SKU (alternative to product_id).`)
  .action(
    actionRunner(
      async ({ location_id, metadata, on_hand, product_id, reorder_point, reserved, sku }) => {
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
  .command(`inventories-stock-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`inventories-stock-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`inventories-stock-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--location-_id <location-_id>`, `Owning location.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--on-_hand <on-_hand>`, `Physical stock (default 0).`, parseInteger)
  .option(`--product-_id <product-_id>`, `Tracked product.`)
  .option(`--reorder-_point <reorder-_point>`, ``, parseInteger)
  .option(`--reserved <reserved>`, `Reserved stock (default 0) — normally managed by reserve/release/commit.`, parseInteger)
  .option(`--sku <sku>`, `Tracked SKU (alternative to product_id).`)
  .action(
    actionRunner(
      async ({ id, location_id, metadata, on_hand, product_id, reorder_point, reserved, sku }) => {
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
