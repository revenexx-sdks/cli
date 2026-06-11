import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
} from "../../parser.js";

export const shipping = new Command("shipping")
  .description(commandDescriptions["shipping"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

shipping
  .command(`shipping-methods-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods`;
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
shipping
  .command(`shipping-methods-create`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods`;
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
shipping
  .command(`shipping-methods-defaults`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/defaults`;
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
shipping
  .command(`shipping-methods-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
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
shipping
  .command(`shipping-methods-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
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
shipping
  .command(`shipping-methods-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
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
shipping
  .command(`shipping-tiers-list`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .action(
    actionRunner(
      async ({ method_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, method_id);
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
shipping
  .command(`shipping-tiers-create`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .action(
    actionRunner(
      async ({ method_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, method_id);
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
shipping
  .command(`shipping-tiers-replace`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .action(
    actionRunner(
      async ({ method_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, method_id);
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
shipping
  .command(`shipping-tiers-delete`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ method_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, method_id).replace(`{id}`, id);
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
shipping
  .command(`shipping-tiers-get`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ method_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, method_id).replace(`{id}`, id);
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
shipping
  .command(`shipping-tiers-update`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ method_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, method_id).replace(`{id}`, id);
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
shipping
  .command(`shipping-rates`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/rates`;
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
