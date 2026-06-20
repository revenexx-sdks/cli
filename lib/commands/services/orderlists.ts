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

export const orderlists = new Command("orderlists")
  .description(commandDescriptions["orderlists"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

orderlists
  .command(`orderlists-list`)
  .description(``)
  .action(
    actionRunner(
      async () => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists`;
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
orderlists
  .command(`orderlists-create`)
  .description(``)
  .requiredOption(`--name <name>`, ``)
  .requiredOption(`--owner-_id <owner-_id>`, `Owning contact.`)
  .requiredOption(`--owner-_name <owner-_name>`, `Owner display name (snapshot).`)
  .option(`--items [items...]`, `Optional initial positions.`)
  .option(`--kind <kind>`, `List kind (default 'shopping').`)
  .option(`--metadata <metadata>`, ``)
  .option(`--organization-_id <organization-_id>`, `Owning organization (scopes public sharing).`)
  .option(
    `--public [value]`,
    `Shared read-only across the organization (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ name, owner_id, owner_name, items, kind, metadata, organization_id, public }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists`;
        const _payload: RequestParams = {};
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
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
        if (owner_id !== undefined) {
          _payload[`owner_id`] = owner_id;
        }
        if (owner_name !== undefined) {
          _payload[`owner_name`] = owner_name;
        }
        if (public !== undefined) {
          _payload[`public`] = public;
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
orderlists
  .command(`orderlists-defaults`)
  .description(``)
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
orderlists
  .command(`orderlists-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
orderlists
  .command(`orderlists-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
orderlists
  .command(`orderlists-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--kind <kind>`, `List kind (default 'shopping').`)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, ``)
  .option(
    `--public [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async ({ id, kind, metadata, name, public }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = JSON.parse(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (public !== undefined) {
          _payload[`public`] = public;
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
orderlists
  .command(`orderlists-items-list`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .action(
    actionRunner(
      async ({ list_id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, list_id);
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
orderlists
  .command(`orderlists-items-create`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--name <name>`, `Display name (snapshot).`)
  .option(`--category-_slug <category-_slug>`, ``)
  .option(`--cost-_center-_id <cost-_center-_id>`, `Cost center reference (free-text).`)
  .option(`--custom-_sku <custom-_sku>`, `Customer's own article number.`)
  .option(`--image <image>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--position <position>`, `Sort order (assigned automatically when omitted).`, parseInteger)
  .option(`--position-_texts [position-_texts...]`, `Per-position notes.`)
  .option(`--price <price>`, `Unit price snapshot.`, parseInteger)
  .option(`--product-_id <product-_id>`, `Catalog product (alternative to sku).`)
  .option(`--quantity <quantity>`, `Default 1.`, parseInteger)
  .option(`--sku <sku>`, `Article SKU (alternative to product_id).`)
  .option(`--subcategory-_slug <subcategory-_slug>`, ``)
  .option(`--tax-_rate <tax-_rate>`, ``, parseInteger)
  .option(`--unit <unit>`, ``)
  .action(
    actionRunner(
      async ({ list_id, name, category_slug, cost_center_id, custom_sku, image, metadata, position, position_texts, price, product_id, quantity, sku, subcategory_slug, tax_rate, unit }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, list_id);
        const _payload: RequestParams = {};
        if (category_slug !== undefined) {
          _payload[`category_slug`] = category_slug;
        }
        if (cost_center_id !== undefined) {
          _payload[`cost_center_id`] = cost_center_id;
        }
        if (custom_sku !== undefined) {
          _payload[`custom_sku`] = custom_sku;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
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
        if (position_texts !== undefined) {
          _payload[`position_texts`] = position_texts;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
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
        if (subcategory_slug !== undefined) {
          _payload[`subcategory_slug`] = subcategory_slug;
        }
        if (tax_rate !== undefined) {
          _payload[`tax_rate`] = tax_rate;
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
orderlists
  .command(`orderlists-items-replace`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--items [items...]`, `The new full set of positions.`)
  .action(
    actionRunner(
      async ({ list_id, items }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, list_id);
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
orderlists
  .command(`orderlists-items-delete`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ list_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, list_id).replace(`{id}`, id);
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
orderlists
  .command(`orderlists-items-get`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ list_id, id }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, list_id).replace(`{id}`, id);
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
orderlists
  .command(`orderlists-items-update`)
  .description(``)
  .requiredOption(`--list-_id <list-_id>`, ``)
  .requiredOption(`--id <id>`, ``)
  .option(`--category-_slug <category-_slug>`, ``)
  .option(`--cost-_center-_id <cost-_center-_id>`, `Cost center reference (free-text).`)
  .option(`--custom-_sku <custom-_sku>`, `Customer's own article number.`)
  .option(`--image <image>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, `Display name (snapshot).`)
  .option(`--position <position>`, `Sort order (assigned automatically when omitted).`, parseInteger)
  .option(`--position-_texts [position-_texts...]`, `Per-position notes.`)
  .option(`--price <price>`, `Unit price snapshot.`, parseInteger)
  .option(`--product-_id <product-_id>`, `Catalog product (alternative to sku).`)
  .option(`--quantity <quantity>`, `Default 1.`, parseInteger)
  .option(`--sku <sku>`, `Article SKU (alternative to product_id).`)
  .option(`--subcategory-_slug <subcategory-_slug>`, ``)
  .option(`--tax-_rate <tax-_rate>`, ``, parseInteger)
  .option(`--unit <unit>`, ``)
  .action(
    actionRunner(
      async ({ list_id, id, category_slug, cost_center_id, custom_sku, image, metadata, name, position, position_texts, price, product_id, quantity, sku, subcategory_slug, tax_rate, unit }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, list_id).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (category_slug !== undefined) {
          _payload[`category_slug`] = category_slug;
        }
        if (cost_center_id !== undefined) {
          _payload[`cost_center_id`] = cost_center_id;
        }
        if (custom_sku !== undefined) {
          _payload[`custom_sku`] = custom_sku;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
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
        if (position_texts !== undefined) {
          _payload[`position_texts`] = position_texts;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
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
        if (subcategory_slug !== undefined) {
          _payload[`subcategory_slug`] = subcategory_slug;
        }
        if (tax_rate !== undefined) {
          _payload[`tax_rate`] = tax_rate;
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
