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

export const journeysSteps = new Command("journeys-steps")
  .description(
    commandDescriptions["journeysSteps"] ??
      `The steps of each version as rows — kind, settings and the next, yes and no edges. Written by saving the canvas and frozen when the version goes live.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "journeyVersionId", option: "--journey-version-id <journey-version-id>", name: "journey_version_id", description: "Keep only rows whose `journey_version_id` equals this.", type: "string", required: false },
  { key: "journeyId", option: "--journey-id <journey-id>", name: "journey_id", description: "Keep only rows whose `journey_id` equals this.", type: "string", required: false },
  { key: "stepsVersion", option: "--steps-version <steps-version>", name: "version", description: "Keep only rows whose `version` equals this.", type: "string", required: false },
  { key: "key", option: "--key <key>", name: "key", description: "Keep only rows whose `key` equals this.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Keep only rows whose `kind` equals this.", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", description: "Keep only rows whose `label` equals this.", type: "string", required: false },
  { key: "nextKey", option: "--next-key <next-key>", name: "next_key", description: "Keep only rows whose `next_key` equals this.", type: "string", required: false },
  { key: "yesKey", option: "--yes-key <yes-key>", name: "yes_key", description: "Keep only rows whose `yes_key` equals this.", type: "string", required: false },
  { key: "noKey", option: "--no-key <no-key>", name: "no_key", description: "Keep only rows whose `no_key` equals this.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Keep only rows whose `position` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
journeysSteps
  .command(`list`)
  .description(`Filter \`?journey_version_id=\` or \`?journey_id=&version=\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--journey-version-id <journey-version-id>`, `Keep only rows whose \`journey_version_id\` equals this.`)
  .option(`--journey-id <journey-id>`, `Keep only rows whose \`journey_id\` equals this.`)
  .option(`--steps-version <steps-version>`, `Keep only rows whose \`version\` equals this.`)
  .option(`--key <key>`, `Keep only rows whose \`key\` equals this.`)
  .option(`--kind <kind>`, `Keep only rows whose \`kind\` equals this.`)
  .option(`--label <label>`, `Keep only rows whose \`label\` equals this.`)
  .option(`--next-key <next-key>`, `Keep only rows whose \`next_key\` equals this.`)
  .option(`--yes-key <yes-key>`, `Keep only rows whose \`yes_key\` equals this.`)
  .option(`--no-key <no-key>`, `Keep only rows whose \`no_key\` equals this.`)
  .option(`--position <position>`, `Keep only rows whose \`position\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, journeyVersionId, journeyId, stepsVersion, key, kind, label, nextKey, yesKey, noKey, position, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/steps`;
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
        if (journeyVersionId !== undefined) {
          _payload[`journey_version_id`] = journeyVersionId;
        }
        if (journeyId !== undefined) {
          _payload[`journey_id`] = journeyId;
        }
        if (stepsVersion !== undefined) {
          _payload[`version`] = stepsVersion;
        }
        if (key !== undefined) {
          _payload[`key`] = key;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (nextKey !== undefined) {
          _payload[`next_key`] = nextKey;
        }
        if (yesKey !== undefined) {
          _payload[`yes_key`] = yesKey;
        }
        if (noKey !== undefined) {
          _payload[`no_key`] = noKey;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(journeysSteps.commands.at(-1)!, listSpecs, { method: "get" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/steps", hasLimit: true } },
];
journeysSteps
  .command(`get`)
  .description(`Read one step row`)
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
        const _apiPath = `/journeys/steps/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(journeysSteps.commands.at(-1)!, getSpecs, { method: "get" });
