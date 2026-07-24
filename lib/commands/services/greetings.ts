import { Command } from "commander";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const greetings = new Command("greetings")
  .description(
    commandDescriptions["greetings"] ??
      `Manage greetings resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

greetings
  .command(`digest`)
  .description(`Aggregate greetings and return a derived upper-cased shout view`)
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
const listSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
greetings
  .command(`list`)
  .description(`List greetings with filtering (locale, name, q) and pagination (limit, offset, order)`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/greetings`;
        const _payload: RequestParams = {};
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
registerPromptSpecs(greetings.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Who to greet", type: "string", required: true },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "BCP-47 locale", type: "string", required: false, default: "en" },
];
greetings
  .command(`create`)
  .description(`Create a greeting and return the rendered message`)
  .option(`--name <name>`, `Who to greet`)
  .option(`--locale <locale>`, `BCP-47 locale`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, locale } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/greetings`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
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
registerPromptSpecs(greetings.commands.at(-1)!, createSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/greetings", hasLimit: false } },
];
greetings
  .command(`delete`)
  .description(`Delete a greeting by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`greetings delete`);
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
registerPromptSpecs(greetings.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/greetings", hasLimit: false } },
];
greetings
  .command(`get`)
  .description(`Read a single greeting by id`)
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
registerPromptSpecs(greetings.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/greetings", hasLimit: false } },
  { key: "locale", option: "--locale <locale>", name: "locale", type: "string", required: false },
  { key: "message", option: "--message <message>", name: "message", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
];
greetings
  .command(`update`)
  .description(`Update a greeting by id`)
  .option(`--id <id>`, ``)
  .option(`--locale <locale>`, ``)
  .option(`--message <message>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, locale, message, metadata, name } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/greetings/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (message !== undefined) {
          _payload[`message`] = message;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
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
registerPromptSpecs(greetings.commands.at(-1)!, updateSpecs, { method: "put" });
