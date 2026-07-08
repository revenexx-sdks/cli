import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseInteger,
} from "../../parser.js";
import {
  confirmDestructive,
  promptForMissing,
} from "../../interactive.js";

export const forms = new Command("forms")
  .description(
    commandDescriptions["forms"] ??
      `Manage forms resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

forms
  .command(`list`)
  .description(`List forms (filter by status/slug)`)
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
  .command(`create`)
  .description(`Create a form`)
  .option(`--name <name>`, `Human-readable form name.`)
  .option(`--slug <slug>`, `URL-safe identifier, unique per tenant (e.g. contact, price-request).`)
  .option(`--definition [definition...]`, `FormKit schema: an array of node objects rendered verbatim by the storefront.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--settings <settings>`, `Submit label, success message, notify email, …`)
  .option(`--status <status>`, `Lifecycle: draft (editing) → live (rendered by the storefront) → archived. Default 'draft'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, slug, definition, metadata, settings, status } = await promptForMissing(
          _options,
          [
            { key: "name", option: "--name <name>", name: "name", description: "Human-readable form name.", type: "string", required: true },
            { key: "slug", option: "--slug <slug>", name: "slug", description: "URL-safe identifier, unique per tenant (e.g. contact, price-request).", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`defaults`)
  .description(`Seed the sample contact form — idempotent, also runs on app.installed`)
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
  .command(`submissions-list`)
  .description(`List submissions (filter by form_id/form_slug/status)`)
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
  .command(`submissions-create`)
  .description(`Record a submission — emits form.submitted`)
  .option(`--data <data>`, `The submitted values, keyed by field name.`)
  .option(`--form-_id <form-_id>`, `The form this submission belongs to.`)
  .option(`--form-_slug <form-_slug>`, `Denormalised form slug for convenient filtering.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--source <source>`, `Origin of the submission (page URL or surface).`)
  .option(`--status <status>`, `Inbox status: new → read → archived | spam. Default 'new'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { data, form_id, form_slug, metadata, source, status } = await promptForMissing(
          _options,
          [
            { key: "data", option: "--data <data>", name: "data", description: "The submitted values, keyed by field name.", type: "object", required: true },
            { key: "form_id", option: "--form-_id <form-_id>", name: "form_id", description: "The form this submission belongs to.", type: "string", required: true },
            { key: "form_slug", option: "--form-_slug <form-_slug>", name: "form_slug", description: "Denormalised form slug for convenient filtering.", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`submissions-delete`)
  .description(`Delete a submission`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms/submissions", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`forms submissions-delete`);
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
  .command(`submissions-get`)
  .description(`Read one submission`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms/submissions", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`submissions-update`)
  .description(`Update a submission (inbox status)`)
  .option(`--id <id>`, ``)
  .option(`--data <data>`, `The submitted values, keyed by field name.`)
  .option(`--form-_id <form-_id>`, `The form this submission belongs to.`)
  .option(`--form-_slug <form-_slug>`, `Denormalised form slug for convenient filtering.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--source <source>`, `Origin of the submission (page URL or surface).`)
  .option(`--status <status>`, `Inbox status: new → read → archived | spam. Default 'new'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, data, form_id, form_slug, metadata, source, status } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms/submissions", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`delete`)
  .description(`Delete a form including its submissions`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`forms delete`);
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
  .command(`get`)
  .description(`Read one form`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`update`)
  .description(`Update a form (definition, settings, status)`)
  .option(`--id <id>`, ``)
  .option(`--definition [definition...]`, `FormKit schema: an array of node objects rendered verbatim by the storefront.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Human-readable form name.`)
  .option(`--settings <settings>`, `Submit label, success message, notify email, …`)
  .option(`--slug <slug>`, `URL-safe identifier, unique per tenant (e.g. contact, price-request).`)
  .option(`--status <status>`, `Lifecycle: draft (editing) → live (rendered by the storefront) → archived. Default 'draft'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, definition, metadata, name, settings, slug, status } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms", hasLimit: true } },
          ],
          _command,
        );
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
