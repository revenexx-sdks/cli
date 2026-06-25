import { Command } from "commander";
import { sdkForProject } from "../../sdks.js";
import type { RequestParams } from "../../types.js";
import {
  actionRunner,
  commandDescriptions,
  parse,
  parseBool,
  parseInteger,
} from "../../parser.js";

export const prices = new Command("prices")
  .description(commandDescriptions["prices"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

prices
  .command(`prices-lists-list`)
  .description(``)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
prices
  .command(`prices-lists-create`)
  .description(``)
  .requiredOption(`--code <code>`, `Unique list code per tenant.`)
  .requiredOption(`--name <name>`, ``)
  .option(`--channel-_id <channel-_id>`, `Scope: only this channel.`)
  .option(`--contact-_id <contact-_id>`, `Scope: only this contact — beats every other scope.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR) — resolution only considers lists matching the requested currency.`)
  .option(`--description <description>`, ``)
  .option(
    `--is-_default [value]`,
    `Default lists resolve last within their group.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localised names ({de, en, …}).`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--organization-_id <organization-_id>`, `Scope: only this organization.`)
  .option(`--priority <priority>`, `Tie-breaker within a specificity group (higher wins, default 0).`, parseInteger)
  .option(
    `--requires-_auth [value]`,
    `Gate: when true the list resolves only for an authenticated buyer (contact or organization context); anonymous resolve calls get on_request. Default false (open to everyone).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--status <status>`, `Default 'active' — only active lists resolve.`)
  .option(
    `--tax-_included [value]`,
    `Gross (true) or net (false, default) prices.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--valid-_from <valid-_from>`, `Validity window start.`)
  .option(`--valid-_until <valid-_until>`, `Validity window end.`)
  .action(
    actionRunner(
      async ({ code, name, channel_id, contact_id, currency, description, is_default, labels, metadata, organization_id, priority, requires_auth, status, tax_included, valid_from, valid_until }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists`;
        const _payload: RequestParams = {};
        if (channel_id !== undefined) {
          _payload[`channel_id`] = channel_id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
        }
        if (requires_auth !== undefined) {
          _payload[`requires_auth`] = requires_auth;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (tax_included !== undefined) {
          _payload[`tax_included`] = tax_included;
        }
        if (valid_from !== undefined) {
          _payload[`valid_from`] = valid_from;
        }
        if (valid_until !== undefined) {
          _payload[`valid_until`] = valid_until;
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
prices
  .command(`prices-lists-defaults`)
  .description(``)
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
prices
  .command(`prices-lists-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
prices
  .command(`prices-lists-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
prices
  .command(`prices-lists-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--channel-_id <channel-_id>`, `Scope: only this channel.`)
  .option(`--code <code>`, `Unique list code per tenant.`)
  .option(`--contact-_id <contact-_id>`, `Scope: only this contact — beats every other scope.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR) — resolution only considers lists matching the requested currency.`)
  .option(`--description <description>`, ``)
  .option(
    `--is-_default [value]`,
    `Default lists resolve last within their group.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, `Localised names ({de, en, …}).`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, ``)
  .option(`--organization-_id <organization-_id>`, `Scope: only this organization.`)
  .option(`--priority <priority>`, `Tie-breaker within a specificity group (higher wins, default 0).`, parseInteger)
  .option(
    `--requires-_auth [value]`,
    `Gate: when true the list resolves only for an authenticated buyer (contact or organization context); anonymous resolve calls get on_request. Default false (open to everyone).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--status <status>`, `Default 'active' — only active lists resolve.`)
  .option(
    `--tax-_included [value]`,
    `Gross (true) or net (false, default) prices.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--valid-_from <valid-_from>`, `Validity window start.`)
  .option(`--valid-_until <valid-_until>`, `Validity window end.`)
  .action(
    actionRunner(
      async ({ id, channel_id, code, contact_id, currency, description, is_default, labels, metadata, name, organization_id, priority, requires_auth, status, tax_included, valid_from, valid_until }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (channel_id !== undefined) {
          _payload[`channel_id`] = channel_id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (is_default !== undefined) {
          _payload[`is_default`] = is_default;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
        }
        if (priority !== undefined) {
          _payload[`priority`] = priority;
        }
        if (requires_auth !== undefined) {
          _payload[`requires_auth`] = requires_auth;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
        }
        if (tax_included !== undefined) {
          _payload[`tax_included`] = tax_included;
        }
        if (valid_from !== undefined) {
          _payload[`valid_from`] = valid_from;
        }
        if (valid_until !== undefined) {
          _payload[`valid_until`] = valid_until;
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
prices
  .command(`prices-entries-list`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ list_id, limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries`.replace(`{list_id}`, list_id);
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
prices
  .command(`prices-entries-create`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--price-_type <price-_type>`, `Default 'standard'; 'on_request' is the explicit no-price marker — it stops resolution and answers "price on request".`)
  .option(`--product-_id <product-_id>`, `Priced product.`)
  .option(`--quantity-_min <quantity-_min>`, `Tier threshold (Staffelpreis): this price applies from this quantity (default 1).`, parseInteger)
  .option(`--sku <sku>`, `Priced SKU (alternative to product_id).`)
  .option(`--unit <unit>`, ``)
  .option(`--unit-_price <unit-_price>`, `Per-unit price (default 0).`, parseInteger)
  .option(`--valid-_from <valid-_from>`, `Per-entry validity start (promo prices).`)
  .option(`--valid-_until <valid-_until>`, `Per-entry validity end.`)
  .action(
    actionRunner(
      async ({ list_id, metadata, price_type, product_id, quantity_min, sku, unit, unit_price, valid_from, valid_until }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries`.replace(`{list_id}`, list_id);
        const _payload: RequestParams = {};
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (price_type !== undefined) {
          _payload[`price_type`] = price_type;
        }
        if (product_id !== undefined) {
          _payload[`product_id`] = product_id;
        }
        if (quantity_min !== undefined) {
          _payload[`quantity_min`] = quantity_min;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unit_price !== undefined) {
          _payload[`unit_price`] = unit_price;
        }
        if (valid_from !== undefined) {
          _payload[`valid_from`] = valid_from;
        }
        if (valid_until !== undefined) {
          _payload[`valid_until`] = valid_until;
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
prices
  .command(`prices-entries-replace`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--entries [entries...]`, `The complete new entry set (set semantics).`)
  .action(
    actionRunner(
      async ({ list_id, entries }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries`.replace(`{list_id}`, list_id);
        const _payload: RequestParams = {};
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
prices
  .command(`prices-entries-bulk`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--entries [entries...]`, `The complete new entry set (set semantics).`)
  .action(
    actionRunner(
      async ({ list_id, entries }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/bulk`.replace(`{list_id}`, list_id);
        const _payload: RequestParams = {};
        if (entries !== undefined) {
          _payload[`entries`] = entries;
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
prices
  .command(`prices-entries-delete`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ list_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/{id}`.replace(`{list_id}`, list_id).replace(`{id}`, id);
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
prices
  .command(`prices-entries-get`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ list_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/{id}`.replace(`{list_id}`, list_id).replace(`{id}`, id);
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
prices
  .command(`prices-entries-update`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--price-_type <price-_type>`, `Default 'standard'; 'on_request' is the explicit no-price marker — it stops resolution and answers "price on request".`)
  .option(`--product-_id <product-_id>`, `Priced product.`)
  .option(`--quantity-_min <quantity-_min>`, `Tier threshold (Staffelpreis): this price applies from this quantity (default 1).`, parseInteger)
  .option(`--sku <sku>`, `Priced SKU (alternative to product_id).`)
  .option(`--unit <unit>`, ``)
  .option(`--unit-_price <unit-_price>`, `Per-unit price (default 0).`, parseInteger)
  .option(`--valid-_from <valid-_from>`, `Per-entry validity start (promo prices).`)
  .option(`--valid-_until <valid-_until>`, `Per-entry validity end.`)
  .action(
    actionRunner(
      async ({ list_id, id, metadata, price_type, product_id, quantity_min, sku, unit, unit_price, valid_from, valid_until }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/lists/{list_id}/entries/{id}`.replace(`{list_id}`, list_id).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (price_type !== undefined) {
          _payload[`price_type`] = price_type;
        }
        if (product_id !== undefined) {
          _payload[`product_id`] = product_id;
        }
        if (quantity_min !== undefined) {
          _payload[`quantity_min`] = quantity_min;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unit_price !== undefined) {
          _payload[`unit_price`] = unit_price;
        }
        if (valid_from !== undefined) {
          _payload[`valid_from`] = valid_from;
        }
        if (valid_until !== undefined) {
          _payload[`valid_until`] = valid_until;
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
prices
  .command(`prices-resolve`)
  .description(``)
  .requiredOption(`--items [items...]`, `Items to price (at most 200 per call).`)
  .option(`--at <at>`, `Point in time for validity windows (ISO 8601 timestamp, default now).`)
  .option(`--channel-_id <channel-_id>`, `Buyer context: channel.`)
  .option(`--contact-_id <contact-_id>`, `Buyer context: contact — most specific scope.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR) — only lists in this currency resolve.`)
  .option(`--market-_id <market-_id>`, `Buyer context: market.`)
  .option(`--organization-_id <organization-_id>`, `Buyer context: organization.`)
  .action(
    actionRunner(
      async ({ items, at, channel_id, contact_id, currency, market_id, organization_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/prices/resolve`;
        const _payload: RequestParams = {};
        if (at !== undefined) {
          _payload[`at`] = at;
        }
        if (channel_id !== undefined) {
          _payload[`channel_id`] = channel_id;
        }
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (market_id !== undefined) {
          _payload[`market_id`] = market_id;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
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
