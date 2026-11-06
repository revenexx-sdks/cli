# products

## list

List products

```bash
revenexx products list
```

## create

Create product

```bash
revenexx products create \
    --sku ACME-4711-BLK
```

## batch

Resolve many products at once

```bash
revenexx products batch
```

## grid

Browse the product grid

```bash
revenexx products grid
```

## labels

Resolve product display names

```bash
revenexx products labels
```

## product-associations-list

List product associations

```bash
revenexx products product-associations-list
```

## product-associations-create

Create product association

```bash
revenexx products product-associations-create \
    --association-type-id '' \
    --product-id '' \
    --target-product-id ''
```

## product-associations-delete

Delete product association

```bash
revenexx products product-associations-delete \
    --id ''
```

## product-associations-get

Get product association

```bash
revenexx products product-associations-get \
    --id ''
```

## product-associations-update

Update product association

```bash
revenexx products product-associations-update \
    --id ''
```

## setup

Read the setup checklist

```bash
revenexx products setup
```

## tax-classes-usage

Count the products using a tax class

```bash
revenexx products tax-classes-usage \
    --code reduced
```

## empty-trash

Empty the trash of products

```bash
revenexx products empty-trash
```

## vocabularies-list

List vocabularies

```bash
revenexx products vocabularies-list
```

## vocabularies-get

Get vocabulary

```bash
revenexx products vocabularies-get \
    --name product-kinds
```

## delete

Move product to the trash, or delete it for good

```bash
revenexx products delete \
    --id ''
```

## get

Get product

```bash
revenexx products get \
    --id ''
```

## update

Update product

```bash
revenexx products update \
    --id ''
```

## attribute-set

Set one attribute value on a product

```bash
revenexx products attribute-set \
    --id '' \
    --attribute material \
    --value 
```

## channels-assign

Assign sales channels to a product

```bash
revenexx products channels-assign \
    --id '' \
    --channels webshop-de punchout
```

## completeness

Compute product completeness

```bash
revenexx products completeness \
    --id '' \
    --body '{ "key": "value" }'
```

## copy

Copy a product

```bash
revenexx products copy \
    --id '' \
    --sku ACME-4712-BLK
```

## family-assign

Assign a family to a product

```bash
revenexx products family-assign \
    --id ''
```

## manufacturer-assign

Link a product to a manufacturer

```bash
revenexx products manufacturer-assign \
    --id '' \
    --manufacturer-id ''
```

## restore

Restore product from the trash

```bash
revenexx products restore \
    --id ''
```
