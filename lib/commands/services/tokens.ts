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
} from "../../interactive.js";

export const tokens = new Command("tokens")
  .description(
    commandDescriptions["tokens"] ??
      `Short-lived file access tokens.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

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
  .action(
    actionRunner(
      async (_options, _command) => {
        const { bucketId, fileId, queries, total } = await promptForMissing(
          _options,
          [
            { key: "bucketId", option: "--bucket-id <bucket-id>", name: "bucketId", description: "Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).", type: "string", required: true },
            { key: "fileId", option: "--file-id <file-id>", name: "fileId", description: "File unique ID.", type: "string", required: true },
          ],
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
          [
            { key: "bucketId", option: "--bucket-id <bucket-id>", name: "bucketId", description: "Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).", type: "string", required: true },
            { key: "fileId", option: "--file-id <file-id>", name: "fileId", description: "File unique ID.", type: "string", required: true },
          ],
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
tokens
  .command(`delete`)
  .description(`Delete a token by its unique ID.`)
  .option(`--token-id <token-id>`, `Token ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { tokenId } = await promptForMissing(
          _options,
          [
            { key: "tokenId", option: "--token-id <token-id>", name: "tokenId", description: "Token ID.", type: "string", required: true, secret: true },
          ],
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
tokens
  .command(`get`)
  .description(`Get a token by its unique ID.`)
  .option(`--token-id <token-id>`, `Token ID.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { tokenId } = await promptForMissing(
          _options,
          [
            { key: "tokenId", option: "--token-id <token-id>", name: "tokenId", description: "Token ID.", type: "string", required: true, secret: true },
          ],
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
          [
            { key: "tokenId", option: "--token-id <token-id>", name: "tokenId", description: "Token unique ID.", type: "string", required: true, secret: true },
          ],
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
