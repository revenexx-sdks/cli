# sites

## list

List sites

```bash
revenexx sites list
```

## create

Create site

```bash
revenexx sites create \
    --build-runtime node-18.0 \
    --framework analog \
    --name '' \
    --site-id ''
```

## list-frameworks

List frameworks

```bash
revenexx sites list-frameworks
```

## list-specifications

List specifications

```bash
revenexx sites list-specifications
```

## delete

Delete site

```bash
revenexx sites delete \
    --site-id ''
```

## get

Get site

```bash
revenexx sites get \
    --site-id ''
```

## update

Update site

```bash
revenexx sites update \
    --site-id '' \
    --framework analog \
    --name ''
```

## update-site-deployment

Update site's deployment

```bash
revenexx sites update-site-deployment \
    --site-id '' \
    --deployment-id ''
```

## list-deployments

List deployments

```bash
revenexx sites list-deployments \
    --site-id ''
```

## create-deployment

Create deployment

```bash
revenexx sites create-deployment \
    --site-id '' \
    --activate true \
    --code 'path/to/file.png'
```

## create-duplicate-deployment

Create duplicate deployment

```bash
revenexx sites create-duplicate-deployment \
    --site-id '' \
    --deployment-id ''
```

## create-template-deployment

Create template deployment

```bash
revenexx sites create-template-deployment \
    --site-id '' \
    --owner '' \
    --reference '' \
    --repository '' \
    --root-directory '' \
    --type branch
```

## create-vcs-deployment

Create VCS deployment

```bash
revenexx sites create-vcs-deployment \
    --site-id '' \
    --reference main \
    --type branch
```

## delete-deployment

Delete deployment

```bash
revenexx sites delete-deployment \
    --site-id '' \
    --deployment-id ''
```

## get-deployment

Get deployment

```bash
revenexx sites get-deployment \
    --site-id '' \
    --deployment-id ''
```

## get-deployment-download

Get deployment download

```bash
revenexx sites get-deployment-download \
    --site-id '' \
    --deployment-id ''
```

## update-deployment-status

Update deployment status

```bash
revenexx sites update-deployment-status \
    --site-id '' \
    --deployment-id ''
```

## list-logs

List logs

```bash
revenexx sites list-logs \
    --site-id ''
```

## delete-log

Delete log

```bash
revenexx sites delete-log \
    --site-id '' \
    --log-id ''
```

## get-log

Get log

```bash
revenexx sites get-log \
    --site-id '' \
    --log-id ''
```

## list-variables

List variables

```bash
revenexx sites list-variables \
    --site-id ''
```

## create-variable

Create variable

```bash
revenexx sites create-variable \
    --site-id '' \
    --key '' \
    --value ''
```

## delete-variable

Delete variable

```bash
revenexx sites delete-variable \
    --site-id '' \
    --variable-id ''
```

## get-variable

Get variable

```bash
revenexx sites get-variable \
    --site-id '' \
    --variable-id ''
```

## update-variable

Update variable

```bash
revenexx sites update-variable \
    --site-id '' \
    --variable-id '' \
    --key ''
```
