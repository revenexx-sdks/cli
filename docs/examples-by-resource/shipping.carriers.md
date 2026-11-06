# shipping.carriers

## list

List the carriers this tenant ships with

```bash
revenexx shipping-carriers list
```

## create

Add a carrier

```bash
revenexx shipping-carriers create \
    --code acme-parcel \
    --name 'Acme Parcel'
```

## catalog

The carrier catalog this app ships with

```bash
revenexx shipping-carriers catalog
```

## defaults

Seed the standard carriers

```bash
revenexx shipping-carriers defaults
```

## delete

Delete a carrier

```bash
revenexx shipping-carriers delete \
    --id ''
```

## get

Read one carrier

```bash
revenexx shipping-carriers get \
    --id ''
```

## update

Update a carrier

```bash
revenexx shipping-carriers update \
    --id ''
```

## tracking

Resolve a tracking link

```bash
revenexx shipping-carriers tracking \
    --carrier acme-parcel
```
