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

export const storage = new Command("storage")
  .description(commandDescriptions["storage"] ?? "")
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
  .requiredOption(`--file <file>`, ``)
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
      async ({ file, alt_text, description, display_name, folder_id, keep_archive, tags, unpack, visibility }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .option(`--alt-_text <alt-_text>`, ``)
  .option(`--description <description>`, ``)
  .option(`--display-_name <display-_name>`, ``)
  .option(`--folder-_id <folder-_id>`, ``)
  .option(`--name <name>`, ``)
  .option(`--tags [tags...]`, ``)
  .option(`--visibility <visibility>`, ``)
  .action(
    actionRunner(
      async ({ id, alt_text, description, display_name, folder_id, name, tags, visibility }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .option(`--ttl-_seconds <ttl-_seconds>`, ``, parseInteger)
  .action(
    actionRunner(
      async ({ id, ttl_seconds }) => {
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
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(
    `--keep-_archive [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--target-_folder-_id <target-_folder-_id>`, ``)
  .action(
    actionRunner(
      async ({ id, keep_archive, target_folder_id }) => {
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
  .requiredOption(`--name <name>`, ``)
  .option(`--parent-_id <parent-_id>`, ``)
  .action(
    actionRunner(
      async ({ name, parent_id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .option(
    `--recursive [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ id, recursive }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .option(`--name <name>`, ``)
  .option(`--parent-_id <parent-_id>`, ``)
  .action(
    actionRunner(
      async ({ id, name, parent_id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .requiredOption(`--id <id>`, ``)
  .requiredOption(`--run-id <run-id>`, ``)
  .action(
    actionRunner(
      async ({ id, runId }) => {
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
