# products.categories

## list

List categories

```bash
revenexx products-categories list
```

## create

Create category

```bash
revenexx products-categories create \
    --code cordless_drills
```

## rules-recompute-all

Recompute every category rule

```bash
revenexx products-categories rules-recompute-all \
    --body '{ "key": "value" }'
```

## empty-trash

Empty the trash of categories

```bash
revenexx products-categories empty-trash
```

## rules-preview

Preview a category rule

```bash
revenexx products-categories rules-preview \
    --category-id '' \
    --conditions one two three
```

## rules-recompute

Recompute a category's rule

```bash
revenexx products-categories rules-recompute \
    --category-id ''
```

## delete

Move category to the trash, or delete it for good

```bash
revenexx products-categories delete \
    --id ''
```

## get

Get category

```bash
revenexx products-categories get \
    --id ''
```

## update

Update category

```bash
revenexx products-categories update \
    --id ''
```

## restore

Restore category from the trash

```bash
revenexx products-categories restore \
    --id ''
```

## product-categories-list

List product category memberships

```bash
revenexx products-categories product-categories-list
```

## product-categories-create

Create product category membership

```bash
revenexx products-categories product-categories-create \
    --category-id '' \
    --product-id ''
```

## product-categories-delete

Delete product category membership

```bash
revenexx products-categories product-categories-delete \
    --id ''
```

## product-categories-get

Get product category membership

```bash
revenexx products-categories product-categories-get \
    --id ''
```

## product-categories-update

Update product category membership

```bash
revenexx products-categories product-categories-update \
    --id ''
```

## assign

File a product into a category

```bash
revenexx products-categories assign \
    --id '' \
    --category-id ''
```
