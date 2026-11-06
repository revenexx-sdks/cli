# campaigns.campaigns

## list

List campaigns

```bash
revenexx campaigns-campaigns list
```

## create

Write a campaign down

```bash
revenexx campaigns-campaigns create \
    --code '' \
    --name ''
```

## empty-trash

Empty the campaign trash, deleting each one for good

```bash
revenexx campaigns-campaigns empty-trash
```

## purge

Delete the campaigns that outlived the trash retention

```bash
revenexx campaigns-campaigns purge
```

## delete

Move a campaign to the trash, or delete it for good from there

```bash
revenexx campaigns-campaigns delete \
    --id ''
```

## get

Read one campaign

```bash
revenexx campaigns-campaigns get \
    --id ''
```

## update

Correct a campaign

```bash
revenexx campaigns-campaigns update \
    --id ''
```

## attach

Attach an asset to a campaign

```bash
revenexx campaigns-campaigns attach \
    --id ''
```

## detach

Release an asset from a campaign

```bash
revenexx campaigns-campaigns detach \
    --id ''
```

## links

Build a URL tagged with the campaign UTM values

```bash
revenexx campaigns-campaigns links \
    --id '' \
    --medium '' \
    --url ''
```

## performance

Read what a campaign achieved against its goal

```bash
revenexx campaigns-campaigns performance \
    --id ''
```

## restore

Bring a campaign back out of the trash

```bash
revenexx campaigns-campaigns restore \
    --id ''
```
