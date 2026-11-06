# mailings.mailings

## list

List mailings

```bash
revenexx mailings-mailings list
```

## create

Write a mailing down as a draft

```bash
revenexx mailings-mailings create \
    --name ''
```

## empty-trash

Empty the mailing trash, deleting each one for good

```bash
revenexx mailings-mailings empty-trash
```

## purge

Delete the mailings that outlived the trash retention

```bash
revenexx mailings-mailings purge
```

## delete

Move a mailing to the trash, or delete it for good from there

```bash
revenexx mailings-mailings delete \
    --id ''
```

## get

Read one mailing

```bash
revenexx mailings-mailings get \
    --id ''
```

## update

Change a mailing

```bash
revenexx mailings-mailings update \
    --id ''
```

## archive

Archive a mailing

```bash
revenexx mailings-mailings archive \
    --id '' \
    --body '{ "key": "value" }'
```

## cancel

Cancel a scheduled or sending mailing

```bash
revenexx mailings-mailings cancel \
    --id '' \
    --body '{ "key": "value" }'
```

## checklist

Read what must be true before a mailing may be scheduled

```bash
revenexx mailings-mailings checklist \
    --id ''
```

## duplicate

Copy a mailing as a new draft

```bash
revenexx mailings-mailings duplicate \
    --id '' \
    --body '{ "key": "value" }'
```

## preview

Render a mailing as one recipient sees it

```bash
revenexx mailings-mailings preview \
    --id ''
```

## reach

Read how many a mailing would reach

```bash
revenexx mailings-mailings reach \
    --id ''
```

## restore

Bring a mailing back out of the trash

```bash
revenexx mailings-mailings restore \
    --id ''
```

## schedule

Schedule a mailing, now or at a time

```bash
revenexx mailings-mailings schedule \
    --id ''
```

## test

Send a mailing to colleagues as a test

```bash
revenexx mailings-mailings test \
    --id ''
```

## unarchive

Take a mailing out of the archive

```bash
revenexx mailings-mailings unarchive \
    --id '' \
    --body '{ "key": "value" }'
```
