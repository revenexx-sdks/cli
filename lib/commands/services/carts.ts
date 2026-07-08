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
import {
  confirmDestructive,
  promptForMissing,
} from "../../interactive.js";

export const carts = new Command("carts")
  .description(
    commandDescriptions["carts"] ??
      `Manage carts resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

carts
  .command(`list`)
  .description(`List carts (filter by contact_id/session_key/status; paginate limit/offset/order)`)
  .option(`--contact-_id <contact-_id>`, `Filter to one owning contact.`)
  .option(`--session-_key <session-_key>`, `Filter to one guest session.`)
  .option(`--status <status>`, `Filter by cart status (e.g. active).`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ contact_id, session_key, status, limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts`;
        const _payload: RequestParams = {};
        if (contact_id !== undefined) {
          _payload[`contact_id`] = contact_id;
        }
        if (session_key !== undefined) {
          _payload[`session_key`] = session_key;
        }
        if (status !== undefined) {
          _payload[`status`] = status;
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
  .command(`create`)
  .description(`Create a cart — owner is contact_id (customer) or session_key (guest)`)
  .option(`--channel-_id <channel-_id>`, ``)
  .option(`--contact-_id <contact-_id>`, `Owning customer contact.`)
  .option(`--currency <currency>`, `ISO 4217 code (default EUR).`)
  .option(
    `--is-_current [value]`,
    `Make this THE current cart of its owner.`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, `Display name (default 'Cart').`)
  .option(`--session-_key <session-_key>`, `Owning guest session.`)
  .action(
    actionRunner(
      async ({ channel_id, contact_id, currency, is_current, metadata, name, session_key }) => {
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
  .command(`claim`)
  .description(`Hand session carts to a contact on login — adopt as customer carts or merge into a target cart`)
  .option(`--contact-_id <contact-_id>`, `Contact taking ownership.`)
  .option(`--session-_key <session-_key>`, `Guest session whose active carts are handed over.`)
  .option(`--target-_cart-_id <target-_cart-_id>`, `Merge the session carts into this cart instead of adopting them.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { contact_id, session_key, target_cart_id } = await promptForMissing(
          _options,
          [
            { key: "contact_id", option: "--contact-_id <contact-_id>", name: "contact_id", description: "Contact taking ownership.", type: "string", required: true },
            { key: "session_key", option: "--session-_key <session-_key>", name: "session_key", description: "Guest session whose active carts are handed over.", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`import`)
  .description(`Import a cart through an import profile — into a new cart (owner required) or an existing target cart`)
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
  .command(`io-profiles-list`)
  .description(`List import/export profiles (paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/carts/io/profiles`;
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
carts
  .command(`io-profiles-create`)
  .description(`Create an import/export profile (Baseline-IO-compatible shape)`)
  .option(`--direction <direction>`, ``)
  .option(`--name <name>`, ``)
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
      async (_options, _command) => {
        const { direction, name, apply_mode, entity, format, is_template, mapping, options } = await promptForMissing(
          _options,
          [
            { key: "direction", option: "--direction <direction>", name: "direction", type: "string", required: true, enum: ["import","export"] },
            { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`io-profiles-defaults`)
  .description(`Ensure the bundled profile templates exist (idempotent) — also runs on app.installed`)
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
  .command(`io-profiles-delete`)
  .description(`Delete an import/export profile`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/io/profiles", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`carts io-profiles-delete`);
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
  .command(`io-profiles-get`)
  .description(`Read one import/export profile`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/io/profiles", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`io-profiles-update`)
  .description(`Update an import/export profile`)
  .option(`--id <id>`, ``)
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
      async (_options, _command) => {
        const { id, apply_mode, direction, entity, format, is_template, mapping, name, options } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/io/profiles", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`merge`)
  .description(`Merge the source cart into the target cart (product lines merge by product+price; source becomes status merged)`)
  .option(`--source-_cart-_id <source-_cart-_id>`, `Cart whose lines move into the target (becomes status merged).`)
  .option(`--target-_cart-_id <target-_cart-_id>`, `Receiving cart (must be active).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { source_cart_id, target_cart_id } = await promptForMissing(
          _options,
          [
            { key: "source_cart_id", option: "--source-_cart-_id <source-_cart-_id>", name: "source_cart_id", description: "Cart whose lines move into the target (becomes status merged).", type: "string", required: true },
            { key: "target_cart_id", option: "--target-_cart-_id <target-_cart-_id>", name: "target_cart_id", description: "Receiving cart (must be active).", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`items-list`)
  .description(`List the items of a cart (position order)`)
  .option(`--cart-_id <cart-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cart_id } = await promptForMissing(
          _options,
          [
            { key: "cart_id", option: "--cart-_id <cart-_id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`items-create`)
  .description(`Add an item — plain product lines merge by product+price, configurations always stand alone`)
  .option(`--cart-_id <cart-_id>`, ``)
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
      async (_options, _command) => {
        const { cart_id, configuration, currency, metadata, name, position, product_id, quantity, sku, snapshot, tax_rate, type, unit, unit_price } = await promptForMissing(
          _options,
          [
            { key: "cart_id", option: "--cart-_id <cart-_id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`items-replace`)
  .description(`Replace ALL items of a cart (set semantics — the storefront sync)`)
  .option(`--cart-_id <cart-_id>`, ``)
  .option(`--items [items...]`, `The complete new item set (set semantics).`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cart_id, items } = await promptForMissing(
          _options,
          [
            { key: "cart_id", option: "--cart-_id <cart-_id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
            { key: "items", option: "--items [items...]", name: "items", description: "The complete new item set (set semantics).", type: "array", required: true },
          ],
          _command,
        );
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
  .command(`items-delete`)
  .description(`Remove an item from a cart`)
  .option(`--cart-_id <cart-_id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cart_id, id } = await promptForMissing(
          _options,
          [
            { key: "cart_id", option: "--cart-_id <cart-_id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/{cart_id}/items", hasLimit: false } },
          ],
          _command,
        );
        await confirmDestructive(`carts items-delete`);
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
  .command(`items-get`)
  .description(`Read one cart item`)
  .option(`--cart-_id <cart-_id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { cart_id, id } = await promptForMissing(
          _options,
          [
            { key: "cart_id", option: "--cart-_id <cart-_id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/{cart_id}/items", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`items-update`)
  .description(`Update a cart item (quantity, price, configuration, …) — line_total is derived`)
  .option(`--cart-_id <cart-_id>`, ``)
  .option(`--id <id>`, ``)
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
      async (_options, _command) => {
        const { cart_id, id, configuration, currency, metadata, name, position, product_id, quantity, sku, snapshot, tax_rate, type, unit, unit_price } = await promptForMissing(
          _options,
          [
            { key: "cart_id", option: "--cart-_id <cart-_id>", name: "cart_id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts/{cart_id}/items", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`delete`)
  .description(`Delete a cart including its items`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
          ],
          _command,
        );
        await confirmDestructive(`carts delete`);
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
  .command(`get`)
  .description(`Read one cart by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`update`)
  .description(`Update a cart (name, currency, market/channel, metadata) — status moves through the lifecycle routes`)
  .option(`--id <id>`, ``)
  .option(`--channel-_id <channel-_id>`, ``)
  .option(`--currency <currency>`, `ISO 4217 code.`)
  .option(`--metadata <metadata>`, `Free-form metadata.`)
  .option(`--name <name>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, channel_id, currency, metadata, name } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/carts/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (channel_id !== undefined) {
          _payload[`channel_id`] = channel_id;
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
  .command(`abandon`)
  .description(`Abandon an active cart (analytics: abandonment funnel)`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`activate`)
  .description(`Mark a cart as THE current cart of its owner (one per owner)`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`export`)
  .description(`Export a cart through an export profile (or ad-hoc json/csv)`)
  .option(`--id <id>`, ``)
  .option(`--format <format>`, `Ad-hoc export format (only without profile_id).`)
  .option(`--profile-_id <profile-_id>`, `Export profile to run; ad-hoc JSON/CSV export when omitted.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, format, profile_id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`order`)
  .description(`Mark an active cart as ordered (+order_ref) — the order-management hand-over`)
  .option(`--id <id>`, ``)
  .option(`--order-_ref <order-_ref>`, `External order reference from order management.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, order_ref } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`reopen`)
  .description(`Reopen an abandoned cart`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/carts", hasLimit: true } },
          ],
          _command,
        );
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
