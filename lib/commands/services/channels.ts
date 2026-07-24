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
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const channels = new Command("channels")
  .description(
    commandDescriptions["channels"] ??
      `Manage channels resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
channels
  .command(`list`)
  .description(`List channels (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels`;
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
registerPromptSpecs(channels.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable channel code, unique per tenant (e.g. shop, punchout-acme).", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: true },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Mark as the default channel (default false).", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by locale.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Lifecycle status (default 'active').", type: "string", required: false, enum: ["active","inactive"] },
  { key: "type", option: "--type <type>", name: "type", description: "Where business happens (default 'storefront').", type: "string", required: false, enum: ["storefront","punchout","marketplace","api","pos"] },
];
channels
  .command(`create`)
  .description(`Create a channel`)
  .option(`--code <code>`, `Stable channel code, unique per tenant (e.g. shop, punchout-acme).`)
  .option(`--name <name>`, `Display name.`)
  .option(
    `--is-default [value]`,
    `Mark as the default channel (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names keyed by locale.`)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .option(`--status <status>`, `Lifecycle status (default 'active').`)
  .option(`--type <type>`, `Where business happens (default 'storefront').`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, isDefault, labels, position, status, type } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
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
registerPromptSpecs(channels.commands.at(-1)!, createSpecs, { method: "post" });
channels
  .command(`defaults`)
  .description(`Ensure the default channels exist (idempotent) — seeds e.g. the shop channel; also runs automatically on app.installed.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/channels/defaults`;
        const _payload: RequestParams = {};
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
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/channels", hasLimit: true } },
];
channels
  .command(`delete`)
  .description(`Delete a channel by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`channels delete`);
        const _client = await sdkForProject();
        const _apiPath = `/channels/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `delete`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(channels.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/channels", hasLimit: true } },
];
channels
  .command(`get`)
  .description(`Read one channel by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/channels", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Stable channel code, unique per tenant (e.g. shop, punchout-acme).", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Mark as the default channel (default false).", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names keyed by locale.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Lifecycle status (default 'active').", type: "string", required: false, enum: ["active","inactive"] },
  { key: "type", option: "--type <type>", name: "type", description: "Where business happens (default 'storefront').", type: "string", required: false, enum: ["storefront","punchout","marketplace","api","pos"] },
];
channels
  .command(`update`)
  .description(`Update a channel by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Stable channel code, unique per tenant (e.g. shop, punchout-acme).`)
  .option(
    `--is-default [value]`,
    `Mark as the default channel (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names keyed by locale.`)
  .option(`--name <name>`, `Display name.`)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .option(`--status <status>`, `Lifecycle status (default 'active').`)
  .option(`--type <type>`, `Where business happens (default 'storefront').`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, isDefault, labels, name, position, status, type } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `put`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(channels.commands.at(-1)!, updateSpecs, { method: "put" });
