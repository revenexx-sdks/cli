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
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const inventoriesReservations = new Command("inventories-reservations")
  .description(
    commandDescriptions["inventoriesReservations"] ??
      `Stock promised to an order, and the three ways that promise ends. A reservation is order-scoped: POST /inventories/reserve creates it against an \`order_ref\`, and nothing else does — there is no create, update or delete route here, because the lifecycle IS the API. Reserving raises \`reserved\` on a stock row and leaves \`on_hand\` alone (the goods are still in the building); committing ships them and takes them out of both; releasing gives them back; and the sweep is a release on a timer, for the checkouts nobody finished. \`reserved\` is the only reason a stock row's two numbers ever differ, which is what makes this a group and not a footnote to the stock one. Which location a hold lands at is not decided here — that is the tenant's allocation strategy choosing between locations, and it is described with them.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const inventoriesCommitSpecs: PromptSpec[] = [
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order this hold belongs to. The caller supplies it — this app mints nothing — and it is the handle POST /inventories/release and POST /inventories/commit act on, so it has to be the same string the order carries elsewhere. At least one character (CHECK `length(order_ref) > 0`). Not unique: an order holds one reservation per item, and they are released or committed together. Every ACTIVE hold under this reference ships: `on_hand` and `reserved` both fall and a `shipment` booking is written for each. Unlike release, committing an order that has nothing active is a 422 — it means the hold was already released or already shipped, and shipping twice is worth saying out loud.", type: "string", required: true },
];
inventoriesReservations
  .command(`inventories-commit`)
  .description(`Call this when the goods leave the building, and not before. Reserving only promised them — \`reserved\` went up and \`on_hand\` did not move, because the stock was still on the shelf; committing is the moment they are gone, so it lowers BOTH on each stock row and writes one \`shipment\` booking per hold, with a SIGNED negative quantity, as the ledger's record that they left. It takes the whole \`order_ref\` and every hold still active on it: there is no partial commit and no per-line id, so a part shipment means reserving the parts separately in the first place. It is also final — 'committed' ends the lifecycle and nothing moves a hold out of it, so goods coming back are POST /inventories/restock (a new receipt), never an undo of this. An order with nothing active is a 422 rather than a quiet zero, because it means the hold was already released or already shipped; /release answers the same situation with a 200 on purpose, since cancelling twice is harmless and shipping twice is not.`)
  .option(`--order-ref <order-ref>`, `The order this hold belongs to. The caller supplies it — this app mints nothing — and it is the handle POST /inventories/release and POST /inventories/commit act on, so it has to be the same string the order carries elsewhere. At least one character (CHECK \`length(order_ref) > 0\`). Not unique: an order holds one reservation per item, and they are released or committed together. Every ACTIVE hold under this reference ships: \`on_hand\` and \`reserved\` both fall and a \`shipment\` booking is written for each. Unlike release, committing an order that has nothing active is a 422 — it means the hold was already released or already shipped, and shipping twice is worth saying out loud.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderRef } = await promptForMissing(
          _options,
          inventoriesCommitSpecs,
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
registerPromptSpecs(inventoriesReservations.commands.at(-1)!, inventoriesCommitSpecs, { method: "post" });
const inventoriesReleaseSpecs: PromptSpec[] = [
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order this hold belongs to. The caller supplies it — this app mints nothing — and it is the handle POST /inventories/release and POST /inventories/commit act on, so it has to be the same string the order carries elsewhere. At least one character (CHECK `length(order_ref) > 0`). Not unique: an order holds one reservation per item, and they are released or committed together. Every ACTIVE hold under this reference is given back; ones already committed or released are left alone. A reference no reservation carries releases nothing and answers `released: 0` — not an error, which is what makes a retried cancellation safe.", type: "string", required: true },
];
inventoriesReservations
  .command(`inventories-release`)
  .description(`The cancellation end of the reserve → commit | release lifecycle: it takes an \`order_ref\`, ends every hold still active on it, gives the stock back and writes a 'release' booking for each one, exactly like the expiry sweeper. Idempotent: an order with nothing active answers released:0 — which is why it is a 200 and not the 422 commit answers.`)
  .option(`--order-ref <order-ref>`, `The order this hold belongs to. The caller supplies it — this app mints nothing — and it is the handle POST /inventories/release and POST /inventories/commit act on, so it has to be the same string the order carries elsewhere. At least one character (CHECK \`length(order_ref) > 0\`). Not unique: an order holds one reservation per item, and they are released or committed together. Every ACTIVE hold under this reference is given back; ones already committed or released are left alone. A reference no reservation carries releases nothing and answers \`released: 0\` — not an error, which is what makes a retried cancellation safe.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderRef } = await promptForMissing(
          _options,
          inventoriesReleaseSpecs,
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
registerPromptSpecs(inventoriesReservations.commands.at(-1)!, inventoriesReleaseSpecs, { method: "post" });
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc' — a bare column sorts ascending. The column has to be one this entity has; anything else is refused with 400.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Exact-match filter on `id`. The row's own id, generated by the database.", type: "string", required: false },
  { key: "locationId", option: "--location-id <location-id>", name: "location_id", description: "Exact-match filter on `location_id`. The holds served by one location.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Exact-match filter on `product_id`. The product being held, copied from the reserve call.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Exact-match filter on `sku`. The article number being held, copied from the reserve call.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Exact-match filter on `quantity`. How much is being held, ALWAYS POSITIVE — the database CHECK is `quantity > 0`, because a hold of nothing is not a hold.", type: "number", required: false },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "Exact-match filter on `order_ref`. Every hold an order carries. This is the lookup POST /inventories/release and /commit act on.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Exact-match filter on `status`. Where the hold stands in the reserve → commit | release lifecycle. Only 'active' counts towards `reserved`, so `?status=active` is the set that is really holding stock.", type: "string", required: false, enum: ["active","released","committed"] },
  { key: "expiresAt", option: "--expires-at <expires-at>", name: "expires_at", description: "Exact-match filter on `expires_at`. Exact deadline, not a range — this cannot answer \"what expires today\". The sweeper is what acts on deadlines (POST /inventories/reservations/sweep).", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Exact-match filter on `metadata`. Free-form, and one key this app writes itself: `backordered` — how much of this hold was not covered by stock on hand when it was taken. The WHOLE jsonb document is compared, serialized as JSON — this is equality, not a key lookup or a containment query, and a value that does not parse is answered 400.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact-match filter on `created_at`. When the row was created.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact-match filter on `updated_at`. When the hold last changed — in practice, when it moved out of `active`..", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventoriesReservations
  .command(`list`)
  .description(`A reservation is stock promised to an \`order_ref\`. It is created only by POST /inventories/reserve and moved only by /commit, /release and the expiry sweep — there is no create, update or delete route, because the lifecycle IS the API. Only an 'active' hold counts towards a stock row's \`reserved\`; 'released' and 'committed' rows stay for the audit trail and hold nothing. This is the answer to "what is this order actually holding" (\`?order_ref=…\`) and to "what is holding this stock" (\`?status=active&location_id=…\`) — the second is the only way to see WHY a row's \`reserved\` is what it is, since a stock row reports the total and never who asked for it. \`expires_at\` filters on an exact timestamp and not a range, so this cannot answer "what expires today"; the deadline is acted on by POST /inventories/reservations/sweep, not by reading it here.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc' — a bare column sorts ascending. The column has to be one this entity has; anything else is refused with 400.`)
  .option(`--id <id>`, `Exact-match filter on \`id\`. The row's own id, generated by the database.`)
  .option(`--location-id <location-id>`, `Exact-match filter on \`location_id\`. The holds served by one location.`)
  .option(`--product-id <product-id>`, `Exact-match filter on \`product_id\`. The product being held, copied from the reserve call.`)
  .option(`--sku <sku>`, `Exact-match filter on \`sku\`. The article number being held, copied from the reserve call.`)
  .option(`--quantity <quantity>`, `Exact-match filter on \`quantity\`. How much is being held, ALWAYS POSITIVE — the database CHECK is \`quantity > 0\`, because a hold of nothing is not a hold.`, parseInteger)
  .option(`--order-ref <order-ref>`, `Exact-match filter on \`order_ref\`. Every hold an order carries. This is the lookup POST /inventories/release and /commit act on.`)
  .option(`--status <status>`, `Exact-match filter on \`status\`. Where the hold stands in the reserve → commit | release lifecycle. Only 'active' counts towards \`reserved\`, so \`?status=active\` is the set that is really holding stock.`)
  .option(`--expires-at <expires-at>`, `Exact-match filter on \`expires_at\`. Exact deadline, not a range — this cannot answer "what expires today". The sweeper is what acts on deadlines (POST /inventories/reservations/sweep).`)
  .option(`--metadata <metadata>`, `Exact-match filter on \`metadata\`. Free-form, and one key this app writes itself: \`backordered\` — how much of this hold was not covered by stock on hand when it was taken. The WHOLE jsonb document is compared, serialized as JSON — this is equality, not a key lookup or a containment query, and a value that does not parse is answered 400.`)
  .option(`--created-at <created-at>`, `Exact-match filter on \`created_at\`. When the row was created.`)
  .option(`--updated-at <updated-at>`, `Exact-match filter on \`updated_at\`. When the hold last changed — in practice, when it moved out of \`active\`..`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, locationId, productId, sku, quantity, orderRef, status, expiresAt, metadata, createdAt, updatedAt, filter } = await promptForMissing(
          _options,
          listSpecs,
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
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (expiresAt !== undefined) {
          _payload[`expires_at`] = expiresAt;
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
registerPromptSpecs(inventoriesReservations.commands.at(-1)!, listSpecs, { method: "get" });
const sweepSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
inventoriesReservations
  .command(`sweep`)
  .description(`The expiry sweeper, also run by the 'expire-reservations' schedule every 15 minutes. Releases reservations past their own expires_at and — once reservation_ttl_minutes is above 0 — reservations older than that lifetime which never carried a deadline. Each release gives the stock back and writes a 'release' booking, exactly like a cancellation. Idempotent: a second run finds nothing.`)
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
          sweepSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reservations/sweep`;
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
registerPromptSpecs(inventoriesReservations.commands.at(-1)!, sweepSpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The reservation.", type: "string", required: true, resource: { listPath: "/inventories/reservations", hasLimit: true } },
];
inventoriesReservations
  .command(`get`)
  .description(`A reservation is stock promised to an \`order_ref\`. It is created only by POST /inventories/reserve and moved only by /commit, /release and the expiry sweep — there is no create, update or delete route, because the lifecycle IS the API. Only an 'active' hold counts towards a stock row's \`reserved\`; 'released' and 'committed' rows stay for the audit trail and hold nothing. One hold, with the three facts that are not on the order it belongs to: which location it was allocated to, when it expires, and — in \`metadata.backordered\` — how much of it was never covered by stock, which is how a promise made under a permissive backorder policy stays visible afterwards. The id is for reading only. Every transition acts on the whole \`order_ref\` (/commit, /release, the sweep), so there is no route that takes this id and no way to release one line of an order on its own.`)
  .option(`--id <id>`, `The reservation.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
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
registerPromptSpecs(inventoriesReservations.commands.at(-1)!, getSpecs, { method: "get" });
const inventoriesReserveSpecs: PromptSpec[] = [
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order this hold belongs to. The caller supplies it — this app mints nothing — and it is the handle POST /inventories/release and POST /inventories/commit act on, so it has to be the same string the order carries elsewhere. At least one character (CHECK `length(order_ref) > 0`). Not unique: an order holds one reservation per item, and they are released or committed together. Reserving twice under the same reference ADDS holds rather than replacing them — release first if you mean to replace.", type: "string", required: true },
  { key: "expiresAt", option: "--expires-at <expires-at>", name: "expires_at", description: "When this hold lapses. The sweeper — POST /inventories/reservations/sweep, and the 'expire-reservations' schedule that runs it every 15 minutes — releases everything past this moment exactly as a cancellation would, so an abandoned checkout stops holding stock on its own. Null means the row named no deadline: it is swept on its AGE instead once `reservation_ttl_minutes` is above 0, which is what makes turning that setting on retroactive. Omit it to let the `reservation_ttl_minutes` setting stamp one (0 — its default — means no deadline at all); send one to hold this order for a window of its own, e.g. a quote that stands until Friday.", type: "string", required: false },
  { key: "items", option: "--items [items...]", name: "items", description: "The items to hold, at most 200 in one call — a whole cart in one request. The call is planned before anything is written, so either every item is placed or nothing is.", type: "array", required: false },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Where a BACKORDERED item is booked when no location holds a stock row for it at all — the last fallback, not the allocator: which location serves an item that IS in stock comes from `allocation_strategy`. Omitted, the `default_location_code` setting decides.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Inline single-item form: the product to move, instead of a one-entry `items` array. The two forms are equivalent — nothing downstream knows which arrived.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Inline single-item form: how many to hold. Positive — the hold is expressed as a positive reservation, while the ledger booking it writes carries the negative.", type: "number", required: false },
  { key: "shipTo", option: "--ship-to <ship-to>", name: "ship_to", description: "Where the order is going. Read ONLY when the tenant's `allocation_strategy` is 'nearest' — under 'priority' or 'single_location' it is accepted and ignored, so sending it is never wrong, it is just not always heard.", type: "object", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Inline single-item form: the article number to move (instead of `product_id`).", type: "string", required: false },
];
inventoriesReservations
  .command(`inventories-reserve`)
  .description(`Takes a hold against an \`order_ref\`, and plans the whole call before writing anything, so a reservation that cannot be satisfied changes nothing. WHICH location serves an item is not the caller's to choose: the tenant's allocation_strategy decides it ('priority', walking the enabled locations by their priority; 'nearest', matching ship_to against a location's country; or 'single_location' for the whole order); backorder_policy decides what happens when none can — refuse (422), or reserve anyway and let availability go negative. expires_at defaults from reservation_ttl_minutes and the sweeper enforces it. A second call under the same \`order_ref\` ADDS holds beside the ones already there — it never replaces them — and commit and release then act on every active hold of the reference.`)
  .option(`--order-ref <order-ref>`, `The order this hold belongs to. The caller supplies it — this app mints nothing — and it is the handle POST /inventories/release and POST /inventories/commit act on, so it has to be the same string the order carries elsewhere. At least one character (CHECK \`length(order_ref) > 0\`). Not unique: an order holds one reservation per item, and they are released or committed together. Reserving twice under the same reference ADDS holds rather than replacing them — release first if you mean to replace.`)
  .option(`--expires-at <expires-at>`, `When this hold lapses. The sweeper — POST /inventories/reservations/sweep, and the 'expire-reservations' schedule that runs it every 15 minutes — releases everything past this moment exactly as a cancellation would, so an abandoned checkout stops holding stock on its own. Null means the row named no deadline: it is swept on its AGE instead once \`reservation_ttl_minutes\` is above 0, which is what makes turning that setting on retroactive. Omit it to let the \`reservation_ttl_minutes\` setting stamp one (0 — its default — means no deadline at all); send one to hold this order for a window of its own, e.g. a quote that stands until Friday.`)
  .option(`--items [items...]`, `The items to hold, at most 200 in one call — a whole cart in one request. The call is planned before anything is written, so either every item is placed or nothing is.`)
  .option(`--location-code <location-code>`, `Where a BACKORDERED item is booked when no location holds a stock row for it at all — the last fallback, not the allocator: which location serves an item that IS in stock comes from \`allocation_strategy\`. Omitted, the \`default_location_code\` setting decides.`)
  .option(`--product-id <product-id>`, `Inline single-item form: the product to move, instead of a one-entry \`items\` array. The two forms are equivalent — nothing downstream knows which arrived.`)
  .option(`--quantity <quantity>`, `Inline single-item form: how many to hold. Positive — the hold is expressed as a positive reservation, while the ledger booking it writes carries the negative.`, parseInteger)
  .option(`--ship-to <ship-to>`, `Where the order is going. Read ONLY when the tenant's \`allocation_strategy\` is 'nearest' — under 'priority' or 'single_location' it is accepted and ignored, so sending it is never wrong, it is just not always heard.`)
  .option(`--sku <sku>`, `Inline single-item form: the article number to move (instead of \`product_id\`).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderRef, expiresAt, items, locationCode, productId, quantity, shipTo, sku } = await promptForMissing(
          _options,
          inventoriesReserveSpecs,
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
registerPromptSpecs(inventoriesReservations.commands.at(-1)!, inventoriesReserveSpecs, { method: "post" });
