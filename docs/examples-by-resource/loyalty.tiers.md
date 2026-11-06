# loyalty.tiers

## list

List tiers

```bash
revenexx loyalty-tiers list
```

## create

Add a tier to a programme

```bash
revenexx loyalty-tiers create \
    --code '' \
    --labels  \
    --program-id ''
```

## empty-trash

Empty the tier trash, deleting each one for good

```bash
revenexx loyalty-tiers empty-trash
```

## purge

Delete the tiers that outlived the trash retention

```bash
revenexx loyalty-tiers purge
```

## delete

Move a tier to the trash, or delete it for good from there

```bash
revenexx loyalty-tiers delete \
    --id ''
```

## get

Read one tier

```bash
revenexx loyalty-tiers get \
    --id ''
```

## update

Correct a tier

```bash
revenexx loyalty-tiers update \
    --id ''
```

## restore

Bring a tier back out of the trash

```bash
revenexx loyalty-tiers restore \
    --id ''
```
