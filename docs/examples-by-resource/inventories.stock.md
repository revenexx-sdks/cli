# inventories.stock

## inventories-adjust

Correct stock levels in a batch

```bash
revenexx inventories-stock inventories-adjust
```

## availability

Check item availability across locations

```bash
revenexx inventories-stock availability
```

## availability-states-list

List availability states

```bash
revenexx inventories-stock availability-states-list
```

## availability-states-create

Add an availability state

```bash
revenexx inventories-stock availability-states-create \
    --code on_order \
    --title 'On order'
```

## availability-states-delete

Remove an availability state

```bash
revenexx inventories-stock availability-states-delete \
    --id ''
```

## availability-states-get

Read one availability state

```bash
revenexx inventories-stock availability-states-get \
    --id ''
```

## availability-states-update

Rename or re-tone an availability state

```bash
revenexx inventories-stock availability-states-update \
    --id ''
```

## movements-list

List stock movements

```bash
revenexx inventories-stock movements-list
```

## movements-get

Read one movement

```bash
revenexx inventories-stock movements-get \
    --id ''
```

## receive

Goods inbound: +on_hand with a ledger row

```bash
revenexx inventories-stock receive
```

## reorder-alerts

List stock at or below the reorder point

```bash
revenexx inventories-stock reorder-alerts
```

## reorder-scan

Publish a stock_level.low event for each low row

```bash
revenexx inventories-stock reorder-scan \
    --body '{ "key": "value" }'
```

## restock

Returns back to stock: +on_hand with a ledger row

```bash
revenexx inventories-stock restock
```

## list

List stock levels

```bash
revenexx inventories-stock list
```

## create

Create a stock level row

```bash
revenexx inventories-stock create \
    --location-id ''
```

## delete

Delete a stock level row

```bash
revenexx inventories-stock delete \
    --id ''
```

## get

Read one stock level

```bash
revenexx inventories-stock get \
    --id ''
```

## update

Update a stock level row

```bash
revenexx inventories-stock update \
    --id ''
```

## adjust

Correct one stock row

```bash
revenexx inventories-stock adjust \
    --id '' \
    --quantity -3
```

## vocabularies-list

List vocabularies

```bash
revenexx inventories-stock vocabularies-list
```

## vocabularies-get

Read one vocabulary

```bash
revenexx inventories-stock vocabularies-get \
    --name availability-states
```
