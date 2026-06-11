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

export const storage = new Command("storage")
  .description(commandDescriptions["storage"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

storage
  .command(`storage-list-buckets`)
  .description(`Get a list of all the storage buckets. You can use the query params to filter your results.`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: enabled, name, fileSecurity, maximumFileSize, encryption, antivirus, transformations`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ queries, search, total }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets`;
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (search !== undefined) {
          _payload[`search`] = search;
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
storage
  .command(`storage-create-bucket`)
  .description(`Create a new storage bucket.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Unique Id. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .requiredOption(`--name <name>`, `Bucket name`)
  .option(`--allowed-file-extensions [allowed-file-extensions...]`, `Allowed file extensions. Maximum of 100 extensions are allowed, each 64 characters long.`)
  .option(
    `--antivirus [value]`,
    `Is virus scanning enabled? For file size above 20MB AntiVirus scanning is skipped even if it's enabled`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--compression <compression>`, `Compression algorithm chosen for compression. Can be one of none,  [gzip](https://en.wikipedia.org/wiki/Gzip), or [zstd](https://en.wikipedia.org/wiki/Zstd), For file size above 20MB compression is skipped even if it's enabled`)
  .option(
    `--enabled [value]`,
    `Is bucket enabled? When set to 'disabled', users cannot access the files in this bucket but Server SDKs with and API key can still access the bucket. No files are lost when this is toggled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--encryption [value]`,
    `Is encryption enabled? For file size above 20MB encryption is skipped even if it's enabled`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--file-security [value]`,
    `Enables configuring permissions for individual file. A user needs one of file or bucket level permissions to access a file. [Learn more about permissions](https://appwrite.io/docs/permissions).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--maximum-file-size <maximum-file-size>`, `Maximum file size allowed in bytes. Maximum allowed value is 30MB.`, parseInteger)
  .option(`--permissions [permissions...]`, `An array of permission strings. By default, no user is granted with any permissions. [Learn more about permissions](https://appwrite.io/docs/permissions).`)
  .option(
    `--transformations [value]`,
    `Are image transformations enabled?`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ bucketId, name, allowedFileExtensions, antivirus, compression, enabled, encryption, fileSecurity, maximumFileSize, permissions, transformations }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets`;
        const _payload: RequestParams = {};
        if (allowedFileExtensions !== undefined) {
          _payload[`allowedFileExtensions`] = allowedFileExtensions;
        }
        if (antivirus !== undefined) {
          _payload[`antivirus`] = antivirus;
        }
        if (bucketId !== undefined) {
          _payload[`bucketId`] = bucketId;
        }
        if (compression !== undefined) {
          _payload[`compression`] = compression;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (encryption !== undefined) {
          _payload[`encryption`] = encryption;
        }
        if (fileSecurity !== undefined) {
          _payload[`fileSecurity`] = fileSecurity;
        }
        if (maximumFileSize !== undefined) {
          _payload[`maximumFileSize`] = maximumFileSize;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (permissions !== undefined) {
          _payload[`permissions`] = permissions;
        }
        if (transformations !== undefined) {
          _payload[`transformations`] = transformations;
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
storage
  .command(`storage-delete-bucket`)
  .description(`Delete a storage bucket by its unique ID.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Bucket unique ID.`)
  .action(
    actionRunner(
      async ({ bucketId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}`.replace(`{bucketId}`, bucketId);
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
storage
  .command(`storage-get-bucket`)
  .description(`Get a storage bucket by its unique ID. This endpoint response returns a JSON object with the storage bucket metadata.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Bucket unique ID.`)
  .action(
    actionRunner(
      async ({ bucketId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}`.replace(`{bucketId}`, bucketId);
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
storage
  .command(`storage-update-bucket`)
  .description(`Update a storage bucket by its unique ID.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Bucket unique ID.`)
  .requiredOption(`--name <name>`, `Bucket name`)
  .option(`--allowed-file-extensions [allowed-file-extensions...]`, `Allowed file extensions. Maximum of 100 extensions are allowed, each 64 characters long.`)
  .option(
    `--antivirus [value]`,
    `Is virus scanning enabled? For file size above 20MB AntiVirus scanning is skipped even if it's enabled`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--compression <compression>`, `Compression algorithm chosen for compression. Can be one of none, [gzip](https://en.wikipedia.org/wiki/Gzip), or [zstd](https://en.wikipedia.org/wiki/Zstd), For file size above 20MB compression is skipped even if it's enabled`)
  .option(
    `--enabled [value]`,
    `Is bucket enabled? When set to 'disabled', users cannot access the files in this bucket but Server SDKs with and API key can still access the bucket. No files are lost when this is toggled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--encryption [value]`,
    `Is encryption enabled? For file size above 20MB encryption is skipped even if it's enabled`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--file-security [value]`,
    `Enables configuring permissions for individual file. A user needs one of file or bucket level permissions to access a file. [Learn more about permissions](https://appwrite.io/docs/permissions).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--maximum-file-size <maximum-file-size>`, `Maximum file size allowed in bytes. Maximum allowed value is 30MB.`, parseInteger)
  .option(`--permissions [permissions...]`, `An array of permission strings. By default, the current permissions are inherited. [Learn more about permissions](https://appwrite.io/docs/permissions).`)
  .option(
    `--transformations [value]`,
    `Are image transformations enabled?`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ bucketId, name, allowedFileExtensions, antivirus, compression, enabled, encryption, fileSecurity, maximumFileSize, permissions, transformations }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}`.replace(`{bucketId}`, bucketId);
        const _payload: RequestParams = {};
        if (allowedFileExtensions !== undefined) {
          _payload[`allowedFileExtensions`] = allowedFileExtensions;
        }
        if (antivirus !== undefined) {
          _payload[`antivirus`] = antivirus;
        }
        if (compression !== undefined) {
          _payload[`compression`] = compression;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (encryption !== undefined) {
          _payload[`encryption`] = encryption;
        }
        if (fileSecurity !== undefined) {
          _payload[`fileSecurity`] = fileSecurity;
        }
        if (maximumFileSize !== undefined) {
          _payload[`maximumFileSize`] = maximumFileSize;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (permissions !== undefined) {
          _payload[`permissions`] = permissions;
        }
        if (transformations !== undefined) {
          _payload[`transformations`] = transformations;
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
storage
  .command(`storage-list-files`)
  .description(`Get a list of all the user files. You can use the query params to filter your results.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .option(`--queries [queries...]`, `Array of query strings generated using the Query class provided by the SDK. [Learn more about queries](https://appwrite.io/docs/queries). Maximum of 100 queries are allowed, each 4096 characters long. You may filter on the following attributes: name, signature, mimeType, sizeOriginal, chunksTotal, chunksUploaded`)
  .option(`--search <search>`, `Search term to filter your list results. Max length: 256 chars.`)
  .option(
    `--total [value]`,
    `When set to false, the total count returned will be 0 and will not be calculated.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ bucketId, queries, search, total }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}/files`.replace(`{bucketId}`, bucketId);
        const _payload: RequestParams = {};
        if (queries !== undefined) {
          _payload[`queries`] = queries;
        }
        if (search !== undefined) {
          _payload[`search`] = search;
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
storage
  .command(`storage-create-file`)
  .description(`Create a new file. Before using this route, you should create a new bucket resource using either a [server integration](https://app.revenexx.com/docs/server/storage#storageCreateBucket) API or directly from your Revenexx console.

Larger files should be uploaded using multiple requests with the [content-range](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range) header to send a partial request with a maximum supported chunk of \`5MB\`. The \`content-range\` header values should always be in bytes.

When the first request is sent, the server will return the **File** object, and the subsequent part request must include the file's **id** in \`x-revenexx-id\` header to allow the server to know that the partial upload is for the existing file and not for a new one.

If you're creating a new file using one of the Revenexx SDKs, all the chunking logic will be managed by the SDK internally.
`)
  .requiredOption(`--bucket-id <bucket-id>`, `Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .requiredOption(`--file <file>`, `Binary file. Appwrite SDKs provide helpers to handle file input. [Learn about file input](https://appwrite.io/docs/products/storage/upload-download#input-file).`)
  .requiredOption(`--file-id <file-id>`, `File ID. Choose a custom ID or generate a random ID with \`ID.unique()\`. Valid chars are a-z, A-Z, 0-9, period, hyphen, and underscore. Can't start with a special char. Max length is 36 chars.`)
  .option(`--permissions [permissions...]`, `An array of permission strings. By default, only the current user is granted all permissions. [Learn more about permissions](https://appwrite.io/docs/permissions).`)
  .action(
    actionRunner(
      async ({ bucketId, file, fileId, permissions }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}/files`.replace(`{bucketId}`, bucketId);
        const _payload: RequestParams = {};
        if (file !== undefined) {
          _payload[`file`] = file;
        }
        if (fileId !== undefined) {
          _payload[`fileId`] = fileId;
        }
        if (permissions !== undefined) {
          _payload[`permissions`] = permissions;
        }
        const _headers: Record<string, string> = {
          "content-type": "multipart/form-data",
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
storage
  .command(`storage-delete-file`)
  .description(`Delete a file by its unique ID. Only users with write permissions have access to delete this resource.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .requiredOption(`--file-id <file-id>`, `File ID.`)
  .action(
    actionRunner(
      async ({ bucketId, fileId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}/files/{fileId}`.replace(`{bucketId}`, bucketId).replace(`{fileId}`, fileId);
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
storage
  .command(`storage-get-file`)
  .description(`Get a file by its unique ID. This endpoint response returns a JSON object with the file metadata.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .requiredOption(`--file-id <file-id>`, `File ID.`)
  .action(
    actionRunner(
      async ({ bucketId, fileId }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}/files/{fileId}`.replace(`{bucketId}`, bucketId).replace(`{fileId}`, fileId);
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
storage
  .command(`storage-update-file`)
  .description(`Update a file by its unique ID. Only users with write permissions have access to update this resource.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Bucket unique ID.`)
  .requiredOption(`--file-id <file-id>`, `File ID.`)
  .option(`--name <name>`, `File name.`)
  .option(`--permissions [permissions...]`, `An array of permission strings. By default, the current permissions are inherited. [Learn more about permissions](https://appwrite.io/docs/permissions).`)
  .action(
    actionRunner(
      async ({ bucketId, fileId, name, permissions }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}/files/{fileId}`.replace(`{bucketId}`, bucketId).replace(`{fileId}`, fileId);
        const _payload: RequestParams = {};
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (permissions !== undefined) {
          _payload[`permissions`] = permissions;
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
storage
  .command(`storage-get-file-download`)
  .description(`Get a file content by its unique ID. The endpoint response return with a 'Content-Disposition: attachment' header that tells the browser to start downloading the file to user downloads directory.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Storage bucket ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .requiredOption(`--file-id <file-id>`, `File ID.`)
  .option(`--token <token>`, `File token for accessing this file.`)
  .action(
    actionRunner(
      async ({ bucketId, fileId, token }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}/files/{fileId}/download`.replace(`{bucketId}`, bucketId).replace(`{fileId}`, fileId);
        const _payload: RequestParams = {};
        if (token !== undefined) {
          _payload[`token`] = token;
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
storage
  .command(`storage-get-file-preview`)
  .description(`Get a file preview image. Currently, this method supports preview for image files (jpg, png, and gif), other supported formats, like pdf, docs, slides, and spreadsheets, will return the file icon image. You can also pass query string arguments for cutting and resizing your preview image. Preview is supported only for image files smaller than 10MB.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .requiredOption(`--file-id <file-id>`, `File ID`)
  .option(`--width <width>`, `Resize preview image width, Pass an integer between 0 to 4000.`, parseInteger)
  .option(`--height <height>`, `Resize preview image height, Pass an integer between 0 to 4000.`, parseInteger)
  .option(`--gravity <gravity>`, `Image crop gravity. Can be one of center,top-left,top,top-right,left,right,bottom-left,bottom,bottom-right`)
  .option(`--quality <quality>`, `Preview image quality. Pass an integer between 0 to 100. Defaults to keep existing image quality.`, parseInteger)
  .option(`--border-width <border-width>`, `Preview image border in pixels. Pass an integer between 0 to 100. Defaults to 0.`, parseInteger)
  .option(`--border-color <border-color>`, `Preview image border color. Use a valid HEX color, no # is needed for prefix.`)
  .option(`--border-radius <border-radius>`, `Preview image border radius in pixels. Pass an integer between 0 to 4000.`, parseInteger)
  .option(`--opacity <opacity>`, `Preview image opacity. Only works with images having an alpha channel (like png). Pass a number between 0 to 1.`, parseInteger)
  .option(`--rotation <rotation>`, `Preview image rotation in degrees. Pass an integer between -360 and 360.`, parseInteger)
  .option(`--background <background>`, `Preview image background color. Only works with transparent images (png). Use a valid HEX color, no # is needed for prefix.`)
  .option(`--output <output>`, `Output format type (jpeg, jpg, png, gif and webp).`)
  .option(`--token <token>`, `File token for accessing this file.`)
  .action(
    actionRunner(
      async ({ bucketId, fileId, width, height, gravity, quality, borderWidth, borderColor, borderRadius, opacity, rotation, background, output, token }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}/files/{fileId}/preview`.replace(`{bucketId}`, bucketId).replace(`{fileId}`, fileId);
        const _payload: RequestParams = {};
        if (width !== undefined) {
          _payload[`width`] = width;
        }
        if (height !== undefined) {
          _payload[`height`] = height;
        }
        if (gravity !== undefined) {
          _payload[`gravity`] = gravity;
        }
        if (quality !== undefined) {
          _payload[`quality`] = quality;
        }
        if (borderWidth !== undefined) {
          _payload[`borderWidth`] = borderWidth;
        }
        if (borderColor !== undefined) {
          _payload[`borderColor`] = borderColor;
        }
        if (borderRadius !== undefined) {
          _payload[`borderRadius`] = borderRadius;
        }
        if (opacity !== undefined) {
          _payload[`opacity`] = opacity;
        }
        if (rotation !== undefined) {
          _payload[`rotation`] = rotation;
        }
        if (background !== undefined) {
          _payload[`background`] = background;
        }
        if (output !== undefined) {
          _payload[`output`] = output;
        }
        if (token !== undefined) {
          _payload[`token`] = token;
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
storage
  .command(`storage-get-file-view`)
  .description(`Get a file content by its unique ID. This endpoint is similar to the download method but returns with no  'Content-Disposition: attachment' header.`)
  .requiredOption(`--bucket-id <bucket-id>`, `Storage bucket unique ID. You can create a new storage bucket using the Storage service [server integration](https://appwrite.io/docs/server/storage#createBucket).`)
  .requiredOption(`--file-id <file-id>`, `File ID.`)
  .option(`--token <token>`, `File token for accessing this file.`)
  .action(
    actionRunner(
      async ({ bucketId, fileId, token }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/buckets/{bucketId}/files/{fileId}/view`.replace(`{bucketId}`, bucketId).replace(`{fileId}`, fileId);
        const _payload: RequestParams = {};
        if (token !== undefined) {
          _payload[`token`] = token;
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
