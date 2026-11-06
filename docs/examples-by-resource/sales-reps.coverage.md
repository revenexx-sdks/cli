# sales-reps.coverage

## assignment-roles-list

List the roles this merchant keeps for coverage

```bash
revenexx sales-reps-coverage assignment-roles-list
```

## assignment-roles-create

Add one role

```bash
revenexx sales-reps-coverage assignment-roles-create \
    --code field_sales \
    --title 'Field sales'
```

## assignment-roles-defaults

Seed the roles this app ships

```bash
revenexx sales-reps-coverage assignment-roles-defaults \
    --body '{ "key": "value" }'
```

## assignment-roles-delete

Remove one role

```bash
revenexx sales-reps-coverage assignment-roles-delete \
    --id ''
```

## assignment-roles-get

Read one role

```bash
revenexx sales-reps-coverage assignment-roles-get \
    --id ''
```

## assignment-roles-update

Rename, re-tone or reorder one role

```bash
revenexx sales-reps-coverage assignment-roles-update \
    --id ''
```

## assignments-list

List which rep carries which customer

```bash
revenexx sales-reps-coverage assignments-list
```

## assignments-create

Give one customer to one rep

```bash
revenexx sales-reps-coverage assignments-create \
    --organization-id '' \
    --rep-code VK-04711
```

## assignments-delete

Take one customer off one rep

```bash
revenexx sales-reps-coverage assignments-delete \
    --id ''
```

## assignments-get

Read one assignment

```bash
revenexx sales-reps-coverage assignments-get \
    --id ''
```

## assignments-update

Correct what a rep does for one customer

```bash
revenexx sales-reps-coverage assignments-update \
    --id ''
```

## assignments-make-primary

Make this rep the responsible one for their customer

```bash
revenexx sales-reps-coverage assignments-make-primary \
    --id '' \
    --body '{ "key": "value" }'
```

## vocabularies-list

List the value sets this app owns

```bash
revenexx sales-reps-coverage vocabularies-list
```

## vocabularies-get

Read one value set in full

```bash
revenexx sales-reps-coverage vocabularies-get \
    --name assignment-roles
```
