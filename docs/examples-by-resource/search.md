# search

## list-collections

List the tenant's collections

```bash
revenexx search list-collections
```

## get-collection

Get a collection's schema

```bash
revenexx search get-collection \
    --collection categories
```

## search-documents-get

Search a collection (query parameters)

```bash
revenexx search search-documents-get \
    --collection categories
```

## search-documents

Search a collection

```bash
revenexx search search-documents \
    --collection categories
```

## get-document

Get a document

```bash
revenexx search get-document \
    --collection categories \
    --document-id ''
```

## events

Report what a shopper did with a result

```bash
revenexx search events \
    --collection '' \
    --type click
```

## gateway-facet-resync

Re-sync the tenant's dynamic `attrs.<code>` facet fields

```bash
revenexx search gateway-facet-resync
```

## multi-search

Federated multi-search

```bash
revenexx search multi-search \
    --searches one two three
```

## query

View-based search

```bash
revenexx search query \
    --collection ''
```

## suggest

Quick search over several collections

```bash
revenexx search suggest \
    --q ''
```
