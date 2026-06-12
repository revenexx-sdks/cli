import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseInteger,
} from "../../parser.js";

export const orders = new Command("orders")
  .description(commandDescriptions["orders"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

orders
  .command(`orders-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/orders`;
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
  .command(`orders-number-ranges-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/orders/number-ranges`;
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
  .command(`orders-number-ranges-create`)
  .description(``)
  .requiredOption(`--code <code>`, `Range key drawn by the app ('order', 'delivery', 'return') — unique per tenant.`)
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
      async ({ code, channel_id, counter, metadata, padding, position_step, prefix, step, suffix }) => {
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
  .command(`orders-number-ranges-defaults`)
  .description(``)
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
  .command(`orders-number-ranges-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`orders-number-ranges-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`orders-number-ranges-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, channel_id, code, counter, metadata, padding, position_step, prefix, step, suffix }) => {
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
  .command(`orders-place`)
  .description(``)
  .requiredOption(`--items [items...]`, `The order positions (at most 500).`)
  .option(`--billing-_address <billing-_address>`, `Frozen billing address.`)
  .option(`--buyer <buyer>`, `Frozen buyer snapshot (name, email, …).`)
  .option(`--cart-_id <cart-_id>`, `Source cart (the carts.order hand-over).`)
  .option(`--channel-_id <channel-_id>`, ``)
  .option(`--contact-_id <contact-_id>`, `Ordering customer contact.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--customer-_order-_number <customer-_order-_number>`, `The buyer's own order/PO number.`)
  .option(`--grand-_total <grand-_total>`, `Override — computed as subtotal + shipping + tax when omitted.`, parseInteger)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--organization-_id <organization-_id>`, `B2B organization.`)
  .option(`--payment <payment>`, `Frozen payment snapshot — a known 'payment.status' seeds payment_status (otherwise 'open').`)
  .option(`--shipping <shipping>`, `Frozen shipping snapshot — 'shipping.price' seeds shipping_total.`)
  .option(`--shipping-_address <shipping-_address>`, `Frozen shipping address.`)
  .option(`--shipping-_total <shipping-_total>`, `Shipping total (fallback when 'shipping.price' is absent).`, parseInteger)
  .option(`--user-_data <user-_data>`, `Free-form user data.`)
  .action(
    actionRunner(
      async ({ items, billing_address, buyer, cart_id, channel_id, contact_id, currency, customer_order_number, grand_total, market_id, metadata, organization_id, payment, shipping, shipping_address, shipping_total, user_data }) => {
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
        if (market_id !== undefined) {
          _payload[`market_id`] = market_id;
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
  .command(`orders-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`orders-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--billing-_address <billing-_address>`, ``)
  .option(`--buyer <buyer>`, ``)
  .option(`--customer-_order-_number <customer-_order-_number>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--shipping-_address <shipping-_address>`, ``)
  .option(`--user-_data <user-_data>`, `Free-form user data.`)
  .action(
    actionRunner(
      async ({ id, billing_address, buyer, customer_order_number, metadata, shipping_address, user_data }) => {
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
  .command(`orders-acknowledge`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--external-_ref <external-_ref>`, `The fulfilling system's order reference (e.g. the ERP order number).`)
  .action(
    actionRunner(
      async ({ id, external_ref }) => {
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
  .command(`orders-cancel`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--cancelled-_by <cancelled-_by>`, `Acting user/system.`)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async ({ id, cancelled_by, reason }) => {
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
  .command(`orders-comments-list`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`orders-comments-create`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .requiredOption(`--body <body>`, ``)
  .option(`--author <author>`, ``)
  .option(`--visibility <visibility>`, `Default 'internal'.`)
  .action(
    actionRunner(
      async ({ id, body, author, visibility }) => {
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
  .command(`orders-events-list`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`orders-hold`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--reason <reason>`, `Why the order is blocked (shown on the shipping guard).`)
  .action(
    actionRunner(
      async ({ id, reason }) => {
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
  .command(`orders-items-cancel`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .requiredOption(`--positions [positions...]`, ``)
  .option(`--cancelled-_by <cancelled-_by>`, `Acting user/system.`)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async ({ id, positions, cancelled_by, reason }) => {
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
  .command(`orders-payment-status-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .requiredOption(`--status <status>`, `The new payment dimension value.`)
  .option(`--payment-_id <payment-_id>`, `Reference into the payment system — merged into the order's payment snapshot.`)
  .action(
    actionRunner(
      async ({ id, status, payment_id }) => {
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
  .command(`orders-return`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .requiredOption(`--positions [positions...]`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async ({ id, positions, metadata, reason }) => {
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
  .command(`orders-returns-complete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .requiredOption(`--rid <rid>`, ``)
  .option(`--resolution <resolution>`, `How the return was settled (refund, replacement, …).`)
  .action(
    actionRunner(
      async ({ id, rid, resolution }) => {
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
  .command(`orders-returns-receive`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .requiredOption(`--rid <rid>`, ``)
  .requiredOption(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async ({ id, rid, data }) => {
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
  .command(`orders-returns-reject`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .requiredOption(`--rid <rid>`, ``)
  .option(`--reason <reason>`, `Fallback for 'resolution'.`)
  .option(`--resolution <resolution>`, `Why the return was rejected.`)
  .action(
    actionRunner(
      async ({ id, rid, reason, resolution }) => {
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
  .command(`orders-ship`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--carrier <carrier>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--number <number>`, `Delivery note number — drawn from the 'delivery' range when omitted.`)
  .option(`--positions [positions...]`, `Omitted = every position with open quantity, in full.`)
  .option(`--shipped-_at <shipped-_at>`, `Defaults to now.`)
  .option(`--tracking-_code <tracking-_code>`, ``)
  .option(`--tracking-_url <tracking-_url>`, ``)
  .action(
    actionRunner(
      async ({ id, carrier, metadata, number, positions, shipped_at, tracking_code, tracking_url }) => {
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
  .command(`orders-unhold`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .requiredOption(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async ({ id, data }) => {
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
