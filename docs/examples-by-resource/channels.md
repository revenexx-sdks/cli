# channels

## list

List channels

```bash
revenexx channels list
```

## create

Create a channel

```bash
revenexx channels create \
    --code shop \
    --name Shop
```

## context

Resolve the active channel

```bash
revenexx channels context
```

## defaults

Restore the shipped defaults

```bash
revenexx channels defaults
```

## types-list

The channel types this tenant keeps

```bash
revenexx channels types-list
```

## types-create

Add a channel type

```bash
revenexx channels types-create \
    --code feed \
    --title 'Product feed'
```

## types-delete

Remove a channel type nothing uses

```bash
revenexx channels types-delete \
    --id ''
```

## types-get

Read one channel type

```bash
revenexx channels types-get \
    --id ''
```

## types-update

Rename a channel type or move it in the order

```bash
revenexx channels types-update \
    --id ''
```

## visibility

Decide which rows a channel may see

```bash
revenexx channels visibility \
    --items one two three
```

## vocabularies-list

List vocabularies

```bash
revenexx channels vocabularies-list
```

## vocabularies-get

Read one vocabulary

```bash
revenexx channels vocabularies-get \
    --name statuses
```

## delete

Delete a channel by id

```bash
revenexx channels delete \
    --id ''
```

## get

Read one channel by id

```bash
revenexx channels get \
    --id ''
```

## update

Update a channel by id

```bash
revenexx channels update \
    --id ''
```
