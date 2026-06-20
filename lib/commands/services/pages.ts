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

export const pages = new Command("pages")
  .description(commandDescriptions["pages"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

pages
  .command(`pages-delivery-menus`)
  .description(``)
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
  .command(`pages-delivery-page`)
  .description(``)
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
  .command(`pages-delivery-pages`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/delivery/pages`;
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
  .command(`pages-delivery-preview`)
  .description(``)
  .requiredOption(`--token <token>`, ``)
  .action(
    actionRunner(
      async ({ token }) => {
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
  .command(`pages-editor-edit-states`)
  .description(``)
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
  .command(`pages-editor-notifications-list`)
  .description(``)
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
  .command(`pages-editor-notifications-mark-all-read`)
  .description(``)
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
  .command(`pages-editor-notifications-unread-count`)
  .description(``)
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
  .command(`pages-editor-translate`)
  .description(``)
  .option(`--items [items...]`, ``)
  .action(
    actionRunner(
      async ({ items }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/translate`;
        const _payload: RequestParams = {};
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
  .command(`pages-editor-user-settings-get`)
  .description(``)
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
  .command(`pages-editor-user-settings-put`)
  .description(``)
  .option(`--settings <settings>`, ``)
  .action(
    actionRunner(
      async ({ settings }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/user-settings`;
        const _payload: RequestParams = {};
        if (settings !== undefined) {
          _payload[`settings`] = JSON.parse(settings);
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
  .command(`pages-editor-users`)
  .description(``)
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
  .command(`pages-editor-comments-list`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async ({ page_id }) => {
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
  .command(`pages-editor-comments-create`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--body <body>`, ``)
  .option(`--block-uuids [block-uuids...]`, ``)
  .option(`--parent-uuid <parent-uuid>`, ``)
  .action(
    actionRunner(
      async ({ page_id, body, blockUuids, parentUuid }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
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
  .command(`pages-editor-comments-delete`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--uuid <uuid>`, ``)
  .action(
    actionRunner(
      async ({ page_id, uuid }) => {
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
  .command(`pages-editor-comments-update`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--uuid <uuid>`, ``)
  .requiredOption(`--body <body>`, ``)
  .action(
    actionRunner(
      async ({ page_id, uuid, body }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}`.replace(`{page_id}`, page_id).replace(`{uuid}`, uuid);
        const _payload: RequestParams = {};
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
  .command(`pages-editor-comments-resolve`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--uuid <uuid>`, ``)
  .action(
    actionRunner(
      async ({ page_id, uuid }) => {
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
  .command(`pages-editor-comments-toggle-task`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--uuid <uuid>`, ``)
  .requiredOption(`--task-index <task-index>`, ``, parseInteger)
  .action(
    actionRunner(
      async ({ page_id, uuid, taskIndex }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/comments/{uuid}/toggle-task`.replace(`{page_id}`, page_id).replace(`{uuid}`, uuid);
        const _payload: RequestParams = {};
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
  .command(`pages-editor-comments-unresolve`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--uuid <uuid>`, ``)
  .action(
    actionRunner(
      async ({ page_id, uuid }) => {
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
  .command(`pages-editor-history`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--index <index>`, ``, parseInteger)
  .option(`--langcode <langcode>`, ``)
  .action(
    actionRunner(
      async ({ page_id, index, langcode }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/history`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
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
  .command(`pages-editor-last-changed`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async ({ page_id }) => {
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
  .command(`pages-editor-mutation-status`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--enabled <enabled>`, ``, parseBool)
  .requiredOption(`--index <index>`, ``, parseInteger)
  .option(`--langcode <langcode>`, ``)
  .action(
    actionRunner(
      async ({ page_id, enabled, index, langcode }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/mutation-status`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
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
  .command(`pages-editor-mutate`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--plugin <plugin>`, `Mutation plugin id (add, move, delete, duplicate, update_field_value, ...).`)
  .option(`--langcode <langcode>`, ``)
  .option(`--payload <payload>`, ``)
  .action(
    actionRunner(
      async ({ page_id, plugin, langcode, payload }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/mutations`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
        if (langcode !== undefined) {
          _payload[`langcode`] = langcode;
        }
        if (payload !== undefined) {
          _payload[`payload`] = JSON.parse(payload);
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
  .command(`pages-editor-preview-grant`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .option(`--ttl-hours <ttl-hours>`, ``, parseInteger)
  .action(
    actionRunner(
      async ({ page_id, ttlHours }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/preview-grant`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
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
  .command(`pages-editor-publish`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .option(
    `--force [value]`,
    `Publish despite violations.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--label <label>`, ``)
  .action(
    actionRunner(
      async ({ page_id, force, label }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/publish`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
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
  .command(`pages-editor-revert`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async ({ page_id }) => {
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
  .command(`pages-editor-schedule`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--scheduled-at <scheduled-at>`, ``)
  .action(
    actionRunner(
      async ({ page_id, scheduledAt }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/schedule`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
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
  .command(`pages-editor-state`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async ({ page_id }) => {
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
  .command(`pages-editor-take-ownership`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async ({ page_id }) => {
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
  .command(`pages-editor-templates-create`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .requiredOption(`--label <label>`, ``)
  .requiredOption(`--uuids [uuids...]`, ``)
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
      async ({ page_id, label, uuids, description, fieldName, isDefault, pageBundle }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/editor/{page_id}/templates`.replace(`{page_id}`, page_id);
        const _payload: RequestParams = {};
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
  .command(`pages-editor-unschedule`)
  .description(``)
  .requiredOption(`--page-_id <page-_id>`, ``)
  .action(
    actionRunner(
      async ({ page_id }) => {
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
  .command(`pages-library-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/library`;
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
  .command(`pages-library-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`pages-library-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`pages-library-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--bundle <bundle>`, ``)
  .option(`--label <label>`, ``)
  .option(`--tree <tree>`, `Serialized block tree ({ bundle, props, props_i18n, options, children }).`)
  .action(
    actionRunner(
      async ({ id, bundle, label, tree }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/library/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (bundle !== undefined) {
          _payload[`bundle`] = bundle;
        }
        if (label !== undefined) {
          _payload[`label`] = label;
        }
        if (tree !== undefined) {
          _payload[`tree`] = JSON.parse(tree);
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
  .command(`pages-menus-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus`;
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
  .command(`pages-menus-upsert`)
  .description(``)
  .requiredOption(`--label <label>`, ``)
  .requiredOption(`--menu-key <menu-key>`, `Stable menu identifier, e.g. "main", "footer", "account".`)
  .option(`--items [items...]`, `Ordered menu entries ({ label, to?, items? }).`)
  .action(
    actionRunner(
      async ({ label, menuKey, items }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus`;
        const _payload: RequestParams = {};
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
  .command(`pages-menus-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`pages-menus-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`pages-menus-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--items [items...]`, ``)
  .option(`--label <label>`, ``)
  .action(
    actionRunner(
      async ({ id, items, label }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/menus/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
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
  .command(`pages-pages-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages`;
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
  .command(`pages-pages-create`)
  .description(``)
  .requiredOption(`--title <title>`, ``)
  .option(`--bundle <bundle>`, ``)
  .option(`--host-options <host-options>`, ``)
  .option(`--meta <meta>`, ``)
  .option(`--slug <slug>`, ``)
  .option(`--source-language <source-language>`, ``)
  .action(
    actionRunner(
      async ({ title, bundle, hostOptions, meta, slug, sourceLanguage }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages`;
        const _payload: RequestParams = {};
        if (bundle !== undefined) {
          _payload[`bundle`] = bundle;
        }
        if (hostOptions !== undefined) {
          _payload[`hostOptions`] = JSON.parse(hostOptions);
        }
        if (meta !== undefined) {
          _payload[`meta`] = JSON.parse(meta);
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
  .command(`pages-pages-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`pages-pages-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`pages-pages-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--bundle <bundle>`, ``)
  .option(`--meta <meta>`, ``)
  .option(`--slug <slug>`, ``)
  .option(`--status <status>`, ``)
  .option(`--title <title>`, ``)
  .action(
    actionRunner(
      async ({ id, bundle, meta, slug, status, title }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (bundle !== undefined) {
          _payload[`bundle`] = bundle;
        }
        if (meta !== undefined) {
          _payload[`meta`] = JSON.parse(meta);
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
  .command(`pages-pages-revisions`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/pages/{id}/revisions`.replace(`{id}`, id);
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
  .command(`pages-seed`)
  .description(``)
  .option(`--menus [menus...]`, ``)
  .option(`--pages [pages...]`, ``)
  .action(
    actionRunner(
      async ({ menus, pages }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/seed`;
        const _payload: RequestParams = {};
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
  .command(`pages-templates-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/templates`;
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
  .command(`pages-templates-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`pages-templates-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`pages-templates-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, description, field_name, is_default, label, page_bundle, tree }) => {
        const _client = await sdkForProject();
        const _apiPath = `/pages/templates/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
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
