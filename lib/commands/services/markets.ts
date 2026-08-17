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

export const markets = new Command("markets")
  .description(
    commandDescriptions["markets"] ??
      `Commerce Studio Markets App — the market/region backbone of the Revenue Cloud. A market is a distinct business context within a tenant (a country, a region, a B2C storefront segment) with its own base currency, locales (language + country), traded currencies and tax classes (standard, reduced, …). Markets provides the 'market' scope dimension to the Entity Scoping Engine, so every other commerce app (products, orders, customers, …) can slice its data per market. Storefronts resolve their full market context (currency, locales, currencies, tax classes) in one call.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "Exact match on `id`. Primary key. Note that OTHER apps do not store this: the market scope dimension is keyed on `code` (manifest `provides_scopes.slug_source = markets.code`), so a row elsewhere that is \"in this market\" carries the code, not this uuid. It is the item routes and /context that want this value.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Exact match on `code`. Market code, unique per tenant, and the single most load-bearing string in this app: it IS the market scope slug. The Entity Scoping Engine publishes it as the `market` dimension (`scope_context.market` in the JWT), and every other commerce app — products, prices, orders, customers — stores THIS value to say which market a row belongs to. Renaming it re-keys that scope for everyone, so treat it as permanent. Accepted in place of the uuid on /readiness, /clone, /backfill and /make-default — but not on the item routes or /context, which take a uuid only.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Exact match on `name`. Display name, in the operator's own language. Cockpit copy only — nothing resolves a market by it.", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Exact match on `labels`. Exact whole-document equality on the jsonb: the value is a whole JSON document and has to match every key, so this is not a path or a containment query. Key order and whitespace are irrelevant — the comparison is semantic. A value that does not parse as JSON is refused with 400 `invalid_value` rather than answered with zero rows. Localized display names for storefronts, keyed by locale: a flat {locale: label} map, one level deep, string values. WHICH key to write is not free — GET /markets/{id}/context returns `locale_policy`, whose `write` is the key this tenant keys by (a full locale under regional granularity, a bare language under language granularity) and whose `read` is the order to try. Null means nothing is translated and `name` is all there is.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Exact match on `currency`. Base currency this market quotes in — ISO 4217, and schema.json's own default is 'EUR'. This is the single currency prices are STATED in; the currencies collection under the market is the wider set it accepts. A base currency missing from that collection is a blocking readiness failure.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Exact match on `status`. Default 'active'. Only an active market serves a storefront; 'inactive' keeps the market and all its configuration but takes it out of service. Readiness reports an active market that cannot trade as `serving: true, ready: false` — live and broken.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Exact match on `is_default`. The tenant default market — what a call naming no market falls back to. Exactly one market holds it; move it with POST /markets/{id}/make-default rather than by writing this flag, which does not demote the market that currently holds it.", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Exact match on `position`. Sort position among the tenant's markets, ascending, default 0. Presentation only — it decides the order the Cockpit and a market picker list them in, and nothing resolves a market by it.", type: "integer", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact match on `created_at`. When the market row was inserted. Set by the database; never writable.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact match on `updated_at`. When the market row was last written. Set by the database on every update; never writable.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). Out of range is CLAMPED, not refused — ?limit=999 answers 200 with 200 rows, and `page.limit` says so.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). A negative offset is clamped to 0 rather than refused.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column' | 'column.asc' | 'column.desc'. The direction is lower case, and the column has to exist: id, code, name, labels, currency, status, is_default, position, created_at, updated_at.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
markets
  .command(`list`)
  .description(`Every column is an exact-match filter and they combine with AND (?code=northwind); each one is declared as a query parameter above. A \`?column=value\` this entity does not have is DROPPED rather than refused — the call answers 200 with the unfiltered list — and \`filter\` echoes what was actually applied, which is the only way to tell that apart from a filter that matched nothing.`)
  .option(`--id <id>`, `Exact match on \`id\`. Primary key. Note that OTHER apps do not store this: the market scope dimension is keyed on \`code\` (manifest \`provides_scopes.slug_source = markets.code\`), so a row elsewhere that is "in this market" carries the code, not this uuid. It is the item routes and /context that want this value.`)
  .option(`--code <code>`, `Exact match on \`code\`. Market code, unique per tenant, and the single most load-bearing string in this app: it IS the market scope slug. The Entity Scoping Engine publishes it as the \`market\` dimension (\`scope_context.market\` in the JWT), and every other commerce app — products, prices, orders, customers — stores THIS value to say which market a row belongs to. Renaming it re-keys that scope for everyone, so treat it as permanent. Accepted in place of the uuid on /readiness, /clone, /backfill and /make-default — but not on the item routes or /context, which take a uuid only.`)
  .option(`--name <name>`, `Exact match on \`name\`. Display name, in the operator's own language. Cockpit copy only — nothing resolves a market by it.`)
  .option(`--labels <labels>`, `Exact match on \`labels\`. Exact whole-document equality on the jsonb: the value is a whole JSON document and has to match every key, so this is not a path or a containment query. Key order and whitespace are irrelevant — the comparison is semantic. A value that does not parse as JSON is refused with 400 \`invalid_value\` rather than answered with zero rows. Localized display names for storefronts, keyed by locale: a flat {locale: label} map, one level deep, string values. WHICH key to write is not free — GET /markets/{id}/context returns \`locale_policy\`, whose \`write\` is the key this tenant keys by (a full locale under regional granularity, a bare language under language granularity) and whose \`read\` is the order to try. Null means nothing is translated and \`name\` is all there is.`)
  .option(`--currency <currency>`, `Exact match on \`currency\`. Base currency this market quotes in — ISO 4217, and schema.json's own default is 'EUR'. This is the single currency prices are STATED in; the currencies collection under the market is the wider set it accepts. A base currency missing from that collection is a blocking readiness failure.`)
  .option(`--status <status>`, `Exact match on \`status\`. Default 'active'. Only an active market serves a storefront; 'inactive' keeps the market and all its configuration but takes it out of service. Readiness reports an active market that cannot trade as \`serving: true, ready: false\` — live and broken.`)
  .option(
    `--is-default [value]`,
    `Exact match on \`is_default\`. The tenant default market — what a call naming no market falls back to. Exactly one market holds it; move it with POST /markets/{id}/make-default rather than by writing this flag, which does not demote the market that currently holds it.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Exact match on \`position\`. Sort position among the tenant's markets, ascending, default 0. Presentation only — it decides the order the Cockpit and a market picker list them in, and nothing resolves a market by it.`, parseInteger)
  .option(`--created-at <created-at>`, `Exact match on \`created_at\`. When the market row was inserted. Set by the database; never writable.`)
  .option(`--updated-at <updated-at>`, `Exact match on \`updated_at\`. When the market row was last written. Set by the database on every update; never writable.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). Out of range is CLAMPED, not refused — ?limit=999 answers 200 with 200 rows, and \`page.limit\` says so.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). A negative offset is clamped to 0 rather than refused.`, parseInteger)
  .option(`--order <order>`, `Sort as 'column' | 'column.asc' | 'column.desc'. The direction is lower case, and the column has to exist: id, code, name, labels, currency, status, is_default, position, created_at, updated_at.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, name, labels, currency, status, isDefault, position, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets`;
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
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
registerPromptSpecs(markets.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Market code, unique per tenant, and the single most load-bearing string in this app: it IS the market scope slug. The Entity Scoping Engine publishes it as the `market` dimension (`scope_context.market` in the JWT), and every other commerce app — products, prices, orders, customers — stores THIS value to say which market a row belongs to. Renaming it re-keys that scope for everyone, so treat it as permanent. Accepted in place of the uuid on /readiness, /clone, /backfill and /make-default — but not on the item routes or /context, which take a uuid only.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name, in the operator's own language. Cockpit copy only — nothing resolves a market by it.", type: "string", required: true },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Base currency this market quotes in — ISO 4217, and schema.json's own default is 'EUR'. This is the single currency prices are STATED in; the currencies collection under the market is the wider set it accepts. A base currency missing from that collection is a blocking readiness failure.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The tenant default market — what a call naming no market falls back to. Exactly one market holds it; move it with POST /markets/{id}/make-default rather than by writing this flag, which does not demote the market that currently holds it.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names for storefronts, keyed by locale: a flat {locale: label} map, one level deep, string values. WHICH key to write is not free — GET /markets/{id}/context returns `locale_policy`, whose `write` is the key this tenant keys by (a full locale under regional granularity, a bare language under language granularity) and whose `read` is the order to try. Null means nothing is translated and `name` is all there is.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position among the tenant's markets, ascending, default 0. Presentation only — it decides the order the Cockpit and a market picker list them in, and nothing resolves a market by it.", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'active'. Only an active market serves a storefront; 'inactive' keeps the market and all its configuration but takes it out of service. Readiness reports an active market that cannot trade as `serving: true, ready: false` — live and broken.", type: "string", required: false, enum: ["active","inactive"] },
];
markets
  .command(`create`)
  .description(`A market needs a 'code' and a 'name' — currency defaults to EUR, status to active. To get a market that can actually trade, clone an existing one instead: POST /markets/{id}/clone.`)
  .option(`--code <code>`, `Market code, unique per tenant, and the single most load-bearing string in this app: it IS the market scope slug. The Entity Scoping Engine publishes it as the \`market\` dimension (\`scope_context.market\` in the JWT), and every other commerce app — products, prices, orders, customers — stores THIS value to say which market a row belongs to. Renaming it re-keys that scope for everyone, so treat it as permanent. Accepted in place of the uuid on /readiness, /clone, /backfill and /make-default — but not on the item routes or /context, which take a uuid only.`)
  .option(`--name <name>`, `Display name, in the operator's own language. Cockpit copy only — nothing resolves a market by it.`)
  .option(`--currency <currency>`, `Base currency this market quotes in — ISO 4217, and schema.json's own default is 'EUR'. This is the single currency prices are STATED in; the currencies collection under the market is the wider set it accepts. A base currency missing from that collection is a blocking readiness failure.`)
  .option(
    `--is-default [value]`,
    `The tenant default market — what a call naming no market falls back to. Exactly one market holds it; move it with POST /markets/{id}/make-default rather than by writing this flag, which does not demote the market that currently holds it.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names for storefronts, keyed by locale: a flat {locale: label} map, one level deep, string values. WHICH key to write is not free — GET /markets/{id}/context returns \`locale_policy\`, whose \`write\` is the key this tenant keys by (a full locale under regional granularity, a bare language under language granularity) and whose \`read\` is the order to try. Null means nothing is translated and \`name\` is all there is.`)
  .option(`--position <position>`, `Sort position among the tenant's markets, ascending, default 0. Presentation only — it decides the order the Cockpit and a market picker list them in, and nothing resolves a market by it.`, parseInteger)
  .option(`--status <status>`, `Default 'active'. Only an active market serves a storefront; 'inactive' keeps the market and all its configuration but takes it out of service. Readiness reports an active market that cannot trade as \`serving: true, ready: false\` — live and broken.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, name, currency, isDefault, labels, position, status } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets`;
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
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
registerPromptSpecs(markets.commands.at(-1)!, createSpecs, { method: "post" });
markets
  .command(`locale-policy`)
  .description(`How this tenant keys its translations, resolved for a surface that stands in no market at all. The Cockpit edits a tenant BASELINE when no market is selected, and a baseline value has to be readable by every market — so the locale set answered here is the UNION of every market's locales, each one already resolved to the key it is written under, not one market's list and not a pair of setting names to re-implement. Each entry names the markets that asked for that locale: an editor listing six inputs without saying who needs them invites translations nobody will ever read. Write/read keys follow the same two settings as the per-market answer, so a baseline and a market value can never be keyed differently.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/markets/locale-policy`;
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
markets
  .command(`vocabularies`)
  .description(`Every closed value set this app owns, listed by name with its title and its description but WITHOUT its values — enough to build a menu of them, and a name to fetch one by when a select box actually needs the values. Static per app version; nothing about a tenant changes it. It reads no table and takes no parameter, so 200 is the only answer it has beyond the gateway's own.`)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/markets/vocabularies`;
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
const vocabularySpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", description: "Which vocabulary to read. The enum is exhaustive — these are every value set this app owns, and anything else is a 404.", type: "string", required: true, enum: ["market-statuses"], resource: { listPath: "/markets/vocabularies", hasLimit: false } },
];
markets
  .command(`vocabulary`)
  .description(`One value set in full: every value the column may hold, in the order it may hold them, with the copy and the badge tone a client renders each one as. The values are not kept in a list beside the database, they are parsed out of the CHECK constraint in this app's own schema.json — so the set served here IS the set enforced on a write, and a select box built from it cannot offer a value the write would then refuse. A name outside the declared enum is a 404 rather than an empty list — an empty vocabulary and an unknown one mean different things to a select box.`)
  .option(`--name <name>`, `Which vocabulary to read. The enum is exhaustive — these are every value set this app owns, and anything else is a 404.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name } = await promptForMissing(
          _options,
          vocabularySpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/vocabularies/{name}`.replace(`{name}`, name);
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
registerPromptSpecs(markets.commands.at(-1)!, vocabularySpecs, { method: "get" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The market, by its primary key. A uuid — this route does not resolve a market code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
];
markets
  .command(`delete`)
  .description(`Deleting a market takes its locales, currencies and tax classes with it: all three carry an ON DELETE CASCADE onto markets.id, so this is never refused for having children.`)
  .option(`--id <id>`, `The market, by its primary key. A uuid — this route does not resolve a market code, so a segment that will not cast is a 400 before any row is read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`markets delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The market, by its primary key. A uuid — this route does not resolve a market code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
];
markets
  .command(`get`)
  .description(`Resolved by uuid only — unlike /readiness, /clone, /backfill and /make-default, a market CODE here is a 400 rather than a lookup.`)
  .option(`--id <id>`, `The market, by its primary key. A uuid — this route does not resolve a market code, so a segment that will not cast is a 400 before any row is read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The market, by its primary key. A uuid — this route does not resolve a market code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Market code, unique per tenant, and the single most load-bearing string in this app: it IS the market scope slug. The Entity Scoping Engine publishes it as the `market` dimension (`scope_context.market` in the JWT), and every other commerce app — products, prices, orders, customers — stores THIS value to say which market a row belongs to. Renaming it re-keys that scope for everyone, so treat it as permanent. Accepted in place of the uuid on /readiness, /clone, /backfill and /make-default — but not on the item routes or /context, which take a uuid only.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Base currency this market quotes in — ISO 4217, and schema.json's own default is 'EUR'. This is the single currency prices are STATED in; the currencies collection under the market is the wider set it accepts. A base currency missing from that collection is a blocking readiness failure.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The tenant default market — what a call naming no market falls back to. Exactly one market holds it; move it with POST /markets/{id}/make-default rather than by writing this flag, which does not demote the market that currently holds it.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names for storefronts, keyed by locale: a flat {locale: label} map, one level deep, string values. WHICH key to write is not free — GET /markets/{id}/context returns `locale_policy`, whose `write` is the key this tenant keys by (a full locale under regional granularity, a bare language under language granularity) and whose `read` is the order to try. Null means nothing is translated and `name` is all there is.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name, in the operator's own language. Cockpit copy only — nothing resolves a market by it.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position among the tenant's markets, ascending, default 0. Presentation only — it decides the order the Cockpit and a market picker list them in, and nothing resolves a market by it.", type: "integer", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'active'. Only an active market serves a storefront; 'inactive' keeps the market and all its configuration but takes it out of service. Readiness reports an active market that cannot trade as `serving: true, ready: false` — live and broken.", type: "string", required: false, enum: ["active","inactive"] },
];
markets
  .command(`update`)
  .description(`Partial: omitted fields keep their value.`)
  .option(`--id <id>`, `The market, by its primary key. A uuid — this route does not resolve a market code, so a segment that will not cast is a 400 before any row is read.`)
  .option(`--code <code>`, `Market code, unique per tenant, and the single most load-bearing string in this app: it IS the market scope slug. The Entity Scoping Engine publishes it as the \`market\` dimension (\`scope_context.market\` in the JWT), and every other commerce app — products, prices, orders, customers — stores THIS value to say which market a row belongs to. Renaming it re-keys that scope for everyone, so treat it as permanent. Accepted in place of the uuid on /readiness, /clone, /backfill and /make-default — but not on the item routes or /context, which take a uuid only.`)
  .option(`--currency <currency>`, `Base currency this market quotes in — ISO 4217, and schema.json's own default is 'EUR'. This is the single currency prices are STATED in; the currencies collection under the market is the wider set it accepts. A base currency missing from that collection is a blocking readiness failure.`)
  .option(
    `--is-default [value]`,
    `The tenant default market — what a call naming no market falls back to. Exactly one market holds it; move it with POST /markets/{id}/make-default rather than by writing this flag, which does not demote the market that currently holds it.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names for storefronts, keyed by locale: a flat {locale: label} map, one level deep, string values. WHICH key to write is not free — GET /markets/{id}/context returns \`locale_policy\`, whose \`write\` is the key this tenant keys by (a full locale under regional granularity, a bare language under language granularity) and whose \`read\` is the order to try. Null means nothing is translated and \`name\` is all there is.`)
  .option(`--name <name>`, `Display name, in the operator's own language. Cockpit copy only — nothing resolves a market by it.`)
  .option(`--position <position>`, `Sort position among the tenant's markets, ascending, default 0. Presentation only — it decides the order the Cockpit and a market picker list them in, and nothing resolves a market by it.`, parseInteger)
  .option(`--status <status>`, `Default 'active'. Only an active market serves a storefront; 'inactive' keeps the market and all its configuration but takes it out of service. Readiness reports an active market that cannot trade as \`serving: true, ready: false\` — live and broken.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, currency, isDefault, labels, name, position, status } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}`.replace(`{id}`, id);
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
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
registerPromptSpecs(markets.commands.at(-1)!, updateSpecs, { method: "put" });
const backfillSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The market being REPAIRED — a uuid or a market code.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "source", option: "--source <source>", name: "source", description: "The market to copy the missing pieces FROM — a uuid or a market code. Must not be the market in the path. Pick a market that is already right; nothing about it is changed.", type: "string", required: true },
  { key: "currencies", option: "--currencies <currencies>", name: "currencies", description: "Take the source's traded currencies for codes this market does not already carry. Default true.", type: "boolean", required: false },
  { key: "locales", option: "--locales <locales>", name: "locales", description: "Take the source's locales for codes this market does not already carry. Default true.", type: "boolean", required: false },
  { key: "taxClasses", option: "--tax-classes <tax-classes>", name: "tax_classes", description: "Take the source's tax classes for codes this market does not already carry. An existing code keeps ITS rate — a backfill never re-rates a class the merchant already set. Default true.", type: "boolean", required: false },
];
markets
  .command(`backfill`)
  .description(`Repairs the market in the path out of a source market that is already right. The two are compared by CODE, collection by collection, and only the codes this market does not already carry are added — so a locale, a currency or a tax class it already holds is left exactly as the merchant left it, rate included, and is never overwritten. Both the path id and \`source\` are resolved by uuid OR by market code. Idempotent: running it twice adds nothing the second time.`)
  .option(`--id <id>`, `The market being REPAIRED — a uuid or a market code.`)
  .option(`--source <source>`, `The market to copy the missing pieces FROM — a uuid or a market code. Must not be the market in the path. Pick a market that is already right; nothing about it is changed.`)
  .option(
    `--currencies [value]`,
    `Take the source's traded currencies for codes this market does not already carry. Default true.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--locales [value]`,
    `Take the source's locales for codes this market does not already carry. Default true.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--tax-classes [value]`,
    `Take the source's tax classes for codes this market does not already carry. An existing code keeps ITS rate — a backfill never re-rates a class the merchant already set. Default true.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, source, currencies, locales, taxClasses } = await promptForMissing(
          _options,
          backfillSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}/backfill`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (currencies !== undefined) {
          _payload[`currencies`] = currencies;
        }
        if (locales !== undefined) {
          _payload[`locales`] = locales;
        }
        if (source !== undefined) {
          _payload[`source`] = source;
        }
        if (taxClasses !== undefined) {
          _payload[`tax_classes`] = taxClasses;
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
registerPromptSpecs(markets.commands.at(-1)!, backfillSpecs, { method: "post" });
const cloneSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The SOURCE market to copy — a uuid or a market code.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Code of the NEW market (unique per tenant).", type: "string", required: true },
  { key: "copyCurrencies", option: "--copy-currencies <copy-currencies>", name: "copy_currencies", description: "Copy the source's traded currencies. Default true. The new market's own base currency is registered and marked default either way.", type: "boolean", required: false },
  { key: "copyLocales", option: "--copy-locales <copy-locales>", name: "copy_locales", description: "Copy the source's locales. Default true. False leaves the new market with no language of its own, so the tenant fallback_locale is seeded instead — it is never left with none.", type: "boolean", required: false },
  { key: "copyTaxClasses", option: "--copy-tax-classes <copy-tax-classes>", name: "copy_tax_classes", description: "Copy the source's tax classes, rates and all. Default true. False leaves the market unable to tax anything, which readiness reports as blocking.", type: "boolean", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "Base currency of the new market (ISO 4217). Defaults to the source market's, and is registered and marked default on the new one either way.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name of the new market. Defaults to its code.", type: "string", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Status of the new market. Defaults to 'active'; clone it 'inactive' to build it out before it serves anyone.", type: "string", required: false, enum: ["active","inactive"] },
];
markets
  .command(`clone`)
  .description(`Creates a NEW market out of an existing one, taking its locales, its traded currencies and its tax classes with it in a single call. That is the difference between this and POST /markets: a plain create leaves a row that cannot serve anybody, while what comes back here is a market with a language to render in, a currency to price in and a rate to tax with. The path id is the SOURCE market, resolved by uuid OR by market code.`)
  .option(`--id <id>`, `The SOURCE market to copy — a uuid or a market code.`)
  .option(`--code <code>`, `Code of the NEW market (unique per tenant).`)
  .option(
    `--copy-currencies [value]`,
    `Copy the source's traded currencies. Default true. The new market's own base currency is registered and marked default either way.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--copy-locales [value]`,
    `Copy the source's locales. Default true. False leaves the new market with no language of its own, so the tenant fallback_locale is seeded instead — it is never left with none.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--copy-tax-classes [value]`,
    `Copy the source's tax classes, rates and all. Default true. False leaves the market unable to tax anything, which readiness reports as blocking.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--currency <currency>`, `Base currency of the new market (ISO 4217). Defaults to the source market's, and is registered and marked default on the new one either way.`)
  .option(`--name <name>`, `Display name of the new market. Defaults to its code.`)
  .option(`--status <status>`, `Status of the new market. Defaults to 'active'; clone it 'inactive' to build it out before it serves anyone.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, copyCurrencies, copyLocales, copyTaxClasses, currency, name, status } = await promptForMissing(
          _options,
          cloneSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}/clone`.replace(`{id}`, id);
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
        if (copyCurrencies !== undefined) {
          _payload[`copy_currencies`] = copyCurrencies;
        }
        if (copyLocales !== undefined) {
          _payload[`copy_locales`] = copyLocales;
        }
        if (copyTaxClasses !== undefined) {
          _payload[`copy_tax_classes`] = copyTaxClasses;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
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
registerPromptSpecs(markets.commands.at(-1)!, cloneSpecs, { method: "post" });
const contextSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The market. A uuid — this route does not accept a market code.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
];
markets
  .command(`context`)
  .description(`The storefront bootstrap: everything a frontend needs to render one market, resolved server-side so no client re-derives it — the market row, its locales, the currencies it trades in and its tax classes; WHICH locale to actually render in and where that answer came from; which key to read and write a translation under; whether the prices it will be handed are gross or net; and whether any of it is trustworthy. One call rather than five, and — more to the point — one place the resolution rules live, instead of a slightly different copy of them in every storefront. This one resolves the market by id only: unlike /readiness, /clone and /backfill, a market CODE here is a 400, not a lookup.`)
  .option(`--id <id>`, `The market. A uuid — this route does not accept a market code.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          contextSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}/context`.replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, contextSpecs, { method: "get" });
const makeDefaultSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The market to promote — a uuid or a market code.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "data", option: "--data <data>", name: "data", description: "Request body", type: "object", required: true },
];
markets
  .command(`make-default`)
  .description(`A tenant has ONE default market: it is what every call naming none falls back to. Moving the flag from a client was promote-then-demote, two PATCHes that leave two defaults when the second does not land and none when the first does. This is the one call instead — it promotes the market in the path and demotes whoever held the flag in the same operation, writing once per row that was actually wrong and not touching the rest. Accepts an id or a market CODE. Answers the market plus the codes it demoted; repeating the call writes nothing.`)
  .option(`--id <id>`, `The market to promote — a uuid or a market code.`)
  .option(`--data <data>`, `Request body`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, data } = await promptForMissing(
          _options,
          makeDefaultSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}/make-default`.replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, makeDefaultSpecs, { method: "post" });
const readinessSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", description: "The market — a uuid or a market code.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
];
markets
  .command(`readiness`)
  .description(`Whether this market can actually trade, and if not, what is missing. Every check runs on every call and comes back with its own severity, so the answer is a diagnosis rather than a yes or a no: a market with no currency registered has nothing to price in and a market with no tax class has nothing to tax with, and both of those fail BLOCKING, which is what turns \`ready\` false. A check that is merely degraded — no locale of its own, while the tenant declares a fallback_locale that covers for it — fails as a warning and leaves the market serviceable. Resolves the market by uuid OR by market code.`)
  .option(`--id <id>`, `The market — a uuid or a market code.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          readinessSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{id}/readiness`.replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, readinessSpecs, { method: "get" });
const currenciesListSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "Exact match on `id`. Primary key of this currency registration. The currency is named by `code` everywhere else.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Exact match on `code`. ISO 4217 code, unique per market — one entry in the set of currencies this market TRADES in, as opposed to the single base currency on the market row that its prices are quoted in. The base currency must appear here or the market cannot serve; clone and backfill register it for you.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Exact match on `is_default`. The currency offered first to a buyer who states no preference. At most one per market, and it should be the market's base currency — readiness reports it as a warning when it is not.", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Exact match on `position`. Sort position among this market's currencies, ascending, default 0 — the order a currency switcher lists them in.", type: "integer", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact match on `created_at`. When the currency was registered on this market. Set by the database; never writable.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). Out of range is CLAMPED, not refused — ?limit=999 answers 200 with 200 rows, and `page.limit` says so.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). A negative offset is clamped to 0 rather than refused.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column' | 'column.asc' | 'column.desc'. The direction is lower case, and the column has to exist: id, market_id, code, is_default, position, created_at.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
markets
  .command(`currencies-list`)
  .description(`Every column is an exact-match filter and they combine with AND (?code=EUR); each one is declared as a query parameter above. A \`?column=value\` this entity does not have is DROPPED rather than refused — the call answers 200 with the unfiltered list — and \`filter\` echoes what was actually applied, which is the only way to tell that apart from a filter that matched nothing. \`market_id\` is not among them: the owning market comes from the path and overwrites anything the query says. An unknown but well-formed market lists empty rather than 404 — the parent is filtered on, not verified.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `Exact match on \`id\`. Primary key of this currency registration. The currency is named by \`code\` everywhere else.`)
  .option(`--code <code>`, `Exact match on \`code\`. ISO 4217 code, unique per market — one entry in the set of currencies this market TRADES in, as opposed to the single base currency on the market row that its prices are quoted in. The base currency must appear here or the market cannot serve; clone and backfill register it for you.`)
  .option(
    `--is-default [value]`,
    `Exact match on \`is_default\`. The currency offered first to a buyer who states no preference. At most one per market, and it should be the market's base currency — readiness reports it as a warning when it is not.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Exact match on \`position\`. Sort position among this market's currencies, ascending, default 0 — the order a currency switcher lists them in.`, parseInteger)
  .option(`--created-at <created-at>`, `Exact match on \`created_at\`. When the currency was registered on this market. Set by the database; never writable.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). Out of range is CLAMPED, not refused — ?limit=999 answers 200 with 200 rows, and \`page.limit\` says so.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). A negative offset is clamped to 0 rather than refused.`, parseInteger)
  .option(`--order <order>`, `Sort as 'column' | 'column.asc' | 'column.desc'. The direction is lower case, and the column has to exist: id, market_id, code, is_default, position, created_at.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id, code, isDefault, position, createdAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          currenciesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies`.replace(`{market_id}`, marketId);
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
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
registerPromptSpecs(markets.commands.at(-1)!, currenciesListSpecs, { method: "get" });
const currenciesCreateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "ISO 4217 code, unique per market — one entry in the set of currencies this market TRADES in, as opposed to the single base currency on the market row that its prices are quoted in. The base currency must appear here or the market cannot serve; clone and backfill register it for you.", type: "string", required: true },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The currency offered first to a buyer who states no preference. At most one per market, and it should be the market's base currency — readiness reports it as a warning when it is not.", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position among this market's currencies, ascending, default 0 — the order a currency switcher lists them in.", type: "integer", required: false },
];
markets
  .command(`currencies-create`)
  .description(`The owning market comes from the path and overrides anything in the body.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--code <code>`, `ISO 4217 code, unique per market — one entry in the set of currencies this market TRADES in, as opposed to the single base currency on the market row that its prices are quoted in. The base currency must appear here or the market cannot serve; clone and backfill register it for you.`)
  .option(
    `--is-default [value]`,
    `The currency offered first to a buyer who states no preference. At most one per market, and it should be the market's base currency — readiness reports it as a warning when it is not.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position among this market's currencies, ascending, default 0 — the order a currency switcher lists them in.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, code, isDefault, position } = await promptForMissing(
          _options,
          currenciesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies`.replace(`{market_id}`, marketId);
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
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(markets.commands.at(-1)!, currenciesCreateSpecs, { method: "post" });
const currenciesDeleteSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The currency of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets/{market_id}/currencies", hasLimit: true } },
];
markets
  .command(`currencies-delete`)
  .description(`Scoped to the market in the path — a row belonging to another market is a 404 here, and is never deleted.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `The currency of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          currenciesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`markets currencies-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, currenciesDeleteSpecs, { method: "delete", destructive: true });
const currenciesGetSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The currency of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets/{market_id}/currencies", hasLimit: true } },
];
markets
  .command(`currencies-get`)
  .description(`Scoped strictly to the market in the path: a row belonging to another market is a 404 here, never a 200.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `The currency of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          currenciesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, currenciesGetSpecs, { method: "get" });
const currenciesUpdateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The currency of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets/{market_id}/currencies", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "ISO 4217 code, unique per market — one entry in the set of currencies this market TRADES in, as opposed to the single base currency on the market row that its prices are quoted in. The base currency must appear here or the market cannot serve; clone and backfill register it for you.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The currency offered first to a buyer who states no preference. At most one per market, and it should be the market's base currency — readiness reports it as a warning when it is not.", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position among this market's currencies, ascending, default 0 — the order a currency switcher lists them in.", type: "integer", required: false },
];
markets
  .command(`currencies-update`)
  .description(`Partial: omitted fields keep their value.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `The currency of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.`)
  .option(`--code <code>`, `ISO 4217 code, unique per market — one entry in the set of currencies this market TRADES in, as opposed to the single base currency on the market row that its prices are quoted in. The base currency must appear here or the market cannot serve; clone and backfill register it for you.`)
  .option(
    `--is-default [value]`,
    `The currency offered first to a buyer who states no preference. At most one per market, and it should be the market's base currency — readiness reports it as a warning when it is not.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position among this market's currencies, ascending, default 0 — the order a currency switcher lists them in.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id, code, isDefault, position } = await promptForMissing(
          _options,
          currenciesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/currencies/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(markets.commands.at(-1)!, currenciesUpdateSpecs, { method: "put" });
const localesListSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "Exact match on `id`. Primary key of this locale registration. The locale is named by `code` everywhere else.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Exact match on `code`. Locale code, language-COUNTRY — the language a storefront renders this market in, and the key a translation is stored under. Unique per market. The app's own seeded value is the tenant's `fallback_locale` setting, whose declared default is de-DE.", type: "string", required: false },
  { key: "language", option: "--language <language>", name: "language", description: "Exact match on `language`. ISO 639-1 language code — the language half of `code`, stored separately so a client can group markets by language without parsing.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "Exact match on `country`. ISO 3166-1 alpha-2 country code — the region half of `code`. It is a spelling of the language, not a shipping destination: a market may register de-AT without trading in Austria.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Exact match on `is_default`. The locale a storefront renders this market in when the request asks for none. At most one per market; where none carries the flag the first by position is used, and `default_locale.source` on the context says which of the two happened.", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Exact match on `position`. Sort position among this market's locales, ascending, default 0 — and the tie-break that picks a default when no locale is flagged.", type: "integer", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact match on `created_at`. When the locale was registered on this market. Set by the database; never writable.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). Out of range is CLAMPED, not refused — ?limit=999 answers 200 with 200 rows, and `page.limit` says so.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). A negative offset is clamped to 0 rather than refused.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column' | 'column.asc' | 'column.desc'. The direction is lower case, and the column has to exist: id, market_id, code, language, country, is_default, position, created_at.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
markets
  .command(`locales-list`)
  .description(`Every column is an exact-match filter and they combine with AND (?code=de-DE); each one is declared as a query parameter above. A \`?column=value\` this entity does not have is DROPPED rather than refused — the call answers 200 with the unfiltered list — and \`filter\` echoes what was actually applied, which is the only way to tell that apart from a filter that matched nothing. \`market_id\` is not among them: the owning market comes from the path and overwrites anything the query says. An unknown but well-formed market lists empty rather than 404 — the parent is filtered on, not verified.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `Exact match on \`id\`. Primary key of this locale registration. The locale is named by \`code\` everywhere else.`)
  .option(`--code <code>`, `Exact match on \`code\`. Locale code, language-COUNTRY — the language a storefront renders this market in, and the key a translation is stored under. Unique per market. The app's own seeded value is the tenant's \`fallback_locale\` setting, whose declared default is de-DE.`)
  .option(`--language <language>`, `Exact match on \`language\`. ISO 639-1 language code — the language half of \`code\`, stored separately so a client can group markets by language without parsing.`)
  .option(`--country <country>`, `Exact match on \`country\`. ISO 3166-1 alpha-2 country code — the region half of \`code\`. It is a spelling of the language, not a shipping destination: a market may register de-AT without trading in Austria.`)
  .option(
    `--is-default [value]`,
    `Exact match on \`is_default\`. The locale a storefront renders this market in when the request asks for none. At most one per market; where none carries the flag the first by position is used, and \`default_locale.source\` on the context says which of the two happened.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Exact match on \`position\`. Sort position among this market's locales, ascending, default 0 — and the tie-break that picks a default when no locale is flagged.`, parseInteger)
  .option(`--created-at <created-at>`, `Exact match on \`created_at\`. When the locale was registered on this market. Set by the database; never writable.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). Out of range is CLAMPED, not refused — ?limit=999 answers 200 with 200 rows, and \`page.limit\` says so.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). A negative offset is clamped to 0 rather than refused.`, parseInteger)
  .option(`--order <order>`, `Sort as 'column' | 'column.asc' | 'column.desc'. The direction is lower case, and the column has to exist: id, market_id, code, language, country, is_default, position, created_at.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id, code, language, country, isDefault, position, createdAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          localesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales`.replace(`{market_id}`, marketId);
        const _payload: RequestParams = {};
        if (id !== undefined) {
          _payload[`id`] = id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (language !== undefined) {
          _payload[`language`] = language;
        }
        if (country !== undefined) {
          _payload[`country`] = country;
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
registerPromptSpecs(markets.commands.at(-1)!, localesListSpecs, { method: "get" });
const localesCreateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Locale code, language-COUNTRY — the language a storefront renders this market in, and the key a translation is stored under. Unique per market. The app's own seeded value is the tenant's `fallback_locale` setting, whose declared default is de-DE.", type: "string", required: true },
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 country code — the region half of `code`. It is a spelling of the language, not a shipping destination: a market may register de-AT without trading in Austria.", type: "string", required: true },
  { key: "language", option: "--language <language>", name: "language", description: "ISO 639-1 language code — the language half of `code`, stored separately so a client can group markets by language without parsing.", type: "string", required: true },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The locale a storefront renders this market in when the request asks for none. At most one per market; where none carries the flag the first by position is used, and `default_locale.source` on the context says which of the two happened.", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position among this market's locales, ascending, default 0 — and the tie-break that picks a default when no locale is flagged.", type: "integer", required: false },
];
markets
  .command(`locales-create`)
  .description(`The owning market comes from the path and overrides anything in the body.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--code <code>`, `Locale code, language-COUNTRY — the language a storefront renders this market in, and the key a translation is stored under. Unique per market. The app's own seeded value is the tenant's \`fallback_locale\` setting, whose declared default is de-DE.`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 country code — the region half of \`code\`. It is a spelling of the language, not a shipping destination: a market may register de-AT without trading in Austria.`)
  .option(`--language <language>`, `ISO 639-1 language code — the language half of \`code\`, stored separately so a client can group markets by language without parsing.`)
  .option(
    `--is-default [value]`,
    `The locale a storefront renders this market in when the request asks for none. At most one per market; where none carries the flag the first by position is used, and \`default_locale.source\` on the context says which of the two happened.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Sort position among this market's locales, ascending, default 0 — and the tie-break that picks a default when no locale is flagged.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, code, country, language, isDefault, position } = await promptForMissing(
          _options,
          localesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales`.replace(`{market_id}`, marketId);
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
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (language !== undefined) {
          _payload[`language`] = language;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(markets.commands.at(-1)!, localesCreateSpecs, { method: "post" });
const localesDeleteSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The locale of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets/{market_id}/locales", hasLimit: true } },
];
markets
  .command(`locales-delete`)
  .description(`Scoped to the market in the path — a row belonging to another market is a 404 here, and is never deleted.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `The locale of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          localesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`markets locales-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, localesDeleteSpecs, { method: "delete", destructive: true });
const localesGetSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The locale of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets/{market_id}/locales", hasLimit: true } },
];
markets
  .command(`locales-get`)
  .description(`Scoped strictly to the market in the path: a row belonging to another market is a 404 here, never a 200.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `The locale of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          localesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, localesGetSpecs, { method: "get" });
const localesUpdateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The locale of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets/{market_id}/locales", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Locale code, language-COUNTRY — the language a storefront renders this market in, and the key a translation is stored under. Unique per market. The app's own seeded value is the tenant's `fallback_locale` setting, whose declared default is de-DE.", type: "string", required: false },
  { key: "country", option: "--country <country>", name: "country", description: "ISO 3166-1 alpha-2 country code — the region half of `code`. It is a spelling of the language, not a shipping destination: a market may register de-AT without trading in Austria.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The locale a storefront renders this market in when the request asks for none. At most one per market; where none carries the flag the first by position is used, and `default_locale.source` on the context says which of the two happened.", type: "boolean", required: false },
  { key: "language", option: "--language <language>", name: "language", description: "ISO 639-1 language code — the language half of `code`, stored separately so a client can group markets by language without parsing.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position among this market's locales, ascending, default 0 — and the tie-break that picks a default when no locale is flagged.", type: "integer", required: false },
];
markets
  .command(`locales-update`)
  .description(`Partial: omitted fields keep their value.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `The locale of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.`)
  .option(`--code <code>`, `Locale code, language-COUNTRY — the language a storefront renders this market in, and the key a translation is stored under. Unique per market. The app's own seeded value is the tenant's \`fallback_locale\` setting, whose declared default is de-DE.`)
  .option(`--country <country>`, `ISO 3166-1 alpha-2 country code — the region half of \`code\`. It is a spelling of the language, not a shipping destination: a market may register de-AT without trading in Austria.`)
  .option(
    `--is-default [value]`,
    `The locale a storefront renders this market in when the request asks for none. At most one per market; where none carries the flag the first by position is used, and \`default_locale.source\` on the context says which of the two happened.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--language <language>`, `ISO 639-1 language code — the language half of \`code\`, stored separately so a client can group markets by language without parsing.`)
  .option(`--position <position>`, `Sort position among this market's locales, ascending, default 0 — and the tie-break that picks a default when no locale is flagged.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id, code, country, isDefault, language, position } = await promptForMissing(
          _options,
          localesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/locales/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (isDefault !== undefined) {
          _payload[`is_default`] = isDefault;
        }
        if (language !== undefined) {
          _payload[`language`] = language;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
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
registerPromptSpecs(markets.commands.at(-1)!, localesUpdateSpecs, { method: "put" });
const taxClassesListSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "Exact match on `id`. Primary key of this tax class. The class is named by `code` everywhere else, including by other apps.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Exact match on `code`. Tax class code, unique per market — the rate bucket a product or a shipping method is assigned to ('standard', 'reduced', 'zero'). Other apps name a class by THIS and by nothing else: there is no foreign key behind it and there cannot be (ADR-0055), which is why the delete route asks the shipping app what still points at the code before removing it.", type: "string", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Exact match on `name`. Display name of the rate bucket, in the operator's own language.", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Exact match on `labels`. Exact whole-document equality on the jsonb: the value is a whole JSON document and has to match every key, so this is not a path or a containment query. Key order and whitespace are irrelevant — the comparison is semantic. A value that does not parse as JSON is refused with 400 `invalid_value` rather than answered with zero rows. Localized display names for storefronts and invoices, keyed by locale: a flat {locale: label} map, one level deep, string values. The key to write is the `locale_policy.write` from GET /markets/{id}/context, exactly as for a market's labels. Null means nothing is translated and `name` is all there is.", type: "string", required: false },
  { key: "rate", option: "--rate <rate>", name: "rate", description: "Exact match on `rate`. Tax rate in PERCENT, 0–100 (default 0) — 20 means 20 %, not 0.2. Whether a stored price already contains it is a separate question, answered per market by `pricing.tax_basis` on the context.", type: "number", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Exact match on `is_default`. The class applied to a line that names none. At most one per market. A market that stores GROSS prices and marks no default cannot break those prices back down into net, which is why readiness turns that combination from a warning into a blocking failure.", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Exact match on `position`. Sort position among this market's tax classes, ascending, default 0 — and the tie-break that picks a class when none is flagged default.", type: "integer", required: false },
  { key: "createdAt", option: "--created-at <created-at>", name: "created_at", description: "Exact match on `created_at`. When the tax class was created on this market. Set by the database; never writable.", type: "string", required: false },
  { key: "updatedAt", option: "--updated-at <updated-at>", name: "updated_at", description: "Exact match on `updated_at`. When the tax class was last written. Set by the database on every update; never writable.", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200). Out of range is CLAMPED, not refused — ?limit=999 answers 200 with 200 rows, and `page.limit` says so.", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0). A negative offset is clamped to 0 rather than refused.", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column' | 'column.asc' | 'column.desc'. The direction is lower case, and the column has to exist: id, market_id, code, name, labels, rate, is_default, position, created_at, updated_at.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
markets
  .command(`tax-classes-list`)
  .description(`Every column is an exact-match filter and they combine with AND (?code=standard); each one is declared as a query parameter above. A \`?column=value\` this entity does not have is DROPPED rather than refused — the call answers 200 with the unfiltered list — and \`filter\` echoes what was actually applied, which is the only way to tell that apart from a filter that matched nothing. \`market_id\` is not among them: the owning market comes from the path and overwrites anything the query says. An unknown but well-formed market lists empty rather than 404 — the parent is filtered on, not verified.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `Exact match on \`id\`. Primary key of this tax class. The class is named by \`code\` everywhere else, including by other apps.`)
  .option(`--code <code>`, `Exact match on \`code\`. Tax class code, unique per market — the rate bucket a product or a shipping method is assigned to ('standard', 'reduced', 'zero'). Other apps name a class by THIS and by nothing else: there is no foreign key behind it and there cannot be (ADR-0055), which is why the delete route asks the shipping app what still points at the code before removing it.`)
  .option(`--name <name>`, `Exact match on \`name\`. Display name of the rate bucket, in the operator's own language.`)
  .option(`--labels <labels>`, `Exact match on \`labels\`. Exact whole-document equality on the jsonb: the value is a whole JSON document and has to match every key, so this is not a path or a containment query. Key order and whitespace are irrelevant — the comparison is semantic. A value that does not parse as JSON is refused with 400 \`invalid_value\` rather than answered with zero rows. Localized display names for storefronts and invoices, keyed by locale: a flat {locale: label} map, one level deep, string values. The key to write is the \`locale_policy.write\` from GET /markets/{id}/context, exactly as for a market's labels. Null means nothing is translated and \`name\` is all there is.`)
  .option(`--rate <rate>`, `Exact match on \`rate\`. Tax rate in PERCENT, 0–100 (default 0) — 20 means 20 %, not 0.2. Whether a stored price already contains it is a separate question, answered per market by \`pricing.tax_basis\` on the context.`, parseInteger)
  .option(
    `--is-default [value]`,
    `Exact match on \`is_default\`. The class applied to a line that names none. At most one per market. A market that stores GROSS prices and marks no default cannot break those prices back down into net, which is why readiness turns that combination from a warning into a blocking failure.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, `Exact match on \`position\`. Sort position among this market's tax classes, ascending, default 0 — and the tie-break that picks a class when none is flagged default.`, parseInteger)
  .option(`--created-at <created-at>`, `Exact match on \`created_at\`. When the tax class was created on this market. Set by the database; never writable.`)
  .option(`--updated-at <updated-at>`, `Exact match on \`updated_at\`. When the tax class was last written. Set by the database on every update; never writable.`)
  .option(`--limit <limit>`, `Page size (default 50, max 200). Out of range is CLAMPED, not refused — ?limit=999 answers 200 with 200 rows, and \`page.limit\` says so.`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0). A negative offset is clamped to 0 rather than refused.`, parseInteger)
  .option(`--order <order>`, `Sort as 'column' | 'column.asc' | 'column.desc'. The direction is lower case, and the column has to exist: id, market_id, code, name, labels, rate, is_default, position, created_at, updated_at.`)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id, code, name, labels, rate, isDefault, position, createdAt, updatedAt, limit, offset, order, filter } = await promptForMissing(
          _options,
          taxClassesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes`.replace(`{market_id}`, marketId);
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
        if (rate !== undefined) {
          _payload[`rate`] = rate;
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
registerPromptSpecs(markets.commands.at(-1)!, taxClassesListSpecs, { method: "get" });
const taxClassesCreateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Tax class code, unique per market — the rate bucket a product or a shipping method is assigned to ('standard', 'reduced', 'zero'). Other apps name a class by THIS and by nothing else: there is no foreign key behind it and there cannot be (ADR-0055), which is why the delete route asks the shipping app what still points at the code before removing it.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", description: "Display name of the rate bucket, in the operator's own language.", type: "string", required: true },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The class applied to a line that names none. At most one per market. A market that stores GROSS prices and marks no default cannot break those prices back down into net, which is why readiness turns that combination from a warning into a blocking failure.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names for storefronts and invoices, keyed by locale: a flat {locale: label} map, one level deep, string values. The key to write is the `locale_policy.write` from GET /markets/{id}/context, exactly as for a market's labels. Null means nothing is translated and `name` is all there is.", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position among this market's tax classes, ascending, default 0 — and the tie-break that picks a class when none is flagged default.", type: "integer", required: false },
  { key: "rate", option: "--rate <rate>", name: "rate", description: "Tax rate in PERCENT, 0–100 (default 0) — 20 means 20 %, not 0.2. Whether a stored price already contains it is a separate question, answered per market by `pricing.tax_basis` on the context.", type: "number", required: false },
];
markets
  .command(`tax-classes-create`)
  .description(`The owning market comes from the path and overrides anything in the body.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--code <code>`, `Tax class code, unique per market — the rate bucket a product or a shipping method is assigned to ('standard', 'reduced', 'zero'). Other apps name a class by THIS and by nothing else: there is no foreign key behind it and there cannot be (ADR-0055), which is why the delete route asks the shipping app what still points at the code before removing it.`)
  .option(`--name <name>`, `Display name of the rate bucket, in the operator's own language.`)
  .option(
    `--is-default [value]`,
    `The class applied to a line that names none. At most one per market. A market that stores GROSS prices and marks no default cannot break those prices back down into net, which is why readiness turns that combination from a warning into a blocking failure.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names for storefronts and invoices, keyed by locale: a flat {locale: label} map, one level deep, string values. The key to write is the \`locale_policy.write\` from GET /markets/{id}/context, exactly as for a market's labels. Null means nothing is translated and \`name\` is all there is.`)
  .option(`--position <position>`, `Sort position among this market's tax classes, ascending, default 0 — and the tie-break that picks a class when none is flagged default.`, parseInteger)
  .option(`--rate <rate>`, `Tax rate in PERCENT, 0–100 (default 0) — 20 means 20 %, not 0.2. Whether a stored price already contains it is a separate question, answered per market by \`pricing.tax_basis\` on the context.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, code, name, isDefault, labels, position, rate } = await promptForMissing(
          _options,
          taxClassesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes`.replace(`{market_id}`, marketId);
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
        if (rate !== undefined) {
          _payload[`rate`] = rate;
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
registerPromptSpecs(markets.commands.at(-1)!, taxClassesCreateSpecs, { method: "post" });
const taxClassesDeleteSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The tax class of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets/{market_id}/tax_classes", hasLimit: true } },
];
markets
  .command(`tax-classes-delete`)
  .description(`Refused with a 409 for as long as another app still points at this tax class by its code. A tax class is the source of record for a rate, and other apps name it by CODE with no foreign key behind it — a cross-app FK is what ADR-0055 forbids. So this asks the shipping app what still uses the code (shipping.tax-classes.usage) and answers 409 with the count and the first few names rather than leaving methods quoting a rate nobody defines. The check FAILS OPEN: a tenant without the shipping app, or an unreachable one, deletes as before, and the answer says which happened in 'usage_checked'. Matched on the code, which is shared across markets — the refusal message says so.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `The tax class of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          taxClassesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`markets tax-classes-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, taxClassesDeleteSpecs, { method: "delete", destructive: true });
const taxClassesGetSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The tax class of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets/{market_id}/tax_classes", hasLimit: true } },
];
markets
  .command(`tax-classes-get`)
  .description(`Scoped strictly to the market in the path: a row belonging to another market is a 404 here, never a 200.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `The tax class of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id } = await promptForMissing(
          _options,
          taxClassesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
registerPromptSpecs(markets.commands.at(-1)!, taxClassesGetSpecs, { method: "get" });
const taxClassesUpdateSpecs: PromptSpec[] = [
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.", type: "string", required: true, resource: { listPath: "/markets", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", description: "The tax class of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.", type: "string", required: true, resource: { listPath: "/markets/{market_id}/tax_classes", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", description: "Tax class code, unique per market — the rate bucket a product or a shipping method is assigned to ('standard', 'reduced', 'zero'). Other apps name a class by THIS and by nothing else: there is no foreign key behind it and there cannot be (ADR-0055), which is why the delete route asks the shipping app what still points at the code before removing it.", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "The class applied to a line that names none. At most one per market. A market that stores GROSS prices and marks no default cannot break those prices back down into net, which is why readiness turns that combination from a warning into a blocking failure.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localized display names for storefronts and invoices, keyed by locale: a flat {locale: label} map, one level deep, string values. The key to write is the `locale_policy.write` from GET /markets/{id}/context, exactly as for a market's labels. Null means nothing is translated and `name` is all there is.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name of the rate bucket, in the operator's own language.", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort position among this market's tax classes, ascending, default 0 — and the tie-break that picks a class when none is flagged default.", type: "integer", required: false },
  { key: "rate", option: "--rate <rate>", name: "rate", description: "Tax rate in PERCENT, 0–100 (default 0) — 20 means 20 %, not 0.2. Whether a stored price already contains it is a separate question, answered per market by `pricing.tax_basis` on the context.", type: "number", required: false },
];
markets
  .command(`tax-classes-update`)
  .description(`Partial: omitted fields keep their value.`)
  .option(`--market-id <market-id>`, `The owning market. A uuid — this route does not accept a market code. An unknown market lists empty rather than 404.`)
  .option(`--id <id>`, `The tax class of a market, by its primary key. A uuid — this route does not resolve a code, so a segment that will not cast is a 400 before any row is read.`)
  .option(`--code <code>`, `Tax class code, unique per market — the rate bucket a product or a shipping method is assigned to ('standard', 'reduced', 'zero'). Other apps name a class by THIS and by nothing else: there is no foreign key behind it and there cannot be (ADR-0055), which is why the delete route asks the shipping app what still points at the code before removing it.`)
  .option(
    `--is-default [value]`,
    `The class applied to a line that names none. At most one per market. A market that stores GROSS prices and marks no default cannot break those prices back down into net, which is why readiness turns that combination from a warning into a blocking failure.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localized display names for storefronts and invoices, keyed by locale: a flat {locale: label} map, one level deep, string values. The key to write is the \`locale_policy.write\` from GET /markets/{id}/context, exactly as for a market's labels. Null means nothing is translated and \`name\` is all there is.`)
  .option(`--name <name>`, `Display name of the rate bucket, in the operator's own language.`)
  .option(`--position <position>`, `Sort position among this market's tax classes, ascending, default 0 — and the tie-break that picks a class when none is flagged default.`, parseInteger)
  .option(`--rate <rate>`, `Tax rate in PERCENT, 0–100 (default 0) — 20 means 20 %, not 0.2. Whether a stored price already contains it is a separate question, answered per market by \`pricing.tax_basis\` on the context.`, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { marketId, id, code, isDefault, labels, name, position, rate } = await promptForMissing(
          _options,
          taxClassesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/markets/{market_id}/tax_classes/{id}`.replace(`{market_id}`, marketId).replace(`{id}`, id);
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
        if (rate !== undefined) {
          _payload[`rate`] = rate;
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
registerPromptSpecs(markets.commands.at(-1)!, taxClassesUpdateSpecs, { method: "put" });
