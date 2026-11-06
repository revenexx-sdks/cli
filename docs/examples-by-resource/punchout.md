# punchout

## accounts-list

List punchout accounts — filter by column, paginate with limit/offset/order

```bash
revenexx punchout accounts-list
```

## accounts-create

Create a punchout account

```bash
revenexx punchout accounts-create \
    --channel-code '' \
    --code '' \
    --name '' \
    --protocol ''
```

## accounts-delete

Delete a punchout account by id

```bash
revenexx punchout accounts-delete \
    --id ''
```

## accounts-get

Read one punchout account by id

```bash
revenexx punchout accounts-get \
    --id ''
```

## accounts-update

Update a punchout account by id — send only the fields that change

```bash
revenexx punchout accounts-update \
    --id ''
```

## accounts-preview

Produce what this account's mappings would hand back for a cart, without handing anything back

```bash
revenexx punchout accounts-preview \
    --id '' \
    --cart-id ''
```

## accounts-probe

Call this account's entry URL from outside and record whether a storefront answers it

```bash
revenexx punchout accounts-probe \
    --id '' \
    --body '{ "key": "value" }'
```

## accounts-test

Send this account one synthetic entry call and answer the protocol's own response

```bash
revenexx punchout accounts-test \
    --id '' \
    --body '{ "key": "value" }'
```

## defaults

Seed this tenant's shipped defaults, idempotently — safe to call on every install and on every retry

```bash
revenexx punchout defaults \
    --body '{ "key": "value" }'
```

## entry-refusals-list

List entry refusals — filter by column, paginate with limit/offset/order

```bash
revenexx punchout entry-refusals-list
```

## entry-cxml

cXML entry — authenticate the sender, read the PunchOutSetupRequest and answer the PunchOutSetupResponse in the same HTTP response

```bash
revenexx punchout entry-cxml \
    --account-code '' \
    --method ''
```

## entry-ids

IDS 2.5 entry on one shared endpoint — six of the seven actions answered, two of them before any credential because the standard sends none with them

```bash
revenexx punchout entry-ids \
    --method ''
```

## entry-oci

OCI 4.0/5.0 entry — authenticate the account, open a punchout session and answer the redirect the buyer follows into the shop

```bash
revenexx punchout entry-oci \
    --account-code '' \
    --method ''
```

## field-mappings-list

List field mappings — filter by column, paginate with limit/offset/order

```bash
revenexx punchout field-mappings-list
```

## field-mappings-create

Create a field mapping

```bash
revenexx punchout field-mappings-create \
    --protocol '' \
    --source '' \
    --target '' \
    --target-kind ''
```

## field-mappings-export

Write one account's mappings back in the old platform's shape

```bash
revenexx punchout field-mappings-export \
    --account-id ''
```

## field-mappings-import

Read an account's mapping configuration off the old platform into this vocabulary

```bash
revenexx punchout field-mappings-import \
    --account-id '' \
    --configuration '{ "key": "value" }'
```

## field-mappings-delete

Delete a field mapping by id

```bash
revenexx punchout field-mappings-delete \
    --id ''
```

## field-mappings-get

Read one field mapping by id

```bash
revenexx punchout field-mappings-get \
    --id ''
```

## field-mappings-update

Update a field mapping by id — send only the fields that change

```bash
revenexx punchout field-mappings-update \
    --id ''
```

## sessions-list

List punchout sessions — filter by column, paginate with limit/offset/order

```bash
revenexx punchout sessions-list
```

## sessions-create

Create a punchout session

```bash
revenexx punchout sessions-create \
    --account-id '' \
    --channel-code '' \
    --expires-at 2026-01-01T12:00:00Z \
    --protocol '' \
    --psid ''
```

## sessions-delete

Delete a punchout session by id

```bash
revenexx punchout sessions-delete \
    --id ''
```

## sessions-get

Read one punchout session by id

```bash
revenexx punchout sessions-get \
    --id ''
```

## sessions-update

Update a punchout session by id — send only the fields that change

```bash
revenexx punchout sessions-update \
    --id ''
```

## sessions-claim

Claim a visit: resolve the buyer to a contact, mint their sign-in secret and answer it once, with the context the shop needs

```bash
revenexx punchout sessions-claim \
    --psid '' \
    --body '{ "key": "value" }'
```

## sessions-ordered

End an IDS visit in an order: confirm with the orders app that its cart was ordered, record the order, close the visit

```bash
revenexx punchout sessions-ordered \
    --psid '' \
    --body '{ "key": "value" }'
```

## sessions-return

Hand the cart back: answer the payload for the buyer's browser to submit, record the transfer, close the visit

```bash
revenexx punchout sessions-return \
    --psid '' \
    --body '{ "key": "value" }'
```

## setup-get

Say which of the setup steps the Cockpit lists are done for this tenant

```bash
revenexx punchout setup-get
```

## transfer-items-list

List transfer lines — filter by column, paginate with limit/offset/order

```bash
revenexx punchout transfer-items-list
```

## transfer-items-create

Create a transfer line

```bash
revenexx punchout transfer-items-create \
    --name '' \
    --quantity 9.99 \
    --transfer-id ''
```

## transfer-items-get

Read one transfer line by id

```bash
revenexx punchout transfer-items-get \
    --id ''
```

## transfers-list

List transfers — filter by column, paginate with limit/offset/order

```bash
revenexx punchout transfers-list
```

## transfers-create

Create a transfer

```bash
revenexx punchout transfers-create \
    --account-id '' \
    --correlation-key '' \
    --protocol '' \
    --session-id ''
```

## transfers-get

Read one transfer by id

```bash
revenexx punchout transfers-get \
    --id ''
```

## transfers-update

Update a transfer by id — send only the fields that change

```bash
revenexx punchout transfers-update \
    --id ''
```

## vocabularies-list

List the vocabularies this app owns — names and titles, without the values

```bash
revenexx punchout vocabularies-list
```

## vocabularies-get

Read one vocabulary in full — every permitted value, with the words a human reads for it

```bash
revenexx punchout vocabularies-get \
    --name auth-strategies
```
