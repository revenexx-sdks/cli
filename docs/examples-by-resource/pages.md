# pages

## library-list

Search the reusable-block library

```bash
revenexx pages library-list
```

## library-delete

Soft-delete a library item

```bash
revenexx pages library-delete \
    --id ''
```

## library-get

Read one library item

```bash
revenexx pages library-get \
    --id ''
```

## library-update

Update a library item

```bash
revenexx pages library-update \
    --id ''
```

## menus-list

List navigation menus

```bash
revenexx pages menus-list
```

## menus-upsert

Create or replace a menu by key

```bash
revenexx pages menus-upsert \
    --label 'Main navigation' \
    --menu-key main
```

## menus-delete

Soft-delete a menu

```bash
revenexx pages menus-delete \
    --id ''
```

## menus-get

Read one menu by id

```bash
revenexx pages menus-get \
    --id ''
```

## menus-update

Update a menu's label and items

```bash
revenexx pages menus-update \
    --id ''
```

## pages-list

List pages

```bash
revenexx pages pages-list
```

## pages-create

Create a page

```bash
revenexx pages pages-create \
    --title 'About us'
```

## pages-delete

Soft-delete a page

```bash
revenexx pages pages-delete \
    --id ''
```

## pages-get

Read one page by id

```bash
revenexx pages pages-get \
    --id ''
```

## pages-update

Update page metadata

```bash
revenexx pages pages-update \
    --id ''
```

## pages-duplicate

Duplicate a page

```bash
revenexx pages pages-duplicate \
    --id ''
```

## pages-restore

Restore a soft-deleted page

```bash
revenexx pages pages-restore \
    --id ''
```

## pages-revisions

List a page's publish history

```bash
revenexx pages pages-revisions \
    --id ''
```

## popups-list

List pop-ups

```bash
revenexx pages popups-list
```

## popups-create

Create a pop-up

```bash
revenexx pages popups-create \
    --label 'Newsletter-Anmeldung Herbst'
```

## popups-update

Change a pop-up

```bash
revenexx pages popups-update \
    --id ''
```

## seed

Seed a theme's default content

```bash
revenexx pages seed
```

## settings-site-list

List site settings

```bash
revenexx pages settings-site-list
```

## settings-site-delete

Remove a site setting

```bash
revenexx pages settings-site-delete \
    --key ''
```

## settings-site-get

Read one site setting

```bash
revenexx pages settings-site-get \
    --key ''
```

## settings-site-put

Set a site setting

```bash
revenexx pages settings-site-put \
    --key '' \
    --value '{ "key": "value" }'
```

## template-assignments-list

List template assignments

```bash
revenexx pages template-assignments-list
```

## template-assignments-delete

Remove a template assignment

```bash
revenexx pages template-assignments-delete \
    --resource-type '' \
    --resource-id ''
```

## template-assignments-put

Assign a template page to a record

```bash
revenexx pages template-assignments-put \
    --resource-type '' \
    --resource-id '' \
    --page-slug product-detail
```

## templates-list

List block templates

```bash
revenexx pages templates-list
```

## templates-delete

Delete a template

```bash
revenexx pages templates-delete \
    --id ''
```

## templates-get

Read one template

```bash
revenexx pages templates-get \
    --id ''
```

## templates-update

Update a template

```bash
revenexx pages templates-update \
    --id ''
```

## vocabularies-list

List vocabularies

```bash
revenexx pages vocabularies-list
```

## vocabularies-get

Read one vocabulary

```bash
revenexx pages vocabularies-get \
    --name edit-state-statuses
```
