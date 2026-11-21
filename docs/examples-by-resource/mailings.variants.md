# mailings.variants

## list

List A/B variants of mailings

```bash
revenexx mailings-variants list
```

## create

Add an A/B variant to a mailing

```bash
revenexx mailings-variants create \
    --mailing-id ''
```

## delete

Remove an A/B variant

```bash
revenexx mailings-variants delete \
    --id ''
```

## get

Read one variant

```bash
revenexx mailings-variants get \
    --id ''
```

## update

Change an A/B variant

```bash
revenexx mailings-variants update \
    --id ''
```

## win

Pick the winner of an A/B test by hand

```bash
revenexx mailings-variants win \
    --id '' \
    --body '{ "key": "value" }'
```
