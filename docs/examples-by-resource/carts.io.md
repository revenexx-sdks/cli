# carts.io

## export-all

Export many carts through one profile

```bash
revenexx carts-io export-all
```

## import

Import a cart from JSON, CSV or Excel

```bash
revenexx carts-io import
```

## fields

List the fields a profile can map

```bash
revenexx carts-io fields
```

## profiles-list

List import/export profiles

```bash
revenexx carts-io profiles-list
```

## profiles-create

Create an import/export profile

```bash
revenexx carts-io profiles-create \
    --direction import \
    --name cart-export-csv
```

## profiles-defaults

Seed the bundled profile templates

```bash
revenexx carts-io profiles-defaults
```

## profiles-delete

Delete an import/export profile

```bash
revenexx carts-io profiles-delete \
    --id ''
```

## profiles-get

Read one import/export profile

```bash
revenexx carts-io profiles-get \
    --id ''
```

## profiles-update

Update an import/export profile

```bash
revenexx carts-io profiles-update \
    --id ''
```

## profiles-copy

Copy an import/export profile

```bash
revenexx carts-io profiles-copy \
    --id '' \
    --name my-cart-import
```

## export

Export a cart as JSON, CSV or Excel

```bash
revenexx carts-io export \
    --id ''
```
