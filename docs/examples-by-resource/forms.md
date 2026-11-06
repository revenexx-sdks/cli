# forms

## list

List forms

```bash
revenexx forms list
```

## create

Create a form

```bash
revenexx forms create \
    --name 'Price request' \
    --slug price-request
```

## defaults

Seed the sample contact form

```bash
revenexx forms defaults
```

## submissions-list

List submissions

```bash
revenexx forms submissions-list
```

## submissions-create

Record a submission

```bash
revenexx forms submissions-create \
    --submission-data '{ "key": "value" }' \
    --form-id ''
```

## submissions-prune

Prune submissions past retention

```bash
revenexx forms submissions-prune
```

## submissions-delete

Delete a submission

```bash
revenexx forms submissions-delete \
    --id ''
```

## submissions-get

Read one submission

```bash
revenexx forms submissions-get \
    --id ''
```

## submissions-update

Update a submission

```bash
revenexx forms submissions-update \
    --id ''
```

## vocabularies-list

List vocabularies

```bash
revenexx forms vocabularies-list
```

## vocabularies-get

Read one vocabulary

```bash
revenexx forms vocabularies-get \
    --name form-statuses
```

## delete

Delete a form

```bash
revenexx forms delete \
    --id ''
```

## get

Read one form

```bash
revenexx forms get \
    --id ''
```

## update

Update a form

```bash
revenexx forms update \
    --id ''
```
