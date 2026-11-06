# loyalty.rewards

## redemptions-list

List redeemed rewards

```bash
revenexx loyalty-rewards redemptions-list
```

## redemptions-get

Read one redeemed reward

```bash
revenexx loyalty-rewards redemptions-get \
    --id ''
```

## list

List rewards

```bash
revenexx loyalty-rewards list
```

## create

Add a reward to a points programme

```bash
revenexx loyalty-rewards create \
    --code '' \
    --labels  \
    --points-cost 1 \
    --program-id '' \
    --promotion-id ''
```

## empty-trash

Empty the reward trash, deleting each one for good

```bash
revenexx loyalty-rewards empty-trash
```

## purge

Delete the rewards that outlived the trash retention

```bash
revenexx loyalty-rewards purge
```

## delete

Move a reward to the trash, or delete it for good from there

```bash
revenexx loyalty-rewards delete \
    --id ''
```

## get

Read one reward

```bash
revenexx loyalty-rewards get \
    --id ''
```

## update

Correct a reward

```bash
revenexx loyalty-rewards update \
    --id ''
```

## redeem

Redeem points for a reward voucher

```bash
revenexx loyalty-rewards redeem \
    --id ''
```

## restore

Bring a reward back out of the trash

```bash
revenexx loyalty-rewards restore \
    --id ''
```
