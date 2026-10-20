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

export const journeysVersions = new Command("journeys-versions")
  .description(
    commandDescriptions["journeysVersions"] ??
      `Every version a journey had: one draft at most, one live at most, the rest retired. A running enrollment finishes on the version it started on.`,
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
  { key: "versionsVersion", option: "--versions-version <versions-version>", name: "version", description: "Keep only rows whose `version` equals this.", type: "string", required: false },
  { key: "state", option: "--state <state>", name: "state", description: "Keep only rows whose `state` equals this.", type: "string", required: false },
  { key: "entryKey", option: "--entry-key <entry-key>", name: "entry_key", description: "Keep only rows whose `entry_key` equals this.", type: "string", required: false },
  { key: "stepCount", option: "--step-count <step-count>", name: "step_count", description: "Keep only rows whose `step_count` equals this.", type: "string", required: false },
  { key: "publishedBy", option: "--published-by <published-by>", name: "published_by", description: "Keep only rows whose `published_by` equals this.", type: "string", required: false },
  { key: "notes", option: "--notes <notes>", name: "notes", description: "Keep only rows whose `notes` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
journeysVersions
  .command(`list`)
  .description(`Filter \`?journey_id=\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--journey-id <journey-id>`, `Keep only rows whose \`journey_id\` equals this.`)
  .option(`--versions-version <versions-version>`, `Keep only rows whose \`version\` equals this.`)
  .option(`--state <state>`, `Keep only rows whose \`state\` equals this.`)
  .option(`--entry-key <entry-key>`, `Keep only rows whose \`entry_key\` equals this.`)
  .option(`--step-count <step-count>`, `Keep only rows whose \`step_count\` equals this.`)
  .option(`--published-by <published-by>`, `Keep only rows whose \`published_by\` equals this.`)
  .option(`--notes <notes>`, `Keep only rows whose \`notes\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, journeyId, versionsVersion, state, entryKey, stepCount, publishedBy, notes, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/versions`;
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
        if (versionsVersion !== undefined) {
          _payload[`version`] = versionsVersion;
        }
        if (state !== undefined) {
          _payload[`state`] = state;
        }
        if (entryKey !== undefined) {
          _payload[`entry_key`] = entryKey;
        }
        if (stepCount !== undefined) {
          _payload[`step_count`] = stepCount;
        }
        if (publishedBy !== undefined) {
          _payload[`published_by`] = publishedBy;
        }
        if (notes !== undefined) {
          _payload[`notes`] = notes;
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
registerPromptSpecs(journeysVersions.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/versions", hasLimit: true } },
];
journeysVersions
  .command(`get`)
  .description(`Read one version`)
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
        const _apiPath = `/journeys/versions/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(journeysVersions.commands.at(-1)!, getSpecs, { method: "get" });
