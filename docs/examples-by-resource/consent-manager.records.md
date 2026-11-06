# consent-manager.records

## list

List the evidence

```bash
revenexx consent-manager-records list
```

## create

Record one visitor decision

```bash
revenexx consent-manager-records create \
    --action accept_all \
    --consent-id '' \
    --locale de \
    --policy-version-id '' \
    --surface first_layer
```

## history

Read one browser's decisions, oldest first

```bash
revenexx consent-manager-records history \
    --consent-id ''
```

## export

Export the records of a period for a DPO

```bash
revenexx consent-manager-records export
```

## prune

Remove records past their retention (previews by default)

```bash
revenexx consent-manager-records prune
```

## summary

Count decisions per purpose, naming nobody

```bash
revenexx consent-manager-records summary
```

## unlink-contact

Unlink a contact from their records on erasure

```bash
revenexx consent-manager-records unlink-contact \
    --contact-id ''
```

## get

Read one record

```bash
revenexx consent-manager-records get \
    --id ''
```
