import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
} from "../../interactive.js";

export const markets = new Command("markets")
  .description(
    commandDescriptions["markets"] ??
      `Manage markets resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

markets
  .command(`list`)
  .description(`List markets (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
markets
  .command(`create`)
  .description(`Create a market`)
  .option(`--code <code>`, `Market code (unique per tenant).`)
  .option(`--name <name>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code (default 'EUR').`)
  .option(
    `--is-_default [value]`,
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
        const { code, name, currency, is_default, labels, position, status } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", description: "Market code (unique per tenant).", type: "string", required: true },
            { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets`;
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
markets
  .command(`delete`)
  .description(`Delete a market by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
          ],
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
markets
  .command(`get`)
  .description(`Read one market by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
          ],
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
markets
  .command(`update`)
  .description(`Update a market by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Market code (unique per tenant).`)
  .option(`--currency <currency>`, `ISO 4217 code (default 'EUR').`)
  .option(
    `--is-_default [value]`,
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
        const { id, code, currency, is_default, labels, name, position, status } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
markets
  .command(`context`)
  .description(`Resolve the full market context (market + locales + currencies + tax classes) in one call — the storefront bootstrap.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
          ],
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
markets
  .command(`currencies-list`)
  .description(`List currencies of a market (filter by column; paginate limit/offset/order)`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, limit, offset, order } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies`.replace(`{market_id}`, market_id);
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
markets
  .command(`currencies-create`)
  .description(`Create a currency of a market`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--code <code>`, `ISO 4217 code, e.g. EUR (unique per market).`)
  .option(
    `--is-_default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, code, is_default, position } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "code", option: "--code <code>", name: "code", description: "ISO 4217 code, e.g. EUR (unique per market).", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies`.replace(`{market_id}`, market_id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
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
markets
  .command(`currencies-delete`)
  .description(`Delete a currency of a market by id`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, id } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/currencies", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`markets currencies-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies/{id}`.replace(`{market_id}`, market_id).replace(`{id}`, id);
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
markets
  .command(`currencies-get`)
  .description(`Read one currency of a market by id`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, id } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/currencies", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies/{id}`.replace(`{market_id}`, market_id).replace(`{id}`, id);
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
markets
  .command(`currencies-update`)
  .description(`Update a currency of a market by id`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `ISO 4217 code, e.g. EUR (unique per market).`)
  .option(
    `--is-_default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, id, code, is_default, position } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/currencies", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies/{id}`.replace(`{market_id}`, market_id).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
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
markets
  .command(`locales-list`)
  .description(`List locales of a market (filter by column; paginate limit/offset/order)`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, limit, offset, order } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales`.replace(`{market_id}`, market_id);
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
markets
  .command(`locales-create`)
  .description(`Create a locale of a market`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--code <code>`, `Locale code, e.g. 'de-DE' (unique per market).`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 country code.`)
  .option(`--language <language>`, `ISO 639-1 language code.`)
  .option(
    `--is-_default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, code, country, language, is_default, position } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "code", option: "--code <code>", name: "code", description: "Locale code, e.g. 'de-DE' (unique per market).", type: "string", required: true },
            { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 country code.", type: "string", required: true },
            { key: "language", option: "--language <language>", name: "language", description: "ISO 639-1 language code.", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales`.replace(`{market_id}`, market_id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
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
markets
  .command(`locales-delete`)
  .description(`Delete a locale of a market by id`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, id } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/locales", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`markets locales-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales/{id}`.replace(`{market_id}`, market_id).replace(`{id}`, id);
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
markets
  .command(`locales-get`)
  .description(`Read one locale of a market by id`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, id } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/locales", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales/{id}`.replace(`{market_id}`, market_id).replace(`{id}`, id);
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
markets
  .command(`locales-update`)
  .description(`Update a locale of a market by id`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Locale code, e.g. 'de-DE' (unique per market).`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 country code.`)
  .option(
    `--is-_default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--language <language>`, `ISO 639-1 language code.`)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, id, code, country, is_default, language, position } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/locales", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales/{id}`.replace(`{market_id}`, market_id).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
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
markets
  .command(`tax-classes-list`)
  .description(`List tax classes of a market (filter by column; paginate limit/offset/order)`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, limit, offset, order } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes`.replace(`{market_id}`, market_id);
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
markets
  .command(`tax-classes-create`)
  .description(`Create a tax class of a market`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--code <code>`, `Tax class code (unique per market).`)
  .option(`--name <name>`, ``)
  .option(
    `--is-_default [value]`,
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
        const { market_id, code, name, is_default, labels, position, rate } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "code", option: "--code <code>", name: "code", description: "Tax class code (unique per market).", type: "string", required: true },
            { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes`.replace(`{market_id}`, market_id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
markets
  .command(`tax-classes-delete`)
  .description(`Delete a tax class of a market by id`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, id } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/tax_classes", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`markets tax-classes-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes/{id}`.replace(`{market_id}`, market_id).replace(`{id}`, id);
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
markets
  .command(`tax-classes-get`)
  .description(`Read one tax class of a market by id`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { market_id, id } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/tax_classes", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes/{id}`.replace(`{market_id}`, market_id).replace(`{id}`, id);
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
markets
  .command(`tax-classes-update`)
  .description(`Update a tax class of a market by id`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, `Tax class code (unique per market).`)
  .option(
    `--is-_default [value]`,
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
        const { market_id, id, code, is_default, labels, name, position, rate } = await promptForMissing(
          _options,
          [
            { key: "market_id", option: "--market-_id <market-_id>", name: "market_id", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/markets/{market_id}/tax_classes", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes/{id}`.replace(`{market_id}`, market_id).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
