import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
} from "../../parser.js";

export const greetings = new Command("greetings")
  .description(commandDescriptions["greetings"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

greetings
  .command(`greetings-digest`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/digest`;
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
greetings
  .command(`greetings-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/greetings`;
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
greetings
  .command(`greetings-create`)
  .description(``)
  .requiredOption(`--name <name>`, `Who to greet`)
  .option(`--locale <locale>`, `BCP-47 locale`)
  .action(
    actionRunner(
      async ({ name, locale }) => {
        const _client = await sdkForProject();
        const _apiPath = `/greetings`;
        const _payload: RequestParams = {};
        if (locale !== undefined) {
          _payload[`locale`] = locale;
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
greetings
  .command(`greetings-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/greetings/{id}`.replace(`{id}`, id);
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
greetings
  .command(`greetings-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/greetings/{id}`.replace(`{id}`, id);
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
greetings
  .command(`greetings-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--locale <locale>`, ``)
  .option(`--message <message>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, ``)
  .action(
    actionRunner(
      async ({ id, locale, message, metadata, name }) => {
        const _client = await sdkForProject();
        const _apiPath = `/greetings/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (message !== undefined) {
          _payload[`message`] = message;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
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
