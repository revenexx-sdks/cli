# markets

## list

List markets

```bash
revenexx markets list
```

## create

Create a market

```bash
revenexx markets create \
    --code northwind \
    --name Northwind
```

## defaults

Store the settings this app needs stored

```bash
revenexx markets defaults \
    --body '{ "key": "value" }'
```

## locale-policy

Read the tenant-wide locale policy

```bash
revenexx markets locale-policy
```

## setup

Read the setup checklist

```bash
revenexx markets setup
```

## vocabularies

List vocabularies

```bash
revenexx markets vocabularies
```

## vocabulary

Read one vocabulary with its values

```bash
revenexx markets vocabulary \
    --name market-statuses
```

## delete

Delete a market by id

```bash
revenexx markets delete \
    --id ''
```

## get

Read one market by id

```bash
revenexx markets get \
    --id ''
```

## update

Update a market by id

```bash
revenexx markets update \
    --id ''
```

## backfill

Fill a market's gaps from another market

```bash
revenexx markets backfill \
    --id northwind \
    --source northwind
```

## clone

Clone a market

```bash
revenexx markets clone \
    --id northwind \
    --code northwind_b2b
```

## confirm-ship-from

Confirm the ship-from country of a market

```bash
revenexx markets confirm-ship-from \
    --id northwind \
    --body '{ "key": "value" }'
```

## context

Resolve the full market context

```bash
revenexx markets context \
    --id ''
```

## make-default

Make this market the tenant default

```bash
revenexx markets make-default \
    --id northwind \
    --body '{ "key": "value" }'
```

## readiness

Check whether a market can trade

```bash
revenexx markets readiness \
    --id northwind
```

## currencies-list

List currencies of a market

```bash
revenexx markets currencies-list \
    --market-id ''
```

## currencies-create

Create a currency of a market

```bash
revenexx markets currencies-create \
    --market-id '' \
    --code EUR
```

## currencies-delete

Delete a currency of a market by id

```bash
revenexx markets currencies-delete \
    --market-id '' \
    --id ''
```

## currencies-get

Read one currency of a market by id

```bash
revenexx markets currencies-get \
    --market-id '' \
    --id ''
```

## currencies-update

Update a currency of a market by id

```bash
revenexx markets currencies-update \
    --market-id '' \
    --id ''
```

## locales-list

List locales of a market

```bash
revenexx markets locales-list \
    --market-id ''
```

## locales-create

Create a locale of a market

```bash
revenexx markets locales-create \
    --market-id '' \
    --code de-DE
```

## locales-delete

Delete a locale of a market by id

```bash
revenexx markets locales-delete \
    --market-id '' \
    --id ''
```

## locales-get

Read one locale of a market by id

```bash
revenexx markets locales-get \
    --market-id '' \
    --id ''
```

## locales-update

Update a locale of a market by id

```bash
revenexx markets locales-update \
    --market-id '' \
    --id ''
```

## tax-classes-list

List tax classes of a market

```bash
revenexx markets tax-classes-list \
    --market-id ''
```

## tax-classes-create

Create a tax class of a market

```bash
revenexx markets tax-classes-create \
    --market-id '' \
    --code standard \
    --name 'Standard rate'
```

## tax-classes-delete

Delete a tax class of a market by id

```bash
revenexx markets tax-classes-delete \
    --market-id '' \
    --id ''
```

## tax-classes-get

Read one tax class of a market by id

```bash
revenexx markets tax-classes-get \
    --market-id '' \
    --id ''
```

## tax-classes-update

Update a tax class of a market by id

```bash
revenexx markets tax-classes-update \
    --market-id '' \
    --id ''
```
