# cubes

## list

List Cubes

```bash
revenexx cubes list
```

## create

Create Cube

```bash
revenexx cubes create \
    --cube-id '' \
    --name ''
```

## delete

Delete Cube

```bash
revenexx cubes delete \
    --cube-id ''
```

## get

Get Cube

```bash
revenexx cubes get \
    --cube-id ''
```

## update

Update Cube

```bash
revenexx cubes update \
    --cube-id '' \
    --name ''
```

## list-deployments

List deployments

```bash
revenexx cubes list-deployments \
    --cube-id ''
```

## create-deployment

Create deployment

```bash
revenexx cubes create-deployment \
    --cube-id '' \
    --code 'path/to/file.png'
```

## create-vcs-deployment

Create VCS deployment

```bash
revenexx cubes create-vcs-deployment \
    --cube-id '' \
    --reference '' \
    --type branch
```

## get-deployment

Get deployment

```bash
revenexx cubes get-deployment \
    --cube-id '' \
    --deployment-id ''
```
