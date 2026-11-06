# marketing-consents.types

## consent-texts-list

List the consent texts and their versions

```bash
revenexx marketing-consents-types consent-texts-list
```

## consent-texts-create

Write a new draft version of a consent text

```bash
revenexx marketing-consents-types consent-texts-create \
    --locale de \
    --subscription-type-id '' \
    --wording 'Ja, ich möchte den Newsletter mit Neuheiten und Aktionen erhalten. Abmeldung jederzeit über den Link in jeder Mail.'
```

## consent-texts-empty-trash

Empty the consent text trash, deleting each one for good

```bash
revenexx marketing-consents-types consent-texts-empty-trash
```

## consent-texts-purge

Delete the consent texts that outlived the trash retention

```bash
revenexx marketing-consents-types consent-texts-purge
```

## consent-texts-delete

Move a consent text to the trash, or delete it for good from there

```bash
revenexx marketing-consents-types consent-texts-delete \
    --id ''
```

## consent-texts-get

Read one consent text

```bash
revenexx marketing-consents-types consent-texts-get \
    --id ''
```

## consent-texts-update

Edit a draft consent text

```bash
revenexx marketing-consents-types consent-texts-update \
    --id '' \
    --wording 'Ja, ich möchte den Newsletter mit Neuheiten und Aktionen erhalten. Abmeldung jederzeit über den Link in jeder Mail.'
```

## consent-texts-publish

Publish a consent text version

```bash
revenexx marketing-consents-types consent-texts-publish \
    --id '' \
    --body '{ "key": "value" }'
```

## consent-texts-restore

Bring a consent text back out of the trash

```bash
revenexx marketing-consents-types consent-texts-restore \
    --id ''
```

## subscription-types-list

List the subscription types

```bash
revenexx marketing-consents-types subscription-types-list
```

## subscription-types-create

Create a subscription type

```bash
revenexx marketing-consents-types subscription-types-create \
    --code newsletter \
    --labels '{ "key": "value" }'
```

## subscription-types-empty-trash

Empty the subscription type trash, deleting each one for good

```bash
revenexx marketing-consents-types subscription-types-empty-trash
```

## subscription-types-purge

Delete the subscription types that outlived the trash retention

```bash
revenexx marketing-consents-types subscription-types-purge
```

## subscription-types-delete

Move a subscription type to the trash, or delete it for good from there

```bash
revenexx marketing-consents-types subscription-types-delete \
    --id ''
```

## subscription-types-get

Read one subscription type

```bash
revenexx marketing-consents-types subscription-types-get \
    --id ''
```

## subscription-types-update

Edit a subscription type; its code is fixed

```bash
revenexx marketing-consents-types subscription-types-update \
    --id ''
```

## subscription-types-archive

Archive a subscription type

```bash
revenexx marketing-consents-types subscription-types-archive \
    --id '' \
    --body '{ "key": "value" }'
```

## subscription-types-restore

Bring a subscription type back out of the trash

```bash
revenexx marketing-consents-types subscription-types-restore \
    --id ''
```

## subscription-types-unarchive

Bring an archived subscription type back

```bash
revenexx marketing-consents-types subscription-types-unarchive \
    --id '' \
    --body '{ "key": "value" }'
```

## vocabularies-list

List the value sets this app owns

```bash
revenexx marketing-consents-types vocabularies-list
```

## vocabularies-get

Read one value set with its words

```bash
revenexx marketing-consents-types vocabularies-get \
    --name channels
```
