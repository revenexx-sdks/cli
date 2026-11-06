# reviews.moderation

## publish

Publish a review

```bash
revenexx reviews-moderation publish \
    --id '' \
    --body '{ "key": "value" }'
```

## reject

Reject a review, or take a published one down

```bash
revenexx reviews-moderation reject \
    --id '' \
    --reason ''
```

## reply

Answer a review publicly, or remove the answer

```bash
revenexx reviews-moderation reply \
    --id ''
```
