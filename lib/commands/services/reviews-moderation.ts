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

export const reviewsModeration = new Command("reviews-moderation")
  .description(
    commandDescriptions["reviewsModeration"] ??
      `Publishing, rejecting and answering reviews. Every change moves the product figures and is announced.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const publishSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
reviewsModeration
  .command(`publish`)
  .description(`Shows it in the shop and recomputes the product figures. Publishing a published review answers it unchanged.`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
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
          publishSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/reviews/{id}/publish`.replace(`{id}`, id);
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
registerPromptSpecs(reviewsModeration.commands.at(-1)!, publishSpecs, { method: "post" });
const rejectSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why the merchant will not quote.", type: "string", required: true },
];
reviewsModeration
  .command(`reject`)
  .description(`Reject a review, or take a published one down`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
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
        const _apiPath = `/reviews/reviews/{id}/reject`.replace(`{id}`, id);
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
registerPromptSpecs(reviewsModeration.commands.at(-1)!, rejectSpecs, { method: "post" });
const replySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true },
  { key: "reply", option: "--reply <reply>", name: "reply", description: "Empty or null removes the answer.", type: "string", required: false },
];
reviewsModeration
  .command(`reply`)
  .description(`Answer a review publicly, or remove the answer`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .option(`--reply <reply>`, `Empty or null removes the answer.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, reply } = await promptForMissing(
          _options,
          replySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/reviews/{id}/reply`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (reply !== undefined) {
          _payload[`reply`] = reply;
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
registerPromptSpecs(reviewsModeration.commands.at(-1)!, replySpecs, { method: "post" });
