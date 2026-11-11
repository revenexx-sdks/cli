# integrations

## list

List integrations

```bash
revenexx integrations list
```

## create

Create integration

```bash
revenexx integrations create \
    --integration-id '' \
    --name ''
```

## delete

Delete integration

```bash
revenexx integrations delete \
    --integration-id ''
```

## get

Get integration

```bash
revenexx integrations get \
    --integration-id ''
```

## update

Update integration

```bash
revenexx integrations update \
    --integration-id '' \
    --name ''
```

## list-deployments

List deployments

```bash
revenexx integrations list-deployments \
    --integration-id ''
```

## create-deployment

Create deployment

```bash
revenexx integrations create-deployment \
    --integration-id '' \
    --code 'path/to/file.png'
```

## create-vcs-deployment

Create VCS deployment

```bash
revenexx integrations create-vcs-deployment \
    --integration-id '' \
    --reference '' \
    --type branch
```

## get-deployment

Get deployment

```bash
revenexx integrations get-deployment \
    --integration-id '' \
    --deployment-id ''
```

## list-releases

List integration releases

```bash
revenexx integrations list-releases \
    --integration-id ''
```

## accept-release

Accept integration release candidate

```bash
revenexx integrations accept-release \
    --integration-id ''
```

## rebuild-release

Rebuild integration release

```bash
revenexx integrations rebuild-release \
    --integration-id '' \
    --integrations-version ''
```
