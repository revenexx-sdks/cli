# products.manufacturers

## list

List manufacturers

```bash
revenexx products-manufacturers list
```

## create

Create manufacturer

```bash
revenexx products-manufacturers create \
    --code paul_horn \
    --country DE \
    --name 'Paul Horn'
```

## migrate

Move free-text manufacturers onto records

```bash
revenexx products-manufacturers migrate
```

## empty-trash

Empty the trash of manufacturers

```bash
revenexx products-manufacturers empty-trash
```

## delete

Move manufacturer to the trash, or delete it for good

```bash
revenexx products-manufacturers delete \
    --id ''
```

## get

Get manufacturer

```bash
revenexx products-manufacturers get \
    --id ''
```

## update

Update manufacturer

```bash
revenexx products-manufacturers update \
    --id ''
```

## gpsr

Check a manufacturer's GPSR data

```bash
revenexx products-manufacturers gpsr \
    --id ''
```

## logo-remove

Remove a manufacturer's logo

```bash
revenexx products-manufacturers logo-remove \
    --id ''
```

## logo-set

Set a manufacturer's logo

```bash
revenexx products-manufacturers logo-set \
    --id ''
```

## products

List the products of a manufacturer

```bash
revenexx products-manufacturers products \
    --id ''
```

## restore

Restore manufacturer from the trash

```bash
revenexx products-manufacturers restore \
    --id ''
```
