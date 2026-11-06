# promotions.vouchers

## batches-list

List code batches

```bash
revenexx promotions-vouchers batches-list
```

## batches-create

Create a code batch

```bash
revenexx promotions-vouchers batches-create \
    --name '' \
    --promotion-id ''
```

## batches-delete

Delete a batch

```bash
revenexx promotions-vouchers batches-delete \
    --id ''
```

## batches-get

Read one batch

```bash
revenexx promotions-vouchers batches-get \
    --id ''
```

## batches-update

Correct a batch

```bash
revenexx promotions-vouchers batches-update \
    --id ''
```

## batches-disable

Switch a batch and every code in it off

```bash
revenexx promotions-vouchers batches-disable \
    --id ''
```

## batches-export

Export a batch codes

```bash
revenexx promotions-vouchers batches-export \
    --id ''
```

## batches-export-file

Export a batch codes as a CSV file

```bash
revenexx promotions-vouchers batches-export-file \
    --id ''
```

## batches-generate

Generate codes into a batch

```bash
revenexx promotions-vouchers batches-generate \
    --id '' \
    --count 1
```

## batches-generate-for

Generate one code per named recipient

```bash
revenexx promotions-vouchers batches-generate-for \
    --id '' \
    --recipients one two three
```

## batches-import

Import existing codes unchanged

```bash
revenexx promotions-vouchers batches-import \
    --id '' \
    --codes one two three
```

## voucher-reservations-list

List code reservations

```bash
revenexx promotions-vouchers voucher-reservations-list
```

## voucher-reservations-create

Hold a code for a buyer

```bash
revenexx promotions-vouchers voucher-reservations-create \
    --voucher-id ''
```

## voucher-reservations-delete

Release a reservation

```bash
revenexx promotions-vouchers voucher-reservations-delete \
    --id ''
```

## voucher-reservations-get

Read one reservation

```bash
revenexx promotions-vouchers voucher-reservations-get \
    --id ''
```

## voucher-reservations-update

Correct a reservation

```bash
revenexx promotions-vouchers voucher-reservations-update \
    --id ''
```

## list

List voucher codes

```bash
revenexx promotions-vouchers list
```

## create

Issue a voucher code

```bash
revenexx promotions-vouchers create \
    --code '' \
    --promotion-id ''
```

## delete

Delete a voucher that was never redeemed

```bash
revenexx promotions-vouchers delete \
    --id ''
```

## get

Read one voucher

```bash
revenexx promotions-vouchers get \
    --id ''
```

## update

Correct a voucher

```bash
revenexx promotions-vouchers update \
    --id ''
```
