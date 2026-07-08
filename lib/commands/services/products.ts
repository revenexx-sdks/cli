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

export const products = new Command("products")
  .description(
    commandDescriptions["products"] ??
      `Manage products resources.`,
  )
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

products
  .command(`list`)
  .description(`List products (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`create`)
  .description(`Create one of products`)
  .option(`--sku <sku>`, ``)
  .option(`--attribute-_values <attribute-_values>`, ``)
  .option(`--completeness <completeness>`, ``)
  .option(`--deleted-_at <deleted-_at>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--family-_id <family-_id>`, ``)
  .option(`--family-_variant-_id <family-_variant-_id>`, ``)
  .option(`--kind <kind>`, ``)
  .option(`--parent-_id <parent-_id>`, ``)
  .option(`--quantified-_associations <quantified-_associations>`, ``)
  .option(`--tax-_class <tax-_class>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { sku, attribute_values, completeness, deleted_at, enabled, family_id, family_variant_id, kind, parent_id, quantified_associations, tax_class } = await promptForMissing(
          _options,
          [
            { key: "sku", option: "--sku <sku>", name: "sku", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products`;
        const _payload: RequestParams = {};
        if (attribute_values !== undefined) {
          _payload[`attribute_values`] = JSON.parse(attribute_values);
        }
        if (completeness !== undefined) {
          _payload[`completeness`] = JSON.parse(completeness);
        }
        if (deleted_at !== undefined) {
          _payload[`deleted_at`] = deleted_at;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (family_id !== undefined) {
          _payload[`family_id`] = family_id;
        }
        if (family_variant_id !== undefined) {
          _payload[`family_variant_id`] = family_variant_id;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (parent_id !== undefined) {
          _payload[`parent_id`] = parent_id;
        }
        if (quantified_associations !== undefined) {
          _payload[`quantified_associations`] = JSON.parse(quantified_associations);
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (tax_class !== undefined) {
          _payload[`tax_class`] = tax_class;
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
products
  .command(`asset-families-list`)
  .description(`List asset families (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`asset-families-create`)
  .description(`Create one of asset families`)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--naming-_convention <naming-_convention>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, labels, naming_convention } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/asset_families`;
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (naming_convention !== undefined) {
          _payload[`naming_convention`] = JSON.parse(naming_convention);
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
products
  .command(`asset-families-delete`)
  .description(`Delete one of asset families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/asset_families", hasLimit: true } },
          ],
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
products
  .command(`asset-families-get`)
  .description(`Read one of asset families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/asset_families", hasLimit: true } },
          ],
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
products
  .command(`asset-families-update`)
  .description(`Update one of asset families by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--naming-_convention <naming-_convention>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, labels, naming_convention } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/asset_families", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/asset_families/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (naming_convention !== undefined) {
          _payload[`naming_convention`] = JSON.parse(naming_convention);
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
products
  .command(`assets-list`)
  .description(`List assets (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`assets-create`)
  .description(`Create one of assets`)
  .option(`--asset-_family-_id <asset-_family-_id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--attribute-_values <attribute-_values>`, ``)
  .option(`--media-_uuid <media-_uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { asset_family_id, code, attribute_values, media_uuid } = await promptForMissing(
          _options,
          [
            { key: "asset_family_id", option: "--asset-_family-_id <asset-_family-_id>", name: "asset_family_id", type: "string", required: true },
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/assets`;
        const _payload: RequestParams = {};
        if (asset_family_id !== undefined) {
          _payload[`asset_family_id`] = asset_family_id;
        }
        if (attribute_values !== undefined) {
          _payload[`attribute_values`] = JSON.parse(attribute_values);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (media_uuid !== undefined) {
          _payload[`media_uuid`] = media_uuid;
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
products
  .command(`assets-delete`)
  .description(`Delete one of assets by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/assets", hasLimit: true } },
          ],
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
products
  .command(`assets-get`)
  .description(`Read one of assets by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/assets", hasLimit: true } },
          ],
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
products
  .command(`assets-update`)
  .description(`Update one of assets by id`)
  .option(`--id <id>`, ``)
  .option(`--asset-_family-_id <asset-_family-_id>`, ``)
  .option(`--attribute-_values <attribute-_values>`, ``)
  .option(`--code <code>`, ``)
  .option(`--media-_uuid <media-_uuid>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, asset_family_id, attribute_values, code, media_uuid } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/assets", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/assets/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (asset_family_id !== undefined) {
          _payload[`asset_family_id`] = asset_family_id;
        }
        if (attribute_values !== undefined) {
          _payload[`attribute_values`] = JSON.parse(attribute_values);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (media_uuid !== undefined) {
          _payload[`media_uuid`] = media_uuid;
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
products
  .command(`association-types-list`)
  .description(`List association types (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`association-types-create`)
  .description(`Create one of association types`)
  .option(`--code <code>`, ``)
  .option(
    `--is-_quantified [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--is-_two-_way [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, is_quantified, is_two_way, labels } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/association_types`;
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (is_quantified !== undefined) {
          _payload[`is_quantified`] = is_quantified;
        }
        if (is_two_way !== undefined) {
          _payload[`is_two_way`] = is_two_way;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
products
  .command(`association-types-delete`)
  .description(`Delete one of association types by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/association_types", hasLimit: true } },
          ],
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
products
  .command(`association-types-get`)
  .description(`Read one of association types by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/association_types", hasLimit: true } },
          ],
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
products
  .command(`association-types-update`)
  .description(`Update one of association types by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(
    `--is-_quantified [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--is-_two-_way [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, is_quantified, is_two_way, labels } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/association_types", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/association_types/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (is_quantified !== undefined) {
          _payload[`is_quantified`] = is_quantified;
        }
        if (is_two_way !== undefined) {
          _payload[`is_two_way`] = is_two_way;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
products
  .command(`attribute-groups-list`)
  .description(`List attribute groups (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
          [
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_groups`;
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
products
  .command(`attribute-groups-delete`)
  .description(`Delete one of attribute groups by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_groups", hasLimit: true } },
          ],
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
products
  .command(`attribute-groups-get`)
  .description(`Read one of attribute groups by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_groups", hasLimit: true } },
          ],
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
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_groups", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_groups/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
products
  .command(`attribute-options-list`)
  .description(`List attribute options (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`attribute-options-create`)
  .description(`Create one of attribute options`)
  .option(`--attribute-_id <attribute-_id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--swatch <swatch>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { attribute_id, code, labels, position, swatch } = await promptForMissing(
          _options,
          [
            { key: "attribute_id", option: "--attribute-_id <attribute-_id>", name: "attribute_id", type: "string", required: true },
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_options`;
        const _payload: RequestParams = {};
        if (attribute_id !== undefined) {
          _payload[`attribute_id`] = attribute_id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (swatch !== undefined) {
          _payload[`swatch`] = JSON.parse(swatch);
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
products
  .command(`attribute-options-delete`)
  .description(`Delete one of attribute options by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_options", hasLimit: true } },
          ],
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
products
  .command(`attribute-options-get`)
  .description(`Read one of attribute options by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_options", hasLimit: true } },
          ],
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
products
  .command(`attribute-options-update`)
  .description(`Update one of attribute options by id`)
  .option(`--id <id>`, ``)
  .option(`--attribute-_id <attribute-_id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--swatch <swatch>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, attribute_id, code, labels, position, swatch } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attribute_options", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attribute_options/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (attribute_id !== undefined) {
          _payload[`attribute_id`] = attribute_id;
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (swatch !== undefined) {
          _payload[`swatch`] = JSON.parse(swatch);
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
products
  .command(`attributes-list`)
  .description(`List attributes (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`attributes-create`)
  .description(`Create one of attributes`)
  .option(`--code <code>`, ``)
  .option(`--type <type>`, ``)
  .option(`--config <config>`, ``)
  .option(`--entity-_ref <entity-_ref>`, ``)
  .option(`--entity-_type <entity-_type>`, ``)
  .option(`--group-_id <group-_id>`, ``)
  .option(
    `--is-_filterable [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--is-_unique [value]`,
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
    `--usable-_in-_grid [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--validation <validation>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, type, config, entity_ref, entity_type, group_id, is_filterable, is_unique, labels, localizable, position, scopable, usable_in_grid, validation } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
            { key: "type", option: "--type <type>", name: "type", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attributes`;
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (config !== undefined) {
          _payload[`config`] = JSON.parse(config);
        }
        if (entity_ref !== undefined) {
          _payload[`entity_ref`] = entity_ref;
        }
        if (entity_type !== undefined) {
          _payload[`entity_type`] = entity_type;
        }
        if (group_id !== undefined) {
          _payload[`group_id`] = group_id;
        }
        if (is_filterable !== undefined) {
          _payload[`is_filterable`] = is_filterable;
        }
        if (is_unique !== undefined) {
          _payload[`is_unique`] = is_unique;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
        if (usable_in_grid !== undefined) {
          _payload[`usable_in_grid`] = usable_in_grid;
        }
        if (validation !== undefined) {
          _payload[`validation`] = JSON.parse(validation);
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
products
  .command(`attributes-delete`)
  .description(`Delete one of attributes by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attributes", hasLimit: true } },
          ],
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
products
  .command(`attributes-get`)
  .description(`Read one of attributes by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attributes", hasLimit: true } },
          ],
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
products
  .command(`attributes-update`)
  .description(`Update one of attributes by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--config <config>`, ``)
  .option(`--entity-_ref <entity-_ref>`, ``)
  .option(`--entity-_type <entity-_type>`, ``)
  .option(`--group-_id <group-_id>`, ``)
  .option(
    `--is-_filterable [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(
    `--is-_unique [value]`,
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
    `--usable-_in-_grid [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--validation <validation>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, config, entity_ref, entity_type, group_id, is_filterable, is_unique, labels, localizable, position, scopable, type, usable_in_grid, validation } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/attributes", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/attributes/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (config !== undefined) {
          _payload[`config`] = JSON.parse(config);
        }
        if (entity_ref !== undefined) {
          _payload[`entity_ref`] = entity_ref;
        }
        if (entity_type !== undefined) {
          _payload[`entity_type`] = entity_type;
        }
        if (group_id !== undefined) {
          _payload[`group_id`] = group_id;
        }
        if (is_filterable !== undefined) {
          _payload[`is_filterable`] = is_filterable;
        }
        if (is_unique !== undefined) {
          _payload[`is_unique`] = is_unique;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
        if (usable_in_grid !== undefined) {
          _payload[`usable_in_grid`] = usable_in_grid;
        }
        if (validation !== undefined) {
          _payload[`validation`] = JSON.parse(validation);
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
products
  .command(`batch`)
  .description(`Bulk-read products by ids and/or skus — minimal fields incl. tax_class, for cross-app resolution.`)
  .option(`--ids [ids...]`, ``)
  .option(`--skus [skus...]`, ``)
  .action(
    actionRunner(
      async ({ ids, skus }) => {
        const _client = await sdkForProject();
        const _apiPath = `/products/batch`;
        const _payload: RequestParams = {};
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
products
  .command(`categories-list`)
  .description(`List categories (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`categories-create`)
  .description(`Create one of categories`)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--parent-_id <parent-_id>`, ``)
  .option(`--path <path>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--values <values>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, labels, parent_id, path, position, values } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/categories`;
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (parent_id !== undefined) {
          _payload[`parent_id`] = parent_id;
        }
        if (path !== undefined) {
          _payload[`path`] = path;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (values !== undefined) {
          _payload[`values`] = JSON.parse(values);
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
products
  .command(`categories-delete`)
  .description(`Delete one of categories by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/categories", hasLimit: true } },
          ],
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
products
  .command(`categories-get`)
  .description(`Read one of categories by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/categories", hasLimit: true } },
          ],
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
products
  .command(`categories-update`)
  .description(`Update one of categories by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--parent-_id <parent-_id>`, ``)
  .option(`--path <path>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--values <values>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, labels, parent_id, path, position, values } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/categories", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/categories/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (parent_id !== undefined) {
          _payload[`parent_id`] = parent_id;
        }
        if (path !== undefined) {
          _payload[`path`] = path;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (values !== undefined) {
          _payload[`values`] = JSON.parse(values);
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
products
  .command(`families-list`)
  .description(`List families (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`families-create`)
  .description(`Create one of families`)
  .option(`--code <code>`, ``)
  .option(`--image-_attribute <image-_attribute>`, ``)
  .option(`--label-_attribute <label-_attribute>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, image_attribute, label_attribute, labels } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/families`;
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (image_attribute !== undefined) {
          _payload[`image_attribute`] = image_attribute;
        }
        if (label_attribute !== undefined) {
          _payload[`label_attribute`] = label_attribute;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
products
  .command(`families-delete`)
  .description(`Delete one of families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/families", hasLimit: true } },
          ],
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
products
  .command(`families-get`)
  .description(`Read one of families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/families", hasLimit: true } },
          ],
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
products
  .command(`families-update`)
  .description(`Update one of families by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--image-_attribute <image-_attribute>`, ``)
  .option(`--label-_attribute <label-_attribute>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, image_attribute, label_attribute, labels } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/families", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/families/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (image_attribute !== undefined) {
          _payload[`image_attribute`] = image_attribute;
        }
        if (label_attribute !== undefined) {
          _payload[`label_attribute`] = label_attribute;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
products
  .command(`family-attributes-list`)
  .description(`List family attributes (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`family-attributes-create`)
  .description(`Create one of family attributes`)
  .option(`--attribute-_id <attribute-_id>`, ``)
  .option(`--family-_id <family-_id>`, ``)
  .option(
    `--is-_required [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, ``, parseInteger)
  .option(`--required-_channels <required-_channels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { attribute_id, family_id, is_required, position, required_channels } = await promptForMissing(
          _options,
          [
            { key: "attribute_id", option: "--attribute-_id <attribute-_id>", name: "attribute_id", type: "string", required: true },
            { key: "family_id", option: "--family-_id <family-_id>", name: "family_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_attributes`;
        const _payload: RequestParams = {};
        if (attribute_id !== undefined) {
          _payload[`attribute_id`] = attribute_id;
        }
        if (family_id !== undefined) {
          _payload[`family_id`] = family_id;
        }
        if (is_required !== undefined) {
          _payload[`is_required`] = is_required;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (required_channels !== undefined) {
          _payload[`required_channels`] = JSON.parse(required_channels);
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
products
  .command(`family-attributes-delete`)
  .description(`Delete one of family attributes by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_attributes", hasLimit: true } },
          ],
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
products
  .command(`family-attributes-get`)
  .description(`Read one of family attributes by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_attributes", hasLimit: true } },
          ],
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
products
  .command(`family-attributes-update`)
  .description(`Update one of family attributes by id`)
  .option(`--id <id>`, ``)
  .option(`--attribute-_id <attribute-_id>`, ``)
  .option(`--family-_id <family-_id>`, ``)
  .option(
    `--is-_required [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--position <position>`, ``, parseInteger)
  .option(`--required-_channels <required-_channels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, attribute_id, family_id, is_required, position, required_channels } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_attributes", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_attributes/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (attribute_id !== undefined) {
          _payload[`attribute_id`] = attribute_id;
        }
        if (family_id !== undefined) {
          _payload[`family_id`] = family_id;
        }
        if (is_required !== undefined) {
          _payload[`is_required`] = is_required;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (required_channels !== undefined) {
          _payload[`required_channels`] = JSON.parse(required_channels);
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
products
  .command(`family-variants-list`)
  .description(`List family variants (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`family-variants-create`)
  .description(`Create one of family variants`)
  .option(`--code <code>`, ``)
  .option(`--family-_id <family-_id>`, ``)
  .option(`--axes <axes>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, family_id, axes, labels } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
            { key: "family_id", option: "--family-_id <family-_id>", name: "family_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_variants`;
        const _payload: RequestParams = {};
        if (axes !== undefined) {
          _payload[`axes`] = JSON.parse(axes);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (family_id !== undefined) {
          _payload[`family_id`] = family_id;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
products
  .command(`family-variants-delete`)
  .description(`Delete one of family variants by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_variants", hasLimit: true } },
          ],
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
products
  .command(`family-variants-get`)
  .description(`Read one of family variants by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_variants", hasLimit: true } },
          ],
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
products
  .command(`family-variants-update`)
  .description(`Update one of family variants by id`)
  .option(`--id <id>`, ``)
  .option(`--axes <axes>`, ``)
  .option(`--code <code>`, ``)
  .option(`--family-_id <family-_id>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, axes, code, family_id, labels } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/family_variants", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/family_variants/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (axes !== undefined) {
          _payload[`axes`] = JSON.parse(axes);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (family_id !== undefined) {
          _payload[`family_id`] = family_id;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
products
  .command(`measurement-families-list`)
  .description(`List measurement families (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`measurement-families-create`)
  .description(`Create one of measurement families`)
  .option(`--code <code>`, ``)
  .option(`--standard-_unit <standard-_unit>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--units <units>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, standard_unit, labels, units } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
            { key: "standard_unit", option: "--standard-_unit <standard-_unit>", name: "standard_unit", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/measurement_families`;
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (standard_unit !== undefined) {
          _payload[`standard_unit`] = standard_unit;
        }
        if (units !== undefined) {
          _payload[`units`] = JSON.parse(units);
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
products
  .command(`measurement-families-delete`)
  .description(`Delete one of measurement families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/measurement_families", hasLimit: true } },
          ],
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
products
  .command(`measurement-families-get`)
  .description(`Read one of measurement families by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/measurement_families", hasLimit: true } },
          ],
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
products
  .command(`measurement-families-update`)
  .description(`Update one of measurement families by id`)
  .option(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--standard-_unit <standard-_unit>`, ``)
  .option(`--units <units>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, code, labels, standard_unit, units } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/measurement_families", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/measurement_families/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (standard_unit !== undefined) {
          _payload[`standard_unit`] = standard_unit;
        }
        if (units !== undefined) {
          _payload[`units`] = JSON.parse(units);
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
products
  .command(`product-associations-list`)
  .description(`List product associations (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`product-associations-create`)
  .description(`Create one of product associations`)
  .option(`--association-_type-_id <association-_type-_id>`, ``)
  .option(`--product-_id <product-_id>`, ``)
  .option(`--target-_product-_id <target-_product-_id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--quantity <quantity>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { association_type_id, product_id, target_product_id, position, quantity } = await promptForMissing(
          _options,
          [
            { key: "association_type_id", option: "--association-_type-_id <association-_type-_id>", name: "association_type_id", type: "string", required: true },
            { key: "product_id", option: "--product-_id <product-_id>", name: "product_id", type: "string", required: true },
            { key: "target_product_id", option: "--target-_product-_id <target-_product-_id>", name: "target_product_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_associations`;
        const _payload: RequestParams = {};
        if (association_type_id !== undefined) {
          _payload[`association_type_id`] = association_type_id;
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
        if (target_product_id !== undefined) {
          _payload[`target_product_id`] = target_product_id;
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
products
  .command(`product-associations-delete`)
  .description(`Delete one of product associations by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_associations", hasLimit: true } },
          ],
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
products
  .command(`product-associations-get`)
  .description(`Read one of product associations by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_associations", hasLimit: true } },
          ],
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
products
  .command(`product-associations-update`)
  .description(`Update one of product associations by id`)
  .option(`--id <id>`, ``)
  .option(`--association-_type-_id <association-_type-_id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-_id <product-_id>`, ``)
  .option(`--quantity <quantity>`, ``, parseInteger)
  .option(`--target-_product-_id <target-_product-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, association_type_id, position, product_id, quantity, target_product_id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_associations", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_associations/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (association_type_id !== undefined) {
          _payload[`association_type_id`] = association_type_id;
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
        if (target_product_id !== undefined) {
          _payload[`target_product_id`] = target_product_id;
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
products
  .command(`product-categories-list`)
  .description(`List product categories (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`product-categories-create`)
  .description(`Create one of product categories`)
  .option(`--category-_id <category-_id>`, ``)
  .option(`--product-_id <product-_id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { category_id, product_id, position } = await promptForMissing(
          _options,
          [
            { key: "category_id", option: "--category-_id <category-_id>", name: "category_id", type: "string", required: true },
            { key: "product_id", option: "--product-_id <product-_id>", name: "product_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_categories`;
        const _payload: RequestParams = {};
        if (category_id !== undefined) {
          _payload[`category_id`] = category_id;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (product_id !== undefined) {
          _payload[`product_id`] = product_id;
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
products
  .command(`product-categories-delete`)
  .description(`Delete one of product categories by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_categories", hasLimit: true } },
          ],
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
products
  .command(`product-categories-get`)
  .description(`Read one of product categories by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_categories", hasLimit: true } },
          ],
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
products
  .command(`product-categories-update`)
  .description(`Update one of product categories by id`)
  .option(`--id <id>`, ``)
  .option(`--category-_id <category-_id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-_id <product-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, category_id, position, product_id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/product_categories", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/product_categories/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (category_id !== undefined) {
          _payload[`category_id`] = category_id;
        }
        if (position !== undefined) {
          _payload[`position`] = position;
        }
        if (product_id !== undefined) {
          _payload[`product_id`] = product_id;
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
products
  .command(`reference-entities-list`)
  .description(`List reference entities (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
          [
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entities`;
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
products
  .command(`reference-entities-delete`)
  .description(`Delete one of reference entities by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entities", hasLimit: true } },
          ],
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
products
  .command(`reference-entities-get`)
  .description(`Read one of reference entities by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entities", hasLimit: true } },
          ],
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
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entities", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entities/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (image !== undefined) {
          _payload[`image`] = image;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
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
products
  .command(`reference-entity-records-list`)
  .description(`List reference entity records (filter by column; paginate limit/offset/order)`)
  .option(`--limit <limit>`, `Page size (default 50, max 200).`, parseInteger)
  .option(`--offset <offset>`, `Row offset for pagination (default 0).`, parseInteger)
  .option(`--order <order>`, `Sort as 'column.asc' | 'column.desc', e.g. 'created_at.desc'.`)
  .action(
    actionRunner(
      async ({ limit, offset, order }) => {
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
products
  .command(`reference-entity-records-create`)
  .description(`Create one of reference entity records`)
  .option(`--code <code>`, ``)
  .option(`--reference-_entity-_id <reference-_entity-_id>`, ``)
  .option(`--attribute-_values <attribute-_values>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { code, reference_entity_id, attribute_values, labels } = await promptForMissing(
          _options,
          [
            { key: "code", option: "--code <code>", name: "code", type: "string", required: true },
            { key: "reference_entity_id", option: "--reference-_entity-_id <reference-_entity-_id>", name: "reference_entity_id", type: "string", required: true },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entity_records`;
        const _payload: RequestParams = {};
        if (attribute_values !== undefined) {
          _payload[`attribute_values`] = JSON.parse(attribute_values);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (reference_entity_id !== undefined) {
          _payload[`reference_entity_id`] = reference_entity_id;
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
products
  .command(`reference-entity-records-delete`)
  .description(`Delete one of reference entity records by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entity_records", hasLimit: true } },
          ],
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
products
  .command(`reference-entity-records-get`)
  .description(`Read one of reference entity records by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entity_records", hasLimit: true } },
          ],
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
products
  .command(`reference-entity-records-update`)
  .description(`Update one of reference entity records by id`)
  .option(`--id <id>`, ``)
  .option(`--attribute-_values <attribute-_values>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--reference-_entity-_id <reference-_entity-_id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, attribute_values, code, labels, reference_entity_id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products/reference_entity_records", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/reference_entity_records/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (attribute_values !== undefined) {
          _payload[`attribute_values`] = JSON.parse(attribute_values);
        }
        if (code !== undefined) {
          _payload[`code`] = code;
        }
        if (labels !== undefined) {
          _payload[`labels`] = JSON.parse(labels);
        }
        if (reference_entity_id !== undefined) {
          _payload[`reference_entity_id`] = reference_entity_id;
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
products
  .command(`delete`)
  .description(`Delete one of products by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products", hasLimit: true } },
          ],
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
products
  .command(`get`)
  .description(`Read one of products by id`)
  .option(`--id <id>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products", hasLimit: true } },
          ],
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
products
  .command(`update`)
  .description(`Update one of products by id`)
  .option(`--id <id>`, ``)
  .option(`--attribute-_values <attribute-_values>`, ``)
  .option(`--completeness <completeness>`, ``)
  .option(`--deleted-_at <deleted-_at>`, ``)
  .option(
    `--enabled [value]`,
    ``,
    (value: string | undefined) =>
      value === undefined ? true : parseBool(value),
  )
  .option(`--family-_id <family-_id>`, ``)
  .option(`--family-_variant-_id <family-_variant-_id>`, ``)
  .option(`--kind <kind>`, ``)
  .option(`--parent-_id <parent-_id>`, ``)
  .option(`--quantified-_associations <quantified-_associations>`, ``)
  .option(`--sku <sku>`, ``)
  .option(`--tax-_class <tax-_class>`, ``)
  .action(
    actionRunner(
      async (_options, _command) => {
        const { id, attribute_values, completeness, deleted_at, enabled, family_id, family_variant_id, kind, parent_id, quantified_associations, sku, tax_class } = await promptForMissing(
          _options,
          [
            { key: "id", option: "--id <id>", name: "id", type: "string", required: true, resource: { listPath: "/products", hasLimit: true } },
          ],
          _command,
        );
        const _client = await sdkForProject();
        const _apiPath = `/products/{id}`.replace(`{id}`, id);
        const _payload: RequestParams = {};
        if (attribute_values !== undefined) {
          _payload[`attribute_values`] = JSON.parse(attribute_values);
        }
        if (completeness !== undefined) {
          _payload[`completeness`] = JSON.parse(completeness);
        }
        if (deleted_at !== undefined) {
          _payload[`deleted_at`] = deleted_at;
        }
        if (enabled !== undefined) {
          _payload[`enabled`] = enabled;
        }
        if (family_id !== undefined) {
          _payload[`family_id`] = family_id;
        }
        if (family_variant_id !== undefined) {
          _payload[`family_variant_id`] = family_variant_id;
        }
        if (kind !== undefined) {
          _payload[`kind`] = kind;
        }
        if (parent_id !== undefined) {
          _payload[`parent_id`] = parent_id;
        }
        if (quantified_associations !== undefined) {
          _payload[`quantified_associations`] = JSON.parse(quantified_associations);
        }
        if (sku !== undefined) {
          _payload[`sku`] = sku;
        }
        if (tax_class !== undefined) {
          _payload[`tax_class`] = tax_class;
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
