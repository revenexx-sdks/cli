# consent-manager.registry

## catalog-list

List the shipped vendor catalogue

```bash
revenexx consent-manager-registry catalog-list
```

## catalog-adopt

Copy a catalogue vendor into this tenant

```bash
revenexx consent-manager-registry catalog-adopt \
    --key etracker
```

## cookies-list

List cookies and storage entries

```bash
revenexx consent-manager-registry cookies-list
```

## cookies-create

Declare a cookie under a vendor

```bash
revenexx consent-manager-registry cookies-create \
    --name _ga \
    --vendor-id ''
```

## cookies-delete

Remove a cookie

```bash
revenexx consent-manager-registry cookies-delete \
    --id ''
```

## cookies-get

Read one cookie

```bash
revenexx consent-manager-registry cookies-get \
    --id ''
```

## cookies-update

Edit a cookie

```bash
revenexx consent-manager-registry cookies-update \
    --id ''
```

## defaults-run

Seed the five purposes and the default banner

```bash
revenexx consent-manager-registry defaults-run \
    --body '{ "key": "value" }'
```

## purposes-list

List the purposes and their legal basis

```bash
revenexx consent-manager-registry purposes-list
```

## purposes-create

Add a purpose

```bash
revenexx consent-manager-registry purposes-create \
    --code statistics \
    --legal-basis consent \
    --name '{ "key": "value" }'
```

## purposes-delete

Remove a purpose no vendor serves

```bash
revenexx consent-manager-registry purposes-delete \
    --id ''
```

## purposes-get

Read one purpose

```bash
revenexx consent-manager-registry purposes-get \
    --id ''
```

## purposes-update

Edit a purpose; its code is fixed

```bash
revenexx consent-manager-registry purposes-update \
    --id ''
```

## vendors-list

List the vendors, flagged when the catalogue is newer

```bash
revenexx consent-manager-registry vendors-list
```

## vendors-create

Declare a vendor

```bash
revenexx consent-manager-registry vendors-create \
    --code google-analytics \
    --name 'Google Analytics 4'
```

## vendors-delete

Remove a vendor with its cookies and purpose links

```bash
revenexx consent-manager-registry vendors-delete \
    --id ''
```

## vendors-get

Read one vendor with its purposes and cookies

```bash
revenexx consent-manager-registry vendors-get \
    --id ''
```

## vendors-update

Edit a vendor; its code is fixed

```bash
revenexx consent-manager-registry vendors-update \
    --id ''
```

## vocabularies-list

List the value sets this app owns

```bash
revenexx consent-manager-registry vocabularies-list
```

## vocabularies-get

Read one value set in full

```bash
revenexx consent-manager-registry vocabularies-get \
    --name legal-bases
```
