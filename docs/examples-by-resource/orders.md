# orders

## list

Find orders

```bash
revenexx orders list
```

## migrations-requested-delivery-date

Lift the wanted delivery date into its own field

```bash
revenexx orders migrations-requested-delivery-date
```

## number-ranges-list

List number ranges

```bash
revenexx orders number-ranges-list
```

## number-ranges-create

Create a number range

```bash
revenexx orders number-ranges-create \
    --code order
```

## number-ranges-defaults

Seed the standard number ranges

```bash
revenexx orders number-ranges-defaults
```

## number-ranges-delete

Delete a number range

```bash
revenexx orders number-ranges-delete \
    --id ''
```

## number-ranges-get

Read one number range

```bash
revenexx orders number-ranges-get \
    --id ''
```

## number-ranges-update

Change how a range numbers

```bash
revenexx orders number-ranges-update \
    --id ''
```

## place

Place an order

```bash
revenexx orders place \
    --items one two three
```

## reports-customer-rollup

Roll up order facts per organization

```bash
revenexx orders reports-customer-rollup
```

## return-reasons-list

List the return reasons this tenant keeps

```bash
revenexx orders return-reasons-list
```

## return-reasons-get

Read one return reason

```bash
revenexx orders return-reasons-get \
    --id ''
```

## returns-list

List the returns across all orders

```bash
revenexx orders returns-list
```

## shipments-mark-delivered

Mark a shipment delivered by hand

```bash
revenexx orders shipments-mark-delivered \
    --id ''
```

## vocabularies-list

List the enums this app publishes

```bash
revenexx orders vocabularies-list
```

## vocabularies-get

Read one vocabulary and its values

```bash
revenexx orders vocabularies-get \
    --name cancellation-kinds
```

## get

Read one order with everything on it

```bash
revenexx orders get \
    --id ''
```

## update

Correct an order after placement

```bash
revenexx orders update \
    --id ''
```

## acknowledge

Confirm the ERP has taken the order

```bash
revenexx orders acknowledge \
    --id ''
```

## approve

Approve an order awaiting approval

```bash
revenexx orders approve \
    --id ''
```

## cancel

Cancel the whole order

```bash
revenexx orders cancel \
    --id ''
```

## comments-list

Read the notes on an order

```bash
revenexx orders comments-list \
    --id ''
```

## comments-create

Add a note to an order

```bash
revenexx orders comments-create \
    --id '' \
    --body 'Called the customer, delivery agreed for next week.'
```

## complete

Close the order by hand

```bash
revenexx orders complete \
    --id ''
```

## events-list

Read an order's history

```bash
revenexx orders events-list \
    --id ''
```

## hold

Put an order on hold

```bash
revenexx orders hold \
    --id ''
```

## items-cancel

Cancel quantities off single positions

```bash
revenexx orders items-cancel \
    --id '' \
    --positions one two three
```

## payment-status-update

Tell the order where its money stands

```bash
revenexx orders payment-status-update \
    --id '' \
    --status open
```

## reject

Reject an order awaiting approval

```bash
revenexx orders reject \
    --id '' \
    --reason 'Over the quarterly budget for this cost centre'
```

## return

Register a return

```bash
revenexx orders return \
    --id ''
```

## returnable

Ask what may still be returned

```bash
revenexx orders returnable \
    --id ''
```

## returns-complete

Settle a return in the customer's favour

```bash
revenexx orders returns-complete \
    --id '' \
    --rid ''
```

## returns-receive

Record that returned goods arrived

```bash
revenexx orders returns-receive \
    --id '' \
    --rid '' \
    --body '{ "key": "value" }'
```

## returns-reject

Refuse a return

```bash
revenexx orders returns-reject \
    --id '' \
    --rid ''
```

## ship

Record a shipment

```bash
revenexx orders ship \
    --id ''
```

## shippable

Ask what may still be shipped

```bash
revenexx orders shippable \
    --id ''
```

## unhold

Release a hold

```bash
revenexx orders unhold \
    --id '' \
    --body '{ "key": "value" }'
```
