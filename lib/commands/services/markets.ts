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

export const markets = new Command("markets")
  .description(commandDescriptions["markets"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

markets
  .command(`markets-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/markets`;
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
  .command(`markets-create`)
  .description(``)
  .requiredOption(`--code <code>`, `Market code (unique per tenant).`)
  .requiredOption(`--name <name>`, ``)
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
      async ({ code, name, currency, is_default, labels, position, status }) => {
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
  .command(`markets-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`markets-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`markets-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, code, currency, is_default, labels, name, position, status }) => {
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
  .command(`markets-context`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`markets-currencies-list`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .action(
    actionRunner(
      async ({ market_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies`.replace(`{market_id}`, market_id);
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
  .command(`markets-currencies-create`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--code <code>`, `ISO 4217 code, e.g. EUR (unique per market).`)
  .option(
    `--is-_default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .action(
    actionRunner(
      async ({ market_id, code, is_default, position }) => {
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
  .command(`markets-currencies-delete`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ market_id, id }) => {
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
  .command(`markets-currencies-get`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ market_id, id }) => {
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
  .command(`markets-currencies-update`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ market_id, id, code, is_default, position }) => {
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
  .command(`markets-locales-list`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .action(
    actionRunner(
      async ({ market_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales`.replace(`{market_id}`, market_id);
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
  .command(`markets-locales-create`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--code <code>`, `Locale code, e.g. 'de-DE' (unique per market).`)
  .requiredOption(`--country <country>`, `ISO 3166-1 alpha-2 country code.`)
  .requiredOption(`--language <language>`, `ISO 639-1 language code.`)
  .option(
    `--is-_default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .action(
    actionRunner(
      async ({ market_id, code, country, language, is_default, position }) => {
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
  .command(`markets-locales-delete`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ market_id, id }) => {
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
  .command(`markets-locales-get`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ market_id, id }) => {
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
  .command(`markets-locales-update`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ market_id, id, code, country, is_default, language, position }) => {
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
  .command(`markets-tax-classes-list`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .action(
    actionRunner(
      async ({ market_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes`.replace(`{market_id}`, market_id);
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
  .command(`markets-tax-classes-create`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--code <code>`, `Tax class code (unique per market).`)
  .requiredOption(`--name <name>`, ``)
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
      async ({ market_id, code, name, is_default, labels, position, rate }) => {
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
  .command(`markets-tax-classes-delete`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ market_id, id }) => {
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
  .command(`markets-tax-classes-get`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ market_id, id }) => {
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
  .command(`markets-tax-classes-update`)
  .description(``)
  .requiredOption(`--market-_id <market-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ market_id, id, code, is_default, labels, name, position, rate }) => {
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
