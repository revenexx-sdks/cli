# apps

## list

List apps

```bash
revenexx apps list
```

## create

Create app

```bash
revenexx apps create \
    --function-id '' \
    --name '' \
    --runtime node-18.0
```

## list-marketplace

List marketplace apps

```bash
revenexx apps list-marketplace
```

## install-from-marketplace

Install app from marketplace

```bash
revenexx apps install-from-marketplace \
    --name '' \
    --owner ''
```

## rebuild-release

Rebuild app release

```bash
revenexx apps rebuild-release \
    --name '' \
    --apps-version ''
```

## list-runtimes

List app runtimes

```bash
revenexx apps list-runtimes
```

## list-specifications

List app specifications

```bash
revenexx apps list-specifications
```

## list-templates

List app templates

```bash
revenexx apps list-templates
```

## get-template

Get app template

```bash
revenexx apps get-template \
    --template-id ''
```

## list-usage

List apps usage

```bash
revenexx apps list-usage
```

## delete

Delete app

```bash
revenexx apps delete \
    --function-id ''
```

## get

Get app

```bash
revenexx apps get \
    --function-id ''
```

## update

Update app

```bash
revenexx apps update \
    --function-id '' \
    --name ''
```

## update-deployment

Update app active deployment

```bash
revenexx apps update-deployment \
    --function-id '' \
    --deployment-id ''
```

## list-deployments

List app deployments

```bash
revenexx apps list-deployments \
    --function-id ''
```

## create-deployment

Create app deployment

```bash
revenexx apps create-deployment \
    --function-id '' \
    --activate true \
    --code 'path/to/file.png'
```

## create-duplicate-deployment

Create app duplicate deployment

```bash
revenexx apps create-duplicate-deployment \
    --function-id '' \
    --deployment-id ''
```

## create-template-deployment

Create app template deployment

```bash
revenexx apps create-template-deployment \
    --function-id '' \
    --owner '' \
    --reference '' \
    --repository '' \
    --root-directory '' \
    --type commit
```

## create-vcs-deployment

Create app VCS deployment

```bash
revenexx apps create-vcs-deployment \
    --function-id '' \
    --reference main \
    --type branch
```

## delete-deployment

Delete app deployment

```bash
revenexx apps delete-deployment \
    --function-id '' \
    --deployment-id ''
```

## get-deployment

Get app deployment

```bash
revenexx apps get-deployment \
    --function-id '' \
    --deployment-id ''
```

## get-deployment-download

Get app deployment download

```bash
revenexx apps get-deployment-download \
    --function-id '' \
    --deployment-id ''
```

## update-deployment-status

Update app deployment status

```bash
revenexx apps update-deployment-status \
    --function-id '' \
    --deployment-id ''
```

## list-executions

List app executions

```bash
revenexx apps list-executions \
    --function-id ''
```

## create-execution

Create app execution

```bash
revenexx apps create-execution \
    --function-id ''
```

## delete-execution

Delete app execution

```bash
revenexx apps delete-execution \
    --function-id '' \
    --execution-id ''
```

## get-execution

Get app execution

```bash
revenexx apps get-execution \
    --function-id '' \
    --execution-id ''
```

## get-marketplace-status

Get app marketplace status

```bash
revenexx apps get-marketplace-status \
    --function-id ''
```

## unpublish

Unpublish app from Marketplace

```bash
revenexx apps unpublish \
    --function-id ''
```

## publish

Publish app to Marketplace

```bash
revenexx apps publish \
    --function-id ''
```

## list-releases

List app releases

```bash
revenexx apps list-releases \
    --function-id ''
```

## accept-release

Accept app release candidate

```bash
revenexx apps accept-release \
    --function-id ''
```

## get-usage

Get app usage

```bash
revenexx apps get-usage \
    --function-id ''
```

## list-variables

List app variables

```bash
revenexx apps list-variables \
    --function-id ''
```

## create-variable

Create app variable

```bash
revenexx apps create-variable \
    --function-id '' \
    --key '' \
    --value ''
```

## delete-variable

Delete app variable

```bash
revenexx apps delete-variable \
    --function-id '' \
    --variable-id ''
```

## get-variable

Get app variable

```bash
revenexx apps get-variable \
    --function-id '' \
    --variable-id ''
```

## update-variable

Update app variable

```bash
revenexx apps update-variable \
    --function-id '' \
    --variable-id '' \
    --key ''
```

## unpublish-theme

Unpublish theme from Marketplace

```bash
revenexx apps unpublish-theme \
    --site-id ''
```

## publish-theme

Publish theme to Marketplace

```bash
revenexx apps publish-theme \
    --site-id ''
```

## list-theme-releases

List theme releases

```bash
revenexx apps list-theme-releases \
    --site-id ''
```

## accept-theme-release

Accept theme release candidate

```bash
revenexx apps accept-theme-release \
    --site-id ''
```
