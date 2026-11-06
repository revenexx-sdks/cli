# tag-manager.container

## checks-list

List container checks

```bash
revenexx tag-manager-container checks-list
```

## checks-get

Read one container check

```bash
revenexx tag-manager-container checks-get \
    --id ''
```

## versions-list

List container versions

```bash
revenexx tag-manager-container versions-list
```

## versions-get

Read one container version

```bash
revenexx tag-manager-container versions-get \
    --id ''
```

## publish

Publish the container

```bash
revenexx tag-manager-container publish
```

## recheck

Re-check the live containers

```bash
revenexx tag-manager-container recheck \
    --body '{ "key": "value" }'
```

## rollback

Publish an old version again

```bash
revenexx tag-manager-container rollback \
    --container-version 1
```

## status

Show the live containers and their latest check

```bash
revenexx tag-manager-container status
```

## validate

Validate the draft container against the consent policy

```bash
revenexx tag-manager-container validate \
    --body '{ "key": "value" }'
```

## preview-create

Mint a preview token for the draft

```bash
revenexx tag-manager-container preview-create
```
