# ads.syncs

## list

List audience syncs

```bash
revenexx ads-syncs list
```

## create

Sync an audience to an ad account

```bash
revenexx ads-syncs create \
    --ad-account-id '' \
    --audience-id '' \
    --subscription-type ''
```

## delete

Stop syncing an audience

```bash
revenexx ads-syncs delete \
    --id ''
```

## get

Read one audience sync

```bash
revenexx ads-syncs get \
    --id ''
```

## update

Switch a sync on or off or change its consent type

```bash
revenexx ads-syncs update \
    --id ''
```

## members

Read one page of hashed members for the upload

```bash
revenexx ads-syncs members \
    --id ''
```

## request

Request an upload of the audience now

```bash
revenexx ads-syncs request \
    --id '' \
    --body '{ "key": "value" }'
```

## result

Report what an upload achieved

```bash
revenexx ads-syncs result \
    --id ''
```
