# products.data-model

## asset-families-list

List asset families

```bash
revenexx products-data-model asset-families-list
```

## asset-families-create

Create asset family

```bash
revenexx products-data-model asset-families-create \
    --code packshots
```

## asset-families-delete

Delete asset family

```bash
revenexx products-data-model asset-families-delete \
    --id ''
```

## asset-families-get

Get asset family

```bash
revenexx products-data-model asset-families-get \
    --id ''
```

## asset-families-update

Update asset family

```bash
revenexx products-data-model asset-families-update \
    --id ''
```

## association-types-list

List association types

```bash
revenexx products-data-model association-types-list
```

## association-types-create

Create association type

```bash
revenexx products-data-model association-types-create \
    --code cross_sell
```

## association-types-delete

Delete association type

```bash
revenexx products-data-model association-types-delete \
    --id ''
```

## association-types-get

Get association type

```bash
revenexx products-data-model association-types-get \
    --id ''
```

## association-types-update

Update association type

```bash
revenexx products-data-model association-types-update \
    --id ''
```

## attribute-schema

Describe a family's fields

```bash
revenexx products-data-model attribute-schema
```

## attribute-groups-list

List attribute groups

```bash
revenexx products-data-model attribute-groups-list
```

## attribute-groups-create

Create attribute group

```bash
revenexx products-data-model attribute-groups-create \
    --code technical_attributes
```

## attribute-groups-delete

Delete attribute group

```bash
revenexx products-data-model attribute-groups-delete \
    --id ''
```

## attribute-groups-get

Get attribute group

```bash
revenexx products-data-model attribute-groups-get \
    --id ''
```

## attribute-groups-update

Update attribute group

```bash
revenexx products-data-model attribute-groups-update \
    --id ''
```

## attribute-options-list

List attribute options

```bash
revenexx products-data-model attribute-options-list
```

## attribute-options-create

Create attribute option

```bash
revenexx products-data-model attribute-options-create \
    --attribute-id '' \
    --code stainless_steel
```

## attribute-options-delete

Delete attribute option

```bash
revenexx products-data-model attribute-options-delete \
    --id ''
```

## attribute-options-get

Get attribute option

```bash
revenexx products-data-model attribute-options-get \
    --id ''
```

## attribute-options-update

Update attribute option

```bash
revenexx products-data-model attribute-options-update \
    --id ''
```

## attributes-list

List attributes

```bash
revenexx products-data-model attributes-list
```

## attributes-create

Create attribute

```bash
revenexx products-data-model attributes-create \
    --code net_weight \
    --type select
```

## attributes-delete

Delete attribute

```bash
revenexx products-data-model attributes-delete \
    --id ''
```

## attributes-get

Get attribute

```bash
revenexx products-data-model attributes-get \
    --id ''
```

## attributes-update

Update attribute

```bash
revenexx products-data-model attributes-update \
    --id ''
```

## defaults-run

Seed the base data model

```bash
revenexx products-data-model defaults-run \
    --body '{ "key": "value" }'
```

## families-list

List families

```bash
revenexx products-data-model families-list
```

## families-create

Create family

```bash
revenexx products-data-model families-create \
    --code power_tools
```

## families-delete

Delete family

```bash
revenexx products-data-model families-delete \
    --id ''
```

## families-get

Get family

```bash
revenexx products-data-model families-get \
    --id ''
```

## families-update

Update family

```bash
revenexx products-data-model families-update \
    --id ''
```

## family-attributes-list

List family attributes

```bash
revenexx products-data-model family-attributes-list
```

## family-attributes-create

Create family attribute

```bash
revenexx products-data-model family-attributes-create \
    --attribute-id '' \
    --family-id ''
```

## family-attributes-delete

Delete family attribute

```bash
revenexx products-data-model family-attributes-delete \
    --id ''
```

## family-attributes-get

Get family attribute

```bash
revenexx products-data-model family-attributes-get \
    --id ''
```

## family-attributes-update

Update family attribute

```bash
revenexx products-data-model family-attributes-update \
    --id ''
```

## family-variants-list

List family variants

```bash
revenexx products-data-model family-variants-list
```

## family-variants-create

Create family variant

```bash
revenexx products-data-model family-variants-create \
    --code clothing_by_colour_size \
    --family-id ''
```

## family-variants-delete

Delete family variant

```bash
revenexx products-data-model family-variants-delete \
    --id ''
```

## family-variants-get

Get family variant

```bash
revenexx products-data-model family-variants-get \
    --id ''
```

## family-variants-update

Update family variant

```bash
revenexx products-data-model family-variants-update \
    --id ''
```

## measurement-families-list

List measurement families

```bash
revenexx products-data-model measurement-families-list
```

## measurement-families-create

Create measurement family

```bash
revenexx products-data-model measurement-families-create \
    --code weight \
    --standard-unit kilogram
```

## measurement-families-delete

Delete measurement family

```bash
revenexx products-data-model measurement-families-delete \
    --id ''
```

## measurement-families-get

Get measurement family

```bash
revenexx products-data-model measurement-families-get \
    --id ''
```

## measurement-families-update

Update measurement family

```bash
revenexx products-data-model measurement-families-update \
    --id ''
```
