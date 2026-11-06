# customers.segments

## segment-members-list

Browse segment memberships

```bash
revenexx customers-segments segment-members-list
```

## segment-members-create

Put a company into a segment by hand

```bash
revenexx customers-segments segment-members-create \
    --organization-id '' \
    --segment-id ''
```

## segment-members-delete

Take a company out of a segment

```bash
revenexx customers-segments segment-members-delete \
    --id ''
```

## segment-members-get

Read one membership

```bash
revenexx customers-segments segment-members-get \
    --id ''
```

## segment-members-update

Update a membership

```bash
revenexx customers-segments segment-members-update \
    --id ''
```

## list

Browse the customer segments

```bash
revenexx customers-segments list
```

## create

Create a segment

```bash
revenexx customers-segments create
```

## rules-recompute-all

Recompute every ruled segment

```bash
revenexx customers-segments rules-recompute-all \
    --body '{ "key": "value" }'
```

## trash-empty

Empty the segment trash

```bash
revenexx customers-segments trash-empty
```

## delete

Delete a segment

```bash
revenexx customers-segments delete \
    --id ''
```

## get

Read one segment

```bash
revenexx customers-segments get \
    --id ''
```

## update

Update a segment

```bash
revenexx customers-segments update \
    --id ''
```

## restore

Restore a segment from the trash

```bash
revenexx customers-segments restore \
    --id ''
```

## rules-preview

Preview a segment rule

```bash
revenexx customers-segments rules-preview \
    --segment-id '' \
    --conditions one two three
```

## rules-recompute

Recompute one segment's rule memberships

```bash
revenexx customers-segments rules-recompute \
    --segment-id ''
```
