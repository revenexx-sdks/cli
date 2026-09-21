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

export const customersContacts = new Command("customers-contacts")
  .description(
    commandDescriptions["customersContacts"] ??
      `The PEOPLE inside the buying companies, and everything that happens to one: the contact rows, the activity timeline (\`contact_events\` — a call, a visit, a note, plus this app's own registration decisions), the approve/reject calls that settle a pending registration, and the effective permissions a contact ends up holding. A contact is the unit that logs in — one platform user, one email, one role inside its organization — and a contact without an organization is a standalone buyer, not an error. Both routes that write a timeline entry are here, including the one addressed by an organization id, because every row is keyed by a contact.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const customersContactEventsListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to rows whose `id` is exactly this value. Primary key of the timeline entry.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Filter to one person's timeline.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one company timeline — the whole history, without fanning out over its people.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Filter by entry kind. One of the tenant's own activity types (GET /customers/contact-event-kinds); 'system' is the registration decision trail and is the one a caller may not file.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Filter by event name — registration.submitted | registration.approved | registration.rejected | activity.<kind>. This one IS this app's own vocabulary, not the tenant's.", type: "string", required: false },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "Filter to rows whose `subject` is exactly this value. One line a person can scan in a timeline. Required for an activity; a decision row carries the app's own wording.", type: "string", required: false },
  { key: "actor", option: "--actor <actor>", name: "actor", description: "Filter to rows whose `actor` is exactly this value. Who logged the entry — free text as the client supplied it (operator id or email). Null for a row the app wrote itself.", type: "string", required: false },
  { key: "occurredAt", option: "--occurred-at <occurred-at>", name: "occurred_at", description: "Exact timestamp equality on when it happened — there is no range filter on this API. Use `order=occurred_at.desc` with limit/offset to walk a timeline.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When the row was written. Together with `occurred_at` this is what tells a late entry from a live one.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersContacts
  .command(`customers-contact-events-list`)
  .description(`A contact event is one entry on a customer's timeline: an activity somebody logged (a call, a visit, a meeting, a note) or a registration decision this app recorded itself. Every entry is keyed by a CONTACT and stamped with the organization derived from that contact, so a company's history is one indexed read rather than a join. Append-only — there is no update and no delete, which is what makes it usable as evidence. The activity feed, filtered by whichever column the question needs: \`contact_id\` for one person, \`organization_id\` for a whole company, \`kind\` for one type of activity. \`kind: "system"\` is this app's own registration decision trail (\`registration.submitted\` / \`.approved\` / \`.rejected\`), and no caller may file one of those. Paged with \`limit\`/\`offset\`/\`order\`; newest first is \`order=occurred_at.desc\`.`)
  .option(`--id <id>`, `Filter to rows whose \`id\` is exactly this value. Primary key of the timeline entry.`)
  .option(`--contact-id <contact-id>`, `Filter to one person's timeline.`)
  .option(`--organization-id <organization-id>`, `Filter to one company timeline — the whole history, without fanning out over its people.`)
  .option(`--kind <kind>`, `Filter by entry kind. One of the tenant's own activity types (GET /customers/contact-event-kinds); 'system' is the registration decision trail and is the one a caller may not file.`)
  .option(`--name <name>`, `Filter by event name — registration.submitted | registration.approved | registration.rejected | activity.<kind>. This one IS this app's own vocabulary, not the tenant's.`)
  .option(`--subject <subject>`, `Filter to rows whose \`subject\` is exactly this value. One line a person can scan in a timeline. Required for an activity; a decision row carries the app's own wording.`)
  .option(`--actor <actor>`, `Filter to rows whose \`actor\` is exactly this value. Who logged the entry — free text as the client supplied it (operator id or email). Null for a row the app wrote itself.`)
  .option(`--occurred-at <occurred-at>`, `Exact timestamp equality on when it happened — there is no range filter on this API. Use \`order=occurred_at.desc\` with limit/offset to walk a timeline.`)
  .option(`--created-at <created-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When the row was written. Together with \`occurred_at\` this is what tells a late entry from a live one.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
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
        const { id, contactId, organizationId, kind, name, subject, actor, occurredAt, createdAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          customersContactEventsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_events`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
        }
        if (actor !== undefined) {
          _payload[`actor`] = actor;
        }
        if (occurredAt !== undefined) {
          _payload[`occurred_at`] = occurredAt;
        }
        if (createdAt !== undefined) {
          _payload[`created_at`] = createdAt;
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
registerPromptSpecs(customersContacts.commands.at(-1)!, customersContactEventsListSpecs, { method: "get" });
const customersContactEventsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The contact event to read.", type: "string", required: true, resource: { listPath: "/customers/contact_events", hasLimit: true } },
];
customersContacts
  .command(`customers-contact-events-get`)
  .description(`A contact event is one entry on a customer's timeline: an activity somebody logged (a call, a visit, a meeting, a note) or a registration decision this app recorded itself. Every entry is keyed by a CONTACT and stamped with the organization derived from that contact, so a company's history is one indexed read rather than a join. Append-only — there is no update and no delete, which is what makes it usable as evidence. One timeline entry by id, as it was written. Entries are never edited, so what this answers is what was recorded at the time.`)
  .option(`--id <id>`, `The contact event to read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          customersContactEventsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contact_events/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customersContacts.commands.at(-1)!, customersContactEventsGetSpecs, { method: "get" });
const listSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to exactly one person.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one company's people. The company address book.", type: "string", required: false },
  { key: "email", option: "--email <email>", name: "email", description: "Filter by exact email — the one lookup that is guaranteed to return at most one person, because the address is unique per tenant.", type: "string", required: false },
  { key: "firstName", option: "--first-name <first-name>", name: "first_name", description: "Filter to rows whose `first_name` is exactly this value. Given name. Optional: an ERP import often has only a mailbox.", type: "string", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", description: "Filter to rows whose `last_name` is exactly this value. Family name. Optional for the same reason.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Filter to rows whose `phone` is exactly this value. Direct number of this person, as somebody typed it — free text, no format is enforced or normalized. E.164 is what an integration should send.", type: "string", required: false },
  { key: "jobTitle", option: "--job-title <job-title>", name: "job_title", description: "Filter to rows whose `job_title` is exactly this value. What this person does at the company — free text on purpose, because it is a title and not a grant. The permission ladder is `role`; overloading a job title with authority silently un-grants everyone the day the ledger is enforced.", type: "string", required: false },
  { key: "role", option: "--role <role>", name: "role", description: "Filter by role. One of the tenant's own roles (GET /customers/roles) — a tenant that never edited the ledger has viewer, requester, buyer, approver, admin.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Filter by status.", type: "string", required: false, enum: ["invited","active","blocked"] },
  { key: "orderApprovalLimit", option: "--order-approval-limit <order-approval-limit>", name: "order_approval_limit", description: "Filter to rows whose `order_approval_limit` is exactly this value. Amount ceiling for this person, in the market's currency: with the `orders.approve` permission it is the most they may sign off. Null means no ceiling. An amount, never a grant — the grant comes from the role.", type: "number", required: false },
  { key: "registrationStatus", option: "--registration-status <registration-status>", name: "registration_status", description: "Filter by registration state. `pending` IS the approval inbox — there is no second entity for it.", type: "string", required: false, enum: ["pending","approved","rejected"] },
  { key: "registrationDecidedAt", option: "--registration-decided-at <registration-decided-at>", name: "registration_decided_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When a merchant approved or rejected the application. Null while nobody has decided.", type: "string", required: false },
  { key: "registrationDecidedBy", option: "--registration-decided-by <registration-decided-by>", name: "registration_decided_by", description: "Filter to rows whose `registration_decided_by` is exactly this value. Who decided — free text as the deciding client supplied it (an operator id or an email address), not a resolvable user reference.", type: "string", required: false },
  { key: "registrationReason", option: "--registration-reason <registration-reason>", name: "registration_reason", description: "Filter to rows whose `registration_reason` is exactly this value. Why the application was declined. Always recorded here; whether the APPLICANT is ever told it is the tenant's `registration_reason_disclosed` setting, because that is a legal decision and not a template one.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "Filter to rows whose `locale` is exactly this value. The language this person is written to in — BCP 47, and one of the store's configured locales. Null falls back to the store default.", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "Filter to the primary contacts — with `organization_id`, the one person a merchant calls first at that company.", type: "boolean", required: false },
  { key: "externalUserId", option: "--external-user-id <external-user-id>", name: "external_user_id", description: "Find the contact behind a platform user id. What a storefront session resolves with when it has an auth id and needs the customer record.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Filter to rows whose `external_id` is exactly this value. Id of this person in the system the record came from — an ERP contact number, a CRM id. Nullable, because a contact created in the shop has none and never will, and unique per tenant where it is set, which is what lets a repeated import find the row it wrote last time instead of adding a second one. Distinct from `external_user_id`, which points at the platform account: this one points OUT of the platform.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When this person record was created in this app.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact timestamp equality — this API has no range filter. To bound a period, sort with `order` and page. When any column of this row last changed.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
customersContacts
  .command(`list`)
  .description(`A contact is a PERSON, and the unit that logs in: one platform user, one email address, one role held inside its organization. A contact without an organization is a standalone buyer rather than an error, and two people at the same company are two contacts sharing an \`organization_id\`. The people list, and the read behind an approval queue: \`registration_status=pending\` is every application waiting for a decision. Every column is a filter — \`external_user_id\` in particular is how a storefront turns a platform auth id back into a customer — and the page is \`limit\`/\`offset\`/\`order\`.`)
  .option(`--id <id>`, `Filter to exactly one person.`)
  .option(`--organization-id <organization-id>`, `Filter to one company's people. The company address book.`)
  .option(`--email <email>`, `Filter by exact email — the one lookup that is guaranteed to return at most one person, because the address is unique per tenant.`)
  .option(`--first-name <first-name>`, `Filter to rows whose \`first_name\` is exactly this value. Given name. Optional: an ERP import often has only a mailbox.`)
  .option(`--last-name <last-name>`, `Filter to rows whose \`last_name\` is exactly this value. Family name. Optional for the same reason.`)
  .option(`--phone <phone>`, `Filter to rows whose \`phone\` is exactly this value. Direct number of this person, as somebody typed it — free text, no format is enforced or normalized. E.164 is what an integration should send.`)
  .option(`--job-title <job-title>`, `Filter to rows whose \`job_title\` is exactly this value. What this person does at the company — free text on purpose, because it is a title and not a grant. The permission ladder is \`role\`; overloading a job title with authority silently un-grants everyone the day the ledger is enforced.`)
  .option(`--role <role>`, `Filter by role. One of the tenant's own roles (GET /customers/roles) — a tenant that never edited the ledger has viewer, requester, buyer, approver, admin.`)
  .option(`--status <status>`, `Filter by status.`)
  .option(`--order-approval-limit <order-approval-limit>`, `Filter to rows whose \`order_approval_limit\` is exactly this value. Amount ceiling for this person, in the market's currency: with the \`orders.approve\` permission it is the most they may sign off. Null means no ceiling. An amount, never a grant — the grant comes from the role.`, parseInteger)
  .option(`--registration-status <registration-status>`, `Filter by registration state. \`pending\` IS the approval inbox — there is no second entity for it.`)
  .option(`--registration-decided-at <registration-decided-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When a merchant approved or rejected the application. Null while nobody has decided.`)
  .option(`--registration-decided-by <registration-decided-by>`, `Filter to rows whose \`registration_decided_by\` is exactly this value. Who decided — free text as the deciding client supplied it (an operator id or an email address), not a resolvable user reference.`)
  .option(`--registration-reason <registration-reason>`, `Filter to rows whose \`registration_reason\` is exactly this value. Why the application was declined. Always recorded here; whether the APPLICANT is ever told it is the tenant's \`registration_reason_disclosed\` setting, because that is a legal decision and not a template one.`)
  .option(`--locale <locale>`, `Filter to rows whose \`locale\` is exactly this value. The language this person is written to in — BCP 47, and one of the store's configured locales. Null falls back to the store default.`)
  .option(
    `--is-primary [value]`,
    `Filter to the primary contacts — with \`organization_id\`, the one person a merchant calls first at that company.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--external-user-id <external-user-id>`, `Find the contact behind a platform user id. What a storefront session resolves with when it has an auth id and needs the customer record.`)
  .option(`--external-id <external-id>`, `Filter to rows whose \`external_id\` is exactly this value. Id of this person in the system the record came from — an ERP contact number, a CRM id. Nullable, because a contact created in the shop has none and never will, and unique per tenant where it is set, which is what lets a repeated import find the row it wrote last time instead of adding a second one. Distinct from \`external_user_id\`, which points at the platform account: this one points OUT of the platform.`)
  .option(`--created-at <created-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When this person record was created in this app.`)
  .option(`--updated-at <updated-at>`, `Exact timestamp equality — this API has no range filter. To bound a period, sort with \`order\` and page. When any column of this row last changed.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
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
        const { id, organizationId, email, firstName, lastName, phone, jobTitle, role, status, orderApprovalLimit, registrationStatus, registrationDecidedAt, registrationDecidedBy, registrationReason, locale, isPrimary, externalUserId, externalId, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (firstName !== undefined) {
          _payload[`first_name`] = firstName;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (jobTitle !== undefined) {
          _payload[`job_title`] = jobTitle;
        }
        if (role !== undefined) {
          _payload[`role`] = role;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (orderApprovalLimit !== undefined) {
          _payload[`order_approval_limit`] = orderApprovalLimit;
        }
        if (registrationStatus !== undefined) {
          _payload[`registration_status`] = registrationStatus;
        }
        if (registrationDecidedAt !== undefined) {
          _payload[`registration_decided_at`] = registrationDecidedAt;
        }
        if (registrationDecidedBy !== undefined) {
          _payload[`registration_decided_by`] = registrationDecidedBy;
        }
        if (registrationReason !== undefined) {
          _payload[`registration_reason`] = registrationReason;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (isPrimary !== undefined) {
          _payload[`is_primary`] = isPrimary;
        }
        if (externalUserId !== undefined) {
          _payload[`external_user_id`] = externalUserId;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
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
registerPromptSpecs(customersContacts.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "email", option: "--email <email>", name: "email", description: "Login identity and the unique key of a person within the tenant. Changing it changes the platform login with it. Two people at the same company therefore need two addresses — a shared purchasing mailbox is one contact, not several.", type: "string", required: true },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Id of this person in the system the record came from — an ERP contact number, a CRM id. Nullable, because a contact created in the shop has none and never will, and unique per tenant where it is set, which is what lets a repeated import find the row it wrote last time instead of adding a second one. Distinct from `external_user_id`, which points at the platform account: this one points OUT of the platform. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.", type: "string", required: false },
  { key: "firstName", option: "--first-name <first-name>", name: "first_name", description: "Given name. Optional: an ERP import often has only a mailbox.", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "The main contact of its organization — who a merchant calls first. At most one per company is the intent; the tenant's `primary_contact_required` setting decides whether the last one may be demoted or deleted.", type: "boolean", required: false },
  { key: "jobTitle", option: "--job-title <job-title>", name: "job_title", description: "What this person does at the company — free text on purpose, because it is a title and not a grant. The permission ladder is `role`; overloading a job title with authority silently un-grants everyone the day the ledger is enforced.", type: "string", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", description: "Family name. Optional for the same reason.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "The language this person is written to in — BCP 47, and one of the store's configured locales. Null falls back to the store default.", type: "string", required: false },
  { key: "orderApprovalLimit", option: "--order-approval-limit <order-approval-limit>", name: "order_approval_limit", description: "Amount ceiling for this person, in the market's currency: with the `orders.approve` permission it is the most they may sign off. Null means no ceiling. An amount, never a grant — the grant comes from the role.", type: "number", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company this person belongs to. NULL is a legitimate state, not a defect: a standalone buyer with no company behind them. Deleting the organization sets this null and keeps the person. Membership is mirrored to the platform team.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Direct number of this person, as somebody typed it — free text, no format is enforced or normalized. E.164 is what an integration should send.", type: "string", required: false },
  { key: "registrationStatus", option: "--registration-status <registration-status>", name: "registration_status", description: "Where this person's own application stands: 'approved' (the default, and what an open store creates), 'pending' while a merchant has yet to decide, 'rejected' once they declined. Only the approve/reject routes move it; it is ignored on an ordinary update. On CREATE only, and only to file the contact as an application: 'pending' creates the platform user disabled and routes the contact through approve/reject. Ignored on update.", type: "string", required: false, enum: ["pending","approved"] },
  { key: "role", option: "--role <role>", name: "role", description: "The person's role INSIDE its organization, and the only thing permissions are derived from. One of the tenant's own roles (GET /customers/roles); a tenant that never edited the ledger has viewer, requester, buyer, approver, admin. Also the team role on the platform mirror. There is no global role — the same person in two companies is two contacts. A tenant that never edited the ledger has viewer, requester, buyer, approver, admin; a create without a role gets the one flagged as default, and a role the tenant does not keep is a 400.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Whether this person may act: 'invited' has been created but has not accepted, 'active' works, 'blocked' cannot log in. A create through the API defaults to 'invited'; a self-registration in an open store lands 'active'. Default 'invited' on create.", type: "string", required: false, enum: ["invited","active","blocked"] },
];
customersContacts
  .command(`create`)
  .description(`A contact is a PERSON, and the unit that logs in: one platform user, one email address, one role held inside its organization. A contact without an organization is a standalone buyer rather than an error, and two people at the same company are two contacts sharing an \`organization_id\`. Creates the person and their platform login together, so a contact that exists can always sign in. \`role\` names one of this tenant's own roles and decides what they may do; \`registration_status\` may only be set to \`pending\` or \`approved\` here, because a rejection has to carry a reason and that is the reject route's job. \`email\` is the only field a create cannot omit; everything else is optional or defaulted by the database. Two rows of this tenant may not share \`email\` or \`external_user_id\` (while external_user_id IS NOT NULL).`)
  .option(`--email <email>`, `Login identity and the unique key of a person within the tenant. Changing it changes the platform login with it. Two people at the same company therefore need two addresses — a shared purchasing mailbox is one contact, not several.`)
  .option(`--external-id <external-id>`, `Id of this person in the system the record came from — an ERP contact number, a CRM id. Nullable, because a contact created in the shop has none and never will, and unique per tenant where it is set, which is what lets a repeated import find the row it wrote last time instead of adding a second one. Distinct from \`external_user_id\`, which points at the platform account: this one points OUT of the platform. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.`)
  .option(`--first-name <first-name>`, `Given name. Optional: an ERP import often has only a mailbox.`)
  .option(
    `--is-primary [value]`,
    `The main contact of its organization — who a merchant calls first. At most one per company is the intent; the tenant's \`primary_contact_required\` setting decides whether the last one may be demoted or deleted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--job-title <job-title>`, `What this person does at the company — free text on purpose, because it is a title and not a grant. The permission ladder is \`role\`; overloading a job title with authority silently un-grants everyone the day the ledger is enforced.`)
  .option(`--last-name <last-name>`, `Family name. Optional for the same reason.`)
  .option(`--locale <locale>`, `The language this person is written to in — BCP 47, and one of the store's configured locales. Null falls back to the store default.`)
  .option(`--order-approval-limit <order-approval-limit>`, `Amount ceiling for this person, in the market's currency: with the \`orders.approve\` permission it is the most they may sign off. Null means no ceiling. An amount, never a grant — the grant comes from the role.`, parseInteger)
  .option(`--organization-id <organization-id>`, `The company this person belongs to. NULL is a legitimate state, not a defect: a standalone buyer with no company behind them. Deleting the organization sets this null and keeps the person. Membership is mirrored to the platform team.`)
  .option(`--phone <phone>`, `Direct number of this person, as somebody typed it — free text, no format is enforced or normalized. E.164 is what an integration should send.`)
  .option(`--registration-status <registration-status>`, `Where this person's own application stands: 'approved' (the default, and what an open store creates), 'pending' while a merchant has yet to decide, 'rejected' once they declined. Only the approve/reject routes move it; it is ignored on an ordinary update. On CREATE only, and only to file the contact as an application: 'pending' creates the platform user disabled and routes the contact through approve/reject. Ignored on update.`)
  .option(`--role <role>`, `The person's role INSIDE its organization, and the only thing permissions are derived from. One of the tenant's own roles (GET /customers/roles); a tenant that never edited the ledger has viewer, requester, buyer, approver, admin. Also the team role on the platform mirror. There is no global role — the same person in two companies is two contacts. A tenant that never edited the ledger has viewer, requester, buyer, approver, admin; a create without a role gets the one flagged as default, and a role the tenant does not keep is a 400.`)
  .option(`--status <status>`, `Whether this person may act: 'invited' has been created but has not accepted, 'active' works, 'blocked' cannot log in. A create through the API defaults to 'invited'; a self-registration in an open store lands 'active'. Default 'invited' on create.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { email, externalId, firstName, isPrimary, jobTitle, lastName, locale, orderApprovalLimit, organizationId, phone, registrationStatus, role, status } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (firstName !== undefined) {
          _payload[`first_name`] = firstName;
        }
        if (isPrimary !== undefined) {
          _payload[`is_primary`] = isPrimary;
        }
        if (jobTitle !== undefined) {
          _payload[`job_title`] = jobTitle;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (orderApprovalLimit !== undefined) {
          _payload[`order_approval_limit`] = orderApprovalLimit;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (registrationStatus !== undefined) {
          _payload[`registration_status`] = registrationStatus;
        }
        if (role !== undefined) {
          _payload[`role`] = role;
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
registerPromptSpecs(customersContacts.commands.at(-1)!, createSpecs, { method: "post" });
const eventsCreateSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person the entry is about. The organization is derived from them.", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "One line a person can scan in a timeline. Required — an entry nobody can read at a glance is not worth the row.", type: "string", required: true },
  { key: "actor", option: "--actor <actor>", name: "actor", description: "Who logged it (operator id or email). Free text; this app does not resolve it.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "What happened. 'system' is deliberately NOT accepted — those rows are the registration decision trail and are written by the approve/reject routes. Default 'note'.", type: "string", required: false, enum: ["note","call","email","meeting","visit","task"] },
  { key: "note", option: "--note <note>", name: "note", description: "The long form. Stored inside the event payload as `note`, not as a column of its own.", type: "string", required: false },
  { key: "occurredAt", option: "--occurred-at <occurred-at>", name: "occurred_at", description: "When it actually happened. Defaults to now — a call logged on Monday about Friday should say Friday.", type: "string", required: false },
];
customersContacts
  .command(`events-create`)
  .description(`This is how a call, a visit, a meeting, an email or a plain note reaches one person's timeline. It writes a contact_events row with kind != 'system' and emits contact_event.created, so an activity travels on the same bus as a registration decision and a timeline is one query rather than a union. organization_id is DERIVED from the contact, never taken from the body — an activity cannot be filed under a company the person does not belong to.`)
  .option(`--contact-id <contact-id>`, `The person the entry is about. The organization is derived from them.`)
  .option(`--subject <subject>`, `One line a person can scan in a timeline. Required — an entry nobody can read at a glance is not worth the row.`)
  .option(`--actor <actor>`, `Who logged it (operator id or email). Free text; this app does not resolve it.`)
  .option(`--kind <kind>`, `What happened. 'system' is deliberately NOT accepted — those rows are the registration decision trail and are written by the approve/reject routes. Default 'note'.`)
  .option(`--note <note>`, `The long form. Stored inside the event payload as \`note\`, not as a column of its own.`)
  .option(`--occurred-at <occurred-at>`, `When it actually happened. Defaults to now — a call logged on Monday about Friday should say Friday.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, subject, actor, kind, note, occurredAt } = await promptForMissing(
          _options,
          eventsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/events`.replace(`{contact_id}`, contactId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (actor !== undefined) {
          _payload[`actor`] = actor;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (occurredAt !== undefined) {
          _payload[`occurred_at`] = occurredAt;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
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
registerPromptSpecs(customersContacts.commands.at(-1)!, eventsCreateSpecs, { method: "post" });
const inviteSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person being told. They are already a member — this only sends the message.", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
  { key: "url", option: "--url <url>", name: "url", description: "Where the invitation points — the storefront sign-in, normally. There is no token in it: the person is already a member and only has to sign in.", type: "string", required: true },
  { key: "invitedBy", option: "--invited-by <invited-by>", name: "invited_by", description: "Who did the inviting, as the recipient should read it. Absent, the company name is used — \"Beispiel GmbH invited you\" reads better than the name of somebody they have never heard of.", type: "string", required: false },
];
customersContacts
  .command(`invite`)
  .description(`Tell somebody they were added to a company. A deliberate act rather than a side effect of creating the contact: a merchant entering a colleague from a business card is not always ready to mail them, and "added" and "told" are different decisions. No secret travels — the platform team membership is confirmed as it is created, so there is nothing to accept; the message says "you are in, here is the way in". Unlike the auth mails, a failure here IS a failure: the identity service sends nothing for this occasion, so this is the only message the person gets.`)
  .option(`--contact-id <contact-id>`, `The person being told. They are already a member — this only sends the message.`)
  .option(`--url <url>`, `Where the invitation points — the storefront sign-in, normally. There is no token in it: the person is already a member and only has to sign in.`)
  .option(`--invited-by <invited-by>`, `Who did the inviting, as the recipient should read it. Absent, the company name is used — "Beispiel GmbH invited you" reads better than the name of somebody they have never heard of.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, url, invitedBy } = await promptForMissing(
          _options,
          inviteSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/invite`.replace(`{contact_id}`, contactId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (invitedBy !== undefined) {
          _payload[`invited_by`] = invitedBy;
        }
        if (url !== undefined) {
          _payload[`url`] = url;
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
registerPromptSpecs(customersContacts.commands.at(-1)!, inviteSpecs, { method: "post" });
const permissionsSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person whose grants are being read.", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
];
customersContacts
  .command(`permissions`)
  .description(`Computed from contacts.role on every call — the grants are never persisted, so this always reflects the role the contact holds right now.`)
  .option(`--contact-id <contact-id>`, `The person whose grants are being read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId } = await promptForMissing(
          _options,
          permissionsSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/permissions`.replace(`{contact_id}`, contactId);
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
registerPromptSpecs(customersContacts.commands.at(-1)!, permissionsSpecs, { method: "get" });
const customersRegistrationsApproveSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The applicant. It is the CONTACT that is approved — the organization it founded is unblocked with it.", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
  { key: "decidedBy", option: "--decided-by <decided-by>", name: "decided_by", description: "Who approved it — recorded on the contact and carried in the event. Free text (operator id or email); this app does not resolve it.", type: "string", required: false },
];
customersContacts
  .command(`customers-registrations-approve`)
  .description(`Only reachable for a contact whose registration_status is 'pending' or 'rejected' (approving a rejection reinstates it). Enables the platform user FIRST — the password the applicant chose at submit time works immediately, no new credential is issued — then sets registration_status='approved' and status='active', and un-blocks the organization this registration itself founded. Approving an already-approved registration is a no-op that emits nothing, so a retry is safe. Writes a contact_events row named 'registration.approved'.`)
  .option(`--contact-id <contact-id>`, `The applicant. It is the CONTACT that is approved — the organization it founded is unblocked with it.`)
  .option(`--decided-by <decided-by>`, `Who approved it — recorded on the contact and carried in the event. Free text (operator id or email); this app does not resolve it.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, decidedBy } = await promptForMissing(
          _options,
          customersRegistrationsApproveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/registration/approve`.replace(`{contact_id}`, contactId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (decidedBy !== undefined) {
          _payload[`decided_by`] = decidedBy;
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
registerPromptSpecs(customersContacts.commands.at(-1)!, customersRegistrationsApproveSpecs, { method: "post" });
const customersRegistrationsRejectSpecs: PromptSpec[] = [
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The applicant being declined.", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
  { key: "reason", option: "--reason <reason>", name: "reason", description: "Why the application was declined. Always stored on the contact. It only reaches the APPLICANT when the tenant's registration_reason_disclosed setting is on — the event payload then carries it, and so does the 403 the login answers.", type: "string", required: true },
  { key: "decidedBy", option: "--decided-by <decided-by>", name: "decided_by", description: "Who rejected it — recorded on the contact and carried in the event.", type: "string", required: false },
];
customersContacts
  .command(`customers-registrations-reject`)
  .description(`Only reachable from 'pending'. Sets registration_status='rejected' and status='blocked', keeps the platform user in place but disabled — the email must not fall free for a silent second identity, and the merchant keeps the record. Delete the contact to remove both. 'reason' is mandatory and is stored on the contact plus carried in the event payload, so the applicant can be told why. Rejecting an already-rejected registration is a no-op. Writes a contact_events row named 'registration.rejected'.`)
  .option(`--contact-id <contact-id>`, `The applicant being declined.`)
  .option(`--reason <reason>`, `Why the application was declined. Always stored on the contact. It only reaches the APPLICANT when the tenant's registration_reason_disclosed setting is on — the event payload then carries it, and so does the 403 the login answers.`)
  .option(`--decided-by <decided-by>`, `Who rejected it — recorded on the contact and carried in the event.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contactId, reason, decidedBy } = await promptForMissing(
          _options,
          customersRegistrationsRejectSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{contact_id}/registration/reject`.replace(`{contact_id}`, contactId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (decidedBy !== undefined) {
          _payload[`decided_by`] = decidedBy;
        }
        if (reason !== undefined) {
          _payload[`reason`] = reason;
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
registerPromptSpecs(customersContacts.commands.at(-1)!, customersRegistrationsRejectSpecs, { method: "post" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The contact to delete.", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
];
customersContacts
  .command(`delete`)
  .description(`A contact is a PERSON, and the unit that logs in: one platform user, one email address, one role held inside its organization. A contact without an organization is a standalone buyer rather than an error, and two people at the same company are two contacts sharing an \`organization_id\`. Removes the person and their platform login, so they can no longer sign in anywhere. Their company keeps trading; use \`status: "blocked"\` instead when the intent is to stop one person without erasing what they did. Deleting one takes every \`contact_events\` and \`addresses\` row that points at it with it — the foreign keys decide, not this route.`)
  .option(`--id <id>`, `The contact to delete.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`customers-contacts delete`);
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customersContacts.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The contact to read.", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
];
customersContacts
  .command(`get`)
  .description(`A contact is a PERSON, and the unit that logs in: one platform user, one email address, one role held inside its organization. A contact without an organization is a standalone buyer rather than an error, and two people at the same company are two contacts sharing an \`organization_id\`. One person by id. What they are ALLOWED to do is not in here: permissions are derived from \`role\` at read time and answered by \`GET /customers/contacts/{contact_id}/permissions\`.`)
  .option(`--id <id>`, `The contact to read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(customersContacts.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The contact to update.", type: "string", required: true, resource: { listPath: "/customers/contacts", hasLimit: true } },
  { key: "email", option: "--email <email>", name: "email", description: "Login identity and the unique key of a person within the tenant. Changing it changes the platform login with it. Two people at the same company therefore need two addresses — a shared purchasing mailbox is one contact, not several.", type: "string", required: false },
  { key: "externalId", option: "--external-id <external-id>", name: "external_id", description: "Id of this person in the system the record came from — an ERP contact number, a CRM id. Nullable, because a contact created in the shop has none and never will, and unique per tenant where it is set, which is what lets a repeated import find the row it wrote last time instead of adding a second one. Distinct from `external_user_id`, which points at the platform account: this one points OUT of the platform. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.", type: "string", required: false },
  { key: "firstName", option: "--first-name <first-name>", name: "first_name", description: "Given name. Optional: an ERP import often has only a mailbox.", type: "string", required: false },
  { key: "isPrimary", option: "--is-primary <is-primary>", name: "is_primary", description: "The main contact of its organization — who a merchant calls first. At most one per company is the intent; the tenant's `primary_contact_required` setting decides whether the last one may be demoted or deleted.", type: "boolean", required: false },
  { key: "jobTitle", option: "--job-title <job-title>", name: "job_title", description: "What this person does at the company — free text on purpose, because it is a title and not a grant. The permission ladder is `role`; overloading a job title with authority silently un-grants everyone the day the ledger is enforced.", type: "string", required: false },
  { key: "lastName", option: "--last-name <last-name>", name: "last_name", description: "Family name. Optional for the same reason.", type: "string", required: false },
  { key: "locale", option: "--locale <locale>", name: "locale", description: "The language this person is written to in — BCP 47, and one of the store's configured locales. Null falls back to the store default.", type: "string", required: false },
  { key: "orderApprovalLimit", option: "--order-approval-limit <order-approval-limit>", name: "order_approval_limit", description: "Amount ceiling for this person, in the market's currency: with the `orders.approve` permission it is the most they may sign off. Null means no ceiling. An amount, never a grant — the grant comes from the role.", type: "number", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company this person belongs to. NULL is a legitimate state, not a defect: a standalone buyer with no company behind them. Deleting the organization sets this null and keeps the person. Membership is mirrored to the platform team.", type: "string", required: false },
  { key: "phone", option: "--phone <phone>", name: "phone", description: "Direct number of this person, as somebody typed it — free text, no format is enforced or normalized. E.164 is what an integration should send.", type: "string", required: false },
  { key: "registrationStatus", option: "--registration-status <registration-status>", name: "registration_status", description: "Where this person's own application stands: 'approved' (the default, and what an open store creates), 'pending' while a merchant has yet to decide, 'rejected' once they declined. Only the approve/reject routes move it; it is ignored on an ordinary update. On CREATE only, and only to file the contact as an application: 'pending' creates the platform user disabled and routes the contact through approve/reject. Ignored on update.", type: "string", required: false, enum: ["pending","approved"] },
  { key: "role", option: "--role <role>", name: "role", description: "The person's role INSIDE its organization, and the only thing permissions are derived from. One of the tenant's own roles (GET /customers/roles); a tenant that never edited the ledger has viewer, requester, buyer, approver, admin. Also the team role on the platform mirror. There is no global role — the same person in two companies is two contacts. A tenant that never edited the ledger has viewer, requester, buyer, approver, admin; a create without a role gets the one flagged as default, and a role the tenant does not keep is a 400.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Whether this person may act: 'invited' has been created but has not accepted, 'active' works, 'blocked' cannot log in. A create through the API defaults to 'invited'; a self-registration in an open store lands 'active'. Default 'invited' on create.", type: "string", required: false, enum: ["invited","active","blocked"] },
];
customersContacts
  .command(`update`)
  .description(`A contact is a PERSON, and the unit that logs in: one platform user, one email address, one role held inside its organization. A contact without an organization is a standalone buyer rather than an error, and two people at the same company are two contacts sharing an \`organization_id\`. A partial update — send only what changes. \`external_user_id\` and every \`registration_*\` column are ignored: the link to platform auth is mirror-managed, and registration state is only ever moved by the approve and reject routes, which record why. Two rows of this tenant may not share \`email\` or \`external_user_id\` (while external_user_id IS NOT NULL).`)
  .option(`--id <id>`, `The contact to update.`)
  .option(`--email <email>`, `Login identity and the unique key of a person within the tenant. Changing it changes the platform login with it. Two people at the same company therefore need two addresses — a shared purchasing mailbox is one contact, not several.`)
  .option(`--external-id <external-id>`, `Id of this person in the system the record came from — an ERP contact number, a CRM id. Nullable, because a contact created in the shop has none and never will, and unique per tenant where it is set, which is what lets a repeated import find the row it wrote last time instead of adding a second one. Distinct from \`external_user_id\`, which points at the platform account: this one points OUT of the platform. Writable, so a record can be adopted or a wrong id corrected — but it is the key a repeated import matches on, so changing it on a row an import owns makes the next run create a second one rather than update this.`)
  .option(`--first-name <first-name>`, `Given name. Optional: an ERP import often has only a mailbox.`)
  .option(
    `--is-primary [value]`,
    `The main contact of its organization — who a merchant calls first. At most one per company is the intent; the tenant's \`primary_contact_required\` setting decides whether the last one may be demoted or deleted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--job-title <job-title>`, `What this person does at the company — free text on purpose, because it is a title and not a grant. The permission ladder is \`role\`; overloading a job title with authority silently un-grants everyone the day the ledger is enforced.`)
  .option(`--last-name <last-name>`, `Family name. Optional for the same reason.`)
  .option(`--locale <locale>`, `The language this person is written to in — BCP 47, and one of the store's configured locales. Null falls back to the store default.`)
  .option(`--order-approval-limit <order-approval-limit>`, `Amount ceiling for this person, in the market's currency: with the \`orders.approve\` permission it is the most they may sign off. Null means no ceiling. An amount, never a grant — the grant comes from the role.`, parseInteger)
  .option(`--organization-id <organization-id>`, `The company this person belongs to. NULL is a legitimate state, not a defect: a standalone buyer with no company behind them. Deleting the organization sets this null and keeps the person. Membership is mirrored to the platform team.`)
  .option(`--phone <phone>`, `Direct number of this person, as somebody typed it — free text, no format is enforced or normalized. E.164 is what an integration should send.`)
  .option(`--registration-status <registration-status>`, `Where this person's own application stands: 'approved' (the default, and what an open store creates), 'pending' while a merchant has yet to decide, 'rejected' once they declined. Only the approve/reject routes move it; it is ignored on an ordinary update. On CREATE only, and only to file the contact as an application: 'pending' creates the platform user disabled and routes the contact through approve/reject. Ignored on update.`)
  .option(`--role <role>`, `The person's role INSIDE its organization, and the only thing permissions are derived from. One of the tenant's own roles (GET /customers/roles); a tenant that never edited the ledger has viewer, requester, buyer, approver, admin. Also the team role on the platform mirror. There is no global role — the same person in two companies is two contacts. A tenant that never edited the ledger has viewer, requester, buyer, approver, admin; a create without a role gets the one flagged as default, and a role the tenant does not keep is a 400.`)
  .option(`--status <status>`, `Whether this person may act: 'invited' has been created but has not accepted, 'active' works, 'blocked' cannot log in. A create through the API defaults to 'invited'; a self-registration in an open store lands 'active'. Default 'invited' on create.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, email, externalId, firstName, isPrimary, jobTitle, lastName, locale, orderApprovalLimit, organizationId, phone, registrationStatus, role, status } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/contacts/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (email !== undefined) {
          _payload[`email`] = email;
        }
        if (externalId !== undefined) {
          _payload[`external_id`] = externalId;
        }
        if (firstName !== undefined) {
          _payload[`first_name`] = firstName;
        }
        if (isPrimary !== undefined) {
          _payload[`is_primary`] = isPrimary;
        }
        if (jobTitle !== undefined) {
          _payload[`job_title`] = jobTitle;
        }
        if (lastName !== undefined) {
          _payload[`last_name`] = lastName;
        }
        if (locale !== undefined) {
          _payload[`locale`] = locale;
        }
        if (orderApprovalLimit !== undefined) {
          _payload[`order_approval_limit`] = orderApprovalLimit;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (phone !== undefined) {
          _payload[`phone`] = phone;
        }
        if (registrationStatus !== undefined) {
          _payload[`registration_status`] = registrationStatus;
        }
        if (role !== undefined) {
          _payload[`role`] = role;
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
registerPromptSpecs(customersContacts.commands.at(-1)!, updateSpecs, { method: "put" });
const customersOrganizationsEventsCreateSpecs: PromptSpec[] = [
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The company the entry is filed under. The `contact_id` in the body has to belong to it.", type: "string", required: true },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "The person dealt with. Must be a contact of this organization.", type: "string", required: true },
  { key: "subject", option: "--subject <subject>", name: "subject", description: "One line a person can scan in a timeline. Required — an entry nobody can read at a glance is not worth the row.", type: "string", required: true },
  { key: "actor", option: "--actor <actor>", name: "actor", description: "Who logged it (operator id or email). Free text; this app does not resolve it.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "What happened. 'system' is deliberately NOT accepted — those rows are the registration decision trail and are written by the approve/reject routes. Default 'note'.", type: "string", required: false, enum: ["note","call","email","meeting","visit","task"] },
  { key: "note", option: "--note <note>", name: "note", description: "The long form. Stored inside the event payload as `note`, not as a column of its own.", type: "string", required: false },
  { key: "occurredAt", option: "--occurred-at <occurred-at>", name: "occurred_at", description: "When it actually happened. Defaults to now — a call logged on Monday about Friday should say Friday.", type: "string", required: false },
];
customersContacts
  .command(`customers-organizations-events-create`)
  .description(`Same row as the contact route, reached from the organization. 'contact_id' is required and must belong to THIS organization — the picker offering the contacts is not filtered, so the membership check here is what stops a call with one company being filed under someone else's person.`)
  .option(`--organization-id <organization-id>`, `The company the entry is filed under. The \`contact_id\` in the body has to belong to it.`)
  .option(`--contact-id <contact-id>`, `The person dealt with. Must be a contact of this organization.`)
  .option(`--subject <subject>`, `One line a person can scan in a timeline. Required — an entry nobody can read at a glance is not worth the row.`)
  .option(`--actor <actor>`, `Who logged it (operator id or email). Free text; this app does not resolve it.`)
  .option(`--kind <kind>`, `What happened. 'system' is deliberately NOT accepted — those rows are the registration decision trail and are written by the approve/reject routes. Default 'note'.`)
  .option(`--note <note>`, `The long form. Stored inside the event payload as \`note\`, not as a column of its own.`)
  .option(`--occurred-at <occurred-at>`, `When it actually happened. Defaults to now — a call logged on Monday about Friday should say Friday.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { organizationId, contactId, subject, actor, kind, note, occurredAt } = await promptForMissing(
          _options,
          customersOrganizationsEventsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/customers/organizations/{organization_id}/events`.replace(`{organization_id}`, organizationId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (actor !== undefined) {
          _payload[`actor`] = actor;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (note !== undefined) {
          _payload[`note`] = note;
        }
        if (occurredAt !== undefined) {
          _payload[`occurred_at`] = occurredAt;
        }
        if (subject !== undefined) {
          _payload[`subject`] = subject;
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
registerPromptSpecs(customersContacts.commands.at(-1)!, customersOrganizationsEventsCreateSpecs, { method: "post" });
