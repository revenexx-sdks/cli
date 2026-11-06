# cost_centers

## budget-changes-list

List BudgetChange

```bash
revenexx cost-centers budget-changes-list
```

## budget-changes-get

Read one budget change

```bash
revenexx cost-centers budget-changes-get \
    --id ''
```

## budgets-list

List Budget

```bash
revenexx cost-centers budgets-list
```

## budgets-create

Create a budget

```bash
revenexx cost-centers budgets-create \
    --cost-center-id '' \
    --name ''
```

## budgets-rollover

Run one budget period rollover pass (idempotent; a rolled period is skipped)

```bash
revenexx cost-centers budgets-rollover
```

## budgets-get

Read one budget

```bash
revenexx cost-centers budgets-get \
    --id ''
```

## budgets-update

Update a budget

```bash
revenexx cost-centers budgets-update \
    --id ''
```

## budgets-adjust

Manually adjust a budget; appends a manual ledger row with an actor

```bash
revenexx cost-centers budgets-adjust \
    --id '' \
    --actor ''
```

## budgets-discard

Discard a draft budget (only its initialized ledger entry, no rollover chain): writes it to zero, stamps it and sets it inactive, and budget.discarded announces it; 409 budget_in_use once anything moved, 409 budget_discarded if already discarded

```bash
revenexx cost-centers budgets-discard \
    --id ''
```

## commit

Commit a direct order against budgets, no reservation (idempotent on order_id); tracking-only centres are skipped; dry_run answers without writing

```bash
revenexx cost-centers commit \
    --allocations one two three
```

## confirm

Confirm a purchase request reservation as an order (idempotent)

```bash
revenexx cost-centers confirm \
    --purchase-request-id ''
```

## contact-limits-list

List ContactLimit

```bash
revenexx cost-centers contact-limits-list
```

## contact-limits-create

Create a contact limit

```bash
revenexx cost-centers contact-limits-create \
    --contact-id ''
```

## contact-limits-delete

Delete a contact limit

```bash
revenexx cost-centers contact-limits-delete \
    --id ''
```

## contact-limits-get

Read one contact limit

```bash
revenexx cost-centers contact-limits-get \
    --id ''
```

## contact-limits-update

Update a contact limit

```bash
revenexx cost-centers contact-limits-update \
    --id ''
```

## cost-centers-list

List CostCenter

```bash
revenexx cost-centers cost-centers-list
```

## cost-centers-create

Create a cost centre

```bash
revenexx cost-centers cost-centers-create \
    --code '' \
    --name '' \
    --organization-id ''
```

## cost-centers-delete

Delete a cost centre

```bash
revenexx cost-centers cost-centers-delete \
    --id ''
```

## cost-centers-get

Read one cost centre

```bash
revenexx cost-centers cost-centers-get \
    --id ''
```

## cost-centers-update

Update a cost centre

```bash
revenexx cost-centers cost-centers-update \
    --id ''
```

## cost-centers-archive

Archive a cost centre: set it inactive so nothing books to it (idempotent). The way out for a centre that ever held a budget, which the store does not let go

```bash
revenexx cost-centers cost-centers-archive \
    --id ''
```

## cost-centers-consume

Spend across a cost centre budget stack in sequence (last may go negative)

```bash
revenexx cost-centers cost-centers-consume \
    --id '' \
    --amount 9.99
```

## evaluate

Evaluate budget-aware conditions (availableBudget, personalLimit) for a spend; refuses a cost centre this punchout session may not book to

```bash
revenexx cost-centers evaluate \
    --amount 9.99
```

## release

Give back the budget booked for a cancelled order (idempotent on key); a closed period is skipped with a zero entry, tracking-only centres are skipped

```bash
revenexx cost-centers release \
    --key '' \
    --order-id ''
```

## reserve

Reserve budget for a purchase request (idempotent on purchase_request_id); tracking-only centres are skipped; dry_run answers without writing

```bash
revenexx cost-centers reserve \
    --allocations one two three
```

## reserve-adjust

Move a held reservation to a new amount; the allocations are its new shape in full (idempotent)

```bash
revenexx cost-centers reserve-adjust \
    --allocations one two three \
    --purchase-request-id ''
```

## restrictions-list

List CostCenterRestriction

```bash
revenexx cost-centers restrictions-list
```

## restrictions-create

Create a restriction

```bash
revenexx cost-centers restrictions-create \
    --cost-center-id '' \
    --parameters '{ "key": "value" }' \
    --type contact
```

## restrictions-delete

Delete a restriction

```bash
revenexx cost-centers restrictions-delete \
    --id ''
```

## restrictions-get

Read one restriction

```bash
revenexx cost-centers restrictions-get \
    --id ''
```

## restrictions-update

Update a restriction

```bash
revenexx cost-centers restrictions-update \
    --id ''
```

## usable

Usable cost centres per line for a buyer (restriction eval incl. punchout + auto-select)

```bash
revenexx cost-centers usable \
    --lines one two three \
    --organization-id ''
```

## vocabularies

List the value sets this app enforces, without their values

```bash
revenexx cost-centers vocabularies
```

## vocabulary

Read one value set with its values, parsed from the constraint the store enforces

```bash
revenexx cost-centers vocabulary \
    --name budget-change-reasons
```

## withdraw

Withdraw a purchase request reservation, crediting budgets back (idempotent)

```bash
revenexx cost-centers withdraw \
    --purchase-request-id ''
```
