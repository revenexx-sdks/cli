# prices

## check

Explain the price an item gets

```bash
revenexx prices check
```

## lists-list

List price lists

```bash
revenexx prices lists-list
```

## lists-create

Create a price list

```bash
revenexx prices lists-create \
    --code dealer-de \
    --name 'Dealer prices'
```

## lists-defaults

Seed the standard price list

```bash
revenexx prices lists-defaults
```

## lists-empty-trash

Delete every price list in the trash for good

```bash
revenexx prices lists-empty-trash \
    --body '{ "key": "value" }'
```

## lists-delete

Trash a price list, or delete it for good

```bash
revenexx prices lists-delete \
    --id ''
```

## lists-get

Read one price list

```bash
revenexx prices lists-get \
    --id ''
```

## lists-update

Update a price list

```bash
revenexx prices lists-update \
    --id ''
```

## lists-copy

Copy a price list under a new code

```bash
revenexx prices lists-copy \
    --id '' \
    --code dealer-de-2027
```

## lists-restore

Take a price list back out of the trash

```bash
revenexx prices lists-restore \
    --id '' \
    --body '{ "key": "value" }'
```

## entries-list

List price list entries

```bash
revenexx prices entries-list \
    --list-id ''
```

## entries-create

Add a price entry

```bash
revenexx prices entries-create \
    --list-id ''
```

## entries-replace

Replace all entries of a price list

```bash
revenexx prices entries-replace \
    --list-id '' \
    --entries one two three
```

## entries-adjust

Bulk-change the prices of a list

```bash
revenexx prices entries-adjust \
    --list-id ''
```

## entries-bulk

Bulk-upsert price entries

```bash
revenexx prices entries-bulk \
    --list-id '' \
    --entries one two three
```

## entries-ladder

Generate a quantity ladder for one item

```bash
revenexx prices entries-ladder \
    --list-id '' \
    --base-price 9.99
```

## entries-delete

Delete a price entry

```bash
revenexx prices entries-delete \
    --list-id '' \
    --id ''
```

## entries-get

Read one price entry

```bash
revenexx prices entries-get \
    --list-id '' \
    --id ''
```

## entries-update

Update a price entry

```bash
revenexx prices entries-update \
    --list-id '' \
    --id ''
```

## lists-make-default

Move the default flag to this price list

```bash
revenexx prices lists-make-default \
    --list-id '' \
    --body '{ "key": "value" }'
```

## resolve

Resolve prices for a buyer context

```bash
revenexx prices resolve \
    --items one two three
```

## vocabularies-list

List vocabularies

```bash
revenexx prices vocabularies-list
```

## vocabularies-get

Read one vocabulary

```bash
revenexx prices vocabularies-get \
    --name list-statuses
```
