# loyalty.referrals

## codes-list

List referral codes

```bash
revenexx loyalty-referrals codes-list
```

## codes-get

Read one referral code

```bash
revenexx loyalty-referrals codes-get \
    --id ''
```

## codes-deactivate

Retire a referral code

```bash
revenexx loyalty-referrals codes-deactivate \
    --id '' \
    --body '{ "key": "value" }'
```

## list

List referrals

```bash
revenexx loyalty-referrals list
```

## claim

Claim a referral code for a new customer

```bash
revenexx loyalty-referrals claim \
    --code '' \
    --contact-id ''
```

## get

Read one referral

```bash
revenexx loyalty-referrals get \
    --id ''
```

## reject

Reject a referral with a reason

```bash
revenexx loyalty-referrals reject \
    --id '' \
    --reason ''
```

## reward

Issue the referrer reward of a qualified referral again

```bash
revenexx loyalty-referrals reward \
    --id '' \
    --body '{ "key": "value" }'
```
