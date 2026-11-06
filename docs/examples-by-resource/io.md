# io

## list-bulk-jobs

List bulk jobs for the tenant

```bash
revenexx io list-bulk-jobs
```

## get-bulk-job

Get a bulk job's status

```bash
revenexx io get-bulk-job \
    --id ''
```

## list-io-entities

Catalogue of importable / exportable entities

```bash
revenexx io list-io-entities
```

## create-export

Export a tenant's entity to object storage

```bash
revenexx io create-export \
    --app '' \
    --entity '' \
    --vendor ''
```

## get-export-url

Signed download URL for a finished export

```bash
revenexx io get-export-url \
    --id ''
```

## create-import

Register an uploaded object as an import job

```bash
revenexx io create-import \
    --app '' \
    --entity '' \
    --object-key '' \
    --vendor ''
```

## list-profiles

List the tenant's import/export profiles

```bash
revenexx io list-profiles
```

## create-profile

Create an import/export profile

```bash
revenexx io create-profile \
    --app '' \
    --direction import \
    --entity '' \
    --format '' \
    --name '' \
    --vendor ''
```

## delete-profile

Delete an import/export profile

```bash
revenexx io delete-profile \
    --id ''
```

## show-profile

Get one import/export profile

```bash
revenexx io show-profile \
    --id ''
```

## update-profile

Update an import/export profile

```bash
revenexx io update-profile \
    --id '' \
    --app '' \
    --direction import \
    --entity '' \
    --format '' \
    --name '' \
    --vendor ''
```

## run-profile

Run a saved profile (on-click import/export)

```bash
revenexx io run-profile \
    --id ''
```

## create-upload

Mint a tenant-scoped signed upload URL

```bash
revenexx io create-upload
```
