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

export const promotionsEvaluation = new Command("promotions-evaluation")
  .description(
    commandDescriptions["promotionsEvaluation"] ??
      `What a cart is owed. The evaluation takes a priced cart — lines that already carry a resolved unit price, a currency and a tax rate — plus the buyer, the market, the channel and any codes entered, and answers with the effects it is owed, each naming the promotion behind it and the amount it takes off. It writes nothing, so a storefront may call it on every keystroke, and it prices nothing, so a line arriving without a price is refused rather than guessed at. This is the designated override point: a tenant running their own promotion engine replaces exactly this group.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const availableSpecs: PromptSpec[] = [
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The three-letter currency the cart is stated in. A promotion in another currency is skipped rather than converted.", type: "string", required: true },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "The sales channel.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person buying.", type: "string", required: false },
  { key: "itemCount", option: "--item-count <item-count>", name: "item_count", description: "Units in the cart, for a quantity condition. Derived from the lines when absent.", type: "integer", required: false },
  { key: "lines", option: "--lines [lines...]", name: "lines", description: "The priced cart lines. At most 500.", type: "array", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "The market the call is for. Also taken from the x-revenexx-market header.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company they buy for.", type: "string", required: false },
  { key: "paymentFee", option: "--payment-fee <payment-fee>", name: "payment_fee", description: "The payment fee, so an effect can reduce it.", type: "number", required: false },
  { key: "precision", option: "--precision <precision>", name: "precision", description: "Decimals every derived amount is rounded to. Follows the tenant price policy.", type: "integer", required: false },
  { key: "rounding", option: "--rounding <rounding>", name: "rounding", description: "How a fraction of a cent is rounded: half_up, half_even, up or down.", type: "string", required: false },
  { key: "shipping", option: "--shipping <shipping>", name: "shipping", description: "The freight cost, so an effect can reduce it.", type: "number", required: false },
  { key: "subtotal", option: "--subtotal <subtotal>", name: "subtotal", description: "The goods value before any promotion. Derived from the lines when absent.", type: "number", required: false },
  { key: "taxIncluded", option: "--tax-included <tax-included>", name: "tax_included", description: "Whether the prices are gross. A net discount subtracted from a gross line is wrong by exactly the tax rate.", type: "boolean", required: false },
];
promotionsEvaluation
  .command(`available`)
  .description(`A different question from what a cart is owed: a shop that can only answer the second can only tell a buyer about a discount after they have earned it. With a cart, each promotion states how far away it is — "12 euro more" is the sentence that raises an order value. A promotion needing a code is listed as needing one, and no code appears in the answer.`)
  .option(`--currency <currency>`, `The three-letter currency the cart is stated in. A promotion in another currency is skipped rather than converted.`)
  .option(`--channel <channel>`, `The sales channel.`)
  .option(`--contact-id <contact-id>`, `The person buying.`)
  .option(`--item-count <item-count>`, `Units in the cart, for a quantity condition. Derived from the lines when absent.`, parseInteger)
  .option(`--lines [lines...]`, `The priced cart lines. At most 500.`)
  .option(`--market <market>`, `The market the call is for. Also taken from the x-revenexx-market header.`)
  .option(`--organization-id <organization-id>`, `The company they buy for.`)
  .option(`--payment-fee <payment-fee>`, `The payment fee, so an effect can reduce it.`, parseInteger)
  .option(`--precision <precision>`, `Decimals every derived amount is rounded to. Follows the tenant price policy.`, parseInteger)
  .option(`--rounding <rounding>`, `How a fraction of a cent is rounded: half_up, half_even, up or down.`)
  .option(`--shipping <shipping>`, `The freight cost, so an effect can reduce it.`, parseInteger)
  .option(`--subtotal <subtotal>`, `The goods value before any promotion. Derived from the lines when absent.`, parseInteger)
  .option(
    `--tax-included [value]`,
    `Whether the prices are gross. A net discount subtracted from a gross line is wrong by exactly the tax rate.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { currency, channel, contactId, itemCount, lines, market, organizationId, paymentFee, precision, rounding, shipping, subtotal, taxIncluded } = await promptForMissing(
          _options,
          availableSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/available`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (itemCount !== undefined) {
          _payload[`item_count`] = itemCount;
        }
        if (lines !== undefined) {
          _payload[`lines`] = lines;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (paymentFee !== undefined) {
          _payload[`payment_fee`] = paymentFee;
        }
        if (precision !== undefined) {
          _payload[`precision`] = precision;
        }
        if (rounding !== undefined) {
          _payload[`rounding`] = rounding;
        }
        if (shipping !== undefined) {
          _payload[`shipping`] = shipping;
        }
        if (subtotal !== undefined) {
          _payload[`subtotal`] = subtotal;
        }
        if (taxIncluded !== undefined) {
          _payload[`tax_included`] = taxIncluded;
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
registerPromptSpecs(promotionsEvaluation.commands.at(-1)!, availableSpecs, { method: "post" });
const checkCodeSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "The code to check.", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Who is asking, so a code held for them is reported as usable.", type: "string", required: false },
];
promotionsEvaluation
  .command(`check-code`)
  .description(`A landing page shows an offer before a buyer has added anything, and should not have to invent a cart to find out whether it is still live. The answer never says WHO a code belongs to — the address is reachable by anyone who can guess a code, and one that answered with a customer name would be a data leak with a search box.`)
  .option(`--code <code>`, `The code to check.`)
  .option(`--contact-id <contact-id>`, `Who is asking, so a code held for them is reported as usable.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, contactId } = await promptForMissing(
          _options,
          checkCodeSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/codes/check`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
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
registerPromptSpecs(promotionsEvaluation.commands.at(-1)!, checkCodeSpecs, { method: "post" });
const evaluateSpecs: PromptSpec[] = [
  { key: "currency", option: "--currency <currency>", name: "currency", description: "The three-letter currency the cart is stated in. A promotion in another currency is skipped rather than converted.", type: "string", required: true },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "The sales channel.", type: "string", required: false },
  { key: "codes", option: "--codes [codes...]", name: "codes", description: "Codes the buyer entered. Matched trimmed and case-insensitively unless the tenant made codes case-sensitive.", type: "array", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person buying.", type: "string", required: false },
  { key: "itemCount", option: "--item-count <item-count>", name: "item_count", description: "Units in the cart, for a quantity condition. Derived from the lines when absent.", type: "integer", required: false },
  { key: "lines", option: "--lines [lines...]", name: "lines", description: "The priced cart lines. At most 500.", type: "array", required: false },
  { key: "market", option: "--market <market>", name: "market", description: "The market the call is for. Also taken from the x-revenexx-market header.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company they buy for.", type: "string", required: false },
  { key: "paymentFee", option: "--payment-fee <payment-fee>", name: "payment_fee", description: "The payment fee, so an effect can reduce it.", type: "number", required: false },
  { key: "precision", option: "--precision <precision>", name: "precision", description: "Decimals every derived amount is rounded to. Follows the tenant price policy.", type: "integer", required: false },
  { key: "previewPromotionIds", option: "--preview-promotion-ids [preview-promotion-ids...]", name: "preview_promotion_ids", description: "Promotions to evaluate although they are not live — a merchant testing a drafted offer against a real cart. Nothing about them is changed.", type: "array", required: false },
  { key: "rounding", option: "--rounding <rounding>", name: "rounding", description: "How a fraction of a cent is rounded: half_up, half_even, up or down.", type: "string", required: false },
  { key: "shipping", option: "--shipping <shipping>", name: "shipping", description: "The freight cost, so an effect can reduce it.", type: "number", required: false },
  { key: "subtotal", option: "--subtotal <subtotal>", name: "subtotal", description: "The goods value before any promotion. Derived from the lines when absent.", type: "number", required: false },
  { key: "taxIncluded", option: "--tax-included <tax-included>", name: "tax_included", description: "Whether the prices are gross. A net discount subtracted from a gross line is wrong by exactly the tax rate.", type: "boolean", required: false },
];
promotionsEvaluation
  .command(`evaluate`)
  .description(`THE promotion call, and the designated override point. A priced cart goes in; a list of attributed effects comes out, each naming the promotion behind it and the amount it takes off. It writes nothing, so a storefront may call it on every keystroke, and it prices nothing, so a line with no resolved unit price is refused rather than guessed at. Promotions that matched and lost are named with the reason, unless the tenant switched disclosure off. The answer carries the policy it was computed under, so a discount can be re-derived from its own payload.`)
  .option(`--currency <currency>`, `The three-letter currency the cart is stated in. A promotion in another currency is skipped rather than converted.`)
  .option(`--channel <channel>`, `The sales channel.`)
  .option(`--codes [codes...]`, `Codes the buyer entered. Matched trimmed and case-insensitively unless the tenant made codes case-sensitive.`)
  .option(`--contact-id <contact-id>`, `The person buying.`)
  .option(`--item-count <item-count>`, `Units in the cart, for a quantity condition. Derived from the lines when absent.`, parseInteger)
  .option(`--lines [lines...]`, `The priced cart lines. At most 500.`)
  .option(`--market <market>`, `The market the call is for. Also taken from the x-revenexx-market header.`)
  .option(`--organization-id <organization-id>`, `The company they buy for.`)
  .option(`--payment-fee <payment-fee>`, `The payment fee, so an effect can reduce it.`, parseInteger)
  .option(`--precision <precision>`, `Decimals every derived amount is rounded to. Follows the tenant price policy.`, parseInteger)
  .option(`--preview-promotion-ids [preview-promotion-ids...]`, `Promotions to evaluate although they are not live — a merchant testing a drafted offer against a real cart. Nothing about them is changed.`)
  .option(`--rounding <rounding>`, `How a fraction of a cent is rounded: half_up, half_even, up or down.`)
  .option(`--shipping <shipping>`, `The freight cost, so an effect can reduce it.`, parseInteger)
  .option(`--subtotal <subtotal>`, `The goods value before any promotion. Derived from the lines when absent.`, parseInteger)
  .option(
    `--tax-included [value]`,
    `Whether the prices are gross. A net discount subtracted from a gross line is wrong by exactly the tax rate.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { currency, channel, codes, contactId, itemCount, lines, market, organizationId, paymentFee, precision, previewPromotionIds, rounding, shipping, subtotal, taxIncluded } = await promptForMissing(
          _options,
          evaluateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/evaluate`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (codes !== undefined) {
          _payload[`codes`] = codes;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (itemCount !== undefined) {
          _payload[`item_count`] = itemCount;
        }
        if (lines !== undefined) {
          _payload[`lines`] = lines;
        }
        if (market !== undefined) {
          _payload[`market`] = market;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (paymentFee !== undefined) {
          _payload[`payment_fee`] = paymentFee;
        }
        if (precision !== undefined) {
          _payload[`precision`] = precision;
        }
        if (previewPromotionIds !== undefined) {
          _payload[`preview_promotion_ids`] = previewPromotionIds;
        }
        if (rounding !== undefined) {
          _payload[`rounding`] = rounding;
        }
        if (shipping !== undefined) {
          _payload[`shipping`] = shipping;
        }
        if (subtotal !== undefined) {
          _payload[`subtotal`] = subtotal;
        }
        if (taxIncluded !== undefined) {
          _payload[`tax_included`] = taxIncluded;
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
registerPromptSpecs(promotionsEvaluation.commands.at(-1)!, evaluateSpecs, { method: "post" });
promotionsEvaluation
  .command(`vocabularies`)
  .description(`The subjects a condition may ask about, the comparisons it may use, the effect kinds and target scopes, the stacking modes, and the closed lists of refusal, skip and release reasons. A caller building a form reads these rather than hardcoding them.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/promotions/vocabularies`;
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
const vocabularySpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name, as the list answers it.", type: "string", required: true, resource: { listPath: "/promotions/vocabularies", hasLimit: false } },
];
promotionsEvaluation
  .command(`vocabulary`)
  .description(`Read one vocabulary`)
  .option(`--name <name>`, `The vocabulary name, as the list answers it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          vocabularySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/promotions/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(promotionsEvaluation.commands.at(-1)!, vocabularySpecs, { method: "get" });
