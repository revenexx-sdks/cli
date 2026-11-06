# reviews.requests

## list

List issued review links, without their tokens

```bash
revenexx reviews-requests list
```

## issue

Issue the review link for one completed order and its contact

```bash
revenexx reviews-requests issue \
    --contact-id '' \
    --order-id ''
```

## form

Read what the review form shows for a link

```bash
revenexx reviews-requests form \
    --requests-token ''
```

## submit

Submit reviews through a link

```bash
revenexx reviews-requests submit \
    --requests-token ''
```
