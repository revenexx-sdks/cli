# customers.value-lists

## address-types-list

The address types this tenant keeps

```bash
revenexx customers-value-lists address-types-list
```

## address-types-create

Add an address type

```bash
revenexx customers-value-lists address-types-create \
    --code '' \
    --title 'Shipping address'
```

## address-types-delete

Remove an address type nothing uses

```bash
revenexx customers-value-lists address-types-delete \
    --id ''
```

## address-types-get

Read one address type

```bash
revenexx customers-value-lists address-types-get \
    --id ''
```

## address-types-update

Rename an address type or move it in the order

```bash
revenexx customers-value-lists address-types-update \
    --id ''
```

## contact-event-kinds-list

The activity types this tenant keeps

```bash
revenexx customers-value-lists contact-event-kinds-list
```

## contact-event-kinds-create

Add an activity type

```bash
revenexx customers-value-lists contact-event-kinds-create \
    --code '' \
    --title 'Phone call'
```

## contact-event-kinds-delete

Remove an activity type nothing uses

```bash
revenexx customers-value-lists contact-event-kinds-delete \
    --id ''
```

## contact-event-kinds-get

Read one activity type

```bash
revenexx customers-value-lists contact-event-kinds-get \
    --id ''
```

## contact-event-kinds-update

Rename an activity type or move it in the order

```bash
revenexx customers-value-lists contact-event-kinds-update \
    --id ''
```

## contact-lifecycle-stages-list

The contact stages this tenant keeps

```bash
revenexx customers-value-lists contact-lifecycle-stages-list
```

## contact-lifecycle-stages-create

Add a contact stage

```bash
revenexx customers-value-lists contact-lifecycle-stages-create \
    --code '' \
    --title Lead
```

## contact-lifecycle-stages-delete

Remove a contact stage nothing uses

```bash
revenexx customers-value-lists contact-lifecycle-stages-delete \
    --id ''
```

## contact-lifecycle-stages-get

Read one contact stage

```bash
revenexx customers-value-lists contact-lifecycle-stages-get \
    --id ''
```

## contact-lifecycle-stages-update

Rename a contact stage or move it in the order

```bash
revenexx customers-value-lists contact-lifecycle-stages-update \
    --id ''
```

## contact-point-kinds-list

The recipient types this tenant keeps

```bash
revenexx customers-value-lists contact-point-kinds-list
```

## contact-point-kinds-create

Add a recipient type

```bash
revenexx customers-value-lists contact-point-kinds-create \
    --code '' \
    --title Invoice
```

## contact-point-kinds-delete

Remove a recipient type nothing uses

```bash
revenexx customers-value-lists contact-point-kinds-delete \
    --id ''
```

## contact-point-kinds-get

Read one recipient type

```bash
revenexx customers-value-lists contact-point-kinds-get \
    --id ''
```

## contact-point-kinds-update

Rename a recipient type or move it in the order

```bash
revenexx customers-value-lists contact-point-kinds-update \
    --id ''
```

## defaults

Seed this tenant's value sets

```bash
revenexx customers-value-lists defaults \
    --body '{ "key": "value" }'
```

## lifecycle-stages-list

The lifecycle stages this tenant keeps

```bash
revenexx customers-value-lists lifecycle-stages-list
```

## lifecycle-stages-create

Add a lifecycle stage

```bash
revenexx customers-value-lists lifecycle-stages-create \
    --code '' \
    --title Customer
```

## lifecycle-stages-delete

Remove a lifecycle stage nothing uses

```bash
revenexx customers-value-lists lifecycle-stages-delete \
    --id ''
```

## lifecycle-stages-get

Read one lifecycle stage

```bash
revenexx customers-value-lists lifecycle-stages-get \
    --id ''
```

## lifecycle-stages-update

Rename a lifecycle stage or move it in the order

```bash
revenexx customers-value-lists lifecycle-stages-update \
    --id ''
```

## payment-terms-list

The payment terms this tenant keeps

```bash
revenexx customers-value-lists payment-terms-list
```

## payment-terms-create

Add a payment term

```bash
revenexx customers-value-lists payment-terms-create \
    --code '' \
    --title 'Net 30 days'
```

## payment-terms-delete

Remove a payment term nothing uses

```bash
revenexx customers-value-lists payment-terms-delete \
    --id ''
```

## payment-terms-get

Read one payment term

```bash
revenexx customers-value-lists payment-terms-get \
    --id ''
```

## payment-terms-update

Rename a payment term or move it in the order

```bash
revenexx customers-value-lists payment-terms-update \
    --id ''
```

## vocabularies-list

List the vocabularies

```bash
revenexx customers-value-lists vocabularies-list
```

## vocabularies-get

Read one vocabulary

```bash
revenexx customers-value-lists vocabularies-get \
    --name address-types
```
