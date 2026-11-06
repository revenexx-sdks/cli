# payments.methods

## list

List payment method configurations

```bash
revenexx payments-methods list
```

## create

Create a payment method configuration

```bash
revenexx payments-methods create \
    --code invoice \
    --name Invoice
```

## defaults

Seed the default methods and providers

```bash
revenexx payments-methods defaults
```

## eligible

Resolve the methods eligible for a buyer

```bash
revenexx payments-methods eligible
```

## delete

Delete a payment method configuration

```bash
revenexx payments-methods delete \
    --id ''
```

## get

Read one payment method configuration

```bash
revenexx payments-methods get \
    --id ''
```

## update

Update a payment method configuration

```bash
revenexx payments-methods update \
    --id ''
```

## tax-classes-usage

Count the methods using a tax class

```bash
revenexx payments-methods tax-classes-usage \
    --code reduced
```
