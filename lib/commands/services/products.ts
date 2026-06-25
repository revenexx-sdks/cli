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

export const products = new Command("products")
  .description(commandDescriptions["products"] ?? "")
  .configureHelp({
    helpWidth: process.stdout.columns || 80,
  });

products
  .command(`products-list`)
  .description(``)
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
  .command(`products-create`)
  .description(``)
  .requiredOption(`--sku <sku>`, ``)
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
      async ({ sku, attribute_values, completeness, deleted_at, enabled, family_id, family_variant_id, kind, parent_id, quantified_associations, tax_class }) => {
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
  .command(`products-asset-families-list`)
  .description(``)
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
  .command(`products-asset-families-create`)
  .description(``)
  .requiredOption(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--naming-_convention <naming-_convention>`, ``)
  .action(
    actionRunner(
      async ({ code, labels, naming_convention }) => {
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
  .command(`products-asset-families-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-asset-families-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-asset-families-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--naming-_convention <naming-_convention>`, ``)
  .action(
    actionRunner(
      async ({ id, code, labels, naming_convention }) => {
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
  .command(`products-assets-list`)
  .description(``)
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
  .command(`products-assets-create`)
  .description(``)
  .requiredOption(`--asset-_family-_id <asset-_family-_id>`, ``)
  .requiredOption(`--code <code>`, ``)
  .option(`--attribute-_values <attribute-_values>`, ``)
  .option(`--media-_uuid <media-_uuid>`, ``)
  .action(
    actionRunner(
      async ({ asset_family_id, code, attribute_values, media_uuid }) => {
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
  .command(`products-assets-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-assets-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-assets-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--asset-_family-_id <asset-_family-_id>`, ``)
  .option(`--attribute-_values <attribute-_values>`, ``)
  .option(`--code <code>`, ``)
  .option(`--media-_uuid <media-_uuid>`, ``)
  .action(
    actionRunner(
      async ({ id, asset_family_id, attribute_values, code, media_uuid }) => {
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
  .command(`products-association-types-list`)
  .description(``)
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
  .command(`products-association-types-create`)
  .description(``)
  .requiredOption(`--code <code>`, ``)
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
      async ({ code, is_quantified, is_two_way, labels }) => {
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
  .command(`products-association-types-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-association-types-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-association-types-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, code, is_quantified, is_two_way, labels }) => {
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
  .command(`products-attribute-groups-list`)
  .description(``)
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
  .command(`products-attribute-groups-create`)
  .description(``)
  .requiredOption(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .action(
    actionRunner(
      async ({ code, labels, position }) => {
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
  .command(`products-attribute-groups-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-attribute-groups-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-attribute-groups-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .action(
    actionRunner(
      async ({ id, code, labels, position }) => {
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
  .command(`products-attribute-options-list`)
  .description(``)
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
  .command(`products-attribute-options-create`)
  .description(``)
  .requiredOption(`--attribute-_id <attribute-_id>`, ``)
  .requiredOption(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--swatch <swatch>`, ``)
  .action(
    actionRunner(
      async ({ attribute_id, code, labels, position, swatch }) => {
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
  .command(`products-attribute-options-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-attribute-options-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-attribute-options-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--attribute-_id <attribute-_id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--swatch <swatch>`, ``)
  .action(
    actionRunner(
      async ({ id, attribute_id, code, labels, position, swatch }) => {
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
  .command(`products-attributes-list`)
  .description(``)
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
  .command(`products-attributes-create`)
  .description(``)
  .requiredOption(`--code <code>`, ``)
  .requiredOption(`--type <type>`, ``)
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
      async ({ code, type, config, entity_ref, entity_type, group_id, is_filterable, is_unique, labels, localizable, position, scopable, usable_in_grid, validation }) => {
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
  .command(`products-attributes-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-attributes-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-attributes-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, code, config, entity_ref, entity_type, group_id, is_filterable, is_unique, labels, localizable, position, scopable, type, usable_in_grid, validation }) => {
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
  .command(`products-batch`)
  .description(``)
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
  .command(`products-categories-list`)
  .description(``)
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
  .command(`products-categories-create`)
  .description(``)
  .requiredOption(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--parent-_id <parent-_id>`, ``)
  .option(`--path <path>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--values <values>`, ``)
  .action(
    actionRunner(
      async ({ code, labels, parent_id, path, position, values }) => {
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
  .command(`products-categories-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-categories-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-categories-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--parent-_id <parent-_id>`, ``)
  .option(`--path <path>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--values <values>`, ``)
  .action(
    actionRunner(
      async ({ id, code, labels, parent_id, path, position, values }) => {
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
  .command(`products-families-list`)
  .description(``)
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
  .command(`products-families-create`)
  .description(``)
  .requiredOption(`--code <code>`, ``)
  .option(`--image-_attribute <image-_attribute>`, ``)
  .option(`--label-_attribute <label-_attribute>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async ({ code, image_attribute, label_attribute, labels }) => {
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
  .command(`products-families-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-families-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-families-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--image-_attribute <image-_attribute>`, ``)
  .option(`--label-_attribute <label-_attribute>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async ({ id, code, image_attribute, label_attribute, labels }) => {
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
  .command(`products-family-attributes-list`)
  .description(``)
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
  .command(`products-family-attributes-create`)
  .description(``)
  .requiredOption(`--attribute-_id <attribute-_id>`, ``)
  .requiredOption(`--family-_id <family-_id>`, ``)
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
      async ({ attribute_id, family_id, is_required, position, required_channels }) => {
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
  .command(`products-family-attributes-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-family-attributes-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-family-attributes-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, attribute_id, family_id, is_required, position, required_channels }) => {
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
  .command(`products-family-variants-list`)
  .description(``)
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
  .command(`products-family-variants-create`)
  .description(``)
  .requiredOption(`--code <code>`, ``)
  .requiredOption(`--family-_id <family-_id>`, ``)
  .option(`--axes <axes>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async ({ code, family_id, axes, labels }) => {
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
  .command(`products-family-variants-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-family-variants-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-family-variants-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--axes <axes>`, ``)
  .option(`--code <code>`, ``)
  .option(`--family-_id <family-_id>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async ({ id, axes, code, family_id, labels }) => {
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
  .command(`products-measurement-families-list`)
  .description(``)
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
  .command(`products-measurement-families-create`)
  .description(``)
  .requiredOption(`--code <code>`, ``)
  .requiredOption(`--standard-_unit <standard-_unit>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--units <units>`, ``)
  .action(
    actionRunner(
      async ({ code, standard_unit, labels, units }) => {
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
  .command(`products-measurement-families-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-measurement-families-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-measurement-families-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--standard-_unit <standard-_unit>`, ``)
  .option(`--units <units>`, ``)
  .action(
    actionRunner(
      async ({ id, code, labels, standard_unit, units }) => {
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
  .command(`products-product-associations-list`)
  .description(``)
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
  .command(`products-product-associations-create`)
  .description(``)
  .requiredOption(`--association-_type-_id <association-_type-_id>`, ``)
  .requiredOption(`--product-_id <product-_id>`, ``)
  .requiredOption(`--target-_product-_id <target-_product-_id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--quantity <quantity>`, ``, parseInteger)
  .action(
    actionRunner(
      async ({ association_type_id, product_id, target_product_id, position, quantity }) => {
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
  .command(`products-product-associations-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-product-associations-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-product-associations-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--association-_type-_id <association-_type-_id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-_id <product-_id>`, ``)
  .option(`--quantity <quantity>`, ``, parseInteger)
  .option(`--target-_product-_id <target-_product-_id>`, ``)
  .action(
    actionRunner(
      async ({ id, association_type_id, position, product_id, quantity, target_product_id }) => {
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
  .command(`products-product-categories-list`)
  .description(``)
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
  .command(`products-product-categories-create`)
  .description(``)
  .requiredOption(`--category-_id <category-_id>`, ``)
  .requiredOption(`--product-_id <product-_id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .action(
    actionRunner(
      async ({ category_id, product_id, position }) => {
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
  .command(`products-product-categories-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-product-categories-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-product-categories-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--category-_id <category-_id>`, ``)
  .option(`--position <position>`, ``, parseInteger)
  .option(`--product-_id <product-_id>`, ``)
  .action(
    actionRunner(
      async ({ id, category_id, position, product_id }) => {
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
  .command(`products-reference-entities-list`)
  .description(``)
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
  .command(`products-reference-entities-create`)
  .description(``)
  .requiredOption(`--code <code>`, ``)
  .option(`--image <image>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async ({ code, image, labels }) => {
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
  .command(`products-reference-entities-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-reference-entities-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-reference-entities-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--code <code>`, ``)
  .option(`--image <image>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async ({ id, code, image, labels }) => {
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
  .command(`products-reference-entity-records-list`)
  .description(``)
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
  .command(`products-reference-entity-records-create`)
  .description(``)
  .requiredOption(`--code <code>`, ``)
  .requiredOption(`--reference-_entity-_id <reference-_entity-_id>`, ``)
  .option(`--attribute-_values <attribute-_values>`, ``)
  .option(`--labels <labels>`, ``)
  .action(
    actionRunner(
      async ({ code, reference_entity_id, attribute_values, labels }) => {
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
  .command(`products-reference-entity-records-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-reference-entity-records-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-reference-entity-records-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .option(`--attribute-_values <attribute-_values>`, ``)
  .option(`--code <code>`, ``)
  .option(`--labels <labels>`, ``)
  .option(`--reference-_entity-_id <reference-_entity-_id>`, ``)
  .action(
    actionRunner(
      async ({ id, attribute_values, code, labels, reference_entity_id }) => {
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
  .command(`products-delete`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-get`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
  .action(
    actionRunner(
      async ({ id }) => {
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
  .command(`products-update`)
  .description(``)
  .requiredOption(`--id <id>`, ``)
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
      async ({ id, attribute_values, completeness, deleted_at, enabled, family_id, family_variant_id, kind, parent_id, quantified_associations, sku, tax_class }) => {
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
