import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const journeysTemplates = new Command("journeys-templates")
  .description(
    commandDescriptions["journeysTemplates"] ??
      `The shipped flows — cart recovery, welcome, post-purchase, back in stock, and the B2B flows quote expiring, reorder reminder and win-back. Copying one makes a draft journey.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'.", type: "string", required: false },
  { key: "id", option: "--id <id>", name: "id", description: "Keep only rows whose `id` equals this.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Keep only rows whose `code` equals this.", type: "string", required: false },
  { key: "tier", option: "--tier <tier>", name: "tier", description: "Keep only rows whose `tier` equals this.", type: "string", required: false },
  { key: "triggerKind", option: "--trigger-kind <trigger-kind>", name: "trigger_kind", description: "Keep only rows whose `trigger_kind` equals this.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Keep only rows whose `position` equals this.", type: "string", required: false },
  { key: "active", option: "--active <active>", name: "active", description: "Keep only rows whose `active` equals this.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
journeysTemplates
  .command(`list`)
  .description(`List the shipped flows`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'.`)
  .option(`--id <id>`, `Keep only rows whose \`id\` equals this.`)
  .option(`--code <code>`, `Keep only rows whose \`code\` equals this.`)
  .option(`--tier <tier>`, `Keep only rows whose \`tier\` equals this.`)
  .option(`--trigger-kind <trigger-kind>`, `Keep only rows whose \`trigger_kind\` equals this.`)
  .option(`--position <position>`, `Keep only rows whose \`position\` equals this.`)
  .option(`--active <active>`, `Keep only rows whose \`active\` equals this.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, id, code, tier, triggerKind, position, active, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/templates`;
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
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (tier !== undefined) {
          _payload[`tier`] = tier;
        }
        if (triggerKind !== undefined) {
          _payload[`trigger_kind`] = triggerKind;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (active !== undefined) {
          _payload[`active`] = active;
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
registerPromptSpecs(journeysTemplates.commands.at(-1)!, listSpecs, { method: "get" });
const copySpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "e.g. cart_recovery", type: "string", required: true, resource: { listPath: "/journeys/templates", hasLimit: true } },
  { key: "name", option: "--name <name>", name: "name", description: "Defaults to the template name.", type: "string", required: false },
];
journeysTemplates
  .command(`copy`)
  .description(`Copy a template into a new draft journey`)
  .option(`--code <code>`, `e.g. cart_recovery`)
  .option(`--name <name>`, `Defaults to the template name.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name } = await promptForMissing(
          _options,
          copySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/journeys/templates/{code}/copy`.replace(`{code}`, code);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
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
registerPromptSpecs(journeysTemplates.commands.at(-1)!, copySpecs, { method: "post" });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The row id, as it came back from the list.", type: "string", required: true, resource: { listPath: "/journeys/templates", hasLimit: true } },
];
journeysTemplates
  .command(`get`)
  .description(`Read one template`)
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
        const _apiPath = `/journeys/templates/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(journeysTemplates.commands.at(-1)!, getSpecs, { method: "get" });
