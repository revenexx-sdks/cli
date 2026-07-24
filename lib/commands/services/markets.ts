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

export const markets = new Command("markets")
  .description(
    commandDescriptions["markets"] ??
      `Manage markets resources.`,
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
markets
  .command(`list`)
  .description(`List markets (filter by column; paginate limit/offset/order)`)
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
        const _apiPath = `/markets`;
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
registerPromptSpecs(markets.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Market code (unique per tenant).", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default 'EUR').", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names ({locale: label}).", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'active'.", type: "string", required: false, enum: ["active","inactive"] },
];
markets
  .command(`create`)
  .description(`Create a market`)
  .option(`--code <code>`, `Market code (unique per tenant).`)
  .option(`--name <name>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code (default 'EUR').`)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names ({locale: label}).`)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .option(`--status <status>`, `Default 'active'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, currency, isDefault, labels, position, status } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets`;
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
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
registerPromptSpecs(markets.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
];
markets
  .command(`delete`)
  .description(`Delete a market by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`markets delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
];
markets
  .command(`get`)
  .description(`Read one market by id`)
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
        const _apiPath = `/markets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Market code (unique per tenant).", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default 'EUR').", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names ({locale: label}).", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'active'.", type: "string", required: false, enum: ["active","inactive"] },
];
markets
  .command(`update`)
  .description(`Update a market by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Market code (unique per tenant).`)
  .option(`--currency <currency>`, `ISO 4217 code (default 'EUR').`)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names ({locale: label}).`)
  .option(`--name <name>`, ``)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .option(`--status <status>`, `Default 'active'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, currency, isDefault, labels, name, position, status } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}`.replace(`{id}`, id);
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
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
registerPromptSpecs(markets.commands.at(-1)!, updateSpecs, { method: "put" });
const contextSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
];
markets
  .command(`context`)
  .description(`Resolve the full market context (market + locales + currencies + tax classes) in one call — the storefront bootstrap.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          contextSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}/context`.replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, contextSpecs, { method: "get" });
const currenciesListSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
markets
  .command(`currencies-list`)
  .description(`List currencies of a market (filter by column; paginate limit/offset/order)`)
  .option(`--market-id <market-id>`, ``)
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
        const { marketId, limit, offset, order, filter } = await promptForMissing(
          _options,
          currenciesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies`.replace(`{market_id}`, marketId);
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
registerPromptSpecs(markets.commands.at(-1)!, currenciesListSpecs, { method: "get" });
const currenciesCreateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "ISO 4217 code, e.g. EUR (unique per market).", type: "string", required: true },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
];
markets
  .command(`currencies-create`)
  .description(`Create a currency of a market`)
  .option(`--market-id <market-id>`, ``)
  .option(`--code <code>`, `ISO 4217 code, e.g. EUR (unique per market).`)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, code, isDefault, position } = await promptForMissing(
          _options,
          currenciesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies`.replace(`{market_id}`, marketId);
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
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(markets.commands.at(-1)!, currenciesCreateSpecs, { method: "post" });
const currenciesDeleteSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/currencies", hasLimit: true } },
];
markets
  .command(`currencies-delete`)
  .description(`Delete a currency of a market by id`)
  .option(`--market-id <market-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          currenciesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`markets currencies-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, currenciesDeleteSpecs, { method: "delete", destructive: true });
const currenciesGetSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/currencies", hasLimit: true } },
];
markets
  .command(`currencies-get`)
  .description(`Read one currency of a market by id`)
  .option(`--market-id <market-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          currenciesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, currenciesGetSpecs, { method: "get" });
const currenciesUpdateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/currencies", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "ISO 4217 code, e.g. EUR (unique per market).", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
];
markets
  .command(`currencies-update`)
  .description(`Update a currency of a market by id`)
  .option(`--market-id <market-id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `ISO 4217 code, e.g. EUR (unique per market).`)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id, code, isDefault, position } = await promptForMissing(
          _options,
          currenciesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(markets.commands.at(-1)!, currenciesUpdateSpecs, { method: "put" });
const localesListSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
markets
  .command(`locales-list`)
  .description(`List locales of a market (filter by column; paginate limit/offset/order)`)
  .option(`--market-id <market-id>`, ``)
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
        const { marketId, limit, offset, order, filter } = await promptForMissing(
          _options,
          localesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales`.replace(`{market_id}`, marketId);
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
registerPromptSpecs(markets.commands.at(-1)!, localesListSpecs, { method: "get" });
const localesCreateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Locale code, e.g. 'de-DE' (unique per market).", type: "string", required: true },
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 country code.", type: "string", required: true },
  { key: "language", option: "--language <language>", name: "language", description: "ISO 639-1 language code.", type: "string", required: true },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
];
markets
  .command(`locales-create`)
  .description(`Create a locale of a market`)
  .option(`--market-id <market-id>`, ``)
  .option(`--code <code>`, `Locale code, e.g. 'de-DE' (unique per market).`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 country code.`)
  .option(`--language <language>`, `ISO 639-1 language code.`)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, code, country, language, isDefault, position } = await promptForMissing(
          _options,
          localesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales`.replace(`{market_id}`, marketId);
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
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (language !== undefined) {
          _payload[`language`] = language;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(markets.commands.at(-1)!, localesCreateSpecs, { method: "post" });
const localesDeleteSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/locales", hasLimit: true } },
];
markets
  .command(`locales-delete`)
  .description(`Delete a locale of a market by id`)
  .option(`--market-id <market-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          localesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`markets locales-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, localesDeleteSpecs, { method: "delete", destructive: true });
const localesGetSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/locales", hasLimit: true } },
];
markets
  .command(`locales-get`)
  .description(`Read one locale of a market by id`)
  .option(`--market-id <market-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          localesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, localesGetSpecs, { method: "get" });
const localesUpdateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/locales", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Locale code, e.g. 'de-DE' (unique per market).", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 country code.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "language", option: "--language <language>", name: "language", description: "ISO 639-1 language code.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
];
markets
  .command(`locales-update`)
  .description(`Update a locale of a market by id`)
  .option(`--market-id <market-id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Locale code, e.g. 'de-DE' (unique per market).`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 country code.`)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--language <language>`, `ISO 639-1 language code.`)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id, code, country, isDefault, language, position } = await promptForMissing(
          _options,
          localesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (language !== undefined) {
          _payload[`language`] = language;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(markets.commands.at(-1)!, localesUpdateSpecs, { method: "put" });
const taxClassesListSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
markets
  .command(`tax-classes-list`)
  .description(`List tax classes of a market (filter by column; paginate limit/offset/order)`)
  .option(`--market-id <market-id>`, ``)
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
        const { marketId, limit, offset, order, filter } = await promptForMissing(
          _options,
          taxClassesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes`.replace(`{market_id}`, marketId);
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
registerPromptSpecs(markets.commands.at(-1)!, taxClassesListSpecs, { method: "get" });
const taxClassesCreateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Tax class code (unique per market).", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names ({locale: label}).", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
  { key: "rate", option: "--rate <rate>", name: "rate", description: "Tax rate in percent, 0–100 (default 0).", type: "number", required: false },
];
markets
  .command(`tax-classes-create`)
  .description(`Create a tax class of a market`)
  .option(`--market-id <market-id>`, ``)
  .option(`--code <code>`, `Tax class code (unique per market).`)
  .option(`--name <name>`, ``)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names ({locale: label}).`)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .option(`--rate <rate>`, `Tax rate in percent, 0–100 (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, code, name, isDefault, labels, position, rate } = await promptForMissing(
          _options,
          taxClassesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes`.replace(`{market_id}`, marketId);
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
        if (rate !== undefined) {
          _payload[`rate`] = rate;
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
registerPromptSpecs(markets.commands.at(-1)!, taxClassesCreateSpecs, { method: "post" });
const taxClassesDeleteSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/tax_classes", hasLimit: true } },
];
markets
  .command(`tax-classes-delete`)
  .description(`Delete a tax class of a market by id`)
  .option(`--market-id <market-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          taxClassesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`markets tax-classes-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, taxClassesDeleteSpecs, { method: "delete", destructive: true });
const taxClassesGetSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/tax_classes", hasLimit: true } },
];
markets
  .command(`tax-classes-get`)
  .description(`Read one tax class of a market by id`)
  .option(`--market-id <market-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          taxClassesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, taxClassesGetSpecs, { method: "get" });
const taxClassesUpdateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/tax_classes", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Tax class code (unique per market).", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names ({locale: label}).", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
  { key: "rate", option: "--rate <rate>", name: "rate", description: "Tax rate in percent, 0–100 (default 0).", type: "number", required: false },
];
markets
  .command(`tax-classes-update`)
  .description(`Update a tax class of a market by id`)
  .option(`--market-id <market-id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Tax class code (unique per market).`)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names ({locale: label}).`)
  .option(`--name <name>`, ``)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .option(`--rate <rate>`, `Tax rate in percent, 0–100 (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id, code, isDefault, labels, name, position, rate } = await promptForMissing(
          _options,
          taxClassesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
        if (rate !== undefined) {
          _payload[`rate`] = rate;
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
registerPromptSpecs(markets.commands.at(-1)!, taxClassesUpdateSpecs, { method: "put" });
