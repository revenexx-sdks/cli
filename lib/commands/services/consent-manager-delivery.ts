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

export const consentManagerDelivery = new Command("consent-manager-delivery")
  .description(
    commandDescriptions["consentManagerDelivery"] ??
      `What the storefront reads: the latest published policy of the market (else the shop's), cached at the gateway per market and dropped on every publish, and a draft preview by token.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

consentManagerDelivery
  .command(`policy`)
  .description(`The latest version published for the market in \`x-revenexx-market\`, else the shop's. Cached at the gateway for the whole tenant per market and dropped on every publish. With nothing published it answers 404 \`no_policy_published\` with \`details.reason: nothing_published\`, which the storefront treats as everything denied: no banner, nothing optional loads.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/delivery/policy`;
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
  { key: "previewToken", option: "--preview-token <preview-token>", name: "token", description: "The preview token.", type: "string", required: true, secret: true },
];
consentManagerDelivery
  .command(`preview`)
  .description(`A rendered draft, shaped like the delivered policy, with \`version.preview: true\` and no version id. Not cached.`)
  .option(`--preview-token <preview-token>`, `The preview token.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { previewToken } = await promptForMissing(
          _options,
          previewSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/consent-manager/delivery/preview/{token}`.replace(`{token}`, previewToken);
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
registerPromptSpecs(consentManagerDelivery.commands.at(-1)!, previewSpecs, { method: "get" });
