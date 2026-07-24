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
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const tokens = new Command("tokens")
  .description(
    commandDescriptions["tokens"] ??
      `Short-lived file access tokens.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "bucketId", option: "--bucket-id <bucket-id>", name: "bucketId", description: "Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).", type: "string", required: true },
  { key: "fileId", option: "--file-id <file-id>", name: "fileId", description: "File unique ID.", type: "string", required: true },
  { key: "queries", option: "--queries [queries...]", name: "queries", description: "Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: expire", type: "array", required: false },
  { key: "total", option: "--total <total>", name: "total", description: "When set to false, the total count returned will be 0 and will not be calculated.", type: "boolean", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
tokens
  .command(`list`)
  .description(`List all the tokens created for a specific file or bucket. You can use the query params to filter your results.`)
  .option(`--bucket-id <bucket-id>`, `Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .option(`--file-id <file-id>`, `File unique ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: expire`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { bucketId, fileId, queries, total, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tokens/buckets/{bucketId}/files/{fileId}`.replace(`{bucketId}`, bucketId).replace(`{fileId}`, fileId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (total !== undefined) {
          _payload[`total`] = total;
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
registerPromptSpecs(tokens.commands.at(-1)!, listSpecs, { method: "get" });
const createFileTokenSpecs: PromptSpec[] = [
  { key: "bucketId", option: "--bucket-id <bucket-id>", name: "bucketId", description: "Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).", type: "string", required: true },
  { key: "fileId", option: "--file-id <file-id>", name: "fileId", description: "File unique ID.", type: "string", required: true },
  { key: "expire", option: "--expire <expire>", name: "expire", description: "Token expiry date", type: "string", required: false },
];
tokens
  .command(`create-file-token`)
  .description(`Create a new token. A token is linked to a file. Token can be passed as a request URL search parameter.`)
  .option(`--bucket-id <bucket-id>`, `Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .option(`--file-id <file-id>`, `File unique ID.`)
  .option(`--expire <expire>`, `Token expiry date`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { bucketId, fileId, expire } = await promptForMissing(
          _options,
          createFileTokenSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tokens/buckets/{bucketId}/files/{fileId}`.replace(`{bucketId}`, bucketId).replace(`{fileId}`, fileId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (expire !== undefined) {
          _payload[`expire`] = expire;
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
registerPromptSpecs(tokens.commands.at(-1)!, createFileTokenSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "tokenId", option: "--token-id <token-id>", name: "tokenId", description: "Token ID.", type: "string", required: true, secret: true },
];
tokens
  .command(`delete`)
  .description(`Delete a token by its unique ID.`)
  .option(`--token-id <token-id>`, `Token ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { tokenId } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`tokens delete`);
        const _client = await sdkForProject();
        const _apiPath = `/tokens/{tokenId}`.replace(`{tokenId}`, tokenId);
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
registerPromptSpecs(tokens.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "tokenId", option: "--token-id <token-id>", name: "tokenId", description: "Token ID.", type: "string", required: true, secret: true },
];
tokens
  .command(`get`)
  .description(`Get a token by its unique ID.`)
  .option(`--token-id <token-id>`, `Token ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { tokenId } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tokens/{tokenId}`.replace(`{tokenId}`, tokenId);
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
registerPromptSpecs(tokens.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "tokenId", option: "--token-id <token-id>", name: "tokenId", description: "Token unique ID.", type: "string", required: true, secret: true },
  { key: "expire", option: "--expire <expire>", name: "expire", description: "File token expiry date", type: "string", required: false },
];
tokens
  .command(`update`)
  .description(`Update a token by its unique ID. Use this endpoint to update a token's expiry date.`)
  .option(`--token-id <token-id>`, `Token unique ID.`)
  .option(`--expire <expire>`, `File token expiry date`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { tokenId, expire } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/tokens/{tokenId}`.replace(`{tokenId}`, tokenId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (expire !== undefined) {
          _payload[`expire`] = expire;
        }
        const _headers: Record<string, string> = {
          "content-type": "application/json",
        };
        const _response = await _client.call(
          `patch`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(tokens.commands.at(-1)!, updateSpecs, { method: "patch" });
