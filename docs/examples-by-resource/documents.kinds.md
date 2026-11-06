# documents.kinds

## list

List the document kinds this merchant keeps

```bash
revenexx documents-kinds list
```

## create

Add a document kind of your own

```bash
revenexx documents-kinds create \
    --code invoice \
    --title Invoice
```

## defaults

Seed the four document kinds an order produces

```bash
revenexx documents-kinds defaults \
    --body '{ "key": "value" }'
```

## delete

Remove one document kind

```bash
revenexx documents-kinds delete \
    --id ''
```

## get

Read one document kind

```bash
revenexx documents-kinds get \
    --id ''
```

## update

Edit one document kind

```bash
revenexx documents-kinds update \
    --id ''
```

## make-default

Make one document kind the default

```bash
revenexx documents-kinds make-default \
    --id ''
```

## vocabularies-list

List the vocabularies this app owns

```bash
revenexx documents-kinds vocabularies-list
```

## vocabularies-get

Read one vocabulary with its values

```bash
revenexx documents-kinds vocabularies-get \
    --name kinds
```
