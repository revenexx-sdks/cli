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

export const orderlists = new Command("orderlists")
  .description(
    commandDescriptions["orderlists"] ??
      `Manage orderlists resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Filter to one owning contact.", type: "string", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Filter to one organization.", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "Filter by list kind (shopping | label).", type: "string", required: false },
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orderlists
  .command(`list`)
  .description(`List the caller's own lists plus the organization's public lists (filters: owner_id, organization_id, kind)`)
  .option(`--owner-id <owner-id>`, `Filter to one owning contact.`)
  .option(`--organization-id <organization-id>`, `Filter to one organization.`)
  .option(`--kind <kind>`, `Filter by list kind (shopping | label).`)
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
        const { ownerId, organizationId, kind, limit, offset, order, filter } = await promptForMissing(
          _options,
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists`;
        const _payload: RequestParams = {};
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (organizationId !== undefined) {
          _payload[`organization_id`] = organizationId;
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
registerPromptSpecs(orderlists.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "name", option: "--name <name>", name: "name", type: "string", required: true },
  { key: "ownerId", option: "--owner-id <owner-id>", name: "owner_id", description: "Owning contact.", type: "string", required: true },
  { key: "ownerName", option: "--owner-name <owner-name>", name: "owner_name", description: "Owner display name (snapshot).", type: "string", required: true },
  { key: "items", option: "--items [items...]", name: "items", description: "Optional initial positions.", type: "array", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "List kind (default 'shopping').", type: "string", required: false, enum: ["shopping","label"] },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "organizationId", option: "--organization-id <organization-id>", name: "organization_id", description: "Owning organization (scopes public sharing).", type: "string", required: false },
  { key: "shared", option: "--shared <shared>", name: "shared", description: "Shared read-only across the organization (default false).", type: "boolean", required: false },
];
orderlists
  .command(`create`)
  .description(`Create an order list, optionally pre-filled with positions`)
  .option(`--name <name>`, ``)
  .option(`--owner-id <owner-id>`, `Owning contact.`)
  .option(`--owner-name <owner-name>`, `Owner display name (snapshot).`)
  .option(`--items [items...]`, `Optional initial positions.`)
  .option(`--kind <kind>`, `List kind (default 'shopping').`)
  .option(`--metadata <metadata>`, ``)
  .option(`--organization-id <organization-id>`, `Owning organization (scopes public sharing).`)
  .option(
    `--shared [value]`,
    `Shared read-only across the organization (default false).`,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { name, ownerId, ownerName, items, kind, metadata, organizationId, shared } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (items !== undefined) {
          _payload[`items`] = items;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
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
        if (ownerId !== undefined) {
          _payload[`owner_id`] = ownerId;
        }
        if (ownerName !== undefined) {
          _payload[`owner_name`] = ownerName;
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
registerPromptSpecs(orderlists.commands.at(-1)!, createSpecs, { method: "post" });
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
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
];
orderlists
  .command(`delete`)
  .description(`Delete an order list including its positions`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
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
registerPromptSpecs(orderlists.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
];
orderlists
  .command(`get`)
  .description(`Read one order list with its positions`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          getSpecs,
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
registerPromptSpecs(orderlists.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "kind", option: "--kind <kind>", name: "kind", description: "List kind (default 'shopping').", type: "string", required: false, enum: ["shopping","label"] },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", type: "string", required: false },
  { key: "shared", option: "--shared <shared>", name: "shared", type: "boolean", required: false },
];
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
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
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
registerPromptSpecs(orderlists.commands.at(-1)!, updateSpecs, { method: "put" });
const itemsListSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
orderlists
  .command(`items-list`)
  .description(`List the positions of an order list`)
  .option(`--list-id <list-id>`, ``)
  .option(
    `--filter <column=value>`,
    `Filter rows by column equality (repeatable).`,
    (value: string, previous: string[]) => [...previous, value],
    [] as string[],
  )
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, filter } = await promptForMissing(
          _options,
          itemsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, listId);
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsListSpecs, { method: "get" });
const itemsCreateSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "name", option: "--name <name>", name: "name", description: "Display name (snapshot).", type: "string", required: true },
  { key: "categorySlug", option: "--category-slug <category-slug>", name: "category_slug", type: "string", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", description: "Cost center reference (free-text).", type: "string", required: false },
  { key: "customSku", option: "--custom-sku <custom-sku>", name: "custom_sku", description: "Customer's own article number.", type: "string", required: false },
  { key: "image", option: "--image <image>", name: "image", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order (assigned automatically when omitted).", type: "integer", required: false },
  { key: "positionTexts", option: "--position-texts [position-texts...]", name: "position_texts", description: "Per-position notes.", type: "array", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Unit price snapshot.", type: "number", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Catalog product (alternative to sku).", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Default 1.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Article SKU (alternative to product_id).", type: "string", required: false },
  { key: "subcategorySlug", option: "--subcategory-slug <subcategory-slug>", name: "subcategory_slug", type: "string", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
];
orderlists
  .command(`items-create`)
  .description(`Add a position to an order list`)
  .option(`--list-id <list-id>`, ``)
  .option(`--name <name>`, `Display name (snapshot).`)
  .option(`--category-slug <category-slug>`, ``)
  .option(`--cost-center-id <cost-center-id>`, `Cost center reference (free-text).`)
  .option(`--custom-sku <custom-sku>`, `Customer's own article number.`)
  .option(`--image <image>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--position <position>`, `Sort order (assigned automatically when omitted).`, parseInteger)
  .option(`--position-texts [position-texts...]`, `Per-position notes.`)
  .option(`--price <price>`, `Unit price snapshot.`, parseInteger)
  .option(`--product-id <product-id>`, `Catalog product (alternative to sku).`)
  .option(`--quantity <quantity>`, `Default 1.`, parseInteger)
  .option(`--sku <sku>`, `Article SKU (alternative to product_id).`)
  .option(`--subcategory-slug <subcategory-slug>`, ``)
  .option(`--tax-rate <tax-rate>`, ``, parseInteger)
  .option(`--unit <unit>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, name, categorySlug, costCenterId, customSku, image, metadata, position, positionTexts, price, productId, quantity, sku, subcategorySlug, taxRate, unit } = await promptForMissing(
          _options,
          itemsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (categorySlug !== undefined) {
          _payload[`category_slug`] = categorySlug;
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (customSku !== undefined) {
          _payload[`custom_sku`] = customSku;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (positionTexts !== undefined) {
          _payload[`position_texts`] = positionTexts;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (subcategorySlug !== undefined) {
          _payload[`subcategory_slug`] = subcategorySlug;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsCreateSpecs, { method: "post" });
const itemsReplaceSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "items", option: "--items [items...]", name: "items", description: "The new full set of positions.", type: "array", required: true },
];
orderlists
  .command(`items-replace`)
  .description(`Replace all positions of an order list (set semantics)`)
  .option(`--list-id <list-id>`, ``)
  .option(`--items [items...]`, `The new full set of positions.`)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, items } = await promptForMissing(
          _options,
          itemsReplaceSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items`.replace(`{list_id}`, listId);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsReplaceSpecs, { method: "put" });
const itemsDeleteSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: false } },
];
orderlists
  .command(`items-delete`)
  .description(`Remove a position from an order list`)
  .option(`--list-id <list-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id } = await promptForMissing(
          _options,
          itemsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`orderlists items-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsDeleteSpecs, { method: "delete", destructive: true });
const itemsGetSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: false } },
];
orderlists
  .command(`items-get`)
  .description(`Read one position`)
  .option(`--list-id <list-id>`, ``)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id } = await promptForMissing(
          _options,
          itemsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsGetSpecs, { method: "get" });
const itemsUpdateSpecs: PromptSpec[] = [
  { key: "listId", option: "--list-id <list-id>", name: "list_id", type: "string", required: true, resource: { listPath: "/orderlists", hasLimit: true } },
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/orderlists/{list_id}/items", hasLimit: false } },
  { key: "categorySlug", option: "--category-slug <category-slug>", name: "category_slug", type: "string", required: false },
  { key: "costCenterId", option: "--cost-center-id <cost-center-id>", name: "cost_center_id", description: "Cost center reference (free-text).", type: "string", required: false },
  { key: "customSku", option: "--custom-sku <custom-sku>", name: "custom_sku", description: "Customer's own article number.", type: "string", required: false },
  { key: "image", option: "--image <image>", name: "image", type: "string", required: false },
  { key: "metadata", option: "--metadata <metadata>", name: "metadata", type: "object", required: false },
  { key: "name", option: "--name <name>", name: "name", description: "Display name (snapshot).", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", description: "Sort order (assigned automatically when omitted).", type: "integer", required: false },
  { key: "positionTexts", option: "--position-texts [position-texts...]", name: "position_texts", description: "Per-position notes.", type: "array", required: false },
  { key: "price", option: "--price <price>", name: "price", description: "Unit price snapshot.", type: "number", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", description: "Catalog product (alternative to sku).", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", description: "Default 1.", type: "number", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", description: "Article SKU (alternative to product_id).", type: "string", required: false },
  { key: "subcategorySlug", option: "--subcategory-slug <subcategory-slug>", name: "subcategory_slug", type: "string", required: false },
  { key: "taxRate", option: "--tax-rate <tax-rate>", name: "tax_rate", type: "number", required: false },
  { key: "unit", option: "--unit <unit>", name: "unit", type: "string", required: false },
];
orderlists
  .command(`items-update`)
  .description(`Update a position`)
  .option(`--list-id <list-id>`, ``)
  .option(`--id <id>`, ``)
  .option(`--category-slug <category-slug>`, ``)
  .option(`--cost-center-id <cost-center-id>`, `Cost center reference (free-text).`)
  .option(`--custom-sku <custom-sku>`, `Customer's own article number.`)
  .option(`--image <image>`, ``)
  .option(`--metadata <metadata>`, ``)
  .option(`--name <name>`, `Display name (snapshot).`)
  .option(`--position <position>`, `Sort order (assigned automatically when omitted).`, parseInteger)
  .option(`--position-texts [position-texts...]`, `Per-position notes.`)
  .option(`--price <price>`, `Unit price snapshot.`, parseInteger)
  .option(`--product-id <product-id>`, `Catalog product (alternative to sku).`)
  .option(`--quantity <quantity>`, `Default 1.`, parseInteger)
  .option(`--sku <sku>`, `Article SKU (alternative to product_id).`)
  .option(`--subcategory-slug <subcategory-slug>`, ``)
  .option(`--tax-rate <tax-rate>`, ``, parseInteger)
  .option(`--unit <unit>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { listId, id, categorySlug, costCenterId, customSku, image, metadata, name, position, positionTexts, price, productId, quantity, sku, subcategorySlug, taxRate, unit } = await promptForMissing(
          _options,
          itemsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/orderlists/{list_id}/items/{id}`.replace(`{list_id}`, listId).replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (categorySlug !== undefined) {
          _payload[`category_slug`] = categorySlug;
        }
        if (costCenterId !== undefined) {
          _payload[`cost_center_id`] = costCenterId;
        }
        if (customSku !== undefined) {
          _payload[`custom_sku`] = customSku;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (metadata !== undefined) {
          _payload[`metadata`] = resolveBodyParam(metadata);
        }
        if (name !== undefined) {
          _payload[`name`] = name;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (positionTexts !== undefined) {
          _payload[`position_texts`] = positionTexts;
        }
        if (price !== undefined) {
          _payload[`price`] = price;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (subcategorySlug !== undefined) {
          _payload[`subcategory_slug`] = subcategorySlug;
        }
        if (taxRate !== undefined) {
          _payload[`tax_rate`] = taxRate;
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
registerPromptSpecs(orderlists.commands.at(-1)!, itemsUpdateSpecs, { method: "put" });
