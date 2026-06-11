import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
} from "../../parser.js";

export const tokens = new Command("tokens")
  .description(commandDescriptions["tokens"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

tokens
  .command(`tokens-list`)
  .description(`List all the tokens created for a specific file or bucket. You can use the query params to filter your results.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .requiredOption(`--file-id <file-id>`, `File unique ID.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: expire`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ bucketId, fileId, queries, total }) => {
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
  .command(`tokens-create-file-token`)
  .description(`Create a new token. A token is linked to a file. Token can be passed as a request URL search parameter.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .requiredOption(`--file-id <file-id>`, `File unique ID.`)
  .option(`--expire <expire>`, `Token expiry date`)
  .action(
    actionRunner(
      async ({ bucketId, fileId, expire }) => {
        const _client = await sdkForProject();
        const _apiPath = `/tokens/buckets/{bucketId}/files/{fileId}`.replace(`{bucketId}`, bucketId).replace(`{fileId}`, fileId);
        const _payload: RequestParams = {};
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
  .command(`tokens-delete`)
  .description(`Delete a token by its unique ID.`)
  .requiredOption(`--token-id <token-id>`, `Token ID.`)
  .action(
    actionRunner(
      async ({ tokenId }) => {
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
  .command(`tokens-get`)
  .description(`Get a token by its unique ID.`)
  .requiredOption(`--token-id <token-id>`, `Token ID.`)
  .action(
    actionRunner(
      async ({ tokenId }) => {
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
  .command(`tokens-update`)
  .description(`Update a token by its unique ID. Use this endpoint to update a token's expiry date.`)
  .requiredOption(`--token-id <token-id>`, `Token unique ID.`)
  .option(`--expire <expire>`, `File token expiry date`)
  .action(
    actionRunner(
      async ({ tokenId, expire }) => {
        const _client = await sdkForProject();
        const _apiPath = `/tokens/{tokenId}`.replace(`{tokenId}`, tokenId);
        const _payload: RequestParams = {};
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
