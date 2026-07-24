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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(`Unpack an already-uploaded archive: its members are ingested into a folder
named after the archive (mirroring its structure). Asynchronous — poll the
folder/asset list for the results. \`keep_archive\` (default true) controls
whether the archive itself is kept`)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
  .description(``)
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
storage
  .command(`sync-rule-store`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/rules`;
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
const syncRuleDestroySpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
];
storage
  .command(`sync-rule-destroy`)
  .description(``)
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
  .description(``)
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
];
storage
  .command(`sync-rule-update`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          syncRuleUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/rules/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
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
  .description(``)
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
  .description(``)
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
  { key: "from", option: "--from <from>", name: "from", type: "string", required: false },
  { key: "to", option: "--to <to>", name: "to", type: "string", required: false },
];
storage
  .command(`sync-rule-history`)
  .description(``)
  .option(`--rule-id <rule-id>`, ``)
  .option(`--from <from>`, ``)
  .option(`--to <to>`, ``)
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
  .description(``)
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
  .description(``)
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
