# quotes.pricing

## expire

Expire what has run out

```bash
revenexx quotes-pricing expire \
    --body '{ "key": "value" }'
```

## remove-item

Take a position off a quote being shaped

```bash
revenexx quotes-pricing remove-item \
    --id '' \
    --body '{ "key": "value" }'
```

## follow-up

Set the day the desk looks at a quote again

```bash
revenexx quotes-pricing follow-up \
    --id ''
```

## add-item

Add a position to a quote being shaped

```bash
revenexx quotes-pricing add-item \
    --id ''
```

## item

Price one position

```bash
revenexx quotes-pricing item \
    --id '' \
    --item-id ''
```

## price

Put prices on a quote

```bash
revenexx quotes-pricing price \
    --id ''
```

## review

Take a request onto the desk

```bash
revenexx quotes-pricing review \
    --id ''
```

## remind

Remind the buyer of a sent quote

```bash
revenexx quotes-pricing remind \
    --id '' \
    --body '{ "key": "value" }'
```
