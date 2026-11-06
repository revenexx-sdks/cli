# reviews.reviews

## list

List reviews

```bash
revenexx reviews-reviews list
```

## create

Record a review by hand or from an import

```bash
revenexx reviews-reviews create \
    --product-id '' \
    --rating 1
```

## empty-trash

Empty the review trash, deleting each one for good

```bash
revenexx reviews-reviews empty-trash
```

## purge

Delete the reviews that outlived the trash retention

```bash
revenexx reviews-reviews purge
```

## delete

Move a review to the trash, or delete it for good from there

```bash
revenexx reviews-reviews delete \
    --id ''
```

## get

Read one review

```bash
revenexx reviews-reviews get \
    --id ''
```

## restore

Bring a review back out of the trash

```bash
revenexx reviews-reviews restore \
    --id ''
```
