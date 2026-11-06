# storage

## asset-index

List assets

```bash
revenexx storage asset-index
```

## asset-store

Upload an asset

```bash
revenexx storage asset-store \
    --file 'path/to/file.png'
```

## asset-bulk

Upload several assets

```bash
revenexx storage asset-bulk
```

## asset-destroy

Delete an asset

```bash
revenexx storage asset-destroy \
    --id ''
```

## asset-show

Get an asset

```bash
revenexx storage asset-show \
    --id ''
```

## asset-update

Update an asset

```bash
revenexx storage asset-update \
    --id ''
```

## asset-download

Download an asset

```bash
revenexx storage asset-download \
    --id ''
```

## asset-permanent

Permanently delete an asset

```bash
revenexx storage asset-permanent \
    --id ''
```

## asset-reprocess

Reprocess an asset

```bash
revenexx storage asset-reprocess \
    --id ''
```

## asset-restore

Restore a deleted asset

```bash
revenexx storage asset-restore \
    --id ''
```

## asset-sign

Create a signed asset URL

```bash
revenexx storage asset-sign \
    --id ''
```

## asset-unpack

Unpack an archive asset

```bash
revenexx storage asset-unpack \
    --id ''
```

## folder-index

List folders

```bash
revenexx storage folder-index
```

## folder-store

Create a folder

```bash
revenexx storage folder-store \
    --name ''
```

## folder-destroy

Delete a folder

```bash
revenexx storage folder-destroy \
    --id ''
```

## folder-show

Get a folder

```bash
revenexx storage folder-show \
    --id ''
```

## folder-update

Rename or move a folder

```bash
revenexx storage folder-update \
    --id ''
```

## sync-rule-index

List SFTP sync rules

```bash
revenexx storage sync-rule-index
```

## sync-rule-store

Create an SFTP sync rule

```bash
revenexx storage sync-rule-store \
    --sftp-account-id '' \
    --source-path /uploads
```

## sync-rule-destroy

Delete an SFTP sync rule

```bash
revenexx storage sync-rule-destroy \
    --id ''
```

## sync-rule-show

Get an SFTP sync rule

```bash
revenexx storage sync-rule-show \
    --id ''
```

## sync-rule-update

Update an SFTP sync rule

```bash
revenexx storage sync-rule-update \
    --id ''
```

## sync-rule-run

Run an SFTP sync rule now

```bash
revenexx storage sync-rule-run \
    --id ''
```

## sync-rule-run-protocol

Get an SFTP sync run protocol

```bash
revenexx storage sync-rule-run-protocol \
    --id '' \
    --run-id ''
```

## sync-rule-history

List SFTP sync history

```bash
revenexx storage sync-rule-history
```

## tenant-stats

Get storage statistics

```bash
revenexx storage tenant-stats
```

## tenant-usage

Get storage usage

```bash
revenexx storage tenant-usage
```
