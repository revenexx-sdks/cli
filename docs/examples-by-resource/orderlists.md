# orderlists

## list

List order lists

```bash
revenexx orderlists list
```

## create

Create an order list

```bash
revenexx orderlists create \
    --name 'Weekly office supplies' \
    --owner-id '' \
    --owner-name 'Jamie Rivera'
```

## defaults

Seed the tenant list kinds

```bash
revenexx orderlists defaults
```

## kinds-list

List order list kinds

```bash
revenexx orderlists kinds-list
```

## kinds-create

Add a list kind

```bash
revenexx orderlists kinds-create \
    --code reagents \
    --title 'Reagent list'
```

## kinds-delete

Remove a list kind nothing uses

```bash
revenexx orderlists kinds-delete \
    --id ''
```

## kinds-get

Read one list kind

```bash
revenexx orderlists kinds-get \
    --id ''
```

## kinds-update

Rename a list kind or move it in the order

```bash
revenexx orderlists kinds-update \
    --id ''
```

## kinds-make-default

Make this the default list kind

```bash
revenexx orderlists kinds-make-default \
    --id '' \
    --body '{ "key": "value" }'
```

## vocabularies-list

List vocabularies

```bash
revenexx orderlists vocabularies-list
```

## vocabularies-get

Read one vocabulary

```bash
revenexx orderlists vocabularies-get \
    --name kinds
```

## delete

Delete an order list including its positions

```bash
revenexx orderlists delete \
    --id ''
```

## get

Read one order list with its positions

```bash
revenexx orderlists get \
    --id ''
```

## update

Rename a list, change its visibility or kind

```bash
revenexx orderlists update \
    --id ''
```

## to-cart

Add a list's positions to a cart

```bash
revenexx orderlists to-cart \
    --id ''
```

## transfer-owner

Hand a list to another person of its organization

```bash
revenexx orderlists transfer-owner \
    --id '' \
    --owner-id ''
```

## items-list

List the positions of an order list

```bash
revenexx orderlists items-list \
    --list-id ''
```

## items-create

Add a position to an order list

```bash
revenexx orderlists items-create \
    --list-id '' \
    --name 'Copy paper A4, 80 g/m², white'
```

## items-replace

Replace all positions of a list

```bash
revenexx orderlists items-replace \
    --list-id '' \
    --items one two three
```

## items-delete

Remove a position from an order list

```bash
revenexx orderlists items-delete \
    --list-id '' \
    --id ''
```

## items-get

Read one position

```bash
revenexx orderlists items-get \
    --list-id '' \
    --id ''
```

## items-update

Update a position

```bash
revenexx orderlists items-update \
    --list-id '' \
    --id ''
```
