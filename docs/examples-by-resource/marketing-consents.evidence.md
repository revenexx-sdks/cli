# marketing-consents.evidence

## consent-events-list

List the consent events

```bash
revenexx marketing-consents-evidence consent-events-list
```

## consent-events-get

Read one consent event

```bash
revenexx marketing-consents-evidence consent-events-get \
    --id ''
```

## contacts-get

Read one contact's consent record

```bash
revenexx marketing-consents-evidence contacts-get \
    --contact-id ''
```

## contacts-erase

Erase one contact's consents, keeping minimal proof

```bash
revenexx marketing-consents-evidence contacts-erase \
    --contact-id '' \
    --body '{ "key": "value" }'
```

## contacts-export

Export one contact's consent record for an access request

```bash
revenexx marketing-consents-evidence contacts-export \
    --contact-id ''
```

## imports-list

List the imports

```bash
revenexx marketing-consents-evidence imports-list
```

## imports-create

Import an existing list with its recorded basis

```bash
revenexx marketing-consents-evidence imports-create \
    --legal-basis consent_single \
    --proof-note 'Altsystem Shopware, Double-Opt-in-Log 2019–2026' \
    --rows one two three \
    --subscription-type newsletter
```

## imports-get

Read one import

```bash
revenexx marketing-consents-evidence imports-get \
    --id ''
```

## ip-retention-run

Shorten IP addresses past their retention

```bash
revenexx marketing-consents-evidence ip-retention-run \
    --body '{ "key": "value" }'
```

## lapse-run

Lapse unconfirmed sign-ups past their expiry

```bash
revenexx marketing-consents-evidence lapse-run \
    --body '{ "key": "value" }'
```

## sweep-run

Read what the event bus does not deliver yet

```bash
revenexx marketing-consents-evidence sweep-run \
    --body '{ "key": "value" }'
```
