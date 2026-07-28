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
      `Manage prices resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
prices
  .command(`lists-list`)
  .description(`List price lists`)
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
          listsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists`;
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
registerPromptSpecs(prices.commands.at(-1)!, listsListSpecs, { method: "get" });
const listsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", description: "Unique list code per tenant.", type: "string", required: true },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "Scope: only this channel.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Scope: only this contact — beats every other scope.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR) — resolution only considers lists matching the requested currency.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Default lists resolve last within their group.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localised names ({de, en, …}).", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Scope: only this organization.", type: "string", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Tie-breaker within a specificity group (higher wins, default 0).", type: "integer", required: false },
  { key: "requiresAuth", option: "--requires-auth <requires-auth>", name: "requires_auth", description: "Gate: when true the list resolves only for an authenticated buyer (contact or organization context); anonymous resolve calls get on_request. Default false (open to everyone).", type: "boolean", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'active' — only active lists resolve.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "taxBasis", option: "--tax-basis <tax-basis>", name: "tax_basis", description: "Whether the amounts in this list are net or gross. Omit (null) to inherit the tenant's tax_inclusive_default setting — the resolve answer names which of the two decided.", type: "string", required: false, enum: ["net","gross"] },
  { key: "taxIncluded", option: "--tax-included <tax-included>", name: "tax_included", description: "LEGACY mirror of tax_basis. false is the column default and is NOT read as a statement of intent; true is read as gross. Prefer tax_basis.", type: "boolean", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", description: "Validity window start.", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "Validity window end.", type: "string", required: false },
];
prices
  .command(`lists-create`)
  .description(`Create a price list (currency, priority, validity, buyer scope)`)
  .option(`--code <code>`, `Unique list code per tenant.`)
  .option(`--name <name>`, ``)
  .option(`--channel-id <channel-id>`, `Scope: only this channel.`)
  .option(`--contact-id <contact-id>`, `Scope: only this contact — beats every other scope.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR) — resolution only considers lists matching the requested currency.`)
  .option(`--description <description>`, ``)
  .option(
    `--is-default [value]`,
    `Default lists resolve last within their group.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localised names ({de, en, …}).`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--organization-id <organization-id>`, `Scope: only this organization.`)
  .option(`--priority <priority>`, `Tie-breaker within a specificity group (higher wins, default 0).`, parseInteger)
  .option(
    `--requires-auth [value]`,
    `Gate: when true the list resolves only for an authenticated buyer (contact or organization context); anonymous resolve calls get on_request. Default false (open to everyone).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--status <status>`, `Default 'active' — only active lists resolve.`)
  .option(`--tax-basis <tax-basis>`, `Whether the amounts in this list are net or gross. Omit (null) to inherit the tenant's tax_inclusive_default setting — the resolve answer names which of the two decided.`)
  .option(
    `--tax-included [value]`,
    `LEGACY mirror of tax_basis. false is the column default and is NOT read as a statement of intent; true is read as gross. Prefer tax_basis.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--valid-from <valid-from>`, `Validity window start.`)
  .option(`--valid-until <valid-until>`, `Validity window end.`)
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
  .description(`Seed the standard price list — idempotent, also runs on app.installed`)
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
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
];
prices
  .command(`lists-delete`)
  .description(`Delete a price list including its entries`)
  .option(`--id <id>`, ``)
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
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
];
prices
  .command(`lists-get`)
  .description(`Read one price list`)
  .option(`--id <id>`, ``)
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
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "Scope: only this channel.", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", description: "Unique list code per tenant.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Scope: only this contact — beats every other scope.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR) — resolution only considers lists matching the requested currency.", type: "string", required: false },
  { key: "description", option: "--description <description>", name: "description", type: "string", required: false },
  { key: "isDefault", option: "--is-default <is-default>", name: "is_default", description: "Default lists resolve last within their group.", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", description: "Localised names ({de, en, …}).", type: "object", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Scope: only this organization.", type: "string", required: false },
  { key: "priority", option: "--priority <priority>", name: "priority", description: "Tie-breaker within a specificity group (higher wins, default 0).", type: "integer", required: false },
  { key: "requiresAuth", option: "--requires-auth <requires-auth>", name: "requires_auth", description: "Gate: when true the list resolves only for an authenticated buyer (contact or organization context); anonymous resolve calls get on_request. Default false (open to everyone).", type: "boolean", required: false },
  { key: "status", option: "--status <status>", name: "status", description: "Default 'active' — only active lists resolve.", type: "string", required: false, enum: ["active","inactive"] },
  { key: "taxBasis", option: "--tax-basis <tax-basis>", name: "tax_basis", description: "Whether the amounts in this list are net or gross. Omit (null) to inherit the tenant's tax_inclusive_default setting — the resolve answer names which of the two decided.", type: "string", required: false, enum: ["net","gross"] },
  { key: "taxIncluded", option: "--tax-included <tax-included>", name: "tax_included", description: "LEGACY mirror of tax_basis. false is the column default and is NOT read as a statement of intent; true is read as gross. Prefer tax_basis.", type: "boolean", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", description: "Validity window start.", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "Validity window end.", type: "string", required: false },
];
prices
  .command(`lists-update`)
  .description(`Update a price list`)
  .option(`--id <id>`, ``)
  .option(`--channel-id <channel-id>`, `Scope: only this channel.`)
  .option(`--code <code>`, `Unique list code per tenant.`)
  .option(`--contact-id <contact-id>`, `Scope: only this contact — beats every other scope.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR) — resolution only considers lists matching the requested currency.`)
  .option(`--description <description>`, ``)
  .option(
    `--is-default [value]`,
    `Default lists resolve last within their group.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localised names ({de, en, …}).`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, ``)
  .option(`--organization-id <organization-id>`, `Scope: only this organization.`)
  .option(`--priority <priority>`, `Tie-breaker within a specificity group (higher wins, default 0).`, parseInteger)
  .option(
    `--requires-auth [value]`,
    `Gate: when true the list resolves only for an authenticated buyer (contact or organization context); anonymous resolve calls get on_request. Default false (open to everyone).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--status <status>`, `Default 'active' — only active lists resolve.`)
  .option(`--tax-basis <tax-basis>`, `Whether the amounts in this list are net or gross. Omit (null) to inherit the tenant's tax_inclusive_default setting — the resolve answer names which of the two decided.`)
  .option(
    `--tax-included [value]`,
    `LEGACY mirror of tax_basis. false is the column default and is NOT read as a statement of intent; true is read as gross. Prefer tax_basis.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--valid-from <valid-from>`, `Validity window start.`)
  .option(`--valid-until <valid-until>`, `Validity window end.`)
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
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
prices
  .command(`entries-list`)
  .description(`List the entries of a price list (tiers, validity, on-request markers)`)
  .option(`--list-id <list-id>`, ``)
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
        const { listId, limit, offset, order, filter } = await promptForMissing(
          _options,
          entriesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries`.replace(`{list_id}`, listId);
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
registerPromptSpecs(prices.commands.at(-1)!, entriesListSpecs, { method: "get" });
const entriesCreateSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "priceType", option: "--price-type <price-type>", name: "price_type", description: "Default 'standard'; 'on_request' is the explicit no-price marker — it stops resolution and answers \"price on request\".", type: "string", required: false, enum: ["standard","on_request"] },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Priced product.", type: "string", required: false },
  { key: "quantityMin", option: "--quantity-min <quantity-min>", name: "quantity_min", description: "Tier threshold (Staffelpreis): this price applies from this quantity (default 1).", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Priced SKU (alternative to product_id).", type: "string", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", description: "Per-unit price (default 0).", type: "number", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", description: "Per-entry validity start (promo prices).", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "Per-entry validity end.", type: "string", required: false },
];
prices
  .command(`entries-create`)
  .description(`Add a price entry (quantity tier)`)
  .option(`--list-id <list-id>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--price-type <price-type>`, `Default 'standard'; 'on_request' is the explicit no-price marker — it stops resolution and answers "price on request".`)
  .option(`--product-id <product-id>`, `Priced product.`)
  .option(`--quantity-min <quantity-min>`, `Tier threshold (Staffelpreis): this price applies from this quantity (default 1).`, parseInteger)
  .option(`--sku <sku>`, `Priced SKU (alternative to product_id).`)
  .option(`--unit <unit>`, ``)
  .option(`--unit-price <unit-price>`, `Per-unit price (default 0).`, parseInteger)
  .option(`--valid-from <valid-from>`, `Per-entry validity start (promo prices).`)
  .option(`--valid-until <valid-until>`, `Per-entry validity end.`)
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
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "entries", option: "--entries [entries...]", name: "entries", description: "The complete new entry set (set semantics).", type: "array", required: true },
];
prices
  .command(`entries-replace`)
  .description(`Replace ALL entries of a price list (table editing / import)`)
  .option(`--list-id <list-id>`, ``)
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
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "amount", option: "--amount <amount>", name: "amount", description: "Absolute change added to every unit price, in the list's currency.", type: "number", required: false },
  { key: "dryRun", option: "--dry-run <dry-run>", name: "dry_run", description: "true writes nothing and answers the same preview — what the Cockpit dialog shows before it commits.", type: "boolean", required: false },
  { key: "percent", option: "--percent <percent>", name: "percent", description: "Relative change in percent: 5 raises by 5 %, -10 cuts by 10 %.", type: "number", required: false },
  { key: "rounding", option: "--rounding <rounding>", name: "rounding", description: "Ending the computed prices snap to (nearest match). Omit to use the tenant's bulk_adjust_rounding setting.", type: "string", required: false, enum: ["exact","whole","ending_99","ending_95","ending_50"] },
  { key: "skuPrefix", option: "--sku-prefix <sku-prefix>", name: "sku_prefix", description: "Restrict the change to entries whose SKU starts with this. Omit to change the whole list.", type: "string", required: false },
];
prices
  .command(`entries-adjust`)
  .description(`The other half of a bulk change: a 7 % increase turns 19.90 into 21.293, which no merchant prints. Results are rounded to the tenant's price_precision/rounding_mode and then snapped to the declared price ending (x.99, x.95, whole, …). dry_run answers the same preview and writes nothing.`)
  .option(`--list-id <list-id>`, ``)
  .option(`--amount <amount>`, `Absolute change added to every unit price, in the list's currency.`, parseInteger)
  .option(
    `--dry-run [value]`,
    `true writes nothing and answers the same preview — what the Cockpit dialog shows before it commits.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--percent <percent>`, `Relative change in percent: 5 raises by 5 %, -10 cuts by 10 %.`, parseInteger)
  .option(`--rounding <rounding>`, `Ending the computed prices snap to (nearest match). Omit to use the tenant's bulk_adjust_rounding setting.`)
  .option(`--sku-prefix <sku-prefix>`, `Restrict the change to entries whose SKU starts with this. Omit to change the whole list.`)
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
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "entries", option: "--entries [entries...]", name: "entries", description: "At most 5000 rows per call — send a large book in chunks.", type: "array", required: true },
  { key: "mode", option: "--mode <mode>", name: "mode", description: "Default 'upsert': a row naming a rung the list already has (same product/sku AND quantity_min) updates it. 'append' always inserts — a re-run then duplicates the ladder, which is what makes an ambiguous tier table.", type: "string", required: false, enum: ["upsert","append"] },
];
prices
  .command(`entries-bulk`)
  .description(`Adds entries to a list without wiping it. A row naming a rung the list already has (same product_id/sku AND quantity_min) updates that rung, so re-running an import corrects prices instead of duplicating the ladder; \`mode: 'append'\` keeps the old insert-everything behaviour. Inserts go out as one PostgREST bulk write per 1000 rows.`)
  .option(`--list-id <list-id>`, ``)
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
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "basePrice", option: "--base-price <base-price>", name: "base_price", description: "Unit price at the first tier.", type: "number", required: true },
  { key: "discountPercent", option: "--discount-percent <discount-percent>", name: "discount_percent", description: "Discount applied per tier, compounded: 5 gives 19.90 / 18.91 / 17.96. Default 0.", type: "number", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "The item the ladder prices.", type: "string", required: false },
  { key: "quantities", option: "--quantities [quantities...]", name: "quantities", description: "Tier thresholds, ascending — an array of numbers or a comma-separated string ('1, 10, 50'). Default [1, 10, 50], at most 50 tiers.", type: "array", required: false },
  { key: "replace", option: "--replace <replace>", name: "replace", description: "Default true: the item's existing entries in this list are removed first, so the ladder IS the ladder. false appends.", type: "boolean", required: false },
  { key: "rounding", option: "--rounding <rounding>", name: "rounding", description: "Ending the computed prices snap to (nearest match). Omit to use the tenant's bulk_adjust_rounding setting.", type: "string", required: false, enum: ["exact","whole","ending_99","ending_95","ending_50"] },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "The item the ladder prices (alternative to product_id).", type: "string", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", description: "Unit of measure carried onto every generated tier (e.g. PCE).", type: "string", required: false },
];
prices
  .command(`entries-ladder`)
  .description(`Tiers are a flat quantity_min column on purpose — the ladder IS the set of entries sharing an identity, and resolve returns it sorted as one array. What was missing was the gesture: "19.90 from 1, 5 % off per tier at 10 and 50". Prices are rounded and snapped exactly as a bulk adjust is.`)
  .option(`--list-id <list-id>`, ``)
  .option(`--base-price <base-price>`, `Unit price at the first tier.`, parseInteger)
  .option(`--discount-percent <discount-percent>`, `Discount applied per tier, compounded: 5 gives 19.90 / 18.91 / 17.96. Default 0.`, parseInteger)
  .option(`--product-id <product-id>`, `The item the ladder prices.`)
  .option(`--quantities [quantities...]`, `Tier thresholds, ascending — an array of numbers or a comma-separated string ('1, 10, 50'). Default [1, 10, 50], at most 50 tiers.`)
  .option(
    `--replace [value]`,
    `Default true: the item's existing entries in this list are removed first, so the ladder IS the ladder. false appends.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--rounding <rounding>`, `Ending the computed prices snap to (nearest match). Omit to use the tenant's bulk_adjust_rounding setting.`)
  .option(`--sku <sku>`, `The item the ladder prices (alternative to product_id).`)
  .option(`--unit <unit>`, `Unit of measure carried onto every generated tier (e.g. PCE).`)
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
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/prices/lists/{list_id}/entries", hasLimit: true } },
];
prices
  .command(`entries-delete`)
  .description(`Delete a price entry`)
  .option(`--list-id <list-id>`, ``)
  .option(`--id <id>`, ``)
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
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/prices/lists/{list_id}/entries", hasLimit: true } },
];
prices
  .command(`entries-get`)
  .description(`Read one price entry`)
  .option(`--list-id <list-id>`, ``)
  .option(`--id <id>`, ``)
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
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/prices/lists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/prices/lists/{list_id}/entries", hasLimit: true } },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", description: "Free-form metadata.", type: "object", required: false },
  { key: "priceType", option: "--price-type <price-type>", name: "price_type", description: "Default 'standard'; 'on_request' is the explicit no-price marker — it stops resolution and answers \"price on request\".", type: "string", required: false, enum: ["standard","on_request"] },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Priced product.", type: "string", required: false },
  { key: "quantityMin", option: "--quantity-min <quantity-min>", name: "quantity_min", description: "Tier threshold (Staffelpreis): this price applies from this quantity (default 1).", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Priced SKU (alternative to product_id).", type: "string", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
  { key: "unitPrice", option: "--unit-price <unit-price>", name: "unit_price", description: "Per-unit price (default 0).", type: "number", required: false },
  { key: "validFrom", option: "--valid-from <valid-from>", name: "valid_from", description: "Per-entry validity start (promo prices).", type: "string", required: false },
  { key: "validUntil", option: "--valid-until <valid-until>", name: "valid_until", description: "Per-entry validity end.", type: "string", required: false },
];
prices
  .command(`entries-update`)
  .description(`Update a price entry`)
  .option(`--list-id <list-id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--price-type <price-type>`, `Default 'standard'; 'on_request' is the explicit no-price marker — it stops resolution and answers "price on request".`)
  .option(`--product-id <product-id>`, `Priced product.`)
  .option(`--quantity-min <quantity-min>`, `Tier threshold (Staffelpreis): this price applies from this quantity (default 1).`, parseInteger)
  .option(`--sku <sku>`, `Priced SKU (alternative to product_id).`)
  .option(`--unit <unit>`, ``)
  .option(`--unit-price <unit-price>`, `Per-unit price (default 0).`, parseInteger)
  .option(`--valid-from <valid-from>`, `Per-entry validity start (promo prices).`)
  .option(`--valid-until <valid-until>`, `Per-entry validity end.`)
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
const resolveSpecs: PromptSpec[] = [
  { key: "items", option: "--items [items...]", name: "items", description: "Items to price (at most 200 per call).", type: "array", required: true },
  { key: "at", option: "--at <at>", name: "at", description: "Point in time for validity windows (ISO 8601 timestamp, default now).", type: "string", required: false },
  { key: "channelId", option: "--channel-id <channel-id>", name: "channel_id", description: "Buyer context: channel.", type: "string", required: false },
  { key: "contactId", option: "--contact-id <contact-id>", name: "contact_id", description: "Buyer context: contact — most specific scope.", type: "string", required: false },
  { key: "currency", option: "--currency <currency>", name: "currency", description: "ISO 4217 code (default EUR) — only lists in this currency resolve.", type: "string", required: false },
  { key: "marketId", option: "--market-id <market-id>", name: "market_id", description: "Buyer context: market.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Buyer context: organization.", type: "string", required: false },
];
prices
  .command(`resolve`)
  .description(`THE live price call: resolve unit prices + tier ladders for items in a buyer context (contact/org/market/channel). Most-customised surface in the field — designed to be replaced 1:1 by a custom app via the gateway capability override (ERP pricing).`)
  .option(`--items [items...]`, `Items to price (at most 200 per call).`)
  .option(`--at <at>`, `Point in time for validity windows (ISO 8601 timestamp, default now).`)
  .option(`--channel-id <channel-id>`, `Buyer context: channel.`)
  .option(`--contact-id <contact-id>`, `Buyer context: contact — most specific scope.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR) — only lists in this currency resolve.`)
  .option(`--market-id <market-id>`, `Buyer context: market.`)
  .option(`--organization-id <organization-id>`, `Buyer context: organization.`)
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
  .description(`Discovery for the vocabulary routes. Names: list-statuses, price-types, tax-bases. Fetch one with GET /prices/vocabularies/{name}; a client holding the qualified pair 'prices.<name>' builds that URL from the pair alone.`)
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
  .description(`The values are read out of the column's CHECK constraint, so the served set IS the enforced set and the two cannot drift — a value added to the constraint appears here even before anyone labels it, titled from its own key. Values come back in constraint order, which is the order a select should offer. 'closed' says the set is exhaustive, so a value outside it is stale data rather than a missing label. Answers 404 for an unknown name. Names: list-statuses, price-types, tax-bases.`)
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
