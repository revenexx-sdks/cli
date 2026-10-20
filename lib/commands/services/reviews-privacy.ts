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

export const reviewsPrivacy = new Command("reviews-privacy")
  .description(
    commandDescriptions["reviewsPrivacy"] ??
      `Removing a person from their reviews when they are deleted or erased.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const anonymiseSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The contact.", type: "string", required: true },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
reviewsPrivacy
  .command(`anonymise`)
  .description(`Stars and text stay so product figures do not move; name, contact and company are cleared, and the person's review links are removed. The same happens on \`customers.contact.deleted\` and \`marketing_consents.consents.erased\`.`)
  .option(`--contact-id <contact-id>`, `The contact.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { contactId, body } = await promptForMissing(
          _options,
          anonymiseSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/reviews/contacts/{contact_id}/anonymise`.replace(`{contact_id}`, contactId);
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
registerPromptSpecs(reviewsPrivacy.commands.at(-1)!, anonymiseSpecs, { method: "post" });
