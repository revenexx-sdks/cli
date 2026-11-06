# procurement

## approval-rules-list

List ApprovalRule

```bash
revenexx procurement approval-rules-list
```

## approval-rules-create

Create a approval rule

```bash
revenexx procurement approval-rules-create \
    --condition always \
    --effect pendingOrder \
    --name ''
```

## approval-rules-delete

Delete a approval rule

```bash
revenexx procurement approval-rules-delete \
    --id ''
```

## approval-rules-get

Read one approval rule

```bash
revenexx procurement approval-rules-get \
    --id ''
```

## approval-rules-update

Update a approval rule

```bash
revenexx procurement approval-rules-update \
    --id ''
```

## budget-releases-list

List BudgetRelease

```bash
revenexx procurement budget-releases-list
```

## budget-releases-get

Read one budget release

```bash
revenexx procurement budget-releases-get \
    --id ''
```

## budget-releases-retry

Retry giving back a cancelled order's budget — from pending or refused (409 otherwise)

```bash
revenexx procurement budget-releases-retry \
    --id ''
```

## budget-releases-settle

Settle a refused budget release by hand, with a note — the budget then stays booked for that order (administrator; 409 unless refused)

```bash
revenexx procurement budget-releases-settle \
    --id '' \
    --note ''
```

## direct-orders-list

List DirectOrder

```bash
revenexx procurement direct-orders-list
```

## direct-orders-get

Read one direct order

```bash
revenexx procurement direct-orders-get \
    --id ''
```

## direct-orders-commit

Retry a direct order's budget commit from the movement recorded at submit — from commit_pending or commit_refused (409 otherwise)

```bash
revenexx procurement direct-orders-commit \
    --id ''
```

## direct-orders-settle

Settle a refused budget commit by hand, with a note — the budget is then never booked for that order (administrator; 409 unless commit_refused)

```bash
revenexx procurement direct-orders-settle \
    --id '' \
    --note ''
```

## purchase-request-items-open

List the lines of open purchase requests that name a product

```bash
revenexx procurement purchase-request-items-open \
    --product-id ''
```

## pending-approvals-list

List PendingApproval

```bash
revenexx procurement pending-approvals-list
```

## pending-approvals-get

Read one pending approval

```bash
revenexx procurement pending-approvals-get \
    --id ''
```

## pending-approvals-approve

Approve one pending approval layer; unlocks the next, or approves the PR when all chains clear

```bash
revenexx procurement pending-approvals-approve \
    --id ''
```

## pending-approvals-decline

Decline one pending approval — terminates the whole purchase request and withdraws its budget

```bash
revenexx procurement pending-approvals-decline \
    --id ''
```

## purchase-request-events-list

List PurchaseRequestEvent

```bash
revenexx procurement purchase-request-events-list
```

## purchase-request-events-get

Read one purchase request outcome event

```bash
revenexx procurement purchase-request-events-get \
    --id ''
```

## purchase-request-items-list

List PurchaseRequestItem

```bash
revenexx procurement purchase-request-items-list
```

## purchase-request-items-create

Create a purchase request item

```bash
revenexx procurement purchase-request-items-create \
    --name '' \
    --purchase-request-id '' \
    --quantity 9.99
```

## purchase-request-items-delete

Delete a purchase request item

```bash
revenexx procurement purchase-request-items-delete \
    --id ''
```

## purchase-request-items-get

Read one purchase request item

```bash
revenexx procurement purchase-request-items-get \
    --id ''
```

## purchase-request-items-update

Update a purchase request item

```bash
revenexx procurement purchase-request-items-update \
    --id ''
```

## purchase-requests-list

List PurchaseRequest

```bash
revenexx procurement purchase-requests-list
```

## purchase-requests-get

Read one purchase request

```bash
revenexx procurement purchase-requests-get \
    --id ''
```

## purchase-requests-update

Update a purchase request

```bash
revenexx procurement purchase-requests-update \
    --id ''
```

## purchase-requests-approve

Super-approve — clear all outstanding approval layers at once and drive the PR to ordered

```bash
revenexx procurement purchase-requests-approve \
    --id ''
```

## purchase-requests-cancel

Cancel a pending purchase request (admin) and withdraw its budget

```bash
revenexx procurement purchase-requests-cancel \
    --id ''
```

## purchase-requests-order

Retry-safe approved→ordered: idempotently place the Order and confirm the budget

```bash
revenexx procurement purchase-requests-order \
    --id ''
```

## reconcile

Reconciliation sweep — complete stuck approved→ordered promotions, release orphaned budget reservations, record any outcome whose write failed, finish direct orders whose budget commit is owed, and retry budget releases of cancelled orders

```bash
revenexx procurement reconcile
```

## submit

Authoritative checkout submit — evaluate approval rules and create a direct Order, a Purchase Request, or block (409)

```bash
revenexx procurement submit \
    --cart-id '' \
    --items one two three
```

## submit-cart

Check out a stored cart by id — read it from carts and submit it as /procurement/submit does, then mark the cart ordered once an Order exists

```bash
revenexx procurement submit-cart \
    --cart-id ''
```

## vocabularies-list

List the enums this app publishes, by name and title, without their values

```bash
revenexx procurement vocabularies-list
```

## vocabularies-get

Read one vocabulary — every permitted value in constraint order, with its title and badge tone; 404 for a name that is not one

```bash
revenexx procurement vocabularies-get \
    --name approval-statuses
```
