import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
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
          `put`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
