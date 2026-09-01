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

export const inventoriesStock = new Command("inventories-stock")
  .description(
    commandDescriptions["inventoriesStock"] ??
      `How much is there, what may still be sold, and every call that changes the number. A stock level is one item at one location and it carries two figures, neither of which is the sellable one: \`on_hand\` counts what is physically there INCLUDING everything already promised, \`reserved\` counts the promises and never reduces \`on_hand\`, and what a shop may sell is the difference — derived on read, never stored, so there is no \`available\` column to filter or order by. The balance is not editable either: every change is a booking in the movements ledger, which is why \`receive\` (goods in), \`adjust\` (a signed correction with a reason), \`restock\` (a return coming back) and the row-scoped adjust are the only things that move a number, and why the ledger reads sit in this same group rather than a section of their own — a movement is the receipt for the call above it, not a subject. POST /inventories/availability is the read side of all of it, and the one capability an ERP-stocked tenant replaces wholesale through the gateway override. The vocabulary routes are here because the code a caller cannot guess is a movement's \`type\`: it decides the SIGN of the quantity.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const inventoriesAdjustSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The corrections, at most 200 in one call — a stocktake, breakage, shrinkage. Quantities are SIGNED deltas, not new balances.", type: "array", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Which location is being corrected. Omitted, the `default_location_code` setting decides. A correction is per location: the same SKU in two warehouses is two corrections.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Inline single-item form: the product to move, instead of a one-entry `items` array. The two forms are equivalent — nothing downstream knows which arrived.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Inline single-item form: the SIGNED correction (negative writes stock off, positive finds it). Non-zero.", type: "number", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why the stock is being corrected — this is the audit trail a stocktake leaves behind. Owed unless `movement_reason_required` is 'none' (its default, 'adjustments', asks for one exactly here); missing where it is owed, the call is 400.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Inline single-item form: the article number to move (instead of `product_id`).", type: "string", required: false },
];
inventoriesStock
  .command(`inventories-adjust`)
  .description(`The batch correction route — a stocktake, breakage, shrinkage — and the manual way \`on_hand\` is ever put right. Quantities are SIGNED: a positive one adds to the balance, a negative one takes it away, and neither is written onto the row directly. Each item is booked into the movements ledger as an \`adjustment\` and the balance follows, so a correction leaves a record of who changed what and why instead of a number that silently differs from yesterday's. A reason is mandatory unless movement_reason_required is 'none'.`)
  .option(`--items [items...]`, `The corrections, at most 200 in one call — a stocktake, breakage, shrinkage. Quantities are SIGNED deltas, not new balances.`)
  .option(`--location-code <location-code>`, `Which location is being corrected. Omitted, the \`default_location_code\` setting decides. A correction is per location: the same SKU in two warehouses is two corrections.`)
  .option(`--product-id <product-id>`, `Inline single-item form: the product to move, instead of a one-entry \`items\` array. The two forms are equivalent — nothing downstream knows which arrived.`)
  .option(`--quantity <quantity>`, `Inline single-item form: the SIGNED correction (negative writes stock off, positive finds it). Non-zero.`, parseInteger)
  .option(`--reason <reason>`, `Why the stock is being corrected — this is the audit trail a stocktake leaves behind. Owed unless \`movement_reason_required\` is 'none' (its default, 'adjustments', asks for one exactly here); missing where it is owed, the call is 400.`)
  .option(`--sku <sku>`, `Inline single-item form: the article number to move (instead of \`product_id\`).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode, productId, quantity, reason, sku } = await promptForMissing(
          _options,
          inventoriesAdjustSpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, inventoriesAdjustSpecs, { method: "post" });
const inventoriesAvailabilitySpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The items to check, at most 200 in one call. A cart, a category page, a feed row — one call answers them all, which is why this route is the batch one.", type: "array", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Restrict the check to ONE location, by its code — the stock a click-and-collect store can promise today. Omitted, every ENABLED location is summed; a disabled one is never counted either way.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Inline single-item form: the product to move, instead of a one-entry `items` array. The two forms are equivalent — nothing downstream knows which arrived.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Inline single-item form: how many are wanted (default 1). It decides `orderable` and nothing else.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Inline single-item form: the article number to move (instead of `product_id`).", type: "string", required: false },
];
inventoriesStock
  .command(`inventories-availability`)
  .description(`THE stock call of this app, and a batch one: name any number of items and each comes back with \`on_hand\`, \`reserved\` and the derived \`available\` (their difference, computed on read and stored nowhere), summed across the locations in scope and broken down per location, plus \`orderable\` — whether this much of it can be promised at this moment. An item this app has never seen is NOT an error: it comes back tracked:false, and the storefront decides whether an untracked item sells freely. It is also the most customised surface this product has in the field. A tenant whose stock really lives in an ERP — SAP live stock is the ordinary case, not the exotic one — replaces exactly this one capability, 1:1, with a custom app through the gateway's capability override, while every other route here keeps doing the stock-keeping CRUD unchanged. That is why the request and response shapes below read as a contract to be implemented rather than as an implementation detail: whatever ends up answering this path has to answer in these terms.`)
  .option(`--items [items...]`, `The items to check, at most 200 in one call. A cart, a category page, a feed row — one call answers them all, which is why this route is the batch one.`)
  .option(`--location-code <location-code>`, `Restrict the check to ONE location, by its code — the stock a click-and-collect store can promise today. Omitted, every ENABLED location is summed; a disabled one is never counted either way.`)
  .option(`--product-id <product-id>`, `Inline single-item form: the product to move, instead of a one-entry \`items\` array. The two forms are equivalent — nothing downstream knows which arrived.`)
  .option(`--quantity <quantity>`, `Inline single-item form: how many are wanted (default 1). It decides \`orderable\` and nothing else.`, parseInteger)
  .option(`--sku <sku>`, `Inline single-item form: the article number to move (instead of \`product_id\`).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode, productId, quantity, sku } = await promptForMissing(
          _options,
          inventoriesAvailabilitySpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, inventoriesAvailabilitySpecs, { method: "post" });
const inventoriesMovementsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc' — a bare column sorts ascending. The column has to be one this entity has; anything else is refused with 400.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Exact-match filter on `id`. The row's own id, generated by the database.", type: "string", required: false },
  { key: "locationId", option: "--location-id <location-id>", name: "location_id", description: "Exact-match filter on `location_id`. Every booking at one location.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Exact-match filter on `product_id`. The product this booking is for, copied from the call.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Exact-match filter on `sku`. Every booking for one SKU.", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Exact-match filter on `type`. What the booking records. The permitted set is the CHECK constraint — GET /inventories/vocabularies/movement-types has the words for it.", type: "string", required: false, enum: ["inbound","adjustment","reserve","release","shipment","restock"] },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Exact-match filter on `quantity`. Exact signed quantity, which is a needle-in-a-haystack filter rather than a range: `?quantity=-5` finds the bookings that moved exactly five out.", type: "number", required: false },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "Exact-match filter on `order_ref`. One order's whole stock history: its reserve, release, shipment and restock bookings.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Exact-match filter on `reason`. Why the booking happened, in a person's words — a delivery note number, 'stocktake 2026-03', 'damaged in transit'.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Exact-match filter on `metadata`. Free-form, and two keys this app writes itself: `backordered` — on a `reserve` booking, how much of the hold was not covered by stock on hand; `shortfall` — on a `shipment` booking, how much was committed that was not physically there (`on_hand` floors at 0, so the difference is recorded here instead of vanishing). The WHOLE jsonb document is compared, serialized as JSON — this is equality, not a key lookup or a containment query, and a value that does not parse is answered 400.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact-match filter on `created_at`. Exact timestamp. There is no range filter on the ledger — page it with `?order=created_at.desc` instead.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventoriesStock
  .command(`inventories-movements-list`)
  .description(`The movements ledger, read end to end. Every stock change this app has ever made is a booking row in it — a receipt, a correction, a hold, a release, a shipment, a return — which is what lets one list be an audit trail and an event feed at the same time: these are the rows the \`stock_movement.created\` event carries, so a consumer that missed an event catches up by paging here. Append-only: the ledger has no update and no delete, because a correction is another booking. \`order=created_at.desc\` is the feed order.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc' — a bare column sorts ascending. The column has to be one this entity has; anything else is refused with 400.`)
  .option(`--id <id>`, `Exact-match filter on \`id\`. The row's own id, generated by the database.`)
  .option(`--location-id <location-id>`, `Exact-match filter on \`location_id\`. Every booking at one location.`)
  .option(`--product-id <product-id>`, `Exact-match filter on \`product_id\`. The product this booking is for, copied from the call.`)
  .option(`--sku <sku>`, `Exact-match filter on \`sku\`. Every booking for one SKU.`)
  .option(`--type <type>`, `Exact-match filter on \`type\`. What the booking records. The permitted set is the CHECK constraint — GET /inventories/vocabularies/movement-types has the words for it.`)
  .option(`--quantity <quantity>`, `Exact-match filter on \`quantity\`. Exact signed quantity, which is a needle-in-a-haystack filter rather than a range: \`?quantity=-5\` finds the bookings that moved exactly five out.`, parseInteger)
  .option(`--order-ref <order-ref>`, `Exact-match filter on \`order_ref\`. One order's whole stock history: its reserve, release, shipment and restock bookings.`)
  .option(`--reason <reason>`, `Exact-match filter on \`reason\`. Why the booking happened, in a person's words — a delivery note number, 'stocktake 2026-03', 'damaged in transit'.`)
  .option(`--metadata <metadata>`, `Exact-match filter on \`metadata\`. Free-form, and two keys this app writes itself: \`backordered\` — on a \`reserve\` booking, how much of the hold was not covered by stock on hand; \`shortfall\` — on a \`shipment\` booking, how much was committed that was not physically there (\`on_hand\` floors at 0, so the difference is recorded here instead of vanishing). The WHOLE jsonb document is compared, serialized as JSON — this is equality, not a key lookup or a containment query, and a value that does not parse is answered 400.`)
  .option(`--created-at <created-at>`, `Exact-match filter on \`created_at\`. Exact timestamp. There is no range filter on the ledger — page it with \`?order=created_at.desc\` instead.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, locationId, productId, sku, type, quantity, orderRef, reason, metadata, createdAt, filter } = await promptForMissing(
          _options,
          inventoriesMovementsListSpecs,
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
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (locationId !== undefined) {
          _payload[`location_id`] = locationId;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, inventoriesMovementsListSpecs, { method: "get" });
const inventoriesMovementsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The ledger booking.", type: "string", required: true, resource: { listPath: "/inventories/movements", hasLimit: true } },
];
inventoriesStock
  .command(`inventories-movements-get`)
  .description(`A movement is one booking row in the ledger, and the ledger is append-only: there is no update and no delete, because a correction is another booking. \`quantity\` is SIGNED and its sign follows the \`type\` — a receipt books +5 and the reserve that promises those goods books −5, even though the reservation it created carries +5 as a positive hold. GET /inventories/vocabularies/movement-types is the list of types with the words for them. A booking says what changed, not what the balance became: it carries no running total, so the row's story is read by listing the ledger for that location and item rather than by fetching one id. \`location_id\` is a plain uuid and not a foreign key, so a booking outlives the location it was made at and this route will happily hand back one whose location no longer resolves — that is the audit trail doing its job, not a broken row. Fixing a wrong booking is another booking (POST /inventories/adjust); nothing here can be edited or removed.`)
  .option(`--id <id>`, `The ledger booking.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          inventoriesMovementsGetSpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, inventoriesMovementsGetSpecs, { method: "get" });
const inventoriesReceiveSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The goods that arrived, at most 200 in one call — a delivery, a production batch, an opening balance.", type: "array", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Which location took the delivery. Omitted, the `default_location_code` setting decides; a code no location carries is answered 400 rather than booked somewhere else.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Inline single-item form: the product to move, instead of a one-entry `items` array. The two forms are equivalent — nothing downstream knows which arrived.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Inline single-item form: how many arrived. Positive.", type: "number", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "What the ledger should record about this receipt — a delivery note number, a production order. Owed only when `movement_reason_required` is 'all'; the contract does not require it, because whether it is owed is the tenant's setting and not this route's rule.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Inline single-item form: the article number to move (instead of `product_id`).", type: "string", required: false },
];
inventoriesStock
  .command(`inventories-receive`)
  .description(`Books a delivery into the receiving location (the caller's location_code, else the default_location_code setting), creating the stock row if the item is new. A reason is optional unless movement_reason_required is 'all'. Takes a batch or one item inline.`)
  .option(`--items [items...]`, `The goods that arrived, at most 200 in one call — a delivery, a production batch, an opening balance.`)
  .option(`--location-code <location-code>`, `Which location took the delivery. Omitted, the \`default_location_code\` setting decides; a code no location carries is answered 400 rather than booked somewhere else.`)
  .option(`--product-id <product-id>`, `Inline single-item form: the product to move, instead of a one-entry \`items\` array. The two forms are equivalent — nothing downstream knows which arrived.`)
  .option(`--quantity <quantity>`, `Inline single-item form: how many arrived. Positive.`, parseInteger)
  .option(`--reason <reason>`, `What the ledger should record about this receipt — a delivery note number, a production order. Owed only when \`movement_reason_required\` is 'all'; the contract does not require it, because whether it is owed is the tenant's setting and not this route's rule.`)
  .option(`--sku <sku>`, `Inline single-item form: the article number to move (instead of \`product_id\`).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode, productId, quantity, reason, sku } = await promptForMissing(
          _options,
          inventoriesReceiveSpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, inventoriesReceiveSpecs, { method: "post" });
inventoriesStock
  .command(`inventories-reorder-alerts`)
  .description(`The replenishment worklist: the stock rows that have run down far enough that somebody has to order more, in one list rather than as a query a caller has to build. Computed on read, so it is never stale: a row alerts when available (on_hand − reserved) has fallen to or below its own reorder_point, or the reorder_point_default setting when it carries none. A point of 0 never alerts. Answers enabled:false with an empty list when reorder_alert_enabled is off — a tenant replenishing from an ERP should not be told twice.`)
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
const inventoriesReorderScanSpecs: PromptSpec[] = [
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
inventoriesStock
  .command(`inventories-reorder-scan`)
  .description(`Publishes \`stock_level.low\` on the event bus for every row GET /inventories/reorder-alerts currently lists, so replenishment can be driven by a subscriber instead of by somebody refreshing that page. Also runs hourly as the \`reorder-scan\` schedule; this route is for driving it on demand. The event id is derived from the stock row and the day, so a re-run — a second click, a retried cron tick — publishes nothing new and returns the ids the first run produced. Nothing is written to the app's own data: this reads the same figures the alerts list computes and hands them to the bus. Answers enabled:false without publishing when reorder_alert_enabled is off.`)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { data } = await promptForMissing(
          _options,
          inventoriesReorderScanSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reorder-alerts/scan`;
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, inventoriesReorderScanSpecs, { method: "post" });
const inventoriesRestockSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The goods that came back, at most 200 in one call. Whether they rejoin sellable stock is `restock`, not this list.", type: "array", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Where the goods came back to — a returns warehouse is a location like any other. Omitted, the `default_location_code` setting decides.", type: "string", required: false },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order the goods came back from. It is written onto the ledger booking, so the return shows up in that order's stock history next to its reserve and shipment — no reservation is touched by it.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Inline single-item form: the product to move, instead of a one-entry `items` array. The two forms are equivalent — nothing downstream knows which arrived.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Inline single-item form: how many came back. Positive.", type: "number", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why the goods came back — 'wrong size', 'damaged on arrival'. Owed only when `movement_reason_required` is 'all'.", type: "string", required: false },
  { key: "restock", option: "--restock <restock>", name: "restock", description: "Do these goods rejoin SELLABLE stock? A merchant decision, not a fact: apparel usually restocks, hygiene articles never do, many merchants inspect first. Omit it to follow the `restock_on_return_default` setting. `false` answers `restocked: false`, moves nothing and books NOTHING — there is no movement to write, because no stock moved, and that is the branch that makes this route a 200 while its sibling `receive` is a 201.", type: "boolean", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Inline single-item form: the article number to move (instead of `product_id`).", type: "string", required: false },
];
inventoriesStock
  .command(`inventories-restock`)
  .description(`Whether a return rejoins sellable stock follows restock_on_return_default, overridable per call with 'restock'. When the answer is no the response says restocked:false and nothing moves — there is no movement to book, because no stock moved. That branch is why this route answers 200 and its sibling \`receive\` answers 201: a restock may legitimately create nothing.`)
  .option(`--items [items...]`, `The goods that came back, at most 200 in one call. Whether they rejoin sellable stock is \`restock\`, not this list.`)
  .option(`--location-code <location-code>`, `Where the goods came back to — a returns warehouse is a location like any other. Omitted, the \`default_location_code\` setting decides.`)
  .option(`--order-ref <order-ref>`, `The order the goods came back from. It is written onto the ledger booking, so the return shows up in that order's stock history next to its reserve and shipment — no reservation is touched by it.`)
  .option(`--product-id <product-id>`, `Inline single-item form: the product to move, instead of a one-entry \`items\` array. The two forms are equivalent — nothing downstream knows which arrived.`)
  .option(`--quantity <quantity>`, `Inline single-item form: how many came back. Positive.`, parseInteger)
  .option(`--reason <reason>`, `Why the goods came back — 'wrong size', 'damaged on arrival'. Owed only when \`movement_reason_required\` is 'all'.`)
  .option(
    `--restock [value]`,
    `Do these goods rejoin SELLABLE stock? A merchant decision, not a fact: apparel usually restocks, hygiene articles never do, many merchants inspect first. Omit it to follow the \`restock_on_return_default\` setting. \`false\` answers \`restocked: false\`, moves nothing and books NOTHING — there is no movement to write, because no stock moved, and that is the branch that makes this route a 200 while its sibling \`receive\` is a 201.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--sku <sku>`, `Inline single-item form: the article number to move (instead of \`product_id\`).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode, orderRef, productId, quantity, reason, restock, sku } = await promptForMissing(
          _options,
          inventoriesRestockSpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, inventoriesRestockSpecs, { method: "post" });
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc' — a bare column sorts ascending. The column has to be one this entity has; anything else is refused with 400.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Exact-match filter on `id`. The row's own id, generated by the database.", type: "string", required: false },
  { key: "locationId", option: "--location-id <location-id>", name: "location_id", description: "Exact-match filter on `location_id`. The rows held at one location. An id no location carries is an empty page, not an error.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Exact-match filter on `product_id`. The rows tracking one product, across every location.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Exact-match filter on `sku`. The rows tracking one SKU — the identity used when an item has no product id.", type: "string", required: false },
  { key: "onHand", option: "--on-hand <on-hand>", name: "on_hand", description: "Exact-match filter on `on_hand`. Exact balance, which is rarely what a reader wants: `?on_hand=0` finds the rows that are empty. There is no range filter here — GET /inventories/reorder-alerts is the \"running low\" question.", type: "number", required: false },
  { key: "reserved", option: "--reserved <reserved>", name: "reserved", description: "Exact-match filter on `reserved`. Exact reserved quantity. `?reserved=0` finds the rows nothing is holding.", type: "number", required: false },
  { key: "reorderPoint", option: "--reorder-point <reorder-point>", name: "reorder_point", description: "Exact-match filter on `reorder_point`. The available quantity at or below which this row belongs on the replenishment worklist (GET /inventories/reorder-alerts).", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Exact-match filter on `metadata`. Free-form data the tenant keeps on this stock row, and ONE key this app reads: `backorder`. The WHOLE jsonb document is compared, serialized as JSON — this is equality, not a key lookup or a containment query, and a value that does not parse is answered 400.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact-match filter on `created_at`. When the row was created.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact-match filter on `updated_at`. When this row was last written.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventoriesStock
  .command(`list`)
  .description(`A stock level is ONE item at ONE location, and it carries two numbers, neither of which is the sellable one: \`on_hand\` is what is physically there INCLUDING everything already promised, and \`reserved\` is what has been promised — it never reduces \`on_hand\`. What may still be sold is their difference, and it is derived on read and never stored, so there is no \`available\` column to read, filter or order by. This is the operator's view — the whole book, filtered by location or by item — not the shop's: a storefront asking "can I sell five of this" wants POST /inventories/availability, which sums an item across locations and answers \`orderable\` instead of leaving the caller to subtract. Two things this list will not do: it has no range filters, so "everything running low" is GET /inventories/reorder-alerts and not a query here; and it does not promise one row per item per location — no unique index enforces that. POST /inventories/stock refuses a duplicate with a 409, but that is a check and not a constraint, so a row written past it, or one that predates the guard, still splits an item's balance in two, and the write routes find and update whichever of them the database returns first.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc' — a bare column sorts ascending. The column has to be one this entity has; anything else is refused with 400.`)
  .option(`--id <id>`, `Exact-match filter on \`id\`. The row's own id, generated by the database.`)
  .option(`--location-id <location-id>`, `Exact-match filter on \`location_id\`. The rows held at one location. An id no location carries is an empty page, not an error.`)
  .option(`--product-id <product-id>`, `Exact-match filter on \`product_id\`. The rows tracking one product, across every location.`)
  .option(`--sku <sku>`, `Exact-match filter on \`sku\`. The rows tracking one SKU — the identity used when an item has no product id.`)
  .option(`--on-hand <on-hand>`, `Exact-match filter on \`on_hand\`. Exact balance, which is rarely what a reader wants: \`?on_hand=0\` finds the rows that are empty. There is no range filter here — GET /inventories/reorder-alerts is the "running low" question.`, parseInteger)
  .option(`--reserved <reserved>`, `Exact-match filter on \`reserved\`. Exact reserved quantity. \`?reserved=0\` finds the rows nothing is holding.`, parseInteger)
  .option(`--reorder-point <reorder-point>`, `Exact-match filter on \`reorder_point\`. The available quantity at or below which this row belongs on the replenishment worklist (GET /inventories/reorder-alerts).`, parseInteger)
  .option(`--metadata <metadata>`, `Exact-match filter on \`metadata\`. Free-form data the tenant keeps on this stock row, and ONE key this app reads: \`backorder\`. The WHOLE jsonb document is compared, serialized as JSON — this is equality, not a key lookup or a containment query, and a value that does not parse is answered 400.`)
  .option(`--created-at <created-at>`, `Exact-match filter on \`created_at\`. When the row was created.`)
  .option(`--updated-at <updated-at>`, `Exact-match filter on \`updated_at\`. When this row was last written.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, locationId, productId, sku, onHand, reserved, reorderPoint, metadata, createdAt, updatedAt, filter } = await promptForMissing(
          _options,
          listSpecs,
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
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (locationId !== undefined) {
          _payload[`location_id`] = locationId;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (onHand !== undefined) {
          _payload[`on_hand`] = onHand;
        }
        if (reserved !== undefined) {
          _payload[`reserved`] = reserved;
        }
        if (reorderPoint !== undefined) {
          _payload[`reorder_point`] = reorderPoint;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (updatedAt !== undefined) {
          _payload[`updated_at`] = updatedAt;
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "locationId", option: "--location-id <location-id>", name: "location_id", description: "The location this balance is held at — a `locations` row of this tenant (GET /inventories/locations). There is ONE stock row per (location, item): the same SKU in three warehouses is three rows, and what a storefront shows is their sum (POST /inventories/availability). Deleting the location deletes its stock rows with it. It has to exist already (GET /inventories/locations); an id no location carries is answered 400 by the foreign key, not 404.", type: "string", required: true },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data the tenant keeps on this stock row, and ONE key this app reads: `backorder`. A literal boolean `true` there opts this item into backorders while `backorder_policy` is 'allow_per_sku' — anything else, including the string \"true\", does not, and the reservation is refused with 422. That is how a merchant backorders the supplier-stocked half of a catalogue without promising the rest.", type: "object", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The product this row tracks, as the products app knows it. A row tracks a `product_id` or a `sku` — the database insists on at least one (CHECK `product_id is not null or sku is not null`) — and matching is exact: a row keyed by SKU is not found by product id.", type: "string", required: false },
  { key: "reorderPoint", option: "--reorder-point <reorder-point>", name: "reorder_point", description: "The available quantity at or below which this row belongs on the replenishment worklist (GET /inventories/reorder-alerts). Null falls back to the `reorder_point_default` setting, so replenishment works without a threshold per SKU; 0 never alerts, which is how one row opts out.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The article number this row tracks when there is no product id, which is the normal case for an ERP-stocked catalogue. Exact match, and the identity every stock call may use instead of a uuid.", type: "string", required: false },
];
inventoriesStock
  .command(`create`)
  .description(`Registers an item at a location. The row is born at ZERO and never gets a balance from this call: \`on_hand\` and \`reserved\` are NOT accepted, because they are the running total of the movements ledger, so an opening balance is a receipt (POST /inventories/receive) rather than a field here, and the only thing that ever moves either number afterwards is another booking. What this row carries is its identity (location + \`product_id\`/\`sku\`), its \`reorder_point\` and its metadata. \`location_id\` is the only field a create cannot omit; every other column is optional or defaulted by the database. The one rule that is a CHECK rather than a column is that a row has to identify its item, so \`product_id\` or \`sku\` has to be there as well. Mostly you do not need this route at all — every stock call creates the row it is missing — and a second row for an item this location already tracks is answered 409: no unique index enforces one row per item per location, so that row would split the item's balance across two rows the write routes cannot tell apart, each of them updating whichever the database returns first. That guard is a check before the insert and not a constraint, so it closes a double click or a re-run import and does not claim to close a race between two simultaneous creates.`)
  .option(`--location-id <location-id>`, `The location this balance is held at — a \`locations\` row of this tenant (GET /inventories/locations). There is ONE stock row per (location, item): the same SKU in three warehouses is three rows, and what a storefront shows is their sum (POST /inventories/availability). Deleting the location deletes its stock rows with it. It has to exist already (GET /inventories/locations); an id no location carries is answered 400 by the foreign key, not 404.`)
  .option(`--metadata <metadata>`, `Free-form data the tenant keeps on this stock row, and ONE key this app reads: \`backorder\`. A literal boolean \`true\` there opts this item into backorders while \`backorder_policy\` is 'allow_per_sku' — anything else, including the string "true", does not, and the reservation is refused with 422. That is how a merchant backorders the supplier-stocked half of a catalogue without promising the rest.`)
  .option(`--product-id <product-id>`, `The product this row tracks, as the products app knows it. A row tracks a \`product_id\` or a \`sku\` — the database insists on at least one (CHECK \`product_id is not null or sku is not null\`) — and matching is exact: a row keyed by SKU is not found by product id.`)
  .option(`--reorder-point <reorder-point>`, `The available quantity at or below which this row belongs on the replenishment worklist (GET /inventories/reorder-alerts). Null falls back to the \`reorder_point_default\` setting, so replenishment works without a threshold per SKU; 0 never alerts, which is how one row opts out.`, parseInteger)
  .option(`--sku <sku>`, `The article number this row tracks when there is no product id, which is the normal case for an ERP-stocked catalogue. Exact match, and the identity every stock call may use instead of a uuid.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { locationId, metadata, productId, reorderPoint, sku } = await promptForMissing(
          _options,
          createSpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The stock row.", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
];
inventoriesStock
  .command(`delete`)
  .description(`Stops tracking one item at one location. A stock level is ONE item at ONE location, and it carries two numbers, neither of which is the sellable one: \`on_hand\` is what is physically there INCLUDING everything already promised, and \`reserved\` is what has been promised — it never reduces \`on_hand\`. What may still be sold is their difference, and it is derived on read and never stored, so there is no \`available\` column to read, filter or order by. A deleted balance is not recoverable: the ledger is the audit trail, not the source of truth, and nothing in this app ever replays it to rebuild a number — so the next receipt for the same item here creates a FRESH row at zero, standing next to movements that say otherwise. That used to be a trap a caller discovered afterwards. It is a stated property now, because the route REFUSES while the row still holds anything, and answers 409 with what it holds. The two things that block are the location delete's two, asked of one row. A reservation still \`active\` against this item at this location is the sharper one: /release and /commit look their stock row up by (location, item) on the very next call and would find nothing, so the hold would lower no \`reserved\` and /commit would book the whole quantity as a shortfall — orphaned immediately rather than eventually. \`on_hand\` above zero is the stronger one: deleting a LOCATION at least meant "close this warehouse" and took the balances as a side effect of the cascade, while this row IS the balance, so the delete can only ever mean "no longer tracked here" — true once the number is zero and a lie while it is not. POST /inventories/stock/{id}/adjust to zero is the operation that makes it true, and it BOOKS the movement, so the stock leaves through the ledger instead of vanishing with the row. Nothing points at it by foreign key, so the database takes nothing else with it. History therefore never blocks and is never deleted — the ledger is keyed on (location, item) and never on this id, so its bookings survive a row that is gone, BY DESIGN, exactly as they survive a location that is gone.`)
  .option(`--id <id>`, `The stock row.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`inventories-stock delete`);
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The stock row.", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
];
inventoriesStock
  .command(`get`)
  .description(`A stock level is ONE item at ONE location, and it carries two numbers, neither of which is the sellable one: \`on_hand\` is what is physically there INCLUDING everything already promised, and \`reserved\` is what has been promised — it never reduces \`on_hand\`. What may still be sold is their difference, and it is derived on read and never stored, so there is no \`available\` column to read, filter or order by. Read it to see one item's position at one place, and to get the id the two row-scoped routes take: POST /inventories/stock/{id}/adjust corrects this balance, and GET /inventories/reorder-alerts reports it by this id. What it does not answer is how the balance got here — that is GET /inventories/movements filtered by the location and item on this row, because a movement points at (location, item) and never at a stock row id.`)
  .option(`--id <id>`, `The stock row.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The stock row.", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
  { key: "locationId", option: "--location-id <location-id>", name: "location_id", description: "The location this balance is held at — a `locations` row of this tenant (GET /inventories/locations). There is ONE stock row per (location, item): the same SKU in three warehouses is three rows, and what a storefront shows is their sum (POST /inventories/availability). Deleting the location deletes its stock rows with it. It has to exist already (GET /inventories/locations); an id no location carries is answered 400 by the foreign key, not 404.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data the tenant keeps on this stock row, and ONE key this app reads: `backorder`. A literal boolean `true` there opts this item into backorders while `backorder_policy` is 'allow_per_sku' — anything else, including the string \"true\", does not, and the reservation is refused with 422. That is how a merchant backorders the supplier-stocked half of a catalogue without promising the rest.", type: "object", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The product this row tracks, as the products app knows it. A row tracks a `product_id` or a `sku` — the database insists on at least one (CHECK `product_id is not null or sku is not null`) — and matching is exact: a row keyed by SKU is not found by product id.", type: "string", required: false },
  { key: "reorderPoint", option: "--reorder-point <reorder-point>", name: "reorder_point", description: "The available quantity at or below which this row belongs on the replenishment worklist (GET /inventories/reorder-alerts). Null falls back to the `reorder_point_default` setting, so replenishment works without a threshold per SKU; 0 never alerts, which is how one row opts out.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The article number this row tracks when there is no product id, which is the normal case for an ERP-stocked catalogue. Exact match, and the identity every stock call may use instead of a uuid.", type: "string", required: false },
];
inventoriesStock
  .command(`update`)
  .description(`Partial update of everything on the row EXCEPT its balance: reorder_point, metadata, identity. on_hand and reserved are dropped from the body — every stock change is a movement, and a body carrying nothing else is answered 422 with the route that was meant (POST /inventories/stock/{id}/adjust).`)
  .option(`--id <id>`, `The stock row.`)
  .option(`--location-id <location-id>`, `The location this balance is held at — a \`locations\` row of this tenant (GET /inventories/locations). There is ONE stock row per (location, item): the same SKU in three warehouses is three rows, and what a storefront shows is their sum (POST /inventories/availability). Deleting the location deletes its stock rows with it. It has to exist already (GET /inventories/locations); an id no location carries is answered 400 by the foreign key, not 404.`)
  .option(`--metadata <metadata>`, `Free-form data the tenant keeps on this stock row, and ONE key this app reads: \`backorder\`. A literal boolean \`true\` there opts this item into backorders while \`backorder_policy\` is 'allow_per_sku' — anything else, including the string "true", does not, and the reservation is refused with 422. That is how a merchant backorders the supplier-stocked half of a catalogue without promising the rest.`)
  .option(`--product-id <product-id>`, `The product this row tracks, as the products app knows it. A row tracks a \`product_id\` or a \`sku\` — the database insists on at least one (CHECK \`product_id is not null or sku is not null\`) — and matching is exact: a row keyed by SKU is not found by product id.`)
  .option(`--reorder-point <reorder-point>`, `The available quantity at or below which this row belongs on the replenishment worklist (GET /inventories/reorder-alerts). Null falls back to the \`reorder_point_default\` setting, so replenishment works without a threshold per SKU; 0 never alerts, which is how one row opts out.`, parseInteger)
  .option(`--sku <sku>`, `The article number this row tracks when there is no product id, which is the normal case for an ERP-stocked catalogue. Exact match, and the identity every stock call may use instead of a uuid.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, locationId, metadata, productId, reorderPoint, sku } = await promptForMissing(
          _options,
          updateSpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, updateSpecs, { method: "put" });
const adjustSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The stock row to correct.", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "The SIGNED correction to this row's `on_hand`: −3 writes off three, +3 finds three. A delta, not the new balance. Zero is refused (400). A correction that would take `on_hand` below zero is a 422 the database insists on; one that would take it below this row's own `reserved` is a 422 the `allow_negative_stock` setting can permit.", type: "number", required: true },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why this row is being corrected, written onto the ledger booking. Owed unless `movement_reason_required` is 'none'.", type: "string", required: false },
];
inventoriesStock
  .command(`adjust`)
  .description(`Corrects the balance of ONE stock row, and only that one. It is the row-scoped twin of POST /inventories/adjust: the row already knows its location and item, so a caller owes nothing but a SIGNED delta on \`on_hand\` — positive to add, negative to take away — and a reason for it. The delta is not written onto the balance either; it is booked into the movements ledger as an \`adjustment\` and the balance follows, which is why the answer hands back the row at its new value instead of an acknowledgement. This is the route that replaced the Cockpit's editable on_hand field.`)
  .option(`--id <id>`, `The stock row to correct.`)
  .option(`--quantity <quantity>`, `The SIGNED correction to this row's \`on_hand\`: −3 writes off three, +3 finds three. A delta, not the new balance. Zero is refused (400). A correction that would take \`on_hand\` below zero is a 422 the database insists on; one that would take it below this row's own \`reserved\` is a 422 the \`allow_negative_stock\` setting can permit.`, parseInteger)
  .option(`--reason <reason>`, `Why this row is being corrected, written onto the ledger booking. Owed unless \`movement_reason_required\` is 'none'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, quantity, reason } = await promptForMissing(
          _options,
          adjustSpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, adjustSpecs, { method: "post" });
const inventoriesVocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventoriesStock
  .command(`inventories-vocabularies-list`)
  .description(`Discovery for the vocabulary routes: the enums this app publishes, each with its name, its title and its description and deliberately WITHOUT its values, so finding out what exists costs one small call and not one per vocabulary. Names: location-types, movement-types, reservation-statuses. Fetch one with GET /inventories/vocabularies/{name}; a client holding the qualified pair 'inventories.<name>' builds that URL from the pair alone.`)
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
          inventoriesVocabulariesListSpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, inventoriesVocabulariesListSpecs, { method: "get" });
const inventoriesVocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id. One of: location-types, movement-types, reservation-statuses. Anything else is a 404, so the enum is the complete set and not a suggestion.", type: "string", required: true, enum: ["location-types","movement-types","reservation-statuses"], resource: { listPath: "/inventories/vocabularies", hasLimit: false } },
];
inventoriesStock
  .command(`inventories-vocabularies-get`)
  .description(`One vocabulary in full: every permitted value, each carrying the title and description a person reads for it and the badge tone a UI colours it with, so a client renders a status or a movement type without a hard-coded table of its own. The values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift — a value added to the constraint appears here even before anyone labels it, titled from its own key. Values come back in constraint order, which is lifecycle order for a status. 'closed' says the set is exhaustive, so a value outside it is stale data rather than a missing label. Names: location-types, movement-types, reservation-statuses.`)
  .option(`--name <name>`, `The vocabulary name — the part after the dot in the qualified id. One of: location-types, movement-types, reservation-statuses. Anything else is a 404, so the enum is the complete set and not a suggestion.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          inventoriesVocabulariesGetSpecs,
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
registerPromptSpecs(inventoriesStock.commands.at(-1)!, inventoriesVocabulariesGetSpecs, { method: "get" });
