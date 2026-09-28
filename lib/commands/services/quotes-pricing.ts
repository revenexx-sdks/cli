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
const priceSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", description: "The positions to price. A position left out keeps what it has.", type: "array", required: false },
  { key: "sellerNote", option: "--seller-note <seller-note>", name: "seller_note", description: "What the customer reads with the quote.", type: "string", required: false },
  { key: "shippingAmount", option: "--shipping-amount <shipping-amount>", name: "shipping_amount", description: "Carriage quoted alongside the goods, net. It enters `grand_total` and the first order out of the quote.", type: "number", required: false },
  { key: "shippingTaxRate", option: "--shipping-tax-rate <shipping-tax-rate>", name: "shipping_tax_rate", description: "The rate carriage is taxed at, in percent (0–100).", type: "number", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "When the offer stops standing. Left out, the configured default validity is used.", type: "string", required: false },
];
quotesPricing
  .command(`price`)
  .description(`The merchant's side of the desk, and THE designated override point of this app: a tenant whose prices come out of an ERP replaces this one capability at the gateway and keeps everything else. Sets a negotiated price per position, a validity, and the note the customer reads. Re-pricing a quote the buyer has already seen writes a new revision by default, so every round of a negotiation stays readable.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--items [items...]`, `The positions to price. A position left out keeps what it has.`)
  .option(`--seller-note <seller-note>`, `What the customer reads with the quote.`)
  .option(`--shipping-amount <shipping-amount>`, `Carriage quoted alongside the goods, net. It enters \`grand_total\` and the first order out of the quote.`, parseInteger)
  .option(`--shipping-tax-rate <shipping-tax-rate>`, `The rate carriage is taxed at, in percent (0–100).`, parseInteger)
  .option(`--valid-until <valid-until>`, `When the offer stops standing. Left out, the configured default validity is used.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, items, sellerNote, shippingAmount, shippingTaxRate, validUntil } = await promptForMissing(
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
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (sellerNote !== undefined) {
          _payload[`seller_note`] = sellerNote;
        }
        if (shippingAmount !== undefined) {
          _payload[`shipping_amount`] = shippingAmount;
        }
        if (shippingTaxRate !== undefined) {
          _payload[`shipping_tax_rate`] = shippingTaxRate;
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
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Who takes it. The caller when left out.", type: "string", required: false },
];
quotesPricing
  .command(`review`)
  .description(`Claims a request: it moves out of the unattended queue and gets an owner, which is what a sales worklist filters by.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--owner-id <owner-id>`, `Who takes it. The caller when left out.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, ownerId } = await promptForMissing(
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
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
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
