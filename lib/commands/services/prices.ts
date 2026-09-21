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

export const prices = new Command("prices")
  .description(
    commandDescriptions["prices"] ??
      `Commerce Studio Prices App — product prices as PRICE LISTS with the full field repertoire: quantity tiers (Staffelpreise), per-entry validity windows (promo prices), currency per list, priorities and buyer scoping (contact, organization, channel — customer segments dock on later). Every list states whether its amounts are NET or GROSS, and a list that does not falls back to the tenant's declared basis instead of to a column default nobody chose; the resolve answer names which of the two decided. Rounding (decimals, mode, merchant price endings) is tenant policy, not a hardcoded wire scale. A missing price is a first-class state: the resolve call answers on_request instead of 0 — the storefront shows 'price on request', never €0. POST /prices/resolve is THE live price call and the designated override point: ERP-priced tenants replace exactly this one capability with a custom app via the gateway capability override while the configuration CRUD stays standard.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listsListSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Filter to one list by id. The same row `GET /prices/lists/{id}` returns, in page form.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Filter by the exact list code — the unique per-tenant handle every integration joins on.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Filter by the exact operator-facing name. Exact match, not a search: prefer `code`.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Filter by the exact description text. Exact match, not a search.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Filter to one ISO 4217 currency. Resolution only ever considers lists in the currency of the call, so this is how to see the set a given quote can draw on.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Filter by status. Only `active` lists take part in resolution, so `?status=active` is the candidate set.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Filter to one exact priority value — the tie-break within a specificity group.", type: "integer", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Filter to the default list — the one `prices.lists.make-default` moves the flag onto. `?is_default=true` should answer exactly one row; two is the state that leaves a tie unsettled.", type: "boolean", required: false },
  { key: "taxBasis", option: "--tax-basis <tax-basis>", name: "tax_basis", description: "Filter by declared basis. `?tax_basis=` cannot select the lists that state NONE (a filter is an equality, never a null test) — those are the lists that inherit the tenant’s `tax_inclusive_default`, and the resolve answer names them with `tax_basis_source: \"tenant\"`.", type: "string", required: false, enum: ["net","gross"] },
  { key: "taxIncluded", option: "--tax-included <tax-included>", name: "tax_included", description: "Filter by the legacy gross mirror. `?tax_included=true` finds the lists whose basis was stated the old way.", type: "boolean", required: false },
  { key: "requiresAuth", option: "--requires-auth <requires-auth>", name: "requires_auth", description: "Filter to the lists that resolve only for an authenticated buyer — what an anonymous storefront will never see.", type: "boolean", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Filter to the lists scoped to one contact — the most specific buyer scope there is.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to the lists scoped to one organization.", type: "string", required: false },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "Filter to the lists scoped to one sales channel.", type: "string", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", description: "Exact equality on the start of the list’s validity window — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by `order` plus `limit`.", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "Exact equality on the end of the list’s validity window — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by `order` plus `limit`.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact equality on the creation instant — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by `order` plus `limit`.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact equality on the last change — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by `order` plus `limit`.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
prices
  .command(`lists-list`)
  .description(`One page of the tenant's price list HEADERS — code, currency, tax basis, status, priority, validity window, buyer scope and the default flag. Never the prices themselves: those are a separate page per list (\`GET /prices/lists/{list_id}/entries\`).

Every filter is an EXACT match on a column, ANDed together; a query key that is not a column is dropped in silence, which is why the answer echoes \`filter\`. The scope, currency and status filters are the useful ones, because between them they narrow the set to the candidates a resolve call in a given currency for a given buyer can draw on at all.

Market is deliberately not among them: a list is scoped to a market by an assignment, not a column, and the \`X-Revenexx-Market\` header is what narrows the set — this admin listing shows the tenant's lists whatever their market.`)
  .option(`--id <id>`, `Filter to one list by id. The same row \`GET /prices/lists/{id}\` returns, in page form.`)
  .option(`--code <code>`, `Filter by the exact list code — the unique per-tenant handle every integration joins on.`)
  .option(`--name <name>`, `Filter by the exact operator-facing name. Exact match, not a search: prefer \`code\`.`)
  .option(`--description <description>`, `Filter by the exact description text. Exact match, not a search.`)
  .option(`--currency <currency>`, `Filter to one ISO 4217 currency. Resolution only ever considers lists in the currency of the call, so this is how to see the set a given quote can draw on.`)
  .option(`--status <status>`, `Filter by status. Only \`active\` lists take part in resolution, so \`?status=active\` is the candidate set.`)
  .option(`--priority <priority>`, `Filter to one exact priority value — the tie-break within a specificity group.`, parseInteger)
  .option(
    `--is-default [value]`,
    `Filter to the default list — the one \`prices.lists.make-default\` moves the flag onto. \`?is_default=true\` should answer exactly one row; two is the state that leaves a tie unsettled.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--tax-basis <tax-basis>`, `Filter by declared basis. \`?tax_basis=\` cannot select the lists that state NONE (a filter is an equality, never a null test) — those are the lists that inherit the tenant’s \`tax_inclusive_default\`, and the resolve answer names them with \`tax_basis_source: "tenant"\`.`)
  .option(
    `--tax-included [value]`,
    `Filter by the legacy gross mirror. \`?tax_included=true\` finds the lists whose basis was stated the old way.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--requires-auth [value]`,
    `Filter to the lists that resolve only for an authenticated buyer — what an anonymous storefront will never see.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--contact-id <contact-id>`, `Filter to the lists scoped to one contact — the most specific buyer scope there is.`)
  .option(`--organization-id <organization-id>`, `Filter to the lists scoped to one organization.`)
  .option(`--channel-id <channel-id>`, `Filter to the lists scoped to one sales channel.`)
  .option(`--valid-from <valid-from>`, `Exact equality on the start of the list’s validity window — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by \`order\` plus \`limit\`.`)
  .option(`--valid-until <valid-until>`, `Exact equality on the end of the list’s validity window — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by \`order\` plus \`limit\`.`)
  .option(`--created-at <created-at>`, `Exact equality on the creation instant — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by \`order\` plus \`limit\`.`)
  .option(`--updated-at <updated-at>`, `Exact equality on the last change — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by \`order\` plus \`limit\`.`)
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
        const { id, code, name, description, currency, status, priority, isDefault, taxBasis, taxIncluded, requiresAuth, contactId, organizationId, channelId, validFrom, validUntil, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          listsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists`;
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
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (taxBasis !== undefined) {
          _payload[`tax_basis`] = taxBasis;
        }
        if (taxIncluded !== undefined) {
          _payload[`tax_included`] = taxIncluded;
        }
        if (requiresAuth !== undefined) {
          _payload[`requires_auth`] = requiresAuth;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (validFrom !== undefined) {
          _payload[`valid_from`] = validFrom;
        }
        if (validUntil !== undefined) {
          _payload[`valid_until`] = validUntil;
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
registerPromptSpecs(prices.commands.at(-1)!, listsListSpecs, { method: "get" });
const listsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Unique list code per tenant — the handle every import and integration addresses this list by. A code already in use answers 409.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Operator-facing name, shown wherever a human picks a list.", type: "string", required: true },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "Scope: only this sales channel. Beats the open lists, loses to contact and organization.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Scope: only this contact. The most specific scope there is — it beats organization, channel and every open list, whatever their priority.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR) — the currency of EVERY amount in this list, since entries carry none of their own. Resolution only considers lists matching the currency of the call; nothing is ever converted.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Free text for whoever maintains the list — why it exists and who it is for. Never shown to a buyer.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The fallback list. Within its group it sorts LAST, so it wins only where nothing more specific priced the item. Use prices.lists.make-default to move the flag rather than setting it here — two defaults leave a tie to row order.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localised names, keyed by language tag — {\"de\": \"Händlerpreise\", \"en\": \"Dealer prices\"}. Omit to show `name` everywhere.", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form bag: whatever JSON object you write round-trips exactly, and this app never reads it. Its keys are yours — ERP provenance is the usual content.", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Scope: only buyers of this organization. Beats channel-scoped and open lists.", type: "string", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Tie-break WITHIN a specificity group (higher wins, default 0). It never beats scope: an organization list at 0 still wins over an open list at 100.", type: "integer", required: false },
  { key: "requiresAuth", option: "--requires-auth <requires-auth>", name: "requires_auth", description: "Gate: when true the list resolves only for an authenticated buyer (contact or organization context); anonymous resolve calls get on_request. Default false (open to everyone).", type: "boolean", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'active' — only active lists resolve. 'inactive' retires a list without deleting its prices.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "taxBasis", option: "--tax-basis <tax-basis>", name: "tax_basis", description: "Whether the amounts in this list are net (tax excluded) or gross (tax included) — the one fact a price cannot be without. Omit (null) to inherit the tenant's tax_inclusive_default setting; the resolve answer names which of the two decided under tax_basis_source.", type: "string", required: false, enum: ["net","gross"] },
  { key: "taxIncluded", option: "--tax-included <tax-included>", name: "tax_included", description: "LEGACY mirror of tax_basis. false is the column default and is NOT read as a statement of intent; true is read as gross, and only where tax_basis is null. Prefer tax_basis.", type: "boolean", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", description: "Start of the validity window of the WHOLE list (ISO 8601); null = open-ended. Outside it the list is not a candidate at all.", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "End of the validity window of the whole list; null = open-ended. Lets a season expire on its own instead of being deactivated by hand.", type: "string", required: false },
];
prices
  .command(`lists-create`)
  .description(`Opens an empty book, and states in one row the four things that decide whether it will ever price anything: its currency, its priority within a specificity group, its validity window, and its buyer scope (contact, organization or channel — leave all three empty for a list open to everyone).

\`code\` and \`name\` are the only fields required — they are the two columns with no default — and \`code\` is unique per tenant, so a code already in use is a 409 rather than an overwrite of prices somebody is selling on.

Everything else has a default, and two of them are worth choosing rather than accepting. \`currency\` defaults to EUR and is the currency of every amount in the list, since entries carry none; a resolve call only considers lists in the currency it is asked about, and nothing is ever converted. \`tax_basis\` defaults to NOTHING, which means the amounts inherit the tenant's \`tax_inclusive_default\` — state net or gross here and the answer stops depending on a tenant setting somebody may change later.

\`is_default: true\` here does NOT demote the list that currently holds the flag: you end up with two defaults, and which of them prices an item is left to the tenant's tie-break. Create the list, then move the flag with \`POST /prices/lists/{list_id}/make-default\`.

A new list prices nothing at all until it has entries, so it is inert until you add them — which makes it safe to create one ahead of the prices that will fill it.`)
  .option(`--code <code>`, `Unique list code per tenant — the handle every import and integration addresses this list by. A code already in use answers 409.`)
  .option(`--name <name>`, `Operator-facing name, shown wherever a human picks a list.`)
  .option(`--channel-id <channel-id>`, `Scope: only this sales channel. Beats the open lists, loses to contact and organization.`)
  .option(`--contact-id <contact-id>`, `Scope: only this contact. The most specific scope there is — it beats organization, channel and every open list, whatever their priority.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR) — the currency of EVERY amount in this list, since entries carry none of their own. Resolution only considers lists matching the currency of the call; nothing is ever converted.`)
  .option(`--description <description>`, `Free text for whoever maintains the list — why it exists and who it is for. Never shown to a buyer.`)
  .option(
    `--is-default [value]`,
    `The fallback list. Within its group it sorts LAST, so it wins only where nothing more specific priced the item. Use prices.lists.make-default to move the flag rather than setting it here — two defaults leave a tie to row order.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localised names, keyed by language tag — {"de": "Händlerpreise", "en": "Dealer prices"}. Omit to show \`name\` everywhere.`)
  .option(`--metadata <metadata>`, `Free-form bag: whatever JSON object you write round-trips exactly, and this app never reads it. Its keys are yours — ERP provenance is the usual content.`)
  .option(`--organization-id <organization-id>`, `Scope: only buyers of this organization. Beats channel-scoped and open lists.`)
  .option(`--priority <priority>`, `Tie-break WITHIN a specificity group (higher wins, default 0). It never beats scope: an organization list at 0 still wins over an open list at 100.`, parseInteger)
  .option(
    `--requires-auth [value]`,
    `Gate: when true the list resolves only for an authenticated buyer (contact or organization context); anonymous resolve calls get on_request. Default false (open to everyone).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--status <status>`, `Default 'active' — only active lists resolve. 'inactive' retires a list without deleting its prices.`)
  .option(`--tax-basis <tax-basis>`, `Whether the amounts in this list are net (tax excluded) or gross (tax included) — the one fact a price cannot be without. Omit (null) to inherit the tenant's tax_inclusive_default setting; the resolve answer names which of the two decided under tax_basis_source.`)
  .option(
    `--tax-included [value]`,
    `LEGACY mirror of tax_basis. false is the column default and is NOT read as a statement of intent; true is read as gross, and only where tax_basis is null. Prefer tax_basis.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--valid-from <valid-from>`, `Start of the validity window of the WHOLE list (ISO 8601); null = open-ended. Outside it the list is not a candidate at all.`)
  .option(`--valid-until <valid-until>`, `End of the validity window of the whole list; null = open-ended. Lets a season expire on its own instead of being deactivated by hand.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, channelId, contactId, currency, description, isDefault, labels, metadata, organizationId, priority, requiresAuth, status, taxBasis, taxIncluded, validFrom, validUntil } = await promptForMissing(
          _options,
          listsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
        if (priority !== undefined) {
          _payload[`priority`] = priority;
        }
        if (requiresAuth !== undefined) {
          _payload[`requires_auth`] = requiresAuth;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (taxBasis !== undefined) {
          _payload[`tax_basis`] = taxBasis;
        }
        if (taxIncluded !== undefined) {
          _payload[`tax_included`] = taxIncluded;
        }
        if (validFrom !== undefined) {
          _payload[`valid_from`] = validFrom;
        }
        if (validUntil !== undefined) {
          _payload[`valid_until`] = validUntil;
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
registerPromptSpecs(prices.commands.at(-1)!, listsCreateSpecs, { method: "post" });
prices
  .command(`lists-defaults`)
  .description(`Gives a tenant the one open list every tenant needs, so nothing has to exist before the first price can be written. Almost nobody calls it: the app runs it by itself on \`app.installed\`, and the route is the manual re-run — for a tenant installed before that hook existed, or one whose standard list was deleted. Because it is idempotent it is also safe to call from a provisioning script that cannot know which of the two is the case.

What it writes comes from settings, not from constants: the code is the tenant's \`default_price_list_code\`, the currency its \`default_currency\`, and the seeded list STATES its tax basis from \`tax_inclusive_default\` instead of inheriting it, because the one list every tenant gets should not be the ambiguous one.

Idempotent twice over — by that code, and by the existence of ANY default list. So calling it repeatedly is free, changing \`default_price_list_code\` later never produces a second list, and a tenant that has made some other list the default is left exactly as it is (the answer names that list under \`existing\`). It writes nothing else: it never demotes, never touches entries, and never repairs a list that is already there.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/defaults`;
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
const listsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The price list, by id.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
];
prices
  .command(`lists-delete`)
  .description(`Deletes the list AND every price in it. \`price_entries.price_list_id\` references this row ON DELETE CASCADE, so the entries go in the same statement: nothing asks, nothing blocks, a book of 40 000 prices deletes exactly as fast as an empty one, and the answer is a bare \`{deleted, id}\` that never says how many prices went with it.

What that means while a storefront is quoting: from the next resolve call the items this list priced fall through to the next candidate list, and where there is none the answer is \`on_request\` — "price on request" for something that had a price a second ago, never €0. If the deleted list held the default flag the tenant has no default until one is moved onto another list; re-running \`POST /prices/lists/defaults\` recreates the standard list only while no other default exists.

This is not the way to take a list out of circulation. \`status: "inactive"\` does that immediately and reversibly and keeps the prices; deleting is for a list whose contents you are prepared to import again, because nothing here is recoverable.`)
  .option(`--id <id>`, `The price list, by id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          listsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`prices lists-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(prices.commands.at(-1)!, listsDeleteSpecs, { method: "delete", destructive: true });
const listsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The price list, by id.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
];
prices
  .command(`lists-get`)
  .description(`The list HEADER, never its prices: currency, tax basis, buyer scope, priority, validity window and the default flag — the settings that decide WHETHER this list prices a given buyer, before any amount is looked at. Its entries are a separate page (\`GET /prices/lists/{list_id}/entries\`), because a price book runs to thousands of rows and no read of a list should carry them. This is the admin view and it reads the base table rather than the market-scoped one the resolve call uses, so a list that is invisible in the active market is still returned here.`)
  .option(`--id <id>`, `The price list, by id.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          listsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(prices.commands.at(-1)!, listsGetSpecs, { method: "get" });
const listsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The price list, by id.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "Scope: only this sales channel. Beats the open lists, loses to contact and organization.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Unique list code per tenant — the handle every import and integration addresses this list by. A code already in use answers 409.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Scope: only this contact. The most specific scope there is — it beats organization, channel and every open list, whatever their priority.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR) — the currency of EVERY amount in this list, since entries carry none of their own. Resolution only considers lists matching the currency of the call; nothing is ever converted.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", description: "Free text for whoever maintains the list — why it exists and who it is for. Never shown to a buyer.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The fallback list. Within its group it sorts LAST, so it wins only where nothing more specific priced the item. Use prices.lists.make-default to move the flag rather than setting it here — two defaults leave a tie to row order.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localised names, keyed by language tag — {\"de\": \"Händlerpreise\", \"en\": \"Dealer prices\"}. Omit to show `name` everywhere.", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form bag: whatever JSON object you write round-trips exactly, and this app never reads it. Its keys are yours — ERP provenance is the usual content.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Operator-facing name, shown wherever a human picks a list.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Scope: only buyers of this organization. Beats channel-scoped and open lists.", type: "string", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Tie-break WITHIN a specificity group (higher wins, default 0). It never beats scope: an organization list at 0 still wins over an open list at 100.", type: "integer", required: false },
  { key: "requiresAuth", option: "--requires-auth <requires-auth>", name: "requires_auth", description: "Gate: when true the list resolves only for an authenticated buyer (contact or organization context); anonymous resolve calls get on_request. Default false (open to everyone).", type: "boolean", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'active' — only active lists resolve. 'inactive' retires a list without deleting its prices.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "taxBasis", option: "--tax-basis <tax-basis>", name: "tax_basis", description: "Whether the amounts in this list are net (tax excluded) or gross (tax included) — the one fact a price cannot be without. Omit (null) to inherit the tenant's tax_inclusive_default setting; the resolve answer names which of the two decided under tax_basis_source.", type: "string", required: false, enum: ["net","gross"] },
  { key: "taxIncluded", option: "--tax-included <tax-included>", name: "tax_included", description: "LEGACY mirror of tax_basis. false is the column default and is NOT read as a statement of intent; true is read as gross, and only where tax_basis is null. Prefer tax_basis.", type: "boolean", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", description: "Start of the validity window of the WHOLE list (ISO 8601); null = open-ended. Outside it the list is not a candidate at all.", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "End of the validity window of the whole list; null = open-ended. Lets a season expire on its own instead of being deactivated by hand.", type: "string", required: false },
];
prices
  .command(`lists-update`)
  .description(`A partial update: send only what changes, omitted fields keep their value, and a payload with no updatable column at all is refused rather than answered with an unchanged row. There is no draft and no publish step — the next resolve call reads what this one wrote.

Three edits do more than their field names suggest. \`currency\` re-denominates without converting: entries carry no currency of their own, so 19.90 EUR becomes 19.90 CHF and the whole book is re-priced by one edit. \`status: "inactive"\` takes the list out of every quote immediately while keeping its prices — the reversible way to stop selling on a list, and the one to reach for instead of deleting it. \`code\` is the handle imports and integrations address the list by, and a code another list already holds is a 409.

\`is_default\` behaves here exactly as it does on create: setting it true leaves the incumbent default in place, so use \`POST /prices/lists/{list_id}/make-default\`, which demotes in the same call.`)
  .option(`--id <id>`, `The price list, by id.`)
  .option(`--channel-id <channel-id>`, `Scope: only this sales channel. Beats the open lists, loses to contact and organization.`)
  .option(`--code <code>`, `Unique list code per tenant — the handle every import and integration addresses this list by. A code already in use answers 409.`)
  .option(`--contact-id <contact-id>`, `Scope: only this contact. The most specific scope there is — it beats organization, channel and every open list, whatever their priority.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR) — the currency of EVERY amount in this list, since entries carry none of their own. Resolution only considers lists matching the currency of the call; nothing is ever converted.`)
  .option(`--description <description>`, `Free text for whoever maintains the list — why it exists and who it is for. Never shown to a buyer.`)
  .option(
    `--is-default [value]`,
    `The fallback list. Within its group it sorts LAST, so it wins only where nothing more specific priced the item. Use prices.lists.make-default to move the flag rather than setting it here — two defaults leave a tie to row order.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localised names, keyed by language tag — {"de": "Händlerpreise", "en": "Dealer prices"}. Omit to show \`name\` everywhere.`)
  .option(`--metadata <metadata>`, `Free-form bag: whatever JSON object you write round-trips exactly, and this app never reads it. Its keys are yours — ERP provenance is the usual content.`)
  .option(`--name <name>`, `Operator-facing name, shown wherever a human picks a list.`)
  .option(`--organization-id <organization-id>`, `Scope: only buyers of this organization. Beats channel-scoped and open lists.`)
  .option(`--priority <priority>`, `Tie-break WITHIN a specificity group (higher wins, default 0). It never beats scope: an organization list at 0 still wins over an open list at 100.`, parseInteger)
  .option(
    `--requires-auth [value]`,
    `Gate: when true the list resolves only for an authenticated buyer (contact or organization context); anonymous resolve calls get on_request. Default false (open to everyone).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--status <status>`, `Default 'active' — only active lists resolve. 'inactive' retires a list without deleting its prices.`)
  .option(`--tax-basis <tax-basis>`, `Whether the amounts in this list are net (tax excluded) or gross (tax included) — the one fact a price cannot be without. Omit (null) to inherit the tenant's tax_inclusive_default setting; the resolve answer names which of the two decided under tax_basis_source.`)
  .option(
    `--tax-included [value]`,
    `LEGACY mirror of tax_basis. false is the column default and is NOT read as a statement of intent; true is read as gross, and only where tax_basis is null. Prefer tax_basis.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--valid-from <valid-from>`, `Start of the validity window of the WHOLE list (ISO 8601); null = open-ended. Outside it the list is not a candidate at all.`)
  .option(`--valid-until <valid-until>`, `End of the validity window of the whole list; null = open-ended. Lets a season expire on its own instead of being deactivated by hand.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, channelId, code, contactId, currency, description, isDefault, labels, metadata, name, organizationId, priority, requiresAuth, status, taxBasis, taxIncluded, validFrom, validUntil } = await promptForMissing(
          _options,
          listsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
        if (priority !== undefined) {
          _payload[`priority`] = priority;
        }
        if (requiresAuth !== undefined) {
          _payload[`requires_auth`] = requiresAuth;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (taxBasis !== undefined) {
          _payload[`tax_basis`] = taxBasis;
        }
        if (taxIncluded !== undefined) {
          _payload[`tax_included`] = taxIncluded;
        }
        if (validFrom !== undefined) {
          _payload[`valid_from`] = validFrom;
        }
        if (validUntil !== undefined) {
          _payload[`valid_until`] = validUntil;
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
registerPromptSpecs(prices.commands.at(-1)!, listsUpdateSpecs, { method: "put" });
const entriesListSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "Filter to one entry by id, within this list.", type: "string", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Filter to one product — the whole tier ladder that prices it, in this list.", type: "string", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Filter by exact SKU. Not a prefix and not case-insensitive — the bulk adjust route is where `sku_prefix` lives.", type: "string", required: false },
  { key: "priceType", option: "--price-type <price-type>", name: "price_type", description: "Filter by entry type. `on_request` selects the explicit no-price markers, which is how to audit what a list refuses to quote.", type: "string", required: false, enum: ["standard","on_request"] },
  { key: "quantityMin", option: "--quantity-min <quantity-min>", name: "quantity_min", description: "Filter to one exact tier threshold — `?quantity_min=1` is the base rung of every ladder in the list.", type: "number", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", description: "Filter to entries at one exact amount, in the list’s currency and on its tax basis. Equality, not a range — `?unit_price=0` finds the rows nobody has priced yet.", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "Filter by exact unit of measure.", type: "string", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", description: "Exact equality on the start of the entry’s own validity — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by `order` plus `limit`.", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "Exact equality on the end of the entry’s own validity — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by `order` plus `limit`.", type: "string", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact equality on the creation instant — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by `order` plus `limit`.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact equality on the last change — a bulk adjust only writes the rows whose price actually moved — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by `order` plus `limit`.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort by one column: 'column' | 'column.asc' | 'column.desc'. A bare column sorts ascending. Anything else is refused with 400.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
prices
  .command(`entries-list`)
  .description(`The prices inside one list, a page at a time. An entry is a rung rather than "the price of a product": it carries a quantity threshold, an amount and a unit, its own validity window, and — where the answer is deliberately no number at all — an \`on_request\` marker instead of one. So this page is where the quantity tiers, the promo windows and the "ask us" markers of a book are read.

The ladder of one item is the set of entries sharing an identity, so \`?product_id=…\` (or \`?sku=…\`) is how a caller reads the Staffel a resolve answer was built from, and \`?price_type=on_request\` is how the markers are audited. The response also carries \`page\` and \`filter\` like every other list, and an unknown list_id answers 404 instead of an empty page.`)
  .option(`--list-id <list-id>`, `The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.`)
  .option(`--id <id>`, `Filter to one entry by id, within this list.`)
  .option(`--product-id <product-id>`, `Filter to one product — the whole tier ladder that prices it, in this list.`)
  .option(`--sku <sku>`, `Filter by exact SKU. Not a prefix and not case-insensitive — the bulk adjust route is where \`sku_prefix\` lives.`)
  .option(`--price-type <price-type>`, `Filter by entry type. \`on_request\` selects the explicit no-price markers, which is how to audit what a list refuses to quote.`)
  .option(`--quantity-min <quantity-min>`, `Filter to one exact tier threshold — \`?quantity_min=1\` is the base rung of every ladder in the list.`, parseInteger)
  .option(`--unit-price <unit-price>`, `Filter to entries at one exact amount, in the list’s currency and on its tax basis. Equality, not a range — \`?unit_price=0\` finds the rows nobody has priced yet.`, parseInteger)
  .option(`--unit <unit>`, `Filter by exact unit of measure.`)
  .option(`--valid-from <valid-from>`, `Exact equality on the start of the entry’s own validity — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by \`order\` plus \`limit\`.`)
  .option(`--valid-until <valid-until>`, `Exact equality on the end of the entry’s own validity — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by \`order\` plus \`limit\`.`)
  .option(`--created-at <created-at>`, `Exact equality on the creation instant — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by \`order\` plus \`limit\`.`)
  .option(`--updated-at <updated-at>`, `Exact equality on the last change — a bulk adjust only writes the rows whose price actually moved — matched to the stored microsecond, not a range. This app publishes no from/until query; narrow a period client-side, or by \`order\` plus \`limit\`.`)
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
        const { listId, id, productId, sku, priceType, quantityMin, unitPrice, unit, validFrom, validUntil, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          entriesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries`.replace(`{list_id}`, listId);
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
        if (priceType !== undefined) {
          _payload[`price_type`] = priceType;
        }
        if (quantityMin !== undefined) {
          _payload[`quantity_min`] = quantityMin;
        }
        if (unitPrice !== undefined) {
          _payload[`unit_price`] = unitPrice;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (validFrom !== undefined) {
          _payload[`valid_from`] = validFrom;
        }
        if (validUntil !== undefined) {
          _payload[`valid_until`] = validUntil;
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
registerPromptSpecs(prices.commands.at(-1)!, entriesListSpecs, { method: "get" });
const entriesCreateSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form bag: whatever JSON object you write round-trips exactly, and this app never reads it. Its keys are yours.", type: "object", required: false },
  { key: "priceType", option: "--price-type <price-type>", name: "price_type", description: "Default 'standard'; 'on_request' is the explicit no-price marker — it STOPS resolution for this item on this list and answers \"price on request\" even where a cheaper list exists.", type: "string", required: false, enum: ["standard","on_request"] },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The product this rung prices. An entry needs product_id or sku — the row CHECK enforces it.", type: "string", required: false },
  { key: "quantityMin", option: "--quantity-min <quantity-min>", name: "quantity_min", description: "Tier threshold (Staffelpreis): this price applies from this quantity upwards (default 1). The rungs of one item are the entries sharing its identity; the highest threshold at or below the requested quantity wins.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The article number this rung prices (alternative to product_id). Matched exactly on resolve — never normalised or case-folded.", type: "string", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "Unit of measure the price is per — free text, neither validated nor converted here. A resolve call’s `quantity` is counted in it.", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", description: "Price for ONE unit of `unit`, in the LIST’s currency and on the LIST’s tax basis — a decimal amount in major units (19.90), never minor units/cents. Stored at 4 decimals and echoed back exactly as sent (default 0).", type: "number", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", description: "Start of this entry’s own validity (ISO 8601) — how a promo price is expressed: a second rung, live only for its window. null = open-ended.", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "End of this entry’s own validity; null = open-ended. Outside it the rung is skipped and the ladder resolves as if it were not there.", type: "string", required: false },
];
prices
  .command(`entries-create`)
  .description(`Adds ONE rung to one item's quantity ladder in this list. The only thing an entry must have is an identity — \`product_id\` or \`sku\`, which the row CHECK enforces; everything else defaults, and one of those defaults deserves a warning.

\`unit_price\` defaults to **0**. That is the one door through which a zero price enters an app whose whole doctrine is that a missing price is \`on_request\` and never €0: a create that forgets the amount publishes a free item, and the storefront shows 0.00 instead of "price on request". Send the amount, or send \`price_type: "on_request"\` where there genuinely is none. The amount is per ONE unit of \`unit\`, in the LIST's currency (entries carry none) and on the LIST's tax basis, as a decimal in major units — 19.90, never 1990.

Nothing enforces one rung per (item, quantity): create the same \`quantity_min\` twice and both rows come back in the resolved \`tiers\`, with the last of them setting the price — an ambiguous ladder no error ever mentions. \`quantity_min\` defaults to 1 and \`price_type\` to \`standard\`.

This route is for a rung at a time. A whole ladder in one call is \`POST …/entries/ladder\`, an import is \`POST …/entries/bulk\`, and a complete rewrite of the book is \`PUT …/entries\`. An unknown \`list_id\` answers 404 rather than attaching a price to nothing.`)
  .option(`--list-id <list-id>`, `The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.`)
  .option(`--metadata <metadata>`, `Free-form bag: whatever JSON object you write round-trips exactly, and this app never reads it. Its keys are yours.`)
  .option(`--price-type <price-type>`, `Default 'standard'; 'on_request' is the explicit no-price marker — it STOPS resolution for this item on this list and answers "price on request" even where a cheaper list exists.`)
  .option(`--product-id <product-id>`, `The product this rung prices. An entry needs product_id or sku — the row CHECK enforces it.`)
  .option(`--quantity-min <quantity-min>`, `Tier threshold (Staffelpreis): this price applies from this quantity upwards (default 1). The rungs of one item are the entries sharing its identity; the highest threshold at or below the requested quantity wins.`, parseInteger)
  .option(`--sku <sku>`, `The article number this rung prices (alternative to product_id). Matched exactly on resolve — never normalised or case-folded.`)
  .option(`--unit <unit>`, `Unit of measure the price is per — free text, neither validated nor converted here. A resolve call’s \`quantity\` is counted in it.`)
  .option(`--unit-price <unit-price>`, `Price for ONE unit of \`unit\`, in the LIST’s currency and on the LIST’s tax basis — a decimal amount in major units (19.90), never minor units/cents. Stored at 4 decimals and echoed back exactly as sent (default 0).`, parseInteger)
  .option(`--valid-from <valid-from>`, `Start of this entry’s own validity (ISO 8601) — how a promo price is expressed: a second rung, live only for its window. null = open-ended.`)
  .option(`--valid-until <valid-until>`, `End of this entry’s own validity; null = open-ended. Outside it the rung is skipped and the ladder resolves as if it were not there.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, metadata, priceType, productId, quantityMin, sku, unit, unitPrice, validFrom, validUntil } = await promptForMissing(
          _options,
          entriesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (priceType !== undefined) {
          _payload[`price_type`] = priceType;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantityMin !== undefined) {
          _payload[`quantity_min`] = quantityMin;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unitPrice !== undefined) {
          _payload[`unit_price`] = unitPrice;
        }
        if (validFrom !== undefined) {
          _payload[`valid_from`] = validFrom;
        }
        if (validUntil !== undefined) {
          _payload[`valid_until`] = validUntil;
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
registerPromptSpecs(prices.commands.at(-1)!, entriesCreateSpecs, { method: "post" });
const entriesReplaceSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "entries", option: "--entries [entries...]", name: "entries", description: "The complete new entry set (set semantics).", type: "array", required: true },
];
prices
  .command(`entries-replace`)
  .description(`Set semantics over the WHOLE list, not over one item: every entry of the list is deleted and the payload becomes the complete new book. It exists for the two callers that genuinely hold the whole book in hand — the Cockpit's table editor, whose save is this call, and a small import. \`entries: []\` is a legal payload and empties the list — the items it priced then resolve from the next candidate list, or come back \`on_request\`.

Two consequences of "delete, then insert". Every row is inserted fresh, so all entry ids change and anything holding one is stale afterwards. And it is not a transaction: the deletes go out before the inserts, so a payload that fails part-way through leaves the list holding the rows that landed and none of the ones it had. What protects you is that the whole payload is normalized and validated BEFORE the first delete — a malformed row is a 400 with the list untouched.

For a book of any size, or for adding to one you want to keep, use \`POST …/entries/bulk\`: it upserts in chunks and never wipes.`)
  .option(`--list-id <list-id>`, `The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.`)
  .option(`--entries [entries...]`, `The complete new entry set (set semantics).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, entries } = await promptForMissing(
          _options,
          entriesReplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (entries !== undefined) {
          _payload[`entries`] = entries;
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
registerPromptSpecs(prices.commands.at(-1)!, entriesReplaceSpecs, { method: "put" });
const entriesAdjustSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "amount", option: "--amount <amount>", name: "amount", description: "Absolute change added to every unit price, in the list's currency.", type: "number", required: false },
  { key: "dryRun", option: "--dry-run <dry-run>", name: "dry_run", description: "true writes nothing and answers the same preview — what the Cockpit dialog shows before it commits.", type: "boolean", required: false },
  { key: "percent", option: "--percent <percent>", name: "percent", description: "Relative change in percent: 5 raises by 5 %, -10 cuts by 10 %.", type: "number", required: false },
  { key: "rounding", option: "--rounding <rounding>", name: "rounding", description: "Ending the computed prices snap to (nearest match). Omit to use the tenant's bulk_adjust_rounding setting.", type: "string", required: false, enum: ["exact","whole","ending_99","ending_95","ending_50"] },
  { key: "skuPrefix", option: "--sku-prefix <sku-prefix>", name: "sku_prefix", description: "Restrict the change to entries whose SKU starts with this (a prefix, case-sensitive, no wildcards). Entries identified only by product_id never match a prefix. Omit to change the whole list.", type: "string", required: false },
];
prices
  .command(`entries-adjust`)
  .description(`Moves every priced entry of the list at once, in whichever of the two ways a merchant thinks about a price change: \`percent\` for a relative one (5 raises everything by 5 %) or \`amount\` for a flat one added to every unit price. One or the other, never both, and \`sku_prefix\` narrows the change to part of the book. On-request entries are never touched, because a percentage of "ask us" is not a number.

The other half of a bulk change is what the arithmetic leaves behind: a 7 % increase turns 19.90 into 21.293, which no merchant prints. Results are therefore rounded to the tenant's price_precision/rounding_mode and then snapped to a declared merchant price ending — x.99, x.95, a whole number — either the one this call names or the tenant's \`bulk_adjust_rounding\`. dry_run answers the same preview and writes nothing, which is what the Cockpit dialog shows before it commits.`)
  .option(`--list-id <list-id>`, `The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.`)
  .option(`--amount <amount>`, `Absolute change added to every unit price, in the list's currency.`, parseInteger)
  .option(
    `--dry-run [value]`,
    `true writes nothing and answers the same preview — what the Cockpit dialog shows before it commits.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--percent <percent>`, `Relative change in percent: 5 raises by 5 %, -10 cuts by 10 %.`, parseInteger)
  .option(`--rounding <rounding>`, `Ending the computed prices snap to (nearest match). Omit to use the tenant's bulk_adjust_rounding setting.`)
  .option(`--sku-prefix <sku-prefix>`, `Restrict the change to entries whose SKU starts with this (a prefix, case-sensitive, no wildcards). Entries identified only by product_id never match a prefix. Omit to change the whole list.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, amount, dryRun, percent, rounding, skuPrefix } = await promptForMissing(
          _options,
          entriesAdjustSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/adjust`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (amount !== undefined) {
          _payload[`amount`] = amount;
        }
        if (dryRun !== undefined) {
          _payload[`dry_run`] = dryRun;
        }
        if (percent !== undefined) {
          _payload[`percent`] = percent;
        }
        if (rounding !== undefined) {
          _payload[`rounding`] = rounding;
        }
        if (skuPrefix !== undefined) {
          _payload[`sku_prefix`] = skuPrefix;
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
registerPromptSpecs(prices.commands.at(-1)!, entriesAdjustSpecs, { method: "post" });
const entriesBulkSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "entries", option: "--entries [entries...]", name: "entries", description: "At most 5000 rows per call — send a large book in chunks.", type: "array", required: true },
  { key: "mode", option: "--mode <mode>", name: "mode", description: "Default 'upsert': a row naming a rung the list already has (same product/sku AND quantity_min) updates it. 'append' always inserts — a re-run then duplicates the ladder, which is what makes an ambiguous tier table.", type: "string", required: false, enum: ["upsert","append"] },
];
prices
  .command(`entries-bulk`)
  .description(`Adds entries to a list without wiping it, and UPSERTS rather than inserts: a row naming a rung the list already has (same product_id/sku AND quantity_min) updates that rung, so re-running an import corrects prices instead of duplicating the ladder. \`mode: 'append'\` keeps the old insert-everything behaviour. Inserts go out as one PostgREST bulk write per 1000 rows.

This is the route for a large price book, and a large book arrives in chunks: a call carries at most 5000 entries and a longer payload is refused with 400 rather than truncated, so an importer of 200 000 prices sends forty calls. Because the upsert is keyed on the rung rather than on a row id, the chunks may be re-sent and re-ordered freely — a chunk that lands twice writes the same prices twice.`)
  .option(`--list-id <list-id>`, `The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.`)
  .option(`--entries [entries...]`, `At most 5000 rows per call — send a large book in chunks.`)
  .option(`--mode <mode>`, `Default 'upsert': a row naming a rung the list already has (same product/sku AND quantity_min) updates it. 'append' always inserts — a re-run then duplicates the ladder, which is what makes an ambiguous tier table.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, entries, mode } = await promptForMissing(
          _options,
          entriesBulkSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/bulk`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (entries !== undefined) {
          _payload[`entries`] = entries;
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
registerPromptSpecs(prices.commands.at(-1)!, entriesBulkSpecs, { method: "post" });
const entriesLadderSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "basePrice", option: "--base-price <base-price>", name: "base_price", description: "Price for ONE unit at the FIRST tier, in the list’s currency and on the list’s tax basis — a decimal amount in major units (19.90), never minor units/cents.", type: "number", required: true },
  { key: "discountPercent", option: "--discount-percent <discount-percent>", name: "discount_percent", description: "Discount applied per tier, COMPOUNDED down the ladder rather than off the base price: 5 gives 19.90 / 18.91 / 17.96. Default 0.", type: "number", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The item the ladder prices.", type: "string", required: false },
  { key: "quantities", option: "--quantities [quantities...]", name: "quantities", description: "Tier thresholds, ascending — an array of numbers or a comma-separated string ('1, 10, 50'). Duplicates are collapsed and the set is sorted. Default [1, 10, 50], at most 50 tiers.", type: "array", required: false },
  { key: "replace", option: "--replace <replace>", name: "replace", description: "Default true: the item's existing entries in this list are removed first, so the ladder IS the ladder. false appends.", type: "boolean", required: false },
  { key: "rounding", option: "--rounding <rounding>", name: "rounding", description: "Ending the computed prices snap to (nearest match). Omit to use the tenant's bulk_adjust_rounding setting.", type: "string", required: false, enum: ["exact","whole","ending_99","ending_95","ending_50"] },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The item the ladder prices (alternative to product_id).", type: "string", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "Unit of measure carried onto every generated tier. Free text, neither validated nor converted.", type: "string", required: false },
];
prices
  .command(`entries-ladder`)
  .description(`Writes a whole quantity-tier ladder (Staffelpreise) for ONE item in one call, instead of typing a rung at a time. Tiers are a flat quantity_min column on purpose — the ladder IS the set of entries sharing an identity, and resolve returns it sorted as one array. What was missing was the gesture: "19.90 from 1, 5 % off per tier at 10 and 50". Prices are rounded and snapped exactly as a bulk adjust is.`)
  .option(`--list-id <list-id>`, `The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.`)
  .option(`--base-price <base-price>`, `Price for ONE unit at the FIRST tier, in the list’s currency and on the list’s tax basis — a decimal amount in major units (19.90), never minor units/cents.`, parseInteger)
  .option(`--discount-percent <discount-percent>`, `Discount applied per tier, COMPOUNDED down the ladder rather than off the base price: 5 gives 19.90 / 18.91 / 17.96. Default 0.`, parseInteger)
  .option(`--product-id <product-id>`, `The item the ladder prices.`)
  .option(`--quantities [quantities...]`, `Tier thresholds, ascending — an array of numbers or a comma-separated string ('1, 10, 50'). Duplicates are collapsed and the set is sorted. Default [1, 10, 50], at most 50 tiers.`)
  .option(
    `--replace [value]`,
    `Default true: the item's existing entries in this list are removed first, so the ladder IS the ladder. false appends.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--rounding <rounding>`, `Ending the computed prices snap to (nearest match). Omit to use the tenant's bulk_adjust_rounding setting.`)
  .option(`--sku <sku>`, `The item the ladder prices (alternative to product_id).`)
  .option(`--unit <unit>`, `Unit of measure carried onto every generated tier. Free text, neither validated nor converted.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, basePrice, discountPercent, productId, quantities, replace, rounding, sku, unit } = await promptForMissing(
          _options,
          entriesLadderSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/ladder`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (basePrice !== undefined) {
          _payload[`base_price`] = basePrice;
        }
        if (discountPercent !== undefined) {
          _payload[`discount_percent`] = discountPercent;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantities !== undefined) {
          _payload[`quantities`] = quantities;
        }
        if (replace !== undefined) {
          _payload[`replace`] = replace;
        }
        if (rounding !== undefined) {
          _payload[`rounding`] = rounding;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
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
registerPromptSpecs(prices.commands.at(-1)!, entriesLadderSpecs, { method: "post" });
const entriesDeleteSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The price entry, by id. An entry that belongs to a different list answers 404.", type: "string", required: true, resource: { listPath: "/prices/lists/{list_id}/entries", hasLimit: true } },
];
prices
  .command(`entries-delete`)
  .description(`Removes ONE rung. The item keeps its other rungs and stays priced — which is exactly what makes the lowest rung the dangerous one to delete.

Below the first threshold the FIRST rung's price applies (a minimum quantity belongs to the catalog, not to the price ladder). So deleting the "from 1" rung of a 1/10/50 ladder does not make single units unpriced: it sells them at the 10-up volume price, silently, from the next resolve call onwards. Nothing in the answer marks that the ladder no longer starts where it used to.

Delete an item's LAST rung and this list stops pricing it altogether: the item falls through to the next candidate list, or comes back \`on_request\` — never €0. To retire a price without losing it, set the rung's \`price_type\` to \`on_request\` instead, or deactivate the list. An entry belonging to another list answers 404 rather than being deleted through the wrong parent.`)
  .option(`--list-id <list-id>`, `The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.`)
  .option(`--id <id>`, `The price entry, by id. An entry that belongs to a different list answers 404.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id } = await promptForMissing(
          _options,
          entriesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`prices entries-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
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
registerPromptSpecs(prices.commands.at(-1)!, entriesDeleteSpecs, { method: "delete", destructive: true });
const entriesGetSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The price entry, by id. An entry that belongs to a different list answers 404.", type: "string", required: true, resource: { listPath: "/prices/lists/{list_id}/entries", hasLimit: true } },
];
prices
  .command(`entries-get`)
  .description(`One rung of one ladder, exactly as stored — nothing is rounded, converted or taxed on the way out. \`unit_price\` is per ONE unit of \`unit\`, in the LIST's currency and on the LIST's tax basis; the entry itself carries neither, which is why a rung read on its own is not yet a price you can show a buyer. \`POST /prices/resolve\` is what turns it into one: it picks the rung that applies to a quantity, names the basis, and adds the net/gross pair and the tax rate. The id is checked against the list in the path, so an entry belonging to another list answers 404 rather than being read through the wrong parent.`)
  .option(`--list-id <list-id>`, `The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.`)
  .option(`--id <id>`, `The price entry, by id. An entry that belongs to a different list answers 404.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id } = await promptForMissing(
          _options,
          entriesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
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
registerPromptSpecs(prices.commands.at(-1)!, entriesGetSpecs, { method: "get" });
const entriesUpdateSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The price entry, by id. An entry that belongs to a different list answers 404.", type: "string", required: true, resource: { listPath: "/prices/lists/{list_id}/entries", hasLimit: true } },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form bag: whatever JSON object you write round-trips exactly, and this app never reads it. Its keys are yours.", type: "object", required: false },
  { key: "priceType", option: "--price-type <price-type>", name: "price_type", description: "Default 'standard'; 'on_request' is the explicit no-price marker — it STOPS resolution for this item on this list and answers \"price on request\" even where a cheaper list exists.", type: "string", required: false, enum: ["standard","on_request"] },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The product this rung prices. An entry needs product_id or sku — the row CHECK enforces it.", type: "string", required: false },
  { key: "quantityMin", option: "--quantity-min <quantity-min>", name: "quantity_min", description: "Tier threshold (Staffelpreis): this price applies from this quantity upwards (default 1). The rungs of one item are the entries sharing its identity; the highest threshold at or below the requested quantity wins.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The article number this rung prices (alternative to product_id). Matched exactly on resolve — never normalised or case-folded.", type: "string", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "Unit of measure the price is per — free text, neither validated nor converted here. A resolve call’s `quantity` is counted in it.", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", description: "Price for ONE unit of `unit`, in the LIST’s currency and on the LIST’s tax basis — a decimal amount in major units (19.90), never minor units/cents. Stored at 4 decimals and echoed back exactly as sent (default 0).", type: "number", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", description: "Start of this entry’s own validity (ISO 8601) — how a promo price is expressed: a second rung, live only for its window. null = open-ended.", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "End of this entry’s own validity; null = open-ended. Outside it the rung is skipped and the ladder resolves as if it were not there.", type: "string", required: false },
];
prices
  .command(`entries-update`)
  .description(`A partial update of one rung: send only what changes, a payload with no updatable column at all is refused, and the next resolve call reads what this one wrote.

Two edits reach further than the field they touch. Moving \`quantity_min\` moves the rung within the ladder and may land on a threshold the item already has — nothing stops it, and both rows then sit in the resolved \`tiers\`. Setting \`price_type: "on_request"\` on ONE rung takes the WHOLE item off price in this list: resolution stops there and answers "price on request" even though the other rungs still carry amounts, and even where a less specific list would have priced it. That is the intended way to say "ask us" for an item, and a surprise if you meant to retire a single tier.

What this route cannot change is what the amount MEANS: currency and tax basis belong to the list, so re-denominating or switching net/gross is a list edit, not an entry edit. An entry of another list answers 404.`)
  .option(`--list-id <list-id>`, `The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.`)
  .option(`--id <id>`, `The price entry, by id. An entry that belongs to a different list answers 404.`)
  .option(`--metadata <metadata>`, `Free-form bag: whatever JSON object you write round-trips exactly, and this app never reads it. Its keys are yours.`)
  .option(`--price-type <price-type>`, `Default 'standard'; 'on_request' is the explicit no-price marker — it STOPS resolution for this item on this list and answers "price on request" even where a cheaper list exists.`)
  .option(`--product-id <product-id>`, `The product this rung prices. An entry needs product_id or sku — the row CHECK enforces it.`)
  .option(`--quantity-min <quantity-min>`, `Tier threshold (Staffelpreis): this price applies from this quantity upwards (default 1). The rungs of one item are the entries sharing its identity; the highest threshold at or below the requested quantity wins.`, parseInteger)
  .option(`--sku <sku>`, `The article number this rung prices (alternative to product_id). Matched exactly on resolve — never normalised or case-folded.`)
  .option(`--unit <unit>`, `Unit of measure the price is per — free text, neither validated nor converted here. A resolve call’s \`quantity\` is counted in it.`)
  .option(`--unit-price <unit-price>`, `Price for ONE unit of \`unit\`, in the LIST’s currency and on the LIST’s tax basis — a decimal amount in major units (19.90), never minor units/cents. Stored at 4 decimals and echoed back exactly as sent (default 0).`, parseInteger)
  .option(`--valid-from <valid-from>`, `Start of this entry’s own validity (ISO 8601) — how a promo price is expressed: a second rung, live only for its window. null = open-ended.`)
  .option(`--valid-until <valid-until>`, `End of this entry’s own validity; null = open-ended. Outside it the rung is skipped and the ladder resolves as if it were not there.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id, metadata, priceType, productId, quantityMin, sku, unit, unitPrice, validFrom, validUntil } = await promptForMissing(
          _options,
          entriesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (priceType !== undefined) {
          _payload[`price_type`] = priceType;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantityMin !== undefined) {
          _payload[`quantity_min`] = quantityMin;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unitPrice !== undefined) {
          _payload[`unit_price`] = unitPrice;
        }
        if (validFrom !== undefined) {
          _payload[`valid_from`] = validFrom;
        }
        if (validUntil !== undefined) {
          _payload[`valid_until`] = validUntil;
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
registerPromptSpecs(prices.commands.at(-1)!, entriesUpdateSpecs, { method: "put" });
const listsMakeDefaultSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", description: "The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "body", option: "--body <body>", name: "data", description: "Request body", type: "object", required: true },
];
prices
  .command(`lists-make-default`)
  .description(`Promotes this list AND demotes whoever held the flag, in one call. The flag is a single answer, not a per-row opinion: resolution uses it as the last tie-break, so two defaults leave the winner to row order and none leaves a tie unsettled. Promote-then-demote as two PATCHes from a client produces exactly those two states whenever the second call does not land.

The write is as small as the change: exactly one write per row whose flag was wrong, and none at all for the rows that were already right. A tenant already in this state is therefore not written to, which is what makes repeating the call free. The answer is this list as it now stands plus the codes it demoted — empty when it already held the flag.`)
  .option(`--list-id <list-id>`, `The price list the entries belong to. An id no list in this tenant has answers 404 rather than an empty page.`)
  .option(`--body <body>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        // The global --data is the documented body flag: let it satisfy the
        // required --body before promptForMissing() asks for it.
        if (cliConfig.data !== undefined) {
          (_options as Record<string, unknown>).body ??= cliConfig.data;
        }
        const { listId, body } = await promptForMissing(
          _options,
          listsMakeDefaultSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/make-default`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (body !== undefined || cliConfig.data !== undefined) {
          Object.assign(_payload, resolveBodyParam(body ?? cliConfig.data));
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
registerPromptSpecs(prices.commands.at(-1)!, listsMakeDefaultSpecs, { method: "post" });
const resolveSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "Items to price, at most 200 per call — a whole cart or a whole product listing in one round trip. The answer holds one entry per item, in this order.", type: "array", required: true },
  { key: "at", option: "--at <at>", name: "at", description: "The instant every validity window — list and entry — is evaluated at (ISO 8601). Default now. This is how a promo price is previewed before it starts, and it is echoed as `basis.evaluated_at`.", type: "string", required: false },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "Buyer context: the sales channel. Third scope — beats the open lists, loses to contact and organization.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Buyer context: the contact this quote is for. The most specific scope — a list naming this contact beats every other list, whatever their priority. Sending it (or organization_id) is also what makes the buyer AUTHENTICATED for `requires_auth` lists and for the tenant’s anonymous_resolve_allowed setting.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code the quote is wanted in. ONLY lists in this currency are candidates and nothing is ever converted, so a wrong value here is not a rounding difference — it is no price at all. Omit to take the buyer market’s currency, then the tenant’s default_currency; `basis.currency_source` names which applied.", type: "string", required: false },
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "Buyer context: the market, as a uuid pin for older callers. Prefer the `X-Revenexx-Market` header, which carries a market CODE and is what scopes the visible price lists. The market decides the tax rates AND which per-market settings (rounding, tie-break, anonymous access) apply — with several markets and no signal at all the answer says `tax.resolved: false`, `reason: market_required` rather than quoting another market’s VAT.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Buyer context: the organization the buyer belongs to. Second most specific scope; also counts as authenticated.", type: "string", required: false },
];
prices
  .command(`resolve`)
  .description(`The live price call. Everything else in this app configures prices; this is the one route that ANSWERS them, and a storefront reaches it on every listing, every product page and every cart. Send up to 200 items and the buyer context they are for — contact, organization, market and channel — and get back, per item, the unit price this buyer pays, the net/gross pair, the tax rate, the list that decided it and that item's full quantity ladder.

Which price wins when several match is the whole value of this app, and it is not guessable from the field types. The order, in full:

1. **Candidates.** A list is a candidate when it is \`active\`, its currency EQUALS the currency of the call (nothing is ever converted — a list in another currency simply does not price the item), the instant \`at\` falls inside its validity window, it is visible in the buyer’s market (the \`X-Revenexx-Market\` header scopes the list view; lists assigned to no market are global and always visible), and its buyer scope matches or is open. A \`requires_auth\` list is dropped for a buyer with neither \`contact_id\` nor \`organization_id\`.
2. **Specificity decides first, and priority never overrules it.** contact-scoped (4) beats organization-scoped (3) beats channel-scoped (2) beats open (0). An organization list at \`priority: 0\` therefore wins over an open list at \`priority: 100\`.
3. **Within one specificity level:** \`priority\` descending, then non-default before default — the default list is deliberately last, so it prices only what nothing else did.
4. **A genuine tie** (same specificity, same priority, same default flag) is settled by the tenant’s \`price_list_priority_tiebreak\` setting — \`lowest_price\`, \`highest_price\`, \`newest\` or \`code\` — never by the order the database happened to return rows in. The setting in force is echoed in \`basis.price_list_priority_tiebreak\`.
5. **The first list that prices the item wins, and the search stops there** — even if a later, less specific list is cheaper. Its FULL tier ladder comes back in \`tiers\`; the rung with the highest \`quantity_min\` at or below the requested \`quantity\` sets \`unit_price\`, and below the first rung the first rung applies.
6. **An \`on_request\` entry stops the search too**, and inside a tie it outranks every price: a list that says "ask us" for this buyer is authoritative, and cannot be undercut by a list that happens to sort after it.
7. **Nothing found → \`on_request\`, never 0**, with a reason (\`not_priced\`, \`on_request_entry\`, \`anonymous_denied\`, \`no_identity\`). A storefront shows "price on request"; it must never show €0.

Amounts: \`unit_price\` is per ONE unit of the entry’s \`unit\`, in \`currency\`, as a decimal in MAJOR units (19.90) — never minor units/cents — and on the basis \`tax_basis\` names. \`tax_basis\` comes from the list’s own column, else from a legacy \`tax_included: true\` on it, else from the tenant’s \`tax_inclusive_default\`; \`tax_basis_source\` says which of the three. Read \`unit_price_net\`/\`unit_price_gross\` where you need an unambiguous number.

Tax is never guessed. The market comes from the \`X-Revenexx-Market\` header (a market CODE) or from \`market_id\` in the body; with several markets whose rates differ and no signal, the answer is \`tax.resolved: false\`, \`reason: market_required\` rather than another market’s VAT. \`tax_rate: null\` means UNKNOWN, not 0 %.

An item that cannot be priced never fails the call: it comes back on_request with its reason, so one bad line in a cart does not cost the other lines their prices.

One last thing worth knowing before you build on it. This is the most customised surface this app has in the field: pricing is where a tenant's ERP usually has the last word, and a tenant whose prices are computed there does not want this app's resolution order at all. So the route is deliberately shaped to be REPLACED — one required field, no rejection of an item the caller got wrong, an answer that stands on its own — and it is designed to be swapped 1:1 for a custom app through the gateway's capability override. An ERP-priced tenant overrides \`prices.resolve\` alone: the same path, the same request and the same response, answered by their own service, while every configuration route here (lists, entries, ladders, bulk changes, vocabularies) stays standard and keeps working. That is why the contract below is smaller than the machinery behind it, and why it changes reluctantly.`)
  .option(`--items [items...]`, `Items to price, at most 200 per call — a whole cart or a whole product listing in one round trip. The answer holds one entry per item, in this order.`)
  .option(`--at <at>`, `The instant every validity window — list and entry — is evaluated at (ISO 8601). Default now. This is how a promo price is previewed before it starts, and it is echoed as \`basis.evaluated_at\`.`)
  .option(`--channel-id <channel-id>`, `Buyer context: the sales channel. Third scope — beats the open lists, loses to contact and organization.`)
  .option(`--contact-id <contact-id>`, `Buyer context: the contact this quote is for. The most specific scope — a list naming this contact beats every other list, whatever their priority. Sending it (or organization_id) is also what makes the buyer AUTHENTICATED for \`requires_auth\` lists and for the tenant’s anonymous_resolve_allowed setting.`)
  .option(`--currency <currency>`, `ISO 4217 code the quote is wanted in. ONLY lists in this currency are candidates and nothing is ever converted, so a wrong value here is not a rounding difference — it is no price at all. Omit to take the buyer market’s currency, then the tenant’s default_currency; \`basis.currency_source\` names which applied.`)
  .option(`--market-id <market-id>`, `Buyer context: the market, as a uuid pin for older callers. Prefer the \`X-Revenexx-Market\` header, which carries a market CODE and is what scopes the visible price lists. The market decides the tax rates AND which per-market settings (rounding, tie-break, anonymous access) apply — with several markets and no signal at all the answer says \`tax.resolved: false\`, \`reason: market_required\` rather than quoting another market’s VAT.`)
  .option(`--organization-id <organization-id>`, `Buyer context: the organization the buyer belongs to. Second most specific scope; also counts as authenticated.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { items, at, channelId, contactId, currency, marketId, organizationId } = await promptForMissing(
          _options,
          resolveSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/resolve`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (at !== undefined) {
          _payload[`at`] = at;
        }
        if (channelId !== undefined) {
          _payload[`channel_id`] = channelId;
        }
        if (contactId !== undefined) {
          _payload[`contact_id`] = contactId;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (marketId !== undefined) {
          _payload[`market_id`] = marketId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
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
registerPromptSpecs(prices.commands.at(-1)!, resolveSpecs, { method: "post" });
const vocabulariesListSpecs: PromptSpec[] = [
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
prices
  .command(`vocabularies-list`)
  .description(`Discovery for the vocabulary routes: the enums this app enforces, each with its name, its title and its description — and deliberately WITHOUT its values, so a UI can cache this one small answer and then fetch only the value sets it actually renders. Names: list-statuses, price-types, tax-bases. Fetch one with GET /prices/vocabularies/{name}; a client holding the qualified pair 'prices.<name>' builds that URL from the pair alone.`)
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
        const _apiPath = `/prices/vocabularies`;
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
registerPromptSpecs(prices.commands.at(-1)!, vocabulariesListSpecs, { method: "get" });
const vocabulariesGetSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "The vocabulary name — the part after the dot in the qualified id.", type: "string", required: true, enum: ["list-statuses","price-types","tax-bases"], resource: { listPath: "/prices/vocabularies", hasLimit: false } },
];
prices
  .command(`vocabularies-get`)
  .description(`One vocabulary in full: every permitted value, each with the title and description a human reads for it and the badge tone a UI colours it with — enough to render a select or a status chip without keeping a private copy of an enum this app enforces. The values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift — a value added to the constraint appears here even before anyone labels it, titled from its own key. Values come back in constraint order, which is the order a select should offer. 'closed' says the set is exhaustive, so a value outside it is stale data rather than a missing label. Answers 404 for an unknown name. Names: list-statuses, price-types, tax-bases.`)
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
        const _apiPath = `/prices/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(prices.commands.at(-1)!, vocabulariesGetSpecs, { method: "get" });
