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

export const reviewsReviews = new Command("reviews-reviews")
  .description(
    commandDescriptions["reviewsReviews"] ??
      `Product reviews: stars, title and text, the product and order they belong to, whether the purchase is verified, and the moderation state. Only published reviews reach the shop.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "trashed", option: "--trashed <trashed>", name: "trashed", description: "`exclude` (default) leaves the trash out, `only` is the trash itself, `include` lists both.", type: "string", required: false, enum: ["exclude","only","include"] },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Keep only rows whose `product_id` equals this.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Keep only rows whose `sku` equals this.", type: "string", required: false },
  { key: "productName", option: "--product-name <product-name>", name: "product_name", description: "Keep only rows whose `product_name` equals this.", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "Keep only rows whose `order_id` equals this.", type: "string", required: false },
  { key: "orderNumber", option: "--order-number <order-number>", name: "order_number", description: "Keep only rows whose `order_number` equals this.", type: "string", required: false },
  { key: "requestId", option: "--request-id <request-id>", name: "request_id", description: "Keep only rows whose `request_id` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Keep only rows whose `organization_id` equals this.", type: "string", required: false },
  { key: "authorFirstName", option: "--author-first-name <author-first-name>", name: "author_first_name", description: "Keep only rows whose `author_first_name` equals this.", type: "string", required: false },
  { key: "authorLastName", option: "--author-last-name <author-last-name>", name: "author_last_name", description: "Keep only rows whose `author_last_name` equals this.", type: "string", required: false },
  { key: "rating", option: "--rating <rating>", name: "rating", description: "Keep only rows whose `rating` equals this.", type: "string", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "Keep only rows whose `title` equals this.", type: "string", required: false },
  { key: "body", option: "--body <body>", name: "body", description: "Keep only rows whose `body` equals this.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "Keep only rows whose `locale` equals this.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Keep only rows whose `market` equals this.", type: "string", required: false },
  { key: "verifiedPurchase", option: "--verified-purchase <verified-purchase>", name: "verified_purchase", description: "Keep only rows whose `verified_purchase` equals this.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Keep only rows whose `source` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "rejectionReason", option: "--rejection-reason <rejection-reason>", name: "rejection_reason", description: "Keep only rows whose `rejection_reason` equals this.", type: "string", required: false },
  { key: "moderatedBy", option: "--moderated-by <moderated-by>", name: "moderated_by", description: "Keep only rows whose `moderated_by` equals this.", type: "string", required: false },
  { key: "merchantReply", option: "--merchant-reply <merchant-reply>", name: "merchant_reply", description: "Keep only rows whose `merchant_reply` equals this.", type: "string", required: false },
  { key: "repliedBy", option: "--replied-by <replied-by>", name: "replied_by", description: "Keep only rows whose `replied_by` equals this.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Keep only rows whose `external_id` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
reviewsReviews
  .command(`list`)
  .description(`Every review of this tenant in every state, without the trash unless \`trashed\` asks for it. Filter \`?state=pending\` for the moderation queue, \`?product_id=\`, \`?contact_id=\` (what the audiences rule reads), \`?rating=\`, \`?verified_purchase=true\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--trashed <trashed>`, `\`exclude\` (default) leaves the trash out, \`only\` is the trash itself, \`include\` lists both.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--product-id <product-id>`, `Keep only rows whose \`product_id\` equals this.`)
  .option(`--sku <sku>`, `Keep only rows whose \`sku\` equals this.`)
  .option(`--product-name <product-name>`, `Keep only rows whose \`product_name\` equals this.`)
  .option(`--order-id <order-id>`, `Keep only rows whose \`order_id\` equals this.`)
  .option(`--order-number <order-number>`, `Keep only rows whose \`order_number\` equals this.`)
  .option(`--request-id <request-id>`, `Keep only rows whose \`request_id\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--organization-id <organization-id>`, `Keep only rows whose \`organization_id\` equals this.`)
  .option(`--author-first-name <author-first-name>`, `Keep only rows whose \`author_first_name\` equals this.`)
  .option(`--author-last-name <author-last-name>`, `Keep only rows whose \`author_last_name\` equals this.`)
  .option(`--rating <rating>`, `Keep only rows whose \`rating\` equals this.`)
  .option(`--title <title>`, `Keep only rows whose \`title\` equals this.`)
  .option(`--body <body>`, `Keep only rows whose \`body\` equals this.`)
  .option(`--locale <locale>`, `Keep only rows whose \`locale\` equals this.`)
  .option(`--market <market>`, `Keep only rows whose \`market\` equals this.`)
  .option(`--verified-purchase <verified-purchase>`, `Keep only rows whose \`verified_purchase\` equals this.`)
  .option(`--source <source>`, `Keep only rows whose \`source\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--rejection-reason <rejection-reason>`, `Keep only rows whose \`rejection_reason\` equals this.`)
  .option(`--moderated-by <moderated-by>`, `Keep only rows whose \`moderated_by\` equals this.`)
  .option(`--merchant-reply <merchant-reply>`, `Keep only rows whose \`merchant_reply\` equals this.`)
  .option(`--replied-by <replied-by>`, `Keep only rows whose \`replied_by\` equals this.`)
  .option(`--external-id <external-id>`, `Keep only rows whose \`external_id\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, trashed, id, productId, sku, productName, orderId, orderNumber, requestId, contactId, organizationId, authorFirstName, authorLastName, rating, title, body, locale, market, verifiedPurchase, source, state, rejectionReason, moderatedBy, merchantReply, repliedBy, externalId, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/reviews`;
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
        if (trashed !== undefined) {
          _payload[`trashed`] = trashed;
        }
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (productName !== undefined) {
          _payload[`product_name`] = productName;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (orderNumber !== undefined) {
          _payload[`order_number`] = orderNumber;
        }
        if (requestId !== undefined) {
          _payload[`request_id`] = requestId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (authorFirstName !== undefined) {
          _payload[`author_first_name`] = authorFirstName;
        }
        if (authorLastName !== undefined) {
          _payload[`author_last_name`] = authorLastName;
        }
        if (rating !== undefined) {
          _payload[`rating`] = rating;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (body !== undefined) {
          _payload[`body`] = body;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (verifiedPurchase !== undefined) {
          _payload[`verified_purchase`] = verifiedPurchase;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (rejectionReason !== undefined) {
          _payload[`rejection_reason`] = rejectionReason;
        }
        if (moderatedBy !== undefined) {
          _payload[`moderated_by`] = moderatedBy;
        }
        if (merchantReply !== undefined) {
          _payload[`merchant_reply`] = merchantReply;
        }
        if (repliedBy !== undefined) {
          _payload[`replied_by`] = repliedBy;
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
registerPromptSpecs(reviewsReviews.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: true },
  { key: "rating", option: "--rating <rating>", name: "rating", description: "Stars, a whole number from 1 to 5. A form may send it as text (\"4\").", type: "integer", required: true },
  { key: "authorFirstName", option: "--author-first-name <author-first-name>", name: "author_first_name", type: "string", required: false },
  { key: "authorLastName", option: "--author-last-name <author-last-name>", name: "author_last_name", type: "string", required: false },
  { key: "body", option: "--body <body>", name: "body", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.", type: "string", required: false },
  { key: "externalRefs", option: "--external-refs <external-refs>", name: "external_refs", description: "Every OTHER system that knows this record, keyed by system name. `external_id` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.", type: "object", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", type: "string", required: false },
  { key: "productName", option: "--product-name <product-name>", name: "product_name", type: "string", required: false },
  { key: "publishedAt", option: "--published-at <published-at>", name: "published_at", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Empty is `admin`.", type: "string", required: false, enum: ["admin","import"] },
  { key: "sourceData", option: "--source-data <source-data>", name: "source_data", description: "The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.", type: "object", required: false },
  { key: "sourceSyncedAt", option: "--source-synced-at <source-synced-at>", name: "source_synced_at", description: "When a sync last wrote this record from its source system. Null for a record only ever kept here.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Empty is `pending`.", type: "string", required: false, enum: ["pending","published"] },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: false },
];
reviewsReviews
  .command(`create`)
  .description(`For reviews collected elsewhere. The purchase is verified only when \`order_id\` and \`contact_id\` name a completed order of that contact holding the product — never because a caller says so.`)
  .option(`--product-id <product-id>`, ``)
  .option(`--rating <rating>`, `Stars, a whole number from 1 to 5. A form may send it as text ("4").`, parseInteger)
  .option(`--author-first-name <author-first-name>`, ``)
  .option(`--author-last-name <author-last-name>`, ``)
  .option(`--body <body>`, ``)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--external-id <external-id>`, `The key of this record in the system that leads it — a marketing tool, an ERP, an ad platform. Unique per tenant when set; an import matches on it.`)
  .option(`--external-refs <external-refs>`, `Every OTHER system that knows this record, keyed by system name. \`external_id\` is the leading system; this is the rest. Not a query parameter: a jsonb column is compared as a whole document.`)
  .option(`--locale <locale>`, ``)
  .option(`--market <market>`, ``)
  .option(`--order-id <order-id>`, ``)
  .option(`--product-name <product-name>`, ``)
  .option(`--published-at <published-at>`, ``)
  .option(`--sku <sku>`, ``)
  .option(`--source <source>`, `Empty is \`admin\`.`)
  .option(`--source-data <source-data>`, `The source system's own view of the record as the last sync saw it, kept for reconciliation. Nothing in this app reads it.`)
  .option(`--source-synced-at <source-synced-at>`, `When a sync last wrote this record from its source system. Null for a record only ever kept here.`)
  .option(`--state <state>`, `Empty is \`pending\`.`)
  .option(`--title <title>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { productId, rating, authorFirstName, authorLastName, body, contactId, externalId, externalRefs, locale, market, orderId, productName, publishedAt, sku, source, sourceData, sourceSyncedAt, state, title } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/reviews`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (authorFirstName !== undefined) {
          _payload[`author_first_name`] = authorFirstName;
        }
        if (authorLastName !== undefined) {
          _payload[`author_last_name`] = authorLastName;
        }
        if (body !== undefined) {
          _payload[`body`] = body;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (externalRefs !== undefined) {
          _payload[`external_refs`] = resolveBodyParam(externalRefs);
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (productName !== undefined) {
          _payload[`product_name`] = productName;
        }
        if (publishedAt !== undefined) {
          _payload[`published_at`] = publishedAt;
        }
        if (rating !== undefined) {
          _payload[`rating`] = rating;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (sourceData !== undefined) {
          _payload[`source_data`] = resolveBodyParam(sourceData);
        }
        if (sourceSyncedAt !== undefined) {
          _payload[`source_synced_at`] = sourceSyncedAt;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
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
registerPromptSpecs(reviewsReviews.commands.at(-1)!, createSpecs, { method: "post" });
reviewsReviews
  .command(`empty-trash`)
  .description(`Every review in the trash is deleted for good on its own terms. One that something still blocks stays in the trash and is named with its reason, so a partial success says exactly what remained. Not for a storefront contact.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/reviews/reviews/trash/empty`;
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
reviewsReviews
  .command(`purge`)
  .description(`What the nightly purge does, callable by hand: every review in the trash for longer than the tenant trash retention (90 days unless the tenant set another) is deleted for good through the same rules as a second delete. A blocked one stays and carries its reason. When the retention cannot be read, nothing is deleted. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/reviews/reviews/trash/purge`;
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
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/reviews/reviews", hasLimit: true } },
];
reviewsReviews
  .command(`delete`)
  .description(`The first DELETE moves the review into the trash: it stays, with everything hanging off it, and counts nowhere until it is restored. Any review may go in, published or not; while it is in the trash it leaves the product page and the figures, which are recomputed. A DELETE on a review already in the trash deletes it for good — refused while something still needs it, and not for a storefront contact.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`reviews-reviews delete`);
        const _client = await sdkForProject();
        const _apiPath = `/reviews/reviews/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(reviewsReviews.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/reviews/reviews", hasLimit: true } },
];
reviewsReviews
  .command(`get`)
  .description(`Read one review`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/reviews/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(reviewsReviews.commands.at(-1)!, getSpecs, { method: "get" });
const restoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/reviews/reviews", hasLimit: true } },
];
reviewsReviews
  .command(`restore`)
  .description(`Clears the trash marks on the review. Its parts were never touched, so they come back with it, in the state it was in. The same right as deleting.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          restoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/reviews/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(reviewsReviews.commands.at(-1)!, restoreSpecs, { method: "post" });
