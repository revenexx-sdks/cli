# ads.accounts

## list

List ad accounts

```bash
revenexx ads-accounts list
```

## create

Add an ad account

```bash
revenexx ads-accounts create \
    --external-account-id '' \
    --name '' \
    --platform meta
```

## empty-trash

Empty the ad account trash, deleting each one for good

```bash
revenexx ads-accounts empty-trash
```

## purge

Delete the ad accounts that outlived the trash retention

```bash
revenexx ads-accounts purge
```

## delete

Move a ad account to the trash, or delete it for good from there

```bash
revenexx ads-accounts delete \
    --id ''
```

## get

Read one ad account

```bash
revenexx ads-accounts get \
    --id ''
```

## update

Rename an ad account or change its connection

```bash
revenexx ads-accounts update \
    --id ''
```

## restore

Bring a ad account back out of the trash

```bash
revenexx ads-accounts restore \
    --id ''
```

## status

Report the state of an ad account connection

```bash
revenexx ads-accounts status \
    --id '' \
    --status connected
```
