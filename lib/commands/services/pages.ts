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
  type PromptSpec,
  registerPromptSpecs,
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
const deliveryPagesSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
];
pages
  .command(`delivery-pages`)
  .description(`List published pages (id, bundle, title, slug) — navigation/sitemap source`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order } = await promptForMissing(
          _options,
          deliveryPagesSpecs,
          _command,
        );
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
registerPromptSpecs(pages.commands.at(-1)!, deliveryPagesSpecs, { method: "get" });
const deliveryPreviewSpecs: PromptSpec[] = [
  { key: "token", option: "--token <token>", name: "token", type: "string", required: true, secret: true },
];
pages
  .command(`delivery-preview`)
  .description(`Resolve a page's CURRENT edit state via a preview token (unpublished preview for share links)`)
  .option(`--token <token>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { token } = await promptForMissing(
          _options,
          deliveryPreviewSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, deliveryPreviewSpecs, { method: "get" });
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
const editorNotificationsListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`editor-notifications-list`)
  .description(`Load a page of the current user's notifications (cursor pagination; optional mark-as-read side effect)`)
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
          editorNotificationsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/notifications`;
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
registerPromptSpecs(pages.commands.at(-1)!, editorNotificationsListSpecs, { method: "get" });
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
const editorTranslateSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", type: "array", required: false },
];
pages
  .command(`editor-translate`)
  .description(`Machine-translate text fields via the configured provider (501 when unconfigured)`)
  .option(`--items [items...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items } = await promptForMissing(
          _options,
          editorTranslateSpecs,
          _command,
        );
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
registerPromptSpecs(pages.commands.at(-1)!, editorTranslateSpecs, { method: "post" });
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
const editorUserSettingsPutSpecs: PromptSpec[] = [
  { key: "settings", option: "--settings <settings>", name: "settings", type: "object", required: false },
];
pages
  .command(`editor-user-settings-put`)
  .description(`Persist the current user's editor settings`)
  .option(`--settings <settings>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { settings } = await promptForMissing(
          _options,
          editorUserSettingsPutSpecs,
          _command,
        );
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
registerPromptSpecs(pages.commands.at(-1)!, editorUserSettingsPutSpecs, { method: "put" });
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
const editorCommentsListSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`editor-comments-list`)
  .description(`List all comments of a page (roots + replies, flat)`)
  .option(`--page-id <page-id>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, filter } = await promptForMissing(
          _options,
          editorCommentsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorCommentsListSpecs, { method: "get" });
const editorCommentsCreateSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "body", option: "--body <body>", name: "body", type: "string", required: true },
  { key: "blockUuids", option: "--block-uuids [block-uuids...]", name: "blockUuids", type: "array", required: false },
  { key: "parentUuid", option: "--parent-uuid <parent-uuid>", name: "parentUuid", type: "string", required: false },
];
pages
  .command(`editor-comments-create`)
  .description(`Add a comment (root via blockUuids, reply via parentUuid); @mentions notify users`)
  .option(`--page-id <page-id>`, ``)
  .option(`--body <body>`, ``)
  .option(`--block-uuids [block-uuids...]`, ``)
  .option(`--parent-uuid <parent-uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, body, blockUuids, parentUuid } = await promptForMissing(
          _options,
          editorCommentsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorCommentsCreateSpecs, { method: "post" });
const editorCommentsDeleteSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "uuid", option: "--uuid <uuid>", name: "uuid", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
];
pages
  .command(`editor-comments-delete`)
  .description(`Delete a comment (replies cascade)`)
  .option(`--page-id <page-id>`, ``)
  .option(`--uuid <uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, uuid } = await promptForMissing(
          _options,
          editorCommentsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`pages editor-comments-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}`.replace(`{page_id}`, pageId).replace(`{uuid}`, uuid);
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
registerPromptSpecs(pages.commands.at(-1)!, editorCommentsDeleteSpecs, { method: "delete", destructive: true });
const editorCommentsUpdateSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "uuid", option: "--uuid <uuid>", name: "uuid", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
  { key: "body", option: "--body <body>", name: "body", type: "string", required: true },
];
pages
  .command(`editor-comments-update`)
  .description(`Edit a comment body (author only)`)
  .option(`--page-id <page-id>`, ``)
  .option(`--uuid <uuid>`, ``)
  .option(`--body <body>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, uuid, body } = await promptForMissing(
          _options,
          editorCommentsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}`.replace(`{page_id}`, pageId).replace(`{uuid}`, uuid);
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
registerPromptSpecs(pages.commands.at(-1)!, editorCommentsUpdateSpecs, { method: "put" });
const editorCommentsResolveSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "uuid", option: "--uuid <uuid>", name: "uuid", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
];
pages
  .command(`editor-comments-resolve`)
  .description(`Resolve a comment thread (root only)`)
  .option(`--page-id <page-id>`, ``)
  .option(`--uuid <uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, uuid } = await promptForMissing(
          _options,
          editorCommentsResolveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}/resolve`.replace(`{page_id}`, pageId).replace(`{uuid}`, uuid);
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
registerPromptSpecs(pages.commands.at(-1)!, editorCommentsResolveSpecs, { method: "post" });
const editorCommentsToggleTaskSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "uuid", option: "--uuid <uuid>", name: "uuid", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
  { key: "taskIndex", option: "--task-index <task-index>", name: "taskIndex", type: "integer", required: true },
];
pages
  .command(`editor-comments-toggle-task`)
  .description(`Toggle the n-th task checkbox inside a comment body`)
  .option(`--page-id <page-id>`, ``)
  .option(`--uuid <uuid>`, ``)
  .option(`--task-index <task-index>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, uuid, taskIndex } = await promptForMissing(
          _options,
          editorCommentsToggleTaskSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}/toggle-task`.replace(`{page_id}`, pageId).replace(`{uuid}`, uuid);
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
registerPromptSpecs(pages.commands.at(-1)!, editorCommentsToggleTaskSpecs, { method: "post" });
const editorCommentsUnresolveSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "uuid", option: "--uuid <uuid>", name: "uuid", type: "string", required: true, resource: { listPath: "/pages/editor/{page_id}/comments", hasLimit: false } },
];
pages
  .command(`editor-comments-unresolve`)
  .description(`Reopen a resolved thread`)
  .option(`--page-id <page-id>`, ``)
  .option(`--uuid <uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, uuid } = await promptForMissing(
          _options,
          editorCommentsUnresolveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}/unresolve`.replace(`{page_id}`, pageId).replace(`{uuid}`, uuid);
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
registerPromptSpecs(pages.commands.at(-1)!, editorCommentsUnresolveSpecs, { method: "post" });
const editorHistorySpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "index", option: "--index <index>", name: "index", type: "integer", required: true },
  { key: "langcode", option: "--langcode <langcode>", name: "langcode", type: "string", required: false },
];
pages
  .command(`editor-history`)
  .description(`Move the undo/redo pointer (current_index)`)
  .option(`--page-id <page-id>`, ``)
  .option(`--index <index>`, ``, parseInteger)
  .option(`--langcode <langcode>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, index, langcode } = await promptForMissing(
          _options,
          editorHistorySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/history`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorHistorySpecs, { method: "post" });
const editorLastChangedSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
];
pages
  .command(`editor-last-changed`)
  .description(`Epoch seconds of the edit state's last change (polling)`)
  .option(`--page-id <page-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId } = await promptForMissing(
          _options,
          editorLastChangedSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/last-changed`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorLastChangedSpecs, { method: "get" });
const editorMutationStatusSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: true },
  { key: "index", option: "--index <index>", name: "index", type: "integer", required: true },
  { key: "langcode", option: "--langcode <langcode>", name: "langcode", type: "string", required: false },
];
pages
  .command(`editor-mutation-status`)
  .description(`Soft-enable/disable a single mutation in the log`)
  .option(`--page-id <page-id>`, ``)
  .option(`--enabled <enabled>`, ``, parseBool)
  .option(`--index <index>`, ``, parseInteger)
  .option(`--langcode <langcode>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, enabled, index, langcode } = await promptForMissing(
          _options,
          editorMutationStatusSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/mutation-status`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorMutationStatusSpecs, { method: "post" });
const editorMutateSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "plugin", option: "--plugin <plugin>", name: "plugin", description: "Mutation plugin id (add, move, delete, duplicate, update_field_value, ...).", type: "string", required: true },
  { key: "langcode", option: "--langcode <langcode>", name: "langcode", type: "string", required: false },
  { key: "payload", option: "--payload <payload>", name: "payload", type: "object", required: false },
];
pages
  .command(`editor-mutate`)
  .description(`Append a mutation to the page's edit state (creates it if absent; truncates the redo branch; requires ownership)`)
  .option(`--page-id <page-id>`, ``)
  .option(`--plugin <plugin>`, `Mutation plugin id (add, move, delete, duplicate, update_field_value, ...).`)
  .option(`--langcode <langcode>`, ``)
  .option(`--payload <payload>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, plugin, langcode, payload } = await promptForMissing(
          _options,
          editorMutateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/mutations`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorMutateSpecs, { method: "post" });
const editorPreviewGrantSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "ttlHours", option: "--ttl-hours <ttl-hours>", name: "ttlHours", type: "integer", required: false },
];
pages
  .command(`editor-preview-grant`)
  .description(`Create a shareable preview token for a page's current edit state`)
  .option(`--page-id <page-id>`, ``)
  .option(`--ttl-hours <ttl-hours>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, ttlHours } = await promptForMissing(
          _options,
          editorPreviewGrantSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/preview-grant`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorPreviewGrantSpecs, { method: "post" });
const editorPublishSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "force", option: "--force <force>", name: "force", description: "Publish despite violations.", type: "boolean", required: false },
  { key: "label", option: "--label <label>", name: "label", type: "string", required: false },
];
pages
  .command(`editor-publish`)
  .description(`Publish: materialize the edit state, replace canonical blocks, write a revision snapshot, archive the edit state`)
  .option(`--page-id <page-id>`, ``)
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
        const { pageId, force, label } = await promptForMissing(
          _options,
          editorPublishSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/publish`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorPublishSpecs, { method: "post" });
const editorRevertSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
];
pages
  .command(`editor-revert`)
  .description(`Discard all unpublished changes (deletes the edit state and its mutation log)`)
  .option(`--page-id <page-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId } = await promptForMissing(
          _options,
          editorRevertSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/revert`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorRevertSpecs, { method: "post" });
const editorScheduleSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "scheduledAt", option: "--scheduled-at <scheduled-at>", name: "scheduledAt", type: "string", required: true },
];
pages
  .command(`editor-schedule`)
  .description(`Schedule the edit state for automated publishing`)
  .option(`--page-id <page-id>`, ``)
  .option(`--scheduled-at <scheduled-at>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId, scheduledAt } = await promptForMissing(
          _options,
          editorScheduleSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/schedule`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorScheduleSpecs, { method: "post" });
const editorStateSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
];
pages
  .command(`editor-state`)
  .description(`Load the full editor state for a page (langcode resolves i18n; index materializes a historic state)`)
  .option(`--page-id <page-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId } = await promptForMissing(
          _options,
          editorStateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/state`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorStateSpecs, { method: "get" });
const editorTakeOwnershipSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
];
pages
  .command(`editor-take-ownership`)
  .description(`Take ownership of the page's edit state (notifies the previous owner)`)
  .option(`--page-id <page-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId } = await promptForMissing(
          _options,
          editorTakeOwnershipSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/take-ownership`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorTakeOwnershipSpecs, { method: "post" });
const editorTemplatesCreateSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
  { key: "label", option: "--label <label>", name: "label", type: "string", required: true },
  { key: "uuids", option: "--uuids [uuids...]", name: "uuids", type: "array", required: true },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "fieldName", option: "--field-name <field-name>", name: "fieldName", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "isDefault", type: "boolean", required: false },
  { key: "pageBundle", option: "--page-bundle <page-bundle>", name: "pageBundle", type: "string", required: false },
];
pages
  .command(`editor-templates-create`)
  .description(`Create a template from blocks of the current edit state`)
  .option(`--page-id <page-id>`, ``)
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
        const { pageId, label, uuids, description, fieldName, isDefault, pageBundle } = await promptForMissing(
          _options,
          editorTemplatesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/templates`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorTemplatesCreateSpecs, { method: "post" });
const editorUnscheduleSpecs: PromptSpec[] = [
  { key: "pageId", option: "--page-id <page-id>", name: "page_id", type: "string", required: true },
];
pages
  .command(`editor-unschedule`)
  .description(`Cancel a scheduled publish (back to active)`)
  .option(`--page-id <page-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { pageId } = await promptForMissing(
          _options,
          editorUnscheduleSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/unschedule`.replace(`{page_id}`, pageId);
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
registerPromptSpecs(pages.commands.at(-1)!, editorUnscheduleSpecs, { method: "post" });
const libraryListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`library-list`)
  .description(`Search the reusable-block library (text, bundles filter; paginated)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          libraryListSpecs,
          _command,
        );
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
registerPromptSpecs(pages.commands.at(-1)!, libraryListSpecs, { method: "get" });
const libraryDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/library", hasLimit: true } },
];
pages
  .command(`library-delete`)
  .description(`Soft-delete a library item`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          libraryDeleteSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, libraryDeleteSpecs, { method: "delete", destructive: true });
const libraryGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/library", hasLimit: true } },
];
pages
  .command(`library-get`)
  .description(`Read one library item`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          libraryGetSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, libraryGetSpecs, { method: "get" });
const libraryUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/library", hasLimit: true } },
  { key: "bundle", option: "--bundle <bundle>", name: "bundle", type: "string", required: false },
  { key: "label", option: "--label <label>", name: "label", type: "string", required: false },
  { key: "tree", option: "--tree <tree>", name: "tree", description: "Serialized block tree ({ bundle, props, props_i18n, options, children }).", type: "object", required: false },
];
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
          libraryUpdateSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, libraryUpdateSpecs, { method: "put" });
const menusListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`menus-list`)
  .description(`List the tenant's navigation menus (main, footer, account, …)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          menusListSpecs,
          _command,
        );
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
registerPromptSpecs(pages.commands.at(-1)!, menusListSpecs, { method: "get" });
const menusUpsertSpecs: PromptSpec[] = [
  { key: "label", option: "--label <label>", name: "label", type: "string", required: true },
  { key: "menuKey", option: "--menu-key <menu-key>", name: "menuKey", description: "Stable menu identifier, e.g. \"main\", \"footer\", \"account\".", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", description: "Ordered menu entries ({ label, to?, items? }).", type: "array", required: false },
];
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
          menusUpsertSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, menusUpsertSpecs, { method: "post" });
const menusDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/menus", hasLimit: true } },
];
pages
  .command(`menus-delete`)
  .description(`Soft-delete a menu`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          menusDeleteSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, menusDeleteSpecs, { method: "delete", destructive: true });
const menusGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/menus", hasLimit: true } },
];
pages
  .command(`menus-get`)
  .description(`Read one menu by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          menusGetSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, menusGetSpecs, { method: "get" });
const menusUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/menus", hasLimit: true } },
  { key: "items", option: "--items [items...]", name: "items", type: "array", required: false },
  { key: "label", option: "--label <label>", name: "label", type: "string", required: false },
];
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
          menusUpdateSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, menusUpdateSpecs, { method: "put" });
const pagesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`pages-list`)
  .description(`List pages (filter by bundle/status, q searches titles; paginate limit/offset)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          pagesListSpecs,
          _command,
        );
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
registerPromptSpecs(pages.commands.at(-1)!, pagesListSpecs, { method: "get" });
const pagesCreateSpecs: PromptSpec[] = [
  { key: "title", option: "--title <title>", name: "title", type: "string", required: true },
  { key: "bundle", option: "--bundle <bundle>", name: "bundle", type: "string", required: false },
  { key: "hostOptions", option: "--host-options <host-options>", name: "hostOptions", type: "object", required: false },
  { key: "meta", option: "--meta <meta>", name: "meta", type: "object", required: false },
  { key: "slug", option: "--slug <slug>", name: "slug", type: "string", required: false },
  { key: "sourceLanguage", option: "--source-language <source-language>", name: "sourceLanguage", type: "string", required: false },
];
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
          pagesCreateSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, pagesCreateSpecs, { method: "post" });
const pagesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
];
pages
  .command(`pages-delete`)
  .description(`Soft-delete a page`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          pagesDeleteSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, pagesDeleteSpecs, { method: "delete", destructive: true });
const pagesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
];
pages
  .command(`pages-get`)
  .description(`Read one page by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          pagesGetSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, pagesGetSpecs, { method: "get" });
const pagesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
  { key: "bundle", option: "--bundle <bundle>", name: "bundle", type: "string", required: false },
  { key: "meta", option: "--meta <meta>", name: "meta", type: "object", required: false },
  { key: "slug", option: "--slug <slug>", name: "slug", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", type: "string", required: false, enum: ["draft","published","archived"] },
  { key: "title", option: "--title <title>", name: "title", type: "string", required: false },
];
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
          pagesUpdateSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, pagesUpdateSpecs, { method: "put" });
const pagesRevisionsSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/pages", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
];
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
          pagesRevisionsSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, pagesRevisionsSpecs, { method: "get" });
const seedSpecs: PromptSpec[] = [
  { key: "menus", option: "--menus [menus...]", name: "menus", type: "array", required: false },
  { key: "pages", option: "--pages [pages...]", name: "pages", type: "array", required: false },
];
pages
  .command(`seed`)
  .description(`Idempotently seed pages and menus from a theme's defaults (skips existing slugs / menu keys; seeded pages are published immediately)`)
  .option(`--menus [menus...]`, ``)
  .option(`--pages [pages...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { menus, pages } = await promptForMissing(
          _options,
          seedSpecs,
          _command,
        );
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
registerPromptSpecs(pages.commands.at(-1)!, seedSpecs, { method: "post" });
const templatesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
pages
  .command(`templates-list`)
  .description(`List block templates`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, order, filter } = await promptForMissing(
          _options,
          templatesListSpecs,
          _command,
        );
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
registerPromptSpecs(pages.commands.at(-1)!, templatesListSpecs, { method: "get" });
const templatesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/templates", hasLimit: true } },
];
pages
  .command(`templates-delete`)
  .description(`Delete a template`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          templatesDeleteSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, templatesDeleteSpecs, { method: "delete", destructive: true });
const templatesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/templates", hasLimit: true } },
];
pages
  .command(`templates-get`)
  .description(`Read one template`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          templatesGetSpecs,
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
registerPromptSpecs(pages.commands.at(-1)!, templatesGetSpecs, { method: "get" });
const templatesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/pages/templates", hasLimit: true } },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "fieldName", option: "--field-name <field-name>", name: "field_name", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", type: "boolean", required: false },
  { key: "label", option: "--label <label>", name: "label", type: "string", required: false },
  { key: "pageBundle", option: "--page-bundle <page-bundle>", name: "page_bundle", type: "string", required: false },
  { key: "tree", option: "--tree [tree...]", name: "tree", description: "Serialized block trees ({ bundle, props, props_i18n, options, children }).", type: "array", required: false },
];
pages
  .command(`templates-update`)
  .description(`Update a template`)
  .option(`--id <id>`, ``)
  .option(`--description <description>`, ``)
  .option(`--field-name <field-name>`, ``)
  .option(
    `--is-default [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--label <label>`, ``)
  .option(`--page-bundle <page-bundle>`, ``)
  .option(`--tree [tree...]`, `Serialized block trees ({ bundle, props, props_i18n, options, children }).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, fieldName, isDefault, label, pageBundle, tree } = await promptForMissing(
          _options,
          templatesUpdateSpecs,
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
        if (fieldName !== undefined) {
          _payload[`field_name`] = fieldName;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (pageBundle !== undefined) {
          _payload[`page_bundle`] = pageBundle;
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
registerPromptSpecs(pages.commands.at(-1)!, templatesUpdateSpecs, { method: "put" });
