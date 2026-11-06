# sales-reps.roster

## reps-list

List the field sales reps this merchant employs

```bash
revenexx sales-reps-roster reps-list
```

## reps-create

Create one rep

```bash
revenexx sales-reps-roster reps-create \
    --code VK-04711 \
    --name 'Sabine Vogt'
```

## reps-recount

Recount what every rep carries and leads

```bash
revenexx sales-reps-roster reps-recount
```

## reps-delete

Remove one rep, if nothing still names them

```bash
revenexx sales-reps-roster reps-delete \
    --id ''
```

## reps-get

Read one rep

```bash
revenexx sales-reps-roster reps-get \
    --id ''
```

## reps-update

Edit one rep, or deactivate them

```bash
revenexx sales-reps-roster reps-update \
    --id ''
```
