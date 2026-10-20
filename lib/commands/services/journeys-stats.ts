import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const journeysStats = new Command("journeys-stats")
  .description(
    commandDescriptions["journeysStats"] ??
      `The counters behind the report, per journey, version and step.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "journeyId", option: "--journey-id <journey-id>", name: "journey_id", description: "Keep only rows whose `journey_id` equals this.", type: "string", required: false },
  { key: "statsVersion", option: "--stats-version <stats-version>", name: "version", description: "Keep only rows whose `version` equals this.", type: "string", required: false },
  { key: "stepKey", option: "--step-key <step-key>", name: "step_key", description: "Keep only rows whose `step_key` equals this.", type: "string", required: false },
  { key: "entered", option: "--entered <entered>", name: "entered", description: "Keep only rows whose `entered` equals this.", type: "string", required: false },
  { key: "passed", option: "--passed <passed>", name: "passed", description: "Keep only rows whose `passed` equals this.", type: "string", required: false },
  { key: "sent", option: "--sent <sent>", name: "sent", description: "Keep only rows whose `sent` equals this.", type: "string", required: false },
  { key: "skipped", option: "--skipped <skipped>", name: "skipped", description: "Keep only rows whose `skipped` equals this.", type: "string", required: false },
  { key: "failed", option: "--failed <failed>", name: "failed", description: "Keep only rows whose `failed` equals this.", type: "string", required: false },
  { key: "exited", option: "--exited <exited>", name: "exited", description: "Keep only rows whose `exited` equals this.", type: "string", required: false },
  { key: "clicked", option: "--clicked <clicked>", name: "clicked", description: "Keep only rows whose `clicked` equals this.", type: "string", required: false },
  { key: "goalReached", option: "--goal-reached <goal-reached>", name: "goal_reached", description: "Keep only rows whose `goal_reached` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
journeysStats
  .command(`list`)
  .description(`List step counters`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--journey-id <journey-id>`, `Keep only rows whose \`journey_id\` equals this.`)
  .option(`--stats-version <stats-version>`, `Keep only rows whose \`version\` equals this.`)
  .option(`--step-key <step-key>`, `Keep only rows whose \`step_key\` equals this.`)
  .option(`--entered <entered>`, `Keep only rows whose \`entered\` equals this.`)
  .option(`--passed <passed>`, `Keep only rows whose \`passed\` equals this.`)
  .option(`--sent <sent>`, `Keep only rows whose \`sent\` equals this.`)
  .option(`--skipped <skipped>`, `Keep only rows whose \`skipped\` equals this.`)
  .option(`--failed <failed>`, `Keep only rows whose \`failed\` equals this.`)
  .option(`--exited <exited>`, `Keep only rows whose \`exited\` equals this.`)
  .option(`--clicked <clicked>`, `Keep only rows whose \`clicked\` equals this.`)
  .option(`--goal-reached <goal-reached>`, `Keep only rows whose \`goal_reached\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, journeyId, statsVersion, stepKey, entered, passed, sent, skipped, failed, exited, clicked, goalReached, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/step-stats`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
        }
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (journeyId !== undefined) {
          _payload[`journey_id`] = journeyId;
        }
        if (statsVersion !== undefined) {
          _payload[`version`] = statsVersion;
        }
        if (stepKey !== undefined) {
          _payload[`step_key`] = stepKey;
        }
        if (entered !== undefined) {
          _payload[`entered`] = entered;
        }
        if (passed !== undefined) {
          _payload[`passed`] = passed;
        }
        if (sent !== undefined) {
          _payload[`sent`] = sent;
        }
        if (skipped !== undefined) {
          _payload[`skipped`] = skipped;
        }
        if (failed !== undefined) {
          _payload[`failed`] = failed;
        }
        if (exited !== undefined) {
          _payload[`exited`] = exited;
        }
        if (clicked !== undefined) {
          _payload[`clicked`] = clicked;
        }
        if (goalReached !== undefined) {
          _payload[`goal_reached`] = goalReached;
        }
        for (const _filter of filter as string[]) {
          const _eq = _filter.indexOf("=");
          if (_eq <= 0) {
            throw new Error(`--filter expects column=value, got "${_filter}"`);
          }
          _payload[_filter.slice(0, _eq)] = _filter.slice(_eq + 1);
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
registerPromptSpecs(journeysStats.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/step-stats", hasLimit: true } },
];
journeysStats
  .command(`get`)
  .description(`Read one step counter`)
  .option(`--id <id>`, `The row id, as it came back from the list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/step-stats/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(journeysStats.commands.at(-1)!, getSpecs, { method: "get" });
