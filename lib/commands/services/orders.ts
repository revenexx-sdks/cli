import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
} from "../../interactive.js";

export const orders = new Command("orders")
  .description(
    commandDescriptions["orders"] ??
      `Manage orders resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

orders
  .command(`list`)
  .description(`List orders — filter by status/payment_status/fulfillment_status/contact_id/organization_id/channel_id/number, paginate via limit+offset, sort via order (e.g. created_at.desc)`)
  .option(`--status <status>`, `Filter by order status (exact match).`)
  .option(`--payment-_status <payment-_status>`, `Filter by payment status (exact match).`)
  .option(`--fulfillment-_status <fulfillment-_status>`, `Filter by fulfillment status (exact match).`)
  .option(`--contact-_id <contact-_id>`, `Filter to one ordering contact.`)
  .option(`--organization-_id <organization-_id>`, `Filter to one B2B organization.`)
  .option(`--channel-_id <channel-_id>`, `Filter to one sales channel.`)
  .option(`--number <number>`, `Filter by exact order number.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ status, payment_status, fulfillment_status, contact_id, organization_id, channel_id, number, limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orders`;
        const _payload: RequestParams = {};
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (payment_status !== undefined) {
          _payload[`payment_status`] = payment_status;
        }
        if (fulfillment_status !== undefined) {
          _payload[`fulfillment_status`] = fulfillment_status;
        }
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
        }
        if (channel_id !== undefined) {
          _payload[`channel_id`] = channel_id;
        }
        if (number !== undefined) {
          _payload[`number`] = number;
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
orders
  .command(`number-ranges-list`)
  .description(`List number ranges (paginate via limit+offset, sort via order, e.g. created_at.desc)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orders/number-ranges`;
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
orders
  .command(`number-ranges-create`)
  .description(`Create a number range ({prefix}{counter:padding}{suffix}, configurable position numbering)`)
  .option(`--code <code>`, `Range key drawn by the app ('order', 'delivery', 'return') — unique per tenant.`)
  .option(`--channel-_id <channel-_id>`, ``)
  .option(`--counter <counter>`, `Current counter value (default 0) — the next number draws counter+step.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--padding <padding>`, `Zero-padding width of the counter (default 6).`, parseInteger)
  .option(`--position-_step <position-_step>`, `Position numbering increment for order items (default 10).`, parseInteger)
  .option(`--prefix <prefix>`, `Default ''.`)
  .option(`--step <step>`, `Counter increment per drawn number (default 1).`, parseInteger)
  .option(`--suffix <suffix>`, `Default ''.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, channel_id, counter, metadata, padding, position_step, prefix, step, suffix } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", description: "Range key drawn by the app ('order', 'delivery', 'return') — unique per tenant.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/number-ranges`;
        const _payload: RequestParams = {};
        if (channel_id !== undefined) {
          _payload[`channel_id`] = channel_id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (counter !== undefined) {
          _payload[`counter`] = counter;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (padding !== undefined) {
          _payload[`padding`] = padding;
        }
        if (position_step !== undefined) {
          _payload[`position_step`] = position_step;
        }
        if (prefix !== undefined) {
          _payload[`prefix`] = prefix;
        }
        if (step !== undefined) {
          _payload[`step`] = step;
        }
        if (suffix !== undefined) {
          _payload[`suffix`] = suffix;
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
orders
  .command(`number-ranges-defaults`)
  .description(`Seed the order/delivery/return ranges — idempotent, also runs on app.installed`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/orders/number-ranges/defaults`;
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
orders
  .command(`number-ranges-delete`)
  .description(`Delete a number range`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders/number-ranges", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`orders number-ranges-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/orders/number-ranges/{id}`.replace(`{id}`, id);
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
orders
  .command(`number-ranges-get`)
  .description(`Read one number range`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders/number-ranges", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/number-ranges/{id}`.replace(`{id}`, id);
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
orders
  .command(`number-ranges-update`)
  .description(`Update a number range`)
  .option(`--id <id>`, ``)
  .option(`--channel-_id <channel-_id>`, ``)
  .option(`--code <code>`, `Range key drawn by the app ('order', 'delivery', 'return') — unique per tenant.`)
  .option(`--counter <counter>`, `Current counter value (default 0) — the next number draws counter+step.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--padding <padding>`, `Zero-padding width of the counter (default 6).`, parseInteger)
  .option(`--position-_step <position-_step>`, `Position numbering increment for order items (default 10).`, parseInteger)
  .option(`--prefix <prefix>`, `Default ''.`)
  .option(`--step <step>`, `Counter increment per drawn number (default 1).`, parseInteger)
  .option(`--suffix <suffix>`, `Default ''.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, channel_id, code, counter, metadata, padding, position_step, prefix, step, suffix } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders/number-ranges", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/number-ranges/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (channel_id !== undefined) {
          _payload[`channel_id`] = channel_id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (counter !== undefined) {
          _payload[`counter`] = counter;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (padding !== undefined) {
          _payload[`padding`] = padding;
        }
        if (position_step !== undefined) {
          _payload[`position_step`] = position_step;
        }
        if (prefix !== undefined) {
          _payload[`prefix`] = prefix;
        }
        if (step !== undefined) {
          _payload[`step`] = step;
        }
        if (suffix !== undefined) {
          _payload[`suffix`] = suffix;
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
orders
  .command(`place`)
  .description(`Place an order from a snapshot payload (items, buyer, addresses, payment, shipping) — draws the order number, computes totals, emits order.placed`)
  .option(`--items [items...]`, `The order positions (at most 500).`)
  .option(`--billing-_address <billing-_address>`, `Frozen billing address.`)
  .option(`--buyer <buyer>`, `Frozen buyer snapshot (name, email, …).`)
  .option(`--cart-_id <cart-_id>`, `Source cart (the carts.order hand-over).`)
  .option(`--channel-_id <channel-_id>`, ``)
  .option(`--contact-_id <contact-_id>`, `Ordering customer contact.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--customer-_order-_number <customer-_order-_number>`, `The buyer's own order/PO number.`)
  .option(`--grand-_total <grand-_total>`, `Override — computed as subtotal + shipping + tax when omitted.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--organization-_id <organization-_id>`, `B2B organization.`)
  .option(`--payment <payment>`, `Frozen payment snapshot — a known 'payment.status' seeds payment_status (otherwise 'open').`)
  .option(`--shipping <shipping>`, `Frozen shipping snapshot — 'shipping.price' seeds shipping_total.`)
  .option(`--shipping-_address <shipping-_address>`, `Frozen shipping address.`)
  .option(`--shipping-_total <shipping-_total>`, `Shipping total (fallback when 'shipping.price' is absent).`, parseInteger)
  .option(`--user-_data <user-_data>`, `Free-form user data.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, billing_address, buyer, cart_id, channel_id, contact_id, currency, customer_order_number, grand_total, metadata, organization_id, payment, shipping, shipping_address, shipping_total, user_data } = await promptForMissing(
          _options,
          [
            { key: "items", option: "--items [items...]", name: "items", description: "The order positions (at most 500).", type: "array", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/place`;
        const _payload: RequestParams = {};
        if (billing_address !== undefined) {
          _payload[`billing_address`] = JSON.parse(billing_address);
        }
        if (buyer !== undefined) {
          _payload[`buyer`] = JSON.parse(buyer);
        }
        if (cart_id !== undefined) {
          _payload[`cart_id`] = cart_id;
        }
        if (channel_id !== undefined) {
          _payload[`channel_id`] = channel_id;
        }
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (customer_order_number !== undefined) {
          _payload[`customer_order_number`] = customer_order_number;
        }
        if (grand_total !== undefined) {
          _payload[`grand_total`] = grand_total;
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
        }
        if (payment !== undefined) {
          _payload[`payment`] = JSON.parse(payment);
        }
        if (shipping !== undefined) {
          _payload[`shipping`] = JSON.parse(shipping);
        }
        if (shipping_address !== undefined) {
          _payload[`shipping_address`] = JSON.parse(shipping_address);
        }
        if (shipping_total !== undefined) {
          _payload[`shipping_total`] = shipping_total;
        }
        if (user_data !== undefined) {
          _payload[`user_data`] = JSON.parse(user_data);
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
orders
  .command(`get`)
  .description(`The order aggregate: order + items + shipments + returns + cancellations`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}`.replace(`{id}`, id);
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
orders
  .command(`update`)
  .description(`Narrow modification (addresses, buyer, references, user_data) — blocked once acknowledged`)
  .option(`--id <id>`, ``)
  .option(`--billing-_address <billing-_address>`, ``)
  .option(`--buyer <buyer>`, ``)
  .option(`--customer-_order-_number <customer-_order-_number>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--shipping-_address <shipping-_address>`, ``)
  .option(`--user-_data <user-_data>`, `Free-form user data.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, billing_address, buyer, customer_order_number, metadata, shipping_address, user_data } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (billing_address !== undefined) {
          _payload[`billing_address`] = JSON.parse(billing_address);
        }
        if (buyer !== undefined) {
          _payload[`buyer`] = JSON.parse(buyer);
        }
        if (customer_order_number !== undefined) {
          _payload[`customer_order_number`] = customer_order_number;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (shipping_address !== undefined) {
          _payload[`shipping_address`] = JSON.parse(shipping_address);
        }
        if (user_data !== undefined) {
          _payload[`user_data`] = JSON.parse(user_data);
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
orders
  .command(`acknowledge`)
  .description(`The fulfilling system took over (sets external_ref + acknowledged_at, once) — the return channel for Integration Studio`)
  .option(`--id <id>`, ``)
  .option(`--external-_ref <external-_ref>`, `The fulfilling system's order reference (e.g. the ERP order number).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, external_ref } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/acknowledge`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (external_ref !== undefined) {
          _payload[`external_ref`] = external_ref;
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
orders
  .command(`cancel`)
  .description(`Full cancel — only while nothing has shipped; shipped orders cancel open quantities via items/cancel`)
  .option(`--id <id>`, ``)
  .option(`--cancelled-_by <cancelled-_by>`, `Acting user/system.`)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, cancelled_by, reason } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/cancel`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cancelled_by !== undefined) {
          _payload[`cancelled_by`] = cancelled_by;
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
orders
  .command(`comments-list`)
  .description(`List comments (internal + customer-visible)`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/comments`.replace(`{id}`, id);
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
orders
  .command(`comments-create`)
  .description(`Add a comment (visibility internal|customer)`)
  .option(`--id <id>`, ``)
  .option(`--body <body>`, ``)
  .option(`--author <author>`, ``)
  .option(`--visibility <visibility>`, `Default 'internal'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, body, author, visibility } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
            { key: "body", option: "--body <body>", name: "body", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/comments`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (author !== undefined) {
          _payload[`author`] = author;
        }
        if (body !== undefined) {
          _payload[`body`] = body;
        }
        if (visibility !== undefined) {
          _payload[`visibility`] = visibility;
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
orders
  .command(`events-list`)
  .description(`The audit trail — every lifecycle action as an event row (also the domain event feed: manifest emits order_event.created on insert)`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/events`.replace(`{id}`, id);
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
orders
  .command(`hold`)
  .description(`Put the order on hold — blocks shipping until unhold`)
  .option(`--id <id>`, ``)
  .option(`--reason <reason>`, `Why the order is blocked (shown on the shipping guard).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/hold`.replace(`{id}`, id);
        const _payload: RequestParams = {};
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
orders
  .command(`items-cancel`)
  .description(`Quantity-based position cancel (positions: [{order_item_id, quantity}]) — guarded against the open quantity`)
  .option(`--id <id>`, ``)
  .option(`--positions [positions...]`, ``)
  .option(`--cancelled-_by <cancelled-_by>`, `Acting user/system.`)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, positions, cancelled_by, reason } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
            { key: "positions", option: "--positions [positions...]", name: "positions", type: "array", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/items/cancel`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cancelled_by !== undefined) {
          _payload[`cancelled_by`] = cancelled_by;
        }
        if (positions !== undefined) {
          _payload[`positions`] = positions;
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
orders
  .command(`payment-status-update`)
  .description(`Update the payment dimension (open/pending/authorized/paid/partially_paid/refunded/failed, optional payment_id)`)
  .option(`--id <id>`, ``)
  .option(`--status <status>`, `The new payment dimension value.`)
  .option(`--payment-_id <payment-_id>`, `Reference into the payment system — merged into the order's payment snapshot.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, status, payment_id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
            { key: "status", option: "--status <status>", name: "status", description: "The new payment dimension value.", type: "string", required: true, enum: ["open","pending","authorized","paid","partially_paid","refunded","failed"] },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/payment-status`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (payment_id !== undefined) {
          _payload[`payment_id`] = payment_id;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
orders
  .command(`return`)
  .description(`Register a return (positions with per-position restock flags) against the shipped quantities`)
  .option(`--id <id>`, ``)
  .option(`--positions [positions...]`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, positions, metadata, reason } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
            { key: "positions", option: "--positions [positions...]", name: "positions", type: "array", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/return`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (positions !== undefined) {
          _payload[`positions`] = positions;
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
orders
  .command(`returns-complete`)
  .description(`Complete a return: books quantity_returned, reports restock positions for the explicit inventories.restock call`)
  .option(`--id <id>`, ``)
  .option(`--rid <rid>`, ``)
  .option(`--resolution <resolution>`, `How the return was settled (refund, replacement, …).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, rid, resolution } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
            { key: "rid", option: "--rid <rid>", name: "rid", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/returns/{rid}/complete`.replace(`{id}`, id).replace(`{rid}`, rid);
        const _payload: RequestParams = {};
        if (resolution !== undefined) {
          _payload[`resolution`] = resolution;
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
orders
  .command(`returns-receive`)
  .description(`Goods arrived back (registered → received)`)
  .option(`--id <id>`, ``)
  .option(`--rid <rid>`, ``)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, rid, data } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
            { key: "rid", option: "--rid <rid>", name: "rid", type: "string", required: true },
            { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/returns/{rid}/receive`.replace(`{id}`, id).replace(`{rid}`, rid);
        const _payload: RequestParams = {};
        if (data !== undefined) {
          Object.assign(_payload, JSON.parse(data));
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
orders
  .command(`returns-reject`)
  .description(`Reject a return (with resolution)`)
  .option(`--id <id>`, ``)
  .option(`--rid <rid>`, ``)
  .option(`--reason <reason>`, `Fallback for 'resolution'.`)
  .option(`--resolution <resolution>`, `Why the return was rejected.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, rid, reason, resolution } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
            { key: "rid", option: "--rid <rid>", name: "rid", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/returns/{rid}/reject`.replace(`{id}`, id).replace(`{rid}`, rid);
        const _payload: RequestParams = {};
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (resolution !== undefined) {
          _payload[`resolution`] = resolution;
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
orders
  .command(`ship`)
  .description(`Create a shipment (positions + quantities + carrier/tracking; positions omitted = ship everything open). Books quantity_shipped, derives fulfillment_status, completes the order when fulfilled`)
  .option(`--id <id>`, ``)
  .option(`--carrier <carrier>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--number <number>`, `Delivery note number — drawn from the 'delivery' range when omitted.`)
  .option(`--positions [positions...]`, `Omitted = every position with open quantity, in full.`)
  .option(`--shipped-_at <shipped-_at>`, `Defaults to now.`)
  .option(`--tracking-_code <tracking-_code>`, ``)
  .option(`--tracking-_url <tracking-_url>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, carrier, metadata, number, positions, shipped_at, tracking_code, tracking_url } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/ship`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (carrier !== undefined) {
          _payload[`carrier`] = carrier;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (number !== undefined) {
          _payload[`number`] = number;
        }
        if (positions !== undefined) {
          _payload[`positions`] = positions;
        }
        if (shipped_at !== undefined) {
          _payload[`shipped_at`] = shipped_at;
        }
        if (tracking_code !== undefined) {
          _payload[`tracking_code`] = tracking_code;
        }
        if (tracking_url !== undefined) {
          _payload[`tracking_url`] = tracking_url;
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
orders
  .command(`unhold`)
  .description(`Release the hold`)
  .option(`--id <id>`, ``)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, data } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
            { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/unhold`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (data !== undefined) {
          Object.assign(_payload, JSON.parse(data));
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
