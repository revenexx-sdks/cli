# audiences.audiences

## list

List audiences

```bash
revenexx audiences-audiences list
```

## create

Create an audience

```bash
revenexx audiences-audiences create \
    --code ''
```

## recompute-all

Recompute every active audience under one budget

```bash
revenexx audiences-audiences recompute-all
```

## empty-trash

Empty the audience trash, deleting each one for good

```bash
revenexx audiences-audiences empty-trash
```

## purge

Delete the audiences that outlived the trash retention

```bash
revenexx audiences-audiences purge
```

## delete

Move a audience to the trash, or delete it for good from there

```bash
revenexx audiences-audiences delete \
    --id ''
```

## get

Read one audience

```bash
revenexx audiences-audiences get \
    --id ''
```

## update

Correct an audience

```bash
revenexx audiences-audiences update \
    --id ''
```

## freeze

Freeze an active audience into a new static one

```bash
revenexx audiences-audiences freeze \
    --id ''
```

## preview

Count who would be in an audience, writing nothing

```bash
revenexx audiences-audiences preview \
    --id ''
```

## recompute

Recompute an active audience — chunked, continues where it stopped

```bash
revenexx audiences-audiences recompute \
    --id ''
```

## restore

Bring a audience back out of the trash

```bash
revenexx audiences-audiences restore \
    --id ''
```

## vocabularies-list

List the closed lists this app enforces

```bash
revenexx audiences-audiences vocabularies-list
```

## vocabularies-get

Read one closed list with its values and labels

```bash
revenexx audiences-audiences vocabularies-get \
    --name ''
```
