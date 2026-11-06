# customers.leads

## consent-mirror-run

Bring the marketing consent flag up to date

```bash
revenexx customers-leads consent-mirror-run
```

## contacts-handover

Hand a lead to a sales rep

```bash
revenexx customers-leads contacts-handover \
    --contact-id '' \
    --owner-id AD-07
```

## contacts-lifecycle

Move a person to another funnel stage

```bash
revenexx customers-leads contacts-lifecycle \
    --contact-id '' \
    --stage mql
```
