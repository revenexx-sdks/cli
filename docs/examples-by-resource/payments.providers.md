# payments.providers

## logos-get

Serve a provider logo

```bash
revenexx payments-providers logos-get \
    --slug stripe
```

## list

List PSP configurations

```bash
revenexx payments-providers list
```

## create

Create a PSP configuration

```bash
revenexx payments-providers create \
    --provider stripe
```

## catalog

List the PSPs that can be configured

```bash
revenexx payments-providers catalog
```

## delete

Delete a PSP configuration

```bash
revenexx payments-providers delete \
    --id ''
```

## get

Read one PSP configuration

```bash
revenexx payments-providers get \
    --id ''
```

## update

Update a PSP configuration

```bash
revenexx payments-providers update \
    --id ''
```

## check

Check a PSP configuration's credentials

```bash
revenexx payments-providers check \
    --id ''
```
