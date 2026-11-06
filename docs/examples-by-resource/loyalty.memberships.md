# loyalty.memberships

## list

List members

```bash
revenexx loyalty-memberships list
```

## create

Enrol a contact or a company

```bash
revenexx loyalty-memberships create \
    --program-id ''
```

## lookup

Read the tier, perks, balance and bonus agreement of a contact or company

```bash
revenexx loyalty-memberships lookup
```

## delete

Delete a membership with no bookings

```bash
revenexx loyalty-memberships delete \
    --id ''
```

## get

Read one membership

```bash
revenexx loyalty-memberships get \
    --id ''
```

## update

Pause, resume or end a membership

```bash
revenexx loyalty-memberships update \
    --id ''
```

## adjust

Correct a member balance by hand

```bash
revenexx loyalty-memberships adjust \
    --id '' \
    --points 1 \
    --reason ''
```

## progress

Read the way of a member to the next tier

```bash
revenexx loyalty-memberships progress \
    --id ''
```

## referral-code

Read or make the referral code of a member

```bash
revenexx loyalty-memberships referral-code \
    --id ''
```
