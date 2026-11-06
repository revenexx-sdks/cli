# customers.organizations

## address-format-list

Read the address type and its countries

```bash
revenexx customers-organizations address-format-list
```

## address-format-get

Read the address rules of one country

```bash
revenexx customers-organizations address-format-get \
    --country AC
```

## addresses-list

Browse the stored postal addresses

```bash
revenexx customers-organizations addresses-list
```

## addresses-create

Add a postal address

```bash
revenexx customers-organizations addresses-create
```

## addresses-delete

Delete an address

```bash
revenexx customers-organizations addresses-delete \
    --id ''
```

## addresses-get

Read one address

```bash
revenexx customers-organizations addresses-get \
    --id ''
```

## addresses-update

Update an address

```bash
revenexx customers-organizations addresses-update \
    --id ''
```

## contact-points-list

Browse where the documents go

```bash
revenexx customers-organizations contact-points-list
```

## contact-points-create

Add a document recipient

```bash
revenexx customers-organizations contact-points-create \
    --kind invoice \
    --organization-id ''
```

## contact-points-delete

Remove a contact point

```bash
revenexx customers-organizations contact-points-delete \
    --id ''
```

## contact-points-get

Read one contact point

```bash
revenexx customers-organizations contact-points-get \
    --id ''
```

## contact-points-update

Update a contact point

```bash
revenexx customers-organizations contact-points-update \
    --id ''
```

## derived-refresh

Recompute the derived columns

```bash
revenexx customers-organizations derived-refresh
```

## organization-metrics-list

Browse what each company has bought

```bash
revenexx customers-organizations organization-metrics-list
```

## organization-metrics-freshness

Check how stale the buying metrics are

```bash
revenexx customers-organizations organization-metrics-freshness
```

## organization-metrics-refresh

Refresh the buying metrics from orders

```bash
revenexx customers-organizations organization-metrics-refresh
```

## organization-metrics-get

Read one company's buying metrics

```bash
revenexx customers-organizations organization-metrics-get \
    --id ''
```

## list

Browse the buying companies

```bash
revenexx customers-organizations list
```

## create

Create an organization

```bash
revenexx customers-organizations create \
    --name 'Beispiel Industrietechnik GmbH'
```

## onboard

Onboard a business customer in one call

```bash
revenexx customers-organizations onboard \
    --name ''
```

## trash-empty

Empty the organization trash

```bash
revenexx customers-organizations trash-empty
```

## delete

Delete an organization

```bash
revenexx customers-organizations delete \
    --id ''
```

## get

Read one organization

```bash
revenexx customers-organizations get \
    --id ''
```

## update

Update an organization

```bash
revenexx customers-organizations update \
    --id ''
```

## block

Block a company from ordering or from delivery

```bash
revenexx customers-organizations block \
    --id '' \
    --reason payment_overdue
```

## care

Read who looks after a company

```bash
revenexx customers-organizations care \
    --id ''
```

## change-credit

Change a company's credit, with a reason

```bash
revenexx customers-organizations change-credit \
    --id '' \
    --reason rating_changed
```

## restore

Restore an organization from the trash

```bash
revenexx customers-organizations restore \
    --id ''
```

## set-account-manager

Name a company's responsible sales rep

```bash
revenexx customers-organizations set-account-manager \
    --id '' \
    --rep-code ''
```

## set-primary-contact

Make a person the company's main contact

```bash
revenexx customers-organizations set-primary-contact \
    --id '' \
    --contact-id ''
```

## unblock-delivery

Lift the delivery block

```bash
revenexx customers-organizations unblock-delivery \
    --id '' \
    --note ''
```

## unblock-order

Lift the order block

```bash
revenexx customers-organizations unblock-order \
    --id '' \
    --note ''
```
