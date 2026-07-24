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

export const products = new Command("products")
  .description(
    commandDescriptions["products"] ??
      `Manage products resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

const listSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`list`)
  .description(`List products (filter by column; paginate limit/offset/order)`)
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
          listSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products`;
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
registerPromptSpecs(products.commands.at(-1)!, listSpecs, { method: "get" });
const createSpecs: PromptSpec[] = [
  { key: "sku", option: "--sku <sku>", name: "sku", type: "string", required: true },
  { key: "attributeValues", option: "--attribute-values <attribute-values>", name: "attribute_values", type: "object", required: false },
  { key: "completeness", option: "--completeness <completeness>", name: "completeness", type: "object", required: false },
  { key: "deletedAt", option: "--deleted-at <deleted-at>", name: "deleted_at", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "familyId", option: "--family-id <family-id>", name: "family_id", type: "string", required: false },
  { key: "familyVariantId", option: "--family-variant-id <family-variant-id>", name: "family_variant_id", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", type: "string", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", type: "string", required: false },
  { key: "quantifiedAssociations", option: "--quantified-associations <quantified-associations>", name: "quantified_associations", type: "object", required: false },
  { key: "taxClass", option: "--tax-class <tax-class>", name: "tax_class", type: "string", required: false },
];
products
  .command(`create`)
  .description(`Create one of products`)
  .option(`--sku <sku>`, ``)
  .option(`--attribute-values <attribute-values>`, ``)
  .option(`--completeness <completeness>`, ``)
  .option(`--deleted-at <deleted-at>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--family-id <family-id>`, ``)
  .option(`--family-variant-id <family-variant-id>`, ``)
  .option(`--kind <kind>`, ``)
  .option(`--parent-id <parent-id>`, ``)
  .option(`--quantified-associations <quantified-associations>`, ``)
  .option(`--tax-class <tax-class>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { sku, attributeValues, completeness, deletedAt, enabled, familyId, familyVariantId, kind, parentId, quantifiedAssociations, taxClass } = await promptForMissing(
          _options,
          createSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attributeValues !== undefined) {
          _payload[`attribute_values`] = resolveBodyParam(attributeValues);
        }
        if (completeness !== undefined) {
          _payload[`completeness`] = resolveBodyParam(completeness);
        }
        if (deletedAt !== undefined) {
          _payload[`deleted_at`] = deletedAt;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (familyId !== undefined) {
          _payload[`family_id`] = familyId;
        }
        if (familyVariantId !== undefined) {
          _payload[`family_variant_id`] = familyVariantId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (quantifiedAssociations !== undefined) {
          _payload[`quantified_associations`] = resolveBodyParam(quantifiedAssociations);
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (taxClass !== undefined) {
          _payload[`tax_class`] = taxClass;
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
registerPromptSpecs(products.commands.at(-1)!, createSpecs, { method: "post" });
const assetFamiliesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`asset-families-list`)
  .description(`List asset families (filter by column; paginate limit/offset/order)`)
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
          assetFamiliesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/asset_families`;
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
registerPromptSpecs(products.commands.at(-1)!, assetFamiliesListSpecs, { method: "get" });
const assetFamiliesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "namingConvention", option: "--naming-convention <naming-convention>", name: "naming_convention", type: "object", required: false },
];
products
  .command(`asset-families-create`)
  .description(`Create one of asset families`)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--naming-convention <naming-convention>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, labels, namingConvention } = await promptForMissing(
          _options,
          assetFamiliesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/asset_families`;
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
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (namingConvention !== undefined) {
          _payload[`naming_convention`] = resolveBodyParam(namingConvention);
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
registerPromptSpecs(products.commands.at(-1)!, assetFamiliesCreateSpecs, { method: "post" });
const assetFamiliesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/asset_families", hasLimit: true } },
];
products
  .command(`asset-families-delete`)
  .description(`Delete one of asset families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          assetFamiliesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products asset-families-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/asset_families/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, assetFamiliesDeleteSpecs, { method: "delete", destructive: true });
const assetFamiliesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/asset_families", hasLimit: true } },
];
products
  .command(`asset-families-get`)
  .description(`Read one of asset families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          assetFamiliesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/asset_families/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, assetFamiliesGetSpecs, { method: "get" });
const assetFamiliesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/asset_families", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "namingConvention", option: "--naming-convention <naming-convention>", name: "naming_convention", type: "object", required: false },
];
products
  .command(`asset-families-update`)
  .description(`Update one of asset families by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--naming-convention <naming-convention>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, labels, namingConvention } = await promptForMissing(
          _options,
          assetFamiliesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/asset_families/{id}`.replace(`{id}`, id);
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
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (namingConvention !== undefined) {
          _payload[`naming_convention`] = resolveBodyParam(namingConvention);
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
registerPromptSpecs(products.commands.at(-1)!, assetFamiliesUpdateSpecs, { method: "put" });
const assetsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`assets-list`)
  .description(`List assets (filter by column; paginate limit/offset/order)`)
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
          assetsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/assets`;
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
registerPromptSpecs(products.commands.at(-1)!, assetsListSpecs, { method: "get" });
const assetsCreateSpecs: PromptSpec[] = [
  { key: "assetFamilyId", option: "--asset-family-id <asset-family-id>", name: "asset_family_id", type: "string", required: true },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "attributeValues", option: "--attribute-values <attribute-values>", name: "attribute_values", type: "object", required: false },
  { key: "mediaUuid", option: "--media-uuid <media-uuid>", name: "media_uuid", type: "string", required: false },
];
products
  .command(`assets-create`)
  .description(`Create one of assets`)
  .option(`--asset-family-id <asset-family-id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--attribute-values <attribute-values>`, ``)
  .option(`--media-uuid <media-uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { assetFamilyId, code, attributeValues, mediaUuid } = await promptForMissing(
          _options,
          assetsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/assets`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (assetFamilyId !== undefined) {
          _payload[`asset_family_id`] = assetFamilyId;
        }
        if (attributeValues !== undefined) {
          _payload[`attribute_values`] = resolveBodyParam(attributeValues);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (mediaUuid !== undefined) {
          _payload[`media_uuid`] = mediaUuid;
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
registerPromptSpecs(products.commands.at(-1)!, assetsCreateSpecs, { method: "post" });
const assetsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/assets", hasLimit: true } },
];
products
  .command(`assets-delete`)
  .description(`Delete one of assets by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          assetsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products assets-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/assets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, assetsDeleteSpecs, { method: "delete", destructive: true });
const assetsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/assets", hasLimit: true } },
];
products
  .command(`assets-get`)
  .description(`Read one of assets by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          assetsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/assets/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, assetsGetSpecs, { method: "get" });
const assetsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/assets", hasLimit: true } },
  { key: "assetFamilyId", option: "--asset-family-id <asset-family-id>", name: "asset_family_id", type: "string", required: false },
  { key: "attributeValues", option: "--attribute-values <attribute-values>", name: "attribute_values", type: "object", required: false },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "mediaUuid", option: "--media-uuid <media-uuid>", name: "media_uuid", type: "string", required: false },
];
products
  .command(`assets-update`)
  .description(`Update one of assets by id`)
  .option(`--id <id>`, ``)
  .option(`--asset-family-id <asset-family-id>`, ``)
  .option(`--attribute-values <attribute-values>`, ``)
  .option(`--code <code>`, ``)
  .option(`--media-uuid <media-uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, assetFamilyId, attributeValues, code, mediaUuid } = await promptForMissing(
          _options,
          assetsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/assets/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (assetFamilyId !== undefined) {
          _payload[`asset_family_id`] = assetFamilyId;
        }
        if (attributeValues !== undefined) {
          _payload[`attribute_values`] = resolveBodyParam(attributeValues);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (mediaUuid !== undefined) {
          _payload[`media_uuid`] = mediaUuid;
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
registerPromptSpecs(products.commands.at(-1)!, assetsUpdateSpecs, { method: "put" });
const associationTypesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`association-types-list`)
  .description(`List association types (filter by column; paginate limit/offset/order)`)
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
          associationTypesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/association_types`;
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
registerPromptSpecs(products.commands.at(-1)!, associationTypesListSpecs, { method: "get" });
const associationTypesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "isQuantified", option: "--is-quantified <is-quantified>", name: "is_quantified", type: "boolean", required: false },
  { key: "isTwoWay", option: "--is-two-way <is-two-way>", name: "is_two_way", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
];
products
  .command(`association-types-create`)
  .description(`Create one of association types`)
  .option(`--code <code>`, ``)
  .option(
    `--is-quantified [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--is-two-way [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, isQuantified, isTwoWay, labels } = await promptForMissing(
          _options,
          associationTypesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/association_types`;
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
        if (isQuantified !== undefined) {
          _payload[`is_quantified`] = isQuantified;
        }
        if (isTwoWay !== undefined) {
          _payload[`is_two_way`] = isTwoWay;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
registerPromptSpecs(products.commands.at(-1)!, associationTypesCreateSpecs, { method: "post" });
const associationTypesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/association_types", hasLimit: true } },
];
products
  .command(`association-types-delete`)
  .description(`Delete one of association types by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          associationTypesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products association-types-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/association_types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, associationTypesDeleteSpecs, { method: "delete", destructive: true });
const associationTypesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/association_types", hasLimit: true } },
];
products
  .command(`association-types-get`)
  .description(`Read one of association types by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          associationTypesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/association_types/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, associationTypesGetSpecs, { method: "get" });
const associationTypesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/association_types", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "isQuantified", option: "--is-quantified <is-quantified>", name: "is_quantified", type: "boolean", required: false },
  { key: "isTwoWay", option: "--is-two-way <is-two-way>", name: "is_two_way", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
];
products
  .command(`association-types-update`)
  .description(`Update one of association types by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(
    `--is-quantified [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--is-two-way [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, isQuantified, isTwoWay, labels } = await promptForMissing(
          _options,
          associationTypesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/association_types/{id}`.replace(`{id}`, id);
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
        if (isQuantified !== undefined) {
          _payload[`is_quantified`] = isQuantified;
        }
        if (isTwoWay !== undefined) {
          _payload[`is_two_way`] = isTwoWay;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
registerPromptSpecs(products.commands.at(-1)!, associationTypesUpdateSpecs, { method: "put" });
const attributeGroupsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`attribute-groups-list`)
  .description(`List attribute groups (filter by column; paginate limit/offset/order)`)
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
          attributeGroupsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_groups`;
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
registerPromptSpecs(products.commands.at(-1)!, attributeGroupsListSpecs, { method: "get" });
const attributeGroupsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
];
products
  .command(`attribute-groups-create`)
  .description(`Create one of attribute groups`)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, labels, position } = await promptForMissing(
          _options,
          attributeGroupsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_groups`;
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
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
registerPromptSpecs(products.commands.at(-1)!, attributeGroupsCreateSpecs, { method: "post" });
const attributeGroupsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_groups", hasLimit: true } },
];
products
  .command(`attribute-groups-delete`)
  .description(`Delete one of attribute groups by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          attributeGroupsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products attribute-groups-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_groups/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, attributeGroupsDeleteSpecs, { method: "delete", destructive: true });
const attributeGroupsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_groups", hasLimit: true } },
];
products
  .command(`attribute-groups-get`)
  .description(`Read one of attribute groups by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          attributeGroupsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_groups/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, attributeGroupsGetSpecs, { method: "get" });
const attributeGroupsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_groups", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
];
products
  .command(`attribute-groups-update`)
  .description(`Update one of attribute groups by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, labels, position } = await promptForMissing(
          _options,
          attributeGroupsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_groups/{id}`.replace(`{id}`, id);
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
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
registerPromptSpecs(products.commands.at(-1)!, attributeGroupsUpdateSpecs, { method: "put" });
const attributeOptionsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`attribute-options-list`)
  .description(`List attribute options (filter by column; paginate limit/offset/order)`)
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
          attributeOptionsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_options`;
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
registerPromptSpecs(products.commands.at(-1)!, attributeOptionsListSpecs, { method: "get" });
const attributeOptionsCreateSpecs: PromptSpec[] = [
  { key: "attributeId", option: "--attribute-id <attribute-id>", name: "attribute_id", type: "string", required: true },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "swatch", option: "--swatch <swatch>", name: "swatch", type: "object", required: false },
];
products
  .command(`attribute-options-create`)
  .description(`Create one of attribute options`)
  .option(`--attribute-id <attribute-id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--swatch <swatch>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { attributeId, code, labels, position, swatch } = await promptForMissing(
          _options,
          attributeOptionsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_options`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attributeId !== undefined) {
          _payload[`attribute_id`] = attributeId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (swatch !== undefined) {
          _payload[`swatch`] = resolveBodyParam(swatch);
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
registerPromptSpecs(products.commands.at(-1)!, attributeOptionsCreateSpecs, { method: "post" });
const attributeOptionsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_options", hasLimit: true } },
];
products
  .command(`attribute-options-delete`)
  .description(`Delete one of attribute options by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          attributeOptionsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products attribute-options-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_options/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, attributeOptionsDeleteSpecs, { method: "delete", destructive: true });
const attributeOptionsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_options", hasLimit: true } },
];
products
  .command(`attribute-options-get`)
  .description(`Read one of attribute options by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          attributeOptionsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_options/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, attributeOptionsGetSpecs, { method: "get" });
const attributeOptionsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_options", hasLimit: true } },
  { key: "attributeId", option: "--attribute-id <attribute-id>", name: "attribute_id", type: "string", required: false },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "swatch", option: "--swatch <swatch>", name: "swatch", type: "object", required: false },
];
products
  .command(`attribute-options-update`)
  .description(`Update one of attribute options by id`)
  .option(`--id <id>`, ``)
  .option(`--attribute-id <attribute-id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--swatch <swatch>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, attributeId, code, labels, position, swatch } = await promptForMissing(
          _options,
          attributeOptionsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_options/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attributeId !== undefined) {
          _payload[`attribute_id`] = attributeId;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (swatch !== undefined) {
          _payload[`swatch`] = resolveBodyParam(swatch);
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
registerPromptSpecs(products.commands.at(-1)!, attributeOptionsUpdateSpecs, { method: "put" });
const attributesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`attributes-list`)
  .description(`List attributes (filter by column; paginate limit/offset/order)`)
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
          attributesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attributes`;
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
registerPromptSpecs(products.commands.at(-1)!, attributesListSpecs, { method: "get" });
const attributesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "type", option: "--type <type>", name: "type", type: "string", required: true },
  { key: "config", option: "--config <config>", name: "config", type: "object", required: false },
  { key: "entityRef", option: "--entity-ref <entity-ref>", name: "entity_ref", type: "string", required: false },
  { key: "entityType", option: "--entity-type <entity-type>", name: "entity_type", type: "string", required: false },
  { key: "groupId", option: "--group-id <group-id>", name: "group_id", type: "string", required: false },
  { key: "isFilterable", option: "--is-filterable <is-filterable>", name: "is_filterable", type: "boolean", required: false },
  { key: "isUnique", option: "--is-unique <is-unique>", name: "is_unique", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "localizable", option: "--localizable <localizable>", name: "localizable", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "scopable", option: "--scopable <scopable>", name: "scopable", type: "boolean", required: false },
  { key: "usableInGrid", option: "--usable-in-grid <usable-in-grid>", name: "usable_in_grid", type: "boolean", required: false },
  { key: "validation", option: "--validation <validation>", name: "validation", type: "object", required: false },
];
products
  .command(`attributes-create`)
  .description(`Create one of attributes`)
  .option(`--code <code>`, ``)
  .option(`--type <type>`, ``)
  .option(`--config <config>`, ``)
  .option(`--entity-ref <entity-ref>`, ``)
  .option(`--entity-type <entity-type>`, ``)
  .option(`--group-id <group-id>`, ``)
  .option(
    `--is-filterable [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--is-unique [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(
    `--localizable [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, ``, parseInteger)
  .option(
    `--scopable [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--usable-in-grid [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--validation <validation>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, type, config, entityRef, entityType, groupId, isFilterable, isUnique, labels, localizable, position, scopable, usableInGrid, validation } = await promptForMissing(
          _options,
          attributesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attributes`;
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
        if (config !== undefined) {
          _payload[`config`] = resolveBodyParam(config);
        }
        if (entityRef !== undefined) {
          _payload[`entity_ref`] = entityRef;
        }
        if (entityType !== undefined) {
          _payload[`entity_type`] = entityType;
        }
        if (groupId !== undefined) {
          _payload[`group_id`] = groupId;
        }
        if (isFilterable !== undefined) {
          _payload[`is_filterable`] = isFilterable;
        }
        if (isUnique !== undefined) {
          _payload[`is_unique`] = isUnique;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (localizable !== undefined) {
          _payload[`localizable`] = localizable;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (scopable !== undefined) {
          _payload[`scopable`] = scopable;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (usableInGrid !== undefined) {
          _payload[`usable_in_grid`] = usableInGrid;
        }
        if (validation !== undefined) {
          _payload[`validation`] = resolveBodyParam(validation);
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
registerPromptSpecs(products.commands.at(-1)!, attributesCreateSpecs, { method: "post" });
const attributesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attributes", hasLimit: true } },
];
products
  .command(`attributes-delete`)
  .description(`Delete one of attributes by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          attributesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products attributes-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/attributes/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, attributesDeleteSpecs, { method: "delete", destructive: true });
const attributesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attributes", hasLimit: true } },
];
products
  .command(`attributes-get`)
  .description(`Read one of attributes by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          attributesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attributes/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, attributesGetSpecs, { method: "get" });
const attributesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attributes", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "config", option: "--config <config>", name: "config", type: "object", required: false },
  { key: "entityRef", option: "--entity-ref <entity-ref>", name: "entity_ref", type: "string", required: false },
  { key: "entityType", option: "--entity-type <entity-type>", name: "entity_type", type: "string", required: false },
  { key: "groupId", option: "--group-id <group-id>", name: "group_id", type: "string", required: false },
  { key: "isFilterable", option: "--is-filterable <is-filterable>", name: "is_filterable", type: "boolean", required: false },
  { key: "isUnique", option: "--is-unique <is-unique>", name: "is_unique", type: "boolean", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "localizable", option: "--localizable <localizable>", name: "localizable", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "scopable", option: "--scopable <scopable>", name: "scopable", type: "boolean", required: false },
  { key: "type", option: "--type <type>", name: "type", type: "string", required: false },
  { key: "usableInGrid", option: "--usable-in-grid <usable-in-grid>", name: "usable_in_grid", type: "boolean", required: false },
  { key: "validation", option: "--validation <validation>", name: "validation", type: "object", required: false },
];
products
  .command(`attributes-update`)
  .description(`Update one of attributes by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--config <config>`, ``)
  .option(`--entity-ref <entity-ref>`, ``)
  .option(`--entity-type <entity-type>`, ``)
  .option(`--group-id <group-id>`, ``)
  .option(
    `--is-filterable [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--is-unique [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .option(
    `--localizable [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, ``, parseInteger)
  .option(
    `--scopable [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--type <type>`, ``)
  .option(
    `--usable-in-grid [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--validation <validation>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, config, entityRef, entityType, groupId, isFilterable, isUnique, labels, localizable, position, scopable, type, usableInGrid, validation } = await promptForMissing(
          _options,
          attributesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attributes/{id}`.replace(`{id}`, id);
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
        if (config !== undefined) {
          _payload[`config`] = resolveBodyParam(config);
        }
        if (entityRef !== undefined) {
          _payload[`entity_ref`] = entityRef;
        }
        if (entityType !== undefined) {
          _payload[`entity_type`] = entityType;
        }
        if (groupId !== undefined) {
          _payload[`group_id`] = groupId;
        }
        if (isFilterable !== undefined) {
          _payload[`is_filterable`] = isFilterable;
        }
        if (isUnique !== undefined) {
          _payload[`is_unique`] = isUnique;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (localizable !== undefined) {
          _payload[`localizable`] = localizable;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (scopable !== undefined) {
          _payload[`scopable`] = scopable;
        }
        if (type !== undefined) {
          _payload[`type`] = type;
        }
        if (usableInGrid !== undefined) {
          _payload[`usable_in_grid`] = usableInGrid;
        }
        if (validation !== undefined) {
          _payload[`validation`] = resolveBodyParam(validation);
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
registerPromptSpecs(products.commands.at(-1)!, attributesUpdateSpecs, { method: "put" });
const batchSpecs: PromptSpec[] = [
  { key: "ids", option: "--ids [ids...]", name: "ids", type: "array", required: false },
  { key: "skus", option: "--skus [skus...]", name: "skus", type: "array", required: false },
];
products
  .command(`batch`)
  .description(`Bulk-read products by ids and/or skus — minimal fields incl. tax_class, for cross-app resolution.`)
  .option(`--ids [ids...]`, ``)
  .option(`--skus [skus...]`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { ids, skus } = await promptForMissing(
          _options,
          batchSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/batch`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (ids !== undefined) {
          _payload[`ids`] = ids;
        }
        if (skus !== undefined) {
          _payload[`skus`] = skus;
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
registerPromptSpecs(products.commands.at(-1)!, batchSpecs, { method: "post" });
const categoriesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`categories-list`)
  .description(`List categories (filter by column; paginate limit/offset/order)`)
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
          categoriesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/categories`;
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
registerPromptSpecs(products.commands.at(-1)!, categoriesListSpecs, { method: "get" });
const categoriesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", type: "string", required: false },
  { key: "path", option: "--path <path>", name: "path", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "values", option: "--values <values>", name: "values", type: "object", required: false },
];
products
  .command(`categories-create`)
  .description(`Create one of categories`)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--parent-id <parent-id>`, ``)
  .option(`--path <path>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--values <values>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, labels, parentId, path, position, values } = await promptForMissing(
          _options,
          categoriesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/categories`;
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
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (path !== undefined) {
          _payload[`path`] = path;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (values !== undefined) {
          _payload[`values`] = resolveBodyParam(values);
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
registerPromptSpecs(products.commands.at(-1)!, categoriesCreateSpecs, { method: "post" });
const categoriesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/categories", hasLimit: true } },
];
products
  .command(`categories-delete`)
  .description(`Delete one of categories by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          categoriesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products categories-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/categories/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, categoriesDeleteSpecs, { method: "delete", destructive: true });
const categoriesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/categories", hasLimit: true } },
];
products
  .command(`categories-get`)
  .description(`Read one of categories by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          categoriesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/categories/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, categoriesGetSpecs, { method: "get" });
const categoriesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/categories", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", type: "string", required: false },
  { key: "path", option: "--path <path>", name: "path", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "values", option: "--values <values>", name: "values", type: "object", required: false },
];
products
  .command(`categories-update`)
  .description(`Update one of categories by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--parent-id <parent-id>`, ``)
  .option(`--path <path>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--values <values>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, labels, parentId, path, position, values } = await promptForMissing(
          _options,
          categoriesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/categories/{id}`.replace(`{id}`, id);
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
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (path !== undefined) {
          _payload[`path`] = path;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (values !== undefined) {
          _payload[`values`] = resolveBodyParam(values);
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
registerPromptSpecs(products.commands.at(-1)!, categoriesUpdateSpecs, { method: "put" });
const familiesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`families-list`)
  .description(`List families (filter by column; paginate limit/offset/order)`)
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
          familiesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/families`;
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
registerPromptSpecs(products.commands.at(-1)!, familiesListSpecs, { method: "get" });
const familiesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "imageAttribute", option: "--image-attribute <image-attribute>", name: "image_attribute", type: "string", required: false },
  { key: "labelAttribute", option: "--label-attribute <label-attribute>", name: "label_attribute", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
];
products
  .command(`families-create`)
  .description(`Create one of families`)
  .option(`--code <code>`, ``)
  .option(`--image-attribute <image-attribute>`, ``)
  .option(`--label-attribute <label-attribute>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, imageAttribute, labelAttribute, labels } = await promptForMissing(
          _options,
          familiesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/families`;
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
        if (imageAttribute !== undefined) {
          _payload[`image_attribute`] = imageAttribute;
        }
        if (labelAttribute !== undefined) {
          _payload[`label_attribute`] = labelAttribute;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
registerPromptSpecs(products.commands.at(-1)!, familiesCreateSpecs, { method: "post" });
const familiesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/families", hasLimit: true } },
];
products
  .command(`families-delete`)
  .description(`Delete one of families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          familiesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products families-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/families/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, familiesDeleteSpecs, { method: "delete", destructive: true });
const familiesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/families", hasLimit: true } },
];
products
  .command(`families-get`)
  .description(`Read one of families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          familiesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/families/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, familiesGetSpecs, { method: "get" });
const familiesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/families", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "imageAttribute", option: "--image-attribute <image-attribute>", name: "image_attribute", type: "string", required: false },
  { key: "labelAttribute", option: "--label-attribute <label-attribute>", name: "label_attribute", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
];
products
  .command(`families-update`)
  .description(`Update one of families by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--image-attribute <image-attribute>`, ``)
  .option(`--label-attribute <label-attribute>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, imageAttribute, labelAttribute, labels } = await promptForMissing(
          _options,
          familiesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/families/{id}`.replace(`{id}`, id);
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
        if (imageAttribute !== undefined) {
          _payload[`image_attribute`] = imageAttribute;
        }
        if (labelAttribute !== undefined) {
          _payload[`label_attribute`] = labelAttribute;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
registerPromptSpecs(products.commands.at(-1)!, familiesUpdateSpecs, { method: "put" });
const familyAttributesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`family-attributes-list`)
  .description(`List family attributes (filter by column; paginate limit/offset/order)`)
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
          familyAttributesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_attributes`;
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
registerPromptSpecs(products.commands.at(-1)!, familyAttributesListSpecs, { method: "get" });
const familyAttributesCreateSpecs: PromptSpec[] = [
  { key: "attributeId", option: "--attribute-id <attribute-id>", name: "attribute_id", type: "string", required: true },
  { key: "familyId", option: "--family-id <family-id>", name: "family_id", type: "string", required: true },
  { key: "isRequired", option: "--is-required <is-required>", name: "is_required", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "requiredChannels", option: "--required-channels <required-channels>", name: "required_channels", type: "object", required: false },
];
products
  .command(`family-attributes-create`)
  .description(`Create one of family attributes`)
  .option(`--attribute-id <attribute-id>`, ``)
  .option(`--family-id <family-id>`, ``)
  .option(
    `--is-required [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, ``, parseInteger)
  .option(`--required-channels <required-channels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { attributeId, familyId, isRequired, position, requiredChannels } = await promptForMissing(
          _options,
          familyAttributesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_attributes`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attributeId !== undefined) {
          _payload[`attribute_id`] = attributeId;
        }
        if (familyId !== undefined) {
          _payload[`family_id`] = familyId;
        }
        if (isRequired !== undefined) {
          _payload[`is_required`] = isRequired;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (requiredChannels !== undefined) {
          _payload[`required_channels`] = resolveBodyParam(requiredChannels);
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
registerPromptSpecs(products.commands.at(-1)!, familyAttributesCreateSpecs, { method: "post" });
const familyAttributesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_attributes", hasLimit: true } },
];
products
  .command(`family-attributes-delete`)
  .description(`Delete one of family attributes by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          familyAttributesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products family-attributes-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/family_attributes/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, familyAttributesDeleteSpecs, { method: "delete", destructive: true });
const familyAttributesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_attributes", hasLimit: true } },
];
products
  .command(`family-attributes-get`)
  .description(`Read one of family attributes by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          familyAttributesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_attributes/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, familyAttributesGetSpecs, { method: "get" });
const familyAttributesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_attributes", hasLimit: true } },
  { key: "attributeId", option: "--attribute-id <attribute-id>", name: "attribute_id", type: "string", required: false },
  { key: "familyId", option: "--family-id <family-id>", name: "family_id", type: "string", required: false },
  { key: "isRequired", option: "--is-required <is-required>", name: "is_required", type: "boolean", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "requiredChannels", option: "--required-channels <required-channels>", name: "required_channels", type: "object", required: false },
];
products
  .command(`family-attributes-update`)
  .description(`Update one of family attributes by id`)
  .option(`--id <id>`, ``)
  .option(`--attribute-id <attribute-id>`, ``)
  .option(`--family-id <family-id>`, ``)
  .option(
    `--is-required [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, ``, parseInteger)
  .option(`--required-channels <required-channels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, attributeId, familyId, isRequired, position, requiredChannels } = await promptForMissing(
          _options,
          familyAttributesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_attributes/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attributeId !== undefined) {
          _payload[`attribute_id`] = attributeId;
        }
        if (familyId !== undefined) {
          _payload[`family_id`] = familyId;
        }
        if (isRequired !== undefined) {
          _payload[`is_required`] = isRequired;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (requiredChannels !== undefined) {
          _payload[`required_channels`] = resolveBodyParam(requiredChannels);
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
registerPromptSpecs(products.commands.at(-1)!, familyAttributesUpdateSpecs, { method: "put" });
const familyVariantsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`family-variants-list`)
  .description(`List family variants (filter by column; paginate limit/offset/order)`)
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
          familyVariantsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_variants`;
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
registerPromptSpecs(products.commands.at(-1)!, familyVariantsListSpecs, { method: "get" });
const familyVariantsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "familyId", option: "--family-id <family-id>", name: "family_id", type: "string", required: true },
  { key: "axes", option: "--axes <axes>", name: "axes", type: "object", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
];
products
  .command(`family-variants-create`)
  .description(`Create one of family variants`)
  .option(`--code <code>`, ``)
  .option(`--family-id <family-id>`, ``)
  .option(`--axes <axes>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, familyId, axes, labels } = await promptForMissing(
          _options,
          familyVariantsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_variants`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (axes !== undefined) {
          _payload[`axes`] = resolveBodyParam(axes);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (familyId !== undefined) {
          _payload[`family_id`] = familyId;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
registerPromptSpecs(products.commands.at(-1)!, familyVariantsCreateSpecs, { method: "post" });
const familyVariantsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_variants", hasLimit: true } },
];
products
  .command(`family-variants-delete`)
  .description(`Delete one of family variants by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          familyVariantsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products family-variants-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/family_variants/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, familyVariantsDeleteSpecs, { method: "delete", destructive: true });
const familyVariantsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_variants", hasLimit: true } },
];
products
  .command(`family-variants-get`)
  .description(`Read one of family variants by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          familyVariantsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_variants/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, familyVariantsGetSpecs, { method: "get" });
const familyVariantsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_variants", hasLimit: true } },
  { key: "axes", option: "--axes <axes>", name: "axes", type: "object", required: false },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "familyId", option: "--family-id <family-id>", name: "family_id", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
];
products
  .command(`family-variants-update`)
  .description(`Update one of family variants by id`)
  .option(`--id <id>`, ``)
  .option(`--axes <axes>`, ``)
  .option(`--code <code>`, ``)
  .option(`--family-id <family-id>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, axes, code, familyId, labels } = await promptForMissing(
          _options,
          familyVariantsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_variants/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (axes !== undefined) {
          _payload[`axes`] = resolveBodyParam(axes);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (familyId !== undefined) {
          _payload[`family_id`] = familyId;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
registerPromptSpecs(products.commands.at(-1)!, familyVariantsUpdateSpecs, { method: "put" });
const measurementFamiliesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`measurement-families-list`)
  .description(`List measurement families (filter by column; paginate limit/offset/order)`)
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
          measurementFamiliesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/measurement_families`;
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
registerPromptSpecs(products.commands.at(-1)!, measurementFamiliesListSpecs, { method: "get" });
const measurementFamiliesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "standardUnit", option: "--standard-unit <standard-unit>", name: "standard_unit", type: "string", required: true },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "units", option: "--units <units>", name: "units", type: "object", required: false },
];
products
  .command(`measurement-families-create`)
  .description(`Create one of measurement families`)
  .option(`--code <code>`, ``)
  .option(`--standard-unit <standard-unit>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--units <units>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, standardUnit, labels, units } = await promptForMissing(
          _options,
          measurementFamiliesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/measurement_families`;
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
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (standardUnit !== undefined) {
          _payload[`standard_unit`] = standardUnit;
        }
        if (units !== undefined) {
          _payload[`units`] = resolveBodyParam(units);
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
registerPromptSpecs(products.commands.at(-1)!, measurementFamiliesCreateSpecs, { method: "post" });
const measurementFamiliesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/measurement_families", hasLimit: true } },
];
products
  .command(`measurement-families-delete`)
  .description(`Delete one of measurement families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          measurementFamiliesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products measurement-families-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/measurement_families/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, measurementFamiliesDeleteSpecs, { method: "delete", destructive: true });
const measurementFamiliesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/measurement_families", hasLimit: true } },
];
products
  .command(`measurement-families-get`)
  .description(`Read one of measurement families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          measurementFamiliesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/measurement_families/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, measurementFamiliesGetSpecs, { method: "get" });
const measurementFamiliesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/measurement_families", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "standardUnit", option: "--standard-unit <standard-unit>", name: "standard_unit", type: "string", required: false },
  { key: "units", option: "--units <units>", name: "units", type: "object", required: false },
];
products
  .command(`measurement-families-update`)
  .description(`Update one of measurement families by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--standard-unit <standard-unit>`, ``)
  .option(`--units <units>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, labels, standardUnit, units } = await promptForMissing(
          _options,
          measurementFamiliesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/measurement_families/{id}`.replace(`{id}`, id);
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
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (standardUnit !== undefined) {
          _payload[`standard_unit`] = standardUnit;
        }
        if (units !== undefined) {
          _payload[`units`] = resolveBodyParam(units);
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
registerPromptSpecs(products.commands.at(-1)!, measurementFamiliesUpdateSpecs, { method: "put" });
const productAssociationsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`product-associations-list`)
  .description(`List product associations (filter by column; paginate limit/offset/order)`)
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
          productAssociationsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_associations`;
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
registerPromptSpecs(products.commands.at(-1)!, productAssociationsListSpecs, { method: "get" });
const productAssociationsCreateSpecs: PromptSpec[] = [
  { key: "associationTypeId", option: "--association-type-id <association-type-id>", name: "association_type_id", type: "string", required: true },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: true },
  { key: "targetProductId", option: "--target-product-id <target-product-id>", name: "target_product_id", type: "string", required: true },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", type: "number", required: false },
];
products
  .command(`product-associations-create`)
  .description(`Create one of product associations`)
  .option(`--association-type-id <association-type-id>`, ``)
  .option(`--product-id <product-id>`, ``)
  .option(`--target-product-id <target-product-id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--quantity <quantity>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { associationTypeId, productId, targetProductId, position, quantity } = await promptForMissing(
          _options,
          productAssociationsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_associations`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (associationTypeId !== undefined) {
          _payload[`association_type_id`] = associationTypeId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (targetProductId !== undefined) {
          _payload[`target_product_id`] = targetProductId;
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
registerPromptSpecs(products.commands.at(-1)!, productAssociationsCreateSpecs, { method: "post" });
const productAssociationsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_associations", hasLimit: true } },
];
products
  .command(`product-associations-delete`)
  .description(`Delete one of product associations by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          productAssociationsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products product-associations-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/product_associations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, productAssociationsDeleteSpecs, { method: "delete", destructive: true });
const productAssociationsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_associations", hasLimit: true } },
];
products
  .command(`product-associations-get`)
  .description(`Read one of product associations by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          productAssociationsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_associations/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, productAssociationsGetSpecs, { method: "get" });
const productAssociationsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_associations", hasLimit: true } },
  { key: "associationTypeId", option: "--association-type-id <association-type-id>", name: "association_type_id", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: false },
  { key: "quantity", option: "--quantity <quantity>", name: "quantity", type: "number", required: false },
  { key: "targetProductId", option: "--target-product-id <target-product-id>", name: "target_product_id", type: "string", required: false },
];
products
  .command(`product-associations-update`)
  .description(`Update one of product associations by id`)
  .option(`--id <id>`, ``)
  .option(`--association-type-id <association-type-id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-id <product-id>`, ``)
  .option(`--quantity <quantity>`, ``, parseInteger)
  .option(`--target-product-id <target-product-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, associationTypeId, position, productId, quantity, targetProductId } = await promptForMissing(
          _options,
          productAssociationsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_associations/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (associationTypeId !== undefined) {
          _payload[`association_type_id`] = associationTypeId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
        }
        if (quantity !== undefined) {
          _payload[`quantity`] = quantity;
        }
        if (targetProductId !== undefined) {
          _payload[`target_product_id`] = targetProductId;
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
registerPromptSpecs(products.commands.at(-1)!, productAssociationsUpdateSpecs, { method: "put" });
const productCategoriesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`product-categories-list`)
  .description(`List product categories (filter by column; paginate limit/offset/order)`)
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
          productCategoriesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_categories`;
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
registerPromptSpecs(products.commands.at(-1)!, productCategoriesListSpecs, { method: "get" });
const productCategoriesCreateSpecs: PromptSpec[] = [
  { key: "categoryId", option: "--category-id <category-id>", name: "category_id", type: "string", required: true },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: true },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
];
products
  .command(`product-categories-create`)
  .description(`Create one of product categories`)
  .option(`--category-id <category-id>`, ``)
  .option(`--product-id <product-id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { categoryId, productId, position } = await promptForMissing(
          _options,
          productCategoriesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_categories`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (categoryId !== undefined) {
          _payload[`category_id`] = categoryId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
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
registerPromptSpecs(products.commands.at(-1)!, productCategoriesCreateSpecs, { method: "post" });
const productCategoriesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_categories", hasLimit: true } },
];
products
  .command(`product-categories-delete`)
  .description(`Delete one of product categories by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          productCategoriesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products product-categories-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/product_categories/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, productCategoriesDeleteSpecs, { method: "delete", destructive: true });
const productCategoriesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_categories", hasLimit: true } },
];
products
  .command(`product-categories-get`)
  .description(`Read one of product categories by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          productCategoriesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_categories/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, productCategoriesGetSpecs, { method: "get" });
const productCategoriesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_categories", hasLimit: true } },
  { key: "categoryId", option: "--category-id <category-id>", name: "category_id", type: "string", required: false },
  { key: "position", option: "--position <position>", name: "position", type: "integer", required: false },
  { key: "productId", option: "--product-id <product-id>", name: "product_id", type: "string", required: false },
];
products
  .command(`product-categories-update`)
  .description(`Update one of product categories by id`)
  .option(`--id <id>`, ``)
  .option(`--category-id <category-id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-id <product-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, categoryId, position, productId } = await promptForMissing(
          _options,
          productCategoriesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_categories/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (categoryId !== undefined) {
          _payload[`category_id`] = categoryId;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (productId !== undefined) {
          _payload[`product_id`] = productId;
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
registerPromptSpecs(products.commands.at(-1)!, productCategoriesUpdateSpecs, { method: "put" });
const referenceEntitiesListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`reference-entities-list`)
  .description(`List reference entities (filter by column; paginate limit/offset/order)`)
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
          referenceEntitiesListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entities`;
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
registerPromptSpecs(products.commands.at(-1)!, referenceEntitiesListSpecs, { method: "get" });
const referenceEntitiesCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "image", option: "--image <image>", name: "image", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
];
products
  .command(`reference-entities-create`)
  .description(`Create one of reference entities`)
  .option(`--code <code>`, ``)
  .option(`--image <image>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, image, labels } = await promptForMissing(
          _options,
          referenceEntitiesCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entities`;
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
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
registerPromptSpecs(products.commands.at(-1)!, referenceEntitiesCreateSpecs, { method: "post" });
const referenceEntitiesDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entities", hasLimit: true } },
];
products
  .command(`reference-entities-delete`)
  .description(`Delete one of reference entities by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          referenceEntitiesDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products reference-entities-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entities/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, referenceEntitiesDeleteSpecs, { method: "delete", destructive: true });
const referenceEntitiesGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entities", hasLimit: true } },
];
products
  .command(`reference-entities-get`)
  .description(`Read one of reference entities by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          referenceEntitiesGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entities/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, referenceEntitiesGetSpecs, { method: "get" });
const referenceEntitiesUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entities", hasLimit: true } },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "image", option: "--image <image>", name: "image", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
];
products
  .command(`reference-entities-update`)
  .description(`Update one of reference entities by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--image <image>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, image, labels } = await promptForMissing(
          _options,
          referenceEntitiesUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entities/{id}`.replace(`{id}`, id);
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
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
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
registerPromptSpecs(products.commands.at(-1)!, referenceEntitiesUpdateSpecs, { method: "put" });
const referenceEntityRecordsListSpecs: PromptSpec[] = [
  { key: "limit", option: "--limit <limit>", name: "limit", description: "Page size (default 50, max 200).", type: "integer", required: false },
  { key: "offset", option: "--offset <offset>", name: "offset", description: "Row offset for pagination (default 0).", type: "integer", required: false },
  { key: "order", option: "--order <order>", name: "order", description: "Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.", type: "string", required: false },
  { key: "filter", option: "--filter <column=value>", name: "filter", description: "Filter rows by column equality (column=value).", type: "string", required: false },
];
products
  .command(`reference-entity-records-list`)
  .description(`List reference entity records (filter by column; paginate limit/offset/order)`)
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
          referenceEntityRecordsListSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entity_records`;
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
registerPromptSpecs(products.commands.at(-1)!, referenceEntityRecordsListSpecs, { method: "get" });
const referenceEntityRecordsCreateSpecs: PromptSpec[] = [
  { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
  { key: "referenceEntityId", option: "--reference-entity-id <reference-entity-id>", name: "reference_entity_id", type: "string", required: true },
  { key: "attributeValues", option: "--attribute-values <attribute-values>", name: "attribute_values", type: "object", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
];
products
  .command(`reference-entity-records-create`)
  .description(`Create one of reference entity records`)
  .option(`--code <code>`, ``)
  .option(`--reference-entity-id <reference-entity-id>`, ``)
  .option(`--attribute-values <attribute-values>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, referenceEntityId, attributeValues, labels } = await promptForMissing(
          _options,
          referenceEntityRecordsCreateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entity_records`;
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attributeValues !== undefined) {
          _payload[`attribute_values`] = resolveBodyParam(attributeValues);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (referenceEntityId !== undefined) {
          _payload[`reference_entity_id`] = referenceEntityId;
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
registerPromptSpecs(products.commands.at(-1)!, referenceEntityRecordsCreateSpecs, { method: "post" });
const referenceEntityRecordsDeleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entity_records", hasLimit: true } },
];
products
  .command(`reference-entity-records-delete`)
  .description(`Delete one of reference entity records by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          referenceEntityRecordsDeleteSpecs,
          _command,
        );
        await confirmDestructive(`products reference-entity-records-delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entity_records/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, referenceEntityRecordsDeleteSpecs, { method: "delete", destructive: true });
const referenceEntityRecordsGetSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entity_records", hasLimit: true } },
];
products
  .command(`reference-entity-records-get`)
  .description(`Read one of reference entity records by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          referenceEntityRecordsGetSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entity_records/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, referenceEntityRecordsGetSpecs, { method: "get" });
const referenceEntityRecordsUpdateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entity_records", hasLimit: true } },
  { key: "attributeValues", option: "--attribute-values <attribute-values>", name: "attribute_values", type: "object", required: false },
  { key: "code", option: "--code <code>", name: "code", type: "string", required: false },
  { key: "labels", option: "--labels <labels>", name: "labels", type: "object", required: false },
  { key: "referenceEntityId", option: "--reference-entity-id <reference-entity-id>", name: "reference_entity_id", type: "string", required: false },
];
products
  .command(`reference-entity-records-update`)
  .description(`Update one of reference entity records by id`)
  .option(`--id <id>`, ``)
  .option(`--attribute-values <attribute-values>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--reference-entity-id <reference-entity-id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, attributeValues, code, labels, referenceEntityId } = await promptForMissing(
          _options,
          referenceEntityRecordsUpdateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entity_records/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attributeValues !== undefined) {
          _payload[`attribute_values`] = resolveBodyParam(attributeValues);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = resolveBodyParam(labels);
        }
        if (referenceEntityId !== undefined) {
          _payload[`reference_entity_id`] = referenceEntityId;
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
registerPromptSpecs(products.commands.at(-1)!, referenceEntityRecordsUpdateSpecs, { method: "put" });
const deleteSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products", hasLimit: true } },
];
products
  .command(`delete`)
  .description(`Delete one of products by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          deleteSpecs,
          _command,
        );
        await confirmDestructive(`products delete`);
        const _client = await sdkForProject();
        const _apiPath = `/products/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, deleteSpecs, { method: "delete", destructive: true });
const getSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products", hasLimit: true } },
];
products
  .command(`get`)
  .description(`Read one of products by id`)
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
        const _apiPath = `/products/{id}`.replace(`{id}`, id);
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
registerPromptSpecs(products.commands.at(-1)!, getSpecs, { method: "get" });
const updateSpecs: PromptSpec[] = [
  { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products", hasLimit: true } },
  { key: "attributeValues", option: "--attribute-values <attribute-values>", name: "attribute_values", type: "object", required: false },
  { key: "completeness", option: "--completeness <completeness>", name: "completeness", type: "object", required: false },
  { key: "deletedAt", option: "--deleted-at <deleted-at>", name: "deleted_at", type: "string", required: false },
  { key: "enabled", option: "--enabled <enabled>", name: "enabled", type: "boolean", required: false },
  { key: "familyId", option: "--family-id <family-id>", name: "family_id", type: "string", required: false },
  { key: "familyVariantId", option: "--family-variant-id <family-variant-id>", name: "family_variant_id", type: "string", required: false },
  { key: "kind", option: "--kind <kind>", name: "kind", type: "string", required: false },
  { key: "parentId", option: "--parent-id <parent-id>", name: "parent_id", type: "string", required: false },
  { key: "quantifiedAssociations", option: "--quantified-associations <quantified-associations>", name: "quantified_associations", type: "object", required: false },
  { key: "sku", option: "--sku <sku>", name: "sku", type: "string", required: false },
  { key: "taxClass", option: "--tax-class <tax-class>", name: "tax_class", type: "string", required: false },
];
products
  .command(`update`)
  .description(`Update one of products by id`)
  .option(`--id <id>`, ``)
  .option(`--attribute-values <attribute-values>`, ``)
  .option(`--completeness <completeness>`, ``)
  .option(`--deleted-at <deleted-at>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--family-id <family-id>`, ``)
  .option(`--family-variant-id <family-variant-id>`, ``)
  .option(`--kind <kind>`, ``)
  .option(`--parent-id <parent-id>`, ``)
  .option(`--quantified-associations <quantified-associations>`, ``)
  .option(`--sku <sku>`, ``)
  .option(`--tax-class <tax-class>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, attributeValues, completeness, deletedAt, enabled, familyId, familyVariantId, kind, parentId, quantifiedAssociations, sku, taxClass } = await promptForMissing(
          _options,
          updateSpecs,
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (cliConfig.data !== undefined) {
          const body = resolveBodyParam(cliConfig.data);
          if (typeof body !== "object" || body === null || Array.isArray(body)) {
            throw new Error("--data must be a JSON object");
          }
          Object.assign(_payload, body as RequestParams);
        }
        if (attributeValues !== undefined) {
          _payload[`attribute_values`] = resolveBodyParam(attributeValues);
        }
        if (completeness !== undefined) {
          _payload[`completeness`] = resolveBodyParam(completeness);
        }
        if (deletedAt !== undefined) {
          _payload[`deleted_at`] = deletedAt;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (familyId !== undefined) {
          _payload[`family_id`] = familyId;
        }
        if (familyVariantId !== undefined) {
          _payload[`family_variant_id`] = familyVariantId;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (parentId !== undefined) {
          _payload[`parent_id`] = parentId;
        }
        if (quantifiedAssociations !== undefined) {
          _payload[`quantified_associations`] = resolveBodyParam(quantifiedAssociations);
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (taxClass !== undefined) {
          _payload[`tax_class`] = taxClass;
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
registerPromptSpecs(products.commands.at(-1)!, updateSpecs, { method: "put" });
