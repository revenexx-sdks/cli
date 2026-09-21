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

export const events = new Command("events")
  .description(
    commandDescriptions["events"] ??
      `The tenant's event catalog: every event type its installed apps and platform services declare, what causes each one, and what it carries.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const getCatalogSpecs: PromptSpec[] = [
  { key: "emitFields", option: "--emit-fields <emit-fields>", name: "fields", description: "Comma-separated keys to keep on each emit. Omit for the full entry. A consumer that reads two fields should say so: the response carries a sample and a JSON Schema per event, and asking for less is the difference between a few kB and tens. An unknown key is ignored; a list naming nothing this response has returns the full entry rather than an empty one.", type: "string", required: false },
];
events
  .command(`get-catalog`)
  .description(`Every event type this tenant's installed apps and platform services declare — what can be published and subscribed to, independent of whether one has fired yet. Each entry says what causes it (\`trigger\`) and what it carries (\`sample\`, \`data_schema\`).`)
  .option(`--emit-fields <emit-fields>`, `Comma-separated keys to keep on each emit. Omit for the full entry. A consumer that reads two fields should say so: the response carries a sample and a JSON Schema per event, and asking for less is the difference between a few kB and tens. An unknown key is ignored; a list naming nothing this response has returns the full entry rather than an empty one.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { emitFields } = await promptForMissing(
          _options,
          getCatalogSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/events/catalog`;
        const _payload: RequestParams = {};
        if (emitFields !== undefined) {
          _payload[`fields`] = emitFields;
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
registerPromptSpecs(events.commands.at(-1)!, getCatalogSpecs, { method: "get" });
