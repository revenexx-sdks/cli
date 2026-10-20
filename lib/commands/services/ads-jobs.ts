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

export const adsJobs = new Command("ads-jobs")
  .description(
    commandDescriptions["adsJobs"] ??
      `The hourly run: conversions of recent orders, audience uploads that are due, spend bookings that waited.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const runSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
adsJobs
  .command(`run`)
  .description(`Records conversions of orders placed in the last three hours, requests audience uploads that are due, books spend that waited for campaigns, recounts the totals of each account — the same as the hourly schedule.`)
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
          runSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/ads/run`;
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
registerPromptSpecs(adsJobs.commands.at(-1)!, runSpecs, { method: "post" });
