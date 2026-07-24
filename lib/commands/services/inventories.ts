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

export const inventories = new Command("inventories")
  .description(
    commandDescriptions["inventories"] ??
      `Manage inventories resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const adjustSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The corrections — quantities are SIGNED deltas (at most 200).", type: "array", required: true },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Mandatory audit reason — every adjustment is a ledger row.", type: "string", required: true },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Adjusted location (default 'main').", type: "string", required: false },
];
inventories
  .command(`adjust`)
  .description(`Manual correction: ±on_hand with mandatory reason`)
  .option(`--items [items...]`, `The corrections — quantities are SIGNED deltas (at most 200).`)
  .option(`--reason <reason>`, `Mandatory audit reason — every adjustment is a ledger row.`)
  .option(`--location-code <location-code>`, `Adjusted location (default 'main').`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, reason, locationCode } = await promptForMissing(
          _options,
          adjustSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/adjust`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
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
registerPromptSpecs(inventories.commands.at(-1)!, adjustSpecs, { method: "post" });
const availabilitySpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The items to check (batch, at most 200).", type: "array", required: true },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Restrict the check to one location (default: all enabled locations).", type: "string", required: false },
];
inventories
  .command(`availability`)
  .description(`THE stock call (batch): on_hand/reserved/available + orderable per item across locations. Most-customised surface in the field — designed to be replaced 1:1 by a custom app via the gateway capability override (ERP/SAP live stock).`)
  .option(`--items [items...]`, `The items to check (batch, at most 200).`)
  .option(`--location-code <location-code>`, `Restrict the check to one location (default: all enabled locations).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode } = await promptForMissing(
          _options,
          availabilitySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/availability`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
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
registerPromptSpecs(inventories.commands.at(-1)!, availabilitySpecs, { method: "post" });
const commitSpecs: PromptSpec[] = [
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order whose active reservations are committed (shipment).", type: "string", required: true },
];
inventories
  .command(`commit`)
  .description(`Commit an order_ref's reservations on shipment (−on_hand −reserved)`)
  .option(`--order-ref <order-ref>`, `The order whose active reservations are committed (shipment).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderRef } = await promptForMissing(
          _options,
          commitSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/commit`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
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
registerPromptSpecs(inventories.commands.at(-1)!, commitSpecs, { method: "post" });
const locationsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventories
  .command(`locations-list`)
  .description(`List stock locations`)
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
          locationsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations`;
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
registerPromptSpecs(inventories.commands.at(-1)!, locationsListSpecs, { method: "get" });
const locationsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Unique location code (per tenant).", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "address", option: "--address <address>", name: "address", type: "object", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Disabled locations are skipped by availability and reserve (default true).", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localised display names ({de, en, …}).", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Sourcing order — lower wins (default 0).", type: "integer", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Default 'warehouse'.", type: "string", required: false, enum: ["warehouse","store","dropship","virtual"] },
];
inventories
  .command(`locations-create`)
  .description(`Create a location (warehouse, store, dropship, virtual)`)
  .option(`--code <code>`, `Unique location code (per tenant).`)
  .option(`--name <name>`, ``)
  .option(`--address <address>`, ``)
  .option(
    `--enabled [value]`,
    `Disabled locations are skipped by availability and reserve (default true).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localised display names ({de, en, …}).`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--priority <priority>`, `Sourcing order — lower wins (default 0).`, parseInteger)
  .option(`--type <type>`, `Default 'warehouse'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, address, enabled, labels, metadata, priority, type } = await promptForMissing(
          _options,
          locationsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (address !== undefined) {
          _payload[`address`] = resolveBodyParam(address);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
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
registerPromptSpecs(inventories.commands.at(-1)!, locationsCreateSpecs, { method: "post" });
inventories
  .command(`locations-defaults`)
  .description(`Seed the main warehouse — idempotent, also runs on app.installed`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations/defaults`;
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
const locationsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/locations", hasLimit: true } },
];
inventories
  .command(`locations-delete`)
  .description(`Delete a location including its stock`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          locationsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`inventories locations-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, locationsDeleteSpecs, { method: "delete", destructive: true });
const locationsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/locations", hasLimit: true } },
];
inventories
  .command(`locations-get`)
  .description(`Read one location`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          locationsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, locationsGetSpecs, { method: "get" });
const locationsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/locations", hasLimit: true } },
  { key: "address", option: "--address <address>", name: "address", type: "object", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Unique location code (per tenant).", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", description: "Disabled locations are skipped by availability and reserve (default true).", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localised display names ({de, en, …}).", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Sourcing order — lower wins (default 0).", type: "integer", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Default 'warehouse'.", type: "string", required: false, enum: ["warehouse","store","dropship","virtual"] },
];
inventories
  .command(`locations-update`)
  .description(`Update a location`)
  .option(`--id <id>`, ``)
  .option(`--address <address>`, ``)
  .option(`--code <code>`, `Unique location code (per tenant).`)
  .option(
    `--enabled [value]`,
    `Disabled locations are skipped by availability and reserve (default true).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localised display names ({de, en, …}).`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, ``)
  .option(`--priority <priority>`, `Sourcing order — lower wins (default 0).`, parseInteger)
  .option(`--type <type>`, `Default 'warehouse'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, address, code, enabled, labels, metadata, name, priority, type } = await promptForMissing(
          _options,
          locationsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/locations/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (address !== undefined) {
          _payload[`address`] = resolveBodyParam(address);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
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
registerPromptSpecs(inventories.commands.at(-1)!, locationsUpdateSpecs, { method: "put" });
const movementsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventories
  .command(`movements-list`)
  .description(`The movements ledger — every stock change as a booking row (audit trail + event feed)`)
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
          movementsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/movements`;
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
registerPromptSpecs(inventories.commands.at(-1)!, movementsListSpecs, { method: "get" });
const movementsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/movements", hasLimit: true } },
];
inventories
  .command(`movements-get`)
  .description(`Read one movement`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          movementsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/movements/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, movementsGetSpecs, { method: "get" });
const receiveSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The inbound items (at most 200).", type: "array", required: true },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Receiving location (default 'main').", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Ledger note (e.g. delivery note number).", type: "string", required: false },
];
inventories
  .command(`receive`)
  .description(`Goods inbound: +on_hand with a ledger row`)
  .option(`--items [items...]`, `The inbound items (at most 200).`)
  .option(`--location-code <location-code>`, `Receiving location (default 'main').`)
  .option(`--reason <reason>`, `Ledger note (e.g. delivery note number).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode, reason } = await promptForMissing(
          _options,
          receiveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/receive`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
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
registerPromptSpecs(inventories.commands.at(-1)!, receiveSpecs, { method: "post" });
const releaseSpecs: PromptSpec[] = [
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order whose active reservations are released.", type: "string", required: true },
];
inventories
  .command(`release`)
  .description(`Release an order_ref's active reservations (cancellation)`)
  .option(`--order-ref <order-ref>`, `The order whose active reservations are released.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { orderRef } = await promptForMissing(
          _options,
          releaseSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/release`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
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
registerPromptSpecs(inventories.commands.at(-1)!, releaseSpecs, { method: "post" });
const reservationsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventories
  .command(`reservations-list`)
  .description(`List reservations (filter by order_ref/status)`)
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
          reservationsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reservations`;
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
registerPromptSpecs(inventories.commands.at(-1)!, reservationsListSpecs, { method: "get" });
const reservationsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/reservations", hasLimit: true } },
];
inventories
  .command(`reservations-get`)
  .description(`Read one reservation`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          reservationsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reservations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, reservationsGetSpecs, { method: "get" });
const reserveSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The items to reserve — all-or-nothing (at most 200).", type: "array", required: true },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "The order this reservation belongs to.", type: "string", required: true },
  { key: "expiresAt", option: "--expires-at <expires-at>", name: "expires_at", description: "Optional reservation expiry.", type: "string", required: false },
];
inventories
  .command(`reserve`)
  .description(`Reserve stock for an order_ref (all-or-nothing, location by priority)`)
  .option(`--items [items...]`, `The items to reserve — all-or-nothing (at most 200).`)
  .option(`--order-ref <order-ref>`, `The order this reservation belongs to.`)
  .option(`--expires-at <expires-at>`, `Optional reservation expiry.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, orderRef, expiresAt } = await promptForMissing(
          _options,
          reserveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/reserve`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (expiresAt !== undefined) {
          _payload[`expires_at`] = expiresAt;
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
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
registerPromptSpecs(inventories.commands.at(-1)!, reserveSpecs, { method: "post" });
const restockSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The returned items (at most 200).", type: "array", required: true },
  { key: "locationCode", option: "--location-code <location-code>", name: "location_code", description: "Restocking location (default 'main').", type: "string", required: false },
  { key: "orderRef", option: "--order-ref <order-ref>", name: "order_ref", description: "Originating order (ledger reference).", type: "string", required: false },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Ledger note (e.g. return reason).", type: "string", required: false },
];
inventories
  .command(`restock`)
  .description(`Returns back to stock: +on_hand with a ledger row`)
  .option(`--items [items...]`, `The returned items (at most 200).`)
  .option(`--location-code <location-code>`, `Restocking location (default 'main').`)
  .option(`--order-ref <order-ref>`, `Originating order (ledger reference).`)
  .option(`--reason <reason>`, `Ledger note (e.g. return reason).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, locationCode, orderRef, reason } = await promptForMissing(
          _options,
          restockSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/restock`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (locationCode !== undefined) {
          _payload[`location_code`] = locationCode;
        }
        if (orderRef !== undefined) {
          _payload[`order_ref`] = orderRef;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
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
registerPromptSpecs(inventories.commands.at(-1)!, restockSpecs, { method: "post" });
const stockListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
inventories
  .command(`stock-list`)
  .description(`List stock levels (filter by location_id/product_id/sku)`)
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
          stockListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock`;
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
registerPromptSpecs(inventories.commands.at(-1)!, stockListSpecs, { method: "get" });
const stockCreateSpecs: PromptSpec[] = [
  { key: "locationId", option: "--location-id <location-id>", name: "location_id", description: "Owning location.", type: "string", required: true },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "onHand", option: "--on-hand <on-hand>", name: "on_hand", description: "Physical stock (default 0).", type: "number", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Tracked product.", type: "string", required: false },
  { key: "reorderPoint", option: "--reorder-point <reorder-point>", name: "reorder_point", type: "number", required: false },
  { key: "reserved", option: "--reserved <reserved>", name: "reserved", description: "Reserved stock (default 0) — normally managed by reserve/release/commit.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Tracked SKU (alternative to product_id).", type: "string", required: false },
];
inventories
  .command(`stock-create`)
  .description(`Create a stock level row`)
  .option(`--location-id <location-id>`, `Owning location.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--on-hand <on-hand>`, `Physical stock (default 0).`, parseInteger)
  .option(`--product-id <product-id>`, `Tracked product.`)
  .option(`--reorder-point <reorder-point>`, ``, parseInteger)
  .option(`--reserved <reserved>`, `Reserved stock (default 0) — normally managed by reserve/release/commit.`, parseInteger)
  .option(`--sku <sku>`, `Tracked SKU (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { locationId, metadata, onHand, productId, reorderPoint, reserved, sku } = await promptForMissing(
          _options,
          stockCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (locationId !== undefined) {
          _payload[`location_id`] = locationId;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (onHand !== undefined) {
          _payload[`on_hand`] = onHand;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (reorderPoint !== undefined) {
          _payload[`reorder_point`] = reorderPoint;
        }
        if (reserved !== undefined) {
          _payload[`reserved`] = reserved;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
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
registerPromptSpecs(inventories.commands.at(-1)!, stockCreateSpecs, { method: "post" });
const stockDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
];
inventories
  .command(`stock-delete`)
  .description(`Delete a stock level row`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          stockDeleteSpecs,
          _command,
        );
        await confirmDestructive(`inventories stock-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, stockDeleteSpecs, { method: "delete", destructive: true });
const stockGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
];
inventories
  .command(`stock-get`)
  .description(`Read one stock level`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          stockGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(inventories.commands.at(-1)!, stockGetSpecs, { method: "get" });
const stockUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/inventories/stock", hasLimit: true } },
  { key: "locationId", option: "--location-id <location-id>", name: "location_id", description: "Owning location.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "onHand", option: "--on-hand <on-hand>", name: "on_hand", description: "Physical stock (default 0).", type: "number", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Tracked product.", type: "string", required: false },
  { key: "reorderPoint", option: "--reorder-point <reorder-point>", name: "reorder_point", type: "number", required: false },
  { key: "reserved", option: "--reserved <reserved>", name: "reserved", description: "Reserved stock (default 0) — normally managed by reserve/release/commit.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Tracked SKU (alternative to product_id).", type: "string", required: false },
];
inventories
  .command(`stock-update`)
  .description(`Update a stock level row`)
  .option(`--id <id>`, ``)
  .option(`--location-id <location-id>`, `Owning location.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--on-hand <on-hand>`, `Physical stock (default 0).`, parseInteger)
  .option(`--product-id <product-id>`, `Tracked product.`)
  .option(`--reorder-point <reorder-point>`, ``, parseInteger)
  .option(`--reserved <reserved>`, `Reserved stock (default 0) — normally managed by reserve/release/commit.`, parseInteger)
  .option(`--sku <sku>`, `Tracked SKU (alternative to product_id).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, locationId, metadata, onHand, productId, reorderPoint, reserved, sku } = await promptForMissing(
          _options,
          stockUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/inventories/stock/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (locationId !== undefined) {
          _payload[`location_id`] = locationId;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (onHand !== undefined) {
          _payload[`on_hand`] = onHand;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (reorderPoint !== undefined) {
          _payload[`reorder_point`] = reorderPoint;
        }
        if (reserved !== undefined) {
          _payload[`reserved`] = reserved;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
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
registerPromptSpecs(inventories.commands.at(-1)!, stockUpdateSpecs, { method: "put" });
