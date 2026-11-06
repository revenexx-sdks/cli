# customers.contacts

## contact-events-list

Browse the customer activity timeline

```bash
revenexx customers-contacts contact-events-list
```

## contact-events-get

Read one timeline entry

```bash
revenexx customers-contacts contact-events-get \
    --id ''
```

## list

Browse the people at the buying companies

```bash
revenexx customers-contacts list
```

## create

Create a contact

```bash
revenexx customers-contacts create \
    --email einkauf@example.com
```

## trash-empty

Empty the contact trash

```bash
revenexx customers-contacts trash-empty
```

## events-create

Log an activity on a contact

```bash
revenexx customers-contacts events-create \
    --contact-id '' \
    --subject 'Called about the annual requirement'
```

## identity

Give a contact the login it has none of

```bash
revenexx customers-contacts identity \
    --contact-id ''
```

## invite

Invite a contact into their company

```bash
revenexx customers-contacts invite \
    --contact-id ''
```

## permissions

Read a contact's effective permissions

```bash
revenexx customers-contacts permissions \
    --contact-id ''
```

## registrations-approve

Approve a pending registration

```bash
revenexx customers-contacts registrations-approve \
    --contact-id ''
```

## registrations-reject

Reject a pending registration

```bash
revenexx customers-contacts registrations-reject \
    --contact-id '' \
    --reason 'Could not be verified as a commercial buyer.'
```

## reinvite

Send a shop invitation again

```bash
revenexx customers-contacts reinvite \
    --contact-id ''
```

## restore-access

Give a person's shop access back

```bash
revenexx customers-contacts restore-access \
    --contact-id ''
```

## revoke-access

Revoke a person's shop access

```bash
revenexx customers-contacts revoke-access \
    --contact-id '' \
    --reason left_company
```

## delete

Delete a contact

```bash
revenexx customers-contacts delete \
    --id ''
```

## get

Read one contact

```bash
revenexx customers-contacts get \
    --id ''
```

## update

Update a contact

```bash
revenexx customers-contacts update \
    --id ''
```

## erase

Erase personal data

```bash
revenexx customers-contacts erase \
    --id ''
```

## restore

Restore a contact from the trash

```bash
revenexx customers-contacts restore \
    --id ''
```

## organizations-events-create

Log an activity from the company page

```bash
revenexx customers-contacts organizations-events-create \
    --organization-id '' \
    --contact-id '' \
    --subject 'Called about the annual requirement'
```
