# inventories.reservations

## commit

Commit an order's reservations on shipment

```bash
revenexx inventories-reservations commit \
    --order-ref SO-2026-000123
```

## release

Release an order's reservations

```bash
revenexx inventories-reservations release \
    --order-ref SO-2026-000123
```

## list

List reservations

```bash
revenexx inventories-reservations list
```

## sweep

Release every reservation whose hold has run out

```bash
revenexx inventories-reservations sweep \
    --body '{ "key": "value" }'
```

## get

Read one reservation

```bash
revenexx inventories-reservations get \
    --id ''
```

## reserve

Reserve stock for an order

```bash
revenexx inventories-reservations reserve \
    --order-ref SO-2026-000123
```
