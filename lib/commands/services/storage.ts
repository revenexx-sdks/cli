import { Command } from "commander";
import { resolveFileParam } from "../utils/deployment.js";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
} from "../../interactive.js";

export const storage = new Command("storage")
  .description(
    commandDescriptions["storage"] ??
      `Media storage: assets, folders, quotas (revenexx storage service).`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

storage
  .command(`asset-index`)
  .description(``)
  .option(`--search <search>`, ``)
  .action(
    actionRunner(
      async ({ search }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets`;
        const _payload: RequestParams = {};
        if (search !== undefined) {
          _payload[`search`] = search;
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
  .command(`asset-store`)
  .description(``)
  .option(`--file <file>`, ``)
  .option(`--alt-_text <alt-_text>`, ``)
  .option(`--description <description>`, ``)
  .option(`--display-_name <display-_name>`, ``)
  .option(`--folder-_id <folder-_id>`, ``)
  .option(
    `--keep-_archive [value]`,
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
        const { file, alt_text, description, display_name, folder_id, keep_archive, tags, unpack, visibility } = await promptForMissing(
          _options,
          [
            { key: "file", option: "--file <file>", name: "file", type: "file", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets`;
        const _payload: RequestParams = {};
        if (alt_text !== undefined) {
          _payload[`alt_text`] = alt_text;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (display_name !== undefined) {
          _payload[`display_name`] = display_name;
        }
        if (file !== undefined) {
          _payload[`file`] = file !== undefined ? await resolveFileParam(file) : undefined;
        }
        if (folder_id !== undefined) {
          _payload[`folder_id`] = folder_id;
        }
        if (keep_archive !== undefined) {
          _payload[`keep_archive`] = keep_archive;
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
storage
  .command(`asset-bulk`)
  .description(``)
  .option(`--folder-_id <folder-_id>`, ``)
  .option(`--visibility <visibility>`, ``)
  .action(
    actionRunner(
      async ({ folder_id, visibility }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/bulk`;
        const _payload: RequestParams = {};
        if (folder_id !== undefined) {
          _payload[`folder_id`] = folder_id;
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
storage
  .command(`asset-destroy`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false } },
          ],
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
storage
  .command(`asset-show`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false } },
          ],
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
storage
  .command(`asset-update`)
  .description(``)
  .option(`--id <id>`, ``)
  .option(`--alt-_text <alt-_text>`, ``)
  .option(`--description <description>`, ``)
  .option(`--display-_name <display-_name>`, ``)
  .option(`--folder-_id <folder-_id>`, ``)
  .option(`--name <name>`, ``)
  .option(`--tags [tags...]`, ``)
  .option(`--visibility <visibility>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, alt_text, description, display_name, folder_id, name, tags, visibility } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (alt_text !== undefined) {
          _payload[`alt_text`] = alt_text;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (display_name !== undefined) {
          _payload[`display_name`] = display_name;
        }
        if (folder_id !== undefined) {
          _payload[`folder_id`] = folder_id;
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
storage
  .command(`asset-download`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false } },
          ],
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
storage
  .command(`asset-permanent`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false } },
          ],
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
storage
  .command(`asset-reprocess`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false } },
          ],
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
storage
  .command(`asset-restore`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false } },
          ],
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
storage
  .command(`asset-sign`)
  .description(``)
  .option(`--id <id>`, ``)
  .option(`--ttl-_seconds <ttl-_seconds>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, ttl_seconds } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}/sign`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (ttl_seconds !== undefined) {
          _payload[`ttl_seconds`] = ttl_seconds;
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
  .command(`asset-unpack`)
  .description(`Unpack an already-uploaded archive: its members are ingested into a folder
named after the archive (mirroring its structure). Asynchronous — poll the
folder/asset list for the results. \`keep_archive\` (default true) controls
whether the archive itself is kept`)
  .option(`--id <id>`, ``)
  .option(
    `--keep-_archive [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--target-_folder-_id <target-_folder-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, keep_archive, target_folder_id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/assets", hasLimit: false } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/assets/{id}/unpack`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (keep_archive !== undefined) {
          _payload[`keep_archive`] = keep_archive;
        }
        if (target_folder_id !== undefined) {
          _payload[`target_folder_id`] = target_folder_id;
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
  .command(`folder-index`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/folders`;
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
  .command(`folder-store`)
  .description(``)
  .option(`--name <name>`, ``)
  .option(`--parent-_id <parent-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, parent_id } = await promptForMissing(
          _options,
          [
            { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/folders`;
        const _payload: RequestParams = {};
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (parent_id !== undefined) {
          _payload[`parent_id`] = parent_id;
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
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/folders", hasLimit: false } },
          ],
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
storage
  .command(`folder-show`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/folders", hasLimit: false } },
          ],
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
storage
  .command(`folder-update`)
  .description(``)
  .option(`--id <id>`, ``)
  .option(`--name <name>`, ``)
  .option(`--parent-_id <parent-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, name, parent_id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/folders", hasLimit: false } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/storage/folders/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (parent_id !== undefined) {
          _payload[`parent_id`] = parent_id;
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
storage
  .command(`sync-rule-index`)
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
storage
  .command(`sync-rule-destroy`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
          ],
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
storage
  .command(`sync-rule-show`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
          ],
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
storage
  .command(`sync-rule-update`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
          ],
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
storage
  .command(`sync-rule-run`)
  .description(``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
          ],
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
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/storage/sftp/rules", hasLimit: false } },
            { key: "runId", option: "--run-id <run-id>", name: "runId", type: "string", required: true },
          ],
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
storage
  .command(`sync-rule-history`)
  .description(``)
  .option(`--rule-_id <rule-_id>`, ``)
  .option(`--from <from>`, ``)
  .option(`--to <to>`, ``)
  .action(
    actionRunner(
      async ({ rule_id, from, to }) => {
        const _client = await sdkForProject();
        const _apiPath = `/storage/sftp/sync-history`;
        const _payload: RequestParams = {};
        if (rule_id !== undefined) {
          _payload[`rule_id`] = rule_id;
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
