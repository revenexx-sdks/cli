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

export const orders = new Command("orders")
  .description(
    commandDescriptions["orders"] ??
      `Manage orders resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "status", option: "--status <status>", name: "status", description: "Filter by order status (exact match).", type: "string", required: false, enum: ["pending","placed","in_fulfillment","completed","cancelled"] },
  { key: "paymentStatus", option: "--payment-status <payment-status>", name: "payment_status", description: "Filter by payment status (exact match).", type: "string", required: false, enum: ["open","pending","authorized","paid","partially_paid","refunded","failed"] },
  { key: "fulfillmentStatus", option: "--fulfillment-status <fulfillment-status>", name: "fulfillment_status", description: "Filter by fulfillment status (exact match).", type: "string", required: false, enum: ["unfulfilled","partial","fulfilled"] },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Filter to one ordering contact.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one B2B organization.", type: "string", required: false },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "Filter to one sales channel.", type: "string", required: false },
  { key: "number", option: "--number <number>", name: "number", description: "Filter by exact order number.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orders
  .command(`list`)
  .description(`List orders — filter by status/payment_status/fulfillment_status/contact_id/organization_id/channel_id/number, paginate via limit+offset, sort via order (e.g. created_at.desc)`)
  .option(`--status <status>`, `Filter by order status (exact match).`)
  .option(`--payment-status <payment-status>`, `Filter by payment status (exact match).`)
  .option(`--fulfillment-status <fulfillment-status>`, `Filter by fulfillment status (exact match).`)
  .option(`--contact-id <contact-id>`, `Filter to one ordering contact.`)
  .option(`--organization-id <organization-id>`, `Filter to one B2B organization.`)
  .option(`--channel-id <channel-id>`, `Filter to one sales channel.`)
  .option(`--number <number>`, `Filter by exact order number.`)
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
        const { status, paymentStatus, fulfillmentStatus, contactId, organizationId, channelId, number, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders`;
        const _payload: RequestParams = {};
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (paymentStatus !== undefined) {
          _payload[`payment_status`] = paymentStatus;
        }
        if (fulfillmentStatus !== undefined) {
          _payload[`fulfillment_status`] = fulfillmentStatus;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
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
registerPromptSpecs(orders.commands.at(-1)!, listSpecs, { method: "get" });
const numberRangesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orders
  .command(`number-ranges-list`)
  .description(`List number ranges (paginate via limit+offset, sort via order, e.g. created_at.desc)`)
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
          numberRangesListSpecs,
          _command,
        );
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
registerPromptSpecs(orders.commands.at(-1)!, numberRangesListSpecs, { method: "get" });
const numberRangesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Range key drawn by the app ('order', 'delivery', 'return') — unique per tenant.", type: "string", required: true },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", type: "string", required: false },
  { key: "counter", option: "--counter <counter>", name: "counter", description: "Current counter value (default 0) — the next number draws counter+step.", type: "integer", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "padding", option: "--padding <padding>", name: "padding", description: "Zero-padding width of the counter (default 6).", type: "integer", required: false },
  { key: "positionStep", option: "--position-step <position-step>", name: "position_step", description: "Position numbering increment for order items (default 10).", type: "integer", required: false },
  { key: "prefix", option: "--prefix <prefix>", name: "prefix", description: "Default ''.", type: "string", required: false },
  { key: "step", option: "--step <step>", name: "step", description: "Counter increment per drawn number (default 1).", type: "integer", required: false },
  { key: "suffix", option: "--suffix <suffix>", name: "suffix", description: "Default ''.", type: "string", required: false },
];
orders
  .command(`number-ranges-create`)
  .description(`Create a number range ({prefix}{counter:padding}{suffix}, configurable position numbering)`)
  .option(`--code <code>`, `Range key drawn by the app ('order', 'delivery', 'return') — unique per tenant.`)
  .option(`--channel-id <channel-id>`, ``)
  .option(`--counter <counter>`, `Current counter value (default 0) — the next number draws counter+step.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--padding <padding>`, `Zero-padding width of the counter (default 6).`, parseInteger)
  .option(`--position-step <position-step>`, `Position numbering increment for order items (default 10).`, parseInteger)
  .option(`--prefix <prefix>`, `Default ''.`)
  .option(`--step <step>`, `Counter increment per drawn number (default 1).`, parseInteger)
  .option(`--suffix <suffix>`, `Default ''.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, channelId, counter, metadata, padding, positionStep, prefix, step, suffix } = await promptForMissing(
          _options,
          numberRangesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/number-ranges`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (counter !== undefined) {
          _payload[`counter`] = counter;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (padding !== undefined) {
          _payload[`padding`] = padding;
        }
        if (positionStep !== undefined) {
          _payload[`position_step`] = positionStep;
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
registerPromptSpecs(orders.commands.at(-1)!, numberRangesCreateSpecs, { method: "post" });
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
const numberRangesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders/number-ranges", hasLimit: true } },
];
orders
  .command(`number-ranges-delete`)
  .description(`Delete a number range`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          numberRangesDeleteSpecs,
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
registerPromptSpecs(orders.commands.at(-1)!, numberRangesDeleteSpecs, { method: "delete", destructive: true });
const numberRangesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders/number-ranges", hasLimit: true } },
];
orders
  .command(`number-ranges-get`)
  .description(`Read one number range`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          numberRangesGetSpecs,
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
registerPromptSpecs(orders.commands.at(-1)!, numberRangesGetSpecs, { method: "get" });
const numberRangesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders/number-ranges", hasLimit: true } },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Range key drawn by the app ('order', 'delivery', 'return') — unique per tenant.", type: "string", required: false },
  { key: "counter", option: "--counter <counter>", name: "counter", description: "Current counter value (default 0) — the next number draws counter+step.", type: "integer", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "padding", option: "--padding <padding>", name: "padding", description: "Zero-padding width of the counter (default 6).", type: "integer", required: false },
  { key: "positionStep", option: "--position-step <position-step>", name: "position_step", description: "Position numbering increment for order items (default 10).", type: "integer", required: false },
  { key: "prefix", option: "--prefix <prefix>", name: "prefix", description: "Default ''.", type: "string", required: false },
  { key: "step", option: "--step <step>", name: "step", description: "Counter increment per drawn number (default 1).", type: "integer", required: false },
  { key: "suffix", option: "--suffix <suffix>", name: "suffix", description: "Default ''.", type: "string", required: false },
];
orders
  .command(`number-ranges-update`)
  .description(`Update a number range`)
  .option(`--id <id>`, ``)
  .option(`--channel-id <channel-id>`, ``)
  .option(`--code <code>`, `Range key drawn by the app ('order', 'delivery', 'return') — unique per tenant.`)
  .option(`--counter <counter>`, `Current counter value (default 0) — the next number draws counter+step.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--padding <padding>`, `Zero-padding width of the counter (default 6).`, parseInteger)
  .option(`--position-step <position-step>`, `Position numbering increment for order items (default 10).`, parseInteger)
  .option(`--prefix <prefix>`, `Default ''.`)
  .option(`--step <step>`, `Counter increment per drawn number (default 1).`, parseInteger)
  .option(`--suffix <suffix>`, `Default ''.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, channelId, code, counter, metadata, padding, positionStep, prefix, step, suffix } = await promptForMissing(
          _options,
          numberRangesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/number-ranges/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (counter !== undefined) {
          _payload[`counter`] = counter;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (padding !== undefined) {
          _payload[`padding`] = padding;
        }
        if (positionStep !== undefined) {
          _payload[`position_step`] = positionStep;
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
registerPromptSpecs(orders.commands.at(-1)!, numberRangesUpdateSpecs, { method: "put" });
const placeSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The order positions (at most 500).", type: "array", required: true },
  { key: "billingAddress", option: "--billing-address <billing-address>", name: "billing_address", description: "Frozen billing address.", type: "object", required: false },
  { key: "buyer", option: "--buyer <buyer>", name: "buyer", description: "Frozen buyer snapshot (name, email, …).", type: "object", required: false },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "Source cart (the carts.order hand-over).", type: "string", required: false },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Ordering customer contact.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR).", type: "string", required: false },
  { key: "customerOrderNumber", option: "--customer-order-number <customer-order-number>", name: "customer_order_number", description: "The buyer's own order/PO number.", type: "string", required: false },
  { key: "grandTotal", option: "--grand-total <grand-total>", name: "grand_total", description: "Override — computed as subtotal + shipping + tax when omitted.", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "B2B organization.", type: "string", required: false },
  { key: "payment", option: "--payment <payment>", name: "payment", description: "Frozen payment snapshot — a known 'payment.status' seeds payment_status (otherwise 'open').", type: "object", required: false },
  { key: "shipping", option: "--shipping <shipping>", name: "shipping", description: "Frozen shipping snapshot — 'shipping.price' seeds shipping_total.", type: "object", required: false },
  { key: "shippingAddress", option: "--shipping-address <shipping-address>", name: "shipping_address", description: "Frozen shipping address.", type: "object", required: false },
  { key: "shippingTotal", option: "--shipping-total <shipping-total>", name: "shipping_total", description: "Shipping total (fallback when 'shipping.price' is absent).", type: "number", required: false },
  { key: "userData", option: "--user-data <user-data>", name: "user_data", description: "Free-form user data.", type: "object", required: false },
];
orders
  .command(`place`)
  .description(`Place an order from a snapshot payload (items, buyer, addresses, payment, shipping) — draws the order number, computes totals, emits order.placed`)
  .option(`--items [items...]`, `The order positions (at most 500).`)
  .option(`--billing-address <billing-address>`, `Frozen billing address.`)
  .option(`--buyer <buyer>`, `Frozen buyer snapshot (name, email, …).`)
  .option(`--cart-id <cart-id>`, `Source cart (the carts.order hand-over).`)
  .option(`--channel-id <channel-id>`, ``)
  .option(`--contact-id <contact-id>`, `Ordering customer contact.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--customer-order-number <customer-order-number>`, `The buyer's own order/PO number.`)
  .option(`--grand-total <grand-total>`, `Override — computed as subtotal + shipping + tax when omitted.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--organization-id <organization-id>`, `B2B organization.`)
  .option(`--payment <payment>`, `Frozen payment snapshot — a known 'payment.status' seeds payment_status (otherwise 'open').`)
  .option(`--shipping <shipping>`, `Frozen shipping snapshot — 'shipping.price' seeds shipping_total.`)
  .option(`--shipping-address <shipping-address>`, `Frozen shipping address.`)
  .option(`--shipping-total <shipping-total>`, `Shipping total (fallback when 'shipping.price' is absent).`, parseInteger)
  .option(`--user-data <user-data>`, `Free-form user data.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, billingAddress, buyer, cartId, channelId, contactId, currency, customerOrderNumber, grandTotal, metadata, organizationId, payment, shipping, shippingAddress, shippingTotal, userData } = await promptForMissing(
          _options,
          placeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/place`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (billingAddress !== undefined) {
          _payload[`billing_address`] = resolveBodyParam(billingAddress);
        }
        if (buyer !== undefined) {
          _payload[`buyer`] = resolveBodyParam(buyer);
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (customerOrderNumber !== undefined) {
          _payload[`customer_order_number`] = customerOrderNumber;
        }
        if (grandTotal !== undefined) {
          _payload[`grand_total`] = grandTotal;
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (payment !== undefined) {
          _payload[`payment`] = resolveBodyParam(payment);
        }
        if (shipping !== undefined) {
          _payload[`shipping`] = resolveBodyParam(shipping);
        }
        if (shippingAddress !== undefined) {
          _payload[`shipping_address`] = resolveBodyParam(shippingAddress);
        }
        if (shippingTotal !== undefined) {
          _payload[`shipping_total`] = shippingTotal;
        }
        if (userData !== undefined) {
          _payload[`user_data`] = resolveBodyParam(userData);
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
registerPromptSpecs(orders.commands.at(-1)!, placeSpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
];
orders
  .command(`get`)
  .description(`The order aggregate: order + items + shipments + returns + cancellations`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
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
registerPromptSpecs(orders.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "billingAddress", option: "--billing-address <billing-address>", name: "billing_address", type: "object", required: false },
  { key: "buyer", option: "--buyer <buyer>", name: "buyer", type: "object", required: false },
  { key: "customerOrderNumber", option: "--customer-order-number <customer-order-number>", name: "customer_order_number", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "shippingAddress", option: "--shipping-address <shipping-address>", name: "shipping_address", type: "object", required: false },
  { key: "userData", option: "--user-data <user-data>", name: "user_data", description: "Free-form user data.", type: "object", required: false },
];
orders
  .command(`update`)
  .description(`Narrow modification (addresses, buyer, references, user_data) — blocked once acknowledged`)
  .option(`--id <id>`, ``)
  .option(`--billing-address <billing-address>`, ``)
  .option(`--buyer <buyer>`, ``)
  .option(`--customer-order-number <customer-order-number>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--shipping-address <shipping-address>`, ``)
  .option(`--user-data <user-data>`, `Free-form user data.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, billingAddress, buyer, customerOrderNumber, metadata, shippingAddress, userData } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (billingAddress !== undefined) {
          _payload[`billing_address`] = resolveBodyParam(billingAddress);
        }
        if (buyer !== undefined) {
          _payload[`buyer`] = resolveBodyParam(buyer);
        }
        if (customerOrderNumber !== undefined) {
          _payload[`customer_order_number`] = customerOrderNumber;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (shippingAddress !== undefined) {
          _payload[`shipping_address`] = resolveBodyParam(shippingAddress);
        }
        if (userData !== undefined) {
          _payload[`user_data`] = resolveBodyParam(userData);
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
registerPromptSpecs(orders.commands.at(-1)!, updateSpecs, { method: "put" });
const acknowledgeSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "externalRef", option: "--external-ref <external-ref>", name: "external_ref", description: "The fulfilling system's order reference (e.g. the ERP order number).", type: "string", required: false },
];
orders
  .command(`acknowledge`)
  .description(`The fulfilling system took over (sets external_ref + acknowledged_at, once) — the return channel for Integration Studio`)
  .option(`--id <id>`, ``)
  .option(`--external-ref <external-ref>`, `The fulfilling system's order reference (e.g. the ERP order number).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, externalRef } = await promptForMissing(
          _options,
          acknowledgeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/acknowledge`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (externalRef !== undefined) {
          _payload[`external_ref`] = externalRef;
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
registerPromptSpecs(orders.commands.at(-1)!, acknowledgeSpecs, { method: "post" });
const cancelSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "cancelledBy", option: "--cancelled-by <cancelled-by>", name: "cancelled_by", description: "Acting user/system.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", type: "string", required: false },
];
orders
  .command(`cancel`)
  .description(`Full cancel — only while nothing has shipped; shipped orders cancel open quantities via items/cancel`)
  .option(`--id <id>`, ``)
  .option(`--cancelled-by <cancelled-by>`, `Acting user/system.`)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, cancelledBy, reason } = await promptForMissing(
          _options,
          cancelSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/cancel`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (cancelledBy !== undefined) {
          _payload[`cancelled_by`] = cancelledBy;
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
registerPromptSpecs(orders.commands.at(-1)!, cancelSpecs, { method: "post" });
const commentsListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orders
  .command(`comments-list`)
  .description(`List comments (internal + customer-visible)`)
  .option(`--id <id>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, filter } = await promptForMissing(
          _options,
          commentsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/comments`.replace(`{id}`, id);
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
registerPromptSpecs(orders.commands.at(-1)!, commentsListSpecs, { method: "get" });
const commentsCreateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "body", type: "string", required: true },
  { key: "author", option: "--author <author>", name: "author", type: "string", required: false },
  { key: "visibility", option: "--visibility <visibility>", name: "visibility", description: "Default 'internal'.", type: "string", required: false, enum: ["internal","customer"] },
];
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
          commentsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/comments`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
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
registerPromptSpecs(orders.commands.at(-1)!, commentsCreateSpecs, { method: "post" });
const eventsListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orders
  .command(`events-list`)
  .description(`The audit trail — every lifecycle action as an event row (also the domain event feed: manifest emits order_event.created on insert)`)
  .option(`--id <id>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, filter } = await promptForMissing(
          _options,
          eventsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/events`.replace(`{id}`, id);
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
registerPromptSpecs(orders.commands.at(-1)!, eventsListSpecs, { method: "get" });
const holdSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why the order is blocked (shown on the shipping guard).", type: "string", required: false },
];
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
          holdSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/hold`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
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
registerPromptSpecs(orders.commands.at(-1)!, holdSpecs, { method: "post" });
const itemsCancelSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "positions", option: "--positions [positions...]", name: "positions", type: "array", required: true },
  { key: "cancelledBy", option: "--cancelled-by <cancelled-by>", name: "cancelled_by", description: "Acting user/system.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", type: "string", required: false },
];
orders
  .command(`items-cancel`)
  .description(`Quantity-based position cancel (positions: [{order_item_id, quantity}]) — guarded against the open quantity`)
  .option(`--id <id>`, ``)
  .option(`--positions [positions...]`, ``)
  .option(`--cancelled-by <cancelled-by>`, `Acting user/system.`)
  .option(`--reason <reason>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, positions, cancelledBy, reason } = await promptForMissing(
          _options,
          itemsCancelSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/items/cancel`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (cancelledBy !== undefined) {
          _payload[`cancelled_by`] = cancelledBy;
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
registerPromptSpecs(orders.commands.at(-1)!, itemsCancelSpecs, { method: "post" });
const paymentStatusUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "status", option: "--status <status>", name: "status", description: "The new payment dimension value.", type: "string", required: true, enum: ["open","pending","authorized","paid","partially_paid","refunded","failed"] },
  { key: "paymentId", option: "--payment-id <payment-id>", name: "payment_id", description: "Reference into the payment system — merged into the order's payment snapshot.", type: "string", required: false },
];
orders
  .command(`payment-status-update`)
  .description(`Update the payment dimension (open/pending/authorized/paid/partially_paid/refunded/failed, optional payment_id)`)
  .option(`--id <id>`, ``)
  .option(`--status <status>`, `The new payment dimension value.`)
  .option(`--payment-id <payment-id>`, `Reference into the payment system — merged into the order's payment snapshot.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, status, paymentId } = await promptForMissing(
          _options,
          paymentStatusUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/payment-status`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (paymentId !== undefined) {
          _payload[`payment_id`] = paymentId;
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
registerPromptSpecs(orders.commands.at(-1)!, paymentStatusUpdateSpecs, { method: "post" });
const returnSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "positions", option: "--positions [positions...]", name: "positions", type: "array", required: true },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", type: "string", required: false },
];
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
          returnSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/return`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
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
registerPromptSpecs(orders.commands.at(-1)!, returnSpecs, { method: "post" });
const returnsCompleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "rid", option: "--rid <rid>", name: "rid", type: "string", required: true },
  { key: "resolution", option: "--resolution <resolution>", name: "resolution", description: "How the return was settled (refund, replacement, …).", type: "string", required: false },
];
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
          returnsCompleteSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/returns/{rid}/complete`.replace(`{id}`, id).replace(`{rid}`, rid);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
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
registerPromptSpecs(orders.commands.at(-1)!, returnsCompleteSpecs, { method: "post" });
const returnsReceiveSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "rid", option: "--rid <rid>", name: "rid", type: "string", required: true },
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
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
          returnsReceiveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/returns/{rid}/receive`.replace(`{id}`, id).replace(`{rid}`, rid);
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
registerPromptSpecs(orders.commands.at(-1)!, returnsReceiveSpecs, { method: "post" });
const returnsRejectSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "rid", option: "--rid <rid>", name: "rid", type: "string", required: true },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Fallback for 'resolution'.", type: "string", required: false },
  { key: "resolution", option: "--resolution <resolution>", name: "resolution", description: "Why the return was rejected.", type: "string", required: false },
];
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
          returnsRejectSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/returns/{rid}/reject`.replace(`{id}`, id).replace(`{rid}`, rid);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
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
registerPromptSpecs(orders.commands.at(-1)!, returnsRejectSpecs, { method: "post" });
const shipSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "carrier", option: "--carrier <carrier>", name: "carrier", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "number", option: "--number <number>", name: "number", description: "Delivery note number — drawn from the 'delivery' range when omitted.", type: "string", required: false },
  { key: "positions", option: "--positions [positions...]", name: "positions", description: "Omitted = every position with open quantity, in full.", type: "array", required: false },
  { key: "shippedAt", option: "--shipped-at <shipped-at>", name: "shipped_at", description: "Defaults to now.", type: "string", required: false },
  { key: "trackingCode", option: "--tracking-code <tracking-code>", name: "tracking_code", type: "string", required: false },
  { key: "trackingUrl", option: "--tracking-url <tracking-url>", name: "tracking_url", type: "string", required: false },
];
orders
  .command(`ship`)
  .description(`Create a shipment (positions + quantities + carrier/tracking; positions omitted = ship everything open). Books quantity_shipped, derives fulfillment_status, completes the order when fulfilled`)
  .option(`--id <id>`, ``)
  .option(`--carrier <carrier>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--number <number>`, `Delivery note number — drawn from the 'delivery' range when omitted.`)
  .option(`--positions [positions...]`, `Omitted = every position with open quantity, in full.`)
  .option(`--shipped-at <shipped-at>`, `Defaults to now.`)
  .option(`--tracking-code <tracking-code>`, ``)
  .option(`--tracking-url <tracking-url>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, carrier, metadata, number, positions, shippedAt, trackingCode, trackingUrl } = await promptForMissing(
          _options,
          shipSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/ship`.replace(`{id}`, id);
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
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (number !== undefined) {
          _payload[`number`] = number;
        }
        if (positions !== undefined) {
          _payload[`positions`] = positions;
        }
        if (shippedAt !== undefined) {
          _payload[`shipped_at`] = shippedAt;
        }
        if (trackingCode !== undefined) {
          _payload[`tracking_code`] = trackingCode;
        }
        if (trackingUrl !== undefined) {
          _payload[`tracking_url`] = trackingUrl;
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
registerPromptSpecs(orders.commands.at(-1)!, shipSpecs, { method: "post" });
const unholdSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orders", hasLimit: true } },
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
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
          unholdSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orders/{id}/unhold`.replace(`{id}`, id);
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
registerPromptSpecs(orders.commands.at(-1)!, unholdSpecs, { method: "post" });
