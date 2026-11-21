# documents.register

## documents-list

List the documents filed against a transaction

```bash
revenexx documents-register documents-list
```

## documents-create

Record a document, or update the one its source already filed

```bash
revenexx documents-register documents-create \
    --entity-id '' \
    --entity-type order \
    --filename RE-2026-004711.pdf \
    --kind invoice
```

## documents-empty-trash

Delete every document in the trash for good

```bash
revenexx documents-register documents-empty-trash \
    --body '{ "key": "value" }'
```

## documents-purge

Delete for good what outlived the trash retention

```bash
revenexx documents-register documents-purge \
    --body '{ "key": "value" }'
```

## documents-delete

Move one document to the trash, or delete a trashed one for good

```bash
revenexx documents-register documents-delete \
    --id ''
```

## documents-get

Read one document

```bash
revenexx documents-register documents-get \
    --id ''
```

## documents-update

Edit one document

```bash
revenexx documents-register documents-update \
    --id ''
```

## documents-link

Mint a short-lived link to one document's bytes

```bash
revenexx documents-register documents-link \
    --id ''
```

## documents-restore

Take one document back out of the trash

```bash
revenexx documents-register documents-restore \
    --id ''
```
