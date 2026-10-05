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

export const quotesQuotes = new Command("quotes-quotes")
  .description(
    commandDescriptions["quotesQuotes"] ??
      `Asking for a quote, opening one at a desk, and reading what a quote says.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "One status, or several separated by commas: `quoted,partially_accepted`.", type: "string", required: false },
  { key: "origin", option: "--origin <origin>", name: "origin", description: "Which door the quote came through.", type: "string", required: false, enum: ["buyer","seller"] },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "One company's quotes — how a storefront lists a buyer's history.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "One person's quotes.", type: "string", required: false },
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "One salesperson's desk.", type: "string", required: false },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The quote a cart became.", type: "string", required: false },
  { key: "number", option: "--number <number>", name: "number", description: "A quote by its number.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The quote the system that owns it knows by this key — what a mirror asks before it decides whether to create a second. The other three provenance columns carry no parameter: such a value is compared as a whole document, so a filter over part of one is refused rather than answered.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
quotesQuotes
  .command(`list`)
  .description(`The quote list — a merchant's work queue and a buyer's history, depending on who is asking. Filter \`?status=quoted\` for what is waiting on the customer, \`?status=requested\` for what nobody has picked up yet, and \`?owner_id=\` for one salesperson's desk; \`status\` takes several values separated by commas. A call the gateway attributes to a buyer is narrowed to that buyer's organisation whatever it asks for. Newest first unless \`order\` says otherwise.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--status <status>`, `One status, or several separated by commas: \`quoted,partially_accepted\`.`)
  .option(`--origin <origin>`, `Which door the quote came through.`)
  .option(`--organization-id <organization-id>`, `One company's quotes — how a storefront lists a buyer's history.`)
  .option(`--contact-id <contact-id>`, `One person's quotes.`)
  .option(`--owner-id <owner-id>`, `One salesperson's desk.`)
  .option(`--cart-id <cart-id>`, `The quote a cart became.`)
  .option(`--number <number>`, `A quote by its number.`)
  .option(`--external-id <external-id>`, `The quote the system that owns it knows by this key — what a mirror asks before it decides whether to create a second. The other three provenance columns carry no parameter: such a value is compared as a whole document, so a filter over part of one is refused rather than answered.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, status, origin, organizationId, contactId, ownerId, cartId, number, externalId, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes`;
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
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (origin !== undefined) {
          _payload[`origin`] = origin;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (number !== undefined) {
          _payload[`number`] = number;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
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
registerPromptSpecs(quotesQuotes.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code every amount is read in.", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", description: "The positions. At least one.", type: "array", required: true },
  { key: "billingAddress", option: "--billing-address <billing-address>", name: "billing_address", description: "Where an invoice would go.", type: "object", required: false },
  { key: "buyer", option: "--buyer <buyer>", name: "buyer", description: "Name and address of the customer.", type: "object", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Who the quote is for.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this quote has in the system that owns it. Left out on anything this shop raised itself.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every other system that knows this quote, keyed by system name.", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data carried with the quote.", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Which company.", type: "string", required: false },
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Who at the merchant owns it. Taken from the caller identity when left out.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "What the quote is about.", type: "string", required: false },
  { key: "sellerNote", option: "--seller-note <seller-note>", name: "seller_note", description: "What the merchant wants the customer to read.", type: "string", required: false },
  { key: "shippingAddress", option: "--shipping-address <shipping-address>", name: "shipping_address", description: "Where the goods would go.", type: "object", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "What the source said, kept as it said it: `{\"system\": …, \"etag\": …, \"raw\": {…}}`. The `etag` is what a write-back has to hand back in `If-Match`.", type: "object", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When this quote was last confirmed against its source.", type: "string", required: false },
];
quotesQuotes
  .command(`create`)
  .description(`Sales opens a quote for a customer who never sent a cart — the normal case when a salesperson quotes over the phone. It starts on the desk rather than in the queue, because the person opening it IS the desk.`)
  .option(`--currency <currency>`, `ISO 4217 code every amount is read in.`)
  .option(`--items [items...]`, `The positions. At least one.`)
  .option(`--billing-address <billing-address>`, `Where an invoice would go.`)
  .option(`--buyer <buyer>`, `Name and address of the customer.`)
  .option(`--contact-id <contact-id>`, `Who the quote is for.`)
  .option(`--external-id <external-id>`, `The key this quote has in the system that owns it. Left out on anything this shop raised itself.`)
  .option(`--external-refs <external-refs>`, `Every other system that knows this quote, keyed by system name.`)
  .option(`--metadata <metadata>`, `Free-form data carried with the quote.`)
  .option(`--organization-id <organization-id>`, `Which company.`)
  .option(`--owner-id <owner-id>`, `Who at the merchant owns it. Taken from the caller identity when left out.`)
  .option(`--reason <reason>`, `What the quote is about.`)
  .option(`--seller-note <seller-note>`, `What the merchant wants the customer to read.`)
  .option(`--shipping-address <shipping-address>`, `Where the goods would go.`)
  .option(`--source-data <source-data>`, `What the source said, kept as it said it: \`{"system": …, "etag": …, "raw": {…}}\`. The \`etag\` is what a write-back has to hand back in \`If-Match\`.`)
  .option(`--source-synced-at <source-synced-at>`, `When this quote was last confirmed against its source.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { currency, items, billingAddress, buyer, contactId, externalId, externalRefs, metadata, organizationId, ownerId, reason, sellerNote, shippingAddress, sourceData, sourceSyncedAt } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes`;
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
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (sellerNote !== undefined) {
          _payload[`seller_note`] = sellerNote;
        }
        if (shippingAddress !== undefined) {
          _payload[`shipping_address`] = resolveBodyParam(shippingAddress);
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = resolveBodyParam(sourceData);
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
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
registerPromptSpecs(quotesQuotes.commands.at(-1)!, createSpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true, resource: { listPath: "/quotes/quotes", hasLimit: true } },
];
quotesQuotes
  .command(`get`)
  .description(`The quote record without its positions. For everything at once — positions, trail and attachments — read the detail.`)
  .option(`--id <id>`, `The quote.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(quotesQuotes.commands.at(-1)!, getSpecs, { method: "get" });
const detailSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true, resource: { listPath: "/quotes/quotes", hasLimit: true } },
  { key: "audience", option: "--audience <audience>", name: "audience", description: "Read the quote as its customer sees it: internal notes and files left out.", type: "string", required: false, enum: ["customer"] },
];
quotesQuotes
  .command(`detail`)
  .description(`The whole quote in one call: the record, its positions in order, the trail of every move and note, and the attachments. This is what a record page and a storefront both read. A buyer — or any caller asking with \`audience=customer\` — reads only the entries and files meant for the customer; the merchant's internal notes stay on the merchant's side. Another organisation's quote does not exist for a buyer.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--audience <audience>`, `Read the quote as its customer sees it: internal notes and files left out.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, audience } = await promptForMissing(
          _options,
          detailSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/detail`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (audience !== undefined) {
          _payload[`audience`] = audience;
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
registerPromptSpecs(quotesQuotes.commands.at(-1)!, detailSpecs, { method: "get" });
const itemsSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true, resource: { listPath: "/quotes/quotes", hasLimit: true } },
];
quotesQuotes
  .command(`items`)
  .description(`The positions alone, in position order. Unpaged — a quote carries what it carries.`)
  .option(`--id <id>`, `The quote.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          itemsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/items`.replace(`{id}`, id);
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
registerPromptSpecs(quotesQuotes.commands.at(-1)!, itemsSpecs, { method: "get" });
const requestSpecs: PromptSpec[] = [
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code every amount is read in.", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", description: "The positions asked about. At least one.", type: "array", required: true },
  { key: "billingAddress", option: "--billing-address <billing-address>", name: "billing_address", description: "Where an invoice would go.", type: "object", required: false },
  { key: "buyer", option: "--buyer <buyer>", name: "buyer", description: "Name and address of who is asking.", type: "object", required: false },
  { key: "buyerNote", option: "--buyer-note <buyer-note>", name: "buyer_note", description: "What the buyer wants to say about the request.", type: "string", required: false },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart this came from, for the trail back.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Who is asking. Taken from the caller identity when left out.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key this quote has in the system that owns it. Left out on anything this shop raised itself.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every other system that knows this quote, keyed by system name.", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data carried with the quote.", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Which company they buy for.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why a quote is being asked for — too heavy to ship, price on request, a volume the list does not cover.", type: "string", required: false },
  { key: "shippingAddress", option: "--shipping-address <shipping-address>", name: "shipping_address", description: "Where the goods would go.", type: "object", required: false },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "What the source said, kept as it said it: `{\"system\": …, \"etag\": …, \"raw\": {…}}`. The `etag` is what a write-back has to hand back in `If-Match`.", type: "object", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When this quote was last confirmed against its source.", type: "string", required: false },
];
quotesQuotes
  .command(`request`)
  .description(`A buyer sends a basket in and asks for a price. The positions are COPIED onto the quote rather than referenced, so the buyer can keep shopping and the quote does not change under the merchant's desk. Commits the buyer to nothing: the answer is a numbered request waiting for a price.`)
  .option(`--currency <currency>`, `ISO 4217 code every amount is read in.`)
  .option(`--items [items...]`, `The positions asked about. At least one.`)
  .option(`--billing-address <billing-address>`, `Where an invoice would go.`)
  .option(`--buyer <buyer>`, `Name and address of who is asking.`)
  .option(`--buyer-note <buyer-note>`, `What the buyer wants to say about the request.`)
  .option(`--cart-id <cart-id>`, `The cart this came from, for the trail back.`)
  .option(`--contact-id <contact-id>`, `Who is asking. Taken from the caller identity when left out.`)
  .option(`--external-id <external-id>`, `The key this quote has in the system that owns it. Left out on anything this shop raised itself.`)
  .option(`--external-refs <external-refs>`, `Every other system that knows this quote, keyed by system name.`)
  .option(`--metadata <metadata>`, `Free-form data carried with the quote.`)
  .option(`--organization-id <organization-id>`, `Which company they buy for.`)
  .option(`--reason <reason>`, `Why a quote is being asked for — too heavy to ship, price on request, a volume the list does not cover.`)
  .option(`--shipping-address <shipping-address>`, `Where the goods would go.`)
  .option(`--source-data <source-data>`, `What the source said, kept as it said it: \`{"system": …, "etag": …, "raw": {…}}\`. The \`etag\` is what a write-back has to hand back in \`If-Match\`.`)
  .option(`--source-synced-at <source-synced-at>`, `When this quote was last confirmed against its source.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { currency, items, billingAddress, buyer, buyerNote, cartId, contactId, externalId, externalRefs, metadata, organizationId, reason, shippingAddress, sourceData, sourceSyncedAt } = await promptForMissing(
          _options,
          requestSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/request`;
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
        if (buyerNote !== undefined) {
          _payload[`buyer_note`] = buyerNote;
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
        }
        if (shippingAddress !== undefined) {
          _payload[`shipping_address`] = resolveBodyParam(shippingAddress);
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = resolveBodyParam(sourceData);
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
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
registerPromptSpecs(quotesQuotes.commands.at(-1)!, requestSpecs, { method: "post" });
quotesQuotes
  .command(`vocabularies`)
  .description(`The values this app accepts, so a client renders a picker instead of guessing: the statuses a quote can stand in, what a position's decision can be, and why a price is what it is.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/quotes/vocabularies`;
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
