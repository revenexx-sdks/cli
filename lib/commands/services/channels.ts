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

export const channels = new Command("channels")
  .description(
    commandDescriptions["channels"] ??
      `Commerce Studio Channels App — the sales-channel dimension of the Revenue Cloud. A channel is WHERE business happens: the web shop, a punchout integration, a marketplace, the API, a POS. Channels provides the 'channel' scope dimension to the Entity Scoping Engine, so scopeable entities in other apps (products, categories, ...) can be sliced per channel. It also owns the decision that slicing implies and that nothing else names: Baseline's scoped views are OPEN BY DEFAULT, so a product assigned to no channel is on sale in every channel — a punchout buyer sees the entire catalogue. 'unassigned_channel_visibility' is that answer made explicit (default 'all', reproducing the views exactly) and 'assigned_only' inverts it into the negotiated assortment a punchout contract describes, which the view itself cannot express; a channel may override the tenant answer for itself. GET /channels/context resolves the active channel and the policy; POST /channels/visibility applies it. The channel TYPES are the tenant's own list (channel_types, CRUD under /channels/types): they used to be a CHECK constraint over five values that nothing in the app ever branched on, so a merchant running a feed or print channel needed a release to say so. Statuses and unassigned-visibility stay constraints, because the app does branch on both. Both kinds are served as vocabularies, so no UI keeps its own copy. There is no foreign key behind channels.type — one onto a table that starts empty would fail the migration for every existing tenant — so the app enforces it: a type code is immutable, a type still in use cannot be deleted, and neither can the last one. Tenants always have sensible defaults: the five types and the 'shop' channel are seeded on install and on demand.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to one channel by row id. The same row GET /channels/{id} answers, but inside the list envelope — so a caller gets `page` and the `filter` echo with it, and a uuid that names no row is a 200 with an empty page rather than a 404.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Filter to one channel by its scope slug. Unique per tenant, so this selects at most one row — the way to turn a scope slug held by another app into the channel it names.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Filter by display name. Whole-string, case-sensitive equality — there is no contains or prefix form; `?code=` is the stable handle and this is the human one.", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Filter by the localized-names map, as an exact jsonb document: the value must be a whole JSON object and it must match the stored map completely, not merely overlap it. Key order and whitespace do not matter (the column is jsonb, which normalizes both); a missing or extra language tag does. A value that is not valid JSON is refused with 400 `invalid_value` — this is the one filter here that can be malformed rather than merely unmatched.", type: "string", required: false },
  { key: "type", option: "--type <type>", name: "type", description: "Filter to one channel type, by code. One of the codes the tenant keeps under GET /channels/types — served with labels as the 'channels.types' vocabulary. Deliberately NOT an enum: the set is the tenant's own rows, not a CHECK constraint this repo could quote. A fresh install starts with storefront, punchout, marketplace, api, pos, which is why 'storefront' is the example here, but a merchant may rename or retire any of them and add their own (a feed or a print channel), so read the list rather than assuming it.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Filter by lifecycle status. A value outside the CHECK constraint is not an error — it simply matches nothing and comes back as a 200 with an empty page.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "unassignedVisibility", option: "--unassigned-visibility <unassigned-visibility>", name: "unassigned_visibility", description: "Filter by the per-channel visibility override — how a punchout channel that closed its assortment is found. `?unassigned_visibility=assigned_only` lists exactly the channels that hide unassigned rows; `inherit` lists the ones still taking the tenant's answer.", type: "string", required: false, enum: ["inherit","all","assigned_only"] },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Filter to the default channel — the one a request naming no channel falls back to. More than one row coming back is a misconfiguration; /channels/context reports the same condition as default_ambiguous.", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Filter by exact sort position. An equality, not a range: there is no `position_gte`.", type: "integer", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Filter by exact insert instant — equality to the microsecond, not a range, so this is for reproducing a known row rather than for windowing. Use `?order=created_at.desc` to sort by it.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Filter by exact last-write instant. Equality to the microsecond, like `created_at`.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else — or a column this entity does not have — is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
channels
  .command(`list`)
  .description(`The filters are what make this list usable: \`?code=\` turns a scope slug another app stored into the channel row that owns it, \`?is_default=true\` finds the fallback channel without resolving a context, and \`?unassigned_visibility=assigned_only\` finds the channels that closed their assortment. Every filter is an exact-column equality — there is no contains, prefix or range form — and the honoured set is exactly this entity's 11 columns, because the generic list mount matches any query key that names one. Each of them is declared as a query parameter with the column's own CHECK behind it, so the 11 that work are the 11 the document offers rather than a list a caller has to keep somewhere. An unknown column is dropped rather than refused, so \`?stauts=active\` returns the unfiltered page; \`filter\` echoes what was understood, which is the only way to catch that. Paging is \`limit\`/\`offset\` over whatever survived the filters, and \`?order=\` sorts by one column with an optional \`.asc\`/\`.desc\`; ask for no order and the page comes back in insertion order. \`order\` is the one input here that is refused rather than ignored — a malformed value, or one naming a column this entity does not have, is a 400 where the same mistake in a filter key passes silently.`)
  .option(`--id <id>`, `Filter to one channel by row id. The same row GET /channels/{id} answers, but inside the list envelope — so a caller gets \`page\` and the \`filter\` echo with it, and a uuid that names no row is a 200 with an empty page rather than a 404.`)
  .option(`--code <code>`, `Filter to one channel by its scope slug. Unique per tenant, so this selects at most one row — the way to turn a scope slug held by another app into the channel it names.`)
  .option(`--name <name>`, `Filter by display name. Whole-string, case-sensitive equality — there is no contains or prefix form; \`?code=\` is the stable handle and this is the human one.`)
  .option(`--labels <labels>`, `Filter by the localized-names map, as an exact jsonb document: the value must be a whole JSON object and it must match the stored map completely, not merely overlap it. Key order and whitespace do not matter (the column is jsonb, which normalizes both); a missing or extra language tag does. A value that is not valid JSON is refused with 400 \`invalid_value\` — this is the one filter here that can be malformed rather than merely unmatched.`)
  .option(`--type <type>`, `Filter to one channel type, by code. One of the codes the tenant keeps under GET /channels/types — served with labels as the 'channels.types' vocabulary. Deliberately NOT an enum: the set is the tenant's own rows, not a CHECK constraint this repo could quote. A fresh install starts with storefront, punchout, marketplace, api, pos, which is why 'storefront' is the example here, but a merchant may rename or retire any of them and add their own (a feed or a print channel), so read the list rather than assuming it.`)
  .option(`--status <status>`, `Filter by lifecycle status. A value outside the CHECK constraint is not an error — it simply matches nothing and comes back as a 200 with an empty page.`)
  .option(`--unassigned-visibility <unassigned-visibility>`, `Filter by the per-channel visibility override — how a punchout channel that closed its assortment is found. \`?unassigned_visibility=assigned_only\` lists exactly the channels that hide unassigned rows; \`inherit\` lists the ones still taking the tenant's answer.`)
  .option(
    `--is-default [value]`,
    `Filter to the default channel — the one a request naming no channel falls back to. More than one row coming back is a misconfiguration; /channels/context reports the same condition as default_ambiguous.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Filter by exact sort position. An equality, not a range: there is no \`position_gte\`.`, parseInteger)
  .option(`--created-at <created-at>`, `Filter by exact insert instant — equality to the microsecond, not a range, so this is for reproducing a known row rather than for windowing. Use \`?order=created_at.desc\` to sort by it.`)
  .option(`--updated-at <updated-at>`, `Filter by exact last-write instant. Equality to the microsecond, like \`created_at\`.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else — or a column this entity does not have — is refused with 400.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, name, labels, type, status, unassignedVisibility, isDefault, position, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels`;
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (labels !== undefined) {
          _payload[`labels`] = labels;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (unassignedVisibility !== undefined) {
          _payload[`unassigned_visibility`] = unassignedVisibility;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(channels.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Stable channel code, unique per tenant (e.g. shop, punchout-acme). It is the scope slug Baseline matches channel assignments on, so it is held to Baseline's own shape: lowercase a-z/0-9 first, then a-z/0-9/_/-, up to 63 characters. Anything else is refused — a code that cannot be a scope slug leaves the channel unable to filter.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: true },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Mark as the default channel (default false). At most one channel carries it — setting it demotes the previous holder.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names. A locale map keyed by language tag: {\"en\": …, \"de\": …}. Read the requested tag and fall back to the plain column beside it.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Lifecycle status (default 'active'). Whether the channel is in service. What 'inactive' DOES is the tenant's inactive_channel_behavior setting: on 'serve' it is a label and the channel still resolves, on 'block' /channels/context answers resolved:false with reason 'channel_inactive'. Served as the 'channels.statuses' vocabulary.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "type", option: "--type <type>", name: "type", description: "Which channel type this is. One of the codes the tenant keeps under GET /channels/types — served with labels as the 'channels.types' vocabulary. Deliberately NOT an enum: the set is the tenant's own rows, not a CHECK constraint this repo could quote. A fresh install starts with storefront, punchout, marketplace, api, pos, which is why 'storefront' is the example here, but a merchant may rename or retire any of them and add their own (a feed or a print channel), so read the list rather than assuming it. Omitted on create it falls back to the type the tenant flagged as their default, never to a hardcoded value; a code the tenant does not keep is a 400 that names the ones they do.", type: "string", required: false },
  { key: "unassignedVisibility", option: "--unassigned-visibility <unassigned-visibility>", name: "unassigned_visibility", description: "Default 'inherit'. What it means, IN THIS CHANNEL, that a row carries no channel assignment at all — the per-channel override of the tenant-wide unassigned_channel_visibility setting. 'inherit' (the default) takes the tenant's answer and changes nothing. 'all' shows unassigned rows: everything is on sale unless somebody carved it out, which is what an open storefront wants and what Baseline's is_visible() does today. 'assigned_only' hides them until they are explicitly assigned — the negotiated assortment a punchout contract describes, and the one answer the generated _scoped view has no way to express, which is why POST /channels/visibility exists to apply it. Rows that DO carry assignments are unaffected either way. Served with its labels as the 'channels.unassigned-visibility' vocabulary.", type: "string", required: false, enum: ["inherit","all","assigned_only"] },
];
channels
  .command(`create`)
  .description(`Two fields are yours and everything else has an answer already: \`code\` and \`name\` are the only columns the database will not fill in, and the rest arrive from their defaults — \`status\` active, \`unassigned_visibility\` inherit, \`is_default\` false, \`position\` 0. \`type\` is the exception the app makes for itself: omitted, it becomes the type the tenant FLAGGED as their default rather than the column default, so a merchant who retired the seeded \`storefront\` does not get channels carrying a type they no longer keep. \`code\` is the load-bearing one. It is the scope slug Baseline matches every channel assignment on, which is why it is held to Baseline's own shape here rather than to the column's \`length > 0\`, and why it is unique per tenant — a second channel claiming a code another already holds is a 409 off the \`(tenant_id, code)\` index. Treat it as permanent: the API will let you change it later and nothing follows it (see PUT /channels/{id}). Creating a channel assigns nothing to it. Products, categories and everything else scopeable stay exactly as visible as they were — until rows are assigned, what this channel shows is whatever \`unassigned_channel_visibility\` says, which on the shipped default is the entire catalogue. And a code is only free in THIS app: assignments made against a code that a since-deleted channel used are still in Baseline, so re-using the code adopts them.`)
  .option(`--code <code>`, `Stable channel code, unique per tenant (e.g. shop, punchout-acme). It is the scope slug Baseline matches channel assignments on, so it is held to Baseline's own shape: lowercase a-z/0-9 first, then a-z/0-9/_/-, up to 63 characters. Anything else is refused — a code that cannot be a scope slug leaves the channel unable to filter.`)
  .option(`--name <name>`, `Display name.`)
  .option(
    `--is-default [value]`,
    `Mark as the default channel (default false). At most one channel carries it — setting it demotes the previous holder.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names. A locale map keyed by language tag: {"en": …, "de": …}. Read the requested tag and fall back to the plain column beside it.`)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .option(`--status <status>`, `Lifecycle status (default 'active'). Whether the channel is in service. What 'inactive' DOES is the tenant's inactive_channel_behavior setting: on 'serve' it is a label and the channel still resolves, on 'block' /channels/context answers resolved:false with reason 'channel_inactive'. Served as the 'channels.statuses' vocabulary.`)
  .option(`--type <type>`, `Which channel type this is. One of the codes the tenant keeps under GET /channels/types — served with labels as the 'channels.types' vocabulary. Deliberately NOT an enum: the set is the tenant's own rows, not a CHECK constraint this repo could quote. A fresh install starts with storefront, punchout, marketplace, api, pos, which is why 'storefront' is the example here, but a merchant may rename or retire any of them and add their own (a feed or a print channel), so read the list rather than assuming it. Omitted on create it falls back to the type the tenant flagged as their default, never to a hardcoded value; a code the tenant does not keep is a 400 that names the ones they do.`)
  .option(`--unassigned-visibility <unassigned-visibility>`, `Default 'inherit'. What it means, IN THIS CHANNEL, that a row carries no channel assignment at all — the per-channel override of the tenant-wide unassigned_channel_visibility setting. 'inherit' (the default) takes the tenant's answer and changes nothing. 'all' shows unassigned rows: everything is on sale unless somebody carved it out, which is what an open storefront wants and what Baseline's is_visible() does today. 'assigned_only' hides them until they are explicitly assigned — the negotiated assortment a punchout contract describes, and the one answer the generated _scoped view has no way to express, which is why POST /channels/visibility exists to apply it. Rows that DO carry assignments are unaffected either way. Served with its labels as the 'channels.unassigned-visibility' vocabulary.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, isDefault, labels, position, status, type, unassignedVisibility } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels`;
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
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (unassignedVisibility !== undefined) {
          _payload[`unassigned_visibility`] = unassignedVisibility;
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
registerPromptSpecs(channels.commands.at(-1)!, createSpecs, { method: "post" });
const contextSpecs: PromptSpec[] = [
  { key: "channel", option: "--channel <channel>", name: "channel", description: "Channel code to resolve. Overrides the scope_context.channel claim and the default channel, and is the only way to name a channel explicitly through the gateway.", type: "string", required: false },
];
channels
  .command(`context`)
  .description(`The storefront/punchout bootstrap: one call tells a shop front, a punchout front-end or a feed builder which channel it is in and what an unassigned row means there, so it can apply the policy itself instead of hardcoding one. Resolution order is body/query, then the x-revenexx-channel header, then the scope_context.channel claim, then the channel flagged is_default — header before claim, the same order baseline.is_visible() uses. Through api.revenexx.com the header step is inert (the gateway does not forward it), so in practice it is \`?channel=\`, then the claim, then the default. Never errors on an unknown or inactive channel: it answers resolved:false with a reason, so a caller can tell "no such channel" from "the service is down". That is why this operation declares no 4xx of its own — a tenant with no channels at all answers 200 with reason no_default_channel. Two things come back, not one: the channel that was resolved, and the visibility policy in force for it — the tenant-wide unassigned_channel_visibility answer, or the channel's own override where it has one. The policy travels with the channel because a caller that has one and not the other still cannot render anything: knowing you are in the punchout channel says nothing about whether an unassigned product belongs in its catalogue. With both, a client reproduces the decision itself and calls POST /channels/visibility only when it wants the app to decide row by row.`)
  .option(`--channel <channel>`, `Channel code to resolve. Overrides the scope_context.channel claim and the default channel, and is the only way to name a channel explicitly through the gateway.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { channel } = await promptForMissing(
          _options,
          contextSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/context`;
        const _payload: RequestParams = {};
        if (channel !== undefined) {
          _payload[`channel`] = channel;
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
registerPromptSpecs(channels.commands.at(-1)!, contextSpecs, { method: "get" });
channels
  .command(`defaults`)
  .description(`The repair call. A tenant installed before \`channel_types\` existed, or one that deleted its way into a state where nothing works, gets the shipped starting point back — the 5 seeded types first, because the seeded channel carries one of them, then the \`shop\` channel. Most tenants never call it: the platform invokes the same routine itself on \`app.installed\`, so a fresh install already has its 5 types and its shop channel before anyone asks, and this route exists for the tenant whose install predates them or who has since removed them. Calling it on a settled tenant is safe and cheap for the same reason it is safe to fire on every install: it is idempotent, keyed on the code, so a second call writes nothing. Everything a merchant added themselves is left alone, and a row that already exists is reported under \`existing\` rather than rewritten — the values you edited on a seeded type survive this call. It RESTORES THE WHOLE SEED SET, including a seeded type the merchant deliberately deleted. Idempotency here is keyed on the code and nothing else, and there is nowhere to remember a retirement: retirement is not a state this app can represent. Retiring a type IS deleting the row; \`channel_types\` has no retired flag and these tables carry no foreign keys, so nothing anywhere distinguishes a code a merchant removed on purpose from one they never had. Honouring the retirement would mean inventing a tombstone rather than reading one. Given that, restoring all 5 is the better half of the trade: this is the call a tenant makes when something is missing, and a repair that silently skips part of what it repairs, with no way to ask for the rest, is worse than one that says plainly what it puts back. It is also never a surprise. The only automatic seeding elsewhere in the app fires when the type table is completely EMPTY, which cannot happen once installed because the last remaining type cannot be deleted — so a retired type comes back exactly when somebody calls this route or the app is installed again, and never as a side effect of an unrelated read. Deleting it a second time costs one DELETE, and is refused only if a channel has since started carrying it. What it does not do: it creates no assignments, it does not repair a channel whose own code you deleted (only \`shop\` comes back), and it does not restore the seeded VALUES of a type that still exists — a renamed \`storefront\` stays renamed.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/channels/defaults`;
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
const typesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
channels
  .command(`types-list`)
  .description(`What a channel may BE. This used to be a CHECK constraint over five values, which meant the merchant who runs a feed channel or a print channel needed a release of this app to say so — and nothing in the app ever branched on the value, only on membership. The set is the tenant's rows now. Seeds itself on first read, so the list is never empty and a channel can always carry a type. Rows come back in \`position\` order, always: this route is not the generic list mount and takes no \`order\` — \`limit\` and \`offset\` are the whole of its query, and it takes no filters, so a caller looking for one code reads the list and matches. The set is bounded: a tenant keeps at most 200 types, which is the size this app can check a channel's type against in one query, and POST /channels/types refuses the 201st rather than build a set it could not read back. \`page.total\` counts the rows that exist, not the ones this answer carries, and the order is total — \`position\` then \`code\`, because \`position\` is not unique and an order that leaves rows tied is one the database is free to answer differently on the next page, which is how a walk serves a row twice and skips another.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
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
          typesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/types`;
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
registerPromptSpecs(channels.commands.at(-1)!, typesListSpecs, { method: "get" });
const typesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "What `channels.type` will store. Lowercased and trimmed before it is written, and fixed from then on — a rename would orphan every channel carrying it.", type: "string", required: true },
  { key: "title", option: "--title <title>", name: "title", description: "The fallback name. `labels` carries the per-locale ones.", type: "string", required: true },
  { key: "description", option: "--description <description>", name: "description", description: "One sentence on what kind of place this type of channel is, for the merchant choosing between them. Plain text, in the tenant's primary language; `descriptions` carries the per-locale ones.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "A locale map keyed by language tag: {\"en\": …, \"de\": …}. Read the requested tag and fall back to the plain column beside it.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this type; the previous default is demoted. The default is the type a channel created without one gets.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "A locale map keyed by language tag: {\"en\": …, \"de\": …}. Read the requested tag and fall back to the plain column beside it.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0). GET /channels/types answers in this order; ties fall back to the code.", type: "integer", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Badge colour (default 'neutral'). A value outside the palette is ignored rather than refused.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
channels
  .command(`types-create`)
  .description(`What lets a merchant name a kind of channel this app never thought of — a feed, a print catalogue, a kiosk — without waiting for a release. \`code\` and \`title\` are the only two the database will not fill in; everything else has a default. The code is trimmed and lowercased and becomes exactly what \`channels.type\` stores, and it is fixed from then on, because there is no foreign key behind that column to carry a rename: every channel holding the old string would be left pointing at nothing. The title is the part a merchant renames later. A duplicate code is a 409, and it is worth knowing that the collision is wider than this tenant — \`channel_types.code\` is unique on the column alone, so a code held by another tenant collides too and the read this route does before inserting cannot see it. A tenant keeps at most 200 types; the 201st is a 409 \`type_limit_reached\` rather than a row the app would then be unable to read back. Creating a type changes nothing about existing channels: it is a name that becomes available, not one that gets applied. Adding a type does not make it the default either — pass \`is_default: true\` for that, which demotes the current holder.`)
  .option(`--code <code>`, `What \`channels.type\` will store. Lowercased and trimmed before it is written, and fixed from then on — a rename would orphan every channel carrying it.`)
  .option(`--title <title>`, `The fallback name. \`labels\` carries the per-locale ones.`)
  .option(`--description <description>`, `One sentence on what kind of place this type of channel is, for the merchant choosing between them. Plain text, in the tenant's primary language; \`descriptions\` carries the per-locale ones.`)
  .option(`--descriptions <descriptions>`, `A locale map keyed by language tag: {"en": …, "de": …}. Read the requested tag and fall back to the plain column beside it.`)
  .option(
    `--is-default [value]`,
    `Promote this type; the previous default is demoted. The default is the type a channel created without one gets.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `A locale map keyed by language tag: {"en": …, "de": …}. Read the requested tag and fall back to the plain column beside it.`)
  .option(`--position <position>`, `Sort position (default 0). GET /channels/types answers in this order; ties fall back to the code.`, parseInteger)
  .option(`--tone <tone>`, `Badge colour (default 'neutral'). A value outside the palette is ignored rather than refused.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, title, description, descriptions, isDefault, labels, position, tone } = await promptForMissing(
          _options,
          typesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/types`;
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
registerPromptSpecs(channels.commands.at(-1)!, typesCreateSpecs, { method: "post" });
const typesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The channel type, by id. This is the uuid, not the type `code`.", type: "string", required: true, resource: { listPath: "/channels/types", hasLimit: true } },
];
channels
  .command(`types-delete`)
  .description(`Retiring a type IS deleting the row — there is no retired flag on \`channel_types\` — which is why the two things that would make a deletion destructive are refused instead of allowed: a type at least one channel still carries is a 409, and so is the last remaining type. There is no foreign key behind \`channels.type\`, so those two checks are not a convenience on top of the database, they ARE the integrity. Move the channels to another type first and the delete goes through. Nothing else goes with it. A type has no dependents once no channel names it: no rows in this app point at it and none in Baseline do either, since assignments are made against a channel \`code\`, never a type. Deleting the type the tenant had flagged as default is allowed, and the flag is handed to the next type by position rather than left unheld, so a channel created afterwards still has something to fall back to. Because the guard is a read followed by a write with no transaction between them, and no constraint underneath it, a channel created against this type in the same instant can survive it. Worth knowing what that leaves, since it is not what "orphaned" usually means: the channel keeps working. \`channels.type\` is a stored string that nothing joins on, so the channel still reads, still filters under \`?type=\` by that same string, and still resolves in /channels/context and POST /channels/visibility — neither of which consults \`type\` at all. What it loses is its label, because the types vocabulary is built from the rows and there is no longer one to render a badge from. An update that does not mention \`type\` leaves the value alone; naming it is refused, which is how the channel is moved to a type that exists. One thing the deletion frees is wider than the tenant: \`channel_types.code\` is unique on the column alone, so the code becomes available platform-wide, not just here. And the seed does not know the row is gone — POST /channels/defaults and a re-install both put a deleted SEEDED type back, by design; see that operation.`)
  .option(`--id <id>`, `The channel type, by id. This is the uuid, not the type \`code\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          typesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`channels types-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/channels/types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, typesDeleteSpecs, { method: "delete", destructive: true });
const typesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The channel type, by id. This is the uuid, not the type `code`.", type: "string", required: true, resource: { listPath: "/channels/types", hasLimit: true } },
];
channels
  .command(`types-get`)
  .description(`One type row, by its uuid — the handle PUT and DELETE take, and the reason to hold on to what the list gave you. It is NOT the \`code\`: the code is what \`channels.type\` stores, and this route will not look one up. Neither will the list, which takes no filters at all, so a caller holding only a code pages \`GET /channels/types\` and matches client-side. Since the whole set is bounded and small that is one call, not a search. Unlike the list, this route does not seed. The list is hand-written so that a tenant whose table is still empty is given the 5 shipped types instead of being told they have none; this is the generic item route, so on that same tenant it answers 404 for every id — which is the correct answer, since there is genuinely no such row yet. Read the list first. Nothing here is cached: the type list changes when a merchant edits it and this route always reflects that. Rows seeded before 0.7.0 may hold a serialized locale map in \`title\` or \`description\` rather than plain text (PE-452); \`labels\` and \`descriptions\` are the columns that carry the per-locale copy now.`)
  .option(`--id <id>`, `The channel type, by id. This is the uuid, not the type \`code\`.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          typesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, typesGetSpecs, { method: "get" });
const typesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The channel type, by id. This is the uuid, not the type `code`.", type: "string", required: true, resource: { listPath: "/channels/types", hasLimit: true } },
  { key: "description", option: "--description <description>", name: "description", description: "Replace the one-sentence description. Sent as null it is cleared; omitted it is kept. `descriptions` carries the per-locale ones.", type: "string", required: false },
  { key: "descriptions", option: "--descriptions <descriptions>", name: "descriptions", description: "A locale map keyed by language tag: {\"en\": …, \"de\": …}. Read the requested tag and fall back to the plain column beside it.", type: "object", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Promote this type; the previous default is demoted. Only `true` does anything — sending false does not demote this type, because some type must hold the flag.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "A locale map keyed by language tag: {\"en\": …, \"de\": …}. Read the requested tag and fall back to the plain column beside it.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Move the type in the order GET /channels/types answers in.", type: "integer", required: false },
  { key: "title", option: "--title <title>", name: "title", description: "Rename the type. A blank or non-string title is ignored, not refused — the stored one is kept.", type: "string", required: false },
  { key: "tone", option: "--tone <tone>", name: "tone", description: "Change the badge colour. A value outside the palette is ignored rather than refused, and the stored tone is kept.", type: "string", required: false, enum: ["neutral","info","success","warning","danger"] },
];
channels
  .command(`types-update`)
  .description(`Everything but the code. This is where a merchant renames a seeded type into their own words, gives it its German, moves it in the list a person picks from, or hands it the default flag. Seeded types are as editable as ones the merchant added — \`is_system\` records where a row came from and grants it nothing. Sending a different \`code\` is a 400 rather than a silent no-op: it is what \`channels.type\` stores, there is no foreign key behind that column to carry the change — the database has none at all on these tables — and a rename would therefore move nothing. Every channel holding the old string would keep holding it, still working but with no type row to draw its name from. This refusal is the whole of the protection; to move channels to a new code, create the type and update the channels, in that order. Two fields are quietly forgiving rather than strict — a blank \`title\` and a \`tone\` outside the palette are both ignored and the stored value kept, so a client that sends a half-filled form does not clear what is there. \`is_default\` is one-way: true promotes this type and demotes the previous holder, false does nothing at all, because some type has to be the one a channel created without one gets.`)
  .option(`--id <id>`, `The channel type, by id. This is the uuid, not the type \`code\`.`)
  .option(`--description <description>`, `Replace the one-sentence description. Sent as null it is cleared; omitted it is kept. \`descriptions\` carries the per-locale ones.`)
  .option(`--descriptions <descriptions>`, `A locale map keyed by language tag: {"en": …, "de": …}. Read the requested tag and fall back to the plain column beside it.`)
  .option(
    `--is-default [value]`,
    `Promote this type; the previous default is demoted. Only \`true\` does anything — sending false does not demote this type, because some type must hold the flag.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `A locale map keyed by language tag: {"en": …, "de": …}. Read the requested tag and fall back to the plain column beside it.`)
  .option(`--position <position>`, `Move the type in the order GET /channels/types answers in.`, parseInteger)
  .option(`--title <title>`, `Rename the type. A blank or non-string title is ignored, not refused — the stored one is kept.`)
  .option(`--tone <tone>`, `Change the badge colour. A value outside the palette is ignored rather than refused, and the stored tone is kept.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, description, descriptions, isDefault, labels, position, title, tone } = await promptForMissing(
          _options,
          typesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, typesUpdateSpecs, { method: "put" });
const visibilitySpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "The rows to decide on, each with the channel assignments Baseline holds for it. POST /api/v1/scopes/lookup?dimension=channel answers in exactly this shape. At most 500 — Baseline's own lookup ceiling.", type: "array", required: true },
  { key: "channel", option: "--channel <channel>", name: "channel", description: "Channel code to evaluate against, for a caller that would rather not touch the payload. The body field wins if both are sent; everything else about it is identical.", type: "string", required: false },
  { key: "channelBody", option: "--channel-body <channel-body>", name: "channel_body", description: "The channel `code` (the scope slug) to evaluate against, trimmed and lowercased before it is matched. Optional, and through api.revenexx.com it is the ONLY way to name a channel explicitly: the x-revenexx-channel header is not forwarded to the app, so without this the resolution falls through to the scope_context.channel claim and then to the tenant's default channel. A code no channel carries is not an error — the answer is resolved:false with reason 'unknown_channel', so a caller can tell it from an outage.", type: "string", required: false },
];
channels
  .command(`visibility`)
  .description(`The gate. A row WITH channel assignments is decided exactly as baseline.is_visible() decides it — visible iff the active channel is among them. A row WITHOUT assignments is the case unassigned_channel_visibility owns: 'all' shows it (Baseline's open-by-default, unchanged) and 'assigned_only' hides it, which the generated _scoped view has no way to express. A channel may override the tenant answer for itself, so the shop can stay open while a punchout channel serves only its negotiated assortment.`)
  .option(`--items [items...]`, `The rows to decide on, each with the channel assignments Baseline holds for it. POST /api/v1/scopes/lookup?dimension=channel answers in exactly this shape. At most 500 — Baseline's own lookup ceiling.`)
  .option(`--channel <channel>`, `Channel code to evaluate against, for a caller that would rather not touch the payload. The body field wins if both are sent; everything else about it is identical.`)
  .option(`--channel-body <channel-body>`, `The channel \`code\` (the scope slug) to evaluate against, trimmed and lowercased before it is matched. Optional, and through api.revenexx.com it is the ONLY way to name a channel explicitly: the x-revenexx-channel header is not forwarded to the app, so without this the resolution falls through to the scope_context.channel claim and then to the tenant's default channel. A code no channel carries is not an error — the answer is resolved:false with reason 'unknown_channel', so a caller can tell it from an outage.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, channel, channelBody } = await promptForMissing(
          _options,
          visibilitySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/visibility`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channel !== undefined) {
          _payload[`channel`] = channel;
        }
        if (channelBody !== undefined) {
          _payload[`channel`] = channelBody;
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
registerPromptSpecs(channels.commands.at(-1)!, visibilitySpecs, { method: "post" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
channels
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes: which enums this app publishes, not what is in them. An entry carries the name and the localised title and description a UI would put above a select, and stops there — the permitted values, their labels and their badge tones are the other route's answer. The split is deliberate. This index is a fixed, tiny answer a client can hold onto, while a vocabulary's contents are not fixed at all: \`types\` is backed by the tenant's own rows, so its values change whenever a merchant adds or retires one, and folding them in here would make every consumer re-fetch the whole set to learn a title. Names: statuses, types, unassigned-visibility. Fetch one with GET /channels/vocabularies/{name}; a client holding the qualified pair 'channels.<name>' builds that URL from the pair alone.`)
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
        const _apiPath = `/channels/vocabularies`;
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
registerPromptSpecs(channels.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["statuses","types","unassigned-visibility"], resource: { listPath: "/channels/vocabularies", hasLimit: false } },
];
channels
  .command(`vocabularies-get`)
  .description(`One vocabulary with every permitted value in it, and a value here is more than the string the column stores: it arrives with the localised title and description a select puts in front of a person, and with a badge tone for rendering it as a status chip — \`default_tone\` is what a value carrying none falls back to, so there is always something to render. That is the whole reason this route exists rather than a client hardcoding the list. Two sources, one guarantee: what is served is what is in force, so no UI keeps a second copy. 'source' says which — 'schema' means the values are read out of the column's CHECK constraint (a value added to the constraint appears here even before anyone labels it, titled from its own key); 'table' means they are the tenant's own rows, which a merchant may add to, rename and retire without a release of this app. Values come back in author order, which is the order a select should offer. 'closed' says the set is exhaustive at this moment, so a value outside it is stale data rather than a missing label. Names: statuses, types, unassigned-visibility.`)
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
        const _apiPath = `/channels/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(channels.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The channel, by id. This is the uuid, not the `code` — filter the list with ?code= to go the other way.", type: "string", required: true, resource: { listPath: "/channels", hasLimit: true } },
];
channels
  .command(`delete`)
  .description(`Nothing cascades from here, and that is a statement about the schema rather than a reassurance: this app declares no foreign key in either direction, so there is nothing to cascade TO. The channel ASSIGNMENTS other apps hold live in Baseline, keyed by the scope slug, and deleting the channel does not remove them. A slug that no longer names a channel simply stops resolving. The consequence is that the assignments OUTLIVE the row. Create a channel again under a code a deleted one used and it silently adopts every assignment ever made against that code — which is the opposite of the fresh channel the call looks like it produces. If that is not what you want, choose a new code. The other half is the default flag, which nothing here protects. There is no rule that a tenant keeps at least one channel and none reserving the one flagged \`is_default\` — both of which the channel TYPES do have — so deleting the default is permitted and leaves the tenant without one. From that moment every request that names no channel resolves to nothing: \`GET /channels/context\` answers resolved:false with reason no_default_channel, and \`POST /channels/visibility\` hides every row that carries assignments (no_channel_context) while rows carrying none still follow the tenant policy. Promote another channel first, or restore the seeded \`shop\` with POST /channels/defaults — which brings back \`shop\`, never the code you deleted.`)
  .option(`--id <id>`, `The channel, by id. This is the uuid, not the \`code\` — filter the list with ?code= to go the other way.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`channels delete`);
        const _client = await sdkForProject();
        const _apiPath = `/channels/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The channel, by id. This is the uuid, not the `code` — filter the list with ?code= to go the other way.", type: "string", required: true, resource: { listPath: "/channels", hasLimit: true } },
];
channels
  .command(`get`)
  .description(`One row, by its uuid. The \`code\` is the handle everything else in the platform uses — it is the scope slug Baseline stores assignments against — and this route does not accept it: to go from a slug to the channel that owns it, use \`GET /channels?code=…\`, which answers the same row inside the list envelope. What this does NOT tell you is whether the request is in this channel. It returns an inactive channel as readily as an active one and applies no policy: which channel a caller is in, and what an unassigned row means there, is \`GET /channels/context\`. Answers are cached per tenant for 30 minutes and invalidated on any write to \`channels\`, so a read that follows someone else's write within that window can be stale by exactly one revision.`)
  .option(`--id <id>`, `The channel, by id. This is the uuid, not the \`code\` — filter the list with ?code= to go the other way.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(channels.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The channel, by id. This is the uuid, not the `code` — filter the list with ?code= to go the other way.", type: "string", required: true, resource: { listPath: "/channels", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Stable channel code, unique per tenant (e.g. shop, punchout-acme). It is the scope slug Baseline matches channel assignments on, so it is held to Baseline's own shape: lowercase a-z/0-9 first, then a-z/0-9/_/-, up to 63 characters. Anything else is refused — a code that cannot be a scope slug leaves the channel unable to filter.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Mark as the default channel (default false). At most one channel carries it — setting it demotes the previous holder.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names. A locale map keyed by language tag: {\"en\": …, \"de\": …}. Read the requested tag and fall back to the plain column beside it.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position (default 0).", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Lifecycle status (default 'active'). Whether the channel is in service. What 'inactive' DOES is the tenant's inactive_channel_behavior setting: on 'serve' it is a label and the channel still resolves, on 'block' /channels/context answers resolved:false with reason 'channel_inactive'. Served as the 'channels.statuses' vocabulary.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "type", option: "--type <type>", name: "type", description: "Which channel type this is. One of the codes the tenant keeps under GET /channels/types — served with labels as the 'channels.types' vocabulary. Deliberately NOT an enum: the set is the tenant's own rows, not a CHECK constraint this repo could quote. A fresh install starts with storefront, punchout, marketplace, api, pos, which is why 'storefront' is the example here, but a merchant may rename or retire any of them and add their own (a feed or a print channel), so read the list rather than assuming it. Omitted on create it falls back to the type the tenant flagged as their default, never to a hardcoded value; a code the tenant does not keep is a 400 that names the ones they do.", type: "string", required: false },
  { key: "unassignedVisibility", option: "--unassigned-visibility <unassigned-visibility>", name: "unassigned_visibility", description: "Default 'inherit'. What it means, IN THIS CHANNEL, that a row carries no channel assignment at all — the per-channel override of the tenant-wide unassigned_channel_visibility setting. 'inherit' (the default) takes the tenant's answer and changes nothing. 'all' shows unassigned rows: everything is on sale unless somebody carved it out, which is what an open storefront wants and what Baseline's is_visible() does today. 'assigned_only' hides them until they are explicitly assigned — the negotiated assortment a punchout contract describes, and the one answer the generated _scoped view has no way to express, which is why POST /channels/visibility exists to apply it. Rows that DO carry assignments are unaffected either way. Served with its labels as the 'channels.unassigned-visibility' vocabulary.", type: "string", required: false, enum: ["inherit","all","assigned_only"] },
];
channels
  .command(`update`)
  .description(`A partial write: send the fields you are changing, keep the rest. An empty body is a 400 rather than a no-op, so a client that computed no diff hears about it. Two of these fields do more than they look like they do, and neither is guarded the way its counterpart on the channel TYPES is. Sending \`code\` is accepted — it is only checked for scope-slug shape — and nothing follows it: the assignments other apps made are held by Baseline against the OLD slug, there is no foreign key to cascade, so a rename silently detaches every one of them and the channel filters as if it had just been created. The types route refuses the same edit outright for the same reason; here it is permitted, so do it deliberately or not at all. And \`is_default\` is a two-way switch here. Setting it true demotes whoever held it, which is what you want; setting it FALSE on the only holder leaves the tenant with no default channel at all, and every request that names none then resolves to nothing — \`GET /channels/context\` answers resolved:false with reason no_default_channel. Promote another channel in the same breath. On the types route sending false does nothing, precisely because some row must hold that flag; channels have no such rule.`)
  .option(`--id <id>`, `The channel, by id. This is the uuid, not the \`code\` — filter the list with ?code= to go the other way.`)
  .option(`--code <code>`, `Stable channel code, unique per tenant (e.g. shop, punchout-acme). It is the scope slug Baseline matches channel assignments on, so it is held to Baseline's own shape: lowercase a-z/0-9 first, then a-z/0-9/_/-, up to 63 characters. Anything else is refused — a code that cannot be a scope slug leaves the channel unable to filter.`)
  .option(
    `--is-default [value]`,
    `Mark as the default channel (default false). At most one channel carries it — setting it demotes the previous holder.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names. A locale map keyed by language tag: {"en": …, "de": …}. Read the requested tag and fall back to the plain column beside it.`)
  .option(`--name <name>`, `Display name.`)
  .option(`--position <position>`, `Sort position (default 0).`, parseInteger)
  .option(`--status <status>`, `Lifecycle status (default 'active'). Whether the channel is in service. What 'inactive' DOES is the tenant's inactive_channel_behavior setting: on 'serve' it is a label and the channel still resolves, on 'block' /channels/context answers resolved:false with reason 'channel_inactive'. Served as the 'channels.statuses' vocabulary.`)
  .option(`--type <type>`, `Which channel type this is. One of the codes the tenant keeps under GET /channels/types — served with labels as the 'channels.types' vocabulary. Deliberately NOT an enum: the set is the tenant's own rows, not a CHECK constraint this repo could quote. A fresh install starts with storefront, punchout, marketplace, api, pos, which is why 'storefront' is the example here, but a merchant may rename or retire any of them and add their own (a feed or a print channel), so read the list rather than assuming it. Omitted on create it falls back to the type the tenant flagged as their default, never to a hardcoded value; a code the tenant does not keep is a 400 that names the ones they do.`)
  .option(`--unassigned-visibility <unassigned-visibility>`, `Default 'inherit'. What it means, IN THIS CHANNEL, that a row carries no channel assignment at all — the per-channel override of the tenant-wide unassigned_channel_visibility setting. 'inherit' (the default) takes the tenant's answer and changes nothing. 'all' shows unassigned rows: everything is on sale unless somebody carved it out, which is what an open storefront wants and what Baseline's is_visible() does today. 'assigned_only' hides them until they are explicitly assigned — the negotiated assortment a punchout contract describes, and the one answer the generated _scoped view has no way to express, which is why POST /channels/visibility exists to apply it. Rows that DO carry assignments are unaffected either way. Served with its labels as the 'channels.unassigned-visibility' vocabulary.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, isDefault, labels, name, position, status, type, unassignedVisibility } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/channels/{id}`.replace(`{id}`, id);
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
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (unassignedVisibility !== undefined) {
          _payload[`unassigned_visibility`] = unassignedVisibility;
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
registerPromptSpecs(channels.commands.at(-1)!, updateSpecs, { method: "put" });
