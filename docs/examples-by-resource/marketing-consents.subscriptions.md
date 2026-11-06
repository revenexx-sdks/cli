# marketing-consents.subscriptions

## confirm

Confirm a sign-up by its link

```bash
revenexx marketing-consents-subscriptions confirm \
    --subscriptions-token '' \
    --purchase-request-id ''
```

## eligibility-check

Ask which recipients may get a marketing send of a type

```bash
revenexx marketing-consents-subscriptions eligibility-check \
    --recipients one two three \
    --subscription-type newsletter
```

## preferences-links

Issue preference centre links for addresses

```bash
revenexx marketing-consents-subscriptions preferences-links \
    --recipients one two three
```

## preferences-get

Read what the preference centre shows

```bash
revenexx marketing-consents-subscriptions preferences-get \
    --subscriptions-token ''
```

## preferences-update

Save what a recipient chose in the preference centre

```bash
revenexx marketing-consents-subscriptions preferences-update \
    --subscriptions-token ''
```

## list

List the subscriptions

```bash
revenexx marketing-consents-subscriptions list
```

## request

Sign an address up for a subscription type

```bash
revenexx marketing-consents-subscriptions request \
    --subscription-type newsletter
```

## get

Read one subscription

```bash
revenexx marketing-consents-subscriptions get \
    --id ''
```

## withdraw

Withdraw a subscription from the back office

```bash
revenexx marketing-consents-subscriptions withdraw \
    --id '' \
    --purchase-request-id ''
```
