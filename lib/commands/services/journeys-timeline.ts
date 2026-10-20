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

export const journeysTimeline = new Command("journeys-timeline")
  .description(
    commandDescriptions["journeysTimeline"] ??
      `What happened to each enrollment, step by step: entered, waited, sent, skipped and why, clicked, reached the goal, left.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "enrollmentId", option: "--enrollment-id <enrollment-id>", name: "enrollment_id", description: "Keep only rows whose `enrollment_id` equals this.", type: "string", required: false },
  { key: "journeyId", option: "--journey-id <journey-id>", name: "journey_id", description: "Keep only rows whose `journey_id` equals this.", type: "string", required: false },
  { key: "timelineVersion", option: "--timeline-version <timeline-version>", name: "version", description: "Keep only rows whose `version` equals this.", type: "string", required: false },
  { key: "stepKey", option: "--step-key <step-key>", name: "step_key", description: "Keep only rows whose `step_key` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "outcome", option: "--outcome <outcome>", name: "outcome", description: "Keep only rows whose `outcome` equals this.", type: "string", required: false },
  { key: "eventKey", option: "--event-key <event-key>", name: "event_key", description: "Keep only rows whose `event_key` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
journeysTimeline
  .command(`list`)
  .description(`Filter \`?enrollment_id=\` for one person's timeline.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--enrollment-id <enrollment-id>`, `Keep only rows whose \`enrollment_id\` equals this.`)
  .option(`--journey-id <journey-id>`, `Keep only rows whose \`journey_id\` equals this.`)
  .option(`--timeline-version <timeline-version>`, `Keep only rows whose \`version\` equals this.`)
  .option(`--step-key <step-key>`, `Keep only rows whose \`step_key\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--outcome <outcome>`, `Keep only rows whose \`outcome\` equals this.`)
  .option(`--event-key <event-key>`, `Keep only rows whose \`event_key\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, enrollmentId, journeyId, timelineVersion, stepKey, kind, outcome, eventKey, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/enrollment-events`;
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
        if (enrollmentId !== undefined) {
          _payload[`enrollment_id`] = enrollmentId;
        }
        if (journeyId !== undefined) {
          _payload[`journey_id`] = journeyId;
        }
        if (timelineVersion !== undefined) {
          _payload[`version`] = timelineVersion;
        }
        if (stepKey !== undefined) {
          _payload[`step_key`] = stepKey;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (outcome !== undefined) {
          _payload[`outcome`] = outcome;
        }
        if (eventKey !== undefined) {
          _payload[`event_key`] = eventKey;
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
registerPromptSpecs(journeysTimeline.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/enrollment-events", hasLimit: true } },
];
journeysTimeline
  .command(`get`)
  .description(`Read one enrollment event`)
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
        const _apiPath = `/journeys/enrollment-events/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(journeysTimeline.commands.at(-1)!, getSpecs, { method: "get" });
