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

export const cartsItems = new Command("carts-items")
  .description(
    commandDescriptions["cartsItems"] ??
      `The lines inside one cart, always addressed through the cart that owns them (\`/carts/{cart_id}/items\`) — a line is never reachable on its own, and an id from another cart answers 404 rather than the row. A line is a catalogue product, a configured product or a free position, and it carries its price twice: the working \`unit_price\` and the \`snapshot\` the buyer was shown. Adding the same article at the same price folds into the line that is already there instead of opening a second one; a configured line always stands alone. Every write here recomputes the owning cart's \`item_count\` and \`subtotal\`, so a cart can never disagree with its own lines.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.", type: "string", required: true },
  { key: "id", option: "--id <id>", name: "id", description: "One line, in list form.", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Product lines, configured lines or custom lines.", type: "string", required: false, enum: ["product","configuration","custom"] },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Lines for one catalogue product.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Exact article number — the join every ERP integration makes. Not a search: no prefix, no wildcard.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Exact line name. Not a search.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Exact quantity — equality, so it matches a line of exactly this many, never 'at least'.", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "Lines counted in one unit ('pcs', 'm').", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", description: "Exact unit price — the lines still sitting at one particular number after a repricing run.", type: "number", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", description: "Lines at one VAT rate.", type: "number", required: false },
  { key: "lineTotal", option: "--line-total <line-total>", name: "line_total", description: "Exact line total. Equality only — there is no range form, so this finds `0` and little else.", type: "number", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "The line at one position.", type: "integer", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact instant, not a range.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact instant, not a range.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
cartsItems
  .command(`list`)
  .description(`The array is still called 'items'; the response also carries 'page' and 'filter' like every other list, and an unknown cart_id answers 404 instead of an empty page. A cart with more lines than the page size is not silently truncated — 'page.hasMore' says so. Lines come back in position order unless 'order' says otherwise.`)
  .option(`--cart-id <cart-id>`, `The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.`)
  .option(`--id <id>`, `One line, in list form.`)
  .option(`--type <type>`, `Product lines, configured lines or custom lines.`)
  .option(`--product-id <product-id>`, `Lines for one catalogue product.`)
  .option(`--sku <sku>`, `Exact article number — the join every ERP integration makes. Not a search: no prefix, no wildcard.`)
  .option(`--name <name>`, `Exact line name. Not a search.`)
  .option(`--quantity <quantity>`, `Exact quantity — equality, so it matches a line of exactly this many, never 'at least'.`, parseInteger)
  .option(`--unit <unit>`, `Lines counted in one unit ('pcs', 'm').`)
  .option(`--unit-price <unit-price>`, `Exact unit price — the lines still sitting at one particular number after a repricing run.`, parseInteger)
  .option(`--tax-rate <tax-rate>`, `Lines at one VAT rate.`, parseInteger)
  .option(`--line-total <line-total>`, `Exact line total. Equality only — there is no range form, so this finds \`0\` and little else.`, parseInteger)
  .option(`--position <position>`, `The line at one position.`, parseInteger)
  .option(`--created-at <created-at>`, `Exact instant, not a range.`)
  .option(`--updated-at <updated-at>`, `Exact instant, not a range.`)
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
        const { cartId, id, type, productId, sku, name, quantity, unit, unitPrice, taxRate, lineTotal, position, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items`.replace(`{cart_id}`, cartId);
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unitPrice !== undefined) {
          _payload[`unit_price`] = unitPrice;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (lineTotal !== undefined) {
          _payload[`line_total`] = lineTotal;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(cartsItems.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.", type: "string", required: true },
  { key: "configuration", option: "--configuration <configuration>", name: "configuration", description: "What was configured on this line, in the configurator's own vocabulary — this app stores it and reads nothing out of it. Its mere PRESENCE is behaviour: a line that carries a configuration never merges with another, because two differently configured units of the same article are not one line. Keys are the configurator's; the example is one shape, not the shape.", type: "object", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Optional, and it cannot change anything: a line is read in its CART's currency and stores none of its own. Sending the cart's code (or nothing) is accepted — which is what makes an exported line re-importable — and sending a different one answers 409 `currency_mismatch` rather than being converted or quietly stored.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data the storefront hangs on the line. Stored and returned verbatim; no key in here is read by this app.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the line reads as on the cart page. Falls back to 'sku' when omitted, so a line always has something to show.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order within the cart, ascending. Default 0 when adding a line; in a bulk replace the payload order fills it in.", type: "integer", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The catalogue product, when the line comes from one. Part of the merge identity: same product, same price, one line.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "How much of it — default 1. Fractional is legal (2.5 m of cable); zero and negative are not. On a plain product line that merges into an existing one, this is ADDED to what is already there, and max_quantity_per_line is checked on the result.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The article number, exactly as the merchant knows it. Free text — this app does not resolve it against the catalogue — and part of the merge identity together with product_id and unit_price. The example only shows the shape of a real article number; nothing here enforces one.", type: "string", required: false },
  { key: "snapshot", option: "--snapshot <snapshot>", name: "snapshot", description: "The product as the buyer was shown it when this line was added — the cart's own copy, so it stays honest when the catalogue moves underneath it. Free-form apart from the price: conversion reads `unit_price` (or `price` as a fallback) and nothing else. A snapshot without a readable price leaves the line alone in both price modes, which is deliberate — a missing snapshot must never be read as \"free\".", type: "object", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", description: "VAT percent for this line, as a number (19 means 19 %). Stored for the order to use — no total in this app includes tax.", type: "number", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Line type (default 'product'). Plain product lines merge by product+price; configurations always stand alone.", type: "string", required: false, enum: ["product","configuration","custom"] },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "The unit the quantity is counted in. Display and ERP hand-over only — this app converts nothing.", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", description: "Net price of one unit — line_total is always derived from it, never sent. Part of the merge identity: the same article at a different price opens a new line rather than averaging into the old one.", type: "number", required: false },
];
cartsItems
  .command(`create`)
  .description(`Adds one line to an ACTIVE cart — the add-to-basket call. \`name\` or \`sku\` is required (a line sent with only a SKU takes the SKU as its name, so a line always has something to show) and \`quantity\` must be greater than zero; everything else defaults. The line is priced in the CART's currency and stores none of its own, so a \`currency\` in the payload may only repeat the cart's — a different one is a 409. The one thing that surprises a caller: a plain product line with the same product/sku AND the same \`unit_price\` as a line already in the cart does not open a second row — its quantity is added to that line, and the 201 names a row that already existed. Price is part of that identity on purpose, so a changed price never averages into an old line. A configured or custom line always stands alone. The cart's \`item_count\` (the sum of QUANTITIES) and \`subtotal\` are recomputed before the answer, and \`max_items_per_cart\` / \`max_quantity_per_line\` are checked on the RESULT of the merge (422), so ten calls of one piece cannot walk past a limit one call of ten would hit.`)
  .option(`--cart-id <cart-id>`, `The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.`)
  .option(`--configuration <configuration>`, `What was configured on this line, in the configurator's own vocabulary — this app stores it and reads nothing out of it. Its mere PRESENCE is behaviour: a line that carries a configuration never merges with another, because two differently configured units of the same article are not one line. Keys are the configurator's; the example is one shape, not the shape.`)
  .option(`--currency <currency>`, `Optional, and it cannot change anything: a line is read in its CART's currency and stores none of its own. Sending the cart's code (or nothing) is accepted — which is what makes an exported line re-importable — and sending a different one answers 409 \`currency_mismatch\` rather than being converted or quietly stored.`)
  .option(`--metadata <metadata>`, `Free-form data the storefront hangs on the line. Stored and returned verbatim; no key in here is read by this app.`)
  .option(`--name <name>`, `What the line reads as on the cart page. Falls back to 'sku' when omitted, so a line always has something to show.`)
  .option(`--position <position>`, `Sort order within the cart, ascending. Default 0 when adding a line; in a bulk replace the payload order fills it in.`, parseInteger)
  .option(`--product-id <product-id>`, `The catalogue product, when the line comes from one. Part of the merge identity: same product, same price, one line.`)
  .option(`--quantity <quantity>`, `How much of it — default 1. Fractional is legal (2.5 m of cable); zero and negative are not. On a plain product line that merges into an existing one, this is ADDED to what is already there, and max_quantity_per_line is checked on the result.`, parseInteger)
  .option(`--sku <sku>`, `The article number, exactly as the merchant knows it. Free text — this app does not resolve it against the catalogue — and part of the merge identity together with product_id and unit_price. The example only shows the shape of a real article number; nothing here enforces one.`)
  .option(`--snapshot <snapshot>`, `The product as the buyer was shown it when this line was added — the cart's own copy, so it stays honest when the catalogue moves underneath it. Free-form apart from the price: conversion reads \`unit_price\` (or \`price\` as a fallback) and nothing else. A snapshot without a readable price leaves the line alone in both price modes, which is deliberate — a missing snapshot must never be read as "free".`)
  .option(`--tax-rate <tax-rate>`, `VAT percent for this line, as a number (19 means 19 %). Stored for the order to use — no total in this app includes tax.`, parseInteger)
  .option(`--type <type>`, `Line type (default 'product'). Plain product lines merge by product+price; configurations always stand alone.`)
  .option(`--unit <unit>`, `The unit the quantity is counted in. Display and ERP hand-over only — this app converts nothing.`)
  .option(`--unit-price <unit-price>`, `Net price of one unit — line_total is always derived from it, never sent. Part of the merge identity: the same article at a different price opens a new line rather than averaging into the old one.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, configuration, currency, metadata, name, position, productId, quantity, sku, snapshot, taxRate, type, unit, unitPrice } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items`.replace(`{cart_id}`, cartId);
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
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (snapshot !== undefined) {
          _payload[`snapshot`] = resolveBodyParam(snapshot);
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
registerPromptSpecs(cartsItems.commands.at(-1)!, createSpecs, { method: "post" });
const replaceSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", description: "The complete new item set (set semantics).", type: "array", required: true },
];
cartsItems
  .command(`replace`)
  .description(`Set semantics: the payload IS the cart. Every existing line is dropped and the payload is written in its place, so a line left out of the array is a line removed — this is the storefront sync, not a bulk add, and carts.items.create is what adds. Lines are numbered by their place in the array unless they carry their own \`position\`, and nothing merges: two identical lines in one payload stay two rows. The limits are checked against the payload BEFORE a single existing line is destroyed, so a sync refused with 422 leaves the cart exactly as it was. The cart must be active, and its totals are recomputed before the answer.`)
  .option(`--cart-id <cart-id>`, `The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.`)
  .option(`--items [items...]`, `The complete new item set (set semantics).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, items } = await promptForMissing(
          _options,
          replaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items`.replace(`{cart_id}`, cartId);
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
registerPromptSpecs(cartsItems.commands.at(-1)!, replaceSpecs, { method: "put" });
const deleteSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.", type: "string", required: true },
  { key: "id", option: "--id <id>", name: "id", description: "The line, by its id. The cart in the path is checked too: a line that belongs to a different cart answers 404, so an id guessed from another cart never resolves here.", type: "string", required: true, resource: { listPath: "/carts/{cart_id}/items", hasLimit: true } },
];
cartsItems
  .command(`delete`)
  .description(`Removes one line from an ACTIVE cart and recomputes the owning cart's \`item_count\` and \`subtotal\` before answering. This is how a quantity reaches zero: \`quantity\` is constrained to be greater than zero, so "none of it" is a DELETE and never an update to 0. The cart in the path is part of the address — a line belonging to a different cart answers 404 and is left where it is. Deleting the last line leaves an empty cart, not a deleted one; the cart itself goes through carts.delete, which takes every line with it in one call.`)
  .option(`--cart-id <cart-id>`, `The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.`)
  .option(`--id <id>`, `The line, by its id. The cart in the path is checked too: a line that belongs to a different cart answers 404, so an id guessed from another cart never resolves here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`carts-items delete`);
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items/{id}`.replace(`{cart_id}`, cartId).replace(`{id}`, id);
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
registerPromptSpecs(cartsItems.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.", type: "string", required: true },
  { key: "id", option: "--id <id>", name: "id", description: "The line, by its id. The cart in the path is checked too: a line that belongs to a different cart answers 404, so an id guessed from another cart never resolves here.", type: "string", required: true, resource: { listPath: "/carts/{cart_id}/items", hasLimit: true } },
];
cartsItems
  .command(`get`)
  .description(`One line, addressed through the cart that owns it. Both ids are checked, not just the line's: a line that exists but belongs to a different cart answers 404 rather than the row, so an id copied out of another cart never resolves here and a caller can trust that what came back is a line of the cart they asked about. The line carries both of its prices — the working \`unit_price\`, which a resync or a repricing job may have moved, and the \`snapshot\` the buyer was shown when the line was added — and its own \`line_total\`, which is always quantity × unit_price and never what a payload claimed. To read a whole cart's lines, list them: this route is for one known line.`)
  .option(`--cart-id <cart-id>`, `The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.`)
  .option(`--id <id>`, `The line, by its id. The cart in the path is checked too: a line that belongs to a different cart answers 404, so an id guessed from another cart never resolves here.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items/{id}`.replace(`{cart_id}`, cartId).replace(`{id}`, id);
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
registerPromptSpecs(cartsItems.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.", type: "string", required: true },
  { key: "id", option: "--id <id>", name: "id", description: "The line, by its id. The cart in the path is checked too: a line that belongs to a different cart answers 404, so an id guessed from another cart never resolves here.", type: "string", required: true, resource: { listPath: "/carts/{cart_id}/items", hasLimit: true } },
  { key: "configuration", option: "--configuration <configuration>", name: "configuration", description: "What was configured on this line, in the configurator's own vocabulary — this app stores it and reads nothing out of it. Its mere PRESENCE is behaviour: a line that carries a configuration never merges with another, because two differently configured units of the same article are not one line. Keys are the configurator's; the example is one shape, not the shape.", type: "object", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Optional, and it cannot change anything: a line is read in its CART's currency and stores none of its own. Sending the cart's code (or nothing) is accepted — which is what makes an exported line re-importable — and sending a different one answers 409 `currency_mismatch` rather than being converted or quietly stored.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data the storefront hangs on the line. Stored and returned verbatim; no key in here is read by this app.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the line reads as on the cart page. Falls back to 'sku' when omitted, so a line always has something to show.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order within the cart, ascending. Default 0 when adding a line; in a bulk replace the payload order fills it in.", type: "integer", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The catalogue product, when the line comes from one. Part of the merge identity: same product, same price, one line.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "How much of it — default 1. Fractional is legal (2.5 m of cable); zero and negative are not. On a plain product line that merges into an existing one, this is ADDED to what is already there, and max_quantity_per_line is checked on the result.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The article number, exactly as the merchant knows it. Free text — this app does not resolve it against the catalogue — and part of the merge identity together with product_id and unit_price. The example only shows the shape of a real article number; nothing here enforces one.", type: "string", required: false },
  { key: "snapshot", option: "--snapshot <snapshot>", name: "snapshot", description: "The product as the buyer was shown it when this line was added — the cart's own copy, so it stays honest when the catalogue moves underneath it. Free-form apart from the price: conversion reads `unit_price` (or `price` as a fallback) and nothing else. A snapshot without a readable price leaves the line alone in both price modes, which is deliberate — a missing snapshot must never be read as \"free\".", type: "object", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", description: "VAT percent for this line, as a number (19 means 19 %). Stored for the order to use — no total in this app includes tax.", type: "number", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Line type (default 'product'). Plain product lines merge by product+price; configurations always stand alone.", type: "string", required: false, enum: ["product","configuration","custom"] },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "The unit the quantity is counted in. Display and ERP hand-over only — this app converts nothing.", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", description: "Net price of one unit — line_total is always derived from it, never sent. Part of the merge identity: the same article at a different price opens a new line rather than averaging into the old one.", type: "number", required: false },
];
cartsItems
  .command(`update`)
  .description(`Changes one line of an ACTIVE cart — the quantity stepper on the cart page, and the route a repricing job writes through. The fields sent are merged onto the stored line and the whole line is validated again, so \`quantity\` must still be greater than zero and \`type\` still one of the three. \`line_total\` is not settable: it is recomputed as quantity × unit_price, and the cart's \`item_count\` and \`subtotal\` follow before the answer. What it will NOT do is merge — only carts.items.create folds one line into another, so giving this line the same product and price as a sibling leaves two rows standing, and the next add joins whichever it matches. \`max_quantity_per_line\` is enforced on the result (422). A quantity of zero is not the way to remove a line; the delete is.`)
  .option(`--cart-id <cart-id>`, `The cart the line belongs to, by its id. An id no cart in this tenant has answers 404 rather than an empty list, so a wrong cart is never mistaken for an empty one.`)
  .option(`--id <id>`, `The line, by its id. The cart in the path is checked too: a line that belongs to a different cart answers 404, so an id guessed from another cart never resolves here.`)
  .option(`--configuration <configuration>`, `What was configured on this line, in the configurator's own vocabulary — this app stores it and reads nothing out of it. Its mere PRESENCE is behaviour: a line that carries a configuration never merges with another, because two differently configured units of the same article are not one line. Keys are the configurator's; the example is one shape, not the shape.`)
  .option(`--currency <currency>`, `Optional, and it cannot change anything: a line is read in its CART's currency and stores none of its own. Sending the cart's code (or nothing) is accepted — which is what makes an exported line re-importable — and sending a different one answers 409 \`currency_mismatch\` rather than being converted or quietly stored.`)
  .option(`--metadata <metadata>`, `Free-form data the storefront hangs on the line. Stored and returned verbatim; no key in here is read by this app.`)
  .option(`--name <name>`, `What the line reads as on the cart page. Falls back to 'sku' when omitted, so a line always has something to show.`)
  .option(`--position <position>`, `Sort order within the cart, ascending. Default 0 when adding a line; in a bulk replace the payload order fills it in.`, parseInteger)
  .option(`--product-id <product-id>`, `The catalogue product, when the line comes from one. Part of the merge identity: same product, same price, one line.`)
  .option(`--quantity <quantity>`, `How much of it — default 1. Fractional is legal (2.5 m of cable); zero and negative are not. On a plain product line that merges into an existing one, this is ADDED to what is already there, and max_quantity_per_line is checked on the result.`, parseInteger)
  .option(`--sku <sku>`, `The article number, exactly as the merchant knows it. Free text — this app does not resolve it against the catalogue — and part of the merge identity together with product_id and unit_price. The example only shows the shape of a real article number; nothing here enforces one.`)
  .option(`--snapshot <snapshot>`, `The product as the buyer was shown it when this line was added — the cart's own copy, so it stays honest when the catalogue moves underneath it. Free-form apart from the price: conversion reads \`unit_price\` (or \`price\` as a fallback) and nothing else. A snapshot without a readable price leaves the line alone in both price modes, which is deliberate — a missing snapshot must never be read as "free".`)
  .option(`--tax-rate <tax-rate>`, `VAT percent for this line, as a number (19 means 19 %). Stored for the order to use — no total in this app includes tax.`, parseInteger)
  .option(`--type <type>`, `Line type (default 'product'). Plain product lines merge by product+price; configurations always stand alone.`)
  .option(`--unit <unit>`, `The unit the quantity is counted in. Display and ERP hand-over only — this app converts nothing.`)
  .option(`--unit-price <unit-price>`, `Net price of one unit — line_total is always derived from it, never sent. Part of the merge identity: the same article at a different price opens a new line rather than averaging into the old one.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, id, configuration, currency, metadata, name, position, productId, quantity, sku, snapshot, taxRate, type, unit, unitPrice } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items/{id}`.replace(`{cart_id}`, cartId).replace(`{id}`, id);
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
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (snapshot !== undefined) {
          _payload[`snapshot`] = resolveBodyParam(snapshot);
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
registerPromptSpecs(cartsItems.commands.at(-1)!, updateSpecs, { method: "put" });
