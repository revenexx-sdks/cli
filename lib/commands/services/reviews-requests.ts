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

export const reviewsRequests = new Command("reviews-requests")
  .description(
    commandDescriptions["reviewsRequests"] ??
      `Review links: one per completed order and contact, asked for by a journey, opened and submitted on the storefront. A review written through a link is a verified purchase.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "Keep only rows whose `order_id` equals this.", type: "string", required: false },
  { key: "orderNumber", option: "--order-number <order-number>", name: "order_number", description: "Keep only rows whose `order_number` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Keep only rows whose `organization_id` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "journeyRef", option: "--journey-ref <journey-ref>", name: "journey_ref", description: "Keep only rows whose `journey_ref` equals this.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "Keep only rows whose `market` equals this.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "Keep only rows whose `locale` equals this.", type: "string", required: false },
  { key: "reviewedCount", option: "--reviewed-count <reviewed-count>", name: "reviewed_count", description: "Keep only rows whose `reviewed_count` equals this.", type: "string", required: false },
  { key: "issuedCount", option: "--issued-count <issued-count>", name: "issued_count", description: "Keep only rows whose `issued_count` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
reviewsRequests
  .command(`list`)
  .description(`Filter \`?state=\`, \`?order_id=\`, \`?contact_id=\`, \`?journey_ref=\`. A token is never part of the answer and cannot be filtered on.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--order-id <order-id>`, `Keep only rows whose \`order_id\` equals this.`)
  .option(`--order-number <order-number>`, `Keep only rows whose \`order_number\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--organization-id <organization-id>`, `Keep only rows whose \`organization_id\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--journey-ref <journey-ref>`, `Keep only rows whose \`journey_ref\` equals this.`)
  .option(`--market <market>`, `Keep only rows whose \`market\` equals this.`)
  .option(`--locale <locale>`, `Keep only rows whose \`locale\` equals this.`)
  .option(`--reviewed-count <reviewed-count>`, `Keep only rows whose \`reviewed_count\` equals this.`)
  .option(`--issued-count <issued-count>`, `Keep only rows whose \`issued_count\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, orderId, orderNumber, contactId, organizationId, state, journeyRef, market, locale, reviewedCount, issuedCount, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/requests`;
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
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (orderNumber !== undefined) {
          _payload[`order_number`] = orderNumber;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (journeyRef !== undefined) {
          _payload[`journey_ref`] = journeyRef;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (reviewedCount !== undefined) {
          _payload[`reviewed_count`] = reviewedCount;
        }
        if (issuedCount !== undefined) {
          _payload[`issued_count`] = issuedCount;
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
registerPromptSpecs(reviewsRequests.commands.at(-1)!, listSpecs, { method: "get" });
const issueSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", type: "string", required: true },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", type: "string", required: true },
  { key: "journeyRef", option: "--journey-ref <journey-ref>", name: "journey_ref", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "The market whose form address builds the link.", type: "string", required: false },
  { key: "productIds", option: "--product-ids [product-ids...]", name: "product_ids", description: "Ask only for these products of the order.", type: "array", required: false },
];
reviewsRequests
  .command(`issue`)
  .description(`Called by the journeys \`request_review\` step. The same order and contact answer the same link while it is valid; an expired link is replaced. The link names the order's products the contact has not reviewed yet.`)
  .option(`--contact-id <contact-id>`, ``)
  .option(`--order-id <order-id>`, ``)
  .option(`--journey-ref <journey-ref>`, ``)
  .option(`--locale <locale>`, ``)
  .option(`--market <market>`, `The market whose form address builds the link.`)
  .option(`--product-ids [product-ids...]`, `Ask only for these products of the order.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, orderId, journeyRef, locale, market, productIds } = await promptForMissing(
          _options,
          issueSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/requests`;
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
        if (journeyRef !== undefined) {
          _payload[`journey_ref`] = journeyRef;
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
        if (productIds !== undefined) {
          _payload[`product_ids`] = productIds;
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
registerPromptSpecs(reviewsRequests.commands.at(-1)!, issueSpecs, { method: "post" });
const formSpecs: PromptSpec[] = [
  { key: "requestsToken", option: "--requests-token <requests-token>", name: "token", description: "The token of the review link.", type: "string", required: true, secret: true, resource: { listPath: "/reviews/requests", hasLimit: true } },
];
reviewsRequests
  .command(`form`)
  .description(`The products of the link and which of them are reviewed. The storefront renders the form from it.`)
  .option(`--requests-token <requests-token>`, `The token of the review link.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { requestsToken } = await promptForMissing(
          _options,
          formSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/requests/{token}`.replace(`{token}`, requestsToken);
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
registerPromptSpecs(reviewsRequests.commands.at(-1)!, formSpecs, { method: "get" });
const submitSpecs: PromptSpec[] = [
  { key: "requestsToken", option: "--requests-token <requests-token>", name: "token", description: "The token of the review link.", type: "string", required: true, secret: true },
  { key: "locale", option: "--locale <locale>", name: "locale", type: "string", required: false },
  { key: "reviews", option: "--reviews [reviews...]", name: "reviews", type: "array", required: false },
];
reviewsRequests
  .command(`submit`)
  .description(`One review per product of the link. Entries that cannot be accepted are named in \`rejected\` while the others are written. Reviews wait for moderation unless the tenant publishes high ratings at once.`)
  .option(`--requests-token <requests-token>`, `The token of the review link.`)
  .option(`--locale <locale>`, ``)
  .option(`--reviews [reviews...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { requestsToken, locale, reviews } = await promptForMissing(
          _options,
          submitSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/submit/{token}`.replace(`{token}`, requestsToken);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (reviews !== undefined) {
          _payload[`reviews`] = reviews;
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
registerPromptSpecs(reviewsRequests.commands.at(-1)!, submitSpecs, { method: "post" });
