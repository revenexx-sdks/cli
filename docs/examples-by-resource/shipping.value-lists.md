# shipping.value-lists

## service-levels-list

The service levels this tenant keeps

```bash
revenexx shipping-value-lists service-levels-list
```

## service-levels-create

Add a service level

```bash
revenexx shipping-value-lists service-levels-create \
    --code night_courier \
    --title 'Night courier'
```

## service-levels-delete

Remove a service level no carrier uses

```bash
revenexx shipping-value-lists service-levels-delete \
    --id ''
```

## service-levels-get

Read one service level

```bash
revenexx shipping-value-lists service-levels-get \
    --id ''
```

## service-levels-update

Rename a service level or move it in the order

```bash
revenexx shipping-value-lists service-levels-update \
    --id ''
```

## service-levels-make-default

Make this the default service level

```bash
revenexx shipping-value-lists service-levels-make-default \
    --id '' \
    --body '{ "key": "value" }'
```

## vocabularies-list

List vocabularies

```bash
revenexx shipping-value-lists vocabularies-list
```

## vocabularies-get

Read one vocabulary

```bash
revenexx shipping-value-lists vocabularies-get \
    --name carrier-statuses
```

## weight-units-list

The weight units this tenant quotes in

```bash
revenexx shipping-value-lists weight-units-list
```

## weight-units-create

Add a weight unit

```bash
revenexx shipping-value-lists weight-units-create \
    --code t \
    --factor 1000 \
    --title Tonne
```

## weight-units-delete

Remove a weight unit nothing quotes in

```bash
revenexx shipping-value-lists weight-units-delete \
    --id ''
```

## weight-units-get

Read one weight unit

```bash
revenexx shipping-value-lists weight-units-get \
    --id ''
```

## weight-units-update

Rename a weight unit or correct its factor

```bash
revenexx shipping-value-lists weight-units-update \
    --id ''
```

## weight-units-make-base

Make this the base weight unit

```bash
revenexx shipping-value-lists weight-units-make-base \
    --id '' \
    --body '{ "key": "value" }'
```

## weight-units-make-default

Make this the default weight unit

```bash
revenexx shipping-value-lists weight-units-make-default \
    --id '' \
    --body '{ "key": "value" }'
```
