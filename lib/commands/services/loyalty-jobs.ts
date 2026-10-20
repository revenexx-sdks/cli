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

export const loyaltyJobs = new Command("loyalty-jobs")
  .description(
    commandDescriptions["loyaltyJobs"] ??
      `The hourly run: orders credited, returned and cancelled in the last two days, points past their date, agreement projections and tiers.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const recalculateSpecs: PromptSpec[] = [
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
loyaltyJobs
  .command(`recalculate`)
  .description(`Credits orders of the last 48 hours, books their completed returns and cancellations, expires due points, moves agreement projections on and re-reads tiers — the same as the hourly schedule.`)
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
          recalculateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/loyalty/recalculate/run`;
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
registerPromptSpecs(loyaltyJobs.commands.at(-1)!, recalculateSpecs, { method: "post" });
