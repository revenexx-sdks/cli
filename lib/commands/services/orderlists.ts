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

export const orderlists = new Command("orderlists")
  .description(
    commandDescriptions["orderlists"] ??
      `Commerce Studio Order Lists App — saved, reusable position collections (shopping & label lists) that turn back into a cart or an order in one call. A list is owned by a contact and can be shared across the organization (shared; read-only unless the tenant makes shared lists team-editable). Whole positions are stored: article (product_id/sku), quantity, unit, price, tax rate, cost center, position texts and custom SKU. GET /orderlists returns the owner's own lists union the organization's shared lists; positions are managed as a nested items resource (list / add / bulk-replace / update / remove). POST /orderlists/{id}/cart hands the positions to the carts app, POST /orderlists/{id}/order to the orders app. Both collections answer the platform envelope { items, page, filter } with limit/offset/order.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Exact-match filter on `owner_id`. Every list one contact owns. Ignored when the gateway resolved an acting contact — the scope is then that contact and a query parameter cannot widen it.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Exact-match filter on `organization_id`. The SHARED lists of one organization. Combined with `owner_id` this is a union, not an intersection: own lists ∪ that organization's shared ones.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Filter by list kind — a `code` from GET /orderlists/kinds. A code this tenant does not keep is a 400 naming the ones it does, so this is the one filter here that can fail.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orderlists
  .command(`list`)
  .description(`What a caller may see is a UNION, not an intersection: the lists this contact owns, plus the lists their organization shares — \`owner_id = X OR (organization_id = Y AND shared)\`. A list that satisfies both sides is merged by id and counted once. Where the gateway resolved an acting contact, that contact and their organization ARE the scope and neither \`owner_id\` nor \`organization_id\` in the query can widen it; without a resolved principal — a back-office caller holding the tenant key — the two are read from the query, and a call that names neither sees every list the tenant keeps. Three filters are read in all — \`owner_id\`, \`organization_id\`, \`kind\` — and any OTHER query key is ignored rather than refused, which is what the \`filter\` echo makes visible: a key that is missing there was not applied. When only one side of the predicate is in play the database pages the rows and reports the true total; when both are, each side is read separately and bounded at a thousand rows, merged, and paged after the merge, so \`total\` is the size of the merged set rather than a database count. The default sort is \`updated_at.desc\`, which is why adding a position moves its list to the front of the page. Every row carries \`item_count\`. Without it the only way to render a per-list badge was to read the positions of every list on the page — thousands of rows to draw twenty numbers. The count is bounded the way the page is: at most 200 lists, each capped by the tenant's max_items_per_list.`)
  .option(`--owner-id <owner-id>`, `Exact-match filter on \`owner_id\`. Every list one contact owns. Ignored when the gateway resolved an acting contact — the scope is then that contact and a query parameter cannot widen it.`)
  .option(`--organization-id <organization-id>`, `Exact-match filter on \`organization_id\`. The SHARED lists of one organization. Combined with \`owner_id\` this is a union, not an intersection: own lists ∪ that organization's shared ones.`)
  .option(`--kind <kind>`, `Filter by list kind — a \`code\` from GET /orderlists/kinds. A code this tenant does not keep is a 400 naming the ones it does, so this is the one filter here that can fail.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
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
        const { ownerId, organizationId, kind, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists`;
        const _payload: RequestParams = {};
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
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
registerPromptSpecs(orderlists.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "What the buyer calls this list. Free text, at least one character, and not unique: two contacts may both keep a \"Weekly office supplies\". It is also the name a NEW cart gets when POST /orderlists/{id}/cart creates one.", type: "string", required: true },
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "The contact who owns the list. Ownership IS the authorization here: a caller the gateway resolved to a contact sees their own lists plus their organization's shared ones, and may write only their own — unless `shared_lists_editable` opens a shared list to the whole owning organization. Set once at create; no route moves a list to another owner.", type: "string", required: true },
  { key: "ownerName", option: "--owner-name <owner-name>", name: "owner_name", description: "The owner's display name as it stood when the list was created — a snapshot, so renaming the contact does not rewrite it. Carried so a shared list can say whose it is without a call to the contacts app.", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", description: "Optional initial positions. Every one is validated — and article-checked where `reject_unknown_articles` is on — BEFORE the list row is written, so a rejected position never leaves an empty list behind.", type: "array", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "List kind — the `code` of one of the tenant's own kinds (GET /orderlists/kinds); defaults to the flagged one, or the market's 'default_kind' setting.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data the tenant keeps on the list — an ERP requisition number, a department, whatever an integration needs to recognise the list again. Never read by this app, and never merged: a write replaces the whole document.", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "The organization the sharing is scoped to. Null means the list can only ever be the owner's own: `shared` is meaningless without it, because there is no set of people to share with. It is also what the order conversion hands the orders app as the buying organization.", type: "string", required: false },
  { key: "shared", option: "--shared <shared>", name: "shared", description: "Whether the OWNING ORGANIZATION may see this list. False — the default — keeps it private to `owner_id`, and a foreign private list answers 404 rather than 403, so an outsider learns nothing from the difference. True lets every contact of `organization_id` READ it, and write it only where the tenant turned on the `shared_lists_editable` setting. A list with no `organization_id` shares with nobody however this is set.", type: "boolean", required: false },
];
orderlists
  .command(`create`)
  .description(`Three fields are required, and they are exactly the columns the database will not fill in: \`name\`, \`owner_id\` and \`owner_name\`. Everything else has an answer already — \`kind\` resolves to the caller's value, else the market's \`default_kind\` setting, else the kind the tenant flagged; \`shared\` is false; \`organization_id\` is null, which makes \`shared\` meaningless because there is then nobody to share with. Nothing about a list is unique: one owner may keep two lists with the same name, and the same article may appear in as many lists as the buyer wants. The list may be created empty or pre-filled in the same call: an optional \`items\` array is written as the list's positions with the row, so a twenty-line list is one request rather than a create followed by twenty adds, and the array order is the position order. Those initial \`items\` are normalized and article-checked BEFORE the list row is written, and both caps are checked first as well — the tenant's \`max_items_per_list\` against the array, and its \`max_lists_per_owner\` against what this contact already keeps — so a rejected position never leaves an empty list behind and a contact at their limit is refused before anything is inserted. The owner is set once — no route moves a list to another contact.`)
  .option(`--name <name>`, `What the buyer calls this list. Free text, at least one character, and not unique: two contacts may both keep a "Weekly office supplies". It is also the name a NEW cart gets when POST /orderlists/{id}/cart creates one.`)
  .option(`--owner-id <owner-id>`, `The contact who owns the list. Ownership IS the authorization here: a caller the gateway resolved to a contact sees their own lists plus their organization's shared ones, and may write only their own — unless \`shared_lists_editable\` opens a shared list to the whole owning organization. Set once at create; no route moves a list to another owner.`)
  .option(`--owner-name <owner-name>`, `The owner's display name as it stood when the list was created — a snapshot, so renaming the contact does not rewrite it. Carried so a shared list can say whose it is without a call to the contacts app.`)
  .option(`--items [items...]`, `Optional initial positions. Every one is validated — and article-checked where \`reject_unknown_articles\` is on — BEFORE the list row is written, so a rejected position never leaves an empty list behind.`)
  .option(`--kind <kind>`, `List kind — the \`code\` of one of the tenant's own kinds (GET /orderlists/kinds); defaults to the flagged one, or the market's 'default_kind' setting.`)
  .option(`--metadata <metadata>`, `Free-form data the tenant keeps on the list — an ERP requisition number, a department, whatever an integration needs to recognise the list again. Never read by this app, and never merged: a write replaces the whole document.`)
  .option(`--organization-id <organization-id>`, `The organization the sharing is scoped to. Null means the list can only ever be the owner's own: \`shared\` is meaningless without it, because there is no set of people to share with. It is also what the order conversion hands the orders app as the buying organization.`)
  .option(
    `--shared [value]`,
    `Whether the OWNING ORGANIZATION may see this list. False — the default — keeps it private to \`owner_id\`, and a foreign private list answers 404 rather than 403, so an outsider learns nothing from the difference. True lets every contact of \`organization_id\` READ it, and write it only where the tenant turned on the \`shared_lists_editable\` setting. A list with no \`organization_id\` shares with nobody however this is set.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, ownerId, ownerName, items, kind, metadata, organizationId, shared } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists`;
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
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (ownerName !== undefined) {
          _payload[`owner_name`] = ownerName;
        }
        if (shared !== undefined) {
          _payload[`shared`] = shared;
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
registerPromptSpecs(orderlists.commands.at(-1)!, createSpecs, { method: "post" });
orderlists
  .command(`defaults`)
  .description(`Seeds the two kinds a fresh tenant starts with — \`shopping\` and \`label\` — and gives \`shopping\` the default flag. Idempotent by code: \`created\` names the kinds this call wrote, \`existing\` the ones that were already there and were left exactly as the tenant keeps them, renamed, retoned and reordered included. On a settled tenant \`created\` is empty. It is rarely the call you need — the \`app.installed\` event runs the same seed, and the first read of GET /orderlists/kinds on an empty table seeds before it answers. It never removes a kind and never restores one a merchant deleted.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/defaults`;
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
const kindsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orderlists
  .command(`kinds-list`)
  .description(`What a saved list may be FOR — the tenant's own taxonomy, and the set every \`kind\` on a list is drawn from. This used to be a CHECK constraint, which meant a merchant who keeps reagent lists or sample lists needed a release of this app to say so — and the app never branched on the value, it only checked membership. The set is the tenant's rows now. Reading this route on a tenant that has none seeds them, so it never answers an empty set on a fresh install and a client may treat the first read as the install step it no longer has to make. Rows come back in \`position\` order, ascending, which is the order a select should offer them in, and each carries the \`is_default\` flag that decides what a create with no \`kind\` falls back to. It takes NO filters: \`limit\` and \`offset\` are the only query keys it reads, and any other is ignored rather than refused — which is also why this collection alone answers no \`filter\` echo, since echoing an empty one would be noise. The \`code\` on each row, not the \`id\`, is what \`lists.kind\` stores and what \`?kind=\` on GET /orderlists matches.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { limit, offset, filter } = await promptForMissing(
          _options,
          kindsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds`;
        const _payload: RequestParams = {};
        if (limit !== undefined) {
          _payload[`limit`] = limit;
        }
        if (offset !== undefined) {
          _payload[`offset`] = offset;
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsListSpecs, { method: "get" });
const kindsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "What `lists.kind` will store. Lowercased on the way in and immutable afterwards — a merchant who wants a different code creates a new kind and moves the lists over.", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", description: "What a person reads. `labels` adds the localized forms on top; this one is the fallback.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "What this kind is for, in one sentence — the line a select shows under the title.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions, keyed by language tag.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this kind; the previous default is demoted.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles, keyed by language tag.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where the kind sits in a select, ascending. Omitted means 0, which puts it first among the unpositioned.", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour. The client owns what each tone looks like; omitted means `neutral`.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
orderlists
  .command(`kinds-create`)
  .description(`Adds a kind to the tenant's own taxonomy — reagent lists, sample lists, whatever a merchant sorts their saved lists by — without a release of this app, because nothing here branches on the value. \`code\` and \`title\` are required, and they are exactly the two columns of \`list_kinds\` the database will not fill in. The code is lowercased on the way in and immutable afterwards: renaming it would orphan every list carrying it, since a list stores the code and not the id. \`is_default: true\` promotes the new kind and demotes whoever held the flag. Creating a kind changes no existing list.`)
  .option(`--code <code>`, `What \`lists.kind\` will store. Lowercased on the way in and immutable afterwards — a merchant who wants a different code creates a new kind and moves the lists over.`)
  .option(`--title <title>`, `What a person reads. \`labels\` adds the localized forms on top; this one is the fallback.`)
  .option(`--description <description>`, `What this kind is for, in one sentence — the line a select shows under the title.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions, keyed by language tag.`)
  .option(
    `--is-default [value]`,
    `Promote this kind; the previous default is demoted.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles, keyed by language tag.`)
  .option(`--position <position>`, `Where the kind sits in a select, ascending. Omitted means 0, which puts it first among the unpositioned.`, parseInteger)
  .option(`--tone <tone>`, `Semantic badge colour. The client owns what each tone looks like; omitted means \`neutral\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          kindsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsCreateSpecs, { method: "post" });
const kindsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The list kind, by id.", type: "string", required: true, resource: { listPath: "/orderlists/kinds", hasLimit: true } },
];
orderlists
  .command(`kinds-delete`)
  .description(`There is no foreign key behind \`lists.kind\` — it is a plain text column holding a code, and nothing in the database points at \`list_kinds\` — so this route's own 409 is the whole of the referential integrity. It reads whether any list still carries the code and refuses if one does, and refuses again when this is the last kind left, because a list must have one. Nothing cascades and no list is rewritten. Two gaps the guard leaves: it is a read followed by a delete with no lock between them, so a list written with the code in that window survives it; and the market-scoped \`default_kind\` SETTING is neither consulted nor cleared, so deleting the kind it names leaves the setting pointing at nothing while creates fall through to whichever kind holds the default flag. A list that does end up naming a code nothing defines is not broken, only stranded: it is still returned by GET /orderlists and GET /orderlists/{id} carrying the bare code, the vocabulary no longer offers that value so a UI renders the code itself, \`?kind=\` refuses it with a 400 naming the codes that remain, and the way back is PUT /orderlists/{id} with a kind the tenant keeps. Deleting the flag-holder hands the flag to the first remaining kind. The answer is the \`code\`, not the \`{deleted, id}\` the other deletes here return.`)
  .option(`--id <id>`, `The list kind, by id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          kindsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`orderlists kinds-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsDeleteSpecs, { method: "delete", destructive: true });
const kindsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The list kind, by id.", type: "string", required: true, resource: { listPath: "/orderlists/kinds", hasLimit: true } },
];
orderlists
  .command(`kinds-get`)
  .description(`One kind, by the id this route takes. The \`code\` is the OTHER identity and the one that matters to the data: \`lists.kind\` stores the code and never this id, so a list is joined to its kind by code while every /orderlists/kinds/{id} route is addressed by uuid. A fresh tenant starts with two — \`shopping\` and \`label\`, seeded on install — and everything beyond them is the merchant's own. A kind seeded before 0.15.0 may hold a serialized locale map in \`title\` and \`description\` where plain text belongs; those rows were left as they stand, because repairing them is a data change.`)
  .option(`--id <id>`, `The list kind, by id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          kindsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsGetSpecs, { method: "get" });
const kindsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The list kind, by id.", type: "string", required: true, resource: { listPath: "/orderlists/kinds", hasLimit: true } },
  { key: "description", option: "--description <description>", name: "description", description: "What this kind is for, in one sentence. Explicit null clears it.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "Localized descriptions, keyed by language tag. Replaces the whole map rather than merging into it.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "True promotes this kind and demotes the previous default — the same move POST /orderlists/kinds/{id}/make-default makes on its own.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized titles, keyed by language tag. Replaces the whole map rather than merging into it.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Where the kind sits in a select, ascending.", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "What a person reads. A blank title is ignored rather than stored — a kind with no words is unreadable in every UI.", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Semantic badge colour. The client owns what each tone looks like.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
orderlists
  .command(`kinds-update`)
  .description(`Everything a kind has except its code: the title a person reads, the sentence underneath it, the localized forms of both, the badge tone, and where it sits in a select. The code is not among them and cannot be reached from here at all: sending a different one is a 400 rather than a silent no-op, because \`lists.kind\` stores the code and a rename would orphan every list that carries it with no foreign key to stop it. So a rename is never how a list comes to name a code nothing defines — only a delete can do that. Renaming the TITLE touches no list, for the same reason. A blank title is ignored rather than stored; an explicit null clears the description; \`labels\` and \`descriptions\` replace the whole map rather than merging into it. \`is_default: true\` makes the same move POST /orderlists/kinds/{id}/make-default makes on its own. A system kind is editable like any other.`)
  .option(`--id <id>`, `The list kind, by id.`)
  .option(`--description <description>`, `What this kind is for, in one sentence. Explicit null clears it.`)
  .option(`--descriptions <descriptions>`, `Localized descriptions, keyed by language tag. Replaces the whole map rather than merging into it.`)
  .option(
    `--is-default [value]`,
    `True promotes this kind and demotes the previous default — the same move POST /orderlists/kinds/{id}/make-default makes on its own.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized titles, keyed by language tag. Replaces the whole map rather than merging into it.`)
  .option(`--position <position>`, `Where the kind sits in a select, ascending.`, parseInteger)
  .option(`--title <title>`, `What a person reads. A blank title is ignored rather than stored — a kind with no words is unreadable in every UI.`)
  .option(`--tone <tone>`, `Semantic badge colour. The client owns what each tone looks like.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          kindsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds/{id}`.replace(`{id}`, id);
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
        if (descriptions !== undefined) {
          _payload[`descriptions`] = resolveBodyParam(descriptions);
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (title !== undefined) {
          _payload[`title`] = title;
        }
        if (tone !== undefined) {
          _payload[`tone`] = tone;
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsUpdateSpecs, { method: "put" });
const kindsMakeDefaultSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The list kind, by id.", type: "string", required: true, resource: { listPath: "/orderlists/kinds", hasLimit: true } },
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
orderlists
  .command(`kinds-make-default`)
  .description(`One call MOVES the flag: the kind in the path is promoted and whoever held the flag before is demoted in the same request, because the flag is a single answer and not a per-row opinion. It is what a list created without a kind falls back to, so two defaults leave the result to row order and none leaves it to whatever sorts first — which is exactly why promotion and demotion cannot be two calls a client makes in sequence. PUT with is_default already moved it, but only as a side effect of an edit, and a client promoting and then demoting by hand produces those two broken states whenever one of the pair does not land. Every kind the tenant keeps is walked, and only the rows whose flag is wrong are written — the new default if it was not already set, the old one if it was — so the call costs at most two writes and repeating it costs none, which makes it safe to retry. The kind's other fields are untouched and no existing list is rewritten: lists that already name a kind keep it, since the flag decides only what a FUTURE create with no \`kind\` resolves to. The market-scoped \`default_kind\` setting still wins where it is set; this flag is the tenant-wide answer underneath it.`)
  .option(`--id <id>`, `The list kind, by id.`)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, data } = await promptForMissing(
          _options,
          kindsMakeDefaultSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/kinds/{id}/make-default`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (data !== undefined) {
          Object.assign(_payload, resolveBodyParam(data));
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
registerPromptSpecs(orderlists.commands.at(-1)!, kindsMakeDefaultSpecs, { method: "post" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orderlists
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes, and nothing more: every enum this app publishes, each as a name plus the words a person reads for it — its title and its description — and never the values, which are one call further down at GET /orderlists/vocabularies/{name}. It exists so that a client holding a qualified pair like 'orderlists.kinds' can build that URL from the pair alone and keep no copy of an enum of its own. Names: kinds. The split is deliberate rather than an economy: the set of NAMES is fixed by a release of this app, so a client may cache this answer for as long as it caches the contract, while the values under 'kinds' are the tenant's own rows and change without a release — which is why this route says nothing about them and why a UI building a select must make the second call rather than read the values off here. Title and description come back either as a plain string or as a locale map keyed by language tag, so a client reads the tag it wants and falls back to \`en\` — the same shape every localized field in this app carries.`)
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
        const _apiPath = `/orderlists/vocabularies`;
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
registerPromptSpecs(orderlists.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["kinds"], resource: { listPath: "/orderlists/vocabularies", hasLimit: false } },
];
orderlists
  .command(`vocabularies-get`)
  .description(`One named enum with every value it permits, and enough about each value to render it without a second source: the \`key\` the database stores and enforces, the title and the description a person reads, and the semantic badge \`tone\` a UI colours it with — which is why no client needs a colour map of its own, and why the Cockpit's hand-kept one could go. A value that names no tone of its own inherits the vocabulary's \`default_tone\`, so the field is never empty. 'kinds' is table-backed: the tenant's own rows ARE the value set, so a value they added appears here without a release of this app, and each value carries its \`labels\`, \`descriptions\` and the \`is_default\` flag besides. Values come back in \`position\` order, which is the order a select should offer. 'closed' says the set is exhaustive at this moment, so a value outside it is stale data rather than a missing label — what changed with the move to a table is WHO may extend it, not whether the set is closed. \`source\` says which: 'schema' where a CHECK constraint owns the values, 'table' where the tenant's rows do. Names: kinds.`)
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
        const _apiPath = `/orderlists/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(orderlists.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The order list, by id.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
];
orderlists
  .command(`delete`)
  .description(`Takes every position with it, in the database: \`items.list_id\` is the app's only foreign key and it is ON DELETE CASCADE, and the handler removes the positions explicitly first besides. Nothing survives the list, there is no soft delete and no undo — and the answer carries no count, so read the list (or its \`item_count\`) BEFORE the call if you need to know how much went. What it does NOT take is what the list has already produced: a cart line or an order position built by the conversions carries \`order_list_id\`, \`order_list_name\` and \`order_list_item_id\` in its snapshot, and those are jsonb values inside another app rather than foreign keys — ADR-0055 forbids a cross-app FK, so nothing cascades there and nothing is nulled. The cart and the order are unharmed, because every position was copied as a snapshot rather than referenced; the provenance link is what dangles, permanently.`)
  .option(`--id <id>`, `The order list, by id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`orderlists delete`);
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The order list, by id.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
];
orderlists
  .command(`get`)
  .description(`The whole list in one call: the row plus every position inline, in \`position\` order, up to a thousand of them. The nested positions collection exists to CHANGE the positions, not to page them, so this is the read a detail view makes. Reading is wider than writing here — an acting contact sees their own lists and their organization's shared ones, and a list that is neither answers 404 rather than 403, so an outsider learns nothing from the difference. The row carries the dead \`public\` column next to \`shared\`; read \`shared\`.`)
  .option(`--id <id>`, `The order list, by id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The order list, by id.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "List kind — the `code` of one of the tenant's own kinds (GET /orderlists/kinds); defaults to the flagged one, or the market's 'default_kind' setting.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data the tenant keeps on the list — an ERP requisition number, a department, whatever an integration needs to recognise the list again. Never read by this app, and never merged: a write replaces the whole document.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "What the buyer calls this list. Free text, at least one character, and not unique: two contacts may both keep a \"Weekly office supplies\". It is also the name a NEW cart gets when POST /orderlists/{id}/cart creates one.", type: "string", required: false },
  { key: "shared", option: "--shared <shared>", name: "shared", description: "Whether the OWNING ORGANIZATION may see this list. False — the default — keeps it private to `owner_id`, and a foreign private list answers 404 rather than 403, so an outsider learns nothing from the difference. True lets every contact of `organization_id` READ it, and write it only where the tenant turned on the `shared_lists_editable` setting. A list with no `organization_id` shares with nobody however this is set.", type: "boolean", required: false },
];
orderlists
  .command(`update`)
  .description(`Rename, share or reclassify — the whole of what a list says about itself, plus \`metadata\`. Positions go through the items routes and the owner cannot be changed by anything. \`shared\` is what the column \`public\` was renamed to in June 2026; \`public\` is still on the wire because the provisioner is additive, is false on every row written since, and says nothing about who may see the list. One trap: a \`kind\` this tenant does not keep is IGNORED rather than refused, so the list quietly keeps the kind it had and a client that cares must read the answer back. An empty body is a 400 rather than a no-op.`)
  .option(`--id <id>`, `The order list, by id.`)
  .option(`--kind <kind>`, `List kind — the \`code\` of one of the tenant's own kinds (GET /orderlists/kinds); defaults to the flagged one, or the market's 'default_kind' setting.`)
  .option(`--metadata <metadata>`, `Free-form data the tenant keeps on the list — an ERP requisition number, a department, whatever an integration needs to recognise the list again. Never read by this app, and never merged: a write replaces the whole document.`)
  .option(`--name <name>`, `What the buyer calls this list. Free text, at least one character, and not unique: two contacts may both keep a "Weekly office supplies". It is also the name a NEW cart gets when POST /orderlists/{id}/cart creates one.`)
  .option(
    `--shared [value]`,
    `Whether the OWNING ORGANIZATION may see this list. False — the default — keeps it private to \`owner_id\`, and a foreign private list answers 404 rather than 403, so an outsider learns nothing from the difference. True lets every contact of \`organization_id\` READ it, and write it only where the tenant turned on the \`shared_lists_editable\` setting. A list with no \`organization_id\` shares with nobody however this is set.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, kind, metadata, name, shared } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (shared !== undefined) {
          _payload[`shared`] = shared;
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
registerPromptSpecs(orderlists.commands.at(-1)!, updateSpecs, { method: "put" });
const toCartSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The order list, by id.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "cartId", option: "--cart-id <cart-id>", name: "cart_id", description: "Add to this existing cart. Omit to create one for the list owner and make it their current cart.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code for the cart and its lines. Omit to let the carts app decide.", type: "string", required: false },
  { key: "mode", option: "--mode <mode>", name: "mode", description: "'append' adds the positions (the carts app merges a line by product and price, so quantities accumulate); 'replace' makes the list the cart's entire contents. Defaults to the tenant's 'cart_merge_mode' setting.", type: "string", required: false, enum: ["append","replace"] },
];
orderlists
  .command(`to-cart`)
  .description(`The reason a buyer keeps a list at all: every position of the list goes into a cart in one call. The cart is either one the caller names or one this call makes. Sending 'cart_id' adds to that existing cart; omitting it creates a cart for the LIST'S OWNER — not for whoever called — names it after the list, and makes it that owner's current cart, because a cart the buyer cannot see is not 'added to cart'. Which of the two happened is not left to be inferred: \`cart_created\` says so and \`cart_id\` names the cart either way. 'append' (the default, tenant-configurable through \`cart_merge_mode\`) lets the carts app merge each line by product and price so quantities accumulate, and is sent one line at a time precisely because that merge happens on add; 'replace' makes the list the cart's whole contents in one call. What the cart has no column for — cost centre, custom SKU, position texts — rides in each line's snapshot together with the list it came from. The list itself is never touched: it is read, not emptied, so the same list converts again next month. Cross-app: carts.create, carts.items.create, carts.items.replace.`)
  .option(`--id <id>`, `The order list, by id.`)
  .option(`--cart-id <cart-id>`, `Add to this existing cart. Omit to create one for the list owner and make it their current cart.`)
  .option(`--currency <currency>`, `ISO 4217 code for the cart and its lines. Omit to let the carts app decide.`)
  .option(`--mode <mode>`, `'append' adds the positions (the carts app merges a line by product and price, so quantities accumulate); 'replace' makes the list the cart's entire contents. Defaults to the tenant's 'cart_merge_mode' setting.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, cartId, currency, mode } = await promptForMissing(
          _options,
          toCartSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}/cart`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (cartId !== undefined) {
          _payload[`cart_id`] = cartId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (mode !== undefined) {
          _payload[`mode`] = mode;
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
registerPromptSpecs(orderlists.commands.at(-1)!, toCartSpecs, { method: "post" });
const toOrderSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The order list, by id.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code. Omit to let the orders app apply the market default.", type: "string", required: false },
  { key: "customerOrderNumber", option: "--customer-order-number <customer-order-number>", name: "customer_order_number", description: "The BUYER's own order or purchase-order number, forwarded to the orders app verbatim. Free text and never generated here: it exists so the paperwork can carry the number the buyer's accounts payable will look for.", type: "string", required: false },
];
orderlists
  .command(`to-order`)
  .description(`The other half of the reason a list exists — and it is the ORDERS app that does it, over the gateway rather than over a shared table, so everything an order means is that app's answer and not this one's. Places the list's positions as an order: buyer and organization come from the list, the cost centre and the position texts land on the order's own columns, and the list is left exactly as it stands so it can be ordered again next month. The acting contact is re-asserted on the call, so the orders app applies ITS rules to the BUYER rather than to this app — a contact holding only orders.request, or an order above the tenant's approval threshold, comes back with status 'pending' and no placed_at instead of being refused. That pending order is the platform's nearest thing to a draft; the orders app owns the state and this one cannot override it, which is why \`status\` is reported rather than chosen and why the created order is handed back verbatim under \`order\` beside the three fields lifted out of it. Cross-app: orders.place.`)
  .option(`--id <id>`, `The order list, by id.`)
  .option(`--currency <currency>`, `ISO 4217 code. Omit to let the orders app apply the market default.`)
  .option(`--customer-order-number <customer-order-number>`, `The BUYER's own order or purchase-order number, forwarded to the orders app verbatim. Free text and never generated here: it exists so the paperwork can carry the number the buyer's accounts payable will look for.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, currency, customerOrderNumber } = await promptForMissing(
          _options,
          toOrderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}/order`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (customerOrderNumber !== undefined) {
          _payload[`customer_order_number`] = customerOrderNumber;
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
registerPromptSpecs(orderlists.commands.at(-1)!, toOrderSpecs, { method: "post" });
const itemsListSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "Exact-match filter on `id`. The position's own id — the same row GET /orderlists/{list_id}/items/{id} answers, reached through the collection.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Exact-match filter on `product_id`. Every position for one catalogue product.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Exact-match filter on `sku`. One article number as the catalogue knows it.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Exact-match filter on `name`. The saved article name, matched EXACTLY and case-sensitively — this is equality, not a search.", type: "string", required: false },
  { key: "image", option: "--image <image>", name: "image", description: "Exact-match filter on `image`. The snapshotted image URL. Exact match, so this is a reconciliation tool rather than something a person types.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Exact-match filter on `quantity`. An exact quantity, which is a needle-in-a-haystack filter — there is no range filter on this collection.", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "Exact-match filter on `unit`. One unit, in the tenant's own words. Open text, so the value must match what was written.", type: "string", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Exact-match filter on `price`. An exact snapshotted unit price. Equality on a decimal, so it finds the rows written at exactly this price and nothing near it.", type: "number", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", description: "Exact-match filter on `tax_rate`. An exact VAT rate as a percent (19 = 19 %).", type: "number", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", description: "Exact-match filter on `cost_center_id`. Every position booked to one cost centre, as the tenant's ERP names it. The filter a controller uses to see what a department has saved up.", type: "string", required: false },
  { key: "positionTexts", option: "--position-texts <position-texts>", name: "position_texts", description: "Exact-match filter on `position_texts`. The whole notes ARRAY, serialized as JSON — equality on the document, not a search inside it.", type: "string", required: false },
  { key: "customSku", option: "--custom-sku <custom-sku>", name: "custom_sku", description: "Exact-match filter on `custom_sku`. The buyer's own article number. The lookup a B2B buyer actually performs: their purchasing system knows this number and not the shop's.", type: "string", required: false },
  { key: "categorySlug", option: "--category-slug <category-slug>", name: "category_slug", description: "Exact-match filter on `category_slug`. One catalogue category, as a slug.", type: "string", required: false },
  { key: "subcategorySlug", option: "--subcategory-slug <subcategory-slug>", name: "subcategory_slug", description: "Exact-match filter on `subcategory_slug`. One catalogue subcategory, as a slug.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Exact-match filter on `position`. The exact sort position within the list.", type: "integer", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Exact-match filter on `metadata`. The WHOLE metadata document, serialized as JSON — equality, not a key lookup and not a containment query.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact-match filter on `created_at`. The exact creation timestamp. There is no range filter here; sort with `order=created_at.desc` instead.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact-match filter on `updated_at`. The exact timestamp of the last change.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). A larger value is clamped rather than refused.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). Page with `page.total` and `page.hasMore`.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orderlists
  .command(`items-list`)
  .description(`Every column of a position is an exact-match filter — eighteen of them, which is the whole row — and they combine as AND. \`list_id\` is not among them: it comes from the path and overwrites anything the query says. The default sort is \`position.asc\`, and \`position\` is neither dense nor unique: removing a position leaves its number behind while the next add takes the list's current COUNT, so a delete from the middle followed by an add produces two rows sharing a number and the tie falls to whatever the database returns first. Sort by \`created_at\` where the order has to be unambiguous.`)
  .option(`--list-id <list-id>`, `The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.`)
  .option(`--id <id>`, `Exact-match filter on \`id\`. The position's own id — the same row GET /orderlists/{list_id}/items/{id} answers, reached through the collection.`)
  .option(`--product-id <product-id>`, `Exact-match filter on \`product_id\`. Every position for one catalogue product.`)
  .option(`--sku <sku>`, `Exact-match filter on \`sku\`. One article number as the catalogue knows it.`)
  .option(`--name <name>`, `Exact-match filter on \`name\`. The saved article name, matched EXACTLY and case-sensitively — this is equality, not a search.`)
  .option(`--image <image>`, `Exact-match filter on \`image\`. The snapshotted image URL. Exact match, so this is a reconciliation tool rather than something a person types.`)
  .option(`--quantity <quantity>`, `Exact-match filter on \`quantity\`. An exact quantity, which is a needle-in-a-haystack filter — there is no range filter on this collection.`, parseInteger)
  .option(`--unit <unit>`, `Exact-match filter on \`unit\`. One unit, in the tenant's own words. Open text, so the value must match what was written.`)
  .option(`--price <price>`, `Exact-match filter on \`price\`. An exact snapshotted unit price. Equality on a decimal, so it finds the rows written at exactly this price and nothing near it.`, parseInteger)
  .option(`--tax-rate <tax-rate>`, `Exact-match filter on \`tax_rate\`. An exact VAT rate as a percent (19 = 19 %).`, parseInteger)
  .option(`--cost-center-id <cost-center-id>`, `Exact-match filter on \`cost_center_id\`. Every position booked to one cost centre, as the tenant's ERP names it. The filter a controller uses to see what a department has saved up.`)
  .option(`--position-texts <position-texts>`, `Exact-match filter on \`position_texts\`. The whole notes ARRAY, serialized as JSON — equality on the document, not a search inside it.`)
  .option(`--custom-sku <custom-sku>`, `Exact-match filter on \`custom_sku\`. The buyer's own article number. The lookup a B2B buyer actually performs: their purchasing system knows this number and not the shop's.`)
  .option(`--category-slug <category-slug>`, `Exact-match filter on \`category_slug\`. One catalogue category, as a slug.`)
  .option(`--subcategory-slug <subcategory-slug>`, `Exact-match filter on \`subcategory_slug\`. One catalogue subcategory, as a slug.`)
  .option(`--position <position>`, `Exact-match filter on \`position\`. The exact sort position within the list.`, parseInteger)
  .option(`--metadata <metadata>`, `Exact-match filter on \`metadata\`. The WHOLE metadata document, serialized as JSON — equality, not a key lookup and not a containment query.`)
  .option(`--created-at <created-at>`, `Exact-match filter on \`created_at\`. The exact creation timestamp. There is no range filter here; sort with \`order=created_at.desc\` instead.`)
  .option(`--updated-at <updated-at>`, `Exact-match filter on \`updated_at\`. The exact timestamp of the last change.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). A larger value is clamped rather than refused.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). Page with \`page.total\` and \`page.hasMore\`.`, parseInteger)
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
        const { listId, id, productId, sku, name, image, quantity, unit, price, taxRate, costCenterId, positionTexts, customSku, categorySlug, subcategorySlug, position, metadata, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          itemsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (positionTexts !== undefined) {
          _payload[`position_texts`] = positionTexts;
        }
        if (customSku !== undefined) {
          _payload[`custom_sku`] = customSku;
        }
        if (categorySlug !== undefined) {
          _payload[`category_slug`] = categorySlug;
        }
        if (subcategorySlug !== undefined) {
          _payload[`subcategory_slug`] = subcategorySlug;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = metadata;
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsListSpecs, { method: "get" });
const itemsCreateSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "name", option: "--name <name>", name: "name", description: "The article name AS IT WAS when the position was saved. A snapshot on purpose: the list is the buyer's own record, so a renamed or withdrawn article still reads the way they wrote it down.", type: "string", required: true },
  { key: "categorySlug", option: "--category-slug <category-slug>", name: "category_slug", description: "The catalogue category the article sat in when the position was saved, as a slug. Kept so a long list can be grouped the way the shop groups it without a call to the catalogue.", type: "string", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", description: "The cost centre this position books to, as the tenant's ERP names it. Free text and not our enum. It survives into the ORDER position, which has a `cost_center` column; a CART line has none, so the cart conversion carries it in the line snapshot instead.", type: "string", required: false },
  { key: "customSku", option: "--custom-sku <custom-sku>", name: "custom_sku", description: "The buyer's OWN article number for this article — what their purchasing system calls it, which is rarely what the shop calls it. Free text, and the field a B2B buyer searches their own lists by.", type: "string", required: false },
  { key: "image", option: "--image <image>", name: "image", description: "The article image at the time the position was saved, as a URL or a path — a snapshot like `name`, and nothing here refreshes it. It rides into the cart line and the order position in their snapshot, because neither has a column for it.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data the tenant keeps on the position. Never read by this app; it travels into the cart line / order position snapshot untouched. A write replaces the whole document rather than merging into it.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order within the list, ascending — the order the positions collection returns by default and the order the conversions hand the lines over in. Neither dense nor unique: an add with no `position` of its own takes the list's current position COUNT, so removing a position from the middle and adding another leaves two rows sharing a number. A bulk replace assigns the array index the same way, so it renumbers only the positions it is not given explicitly.", type: "integer", required: false },
  { key: "positionTexts", option: "--position-texts [position-texts...]", name: "position_texts", description: "Per-position notes the buyer wrote — an engraving, a delivery instruction, a reference for the picker. An ARRAY OF STRINGS, one entry per line; the order conversion joins them with newlines into the order position's single `position_text`, and the cart conversion carries the array in the line snapshot.", type: "array", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Unit price snapshot — what the buyer saw when they saved the position, in whatever way the catalogue quoted it. It is a record, not a live price: the cart and the order reprice on their own terms, so this never becomes what somebody is charged.", type: "number", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The catalogue product this position stands for. One of `product_id` / `sku` must be set (the database enforces it); this is the identity the products app answers to, and the one `reject_unknown_articles` and the conversions check against.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "How much of the article the list holds. Greater than zero — the database refuses the rest — and fractional to three decimals, because a B2B position may be 2.5 metres or 0.75 kilos.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The article number as the catalogue knows it — the alternative identity to `product_id`, and the one an ERP integration usually joins on.", type: "string", required: false },
  { key: "subcategorySlug", option: "--subcategory-slug <subcategory-slug>", name: "subcategory_slug", description: "The catalogue subcategory, as a slug. Same purpose as `category_slug`, one level down.", type: "string", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", description: "The VAT rate that applied when the position was saved, as a PERCENT (19 = 19 %). Four decimals so a rate like 8.25 % survives; carts and orders document the same field the same way, and the conversion forwards the number unchanged.", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "The unit `quantity` counts in, in the tenant's own words. Deliberately open text and deliberately NOT a vocabulary: a B2B catalogue units in pieces, metres, kilos, rolls and pallets, and any closed list published here would be a guess.", type: "string", required: false },
];
orderlists
  .command(`items-create`)
  .description(`A position is a whole saved line, not a pointer at a product. \`name\` is required and one of \`product_id\` / \`sku\` must be set — the two things the database itself insists on — and everything else is a snapshot of what the buyer saw. Nothing here deduplicates: adding the same article twice makes two positions, because it is the CART that merges lines by product and price, not the list. The new row takes the list's current position COUNT unless the payload names a \`position\` of its own, so it collides with an existing number whenever an earlier position was deleted from the middle. The list's \`updated_at\` is touched, which is what the default sort of GET /orderlists reads.`)
  .option(`--list-id <list-id>`, `The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.`)
  .option(`--name <name>`, `The article name AS IT WAS when the position was saved. A snapshot on purpose: the list is the buyer's own record, so a renamed or withdrawn article still reads the way they wrote it down.`)
  .option(`--category-slug <category-slug>`, `The catalogue category the article sat in when the position was saved, as a slug. Kept so a long list can be grouped the way the shop groups it without a call to the catalogue.`)
  .option(`--cost-center-id <cost-center-id>`, `The cost centre this position books to, as the tenant's ERP names it. Free text and not our enum. It survives into the ORDER position, which has a \`cost_center\` column; a CART line has none, so the cart conversion carries it in the line snapshot instead.`)
  .option(`--custom-sku <custom-sku>`, `The buyer's OWN article number for this article — what their purchasing system calls it, which is rarely what the shop calls it. Free text, and the field a B2B buyer searches their own lists by.`)
  .option(`--image <image>`, `The article image at the time the position was saved, as a URL or a path — a snapshot like \`name\`, and nothing here refreshes it. It rides into the cart line and the order position in their snapshot, because neither has a column for it.`)
  .option(`--metadata <metadata>`, `Free-form data the tenant keeps on the position. Never read by this app; it travels into the cart line / order position snapshot untouched. A write replaces the whole document rather than merging into it.`)
  .option(`--position <position>`, `Sort order within the list, ascending — the order the positions collection returns by default and the order the conversions hand the lines over in. Neither dense nor unique: an add with no \`position\` of its own takes the list's current position COUNT, so removing a position from the middle and adding another leaves two rows sharing a number. A bulk replace assigns the array index the same way, so it renumbers only the positions it is not given explicitly.`, parseInteger)
  .option(`--position-texts [position-texts...]`, `Per-position notes the buyer wrote — an engraving, a delivery instruction, a reference for the picker. An ARRAY OF STRINGS, one entry per line; the order conversion joins them with newlines into the order position's single \`position_text\`, and the cart conversion carries the array in the line snapshot.`)
  .option(`--price <price>`, `Unit price snapshot — what the buyer saw when they saved the position, in whatever way the catalogue quoted it. It is a record, not a live price: the cart and the order reprice on their own terms, so this never becomes what somebody is charged.`, parseInteger)
  .option(`--product-id <product-id>`, `The catalogue product this position stands for. One of \`product_id\` / \`sku\` must be set (the database enforces it); this is the identity the products app answers to, and the one \`reject_unknown_articles\` and the conversions check against.`)
  .option(`--quantity <quantity>`, `How much of the article the list holds. Greater than zero — the database refuses the rest — and fractional to three decimals, because a B2B position may be 2.5 metres or 0.75 kilos.`, parseInteger)
  .option(`--sku <sku>`, `The article number as the catalogue knows it — the alternative identity to \`product_id\`, and the one an ERP integration usually joins on.`)
  .option(`--subcategory-slug <subcategory-slug>`, `The catalogue subcategory, as a slug. Same purpose as \`category_slug\`, one level down.`)
  .option(`--tax-rate <tax-rate>`, `The VAT rate that applied when the position was saved, as a PERCENT (19 = 19 %). Four decimals so a rate like 8.25 % survives; carts and orders document the same field the same way, and the conversion forwards the number unchanged.`, parseInteger)
  .option(`--unit <unit>`, `The unit \`quantity\` counts in, in the tenant's own words. Deliberately open text and deliberately NOT a vocabulary: a B2B catalogue units in pieces, metres, kilos, rolls and pallets, and any closed list published here would be a guess.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, name, categorySlug, costCenterId, customSku, image, metadata, position, positionTexts, price, productId, quantity, sku, subcategorySlug, taxRate, unit } = await promptForMissing(
          _options,
          itemsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (categorySlug !== undefined) {
          _payload[`category_slug`] = categorySlug;
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (customSku !== undefined) {
          _payload[`custom_sku`] = customSku;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (positionTexts !== undefined) {
          _payload[`position_texts`] = positionTexts;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (subcategorySlug !== undefined) {
          _payload[`subcategory_slug`] = subcategorySlug;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsCreateSpecs, { method: "post" });
const itemsReplaceSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "items", option: "--items [items...]", name: "items", description: "The new full set of positions, in the order they should carry. An empty array empties the list. Every existing position is deleted and rewritten, so ids are NOT preserved. The array order is the DEFAULT and not an override: an entry that names no `position` takes its index, one that names its own keeps it — so a replace does not by itself renumber the list from zero.", type: "array", required: true },
];
orderlists
  .command(`items-replace`)
  .description(`Set semantics: what you send becomes the list's positions and everything else is deleted. Ids are NOT preserved — every row is dropped and rewritten, so a client holding position ids must re-read them — and an empty array empties the list. Both guards run before the first delete, so an oversized or unknown-article replace answers 400 with the list still holding exactly what it held. It is not a renumbering call: an entry that names no \`position\` takes its array index, one that names its own keeps it, so the array order is the default rather than an override. Writing is narrower than reading: the owner may always replace, and anyone else only when the list is shared with their own organization AND the tenant turned \`shared_lists_editable\` on — otherwise a caller who can READ the list through the sharing rule is answered 403 here. The delete-then-insert is not wrapped in a transaction of its own, so a client should treat a failed replace as a list of unknown contents and re-read it rather than retry blind. The answer is the whole new set in the same paged envelope every other collection uses, with \`limit\`, \`offset\` and \`total\` describing exactly what was written; the list's \`updated_at\` is touched, which moves it to the front of the default GET /orderlists page.`)
  .option(`--list-id <list-id>`, `The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.`)
  .option(`--items [items...]`, `The new full set of positions, in the order they should carry. An empty array empties the list. Every existing position is deleted and rewritten, so ids are NOT preserved. The array order is the DEFAULT and not an override: an entry that names no \`position\` takes its index, one that names its own keeps it — so a replace does not by itself renumber the list from zero.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, items } = await promptForMissing(
          _options,
          itemsReplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, listId);
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
          `put`,
          _apiPath,
          _headers,
          _payload,
        );
        parse(_response as Record<string, unknown>);
      },
    ),
  );
registerPromptSpecs(orderlists.commands.at(-1)!, itemsReplaceSpecs, { method: "put" });
const itemsDeleteSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The position, by id. A position that belongs to another list answers 404.", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: true } },
];
orderlists
  .command(`items-delete`)
  .description(`Removes one saved line and takes nothing with it — no foreign key in this app points at a position. What it leaves behind is the gap: every remaining row keeps the number it had, and the next add takes the list's COUNT as its \`position\`, so a removal from the middle sets up a later collision. A bulk replace is the only call that rewrites the sequence. Outside this app, a cart line or order position built from this row still carries \`order_list_item_id\` in its snapshot — a jsonb value, not a reference — so it is simply left naming a row that is gone. The list's \`updated_at\` is touched.`)
  .option(`--list-id <list-id>`, `The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.`)
  .option(`--id <id>`, `The position, by id. A position that belongs to another list answers 404.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id } = await promptForMissing(
          _options,
          itemsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`orderlists items-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsDeleteSpecs, { method: "delete", destructive: true });
const itemsGetSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The position, by id. A position that belongs to another list answers 404.", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: true } },
];
orderlists
  .command(`items-get`)
  .description(`One saved line by its own id, in exactly the shape the collection returns — there is nothing here the collection does not already give you, so this is the read for a client that holds a position id and nothing else. The list in the path is enforced rather than decorative: a position that belongs to a different list answers 404 rather than the row, which is what stops an id lifting a position out of a list the caller may not read. An unknown or unreadable list is a 404 before the position is looked at.`)
  .option(`--list-id <list-id>`, `The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.`)
  .option(`--id <id>`, `The position, by id. A position that belongs to another list answers 404.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id } = await promptForMissing(
          _options,
          itemsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsGetSpecs, { method: "get" });
const itemsUpdateSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The position, by id. A position that belongs to another list answers 404.", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: true } },
  { key: "categorySlug", option: "--category-slug <category-slug>", name: "category_slug", description: "The catalogue category the article sat in when the position was saved, as a slug. Kept so a long list can be grouped the way the shop groups it without a call to the catalogue.", type: "string", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", description: "The cost centre this position books to, as the tenant's ERP names it. Free text and not our enum. It survives into the ORDER position, which has a `cost_center` column; a CART line has none, so the cart conversion carries it in the line snapshot instead.", type: "string", required: false },
  { key: "customSku", option: "--custom-sku <custom-sku>", name: "custom_sku", description: "The buyer's OWN article number for this article — what their purchasing system calls it, which is rarely what the shop calls it. Free text, and the field a B2B buyer searches their own lists by.", type: "string", required: false },
  { key: "image", option: "--image <image>", name: "image", description: "The article image at the time the position was saved, as a URL or a path — a snapshot like `name`, and nothing here refreshes it. It rides into the cart line and the order position in their snapshot, because neither has a column for it.", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form data the tenant keeps on the position. Never read by this app; it travels into the cart line / order position snapshot untouched. A write replaces the whole document rather than merging into it.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "The article name AS IT WAS when the position was saved. A snapshot on purpose: the list is the buyer's own record, so a renamed or withdrawn article still reads the way they wrote it down.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order within the list, ascending — the order the positions collection returns by default and the order the conversions hand the lines over in. Neither dense nor unique: an add with no `position` of its own takes the list's current position COUNT, so removing a position from the middle and adding another leaves two rows sharing a number. A bulk replace assigns the array index the same way, so it renumbers only the positions it is not given explicitly.", type: "integer", required: false },
  { key: "positionTexts", option: "--position-texts [position-texts...]", name: "position_texts", description: "Per-position notes the buyer wrote — an engraving, a delivery instruction, a reference for the picker. An ARRAY OF STRINGS, one entry per line; the order conversion joins them with newlines into the order position's single `position_text`, and the cart conversion carries the array in the line snapshot.", type: "array", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Unit price snapshot — what the buyer saw when they saved the position, in whatever way the catalogue quoted it. It is a record, not a live price: the cart and the order reprice on their own terms, so this never becomes what somebody is charged.", type: "number", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The catalogue product this position stands for. One of `product_id` / `sku` must be set (the database enforces it); this is the identity the products app answers to, and the one `reject_unknown_articles` and the conversions check against.", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "How much of the article the list holds. Greater than zero — the database refuses the rest — and fractional to three decimals, because a B2B position may be 2.5 metres or 0.75 kilos.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The article number as the catalogue knows it — the alternative identity to `product_id`, and the one an ERP integration usually joins on.", type: "string", required: false },
  { key: "subcategorySlug", option: "--subcategory-slug <subcategory-slug>", name: "subcategory_slug", description: "The catalogue subcategory, as a slug. Same purpose as `category_slug`, one level down.", type: "string", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", description: "The VAT rate that applied when the position was saved, as a PERCENT (19 = 19 %). Four decimals so a rate like 8.25 % survives; carts and orders document the same field the same way, and the conversion forwards the number unchanged.", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "The unit `quantity` counts in, in the tenant's own words. Deliberately open text and deliberately NOT a vocabulary: a B2B catalogue units in pieces, metres, kilos, rolls and pallets, and any closed list published here would be a guess.", type: "string", required: false },
];
orderlists
  .command(`items-update`)
  .description(`A partial update: omitted fields keep the value they have, and an explicit null is the only way to clear one. \`quantity\` is re-checked (> 0), and where \`reject_unknown_articles\` is on the article is re-checked against the MERGED row rather than the payload — so changing only the name cannot smuggle an unknown article past the guard that the create applied. \`position\` is set, not shifted: writing 3 puts this row at 3 and moves nothing else, which is the other way two positions come to share a number. The list's \`updated_at\` is touched.`)
  .option(`--list-id <list-id>`, `The list the position belongs to. An id no list in this tenant has — or one the caller may not read — answers 404.`)
  .option(`--id <id>`, `The position, by id. A position that belongs to another list answers 404.`)
  .option(`--category-slug <category-slug>`, `The catalogue category the article sat in when the position was saved, as a slug. Kept so a long list can be grouped the way the shop groups it without a call to the catalogue.`)
  .option(`--cost-center-id <cost-center-id>`, `The cost centre this position books to, as the tenant's ERP names it. Free text and not our enum. It survives into the ORDER position, which has a \`cost_center\` column; a CART line has none, so the cart conversion carries it in the line snapshot instead.`)
  .option(`--custom-sku <custom-sku>`, `The buyer's OWN article number for this article — what their purchasing system calls it, which is rarely what the shop calls it. Free text, and the field a B2B buyer searches their own lists by.`)
  .option(`--image <image>`, `The article image at the time the position was saved, as a URL or a path — a snapshot like \`name\`, and nothing here refreshes it. It rides into the cart line and the order position in their snapshot, because neither has a column for it.`)
  .option(`--metadata <metadata>`, `Free-form data the tenant keeps on the position. Never read by this app; it travels into the cart line / order position snapshot untouched. A write replaces the whole document rather than merging into it.`)
  .option(`--name <name>`, `The article name AS IT WAS when the position was saved. A snapshot on purpose: the list is the buyer's own record, so a renamed or withdrawn article still reads the way they wrote it down.`)
  .option(`--position <position>`, `Sort order within the list, ascending — the order the positions collection returns by default and the order the conversions hand the lines over in. Neither dense nor unique: an add with no \`position\` of its own takes the list's current position COUNT, so removing a position from the middle and adding another leaves two rows sharing a number. A bulk replace assigns the array index the same way, so it renumbers only the positions it is not given explicitly.`, parseInteger)
  .option(`--position-texts [position-texts...]`, `Per-position notes the buyer wrote — an engraving, a delivery instruction, a reference for the picker. An ARRAY OF STRINGS, one entry per line; the order conversion joins them with newlines into the order position's single \`position_text\`, and the cart conversion carries the array in the line snapshot.`)
  .option(`--price <price>`, `Unit price snapshot — what the buyer saw when they saved the position, in whatever way the catalogue quoted it. It is a record, not a live price: the cart and the order reprice on their own terms, so this never becomes what somebody is charged.`, parseInteger)
  .option(`--product-id <product-id>`, `The catalogue product this position stands for. One of \`product_id\` / \`sku\` must be set (the database enforces it); this is the identity the products app answers to, and the one \`reject_unknown_articles\` and the conversions check against.`)
  .option(`--quantity <quantity>`, `How much of the article the list holds. Greater than zero — the database refuses the rest — and fractional to three decimals, because a B2B position may be 2.5 metres or 0.75 kilos.`, parseInteger)
  .option(`--sku <sku>`, `The article number as the catalogue knows it — the alternative identity to \`product_id\`, and the one an ERP integration usually joins on.`)
  .option(`--subcategory-slug <subcategory-slug>`, `The catalogue subcategory, as a slug. Same purpose as \`category_slug\`, one level down.`)
  .option(`--tax-rate <tax-rate>`, `The VAT rate that applied when the position was saved, as a PERCENT (19 = 19 %). Four decimals so a rate like 8.25 % survives; carts and orders document the same field the same way, and the conversion forwards the number unchanged.`, parseInteger)
  .option(`--unit <unit>`, `The unit \`quantity\` counts in, in the tenant's own words. Deliberately open text and deliberately NOT a vocabulary: a B2B catalogue units in pieces, metres, kilos, rolls and pallets, and any closed list published here would be a guess.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id, categorySlug, costCenterId, customSku, image, metadata, name, position, positionTexts, price, productId, quantity, sku, subcategorySlug, taxRate, unit } = await promptForMissing(
          _options,
          itemsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (categorySlug !== undefined) {
          _payload[`category_slug`] = categorySlug;
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (customSku !== undefined) {
          _payload[`custom_sku`] = customSku;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (positionTexts !== undefined) {
          _payload[`position_texts`] = positionTexts;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (subcategorySlug !== undefined) {
          _payload[`subcategory_slug`] = subcategorySlug;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsUpdateSpecs, { method: "put" });
