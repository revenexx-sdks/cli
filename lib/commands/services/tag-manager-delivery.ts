import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const tagManagerDelivery = new Command("tag-manager-delivery")
  .description(
    commandDescriptions["tagManagerDelivery"] ??
      `What a storefront reads on its server before it renders a page: the latest published container for its market with the market's tag settings, cached by the gateway per tenant and market and dropped when a version is published — or, with a preview token, the unpublished draft, never cached. A storefront that has nothing published reads an empty container and renders without tags.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

tagManagerDelivery
  .command(`container`)
  .description(`The latest published container for the requested market (its own, else the one for every market), with active marketing tags only and the market's tag settings. Answers an empty container when nothing is published. Gateway-cached per tenant and market; a publish invalidates it.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/delivery/container`;
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
const previewSpecs: PromptSpec[] = [
  { key: "deliveryToken", option: "--delivery-token <delivery-token>", name: "token", description: "The preview token.", type: "string", required: true, secret: true },
];
tagManagerDelivery
  .command(`preview`)
  .description(`The unpublished draft, built now, for a valid preview token. Never cached. An unknown and an expired token are answered alike, with 404.`)
  .option(`--delivery-token <delivery-token>`, `The preview token.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { deliveryToken } = await promptForMissing(
          _options,
          previewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tag-manager/delivery/preview/{token}`.replace(`{token}`, deliveryToken);
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
registerPromptSpecs(tagManagerDelivery.commands.at(-1)!, previewSpecs, { method: "get" });
