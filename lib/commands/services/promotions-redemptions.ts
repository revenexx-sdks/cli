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
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const promotionsRedemptions = new Command("promotions-redemptions")
  .description(
    commandDescriptions["promotionsRedemptions"] ??
      `Holding a promotion, then spending it. A hold says this cart intends to use these promotions, and from that moment the budget, the per-buyer limit and the voucher remaining value are smaller for everybody else. On placement the hold becomes a commitment against the order; on abandonment it comes back. A hold expires on its own, so correctness never waits on a scheduler, and a return credits back what the returned lines carried — or re-decides the kept goods, if the promotion says so.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const commitSpecs: PromptSpec[] = [
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "The order the redemptions are recorded against.", type: "string", required: true },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart whose hold is being committed.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person buying, for a direct commitment.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency, for a direct commitment.", type: "string", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "The market, carried onto the published fact.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company, for a direct commitment.", type: "string", required: false },
  { key: "promotions", option: "--promotions [promotions...]", name: "promotions", description: "What to record, for a commitment with no prior hold.", type: "array", required: false },
  { key: "terms", option: "--terms <terms>", name: "terms", description: "Per promotion, the effects that produced it — what a re-decided return is settled against, because an order is a snapshot everywhere else in this platform.", type: "object", required: false },
];
promotionsRedemptions
  .command(`commit`)
  .description(`The order is what survives the cart, so this is where a redemption stops pointing at something temporary. Idempotent on the order: a checkout retries a call it did not see answered, and a second commitment would count the budget twice for one sale. A caller with no prior hold may commit directly, which is what a back-office or an imported order needs.`)
  .option(`--order-id <order-id>`, `The order the redemptions are recorded against.`)
  .option(`--cart-id <cart-id>`, `The cart whose hold is being committed.`)
  .option(`--contact-id <contact-id>`, `The person buying, for a direct commitment.`)
  .option(`--currency <currency>`, `The currency, for a direct commitment.`)
  .option(`--market <market>`, `The market, carried onto the published fact.`)
  .option(`--organization-id <organization-id>`, `The company, for a direct commitment.`)
  .option(`--promotions [promotions...]`, `What to record, for a commitment with no prior hold.`)
  .option(`--terms <terms>`, `Per promotion, the effects that produced it — what a re-decided return is settled against, because an order is a snapshot everywhere else in this platform.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderId, cartId, contactId, currency, market, organizationId, promotions, terms } = await promptForMissing(
          _options,
          commitSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/commit`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
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
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (promotions !== undefined) {
          _payload[`promotions`] = promotions;
        }
        if (terms !== undefined) {
          _payload[`terms`] = resolveBodyParam(terms);
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
registerPromptSpecs(promotionsRedemptions.commands.at(-1)!, commitSpecs, { method: "post" });
promotionsRedemptions
  .command(`sweep`)
  .description(`Housekeeping, and nothing depends on it: an expired hold stops counting when the promotion is next looked at, whether or not this ever runs. It publishes nothing, because an expiry is not a fact anybody wants mailed. Also the cron schedule.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/promotions/holds/sweep`;
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
const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "promotionId", option: "--promotion-id <promotion-id>", name: "promotion_id", description: "Keep only rows whose `promotion_id` equals this.", type: "string", required: false },
  { key: "voucherId", option: "--voucher-id <voucher-id>", name: "voucher_id", description: "Keep only rows whose `voucher_id` equals this.", type: "string", required: false },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "Keep only rows whose `cart_id` equals this.", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "Keep only rows whose `order_id` equals this.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Keep only rows whose `contact_id` equals this.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Keep only rows whose `organization_id` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Keep only rows whose `currency` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
promotionsRedemptions
  .command(`list`)
  .description(`The ledger. Every row is the outcome of a hold, a commitment, a release or a return — a hand-written one would be a discount nobody gave, so this is read-only. It is the row that answers why a past order was cheaper, for support, for the margin report and for the export to a buying organisation.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. The column has to be one this entity has.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--promotion-id <promotion-id>`, `Keep only rows whose \`promotion_id\` equals this.`)
  .option(`--voucher-id <voucher-id>`, `Keep only rows whose \`voucher_id\` equals this.`)
  .option(`--cart-id <cart-id>`, `Keep only rows whose \`cart_id\` equals this.`)
  .option(`--order-id <order-id>`, `Keep only rows whose \`order_id\` equals this.`)
  .option(`--contact-id <contact-id>`, `Keep only rows whose \`contact_id\` equals this.`)
  .option(`--organization-id <organization-id>`, `Keep only rows whose \`organization_id\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--currency <currency>`, `Keep only rows whose \`currency\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, promotionId, voucherId, cartId, orderId, contactId, organizationId, state, currency, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/redemptions`;
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
        if (promotionId !== undefined) {
          _payload[`promotion_id`] = promotionId;
        }
        if (voucherId !== undefined) {
          _payload[`voucher_id`] = voucherId;
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
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
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
registerPromptSpecs(promotionsRedemptions.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/promotions/redemptions", hasLimit: true } },
];
promotionsRedemptions
  .command(`get`)
  .description(`Read one redemption`)
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
        const _apiPath = `/promotions/redemptions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(promotionsRedemptions.commands.at(-1)!, getSpecs, { method: "get" });
const releaseSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "Release this cart hold.", type: "string", required: false },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "Release this order redemptions — a cancellation.", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why they came back. Carried onto the published fact.", type: "string", required: false, enum: ["cart_released","order_cancelled","returned","expired"] },
];
promotionsRedemptions
  .command(`release`)
  .description(`Abandoned carts are the majority of carts, and a hold that never came back would exhaust every campaign within a day. Releasing is not terminal: a buyer returning to a recovered cart may hold again, which is the journey every recovery mail is sent for.`)
  .option(`--cart-id <cart-id>`, `Release this cart hold.`)
  .option(`--order-id <order-id>`, `Release this order redemptions — a cancellation.`)
  .option(`--reason <reason>`, `Why they came back. Carried onto the published fact.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, orderId, reason } = await promptForMissing(
          _options,
          releaseSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/release`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
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
registerPromptSpecs(promotionsRedemptions.commands.at(-1)!, releaseSpecs, { method: "post" });
const reserveSpecs: PromptSpec[] = [
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "The cart the hold is taken on.", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person buying.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The currency the amounts are stated in.", type: "string", required: false },
  { key: "fromCartId", option: "--from-cart-id <from-cart-id>", name: "from_cart_id", description: "A cart being merged into this one. Its hold is released in the same call, so the promotion is never scarcer than it really is.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company they buy for.", type: "string", required: false },
  { key: "promotions", option: "--promotions [promotions...]", name: "promotions", description: "What this cart intends to use, as the evaluation answered it.", type: "array", required: false },
];
promotionsRedemptions
  .command(`reserve`)
  .description(`A budget nobody holds is a budget every concurrent checkout is promised, and the merchant pays the difference. The whole set is replaced rather than added to, because a buyer edits a cart until the last moment. Naming \`from_cart_id\` moves a hold instead of duplicating it, which is what a merging cart needs.`)
  .option(`--cart-id <cart-id>`, `The cart the hold is taken on.`)
  .option(`--contact-id <contact-id>`, `The person buying.`)
  .option(`--currency <currency>`, `The currency the amounts are stated in.`)
  .option(`--from-cart-id <from-cart-id>`, `A cart being merged into this one. Its hold is released in the same call, so the promotion is never scarcer than it really is.`)
  .option(`--organization-id <organization-id>`, `The company they buy for.`)
  .option(`--promotions [promotions...]`, `What this cart intends to use, as the evaluation answered it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cartId, contactId, currency, fromCartId, organizationId, promotions } = await promptForMissing(
          _options,
          reserveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/reserve`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
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
        if (fromCartId !== undefined) {
          _payload[`from_cart_id`] = fromCartId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (promotions !== undefined) {
          _payload[`promotions`] = promotions;
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
registerPromptSpecs(promotionsRedemptions.commands.at(-1)!, reserveSpecs, { method: "post" });
const returnsSpecs: PromptSpec[] = [
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "The order goods came back from.", type: "string", required: true },
  { key: "all", option: "--all <all>", name: "all", description: "Everything came back. The same result as a cancellation, so a merchant watching campaign figures sees one answer either way.", type: "boolean", required: false },
  { key: "lines", option: "--lines [lines...]", name: "lines", description: "Which lines came back.", type: "array", required: false },
  { key: "remainingAmounts", option: "--remaining-amounts <remaining-amounts>", name: "remaining_amounts", description: "Per promotion, what the kept goods are owed — for a promotion that re-decides rather than reversing in proportion.", type: "object", required: false },
  { key: "returnRef", option: "--return-ref <return-ref>", name: "return_ref", description: "The return identifier, so a repeated report credits nothing further.", type: "string", required: false },
];
promotionsRedemptions
  .command(`returns`)
  .description(`A returned line gives back the discount recorded against it, and nothing else moves — unless the promotion re-decides, which is a merchant choice and not an algorithm. Idempotent on the return reference: order management retries, and a return credited twice hands a budget back money it never spent.`)
  .option(`--order-id <order-id>`, `The order goods came back from.`)
  .option(
    `--all [value]`,
    `Everything came back. The same result as a cancellation, so a merchant watching campaign figures sees one answer either way.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--lines [lines...]`, `Which lines came back.`)
  .option(`--remaining-amounts <remaining-amounts>`, `Per promotion, what the kept goods are owed — for a promotion that re-decides rather than reversing in proportion.`)
  .option(`--return-ref <return-ref>`, `The return identifier, so a repeated report credits nothing further.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderId, all, lines, remainingAmounts, returnRef } = await promptForMissing(
          _options,
          returnsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/returns`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (all !== undefined) {
          _payload[`all`] = all;
        }
        if (lines !== undefined) {
          _payload[`lines`] = lines;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
        }
        if (remainingAmounts !== undefined) {
          _payload[`remaining_amounts`] = resolveBodyParam(remainingAmounts);
        }
        if (returnRef !== undefined) {
          _payload[`return_ref`] = returnRef;
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
registerPromptSpecs(promotionsRedemptions.commands.at(-1)!, returnsSpecs, { method: "post" });
