# shipping.methods

## list

List shipping method configurations

```bash
revenexx shipping-methods list
```

## create

Create a shipping method

```bash
revenexx shipping-methods create \
    --code express \
    --name 'Express delivery'
```

## defaults

Seed the standard shipping methods

```bash
revenexx shipping-methods defaults
```

## delete

Delete a shipping method

```bash
revenexx shipping-methods delete \
    --id ''
```

## get

Read one shipping method

```bash
revenexx shipping-methods get \
    --id ''
```

## update

Update a shipping method

```bash
revenexx shipping-methods update \
    --id ''
```

## tiers-list

List a method's matrix tiers

```bash
revenexx shipping-methods tiers-list \
    --method-id ''
```

## tiers-create

Add a matrix tier

```bash
revenexx shipping-methods tiers-create \
    --method-id ''
```

## tiers-replace

Replace a method's matrix tiers

```bash
revenexx shipping-methods tiers-replace \
    --method-id '' \
    --tiers one two three
```

## tiers-ladder

Generate an evenly-stepped tier table

```bash
revenexx shipping-methods tiers-ladder \
    --method-id '' \
    --base-price 4.9 \
    --step 5 \
    --to-value 30
```

## tiers-delete

Delete a matrix tier

```bash
revenexx shipping-methods tiers-delete \
    --method-id '' \
    --id ''
```

## tiers-get

Read one matrix tier

```bash
revenexx shipping-methods tiers-get \
    --method-id '' \
    --id ''
```

## tiers-update

Update a matrix tier

```bash
revenexx shipping-methods tiers-update \
    --method-id '' \
    --id ''
```

## rates

Resolve the shipping rates for a basket

```bash
revenexx shipping-methods rates
```

## tax-classes-usage

Count the methods using a tax class

```bash
revenexx shipping-methods tax-classes-usage \
    --code reduced
```
