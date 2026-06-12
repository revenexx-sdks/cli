import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
} from "../../parser.js";

export const prices = new Command("prices")
  .description(commandDescriptions["prices"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

prices
  .command(`prices-lists-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists`;
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
prices
  .command(`prices-lists-create`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists`;
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
prices
  .command(`prices-lists-defaults`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/defaults`;
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
prices
  .command(`prices-lists-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{id}`.replace(`{id}`, id);
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
prices
  .command(`prices-lists-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{id}`.replace(`{id}`, id);
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
prices
  .command(`prices-lists-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{id}`.replace(`{id}`, id);
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
prices
  .command(`prices-entries-list`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .action(
    actionRunner(
      async ({ list_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries`.replace(`{list_id}`, list_id);
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
prices
  .command(`prices-entries-create`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .action(
    actionRunner(
      async ({ list_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries`.replace(`{list_id}`, list_id);
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
prices
  .command(`prices-entries-replace`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .action(
    actionRunner(
      async ({ list_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries`.replace(`{list_id}`, list_id);
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
prices
  .command(`prices-entries-delete`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ list_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/{id}`.replace(`{list_id}`, list_id).replace(`{id}`, id);
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
prices
  .command(`prices-entries-get`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ list_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/{id}`.replace(`{list_id}`, list_id).replace(`{id}`, id);
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
prices
  .command(`prices-entries-update`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ list_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/{id}`.replace(`{list_id}`, list_id).replace(`{id}`, id);
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
prices
  .command(`prices-resolve`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/resolve`;
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
