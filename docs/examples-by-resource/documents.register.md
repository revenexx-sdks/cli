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

## documents-delete

Remove one document from the register

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
