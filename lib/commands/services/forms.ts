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

export const forms = new Command("forms")
  .description(
    commandDescriptions["forms"] ??
      `Manage forms resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
forms
  .command(`list`)
  .description(`List forms (filter by status/slug)`)
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
          listSpecs,
          _command,
        );
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
registerPromptSpecs(forms.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Human-readable form name.", type: "string", required: true },
  { key: "slug", option: "--slug <slug>", name: "slug", description: "URL-safe identifier, unique per tenant (e.g. contact, price-request).", type: "string", required: true },
  { key: "definition", option: "--definition [definition...]", name: "definition", description: "FormKit schema: an array of node objects rendered verbatim by the storefront.", type: "array", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "settings", option: "--settings <settings>", name: "settings", description: "Submit label, success message, notify email, …", type: "object", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Lifecycle: draft (editing) → live (rendered by the storefront) → archived. Default 'draft'.", type: "string", required: false, enum: ["draft","live","archived"] },
];
forms
  .command(`create`)
  .description(`A definition with more than the tenant's \`max_form_fields\` named inputs (default 60) is refused with 422 — unbounded jsonb rendered verbatim by the storefront is a page nobody can load. Content nodes and step markers are not fields.`)
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
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/forms`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (definition !== undefined) {
          _payload[`definition`] = definition;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (settings !== undefined) {
          _payload[`settings`] = resolveBodyParam(settings);
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
registerPromptSpecs(forms.commands.at(-1)!, createSpecs, { method: "post" });
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
const submissionsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
forms
  .command(`submissions-list`)
  .description(`List submissions (filter by form_id/form_slug/status)`)
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
          submissionsListSpecs,
          _command,
        );
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
registerPromptSpecs(forms.commands.at(-1)!, submissionsListSpecs, { method: "get" });
const submissionsCreateSpecs: PromptSpec[] = [
  { key: "data", option: "--data <data>", name: "data", description: "The submitted values, keyed by field name.", type: "object", required: true },
  { key: "formId", option: "--form-id <form-id>", name: "form_id", description: "The form this submission belongs to.", type: "string", required: true },
  { key: "formSlug", option: "--form-slug <form-slug>", name: "form_slug", description: "Denormalised form slug for convenient filtering.", type: "string", required: true },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Origin of the submission (page URL or surface).", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Inbox status: new → read → archived | spam. Default 'new'.", type: "string", required: false, enum: ["new","read","archived","spam"] },
];
forms
  .command(`submissions-create`)
  .description(`The storefront's path, and the only moment anything is known about a submission, so the tenant's policy is applied here. If honeypot_field names a decoy and the submission filled it in, the field is stripped and spam_handling (flag | reject) decides between storing it as 'spam' and refusing with 422 — and a refusal means no row, so no form.submitted event either. The notification recipient is resolved once (the form's own notify_email, else the tenant's) and stamped into metadata.notify_email / metadata.notify_source, because the row IS the event payload.`)
  .option(`--data <data>`, `The submitted values, keyed by field name.`)
  .option(`--form-id <form-id>`, `The form this submission belongs to.`)
  .option(`--form-slug <form-slug>`, `Denormalised form slug for convenient filtering.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--source <source>`, `Origin of the submission (page URL or surface).`)
  .option(`--status <status>`, `Inbox status: new → read → archived | spam. Default 'new'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { data, formId, formSlug, metadata, source, status } = await promptForMissing(
          _options,
          submissionsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/forms/submissions`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (data !== undefined) {
          _payload[`data`] = resolveBodyParam(data);
        }
        if (formId !== undefined) {
          _payload[`form_id`] = formId;
        }
        if (formSlug !== undefined) {
          _payload[`form_slug`] = formSlug;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
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
registerPromptSpecs(forms.commands.at(-1)!, submissionsCreateSpecs, { method: "post" });
const submissionsPruneSpecs: PromptSpec[] = [
  { key: "dryRun", option: "--dry-run <dry-run>", name: "dry_run", description: "Default TRUE. Nothing is deleted until this is explicitly false.", type: "boolean", required: false },
  { key: "formSlug", option: "--form-slug <form-slug>", name: "form_slug", description: "Narrow the sweep to one form.", type: "string", required: false },
  { key: "olderThanDays", option: "--older-than-days <older-than-days>", name: "older_than_days", description: "Age threshold. Omit to use the tenant's submission_retention_days. A value BELOW that setting is raised to it — the setting is the floor, not a default.", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Narrow the sweep to one inbox status, e.g. 'spam'.", type: "string", required: false, enum: ["new","read","archived","spam"] },
];
forms
  .command(`submissions-prune`)
  .description(`Nothing runs on a timer — an app that quietly deletes a merchant's leads on a schedule nobody watched is the failure mode worth avoiding. This is the only thing that acts on submission_retention_days, it previews unless dry_run is explicitly false, and it deletes at most 500 rows per call (\`remaining\` says whether to call again).`)
  .option(
    `--dry-run [value]`,
    `Default TRUE. Nothing is deleted until this is explicitly false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--form-slug <form-slug>`, `Narrow the sweep to one form.`)
  .option(`--older-than-days <older-than-days>`, `Age threshold. Omit to use the tenant's submission_retention_days. A value BELOW that setting is raised to it — the setting is the floor, not a default.`, parseInteger)
  .option(`--status <status>`, `Narrow the sweep to one inbox status, e.g. 'spam'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { dryRun, formSlug, olderThanDays, status } = await promptForMissing(
          _options,
          submissionsPruneSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/forms/submissions/prune`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (dryRun !== undefined) {
          _payload[`dry_run`] = dryRun;
        }
        if (formSlug !== undefined) {
          _payload[`form_slug`] = formSlug;
        }
        if (olderThanDays !== undefined) {
          _payload[`older_than_days`] = olderThanDays;
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
registerPromptSpecs(forms.commands.at(-1)!, submissionsPruneSpecs, { method: "post" });
const submissionsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms/submissions", hasLimit: true } },
];
forms
  .command(`submissions-delete`)
  .description(`Delete a submission`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          submissionsDeleteSpecs,
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
registerPromptSpecs(forms.commands.at(-1)!, submissionsDeleteSpecs, { method: "delete", destructive: true });
const submissionsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms/submissions", hasLimit: true } },
];
forms
  .command(`submissions-get`)
  .description(`Read one submission`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          submissionsGetSpecs,
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
registerPromptSpecs(forms.commands.at(-1)!, submissionsGetSpecs, { method: "get" });
const submissionsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms/submissions", hasLimit: true } },
  { key: "data", option: "--data <data>", name: "data", description: "The submitted values, keyed by field name.", type: "object", required: false },
  { key: "formId", option: "--form-id <form-id>", name: "form_id", description: "The form this submission belongs to.", type: "string", required: false },
  { key: "formSlug", option: "--form-slug <form-slug>", name: "form_slug", description: "Denormalised form slug for convenient filtering.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Origin of the submission (page URL or surface).", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Inbox status: new → read → archived | spam. Default 'new'.", type: "string", required: false, enum: ["new","read","archived","spam"] },
];
forms
  .command(`submissions-update`)
  .description(`A received submission is a record of what somebody sent. Under submission_edit = 'status_only' (the default) only status and metadata may change; a patch that would alter the submitted data, its form or its timestamp is refused with 403. A patch that merely echoes the stored value back is not a change and passes.`)
  .option(`--id <id>`, ``)
  .option(`--data <data>`, `The submitted values, keyed by field name.`)
  .option(`--form-id <form-id>`, `The form this submission belongs to.`)
  .option(`--form-slug <form-slug>`, `Denormalised form slug for convenient filtering.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--source <source>`, `Origin of the submission (page URL or surface).`)
  .option(`--status <status>`, `Inbox status: new → read → archived | spam. Default 'new'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, data, formId, formSlug, metadata, source, status } = await promptForMissing(
          _options,
          submissionsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/forms/submissions/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (data !== undefined) {
          _payload[`data`] = resolveBodyParam(data);
        }
        if (formId !== undefined) {
          _payload[`form_id`] = formId;
        }
        if (formSlug !== undefined) {
          _payload[`form_slug`] = formSlug;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
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
registerPromptSpecs(forms.commands.at(-1)!, submissionsUpdateSpecs, { method: "put" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
forms
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes. Names: form-statuses, submission-statuses. Fetch one with GET /forms/vocabularies/{name}; a client holding the qualified pair 'forms.<name>' builds that URL from the pair alone.`)
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
          vocabulariesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/forms/vocabularies`;
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
registerPromptSpecs(forms.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["form-statuses","submission-statuses"], resource: { listPath: "/forms/vocabularies", hasLimit: false } },
];
forms
  .command(`vocabularies-get`)
  .description(`The values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift — a value added to the constraint appears here even before anyone labels it, titled from its own key. Values come back in constraint order, which is the order a select should offer. 'closed' says the set is exhaustive. Answers 404 for an unknown name. Names: form-statuses, submission-statuses.`)
  .option(`--name <name>`, `The vocabulary name — the part after the dot in the qualified id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          vocabulariesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/forms/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(forms.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms", hasLimit: true } },
];
forms
  .command(`delete`)
  .description(`\`submissions.form_id\` is ON DELETE CASCADE, so this route would take the whole inbox with the form. The tenant setting form_delete_policy (block | archive | cascade, default 'block') decides: refuse with 409 and the count, archive the form and keep everything, or cascade on purpose. A form with no submissions always deletes.`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
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
registerPromptSpecs(forms.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms", hasLimit: true } },
];
forms
  .command(`get`)
  .description(`Read one form`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
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
registerPromptSpecs(forms.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/forms", hasLimit: true } },
  { key: "definition", option: "--definition [definition...]", name: "definition", description: "FormKit schema: an array of node objects rendered verbatim by the storefront.", type: "array", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Human-readable form name.", type: "string", required: false },
  { key: "settings", option: "--settings <settings>", name: "settings", description: "Submit label, success message, notify email, …", type: "object", required: false },
  { key: "slug", option: "--slug <slug>", name: "slug", description: "URL-safe identifier, unique per tenant (e.g. contact, price-request).", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Lifecycle: draft (editing) → live (rendered by the storefront) → archived. Default 'draft'.", type: "string", required: false, enum: ["draft","live","archived"] },
];
forms
  .command(`update`)
  .description(`The same field ceiling applies, or a form simply grows past it later.`)
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
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/forms/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (definition !== undefined) {
          _payload[`definition`] = definition;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (settings !== undefined) {
          _payload[`settings`] = resolveBodyParam(settings);
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
registerPromptSpecs(forms.commands.at(-1)!, updateSpecs, { method: "put" });
