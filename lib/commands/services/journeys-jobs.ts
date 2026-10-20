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

export const journeysJobs = new Command("journeys-jobs")
  .description(
    commandDescriptions["journeysJobs"] ??
      `The scheduled work, callable by hand: the step job every five minutes, the trigger run (date triggers and the sweep for undelivered announcements) every hour.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const stepsSpecs: PromptSpec[] = [
  { key: "budgetMs", option: "--budget-ms <budget-ms>", name: "budget_ms", description: "A shorter budget than the setting.", type: "integer", required: false },
];
journeysJobs
  .command(`steps`)
  .description(`Executes due steps of all live journeys, oldest first, in chunks, within the budget (setting step_budget_ms). Also the five-minute schedule run-steps.`)
  .option(`--budget-ms <budget-ms>`, `A shorter budget than the setting.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { budgetMs } = await promptForMissing(
          _options,
          stepsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/steps/run`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (budgetMs !== undefined) {
          _payload[`budget_ms`] = budgetMs;
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
registerPromptSpecs(journeysJobs.commands.at(-1)!, stepsSpecs, { method: "post" });
const triggersSpecs: PromptSpec[] = [
  { key: "jobsForce", option: "--jobs-force <jobs-force>", name: "force", description: "Run date triggers again today, before their time.", type: "boolean", required: false },
];
journeysJobs
  .command(`triggers`)
  .description(`Date triggers that are due today, then the three-hour sweep over carts, orders, subscriptions and audience joins standing in for undelivered announcements (PE-748). Also the hourly schedule run-triggers.`)
  .option(
    `--jobs-force [value]`,
    `Run date triggers again today, before their time.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { jobsForce } = await promptForMissing(
          _options,
          triggersSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/triggers/run`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (jobsForce !== undefined) {
          _payload[`force`] = jobsForce;
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
registerPromptSpecs(journeysJobs.commands.at(-1)!, triggersSpecs, { method: "post" });
