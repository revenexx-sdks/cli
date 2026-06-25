import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseInteger,
} from "../../parser.js";

export const forms = new Command("forms")
  .description(commandDescriptions["forms"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

forms
  .command(`forms-list`)
  .description(``)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/forms`;
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
forms
  .command(`forms-create`)
  .description(``)
  .requiredOption(`--name <name>`, `Human-readable form name.`)
  .requiredOption(`--slug <slug>`, `URL-safe identifier, unique per tenant (e.g. contact, price-request).`)
  .option(`--definition [definition...]`, `FormKit schema: an array of node objects rendered verbatim by the storefront.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--settings <settings>`, `Submit label, success message, notify email, …`)
  .option(`--status <status>`, `Lifecycle: draft (editing) → live (rendered by the storefront) → archived. Default 'draft'.`)
  .action(
    actionRunner(
      async ({ name, slug, definition, metadata, settings, status }) => {
        const _client = await sdkForProject();
        const _apiPath = `/forms`;
        const _payload: RequestParams = {};
        if (definition !== undefined) {
          _payload[`definition`] = definition;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (settings !== undefined) {
          _payload[`settings`] = JSON.parse(settings);
        }
        if (slug !== undefined) {
          _payload[`slug`] = slug;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
forms
  .command(`forms-defaults`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/forms/defaults`;
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
forms
  .command(`forms-submissions-list`)
  .description(``)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/forms/submissions`;
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
forms
  .command(`forms-submissions-create`)
  .description(``)
  .requiredOption(`--data <data>`, `The submitted values, keyed by field name.`)
  .requiredOption(`--form-_id <form-_id>`, `The form this submission belongs to.`)
  .requiredOption(`--form-_slug <form-_slug>`, `Denormalised form slug for convenient filtering.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--source <source>`, `Origin of the submission (page URL or surface).`)
  .option(`--status <status>`, `Inbox status: new → read → archived | spam. Default 'new'.`)
  .action(
    actionRunner(
      async ({ data, form_id, form_slug, metadata, source, status }) => {
        const _client = await sdkForProject();
        const _apiPath = `/forms/submissions`;
        const _payload: RequestParams = {};
        if (data !== undefined) {
          _payload[`data`] = JSON.parse(data);
        }
        if (form_id !== undefined) {
          _payload[`form_id`] = form_id;
        }
        if (form_slug !== undefined) {
          _payload[`form_slug`] = form_slug;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
forms
  .command(`forms-submissions-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/forms/submissions/{id}`.replace(`{id}`, id);
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
forms
  .command(`forms-submissions-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/forms/submissions/{id}`.replace(`{id}`, id);
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
forms
  .command(`forms-submissions-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--data <data>`, `The submitted values, keyed by field name.`)
  .option(`--form-_id <form-_id>`, `The form this submission belongs to.`)
  .option(`--form-_slug <form-_slug>`, `Denormalised form slug for convenient filtering.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--source <source>`, `Origin of the submission (page URL or surface).`)
  .option(`--status <status>`, `Inbox status: new → read → archived | spam. Default 'new'.`)
  .action(
    actionRunner(
      async ({ id, data, form_id, form_slug, metadata, source, status }) => {
        const _client = await sdkForProject();
        const _apiPath = `/forms/submissions/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (data !== undefined) {
          _payload[`data`] = JSON.parse(data);
        }
        if (form_id !== undefined) {
          _payload[`form_id`] = form_id;
        }
        if (form_slug !== undefined) {
          _payload[`form_slug`] = form_slug;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
forms
  .command(`forms-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/forms/{id}`.replace(`{id}`, id);
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
forms
  .command(`forms-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/forms/{id}`.replace(`{id}`, id);
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
forms
  .command(`forms-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--definition [definition...]`, `FormKit schema: an array of node objects rendered verbatim by the storefront.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Human-readable form name.`)
  .option(`--settings <settings>`, `Submit label, success message, notify email, …`)
  .option(`--slug <slug>`, `URL-safe identifier, unique per tenant (e.g. contact, price-request).`)
  .option(`--status <status>`, `Lifecycle: draft (editing) → live (rendered by the storefront) → archived. Default 'draft'.`)
  .action(
    actionRunner(
      async ({ id, definition, metadata, name, settings, slug, status }) => {
        const _client = await sdkForProject();
        const _apiPath = `/forms/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (definition !== undefined) {
          _payload[`definition`] = definition;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (settings !== undefined) {
          _payload[`settings`] = JSON.parse(settings);
        }
        if (slug !== undefined) {
          _payload[`slug`] = slug;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
