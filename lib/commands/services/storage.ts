import { Command } from "commander";
import { resolveFileParam } from "../utils/deployment.js";
import { resolveBodyParam } from "../../utils.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  cliConfig,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
  type PromptSpec,
  registerPromptSpecs,
} from "../../interactive.js";

export const storage = new Command("storage")
  .description(
    commandDescriptions["storage"] ??
      `Media storage: assets, folders, quotas (revenexx storage service).`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const assetIndexSpecs: PromptSpec[] = [
  { key: "search", option: "--search <search>", name: "search", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
storage
  .command(`asset-index`)
  .description(`List the media assets in this tenant, newest first. Narrow the list with
\`filter[folder_id]\`, \`filter[kind]\`, \`filter[status]\` and a
\`filter[created_at][gte]\`/\`[lte]\` range; search original names, display
names, alt text and descriptions with \`search\`; order by \`created_at\`,
\`size_bytes\` or \`original_name\` (prefix with \`-\` to reverse). One page is
returned, 50 records by default and 200 at most.

Records only: no file content is returned — fetch bytes with
\`GET /assets/{id}/download\` or hand out a link with
\`POST /assets/{id}/sign\`. Deleted assets are not listed.`)
  .option(`--search <search>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { search, filter } = await promptForMissing(
          _options,
          assetIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets`;
        const _payload: RequestParams = {};
        if (search !== undefined) {
          _payload[`search`] = search;
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
registerPromptSpecs(storage.commands.at(-1)!, assetIndexSpecs, { method: "get" });
const assetStoreSpecs: PromptSpec[] = [
  { key: "file", option: "--file <file>", name: "file", type: "file", required: true },
  { key: "altText", option: "--alt-text <alt-text>", name: "alt_text", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "displayName", option: "--display-name <display-name>", name: "display_name", type: "string", required: false },
  { key: "folderId", option: "--folder-id <folder-id>", name: "folder_id", type: "string", required: false },
  { key: "keepArchive", option: "--keep-archive <keep-archive>", name: "keep_archive", type: "boolean", required: false },
  { key: "tags", option: "--tags [tags...]", name: "tags", type: "array", required: false },
  { key: "unpack", option: "--unpack <unpack>", name: "unpack", description: "Archives only: unpack the members after upload (see AssetController).", type: "boolean", required: false },
  { key: "visibility", option: "--visibility <visibility>", name: "visibility", type: "string", required: false, enum: ["public","private"] },
];
storage
  .command(`asset-store`)
  .description(`Upload one file into this tenant's media library. The file is checked
against the tenant's single-file limit and its remaining storage quota,
its media type is sniffed from the content rather than trusted from the
request, and it is virus-scanned before anything is written. The stored
asset comes back with status \`pending_processing\`; metadata extraction
finishes asynchronously and moves it to \`available\`. \`folder_id\`,
\`visibility\`, \`alt_text\`, \`description\`, \`display_name\` and \`tags\` are
applied on the way in; set \`unpack\` to also queue an uploaded archive's
members for ingestion.

Every call creates a new asset — this never replaces the content of an
existing one — and it takes exactly one file. Use \`POST /assets/bulk\` for
several.`)
  .option(`--file <file>`, ``)
  .option(`--alt-text <alt-text>`, ``)
  .option(`--description <description>`, ``)
  .option(`--display-name <display-name>`, ``)
  .option(`--folder-id <folder-id>`, ``)
  .option(
    `--keep-archive [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--tags [tags...]`, ``)
  .option(
    `--unpack [value]`,
    `Archives only: unpack the members after upload (see AssetController).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--visibility <visibility>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { file, altText, description, displayName, folderId, keepArchive, tags, unpack, visibility } = await promptForMissing(
          _options,
          assetStoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (altText !== undefined) {
          _payload[`alt_text`] = altText;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (displayName !== undefined) {
          _payload[`display_name`] = displayName;
        }
        if (file !== undefined) {
          _payload[`file`] = file !== undefined ? await resolveFileParam(file) : undefined;
        }
        if (folderId !== undefined) {
          _payload[`folder_id`] = folderId;
        }
        if (keepArchive !== undefined) {
          _payload[`keep_archive`] = keepArchive;
        }
        if (tags !== undefined) {
          _payload[`tags`] = tags;
        }
        if (unpack !== undefined) {
          _payload[`unpack`] = unpack;
        }
        if (visibility !== undefined) {
          _payload[`visibility`] = visibility;
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
registerPromptSpecs(storage.commands.at(-1)!, assetStoreSpecs, { method: "post" });
const assetBulkSpecs: PromptSpec[] = [
  { key: "folderId", option: "--folder-id <folder-id>", name: "folder_id", type: "string", required: false },
  { key: "visibility", option: "--visibility <visibility>", name: "visibility", type: "string", required: false },
];
storage
  .command(`asset-bulk`)
  .description(`Upload a batch of files in one request under \`files\`, each ingested
exactly as \`POST /assets\` ingests a single file. The batch is rejected as
a whole when it carries no files, more files than one request may carry,
or too many bytes in total. Past that point every file is attempted
independently and the call answers 207 with a \`results\` entry per file:
either the created asset or the error that rejected it. A partial failure
is therefore a successful call, not an error status — read \`results\`.

Only \`folder_id\` and \`visibility\` apply, and they apply to the whole
batch; per-file metadata is not accepted here. Set it afterwards with
\`PATCH /assets/{id}\`.`)
  .option(`--folder-id <folder-id>`, ``)
  .option(`--visibility <visibility>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { folderId, visibility } = await promptForMissing(
          _options,
          assetBulkSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/bulk`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (folderId !== undefined) {
          _payload[`folder_id`] = folderId;
        }
        if (visibility !== undefined) {
          _payload[`visibility`] = visibility;
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
registerPromptSpecs(storage.commands.at(-1)!, assetBulkSpecs, { method: "post" });
const assetDestroySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false, search: true } },
];
storage
  .command(`asset-destroy`)
  .description(`Soft-delete an asset: it stops being listed and served, its status
becomes \`soft_deleted\`, and it is scheduled for permanent deletion once
the retention window has passed. Until then \`POST /assets/{id}/restore\`
brings it back.

The stored file is not erased at this point and its bytes still count
against the tenant's storage quota — use \`DELETE /assets/{id}/permanent\`
to erase it and free the quota immediately.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          assetDestroySpecs,
          _command,
        );
        await confirmDestructive(`storage asset-destroy`);
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(storage.commands.at(-1)!, assetDestroySpecs, { method: "delete", destructive: true });
const assetShowSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false, search: true } },
];
storage
  .command(`asset-show`)
  .description(`Fetch one asset's record by id: name, folder, media type, size, status,
tags, the extracted metadata and the delivery URL (null for a private
asset, which is reachable only through a signed URL). Metadata only — the
bytes are served by \`GET /assets/{id}/download\`. A deleted asset is not
visible here until \`POST /assets/{id}/restore\` brings it back.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          assetShowSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(storage.commands.at(-1)!, assetShowSpecs, { method: "get" });
const assetUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false, search: true } },
  { key: "altText", option: "--alt-text <alt-text>", name: "alt_text", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "displayName", option: "--display-name <display-name>", name: "display_name", type: "string", required: false },
  { key: "folderId", option: "--folder-id <folder-id>", name: "folder_id", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "tags", option: "--tags [tags...]", name: "tags", type: "array", required: false },
  { key: "visibility", option: "--visibility <visibility>", name: "visibility", type: "string", required: false, enum: ["public","private"] },
];
storage
  .command(`asset-update`)
  .description(`Change an asset's metadata: \`display_name\`, \`alt_text\`, \`description\`,
\`visibility\` and \`tags\`. Sending \`folder_id\` moves it and sending \`name\`
renames it; either re-derives the asset's public delivery path, so links
built from the old path stop resolving. Only the fields present in the
request are touched.

The stored file itself is never modified here — to change the content,
upload a new asset.`)
  .option(`--id <id>`, ``)
  .option(`--alt-text <alt-text>`, ``)
  .option(`--description <description>`, ``)
  .option(`--display-name <display-name>`, ``)
  .option(`--folder-id <folder-id>`, ``)
  .option(`--name <name>`, ``)
  .option(`--tags [tags...]`, ``)
  .option(`--visibility <visibility>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, altText, description, displayName, folderId, name, tags, visibility } = await promptForMissing(
          _options,
          assetUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (altText !== undefined) {
          _payload[`alt_text`] = altText;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (displayName !== undefined) {
          _payload[`display_name`] = displayName;
        }
        if (folderId !== undefined) {
          _payload[`folder_id`] = folderId;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (tags !== undefined) {
          _payload[`tags`] = tags;
        }
        if (visibility !== undefined) {
          _payload[`visibility`] = visibility;
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
registerPromptSpecs(storage.commands.at(-1)!, assetUpdateSpecs, { method: "patch" });
const assetDownloadSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false, search: true } },
];
storage
  .command(`asset-download`)
  .description(`Stream the asset's original file back as an attachment, named after the
asset. This is the authenticated read path — every call carries the
caller's credentials — and the bytes are the ones that were uploaded: no
resizing, re-encoding or other transformation is applied.

To let a browser, an email or a third party fetch the file without an API
credential, mint a link with \`POST /assets/{id}/sign\` instead.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          assetDownloadSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}/download`.replace(`{id}`, id);
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
registerPromptSpecs(storage.commands.at(-1)!, assetDownloadSpecs, { method: "get" });
const assetPermanentSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false, search: true } },
];
storage
  .command(`asset-permanent`)
  .description(`Erase an asset and its stored file for good and credit its bytes back to
the tenant's used storage. Works on live and soft-deleted assets alike.

This cannot be undone: there is no restore afterwards, and links to the
asset stop resolving at once. Use \`DELETE /assets/{id}\` for the
reversible variant. Requires the elevated (admin) tier.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          assetPermanentSpecs,
          _command,
        );
        await confirmDestructive(`storage asset-permanent`);
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}/permanent`.replace(`{id}`, id);
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
registerPromptSpecs(storage.commands.at(-1)!, assetPermanentSpecs, { method: "delete", destructive: true });
const assetReprocessSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false, search: true } },
];
storage
  .command(`asset-reprocess`)
  .description(`Re-run post-upload processing for one asset. It returns to
\`pending_processing\` and the job re-extracts its metadata — and, for a 3D
model, re-renders the preview and mesh derivatives — before marking it
\`available\` again. The usual reason is an asset stuck in
\`processing_failed\`.

The stored file is neither re-uploaded nor altered, and no thumbnails are
produced: delivery transforms are applied on the fly when the asset is
served, not here.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          assetReprocessSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}/reprocess`.replace(`{id}`, id);
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
registerPromptSpecs(storage.commands.at(-1)!, assetReprocessSpecs, { method: "post" });
const assetRestoreSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false, search: true } },
];
storage
  .command(`asset-restore`)
  .description(`Bring a soft-deleted asset back: the scheduled permanent deletion is
cleared and the asset returns to \`available\`, listed and served again
under its original path. Only works while the asset is still inside its
retention window — once it has been erased, by
\`DELETE /assets/{id}/permanent\` or by the retention sweep, there is
nothing left to restore.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          assetRestoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}/restore`.replace(`{id}`, id);
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
registerPromptSpecs(storage.commands.at(-1)!, assetRestoreSpecs, { method: "post" });
const assetSignSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false, search: true } },
  { key: "ttlSeconds", option: "--ttl-seconds <ttl-seconds>", name: "ttl_seconds", type: "integer", required: false },
];
storage
  .command(`asset-sign`)
  .description(`Mint a time-limited URL that serves this asset without an API credential
— the way to hand a private asset to a browser, an email or a third
party. \`ttl_seconds\` sets the lifetime: one hour by default, seven days
at most. The response carries the URL and the lifetime it was issued
with.

The signature is checked at the delivery edge. A link cannot be revoked
before it expires, so keep the lifetime short. A public asset already
carries an unsigned delivery URL on its record and does not need this.`)
  .option(`--id <id>`, ``)
  .option(`--ttl-seconds <ttl-seconds>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, ttlSeconds } = await promptForMissing(
          _options,
          assetSignSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}/sign`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (ttlSeconds !== undefined) {
          _payload[`ttl_seconds`] = ttlSeconds;
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
registerPromptSpecs(storage.commands.at(-1)!, assetSignSpecs, { method: "post" });
const assetUnpackSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false, search: true } },
  { key: "keepArchive", option: "--keep-archive <keep-archive>", name: "keep_archive", type: "boolean", required: false },
  { key: "targetFolderId", option: "--target-folder-id <target-folder-id>", name: "target_folder_id", type: "string", required: false },
];
storage
  .command(`asset-unpack`)
  .description(`Ingest the members of an already-uploaded archive as individual assets.
They land in a folder named after the archive, created under
\`target_folder_id\` or, when that is omitted, under the archive's own
folder, and the archive's internal directory structure is mirrored
beneath it. Each member goes through the same pipeline as an upload —
media-type sniff, virus scan, quota — and a member that fails is skipped
rather than failing the run. \`keep_archive\` (true by default) decides
whether the archive asset itself survives.

Asynchronous: this answers 202 as soon as the work is queued, so poll the
folder or asset list for the results. Only an asset that is an archive of
a supported type can be unpacked; an upload can ask for the same thing
inline with \`unpack\`.`)
  .option(`--id <id>`, ``)
  .option(
    `--keep-archive [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--target-folder-id <target-folder-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, keepArchive, targetFolderId } = await promptForMissing(
          _options,
          assetUnpackSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}/unpack`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (keepArchive !== undefined) {
          _payload[`keep_archive`] = keepArchive;
        }
        if (targetFolderId !== undefined) {
          _payload[`target_folder_id`] = targetFolderId;
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
registerPromptSpecs(storage.commands.at(-1)!, assetUnpackSpecs, { method: "post" });
const folderIndexSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
storage
  .command(`folder-index`)
  .description(`Return every folder in this tenant as one flat list ordered by path, each
record carrying its \`parent_id\` and its materialized \`path\`, so a client
can rebuild the tree without walking it. Not paginated and not filtered.

Folders hold no file content of their own — list a folder's assets with
\`GET /assets\` and \`filter[folder_id]\`.`)
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
          folderIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/folders`;
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
registerPromptSpecs(storage.commands.at(-1)!, folderIndexSpecs, { method: "get" });
const folderStoreSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", type: "string", required: false },
];
storage
  .command(`folder-store`)
  .description(`Create a folder under \`parent_id\`, or at the library root when it is
omitted. The \`name\` is slugged into a path segment and appended to the
parent's path; that path is what the public delivery URL of every asset
inside it is built from, so two siblings may not slug to the same
segment.

Creating a folder moves nothing into it — assign assets with
\`folder_id\` on upload or with \`PATCH /assets/{id}\`.`)
  .option(`--name <name>`, ``)
  .option(`--parent-id <parent-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, parentId } = await promptForMissing(
          _options,
          folderStoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/folders`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
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
registerPromptSpecs(storage.commands.at(-1)!, folderStoreSpecs, { method: "post" });
const folderDestroySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/folders", hasLimit: false } },
  { key: "recursive", option: "--recursive <recursive>", name: "recursive", type: "boolean", required: false, default: "false" },
];
storage
  .command(`folder-destroy`)
  .description(`Delete a folder. By default it has to be empty: a folder that still holds
folders or assets is refused, so pass \`recursive=true\` to delete it
together with everything beneath it.

A recursive delete soft-deletes the assets it takes with it — their files
are not erased and their bytes still count against the tenant's storage
quota, and each remains restorable through \`POST /assets/{id}/restore\`.
System folders cannot be deleted.`)
  .option(`--id <id>`, ``)
  .option(
    `--recursive [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, recursive } = await promptForMissing(
          _options,
          folderDestroySpecs,
          _command,
        );
        await confirmDestructive(`storage folder-destroy`);
        const _client = await sdkForProject();
        const _apiPath = `/storage/folders/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (recursive !== undefined) {
          _payload[`recursive`] = recursive;
        }
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
registerPromptSpecs(storage.commands.at(-1)!, folderDestroySpecs, { method: "delete", destructive: true });
const folderShowSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/folders", hasLimit: false } },
];
storage
  .command(`folder-show`)
  .description(`Fetch one folder's record by id: its name, its parent, the materialized
path assets inside it are delivered under, and whether it is a system
folder (system folders cannot be renamed, moved or deleted).

Its contents are not included — list them with \`GET /assets\` and
\`filter[folder_id]\`, and its child folders with \`GET /folders\`.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          folderShowSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/folders/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(storage.commands.at(-1)!, folderShowSpecs, { method: "get" });
const folderUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/folders", hasLimit: false } },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", type: "string", required: false },
];
storage
  .command(`folder-update`)
  .description(`Rename a folder with \`name\`, move it under a different parent with
\`parent_id\` (null for the root), or both at once. Either rewrites the
folder's materialized path and the path of every folder beneath it, which
changes the public delivery URL of every asset they hold — existing links
built from the old path stop resolving.

Nothing else about the assets changes; they are not moved, re-uploaded or
reprocessed. A system folder cannot be changed, a folder cannot be moved
inside its own subtree, and the new name has to slug to a segment free
among its new siblings.`)
  .option(`--id <id>`, ``)
  .option(`--name <name>`, ``)
  .option(`--parent-id <parent-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, name, parentId } = await promptForMissing(
          _options,
          folderUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/folders/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
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
registerPromptSpecs(storage.commands.at(-1)!, folderUpdateSpecs, { method: "patch" });
const syncRuleIndexSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
storage
  .command(`sync-rule-index`)
  .description(`Return this tenant's SFTP sync rules, newest first, each with the account
and remote path it pulls from, the folder it imports into, its cron
schedule, whether it is enabled and when it last ran. Not paginated and
not filtered.

These are the rules themselves, not what they moved: for the files a rule
has actually transferred, see \`GET /sftp/sync-history\`.`)
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
          syncRuleIndexSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/rules`;
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
registerPromptSpecs(storage.commands.at(-1)!, syncRuleIndexSpecs, { method: "get" });
const syncRuleStoreSpecs: PromptSpec[] = [
  { key: "sftpAccountId", option: "--sftp-account-id <sftp-account-id>", name: "sftp_account_id", type: "string", required: true },
  { key: "sourcePath", option: "--source-path <source-path>", name: "source_path", type: "string", required: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "options", option: "--options [options...]", name: "options", type: "array", required: false },
  { key: "schedule", option: "--schedule <schedule>", name: "schedule", type: "string", required: false },
  { key: "targetFolderId", option: "--target-folder-id <target-folder-id>", name: "target_folder_id", type: "string", required: false },
];
storage
  .command(`sync-rule-store`)
  .description(`Schedule a recurring one-way pull from a directory on the tenant's SFTP
storage box into this media library. \`sftp_account_id\` selects the
account, \`source_path\` the remote directory, \`target_folder_id\` the
folder imported assets land in, and \`schedule\` a cron expression (every
five minutes when omitted) at which the rule falls due. \`options\` carries
the per-rule knobs: recursion, include/exclude and size filters, how long
a remote file has to have stopped changing before it is taken, and
whether it is deleted from the remote after a successful transfer.

Each run ingests every matching remote file exactly as an upload would,
quota, media-type and virus checks included, and records one history
entry per file. Creating the rule transfers nothing: the first run
happens when the schedule next falls due, or immediately if you call
\`POST /sftp/rules/{id}/run\`. Nothing is ever pushed back to the remote,
beyond the optional delete after a successful transfer. Requires the
elevated (admin) tier.`)
  .option(`--sftp-account-id <sftp-account-id>`, ``)
  .option(`--source-path <source-path>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--options [options...]`, ``)
  .option(`--schedule <schedule>`, ``)
  .option(`--target-folder-id <target-folder-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { sftpAccountId, sourcePath, enabled, options, schedule, targetFolderId } = await promptForMissing(
          _options,
          syncRuleStoreSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/rules`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (options !== undefined) {
          _payload[`options`] = options;
        }
        if (schedule !== undefined) {
          _payload[`schedule`] = schedule;
        }
        if (sftpAccountId !== undefined) {
          _payload[`sftp_account_id`] = sftpAccountId;
        }
        if (sourcePath !== undefined) {
          _payload[`source_path`] = sourcePath;
        }
        if (targetFolderId !== undefined) {
          _payload[`target_folder_id`] = targetFolderId;
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
registerPromptSpecs(storage.commands.at(-1)!, syncRuleStoreSpecs, { method: "post" });
const syncRuleDestroySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
];
storage
  .command(`sync-rule-destroy`)
  .description(`Delete a sync rule so it is never scheduled again. The assets it already
imported stay exactly where they are, its recorded run history is kept,
and nothing on the remote is touched.

To stop a rule only for a while, set \`enabled\` to false with
\`PATCH /sftp/rules/{id}\` instead — a deleted rule cannot be restored.
Requires the elevated (admin) tier.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          syncRuleDestroySpecs,
          _command,
        );
        await confirmDestructive(`storage sync-rule-destroy`);
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/rules/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(storage.commands.at(-1)!, syncRuleDestroySpecs, { method: "delete", destructive: true });
const syncRuleShowSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
];
storage
  .command(`sync-rule-show`)
  .description(`Fetch one sync rule's configuration by id: the account and remote path it
pulls from, its target folder, its cron schedule, its \`options\` and
\`last_run_at\`.

Configuration only, and \`last_run_at\` says when a run was last attempted,
not whether it succeeded. What a run did is in
\`GET /sftp/rules/{id}/runs/{runId}\` and \`GET /sftp/sync-history\`.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          syncRuleShowSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/rules/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(storage.commands.at(-1)!, syncRuleShowSpecs, { method: "get" });
const syncRuleUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "options", option: "--options [options...]", name: "options", type: "array", required: false },
  { key: "schedule", option: "--schedule <schedule>", name: "schedule", type: "string", required: false },
  { key: "sftpAccountId", option: "--sftp-account-id <sftp-account-id>", name: "sftp_account_id", type: "string", required: false },
  { key: "sourcePath", option: "--source-path <source-path>", name: "source_path", type: "string", required: false },
  { key: "targetFolderId", option: "--target-folder-id <target-folder-id>", name: "target_folder_id", type: "string", required: false },
];
storage
  .command(`sync-rule-update`)
  .description(`Change a sync rule in place: its account, remote path, target folder,
schedule or options, or \`enabled\` to pause and resume it without deleting
it. Only the fields present in the request are touched, but \`options\` is
replaced wholesale rather than merged — send the whole object.

A change takes effect from the next run; a run already in flight is not
affected, and nothing a previous run imported is revisited or undone.
Requires the elevated (admin) tier.`)
  .option(`--id <id>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--options [options...]`, ``)
  .option(`--schedule <schedule>`, ``)
  .option(`--sftp-account-id <sftp-account-id>`, ``)
  .option(`--source-path <source-path>`, ``)
  .option(`--target-folder-id <target-folder-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, enabled, options, schedule, sftpAccountId, sourcePath, targetFolderId } = await promptForMissing(
          _options,
          syncRuleUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/rules/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (options !== undefined) {
          _payload[`options`] = options;
        }
        if (schedule !== undefined) {
          _payload[`schedule`] = schedule;
        }
        if (sftpAccountId !== undefined) {
          _payload[`sftp_account_id`] = sftpAccountId;
        }
        if (sourcePath !== undefined) {
          _payload[`source_path`] = sourcePath;
        }
        if (targetFolderId !== undefined) {
          _payload[`target_folder_id`] = targetFolderId;
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
registerPromptSpecs(storage.commands.at(-1)!, syncRuleUpdateSpecs, { method: "patch" });
const syncRuleRunSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
];
storage
  .command(`sync-rule-run`)
  .description(`Queue a run of this rule straight away, outside its schedule. Answers 202
with the rule id as soon as the job is queued — it does not wait for the
transfer and it does not hand back a run id, so follow the outcome in
\`GET /sftp/sync-history\`.

The rule's own schedule is untouched, and this does not enable a disabled
rule: the job is queued but does nothing when it picks a disabled rule
up. Requires the elevated (admin) tier.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          syncRuleRunSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/rules/{id}/run`.replace(`{id}`, id);
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
registerPromptSpecs(storage.commands.at(-1)!, syncRuleRunSpecs, { method: "post" });
const syncRuleRunProtocolSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
  { key: "runId", option: "--run-id <run-id>", name: "runId", type: "string", required: true },
];
storage
  .command(`sync-rule-run-protocol`)
  .description(`Return the per-file protocol of one run of one sync rule: every entry the
run recorded, oldest first, with the remote source path, the asset it
produced, the bytes transferred, the duration and the error where one
applies — plus a \`summary\` counting those entries by status (\`success\`,
\`skipped\`, \`failed\`, \`quarantined\`).

Use it to find out what one run actually did. It is not paginated, and it
does not list a rule's runs: take the \`run_id\` from
\`GET /sftp/sync-history\`. An unknown \`runId\` under a rule that does exist
is an empty protocol, not a 404.`)
  .option(`--id <id>`, ``)
  .option(`--run-id <run-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, runId } = await promptForMissing(
          _options,
          syncRuleRunProtocolSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/rules/{id}/runs/{runId}`.replace(`{id}`, id).replace(`{runId}`, runId);
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
registerPromptSpecs(storage.commands.at(-1)!, syncRuleRunProtocolSpecs, { method: "get" });
const syncRuleHistorySpecs: PromptSpec[] = [
  { key: "ruleId", option: "--rule-id <rule-id>", name: "rule_id", type: "string", required: false },
  { key: "from", option: "--from <from>", name: "from", description: "Only runs recorded at or after this instant.", type: "string", required: false },
  { key: "to", option: "--to <to>", name: "to", description: "Only runs recorded at or before this instant.", type: "string", required: false },
];
storage
  .command(`sync-rule-history`)
  .description(`Page through this tenant's per-file sync records across every rule,
newest first. Each entry names the run it belongs to, the rule, the
remote source path, the asset it produced where there is one, the
outcome — \`success\`, \`skipped\`, \`failed\` or \`quarantined\` — the bytes
transferred and how long it took. Narrow it with \`rule_id\` and a
\`from\`/\`to\` range on when the entry was recorded; one page is returned,
50 entries by default and 200 at most.

This is the audit trail of what SFTP sync has brought in: every file
taken, skipped and rejected leaves an entry, and a run that matched
nothing leaves one too. To read a single run whole instead, group by
\`run_id\` and call \`GET /sftp/rules/{id}/runs/{runId}\`.`)
  .option(`--rule-id <rule-id>`, ``)
  .option(`--from <from>`, `Only runs recorded at or after this instant.`)
  .option(`--to <to>`, `Only runs recorded at or before this instant.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { ruleId, from, to } = await promptForMissing(
          _options,
          syncRuleHistorySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/sync-history`;
        const _payload: RequestParams = {};
        if (ruleId !== undefined) {
          _payload[`rule_id`] = ruleId;
        }
        if (from !== undefined) {
          _payload[`from`] = from;
        }
        if (to !== undefined) {
          _payload[`to`] = to;
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
registerPromptSpecs(storage.commands.at(-1)!, syncRuleHistorySpecs, { method: "get" });
storage
  .command(`tenant-stats`)
  .description(`Break this tenant's library down by asset kind — \`image\`, \`video\`,
\`audio\`, \`pdf\`, \`document\`, \`archive\`, \`model3d\`, \`other\` — with a count
and a byte total for each kind that has at least one asset, alongside the
tenant-wide totals.

A dashboard figure, not a listing: no asset is named, and nothing here
can be filtered. The tenant-wide byte total is the same running figure
\`GET /tenant/usage\` reports, so soft-deleted assets are counted in it.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/tenant/stats`;
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
  .command(`tenant-usage`)
  .description(`Report this tenant's storage consumption: the bytes in use, the byte
quota in force (null when the tenant is uncapped) and how many assets it
holds. This is the figure the quota check on upload compares against — it
is maintained as a running total on every upload and permanent delete
rather than summed on read.

Soft-deleted assets are still counted, because their files are still
stored; their bytes come back only once they are permanently deleted. For
the breakdown by asset kind, see \`GET /tenant/stats\`.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/tenant/usage`;
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
