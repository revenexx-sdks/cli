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

export const quotesPricing = new Command("quotes-pricing")
  .description(
    commandDescriptions["quotesPricing"] ??
      `What the merchant does: put prices and a deadline on a request. The designated override point for a tenant whose prices come out of an ERP.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const expireSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
quotesPricing
  .command(`expire`)
  .description(`Moves every quote past its validity to expired. Runs on a schedule and on demand, and is idempotent — a quote already expired is not touched twice. Switching the sweep off does NOT soften the deadline: acceptance past \`valid_until\` is refused either way.`)
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
          expireSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/expire`;
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
registerPromptSpecs(quotesPricing.commands.at(-1)!, expireSpecs, { method: "post" });
const removeItemSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The position.", type: "string", required: true },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
quotesPricing
  .command(`remove-item`)
  .description(`Removes one position while its quote is \`requested\` or \`in_review\`, and re-totals the quote. The last position stays: a quote with nothing on it is declined or rejected instead.`)
  .option(`--id <id>`, `The position.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { id, body } = await promptForMissing(
          _options,
          removeItemSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/items/{id}/remove`.replace(`{id}`, id);
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
registerPromptSpecs(quotesPricing.commands.at(-1)!, removeItemSpecs, { method: "post" });
const followUpSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "followUpAt", option: "--follow-up-at <follow-up-at>", name: "follow_up_at", description: "The day, YYYY-MM-DD. `null` clears it.", type: "string", required: false },
];
quotesPricing
  .command(`follow-up`)
  .description(`Sets or clears \`follow_up_at\` on an open quote and writes it to the internal trail. The buyer is not told; nothing happens on the day by itself.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--follow-up-at <follow-up-at>`, `The day, YYYY-MM-DD. \`null\` clears it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, followUpAt } = await promptForMissing(
          _options,
          followUpSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/follow-up`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (followUpAt !== undefined) {
          _payload[`follow_up_at`] = followUpAt;
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
registerPromptSpecs(quotesPricing.commands.at(-1)!, followUpSpecs, { method: "post" });
const addItemSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "configuration", option: "--configuration <configuration>", name: "configuration", description: "What was configured on this line, in the configurator's vocabulary.", type: "object", required: false },
  { key: "discountPercent", option: "--discount-percent <discount-percent>", name: "discount_percent", description: "A discount on the list price instead of a quoted price.", type: "number", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this position has in the system that owns it. Left out on anything this shop raised itself.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every other system that knows this position, keyed by system name.", type: "object", required: false },
  { key: "leadTimeDays", option: "--lead-time-days <lead-time-days>", name: "lead_time_days", description: "Quoted delivery time in days.", type: "integer", required: false },
  { key: "listPrice", option: "--list-price <list-price>", name: "list_price", description: "The catalogue price per unit. Leave it out for a position that has none — that is what \"price on request\" is.", type: "number", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data carried with the line.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the position is called. Falls back to the SKU.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order. Left out, positions are numbered in steps of ten.", type: "integer", required: false },
  { key: "priceReason", option: "--price-reason <price-reason>", name: "price_reason", description: "Why the price is what it is.", type: "string", required: false, enum: ["volume","competition","relationship","clearance","cost_change","other"] },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The catalogue product, when the line names one.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "How many units. 1 when left out.", type: "number", required: false },
  { key: "quotedPrice", option: "--quoted-price <quoted-price>", name: "quoted_price", description: "A negotiated price, when the caller already knows one. Normally set later, by pricing.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The article number. Free text.", type: "string", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "What the source said, kept as it said it: `{\"system\": …, \"etag\": …, \"raw\": {…}}`. The `etag` is what a write-back has to hand back in `If-Match`.", type: "object", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When this position was last confirmed against its source.", type: "string", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", description: "The rate in percent.", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "The unit the quantity is counted in.", type: "string", required: false },
];
quotesPricing
  .command(`add-item`)
  .description(`Adds one position while the quote is \`requested\` or \`in_review\`. The line is the shape a quote's lines always take — the caller names the article (\`name\`, else \`sku\`, is required); this app does not read the catalogue. It goes in after the last position and the quote re-totals. A sent quote takes no new position: it changes by pricing it again, which leaves a revision.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--configuration <configuration>`, `What was configured on this line, in the configurator's vocabulary.`)
  .option(`--discount-percent <discount-percent>`, `A discount on the list price instead of a quoted price.`, parseInteger)
  .option(`--external-id <external-id>`, `The key this position has in the system that owns it. Left out on anything this shop raised itself.`)
  .option(`--external-refs <external-refs>`, `Every other system that knows this position, keyed by system name.`)
  .option(`--lead-time-days <lead-time-days>`, `Quoted delivery time in days.`, parseInteger)
  .option(`--list-price <list-price>`, `The catalogue price per unit. Leave it out for a position that has none — that is what "price on request" is.`, parseInteger)
  .option(`--metadata <metadata>`, `Free-form data carried with the line.`)
  .option(`--name <name>`, `What the position is called. Falls back to the SKU.`)
  .option(`--position <position>`, `Sort order. Left out, positions are numbered in steps of ten.`, parseInteger)
  .option(`--price-reason <price-reason>`, `Why the price is what it is.`)
  .option(`--product-id <product-id>`, `The catalogue product, when the line names one.`)
  .option(`--quantity <quantity>`, `How many units. 1 when left out.`, parseInteger)
  .option(`--quoted-price <quoted-price>`, `A negotiated price, when the caller already knows one. Normally set later, by pricing.`, parseInteger)
  .option(`--sku <sku>`, `The article number. Free text.`)
  .option(`--source-data <source-data>`, `What the source said, kept as it said it: \`{"system": …, "etag": …, "raw": {…}}\`. The \`etag\` is what a write-back has to hand back in \`If-Match\`.`)
  .option(`--source-synced-at <source-synced-at>`, `When this position was last confirmed against its source.`)
  .option(`--tax-rate <tax-rate>`, `The rate in percent.`, parseInteger)
  .option(`--unit <unit>`, `The unit the quantity is counted in.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, configuration, discountPercent, externalId, externalRefs, leadTimeDays, listPrice, metadata, name, position, priceReason, productId, quantity, quotedPrice, sku, sourceData, sourceSyncedAt, taxRate, unit } = await promptForMissing(
          _options,
          addItemSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/items`.replace(`{id}`, id);
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
        if (discountPercent !== undefined) {
          _payload[`discount_percent`] = discountPercent;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = resolveBodyParam(externalRefs);
        }
        if (leadTimeDays !== undefined) {
          _payload[`lead_time_days`] = leadTimeDays;
        }
        if (listPrice !== undefined) {
          _payload[`list_price`] = listPrice;
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
        if (priceReason !== undefined) {
          _payload[`price_reason`] = priceReason;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (quotedPrice !== undefined) {
          _payload[`quoted_price`] = quotedPrice;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = resolveBodyParam(sourceData);
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
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
registerPromptSpecs(quotesPricing.commands.at(-1)!, addItemSpecs, { method: "post" });
const itemSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "itemId", option: "--item-id <item-id>", name: "item_id", description: "The position.", type: "string", required: true },
  { key: "discountPercent", option: "--discount-percent <discount-percent>", name: "discount_percent", description: "The discount on the list price, in percent. Sets the negotiated price to the list price less this share; ignored when `quoted_price` is sent too. `null` clears both.", type: "number", required: false },
  { key: "leadTimeDays", option: "--lead-time-days <lead-time-days>", name: "lead_time_days", description: "Quoted delivery time in days.", type: "integer", required: false },
  { key: "priceReason", option: "--price-reason <price-reason>", name: "price_reason", description: "Why that price.", type: "string", required: false, enum: ["volume","competition","relationship","clearance","cost_change","other"] },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "How many units the position is for.", type: "number", required: false },
  { key: "quotedPrice", option: "--quoted-price <quoted-price>", name: "quoted_price", description: "The negotiated price per unit, net. `null` falls back to the list price.", type: "number", required: false },
];
quotesPricing
  .command(`item`)
  .description(`The desk calculating line by line. Sets the quantity, the negotiated price (or the discount on the list price, which moves it), its reason and the lead time of one position, re-totals the line and the quote, and tells nobody: no event, no trail entry, no status change. Allowed while the quote is \`requested\`, \`in_review\` or \`quoted\`; the buyer learns of it when the quote is sent through \`POST /quotes/quotes/{id}/price\`. A key left out keeps what it has; \`null\` clears it, and a position without a negotiated price counts at its list price.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--item-id <item-id>`, `The position.`)
  .option(`--discount-percent <discount-percent>`, `The discount on the list price, in percent. Sets the negotiated price to the list price less this share; ignored when \`quoted_price\` is sent too. \`null\` clears both.`, parseInteger)
  .option(`--lead-time-days <lead-time-days>`, `Quoted delivery time in days.`, parseInteger)
  .option(`--price-reason <price-reason>`, `Why that price.`)
  .option(`--quantity <quantity>`, `How many units the position is for.`, parseInteger)
  .option(`--quoted-price <quoted-price>`, `The negotiated price per unit, net. \`null\` falls back to the list price.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, itemId, discountPercent, leadTimeDays, priceReason, quantity, quotedPrice } = await promptForMissing(
          _options,
          itemSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/items/{item_id}`.replace(`{id}`, id).replace(`{item_id}`, itemId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (discountPercent !== undefined) {
          _payload[`discount_percent`] = discountPercent;
        }
        if (leadTimeDays !== undefined) {
          _payload[`lead_time_days`] = leadTimeDays;
        }
        if (priceReason !== undefined) {
          _payload[`price_reason`] = priceReason;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (quotedPrice !== undefined) {
          _payload[`quoted_price`] = quotedPrice;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(quotesPricing.commands.at(-1)!, itemSpecs, { method: "patch" });
const priceSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this quote has in the system that owns it. Left out on anything this shop raised itself.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every other system that knows this quote, keyed by system name.", type: "object", required: false },
  { key: "items", option: "--items [items...]", name: "items", description: "The positions to price. A position left out keeps what it has.", type: "array", required: false },
  { key: "sellerNote", option: "--seller-note <seller-note>", name: "seller_note", description: "What the customer reads with the quote.", type: "string", required: false },
  { key: "senderCountry", option: "--sender-country <sender-country>", name: "sender_country", description: "The country the goods are sent from, ISO 3166-1 alpha-2 (DE). It decides what the address lines frozen on this send print in capitals: a destination's capitalised fields when the quote goes abroad, none at home. Omit it and the request's market counts when its code is a country's code (de, at); otherwise nothing but the country line is in capitals. Used to print, never stored. Anything that is not a country's code is a 400.", type: "string", required: false },
  { key: "shippingAmount", option: "--shipping-amount <shipping-amount>", name: "shipping_amount", description: "Carriage quoted alongside the goods, net. It enters `grand_total` and the first order out of the quote.", type: "number", required: false },
  { key: "shippingTaxRate", option: "--shipping-tax-rate <shipping-tax-rate>", name: "shipping_tax_rate", description: "The rate carriage is taxed at, in percent (0–100).", type: "number", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "What the source said, kept as it said it: `{\"system\": …, \"etag\": …, \"raw\": {…}}`. The `etag` is what a write-back has to hand back in `If-Match`.", type: "object", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When this quote was last confirmed against its source.", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "When the offer stops standing. Left out, the configured default validity is used.", type: "string", required: false },
];
quotesPricing
  .command(`price`)
  .description(`The merchant's side of the desk, and THE designated override point of this app: a tenant whose prices come out of an ERP replaces this one capability at the gateway and keeps everything else. Sets a negotiated price per position, a validity, and the note the customer reads. Re-pricing a quote the buyer has already seen writes a new revision by default, so every round of a negotiation stays readable.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--external-id <external-id>`, `The key this quote has in the system that owns it. Left out on anything this shop raised itself.`)
  .option(`--external-refs <external-refs>`, `Every other system that knows this quote, keyed by system name.`)
  .option(`--items [items...]`, `The positions to price. A position left out keeps what it has.`)
  .option(`--seller-note <seller-note>`, `What the customer reads with the quote.`)
  .option(`--sender-country <sender-country>`, `The country the goods are sent from, ISO 3166-1 alpha-2 (DE). It decides what the address lines frozen on this send print in capitals: a destination's capitalised fields when the quote goes abroad, none at home. Omit it and the request's market counts when its code is a country's code (de, at); otherwise nothing but the country line is in capitals. Used to print, never stored. Anything that is not a country's code is a 400.`)
  .option(`--shipping-amount <shipping-amount>`, `Carriage quoted alongside the goods, net. It enters \`grand_total\` and the first order out of the quote.`, parseInteger)
  .option(`--shipping-tax-rate <shipping-tax-rate>`, `The rate carriage is taxed at, in percent (0–100).`, parseInteger)
  .option(`--source-data <source-data>`, `What the source said, kept as it said it: \`{"system": …, "etag": …, "raw": {…}}\`. The \`etag\` is what a write-back has to hand back in \`If-Match\`.`)
  .option(`--source-synced-at <source-synced-at>`, `When this quote was last confirmed against its source.`)
  .option(`--valid-until <valid-until>`, `When the offer stops standing. Left out, the configured default validity is used.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, externalId, externalRefs, items, sellerNote, senderCountry, shippingAmount, shippingTaxRate, sourceData, sourceSyncedAt, validUntil } = await promptForMissing(
          _options,
          priceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/price`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = resolveBodyParam(externalRefs);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (sellerNote !== undefined) {
          _payload[`seller_note`] = sellerNote;
        }
        if (senderCountry !== undefined) {
          _payload[`sender_country`] = senderCountry;
        }
        if (shippingAmount !== undefined) {
          _payload[`shipping_amount`] = shippingAmount;
        }
        if (shippingTaxRate !== undefined) {
          _payload[`shipping_tax_rate`] = shippingTaxRate;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = resolveBodyParam(sourceData);
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (validUntil !== undefined) {
          _payload[`valid_until`] = validUntil;
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
registerPromptSpecs(quotesPricing.commands.at(-1)!, priceSpecs, { method: "post" });
const reviewSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person, as customers knows them. Null once anonymised.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "When the row was created. Written by the database.", type: "string", required: false },
  { key: "expiresAt", option: "--expires-at <expires-at>", name: "expires_at", description: "Until when the link can be used.", type: "string", required: false },
  { key: "idBody", option: "--id-body <id-body>", name: "id_body", description: "The row's own id, generated by the database. A caller never sends one.", type: "string", required: false },
  { key: "issuedCount", option: "--issued-count <issued-count>", name: "issued_count", description: "How often a link was issued for this order and contact; above 1 after an expired link was replaced.", type: "integer", required: false },
  { key: "items", option: "--items <items>", name: "items", description: "Those products as the order named them: `{ product_id, sku, name }`.", type: "any", required: false },
  { key: "journeyRef", option: "--journey-ref <journey-ref>", name: "journey_ref", description: "The journey step that asked for the link, e.g. `journey:<id>:<step>`.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "The language the review is written in, e.g. de-DE.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "The market code the row belongs to.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form JSON a caller may keep on the row. Nothing here reads it.", type: "any", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "The order, as the orders app knows it.", type: "string", required: false },
  { key: "orderNumber", option: "--order-number <order-number>", name: "order_number", description: "The order number, copied for display.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company of the order, as customers knows it.", type: "string", required: false },
  { key: "productIds", option: "--product-ids <product-ids>", name: "product_ids", description: "The products of the order the link asks to review.", type: "any", required: false },
  { key: "reviewedCount", option: "--reviewed-count <reviewed-count>", name: "reviewed_count", description: "How many of the products are reviewed.", type: "integer", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "`issued` (open), `used` (every product reviewed) or `expired`.", type: "string", required: false, enum: ["issued","used","expired"] },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "When the row last changed.", type: "string", required: false },
  { key: "usedAt", option: "--used-at <used-at>", name: "used_at", description: "When the last product was reviewed.", type: "string", required: false },
];
quotesPricing
  .command(`review`)
  .description(`Claims a request: it moves out of the unattended queue and gets an owner, which is what a sales worklist filters by.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--contact-id <contact-id>`, `The person, as customers knows them. Null once anonymised.`)
  .option(`--created-at <created-at>`, `When the row was created. Written by the database.`)
  .option(`--expires-at <expires-at>`, `Until when the link can be used.`)
  .option(`--id-body <id-body>`, `The row's own id, generated by the database. A caller never sends one.`)
  .option(`--issued-count <issued-count>`, `How often a link was issued for this order and contact; above 1 after an expired link was replaced.`, parseInteger)
  .option(`--items <items>`, `Those products as the order named them: \`{ product_id, sku, name }\`.`)
  .option(`--journey-ref <journey-ref>`, `The journey step that asked for the link, e.g. \`journey:<id>:<step>\`.`)
  .option(`--locale <locale>`, `The language the review is written in, e.g. de-DE.`)
  .option(`--market <market>`, `The market code the row belongs to.`)
  .option(`--metadata <metadata>`, `Free-form JSON a caller may keep on the row. Nothing here reads it.`)
  .option(`--order-id <order-id>`, `The order, as the orders app knows it.`)
  .option(`--order-number <order-number>`, `The order number, copied for display.`)
  .option(`--organization-id <organization-id>`, `The company of the order, as customers knows it.`)
  .option(`--product-ids <product-ids>`, `The products of the order the link asks to review.`)
  .option(`--reviewed-count <reviewed-count>`, `How many of the products are reviewed.`, parseInteger)
  .option(`--state <state>`, `\`issued\` (open), \`used\` (every product reviewed) or \`expired\`.`)
  .option(`--updated-at <updated-at>`, `When the row last changed.`)
  .option(`--used-at <used-at>`, `When the last product was reviewed.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, contactId, createdAt, expiresAt, idBody, issuedCount, items, journeyRef, locale, market, metadata, orderId, orderNumber, organizationId, productIds, reviewedCount, state, updatedAt, usedAt } = await promptForMissing(
          _options,
          reviewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/review`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (expiresAt !== undefined) {
          _payload[`expires_at`] = expiresAt;
        }
        if (idBody !== undefined) {
          _payload[`id`] = idBody;
        }
        if (issuedCount !== undefined) {
          _payload[`issued_count`] = issuedCount;
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (journeyRef !== undefined) {
          _payload[`journey_ref`] = journeyRef;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (orderNumber !== undefined) {
          _payload[`order_number`] = orderNumber;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (productIds !== undefined) {
          _payload[`product_ids`] = productIds;
        }
        if (reviewedCount !== undefined) {
          _payload[`reviewed_count`] = reviewedCount;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (updatedAt !== undefined) {
          _payload[`updated_at`] = updatedAt;
        }
        if (usedAt !== undefined) {
          _payload[`used_at`] = usedAt;
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
registerPromptSpecs(quotesPricing.commands.at(-1)!, reviewSpecs, { method: "post" });
const remindSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
quotesPricing
  .command(`remind`)
  .description(`Announces \`quote.expiring\` now, with \`manual: true\`, instead of waiting for the sweep — so whatever mails the expiry warning mails this too — and writes it to the trail the buyer reads. Only for a quote the buyer holds (\`quoted\`, \`partially_accepted\`).`)
  .option(`--id <id>`, `The quote.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { id, body } = await promptForMissing(
          _options,
          remindSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/send-reminder`.replace(`{id}`, id);
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
registerPromptSpecs(quotesPricing.commands.at(-1)!, remindSpecs, { method: "post" });
