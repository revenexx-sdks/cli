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
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
} from "../../interactive.js";

export const pages = new Command("pages")
  .description(
    commandDescriptions["pages"] ??
      `Manage pages resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

pages
  .command(`delivery-menus`)
  .description(`List the tenant's navigation menus for the renderer (key → ordered items) — header/footer/account chrome`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/delivery/menus`;
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
pages
  .command(`delivery-page`)
  .description(`Resolve a published page by slug or id for a language (i18n fallback, schedule filtering, library refs resolved)`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/delivery/page`;
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
pages
  .command(`delivery-pages`)
  .description(`List published pages (id, bundle, title, slug) — navigation/sitemap source`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/delivery/pages`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
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
pages
  .command(`delivery-preview`)
  .description(`Resolve a page's CURRENT edit state via a preview token (unpublished preview for share links)`)
  .option(`--token <token>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { token } = await promptForMissing(
          _options,
          [
            { key: "token", option: "--token <token>", name: "token", type: "string", required: true, secret: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/delivery/preview/{token}`.replace(`{token}`, token);
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
pages
  .command(`editor-edit-states`)
  .description(`Search open edit states across all pages (drafts overview)`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/edit-states`;
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
pages
  .command(`editor-notifications-list`)
  .description(`Load a page of the current user's notifications (cursor pagination; optional mark-as-read side effect)`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/notifications`;
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
pages
  .command(`editor-notifications-mark-all-read`)
  .description(`Mark all notifications read`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/notifications/mark-all-read`;
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
pages
  .command(`editor-notifications-unread-count`)
  .description(`Unread notification count`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/notifications/unread-count`;
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
pages
  .command(`editor-translate`)
  .description(`Machine-translate text fields via the configured provider (501 when unconfigured)`)
  .option(`--items [items...]`, ``)
  .action(
    actionRunner(
      async ({ items }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/translate`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
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
pages
  .command(`editor-user-settings-get`)
  .description(`Load the current user's editor settings`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/user-settings`;
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
pages
  .command(`editor-user-settings-put`)
  .description(`Persist the current user's editor settings`)
  .option(`--settings <settings>`, ``)
  .action(
    actionRunner(
      async ({ settings }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/user-settings`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (settings !== undefined) {
          _payload[`settings`] = resolveBodyParam(settings);
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
pages
  .command(`editor-users`)
  .description(`List tenant users for @mentions (identity service; falls back to comment authors)`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/users`;
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
pages
  .command(`editor-comments-list`)
  .description(`List all comments of a page (roots + replies, flat)`)
  .option(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments`.replace(`{page_id}`, page_id);
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
pages
  .command(`editor-comments-create`)
  .description(`Add a comment (root via blockUuids, reply via parentUuid); @mentions notify users`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--body <body>`, ``)
  .option(`--block-uuids [block-uuids...]`, ``)
  .option(`--parent-uuid <parent-uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, body, blockUuids, parentUuid } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "body", option: "--body <body>", name: "body", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (blockUuids !== undefined) {
          _payload[`blockUuids`] = blockUuids;
        }
        if (body !== undefined) {
          _payload[`body`] = body;
        }
        if (parentUuid !== undefined) {
          _payload[`parentUuid`] = parentUuid;
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
pages
  .command(`editor-comments-delete`)
  .description(`Delete a comment (replies cascade)`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--uuid <uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, uuid } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "uuid", option: "--uuid <uuid>", name: "uuid", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
          ],
          _command,
        );
        await confirmDestructive(`pages editor-comments-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}`.replace(`{page_id}`, page_id).replace(`{uuid}`, uuid);
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
pages
  .command(`editor-comments-update`)
  .description(`Edit a comment body (author only)`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--uuid <uuid>`, ``)
  .option(`--body <body>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, uuid, body } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "uuid", option: "--uuid <uuid>", name: "uuid", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
            { key: "body", option: "--body <body>", name: "body", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}`.replace(`{page_id}`, page_id).replace(`{uuid}`, uuid);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (body !== undefined) {
          _payload[`body`] = body;
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
pages
  .command(`editor-comments-resolve`)
  .description(`Resolve a comment thread (root only)`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--uuid <uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, uuid } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "uuid", option: "--uuid <uuid>", name: "uuid", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}/resolve`.replace(`{page_id}`, page_id).replace(`{uuid}`, uuid);
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
pages
  .command(`editor-comments-toggle-task`)
  .description(`Toggle the n-th task checkbox inside a comment body`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--uuid <uuid>`, ``)
  .option(`--task-index <task-index>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, uuid, taskIndex } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "uuid", option: "--uuid <uuid>", name: "uuid", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
            { key: "taskIndex", option: "--task-index <task-index>", name: "taskIndex", type: "integer", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}/toggle-task`.replace(`{page_id}`, page_id).replace(`{uuid}`, uuid);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (taskIndex !== undefined) {
          _payload[`taskIndex`] = taskIndex;
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
pages
  .command(`editor-comments-unresolve`)
  .description(`Reopen a resolved thread`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--uuid <uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, uuid } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "uuid", option: "--uuid <uuid>", name: "uuid", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}/unresolve`.replace(`{page_id}`, page_id).replace(`{uuid}`, uuid);
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
pages
  .command(`editor-history`)
  .description(`Move the undo/redo pointer (current_index)`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--index <index>`, ``, parseInteger)
  .option(`--langcode <langcode>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, index, langcode } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "index", option: "--index <index>", name: "index", type: "integer", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/history`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (index !== undefined) {
          _payload[`index`] = index;
        }
        if (langcode !== undefined) {
          _payload[`langcode`] = langcode;
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
pages
  .command(`editor-last-changed`)
  .description(`Epoch seconds of the edit state's last change (polling)`)
  .option(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/last-changed`.replace(`{page_id}`, page_id);
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
pages
  .command(`editor-mutation-status`)
  .description(`Soft-enable/disable a single mutation in the log`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--enabled <enabled>`, ``, parseBool)
  .option(`--index <index>`, ``, parseInteger)
  .option(`--langcode <langcode>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, enabled, index, langcode } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: true },
            { key: "index", option: "--index <index>", name: "index", type: "integer", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/mutation-status`.replace(`{page_id}`, page_id);
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
        if (index !== undefined) {
          _payload[`index`] = index;
        }
        if (langcode !== undefined) {
          _payload[`langcode`] = langcode;
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
pages
  .command(`editor-mutate`)
  .description(`Append a mutation to the page's edit state (creates it if absent; truncates the redo branch; requires ownership)`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--plugin <plugin>`, `Mutation plugin id (add, move, delete, duplicate, update_field_value, ...).`)
  .option(`--langcode <langcode>`, ``)
  .option(`--payload <payload>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, plugin, langcode, payload } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "plugin", option: "--plugin <plugin>", name: "plugin", description: "Mutation plugin id (add, move, delete, duplicate, update_field_value, ...).", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/mutations`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (langcode !== undefined) {
          _payload[`langcode`] = langcode;
        }
        if (payload !== undefined) {
          _payload[`payload`] = resolveBodyParam(payload);
        }
        if (plugin !== undefined) {
          _payload[`plugin`] = plugin;
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
pages
  .command(`editor-preview-grant`)
  .description(`Create a shareable preview token for a page's current edit state`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--ttl-hours <ttl-hours>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, ttlHours } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/preview-grant`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (ttlHours !== undefined) {
          _payload[`ttlHours`] = ttlHours;
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
pages
  .command(`editor-publish`)
  .description(`Publish: materialize the edit state, replace canonical blocks, write a revision snapshot, archive the edit state`)
  .option(`--page-_id <page-_id>`, ``)
  .option(
    `--force [value]`,
    `Publish despite violations.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--label <label>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, force, label } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/publish`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (force !== undefined) {
          _payload[`force`] = force;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
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
pages
  .command(`editor-revert`)
  .description(`Discard all unpublished changes (deletes the edit state and its mutation log)`)
  .option(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/revert`.replace(`{page_id}`, page_id);
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
pages
  .command(`editor-schedule`)
  .description(`Schedule the edit state for automated publishing`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--scheduled-at <scheduled-at>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, scheduledAt } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "scheduledAt", option: "--scheduled-at <scheduled-at>", name: "scheduledAt", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/schedule`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (scheduledAt !== undefined) {
          _payload[`scheduledAt`] = scheduledAt;
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
pages
  .command(`editor-state`)
  .description(`Load the full editor state for a page (langcode resolves i18n; index materializes a historic state)`)
  .option(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/state`.replace(`{page_id}`, page_id);
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
pages
  .command(`editor-take-ownership`)
  .description(`Take ownership of the page's edit state (notifies the previous owner)`)
  .option(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/take-ownership`.replace(`{page_id}`, page_id);
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
pages
  .command(`editor-templates-create`)
  .description(`Create a template from blocks of the current edit state`)
  .option(`--page-_id <page-_id>`, ``)
  .option(`--label <label>`, ``)
  .option(`--uuids [uuids...]`, ``)
  .option(`--description <description>`, ``)
  .option(`--field-name <field-name>`, ``)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--page-bundle <page-bundle>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id, label, uuids, description, fieldName, isDefault, pageBundle } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
            { key: "label", option: "--label <label>", name: "label", type: "string", required: true },
            { key: "uuids", option: "--uuids [uuids...]", name: "uuids", type: "array", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/templates`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (fieldName !== undefined) {
          _payload[`fieldName`] = fieldName;
        }
        if (isDefault !== undefined) {
          _payload[`isDefault`] = isDefault;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (pageBundle !== undefined) {
          _payload[`pageBundle`] = pageBundle;
        }
        if (uuids !== undefined) {
          _payload[`uuids`] = uuids;
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
pages
  .command(`editor-unschedule`)
  .description(`Cancel a scheduled publish (back to active)`)
  .option(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { page_id } = await promptForMissing(
          _options,
          [
            { key: "page_id", option: "--page-_id <page-_id>", name: "page_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/unschedule`.replace(`{page_id}`, page_id);
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
pages
  .command(`library-list`)
  .description(`Search the reusable-block library (text, bundles filter; paginated)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/library`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
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
pages
  .command(`library-delete`)
  .description(`Soft-delete a library item`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/library", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`pages library-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/library/{id}`.replace(`{id}`, id);
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
pages
  .command(`library-get`)
  .description(`Read one library item`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/library", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/library/{id}`.replace(`{id}`, id);
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
pages
  .command(`library-update`)
  .description(`Update a library item (label, tree)`)
  .option(`--id <id>`, ``)
  .option(`--bundle <bundle>`, ``)
  .option(`--label <label>`, ``)
  .option(`--tree <tree>`, `Serialized block tree ({ bundle, props, props_i18n, options, children }).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, bundle, label, tree } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/library", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/library/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bundle !== undefined) {
          _payload[`bundle`] = bundle;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (tree !== undefined) {
          _payload[`tree`] = resolveBodyParam(tree);
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
pages
  .command(`menus-list`)
  .description(`List the tenant's navigation menus (main, footer, account, …)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
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
pages
  .command(`menus-upsert`)
  .description(`Create or update a menu by menuKey (idempotent per tenant)`)
  .option(`--label <label>`, ``)
  .option(`--menu-key <menu-key>`, `Stable menu identifier, e.g. "main", "footer", "account".`)
  .option(`--items [items...]`, `Ordered menu entries ({ label, to?, items? }).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { label, menuKey, items } = await promptForMissing(
          _options,
          [
            { key: "label", option: "--label <label>", name: "label", type: "string", required: true },
            { key: "menuKey", option: "--menu-key <menu-key>", name: "menuKey", description: "Stable menu identifier, e.g. \"main\", \"footer\", \"account\".", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (menuKey !== undefined) {
          _payload[`menuKey`] = menuKey;
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
pages
  .command(`menus-delete`)
  .description(`Soft-delete a menu`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/menus", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`pages menus-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus/{id}`.replace(`{id}`, id);
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
pages
  .command(`menus-get`)
  .description(`Read one menu by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/menus", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus/{id}`.replace(`{id}`, id);
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
pages
  .command(`menus-update`)
  .description(`Update a menu (label, items)`)
  .option(`--id <id>`, ``)
  .option(`--items [items...]`, ``)
  .option(`--label <label>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, items, label } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/menus", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
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
pages
  .command(`pages-list`)
  .description(`List pages (filter by bundle/status, q searches titles; paginate limit/offset)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
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
pages
  .command(`pages-create`)
  .description(`Create a page (also creates its source-language translation row)`)
  .option(`--title <title>`, ``)
  .option(`--bundle <bundle>`, ``)
  .option(`--host-options <host-options>`, ``)
  .option(`--meta <meta>`, ``)
  .option(`--slug <slug>`, ``)
  .option(`--source-language <source-language>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { title, bundle, hostOptions, meta, slug, sourceLanguage } = await promptForMissing(
          _options,
          [
            { key: "title", option: "--title <title>", name: "title", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bundle !== undefined) {
          _payload[`bundle`] = bundle;
        }
        if (hostOptions !== undefined) {
          _payload[`hostOptions`] = resolveBodyParam(hostOptions);
        }
        if (meta !== undefined) {
          _payload[`meta`] = resolveBodyParam(meta);
        }
        if (slug !== undefined) {
          _payload[`slug`] = slug;
        }
        if (sourceLanguage !== undefined) {
          _payload[`sourceLanguage`] = sourceLanguage;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
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
pages
  .command(`pages-delete`)
  .description(`Soft-delete a page`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`pages pages-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages/{id}`.replace(`{id}`, id);
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
pages
  .command(`pages-get`)
  .description(`Read one page by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages/{id}`.replace(`{id}`, id);
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
pages
  .command(`pages-update`)
  .description(`Update page metadata (title, slug, status, meta, bundle)`)
  .option(`--id <id>`, ``)
  .option(`--bundle <bundle>`, ``)
  .option(`--meta <meta>`, ``)
  .option(`--slug <slug>`, ``)
  .option(`--status <status>`, ``)
  .option(`--title <title>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, bundle, meta, slug, status, title } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (bundle !== undefined) {
          _payload[`bundle`] = bundle;
        }
        if (meta !== undefined) {
          _payload[`meta`] = resolveBodyParam(meta);
        }
        if (slug !== undefined) {
          _payload[`slug`] = slug;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
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
pages
  .command(`pages-revisions`)
  .description(`List a page's revisions (snapshots omitted)`)
  .option(`--id <id>`, ``)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, limit, offset, order } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages/{id}/revisions`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
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
pages
  .command(`seed`)
  .description(`Idempotently seed pages and menus from a theme's defaults (skips existing slugs / menu keys; seeded pages are published immediately)`)
  .option(`--menus [menus...]`, ``)
  .option(`--pages [pages...]`, ``)
  .action(
    actionRunner(
      async ({ menus, pages }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/seed`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (menus !== undefined) {
          _payload[`menus`] = menus;
        }
        if (pages !== undefined) {
          _payload[`pages`] = pages;
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
pages
  .command(`templates-list`)
  .description(`List block templates`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/templates`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
        }
        if (order !== undefined) {
          _payload[`order`] = order;
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
pages
  .command(`templates-delete`)
  .description(`Delete a template`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/templates", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`pages templates-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/templates/{id}`.replace(`{id}`, id);
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
pages
  .command(`templates-get`)
  .description(`Read one template`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/templates", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/templates/{id}`.replace(`{id}`, id);
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
pages
  .command(`templates-update`)
  .description(`Update a template`)
  .option(`--id <id>`, ``)
  .option(`--description <description>`, ``)
  .option(`--field-_name <field-_name>`, ``)
  .option(
    `--is-_default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--label <label>`, ``)
  .option(`--page-_bundle <page-_bundle>`, ``)
  .option(`--tree [tree...]`, `Serialized block trees ({ bundle, props, props_i18n, options, children }).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, field_name, is_default, label, page_bundle, tree } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/templates", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/templates/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (field_name !== undefined) {
          _payload[`field_name`] = field_name;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (page_bundle !== undefined) {
          _payload[`page_bundle`] = page_bundle;
        }
        if (tree !== undefined) {
          _payload[`tree`] = tree;
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
