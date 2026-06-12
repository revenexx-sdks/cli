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

export const carts = new Command("carts")
  .description(commandDescriptions["carts"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

carts
  .command(`carts-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/carts`;
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
carts
  .command(`carts-create`)
  .description(``)
  .option(`--channel-_id <channel-_id>`, ``)
  .option(`--contact-_id <contact-_id>`, `Owning customer contact.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(
    `--is-_current [value]`,
    `Make this THE current cart of its owner.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--market-_id <market-_id>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Display name (default 'Cart').`)
  .option(`--session-_key <session-_key>`, `Owning guest session.`)
  .action(
    actionRunner(
      async ({ channel_id, contact_id, currency, is_current, market_id, metadata, name, session_key }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts`;
        const _payload: RequestParams = {};
        if (channel_id !== undefined) {
          _payload[`channel_id`] = channel_id;
        }
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (is_current !== undefined) {
          _payload[`is_current`] = is_current;
        }
        if (market_id !== undefined) {
          _payload[`market_id`] = market_id;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (session_key !== undefined) {
          _payload[`session_key`] = session_key;
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
carts
  .command(`carts-claim`)
  .description(``)
  .requiredOption(`--contact-_id <contact-_id>`, `Contact taking ownership.`)
  .requiredOption(`--session-_key <session-_key>`, `Guest session whose active carts are handed over.`)
  .option(`--target-_cart-_id <target-_cart-_id>`, `Merge the session carts into this cart instead of adopting them.`)
  .action(
    actionRunner(
      async ({ contact_id, session_key, target_cart_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/claim`;
        const _payload: RequestParams = {};
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (session_key !== undefined) {
          _payload[`session_key`] = session_key;
        }
        if (target_cart_id !== undefined) {
          _payload[`target_cart_id`] = target_cart_id;
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
carts
  .command(`carts-import`)
  .description(``)
  .option(`--contact-_id <contact-_id>`, `Owner of a newly created cart.`)
  .option(`--csv <csv>`, `Raw CSV content (alternative to payload for csv profiles).`)
  .option(`--name <name>`, `Name for a newly created cart.`)
  .option(`--payload <payload>`, `The import payload: '{cart, items}' object, or a raw JSON/CSV string in the profile's format.`)
  .option(`--profile-_id <profile-_id>`, `Import profile to run; ad-hoc import when omitted.`)
  .option(`--session-_key <session-_key>`, `Guest owner of a newly created cart.`)
  .option(`--target-_cart-_id <target-_cart-_id>`, `Existing active cart to import into.`)
  .action(
    actionRunner(
      async ({ contact_id, csv, name, payload, profile_id, session_key, target_cart_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/import`;
        const _payload: RequestParams = {};
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (csv !== undefined) {
          _payload[`csv`] = csv;
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (payload !== undefined) {
          _payload[`payload`] = JSON.parse(payload);
        }
        if (profile_id !== undefined) {
          _payload[`profile_id`] = profile_id;
        }
        if (session_key !== undefined) {
          _payload[`session_key`] = session_key;
        }
        if (target_cart_id !== undefined) {
          _payload[`target_cart_id`] = target_cart_id;
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
carts
  .command(`carts-io-profiles-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles`;
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
carts
  .command(`carts-io-profiles-create`)
  .description(``)
  .requiredOption(`--direction <direction>`, ``)
  .requiredOption(`--name <name>`, ``)
  .option(`--apply-_mode <apply-_mode>`, `Default 'insert'.`)
  .option(`--entity <entity>`, `Default 'carts'.`)
  .option(`--format <format>`, `Default 'json'.`)
  .option(
    `--is-_template [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--mapping <mapping>`, `Column mapping (Baseline-IO-compatible).`)
  .option(`--options <options>`, ``)
  .action(
    actionRunner(
      async ({ direction, name, apply_mode, entity, format, is_template, mapping, options }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles`;
        const _payload: RequestParams = {};
        if (apply_mode !== undefined) {
          _payload[`apply_mode`] = apply_mode;
        }
        if (direction !== undefined) {
          _payload[`direction`] = direction;
        }
        if (entity !== undefined) {
          _payload[`entity`] = entity;
        }
        if (format !== undefined) {
          _payload[`format`] = format;
        }
        if (is_template !== undefined) {
          _payload[`is_template`] = is_template;
        }
        if (mapping !== undefined) {
          _payload[`mapping`] = JSON.parse(mapping);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (options !== undefined) {
          _payload[`options`] = JSON.parse(options);
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
carts
  .command(`carts-io-profiles-defaults`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles/defaults`;
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
carts
  .command(`carts-io-profiles-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles/{id}`.replace(`{id}`, id);
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
carts
  .command(`carts-io-profiles-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles/{id}`.replace(`{id}`, id);
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
carts
  .command(`carts-io-profiles-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--apply-_mode <apply-_mode>`, `Default 'insert'.`)
  .option(`--direction <direction>`, ``)
  .option(`--entity <entity>`, `Default 'carts'.`)
  .option(`--format <format>`, `Default 'json'.`)
  .option(
    `--is-_template [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--mapping <mapping>`, `Column mapping (Baseline-IO-compatible).`)
  .option(`--name <name>`, ``)
  .option(`--options <options>`, ``)
  .action(
    actionRunner(
      async ({ id, apply_mode, direction, entity, format, is_template, mapping, name, options }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (apply_mode !== undefined) {
          _payload[`apply_mode`] = apply_mode;
        }
        if (direction !== undefined) {
          _payload[`direction`] = direction;
        }
        if (entity !== undefined) {
          _payload[`entity`] = entity;
        }
        if (format !== undefined) {
          _payload[`format`] = format;
        }
        if (is_template !== undefined) {
          _payload[`is_template`] = is_template;
        }
        if (mapping !== undefined) {
          _payload[`mapping`] = JSON.parse(mapping);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (options !== undefined) {
          _payload[`options`] = JSON.parse(options);
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
carts
  .command(`carts-merge`)
  .description(``)
  .requiredOption(`--source-_cart-_id <source-_cart-_id>`, `Cart whose lines move into the target (becomes status merged).`)
  .requiredOption(`--target-_cart-_id <target-_cart-_id>`, `Receiving cart (must be active).`)
  .action(
    actionRunner(
      async ({ source_cart_id, target_cart_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/merge`;
        const _payload: RequestParams = {};
        if (source_cart_id !== undefined) {
          _payload[`source_cart_id`] = source_cart_id;
        }
        if (target_cart_id !== undefined) {
          _payload[`target_cart_id`] = target_cart_id;
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
carts
  .command(`carts-items-list`)
  .description(``)
  .requiredOption(`--cart-_id <cart-_id>`, ``)
  .action(
    actionRunner(
      async ({ cart_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items`.replace(`{cart_id}`, cart_id);
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
carts
  .command(`carts-items-create`)
  .description(``)
  .requiredOption(`--cart-_id <cart-_id>`, ``)
  .option(`--configuration <configuration>`, `Free-form configuration — configured lines never merge.`)
  .option(`--currency <currency>`, `Defaults to the cart's currency.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Falls back to 'sku' when omitted.`)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-_id <product-_id>`, ``)
  .option(`--quantity <quantity>`, `Default 1.`, parseInteger)
  .option(`--sku <sku>`, ``)
  .option(`--snapshot <snapshot>`, `Loose product snapshot at add-time (price, name, image, …).`)
  .option(`--tax-_rate <tax-_rate>`, ``, parseInteger)
  .option(`--type <type>`, `Line type (default 'product'). Plain product lines merge by product+price; configurations always stand alone.`)
  .option(`--unit <unit>`, ``)
  .option(`--unit-_price <unit-_price>`, `Per-unit net price — line_total is always derived.`, parseInteger)
  .action(
    actionRunner(
      async ({ cart_id, configuration, currency, metadata, name, position, product_id, quantity, sku, snapshot, tax_rate, type, unit, unit_price }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items`.replace(`{cart_id}`, cart_id);
        const _payload: RequestParams = {};
        if (configuration !== undefined) {
          _payload[`configuration`] = JSON.parse(configuration);
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
        if (product_id !== undefined) {
          _payload[`product_id`] = product_id;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (snapshot !== undefined) {
          _payload[`snapshot`] = JSON.parse(snapshot);
        }
        if (tax_rate !== undefined) {
          _payload[`tax_rate`] = tax_rate;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unit_price !== undefined) {
          _payload[`unit_price`] = unit_price;
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
carts
  .command(`carts-items-replace`)
  .description(``)
  .requiredOption(`--cart-_id <cart-_id>`, ``)
  .requiredOption(`--items [items...]`, `The complete new item set (set semantics).`)
  .action(
    actionRunner(
      async ({ cart_id, items }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items`.replace(`{cart_id}`, cart_id);
        const _payload: RequestParams = {};
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
carts
  .command(`carts-items-delete`)
  .description(``)
  .requiredOption(`--cart-_id <cart-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ cart_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items/{id}`.replace(`{cart_id}`, cart_id).replace(`{id}`, id);
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
carts
  .command(`carts-items-get`)
  .description(``)
  .requiredOption(`--cart-_id <cart-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ cart_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items/{id}`.replace(`{cart_id}`, cart_id).replace(`{id}`, id);
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
carts
  .command(`carts-items-update`)
  .description(``)
  .requiredOption(`--cart-_id <cart-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .option(`--configuration <configuration>`, `Free-form configuration — configured lines never merge.`)
  .option(`--currency <currency>`, `Defaults to the cart's currency.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Falls back to 'sku' when omitted.`)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-_id <product-_id>`, ``)
  .option(`--quantity <quantity>`, `Default 1.`, parseInteger)
  .option(`--sku <sku>`, ``)
  .option(`--snapshot <snapshot>`, `Loose product snapshot at add-time (price, name, image, …).`)
  .option(`--tax-_rate <tax-_rate>`, ``, parseInteger)
  .option(`--type <type>`, `Line type (default 'product'). Plain product lines merge by product+price; configurations always stand alone.`)
  .option(`--unit <unit>`, ``)
  .option(`--unit-_price <unit-_price>`, `Per-unit net price — line_total is always derived.`, parseInteger)
  .action(
    actionRunner(
      async ({ cart_id, id, configuration, currency, metadata, name, position, product_id, quantity, sku, snapshot, tax_rate, type, unit, unit_price }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{cart_id}/items/{id}`.replace(`{cart_id}`, cart_id).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (configuration !== undefined) {
          _payload[`configuration`] = JSON.parse(configuration);
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
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
        if (product_id !== undefined) {
          _payload[`product_id`] = product_id;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (snapshot !== undefined) {
          _payload[`snapshot`] = JSON.parse(snapshot);
        }
        if (tax_rate !== undefined) {
          _payload[`tax_rate`] = tax_rate;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (unit !== undefined) {
          _payload[`unit`] = unit;
        }
        if (unit_price !== undefined) {
          _payload[`unit_price`] = unit_price;
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
carts
  .command(`carts-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}`.replace(`{id}`, id);
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
carts
  .command(`carts-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}`.replace(`{id}`, id);
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
carts
  .command(`carts-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--channel-_id <channel-_id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code.`)
  .option(`--market-_id <market-_id>`, ``)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, ``)
  .action(
    actionRunner(
      async ({ id, channel_id, currency, market_id, metadata, name }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (channel_id !== undefined) {
          _payload[`channel_id`] = channel_id;
        }
        if (currency !== undefined) {
          _payload[`currency`] = currency;
        }
        if (market_id !== undefined) {
          _payload[`market_id`] = market_id;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
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
carts
  .command(`carts-abandon`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/abandon`.replace(`{id}`, id);
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
carts
  .command(`carts-activate`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/activate`.replace(`{id}`, id);
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
carts
  .command(`carts-export`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--format <format>`, `Ad-hoc export format (only without profile_id).`)
  .option(`--profile-_id <profile-_id>`, `Export profile to run; ad-hoc JSON/CSV export when omitted.`)
  .action(
    actionRunner(
      async ({ id, format, profile_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/export`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (format !== undefined) {
          _payload[`format`] = format;
        }
        if (profile_id !== undefined) {
          _payload[`profile_id`] = profile_id;
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
carts
  .command(`carts-order`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--order-_ref <order-_ref>`, `External order reference from order management.`)
  .action(
    actionRunner(
      async ({ id, order_ref }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/order`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (order_ref !== undefined) {
          _payload[`order_ref`] = order_ref;
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
carts
  .command(`carts-reopen`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}/reopen`.replace(`{id}`, id);
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
