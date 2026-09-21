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
      `Experience Studio Forms App — operator-built forms (contact request, price request, RMA, …) authored as FormKit schemas, plus a submissions inbox. Every submission is a row that emits form.submitted onto the tenant event bus for automations (Integration Studio workflows, email). The form definition is a FormKit schema rendered verbatim by the storefront (cover), so a form built in the Cockpit drops straight into a storefront page.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to one form by id, which answers a one-row page rather than the row — `GET /v1/forms/{id}` is the addressed form of the same read. It exists because it composes: `?id=…&status=live` answers \"is this form live?\" in one call. A value that is not a uuid is refused with 400 `invalid_value`.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Filter to one form by its exact name. Whole-value equality and case-sensitive — there is no substring search on this API.", type: "string", required: false },
  { key: "slug", option: "--slug <slug>", name: "slug", description: "Filter to one form by its slug — unique per tenant, so this is how a storefront resolves a form without knowing its id. `?slug=contact&status=live&limit=1` is the call the cover BFF makes for every rendered form.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Filter to one lifecycle status. `?status=live` is the set the storefront may render; `?status=draft` is what is still being built.", type: "string", required: false, enum: ["draft","live","archived"] },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Filter to forms created at EXACTLY this instant. Equality, not a range: a date alone matches only a row whose timestamp is exactly that, so it selects nothing for a whole day. To read by time, sort instead (`order=created_at.desc`) and page. A value the data plane cannot read as a timestamp is refused with 400 `invalid_value`.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Filter to forms last written at EXACTLY this instant — the same equality-not-range caveat as `created_at`.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size. Default 50; a value above 200 is clamped to 200 rather than refused, and `page.limit` says what was applied.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "How many matching rows to skip. Page N is `offset = (N - 1) * limit`; `page.hasMore` says whether there is a next one.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
forms
  .command(`list`)
  .description(`The catalogue of forms this tenant has authored, a page at a time. A row is the whole form — \`definition\`, \`settings\`, \`status\`, \`slug\` — so a list read is not a summary view that has to be followed by a read per row.

Every column of a form except the three jsonb ones is an exact-match filter, and they combine: \`?slug=contact&status=live&limit=1\` is how the storefront resolves the form for a page, and it is why a page never needs the form's id. The jsonb columns are the deliberate exception — a comparison against \`definition\`, \`settings\` or \`metadata\` can only be equality against the WHOLE document, which matches only for a caller who already holds it, so there is no searching inside a form's fields from here. (Sending one anyway is not a silent failure: \`?definition={}\` is honoured as that whole-document equality, and \`?definition=x\` is refused with 400 \`invalid_value\` naming the parameter.) A query key that is not a filterable column is dropped rather than refused, and the \`filter\` echo in the answer is what tells you which of the two happened: an empty echo beside a query string that carried a filter means the filter was misspelled.

Paging is \`limit\`/\`offset\` with a single-column \`order\`. The default page is 50 and 200 is the ceiling — a larger \`limit\` is clamped rather than refused, and \`page.limit\` reports what was applied — while \`page.total\` is the figure to show a merchant and \`page.hasMore\` answers whether another page follows instead of leaving it to be inferred from a short one. \`order=created_at.desc\` is the newest-first reading an editor wants.`)
  .option(`--id <id>`, `Filter to one form by id, which answers a one-row page rather than the row — \`GET /v1/forms/{id}\` is the addressed form of the same read. It exists because it composes: \`?id=…&status=live\` answers "is this form live?" in one call. A value that is not a uuid is refused with 400 \`invalid_value\`.`)
  .option(`--name <name>`, `Filter to one form by its exact name. Whole-value equality and case-sensitive — there is no substring search on this API.`)
  .option(`--slug <slug>`, `Filter to one form by its slug — unique per tenant, so this is how a storefront resolves a form without knowing its id. \`?slug=contact&status=live&limit=1\` is the call the cover BFF makes for every rendered form.`)
  .option(`--status <status>`, `Filter to one lifecycle status. \`?status=live\` is the set the storefront may render; \`?status=draft\` is what is still being built.`)
  .option(`--created-at <created-at>`, `Filter to forms created at EXACTLY this instant. Equality, not a range: a date alone matches only a row whose timestamp is exactly that, so it selects nothing for a whole day. To read by time, sort instead (\`order=created_at.desc\`) and page. A value the data plane cannot read as a timestamp is refused with 400 \`invalid_value\`.`)
  .option(`--updated-at <updated-at>`, `Filter to forms last written at EXACTLY this instant — the same equality-not-range caveat as \`created_at\`.`)
  .option(`--limit <limit>`, `Page size. Default 50; a value above 200 is clamped to 200 rather than refused, and \`page.limit\` says what was applied.`, parseInteger)
  .option(`--offset <offset>`, `How many matching rows to skip. Page N is \`offset = (N - 1) * limit\`; \`page.hasMore\` says whether there is a next one.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, name, slug, status, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/forms`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (slug !== undefined) {
          _payload[`slug`] = slug;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (updatedAt !== undefined) {
          _payload[`updated_at`] = updatedAt;
        }
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
  { key: "name", option: "--name <name>", name: "name", description: "What this form is called in the Cockpit's form list. Operator-facing only — the storefront never renders it, so renaming a form breaks no page.", type: "string", required: true },
  { key: "slug", option: "--slug <slug>", name: "slug", description: "URL-safe identifier, unique per tenant. This is the name a storefront resolves a form by (`GET /v1/forms?slug=contact&status=live&limit=1`), so it is part of the page's contract: changing it changes which form a page renders. Lower-case letters, digits and inner hyphens. Taken already? That is the 409 — one slug answers for one form.", type: "string", required: true },
  { key: "definition", option: "--definition [definition...]", name: "definition", description: "The form itself: a FormKit schema, held as a flat ARRAY of nodes (it defaults to `[]`, never to an object) and rendered verbatim by the storefront.\n\nRead it as the field list. Every node carrying a non-empty `name` collects one value and writes it into a submission's `data` under exactly that name — the example below produces `{\"company\": …, \"email\": …, \"message\": …}` — while `$el` content nodes and `$rxStep` step markers collect nothing. Order is render order, and a `$rxStep` marker starts a new wizard step.\n\nSee the `FormKitNode` schema for what a node may carry.\n\nOn the way IN a node is any object: this is unconstrained jsonb, FormKit owns the grammar, and the one rule this app applies is the tenant's `max_form_fields` ceiling counted over the nodes with a non-empty `name`. Anything that is not an array at all is a 400.", type: "array", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata on the FORM, which this app neither reads nor writes: yours to key however an integration needs, stored and returned verbatim. (The metadata this app does write is on a SUBMISSION — see `FormSubmissionMetadata`.)", type: "object", required: false },
  { key: "settings", option: "--settings <settings>", name: "settings", description: "Submit label, success message, per-form notify email, post-submit actions, translations — see the `FormSettings` schema for every key that is read. Unconstrained jsonb on the way in: nothing here is required and no key is refused.", type: "object", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Lifecycle. `draft` while it is being built; `live` once the storefront may render it — the cover BFF resolves live forms only, so a draft is a 404 on the storefront and never a broken page; `archived` for a form that is kept for its submissions but no longer offered. Default 'draft'.", type: "string", required: false, enum: ["draft","live","archived"] },
];
forms
  .command(`create`)
  .description(`A form is born a \`draft\` and stays off the storefront until somebody moves it to \`live\`, so creating one is safe: the cover BFF resolves live forms only, and nothing renders until the status says it may. \`definition\` may be omitted entirely — the row is then the empty shell the Form Builder fills in.

\`slug\` is the one field that is not free. It is unique per tenant and it is what a storefront resolves a form by, so a create that reuses one is a 409 rather than a second form answering to the same page — and the collision is often with a form the caller has never opened. \`name\` is operator-facing only and may be anything.

An unbounded definition is a storefront page nobody can load, so the tenant sets a ceiling on how many named inputs one form may declare. Only nodes carrying a non-empty \`name\` count against it: a form with twenty paragraphs of legal text and three inputs is a three-field form. A definition over the ceiling is a 422 and not a 400 — the payload is well formed and would have been accepted under a higher limit — and the body names both the count and the limit.`)
  .option(`--name <name>`, `What this form is called in the Cockpit's form list. Operator-facing only — the storefront never renders it, so renaming a form breaks no page.`)
  .option(`--slug <slug>`, `URL-safe identifier, unique per tenant. This is the name a storefront resolves a form by (\`GET /v1/forms?slug=contact&status=live&limit=1\`), so it is part of the page's contract: changing it changes which form a page renders. Lower-case letters, digits and inner hyphens. Taken already? That is the 409 — one slug answers for one form.`)
  .option(`--definition [definition...]`, `The form itself: a FormKit schema, held as a flat ARRAY of nodes (it defaults to \`[]\`, never to an object) and rendered verbatim by the storefront.

Read it as the field list. Every node carrying a non-empty \`name\` collects one value and writes it into a submission's \`data\` under exactly that name — the example below produces \`{"company": …, "email": …, "message": …}\` — while \`\$el\` content nodes and \`\$rxStep\` step markers collect nothing. Order is render order, and a \`\$rxStep\` marker starts a new wizard step.

See the \`FormKitNode\` schema for what a node may carry.

On the way IN a node is any object: this is unconstrained jsonb, FormKit owns the grammar, and the one rule this app applies is the tenant's \`max_form_fields\` ceiling counted over the nodes with a non-empty \`name\`. Anything that is not an array at all is a 400.`)
  .option(`--metadata <metadata>`, `Free-form metadata on the FORM, which this app neither reads nor writes: yours to key however an integration needs, stored and returned verbatim. (The metadata this app does write is on a SUBMISSION — see \`FormSubmissionMetadata\`.)`)
  .option(`--settings <settings>`, `Submit label, success message, per-form notify email, post-submit actions, translations — see the \`FormSettings\` schema for every key that is read. Unconstrained jsonb on the way in: nothing here is required and no key is refused.`)
  .option(`--status <status>`, `Lifecycle. \`draft\` while it is being built; \`live\` once the storefront may render it — the cover BFF resolves live forms only, so a draft is a 404 on the storefront and never a broken page; \`archived\` for a form that is kept for its submissions but no longer offered. Default 'draft'.`)
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
  .description(`Every tenant starts with one sample form so the Form Builder is never empty and there is a live render and submit target from the first minute — the \`contact\` slug the read examples throughout this document resolve against.

Normally nobody calls it. The same seeding runs on \`app.installed\`, so a tenant that has had the app for more than a moment already has the sample; this route is the manual re-run, for a tenant installed before the sample existed or one that removed it and wants it back.

It is idempotent, and keyed on the SLUG rather than on content: a slug that is already taken is left exactly as it stands, so a sample form the merchant has since rewritten is never overwritten and a second call creates nothing at all. The answer says which of the two happened, slug by slug — \`created\` names what this call wrote, \`existing\` what was already there — and on a settled tenant \`created\` is empty.`)
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
  { key: "id", option: "--id <id>", name: "id", description: "Filter to one submission by id, as a one-row page. `GET /v1/forms/submissions/{id}` is the addressed form of the same read. A value that is not a uuid is refused with 400 `invalid_value`.", type: "string", required: false },
  { key: "formId", option: "--form-id <form-id>", name: "form_id", description: "Filter to one form's inbox, by id — the reliable one, because it survives a rename of the slug.", type: "string", required: false },
  { key: "formSlug", option: "--form-slug <form-slug>", name: "form_slug", description: "Filter to one form's inbox by slug — the denormalised copy, so neither a join nor a prior lookup of the form is needed.", type: "string", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Filter to one origin, exactly as it was recorded — normally the page path the storefront sent. Whole-value equality, so it selects one page and not a prefix.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Filter to one inbox status. `?status=new` is the unread inbox; `?status=spam` is what the honeypot caught.", type: "string", required: false, enum: ["new","read","archived","spam"] },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Filter to submissions that arrived at EXACTLY this instant. Equality, not a range, so this is not how a date span is read — sort (`order=created_at.desc`) and page for that, and use POST /forms/submissions/prune for anything age-based.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Filter to submissions last written at EXACTLY this instant — the same equality-not-range caveat as `created_at`.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size. Default 50; a value above 200 is clamped to 200 rather than refused, and `page.limit` says what was applied.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "How many matching rows to skip. Page N is `offset = (N - 1) * limit`; `page.hasMore` says whether there is a next one.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
forms
  .command(`submissions-list`)
  .description(`The inbox: every submission this tenant has received, a page at a time. A row is the whole submission, \`data\` included, so the list is the inbox and the detail view at once — nothing has to be fetched per row to show what somebody wrote. Treat all of it as END-USER data.

Every column except the two jsonb ones is an exact-match filter and they combine, so \`?form_slug=contact&status=new&order=created_at.desc\` is the unread inbox of one form, newest first. Two of those filters ask the same question differently: \`form_id\` is the reliable one and survives a rename of the form, while \`form_slug\` is the denormalised copy and needs neither a join nor a prior lookup. What was SUBMITTED is not searchable here — \`data\` is jsonb, and the only comparison available on it is equality against the whole document, which matches only for a caller who already holds the entire submission (\`?data=x\`, not being a JSON document at all, is refused with 400 \`invalid_value\`) — so an inbox search belongs on top of the rows this returns.

Paging is \`limit\`/\`offset\` with a single-column \`order\`: the default page is 50, 200 is the ceiling, and a larger \`limit\` is clamped rather than refused. \`page.total\` is the count to put in front of a merchant while \`page.returned\` is only what fitted on this page, and \`page.hasMore\` says whether to ask for another.`)
  .option(`--id <id>`, `Filter to one submission by id, as a one-row page. \`GET /v1/forms/submissions/{id}\` is the addressed form of the same read. A value that is not a uuid is refused with 400 \`invalid_value\`.`)
  .option(`--form-id <form-id>`, `Filter to one form's inbox, by id — the reliable one, because it survives a rename of the slug.`)
  .option(`--form-slug <form-slug>`, `Filter to one form's inbox by slug — the denormalised copy, so neither a join nor a prior lookup of the form is needed.`)
  .option(`--source <source>`, `Filter to one origin, exactly as it was recorded — normally the page path the storefront sent. Whole-value equality, so it selects one page and not a prefix.`)
  .option(`--status <status>`, `Filter to one inbox status. \`?status=new\` is the unread inbox; \`?status=spam\` is what the honeypot caught.`)
  .option(`--created-at <created-at>`, `Filter to submissions that arrived at EXACTLY this instant. Equality, not a range, so this is not how a date span is read — sort (\`order=created_at.desc\`) and page for that, and use POST /forms/submissions/prune for anything age-based.`)
  .option(`--updated-at <updated-at>`, `Filter to submissions last written at EXACTLY this instant — the same equality-not-range caveat as \`created_at\`.`)
  .option(`--limit <limit>`, `Page size. Default 50; a value above 200 is clamped to 200 rather than refused, and \`page.limit\` says what was applied.`, parseInteger)
  .option(`--offset <offset>`, `How many matching rows to skip. Page N is \`offset = (N - 1) * limit\`; \`page.hasMore\` says whether there is a next one.`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, formId, formSlug, source, status, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          submissionsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/forms/submissions`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (formId !== undefined) {
          _payload[`form_id`] = formId;
        }
        if (formSlug !== undefined) {
          _payload[`form_slug`] = formSlug;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
        }
        if (updatedAt !== undefined) {
          _payload[`updated_at`] = updatedAt;
        }
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
  { key: "submissionData", option: "--submission-data <submission-data>", name: "data", description: "What the visitor typed — the substance of the submission, and the reason this row is the payload of `form.submitted`.\n\nIt is an object keyed by the `name` of the definition node that collected each value, so the keys of a submission are the named nodes of its form's `definition` and nothing else. There is no fixed set of keys across forms: a contact form yields `{name, email, message}`, a price request whatever its operator built.\n\nThe VALUE type follows the input type, which is why this object is not typed further: a `text`, `email` or `textarea` yields a string, a `number` a number, a single `checkbox` a boolean, a `select`/`radio` the chosen option value, a multi-select or a checkbox set an array of them, and a `group` or `list` input nests an object or an array under its own name. Nothing coerces them — a value arrives as the storefront sent it and is stored as jsonb.\n\nTwo values are NOT here: the honeypot field, if the tenant configured one, is stripped before the row is written (it is a trap, not an answer the visitor gave), and the resolved notification recipient lives in `metadata`, not in what somebody typed.", type: "object", required: true },
  { key: "formId", option: "--form-id <form-id>", name: "form_id", description: "The form this submission was made against. It is resolved at insert, so an id no form in this tenant holds is a 404 and nothing is stored — a submission with no form is a lead nobody can read. Required on a create: it is the only thing that says which form was filled in.", type: "string", required: true },
  { key: "formSlug", option: "--form-slug <form-slug>", name: "form_slug", description: "The form's slug as it stood when this submission arrived, copied onto the row: the inbox filters by form without a join, and a submission still says which form collected it after that form has been renamed. It does not outlive a DELETED form — the foreign key cascades and takes the submission with it. On a write the body's value WINS; omit it and the form's own slug is copied in. So: OPTIONAL — send it and it is stored as sent, even if it disagrees with the form; omit it and the form's own slug is filled in from `form_id`.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata, yours to key as an integration needs. The resolved notification recipient is merged OVER it at insert, so `notify_email` and `notify_source` sent here are overwritten — see the `FormSubmissionMetadata` schema.", type: "object", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Where the submission came from. The storefront sends the `window.location.pathname` of the page that carried the form, so this is normally a path rather than an absolute URL; any other surface (an app, an import) puts its own name here. Null when the caller sent none.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Inbox triage. `new` until somebody opens it, then `read`, and `archived` once it is dealt with. `spam` is set by code in exactly one place — the honeypot, and only while the tenant's spam_handling is 'flag'; under 'reject' the submission is never stored at all. Default 'new'. A create may set it — an inbox importer records a submission that is already read — but nothing needs to: omit it and the row is 'new'.", type: "string", required: false, enum: ["new","read","archived","spam"] },
];
forms
  .command(`submissions-create`)
  .description(`The storefront's path, and the moment a lead enters the platform. A stored submission emits \`form.submitted\` onto the tenant event bus with the row itself as the payload — that is the event an Integration Studio workflow or a notification email listens to, and it is the only event this app raises about a submission. A call that is refused therefore leaves no trace anywhere: no row, and no automation that ever hears about it.

It is also the only moment anything is known about a submission, so the tenant's policy is applied here. If honeypot_field names a decoy and the submission filled it in, the field is stripped — it is a trap, not an answer the visitor gave, so it never reaches \`data\` — and spam_handling (flag | reject) decides between storing the row as 'spam' and refusing outright with 422.

The notification recipient is resolved once, here: the form's own notify_email, else the tenant's, stamped into metadata.notify_email with metadata.notify_source naming which of the two won. It is resolved at insert rather than at delivery because the row IS the event payload — a workflow reads the address off the event instead of re-resolving a form's settings that may since have changed.`)
  .option(`--submission-data <submission-data>`, `What the visitor typed — the substance of the submission, and the reason this row is the payload of \`form.submitted\`.

It is an object keyed by the \`name\` of the definition node that collected each value, so the keys of a submission are the named nodes of its form's \`definition\` and nothing else. There is no fixed set of keys across forms: a contact form yields \`{name, email, message}\`, a price request whatever its operator built.

The VALUE type follows the input type, which is why this object is not typed further: a \`text\`, \`email\` or \`textarea\` yields a string, a \`number\` a number, a single \`checkbox\` a boolean, a \`select\`/\`radio\` the chosen option value, a multi-select or a checkbox set an array of them, and a \`group\` or \`list\` input nests an object or an array under its own name. Nothing coerces them — a value arrives as the storefront sent it and is stored as jsonb.

Two values are NOT here: the honeypot field, if the tenant configured one, is stripped before the row is written (it is a trap, not an answer the visitor gave), and the resolved notification recipient lives in \`metadata\`, not in what somebody typed.`)
  .option(`--form-id <form-id>`, `The form this submission was made against. It is resolved at insert, so an id no form in this tenant holds is a 404 and nothing is stored — a submission with no form is a lead nobody can read. Required on a create: it is the only thing that says which form was filled in.`)
  .option(`--form-slug <form-slug>`, `The form's slug as it stood when this submission arrived, copied onto the row: the inbox filters by form without a join, and a submission still says which form collected it after that form has been renamed. It does not outlive a DELETED form — the foreign key cascades and takes the submission with it. On a write the body's value WINS; omit it and the form's own slug is copied in. So: OPTIONAL — send it and it is stored as sent, even if it disagrees with the form; omit it and the form's own slug is filled in from \`form_id\`.`)
  .option(`--metadata <metadata>`, `Free-form metadata, yours to key as an integration needs. The resolved notification recipient is merged OVER it at insert, so \`notify_email\` and \`notify_source\` sent here are overwritten — see the \`FormSubmissionMetadata\` schema.`)
  .option(`--source <source>`, `Where the submission came from. The storefront sends the \`window.location.pathname\` of the page that carried the form, so this is normally a path rather than an absolute URL; any other surface (an app, an import) puts its own name here. Null when the caller sent none.`)
  .option(`--status <status>`, `Inbox triage. \`new\` until somebody opens it, then \`read\`, and \`archived\` once it is dealt with. \`spam\` is set by code in exactly one place — the honeypot, and only while the tenant's spam_handling is 'flag'; under 'reject' the submission is never stored at all. Default 'new'. A create may set it — an inbox importer records a submission that is already read — but nothing needs to: omit it and the row is 'new'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { submissionData, formId, formSlug, metadata, source, status } = await promptForMissing(
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
        if (submissionData !== undefined) {
          _payload[`data`] = resolveBodyParam(submissionData);
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
  { key: "olderThanDays", option: "--older-than-days <older-than-days>", name: "older_than_days", description: "Age threshold. Omit to use the retention floor. A value BELOW the floor is raised to it — the setting is the floor, not a default, and the floor is the LONGEST submission_retention_days configured anywhere in the tenant (see the operation description).", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Narrow the sweep to one inbox status, e.g. 'spam'.", type: "string", required: false, enum: ["new","read","archived","spam"] },
];
forms
  .command(`submissions-prune`)
  .description(`The retention sweep. It deletes submissions the tenant has stopped promising to keep — everything older than \`submission_retention_days\` — and it is the one route in this app that reads that promise at all.

Nothing runs on a timer — an app that quietly deletes a merchant's leads on a schedule nobody watched is the failure mode worth avoiding. This is the only thing that acts on submission_retention_days, it previews unless dry_run is explicitly false, and it deletes at most 500 rows per call (\`remaining\` says whether to call again).

The sweep is TENANT-WIDE and cannot be narrowed to a market. A submission carries no market: there is no such column, and the platform's scope register is written by a best-effort trigger that only fires when the writer sent \`X-Revenexx-Market\` — which the storefront omits whenever the visitor has selected no market, and the Cockpit never sends. So an unassigned row means "nobody recorded it" at least as often as it means "global", and attributing it either way would risk deleting one market's leads on another market's schedule.

\`submission_retention_days\` is per market, because a retention period is a legal answer and the law is territorial. The floor this sweep applies is therefore the STRICTEST one in the tenant — the longest value configured anywhere, baseline or market — and not the one the calling market sees. \`retention_days\` reports it and \`retention_market\` names whose it was. The consequence worth knowing: one market cannot prune on a shorter schedule than another market promised, because the one sweep would take both markets' rows.

The floor is established, never assumed. If the tenant's markets cannot be listed, or a settings read falls back to its declared defaults (which for retention is 0 — no floor at all), the answer is 503 and nothing is deleted.`)
  .option(
    `--dry-run [value]`,
    `Default TRUE. Nothing is deleted until this is explicitly false.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--form-slug <form-slug>`, `Narrow the sweep to one form.`)
  .option(`--older-than-days <older-than-days>`, `Age threshold. Omit to use the retention floor. A value BELOW the floor is raised to it — the setting is the floor, not a default, and the floor is the LONGEST submission_retention_days configured anywhere in the tenant (see the operation description).`, parseInteger)
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
  { key: "id", option: "--id <id>", name: "id", description: "The submission, by id.", type: "string", required: true, resource: { listPath: "/forms/submissions", hasLimit: true } },
];
forms
  .command(`submissions-delete`)
  .description(`Removes one submission permanently. There is no soft delete anywhere in this app — no \`deleted_at\`, no trash, no undo — so the row and the end-user data in it are gone when this answers.

Nothing is emitted when they go. This app publishes \`form.submitted\` on insert and has no delete event, so an automation that already acted on the submission is never told it was withdrawn; if that matters, the withdrawal has to be carried by whatever raised it.

Nothing else is touched: the form keeps its \`definition\` and its other submissions. Reach for this for the one-off — an erasure request, a test row, a duplicate. For the many, use \`POST /v1/forms/submissions/prune\`, which previews before it acts and cannot go below the tenant's \`submission_retention_days\`; that floor does NOT apply here, so this route deletes a submission the retention policy would still be keeping. And if the point is to get a lead out of the inbox rather than out of the database, PUT its \`status\` to \`archived\` instead.`)
  .option(`--id <id>`, `The submission, by id.`)
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
  { key: "id", option: "--id <id>", name: "id", description: "The submission, by id.", type: "string", required: true, resource: { listPath: "/forms/submissions", hasLimit: true } },
];
forms
  .command(`submissions-get`)
  .description(`One received submission, whole — the detail view behind a row of \`GET /v1/forms/submissions\`.

\`data\` is the substance: what the visitor actually typed, keyed by the \`name\` of each node in the form's \`definition\`. Around it are \`source\` (the page that carried the form), the inbox \`status\`, and the \`metadata\` this app stamped at insert — \`notify_email\` and \`notify_source\`, the recipient the \`form.submitted\` event carried, so a workflow and a human reading the inbox see the same answer.

Treat what comes back as END-USER data: a name, an address, an enquiry, whatever the operator asked for. This is also the call the retention preview points at — \`POST /v1/forms/submissions/prune\` deliberately samples only id, form and date, so this route is where you look to see what a sweep would actually take.

What you read here is what was sent: under the shipped \`submission_edit\` policy a PUT may move \`status\` and \`metadata\` and nothing else, so the submitted values, the form and the arrival time are the record rather than a draft.`)
  .option(`--id <id>`, `The submission, by id.`)
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
  { key: "id", option: "--id <id>", name: "id", description: "The submission, by id.", type: "string", required: true, resource: { listPath: "/forms/submissions", hasLimit: true } },
  { key: "submissionData", option: "--submission-data <submission-data>", name: "data", description: "What the visitor typed — the substance of the submission, and the reason this row is the payload of `form.submitted`.\n\nIt is an object keyed by the `name` of the definition node that collected each value, so the keys of a submission are the named nodes of its form's `definition` and nothing else. There is no fixed set of keys across forms: a contact form yields `{name, email, message}`, a price request whatever its operator built.\n\nThe VALUE type follows the input type, which is why this object is not typed further: a `text`, `email` or `textarea` yields a string, a `number` a number, a single `checkbox` a boolean, a `select`/`radio` the chosen option value, a multi-select or a checkbox set an array of them, and a `group` or `list` input nests an object or an array under its own name. Nothing coerces them — a value arrives as the storefront sent it and is stored as jsonb.\n\nTwo values are NOT here: the honeypot field, if the tenant configured one, is stripped before the row is written (it is a trap, not an answer the visitor gave), and the resolved notification recipient lives in `metadata`, not in what somebody typed.", type: "object", required: false },
  { key: "formId", option: "--form-id <form-id>", name: "form_id", description: "The form this submission was made against. It is resolved at insert, so an id no form in this tenant holds is a 404 and nothing is stored — a submission with no form is a lead nobody can read. Required on a create: it is the only thing that says which form was filled in.", type: "string", required: false },
  { key: "formSlug", option: "--form-slug <form-slug>", name: "form_slug", description: "The form's slug as it stood when this submission arrived, copied onto the row: the inbox filters by form without a join, and a submission still says which form collected it after that form has been renamed. It does not outlive a DELETED form — the foreign key cascades and takes the submission with it. On a write the body's value WINS; omit it and the form's own slug is copied in. So: OPTIONAL — send it and it is stored as sent, even if it disagrees with the form; omit it and the form's own slug is filled in from `form_id`.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata, yours to key as an integration needs. The resolved notification recipient is merged OVER it at insert, so `notify_email` and `notify_source` sent here are overwritten — see the `FormSubmissionMetadata` schema.", type: "object", required: false },
  { key: "source", option: "--source <source>", name: "source", description: "Where the submission came from. The storefront sends the `window.location.pathname` of the page that carried the form, so this is normally a path rather than an absolute URL; any other surface (an app, an import) puts its own name here. Null when the caller sent none.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Inbox triage. `new` until somebody opens it, then `read`, and `archived` once it is dealt with. `spam` is set by code in exactly one place — the honeypot, and only while the tenant's spam_handling is 'flag'; under 'reject' the submission is never stored at all. Default 'new'. A create may set it — an inbox importer records a submission that is already read — but nothing needs to: omit it and the row is 'new'.", type: "string", required: false, enum: ["new","read","archived","spam"] },
];
forms
  .command(`submissions-update`)
  .description(`Triage, not correction. What this route is FOR is moving the inbox \`status\` — 'new' to 'read' as somebody opens the lead, 'archived' once it is dealt with, 'spam' for what the honeypot did not catch — and stamping whatever an integration keeps in \`metadata\`.

A received submission is a record of what somebody sent, so under submission_edit = 'status_only' (the default) those two are the only columns that may move. A patch that would alter the submitted data, its form or its timestamp is refused with 403, and the message names the columns it refused. A patch that merely echoes the stored value back is not a change and passes, so a client that PUTs the whole row still works.

\`updated_at\` moves with the triage, which makes it evidence about the handling and never about the submitted values. And if the point is to get a lead out of the inbox rather than out of the database, this is the route for it: set \`status\` to \`archived\` here instead of reaching for the delete, which is permanent and has no undo.`)
  .option(`--id <id>`, `The submission, by id.`)
  .option(`--submission-data <submission-data>`, `What the visitor typed — the substance of the submission, and the reason this row is the payload of \`form.submitted\`.

It is an object keyed by the \`name\` of the definition node that collected each value, so the keys of a submission are the named nodes of its form's \`definition\` and nothing else. There is no fixed set of keys across forms: a contact form yields \`{name, email, message}\`, a price request whatever its operator built.

The VALUE type follows the input type, which is why this object is not typed further: a \`text\`, \`email\` or \`textarea\` yields a string, a \`number\` a number, a single \`checkbox\` a boolean, a \`select\`/\`radio\` the chosen option value, a multi-select or a checkbox set an array of them, and a \`group\` or \`list\` input nests an object or an array under its own name. Nothing coerces them — a value arrives as the storefront sent it and is stored as jsonb.

Two values are NOT here: the honeypot field, if the tenant configured one, is stripped before the row is written (it is a trap, not an answer the visitor gave), and the resolved notification recipient lives in \`metadata\`, not in what somebody typed.`)
  .option(`--form-id <form-id>`, `The form this submission was made against. It is resolved at insert, so an id no form in this tenant holds is a 404 and nothing is stored — a submission with no form is a lead nobody can read. Required on a create: it is the only thing that says which form was filled in.`)
  .option(`--form-slug <form-slug>`, `The form's slug as it stood when this submission arrived, copied onto the row: the inbox filters by form without a join, and a submission still says which form collected it after that form has been renamed. It does not outlive a DELETED form — the foreign key cascades and takes the submission with it. On a write the body's value WINS; omit it and the form's own slug is copied in. So: OPTIONAL — send it and it is stored as sent, even if it disagrees with the form; omit it and the form's own slug is filled in from \`form_id\`.`)
  .option(`--metadata <metadata>`, `Free-form metadata, yours to key as an integration needs. The resolved notification recipient is merged OVER it at insert, so \`notify_email\` and \`notify_source\` sent here are overwritten — see the \`FormSubmissionMetadata\` schema.`)
  .option(`--source <source>`, `Where the submission came from. The storefront sends the \`window.location.pathname\` of the page that carried the form, so this is normally a path rather than an absolute URL; any other surface (an app, an import) puts its own name here. Null when the caller sent none.`)
  .option(`--status <status>`, `Inbox triage. \`new\` until somebody opens it, then \`read\`, and \`archived\` once it is dealt with. \`spam\` is set by code in exactly one place — the honeypot, and only while the tenant's spam_handling is 'flag'; under 'reject' the submission is never stored at all. Default 'new'. A create may set it — an inbox importer records a submission that is already read — but nothing needs to: omit it and the row is 'new'.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, submissionData, formId, formSlug, metadata, source, status } = await promptForMissing(
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
        if (submissionData !== undefined) {
          _payload[`data`] = resolveBodyParam(submissionData);
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
  .description(`The enums this app publishes, so a client can discover them instead of holding a copy. Names: form-statuses, submission-statuses.

An entry carries the three things a menu needs — the \`name\` a URL is built from, the human \`title\`, and a \`description\` of what the set decides — and deliberately NOT the values. Enough to build a menu, not enough to fill a select: \`GET /forms/vocabularies/{name}\` is the call for that, and a client holding the qualified pair 'forms.<name>' builds that URL from the pair alone, which is what makes reading this index worth more than hard-coding two names.

Both \`title\` and \`description\` come back either as a plain string or as a locale map keyed by language tag; read the tag you want and fall back to \`en\`.`)
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
  .description(`One vocabulary WITH its values: every value the column permits, each carrying the \`key\` the database stores, the \`title\` and \`description\` a human reads, a semantic badge \`tone\`, and a \`final\` flag for the values that end the lifecycle. This is the call that fills a select or renders a status badge. Names: form-statuses, submission-statuses.

The values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift — a value added to the constraint appears here even before anyone labels it, titled from its own key and falling back to \`default_tone\` for its badge. That is the whole reason to come here rather than hard-code three statuses in a UI.

Values come back in constraint order, which is lifecycle order, and therefore the order a select should offer them in. \`closed\` says the set is exhaustive: there is no value outside it this API will accept. \`title\` and \`description\` are each either a plain string or a locale map keyed by language tag — read the tag you want and fall back to \`en\` — and a value nobody has translated is a bare string rather than an error.`)
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
  { key: "id", option: "--id <id>", name: "id", description: "The form, by id.", type: "string", required: true, resource: { listPath: "/forms", hasLimit: true } },
];
forms
  .command(`delete`)
  .description(`Deleting a form deletes every submission it ever received.

\`submissions.form_id\` is ON DELETE CASCADE — the one foreign key on this app's tables — so the inbox goes with the form, in the database, permanently. Nothing is archived on the way out, no event is emitted for the submissions that vanish, and there is no soft delete in this app to recover them from. A submission is an end user's data, which is why this is the first sentence rather than a footnote.

That is what the tenant setting form_delete_policy (block | archive | cascade, default 'block') stands in front of: REFUSE with 409 and the count, ARCHIVE the form and keep everything, or CASCADE on purpose. A form with no submissions always deletes, under every policy.

That setting is the one in this app with ONE value for the whole tenant. The other six are per-market, because what they decide is market-local; this one is not, so \`X-Revenexx-Market\` does not change the answer this route gives. A market that could set 'cascade' for itself would be deleting leads that belong to markets which had said 'block'.

Both the 409 body and the 200 body carry \`submissions\`, the number of rows at stake. It counts the form's WHOLE inbox — every market, not the share belonging to the one a request names — because that is what the cascade takes. It is the only figure a merchant has to judge this by, so read it before allowing the cascade, and \`GET /v1/forms/submissions?form_id=…\` is how to see what they are first.

The policy is a guard on THIS route, not a database constraint: the cascade is what the database does on its own, and a client that removes the row by some other path gets it with nothing in front of it.`)
  .option(`--id <id>`, `The form, by id.`)
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
  { key: "id", option: "--id <id>", name: "id", description: "The form, by id.", type: "string", required: true, resource: { listPath: "/forms", hasLimit: true } },
];
forms
  .command(`get`)
  .description(`The whole form: \`definition\` — the flat FormKit node array the storefront renders verbatim — plus \`settings\`, \`status\` and \`slug\`.

This is the route for an id you are already holding: a submission's \`form_id\`, a row the Cockpit list handed you. A storefront resolving a PAGE does not come here, because it has a slug and not an id — \`GET /v1/forms?slug=contact&status=live&limit=1\` is the call that answers that, and the \`status\` filter is what keeps a half-built form off a live page. There is no filtering on this route at all: a \`draft\` form comes back exactly like a published one, so a caller that must not render a draft has to check \`status\` itself.

Nothing is folded in on the way out. The \`definition\` is returned in the language it was authored in — the per-form \`i18n\` overlay is applied by the storefront BFF, not by this API — and the submissions the form has collected are neither included nor counted here. The inbox for one form is \`GET /v1/forms/submissions?form_id=…\`, and it is worth asking for before a delete: see \`DELETE /v1/forms/{id}\`.`)
  .option(`--id <id>`, `The form, by id.`)
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
  { key: "id", option: "--id <id>", name: "id", description: "The form, by id.", type: "string", required: true, resource: { listPath: "/forms", hasLimit: true } },
  { key: "definition", option: "--definition [definition...]", name: "definition", description: "The form itself: a FormKit schema, held as a flat ARRAY of nodes (it defaults to `[]`, never to an object) and rendered verbatim by the storefront.\n\nRead it as the field list. Every node carrying a non-empty `name` collects one value and writes it into a submission's `data` under exactly that name — the example below produces `{\"company\": …, \"email\": …, \"message\": …}` — while `$el` content nodes and `$rxStep` step markers collect nothing. Order is render order, and a `$rxStep` marker starts a new wizard step.\n\nSee the `FormKitNode` schema for what a node may carry.\n\nOn the way IN a node is any object: this is unconstrained jsonb, FormKit owns the grammar, and the one rule this app applies is the tenant's `max_form_fields` ceiling counted over the nodes with a non-empty `name`. Anything that is not an array at all is a 400.", type: "array", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata on the FORM, which this app neither reads nor writes: yours to key however an integration needs, stored and returned verbatim. (The metadata this app does write is on a SUBMISSION — see `FormSubmissionMetadata`.)", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What this form is called in the Cockpit's form list. Operator-facing only — the storefront never renders it, so renaming a form breaks no page.", type: "string", required: false },
  { key: "settings", option: "--settings <settings>", name: "settings", description: "Submit label, success message, per-form notify email, post-submit actions, translations — see the `FormSettings` schema for every key that is read. Unconstrained jsonb on the way in: nothing here is required and no key is refused.", type: "object", required: false },
  { key: "slug", option: "--slug <slug>", name: "slug", description: "URL-safe identifier, unique per tenant. This is the name a storefront resolves a form by (`GET /v1/forms?slug=contact&status=live&limit=1`), so it is part of the page's contract: changing it changes which form a page renders. Lower-case letters, digits and inner hyphens. Taken already? That is the 409 — one slug answers for one form.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Lifecycle. `draft` while it is being built; `live` once the storefront may render it — the cover BFF resolves live forms only, so a draft is a 404 on the storefront and never a broken page; `archived` for a form that is kept for its submissions but no longer offered. Default 'draft'.", type: "string", required: false, enum: ["draft","live","archived"] },
];
forms
  .command(`update`)
  .description(`A partial update over everything a create may set — \`definition\`, \`settings\`, \`status\`, \`name\`, \`slug\`, \`metadata\` — where an omitted field keeps the value it has. It is the write behind the Form Builder's save, and equally behind the one-field change that publishes a form by moving \`status\` from \`draft\` to \`live\`. \`updated_at\` is stamped on every call, so it is the column an editor sorts by.

The same field ceiling applies as on the create, or a form would simply grow past it later: the tenant's \`max_form_fields\` is counted over the nodes of the NEW \`definition\` that carry a non-empty \`name\`, and a definition above it is refused with 422 rather than stored truncated.

Moving \`slug\` is the edit to think about twice. It is unique per tenant, so a rename onto a slug another form holds is a 409 — but it is the rename that SUCCEEDS that changes behaviour, because the slug is how a storefront page resolves this form: change it and the page naming the old one resolves nothing. The submissions already collected are unaffected either way; each keeps the slug it arrived under in its own \`form_slug\`, which is exactly what that copy is for.`)
  .option(`--id <id>`, `The form, by id.`)
  .option(`--definition [definition...]`, `The form itself: a FormKit schema, held as a flat ARRAY of nodes (it defaults to \`[]\`, never to an object) and rendered verbatim by the storefront.

Read it as the field list. Every node carrying a non-empty \`name\` collects one value and writes it into a submission's \`data\` under exactly that name — the example below produces \`{"company": …, "email": …, "message": …}\` — while \`\$el\` content nodes and \`\$rxStep\` step markers collect nothing. Order is render order, and a \`\$rxStep\` marker starts a new wizard step.

See the \`FormKitNode\` schema for what a node may carry.

On the way IN a node is any object: this is unconstrained jsonb, FormKit owns the grammar, and the one rule this app applies is the tenant's \`max_form_fields\` ceiling counted over the nodes with a non-empty \`name\`. Anything that is not an array at all is a 400.`)
  .option(`--metadata <metadata>`, `Free-form metadata on the FORM, which this app neither reads nor writes: yours to key however an integration needs, stored and returned verbatim. (The metadata this app does write is on a SUBMISSION — see \`FormSubmissionMetadata\`.)`)
  .option(`--name <name>`, `What this form is called in the Cockpit's form list. Operator-facing only — the storefront never renders it, so renaming a form breaks no page.`)
  .option(`--settings <settings>`, `Submit label, success message, per-form notify email, post-submit actions, translations — see the \`FormSettings\` schema for every key that is read. Unconstrained jsonb on the way in: nothing here is required and no key is refused.`)
  .option(`--slug <slug>`, `URL-safe identifier, unique per tenant. This is the name a storefront resolves a form by (\`GET /v1/forms?slug=contact&status=live&limit=1\`), so it is part of the page's contract: changing it changes which form a page renders. Lower-case letters, digits and inner hyphens. Taken already? That is the 409 — one slug answers for one form.`)
  .option(`--status <status>`, `Lifecycle. \`draft\` while it is being built; \`live\` once the storefront may render it — the cover BFF resolves live forms only, so a draft is a 404 on the storefront and never a broken page; \`archived\` for a form that is kept for its submissions but no longer offered. Default 'draft'.`)
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
