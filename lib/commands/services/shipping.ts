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

export const shipping = new Command("shipping")
  .description(commandDescriptions["shipping"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

shipping
  .command(`shipping-methods-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods`;
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
shipping
  .command(`shipping-methods-create`)
  .description(``)
  .requiredOption(`--code <code>`, `Stable method code, unique per tenant (e.g. standard, express).`)
  .requiredOption(`--name <name>`, `Display name.`)
  .option(`--carrier <carrier>`, `Carrier anchor for the upcoming carrier connect (dynamic rates, tracking links).`)
  .option(`--countries [countries...]`, `Allowed ISO 3166-1 alpha-2 codes; null or empty = worldwide.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--description <description>`, ``)
  .option(
    `--enabled [value]`,
    `Only enabled methods appear in rate responses (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--eta-_days-_max <eta-_days-_max>`, `Delivery-time estimate for the checkout (days, upper bound).`, parseInteger)
  .option(`--eta-_days-_min <eta-_days-_min>`, `Delivery-time estimate for the checkout (days, lower bound).`, parseInteger)
  .option(`--free-_above <free-_above>`, `Free shipping at or above this order value — wins over every pricing model.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names keyed by locale (e.g. {de, en}).`)
  .option(`--matrix-_attribute <matrix-_attribute>`, `Attribute name for matrix_basis 'attribute'.`)
  .option(`--matrix-_basis <matrix-_basis>`, `The measure a matrix method prices over; 'attribute' reads matrix_attribute from the rate request.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--position <position>`, `Sort order in the checkout (default 0).`, parseInteger)
  .option(`--price <price>`, `The fixed price (default 0) — ignored for 'free' and 'matrix'.`, parseInteger)
  .option(`--pricing-_type <pricing-_type>`, `Pricing model (default 'fixed'): one price, no price, or tiered over a measure.`)
  .action(
    actionRunner(
      async ({ code, name, carrier, countries, currency, description, enabled, eta_days_max, eta_days_min, free_above, labels, matrix_attribute, matrix_basis, metadata, position, price, pricing_type }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods`;
        const _payload: RequestParams = {};
        if (carrier !== undefined) {
          _payload[`carrier`] = carrier;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (countries !== undefined) {
          _payload[`countries`] = countries;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (eta_days_max !== undefined) {
          _payload[`eta_days_max`] = eta_days_max;
        }
        if (eta_days_min !== undefined) {
          _payload[`eta_days_min`] = eta_days_min;
        }
        if (free_above !== undefined) {
          _payload[`free_above`] = free_above;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (matrix_attribute !== undefined) {
          _payload[`matrix_attribute`] = matrix_attribute;
        }
        if (matrix_basis !== undefined) {
          _payload[`matrix_basis`] = matrix_basis;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (pricing_type !== undefined) {
          _payload[`pricing_type`] = pricing_type;
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
shipping
  .command(`shipping-methods-defaults`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/defaults`;
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
shipping
  .command(`shipping-methods-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
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
shipping
  .command(`shipping-methods-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
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
shipping
  .command(`shipping-methods-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--carrier <carrier>`, `Carrier anchor for the upcoming carrier connect (dynamic rates, tracking links).`)
  .option(`--code <code>`, `Stable method code, unique per tenant (e.g. standard, express).`)
  .option(`--countries [countries...]`, `Allowed ISO 3166-1 alpha-2 codes; null or empty = worldwide.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(`--description <description>`, ``)
  .option(
    `--enabled [value]`,
    `Only enabled methods appear in rate responses (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--eta-_days-_max <eta-_days-_max>`, `Delivery-time estimate for the checkout (days, upper bound).`, parseInteger)
  .option(`--eta-_days-_min <eta-_days-_min>`, `Delivery-time estimate for the checkout (days, lower bound).`, parseInteger)
  .option(`--free-_above <free-_above>`, `Free shipping at or above this order value — wins over every pricing model.`, parseInteger)
  .option(`--labels <labels>`, `Localized display names keyed by locale (e.g. {de, en}).`)
  .option(`--matrix-_attribute <matrix-_attribute>`, `Attribute name for matrix_basis 'attribute'.`)
  .option(`--matrix-_basis <matrix-_basis>`, `The measure a matrix method prices over; 'attribute' reads matrix_attribute from the rate request.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Display name.`)
  .option(`--position <position>`, `Sort order in the checkout (default 0).`, parseInteger)
  .option(`--price <price>`, `The fixed price (default 0) — ignored for 'free' and 'matrix'.`, parseInteger)
  .option(`--pricing-_type <pricing-_type>`, `Pricing model (default 'fixed'): one price, no price, or tiered over a measure.`)
  .action(
    actionRunner(
      async ({ id, carrier, code, countries, currency, description, enabled, eta_days_max, eta_days_min, free_above, labels, matrix_attribute, matrix_basis, metadata, name, position, price, pricing_type }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (carrier !== undefined) {
          _payload[`carrier`] = carrier;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (countries !== undefined) {
          _payload[`countries`] = countries;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (description !== undefined) {
          _payload[`description`] = description;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (eta_days_max !== undefined) {
          _payload[`eta_days_max`] = eta_days_max;
        }
        if (eta_days_min !== undefined) {
          _payload[`eta_days_min`] = eta_days_min;
        }
        if (free_above !== undefined) {
          _payload[`free_above`] = free_above;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (matrix_attribute !== undefined) {
          _payload[`matrix_attribute`] = matrix_attribute;
        }
        if (matrix_basis !== undefined) {
          _payload[`matrix_basis`] = matrix_basis;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (pricing_type !== undefined) {
          _payload[`pricing_type`] = pricing_type;
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
shipping
  .command(`shipping-tiers-list`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .action(
    actionRunner(
      async ({ method_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, method_id);
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
shipping
  .command(`shipping-tiers-create`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .option(`--from-_value <from-_value>`, `Tier threshold (default 0) — the tier with the highest from_value at or below the measured value wins.`, parseInteger)
  .option(`--position <position>`, `Sort order (default 0; bulk replace derives it from the array index).`, parseInteger)
  .option(`--price <price>`, `Price of this tier (default 0).`, parseInteger)
  .action(
    actionRunner(
      async ({ method_id, from_value, position, price }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, method_id);
        const _payload: RequestParams = {};
        if (from_value !== undefined) {
          _payload[`from_value`] = from_value;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
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
shipping
  .command(`shipping-tiers-replace`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .requiredOption(`--tiers [tiers...]`, `The complete new tier set (set semantics) — positions are derived from the array order.`)
  .action(
    actionRunner(
      async ({ method_id, tiers }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers`.replace(`{method_id}`, method_id);
        const _payload: RequestParams = {};
        if (tiers !== undefined) {
          _payload[`tiers`] = tiers;
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
shipping
  .command(`shipping-tiers-delete`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ method_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, method_id).replace(`{id}`, id);
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
shipping
  .command(`shipping-tiers-get`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ method_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, method_id).replace(`{id}`, id);
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
shipping
  .command(`shipping-tiers-update`)
  .description(``)
  .requiredOption(`--method-_id <method-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .option(`--from-_value <from-_value>`, `Tier threshold (default 0) — the tier with the highest from_value at or below the measured value wins.`, parseInteger)
  .option(`--position <position>`, `Sort order (default 0; bulk replace derives it from the array index).`, parseInteger)
  .option(`--price <price>`, `Price of this tier (default 0).`, parseInteger)
  .action(
    actionRunner(
      async ({ method_id, id, from_value, position, price }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/methods/{method_id}/tiers/{id}`.replace(`{method_id}`, method_id).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (from_value !== undefined) {
          _payload[`from_value`] = from_value;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
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
shipping
  .command(`shipping-rates`)
  .description(``)
  .option(`--attributes <attributes>`, `Measure values for attribute matrices, keyed by attribute name.`)
  .option(`--country <country>`, `Destination ISO 3166-1 alpha-2 code — checked against method country restrictions.`)
  .option(`--currency <currency>`, `Echoed into the rates (default 'EUR').`)
  .option(`--order-_value <order-_value>`, `Order value (default 0) — drives free-above thresholds and order_value matrices.`, parseInteger)
  .option(`--quantity <quantity>`, `Total quantity — measure for quantity matrices.`, parseInteger)
  .option(`--weight <weight>`, `Total weight — measure for weight matrices.`, parseInteger)
  .action(
    actionRunner(
      async ({ attributes, country, currency, order_value, quantity, weight }) => {
        const _client = await sdkForProject();
        const _apiPath = `/shipping/rates`;
        const _payload: RequestParams = {};
        if (attributes !== undefined) {
          _payload[`attributes`] = JSON.parse(attributes);
        }
        if (country !== undefined) {
          _payload[`country`] = country;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (order_value !== undefined) {
          _payload[`order_value`] = order_value;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (weight !== undefined) {
          _payload[`weight`] = weight;
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
