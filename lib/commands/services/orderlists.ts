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

export const orderlists = new Command("orderlists")
  .description(
    commandDescriptions["orderlists"] ??
      `Manage orderlists resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

orderlists
  .command(`list`)
  .description(`List the caller's own lists plus the organization's public lists (filters: owner_id, organization_id, kind)`)
  .option(`--owner-_id <owner-_id>`, `Filter to one owning contact.`)
  .option(`--organization-_id <organization-_id>`, `Filter to one organization.`)
  .option(`--kind <kind>`, `Filter by list kind (shopping | label).`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ owner_id, organization_id, kind, limit, offset, order }) => {
        const _client = await sdkForProject();
        const _apiPath = `/orderlists`;
        const _payload: RequestParams = {};
        if (owner_id !== undefined) {
          _payload[`owner_id`] = owner_id;
        }
        if (organization_id !== undefined) {
          _payload[`organization_id`] = organization_id;
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
  .command(`create`)
  .description(`Create an order list, optionally pre-filled with positions`)
  .option(`--name <name>`, ``)
  .option(`--owner-_id <owner-_id>`, `Owning contact.`)
  .option(`--owner-_name <owner-_name>`, `Owner display name (snapshot).`)
  .option(`--items [items...]`, `Optional initial positions.`)
  .option(`--kind <kind>`, `List kind (default 'shopping').`)
  .option(`--metadata <metadata>`, ``)
  .option(`--organization-_id <organization-_id>`, `Owning organization (scopes public sharing).`)
  .option(
    `--shared [value]`,
    `Shared read-only across the organization (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, owner_id, owner_name, items, kind, metadata, organization_id, shared } = await promptForMissing(
          _options,
          [
            { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
            { key: "owner_id", option: "--owner-_id <owner-_id>", name: "owner_id", description: "Owning contact.", type: "string", required: true },
            { key: "owner_name", option: "--owner-_name <owner-_name>", name: "owner_name", description: "Owner display name (snapshot).", type: "string", required: true },
          ],
          _command,
        );
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
orderlists
  .command(`defaults`)
  .description(`No-op lifecycle seed (Order Lists has no seed data)`)
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
  .command(`delete`)
  .description(`Delete an order list including its positions`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
          ],
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
orderlists
  .command(`get`)
  .description(`Read one order list with its positions`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
          ],
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
orderlists
  .command(`update`)
  .description(`Rename a list, change its visibility or kind`)
  .option(`--id <id>`, ``)
  .option(`--kind <kind>`, `List kind (default 'shopping').`)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, ``)
  .option(
    `--shared [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, kind, metadata, name, shared } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
          ],
          _command,
        );
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
orderlists
  .command(`items-list`)
  .description(`List the positions of an order list`)
  .option(`--list-_id <list-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { list_id } = await promptForMissing(
          _options,
          [
            { key: "list_id", option: "--list-_id <list-_id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
          ],
          _command,
        );
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
  .command(`items-create`)
  .description(`Add a position to an order list`)
  .option(`--list-_id <list-_id>`, ``)
  .option(`--name <name>`, `Display name (snapshot).`)
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
      async (_options, _command) => {
        const { list_id, name, category_slug, cost_center_id, custom_sku, image, metadata, position, position_texts, price, product_id, quantity, sku, subcategory_slug, tax_rate, unit } = await promptForMissing(
          _options,
          [
            { key: "list_id", option: "--list-_id <list-_id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
            { key: "name", option: "--name <name>", name: "name", description: "Display name (snapshot).", type: "string", required: true },
          ],
          _command,
        );
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
  .command(`items-replace`)
  .description(`Replace all positions of an order list (set semantics)`)
  .option(`--list-_id <list-_id>`, ``)
  .option(`--items [items...]`, `The new full set of positions.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { list_id, items } = await promptForMissing(
          _options,
          [
            { key: "list_id", option: "--list-_id <list-_id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
            { key: "items", option: "--items [items...]", name: "items", description: "The new full set of positions.", type: "array", required: true },
          ],
          _command,
        );
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
  .command(`items-delete`)
  .description(`Remove a position from an order list`)
  .option(`--list-_id <list-_id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { list_id, id } = await promptForMissing(
          _options,
          [
            { key: "list_id", option: "--list-_id <list-_id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: false } },
          ],
          _command,
        );
        await confirmDestructive(`orderlists items-delete`);
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
  .command(`items-get`)
  .description(`Read one position`)
  .option(`--list-_id <list-_id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { list_id, id } = await promptForMissing(
          _options,
          [
            { key: "list_id", option: "--list-_id <list-_id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: false } },
          ],
          _command,
        );
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
  .command(`items-update`)
  .description(`Update a position`)
  .option(`--list-_id <list-_id>`, ``)
  .option(`--id <id>`, ``)
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
      async (_options, _command) => {
        const { list_id, id, category_slug, cost_center_id, custom_sku, image, metadata, name, position, position_texts, price, product_id, quantity, sku, subcategory_slug, tax_rate, unit } = await promptForMissing(
          _options,
          [
            { key: "list_id", option: "--list-_id <list-_id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: false } },
          ],
          _command,
        );
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
