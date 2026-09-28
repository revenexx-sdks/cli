import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const quotesAcceptance = new Command("quotes-acceptance")
  .description(
    commandDescriptions["quotesAcceptance"] ??
      `What the buyer does: take the quote, take part of it, or refuse it — and what order management is handed afterwards.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const acceptSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", description: "The positions to decide. Left out, every position still open is accepted.", type: "array", required: false },
];
quotesAcceptance
  .command(`accept`)
  .description(`The buyer takes the offer. Sent with no positions it takes everything still open; sent with positions it decides exactly those, which leaves the quote \`partially_accepted\` and open for the rest — a second acceptance later produces a SECOND order. The answer carries an \`order_draft\` shaped the way order management takes it, with the negotiated price as \`unit_price\`, covering only what THIS call accepted. Refused past \`valid_until\`, and refused entirely when the merchant does not allow a basket to be taken apart.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--items [items...]`, `The positions to decide. Left out, every position still open is accepted.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, items } = await promptForMissing(
          _options,
          acceptSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/accept`.replace(`{id}`, id);
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
registerPromptSpecs(quotesAcceptance.commands.at(-1)!, acceptSpecs, { method: "post" });
const declineSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why, in the words the merchant will read.", type: "string", required: false },
];
quotesAcceptance
  .command(`decline`)
  .description(`The buyer refuses the offer. Every position still open is declined with it.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--reason <reason>`, `Why, in the words the merchant will read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          declineSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/decline`.replace(`{id}`, id);
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
registerPromptSpecs(quotesAcceptance.commands.at(-1)!, declineSpecs, { method: "post" });
const orderedSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "orderId", option: "--order-id <order-id>", name: "order_id", description: "The order order management created.", type: "string", required: true },
  { key: "itemIds", option: "--item-ids [item-ids...]", name: "item_ids", description: "Which positions went into it. Left out, every accepted position not yet on an order.", type: "array", required: false },
];
quotesAcceptance
  .command(`ordered`)
  .description(`Writes back which order took which positions. This app cannot know the order id — order management mints it after the draft was handed over — so without this call the record could not answer "which order came out of this quote".`)
  .option(`--id <id>`, `The quote.`)
  .option(`--order-id <order-id>`, `The order order management created.`)
  .option(`--item-ids [item-ids...]`, `Which positions went into it. Left out, every accepted position not yet on an order.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, orderId, itemIds } = await promptForMissing(
          _options,
          orderedSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/ordered`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (itemIds !== undefined) {
          _payload[`item_ids`] = itemIds;
        }
        if (orderId !== undefined) {
          _payload[`order_id`] = orderId;
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
registerPromptSpecs(quotesAcceptance.commands.at(-1)!, orderedSpecs, { method: "post" });
const rejectSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The quote.", type: "string", required: true },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why the merchant will not quote.", type: "string", required: true },
];
quotesAcceptance
  .command(`reject`)
  .description(`The merchant will not make an offer — not deliverable, not a customer they serve, a quantity they cannot do. The reason is required: a refusal the buyer cannot read is not a refusal.`)
  .option(`--id <id>`, `The quote.`)
  .option(`--reason <reason>`, `Why the merchant will not quote.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reason } = await promptForMissing(
          _options,
          rejectSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/quotes/quotes/{id}/reject`.replace(`{id}`, id);
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
registerPromptSpecs(quotesAcceptance.commands.at(-1)!, rejectSpecs, { method: "post" });
