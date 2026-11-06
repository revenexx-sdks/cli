# messaging

## audit-index

The change log, newest first

```bash
revenexx messaging audit-index
```

## binding-index

List this tenant's bindings, in fallback order

```bash
revenexx messaging binding-index
```

## binding-store

Bind an event topic to a template

```bash
revenexx messaging binding-store \
    --channel '' \
    --event-topic '' \
    --recipient '' \
    --template-key ''
```

## binding-destroy

Delete a binding

```bash
revenexx messaging binding-destroy \
    --id ''
```

## binding-show

Read one binding

```bash
revenexx messaging binding-show \
    --id ''
```

## binding-update-patch

Change a binding

```bash
revenexx messaging binding-update-patch \
    --id ''
```

## binding-update

Change a binding

```bash
revenexx messaging binding-update \
    --id ''
```

## channel-credential-index

What each channel is configured with, and whether it is ready to send

```bash
revenexx messaging channel-credential-index
```

## channel-credential-destroy

Take a channel's credentials back out

```bash
revenexx messaging channel-credential-destroy \
    --channel ''
```

## channel-credential-update-patch

Write one channel's credentials, or one market's override of them

```bash
revenexx messaging channel-credential-update-patch \
    --channel ''
```

## channel-credential-update

Write one channel's credentials, or one market's override of them

```bash
revenexx messaging channel-credential-update \
    --channel ''
```

## channel-credential-verify

Prove the stored credentials work, without sending anything

```bash
revenexx messaging channel-credential-verify \
    --channel ''
```

## channel-index

List the channels this deployment can dispatch on

```bash
revenexx messaging channel-index
```

## config-show

The tenant's messaging configuration

```bash
revenexx messaging config-show
```

## config-update-patch

Change the tenant's messaging configuration

```bash
revenexx messaging config-update-patch
```

## config-update

Change the tenant's messaging configuration

```bash
revenexx messaging config-update
```

## layout-index

List this tenant's letterheads, the default first

```bash
revenexx messaging layout-index
```

## layout-store

Create a letterhead

```bash
revenexx messaging layout-store
```

## layout-destroy

Delete a layout and say what happened to the templates that were on it

```bash
revenexx messaging layout-destroy \
    --id ''
```

## layout-show

Read one letterhead

```bash
revenexx messaging layout-show \
    --id ''
```

## layout-update

Change a letterhead

```bash
revenexx messaging layout-update \
    --id ''
```

## library-index

The platform's ready-made templates, filterable by channel and locale

```bash
revenexx messaging library-index
```

## message-index

The delivery log, newest first

```bash
revenexx messaging message-index
```

## message-show

Read one message

```bash
revenexx messaging message-show \
    --id ''
```

## send-preview

Render a template without sending it

```bash
revenexx messaging send-preview \
    --channel '' \
    --template ''
```

## erasure-store

Erase one person from this tenant's delivery log

```bash
revenexx messaging erasure-store \
    --address '' \
    --channel ''
```

## push-subscription-destroy

Unregister one browser

```bash
revenexx messaging push-subscription-destroy \
    --push-endpoint ''
```

## push-subscription-index

The browsers one person has registered

```bash
revenexx messaging push-subscription-index \
    --subscriber-id ''
```

## push-subscription-store

Register a browser for push

```bash
revenexx messaging push-subscription-store \
    --push-endpoint https://example.com \
    --keys '{ "key": "value" }' \
    --subscriber-id ''
```

## send-send

Send a message

```bash
revenexx messaging send-send \
    --channel '' \
    --template '' \
    --to ''
```

## stats-index

Aggregated delivery figures for one window, with the window before it

```bash
revenexx messaging stats-index
```

## suppression-index

Who is not being mailed, and why. Newest first

```bash
revenexx messaging suppression-index
```

## suppression-store

Suppress an address by hand

```bash
revenexx messaging suppression-store \
    --address '' \
    --channel '' \
    --reason hard_bounce
```

## suppression-destroy

Lift a suppression

```bash
revenexx messaging suppression-destroy \
    --id ''
```

## suppression-show

Read one suppression

```bash
revenexx messaging suppression-show \
    --id ''
```

## template-index

List this tenant's templates, by key

```bash
revenexx messaging template-index
```

## template-store

Create a template

```bash
revenexx messaging template-store \
    --channel '' \
    --key ''
```

## template-destroy

Delete a template

```bash
revenexx messaging template-destroy \
    --id ''
```

## template-show

Read one template — the DRAFT, not what is live

```bash
revenexx messaging template-show \
    --id ''
```

## template-update-patch

Change a template's draft

```bash
revenexx messaging template-update-patch \
    --id ''
```

## template-update

Change a template's draft

```bash
revenexx messaging template-update \
    --id ''
```

## template-version-store

Make the current draft live

```bash
revenexx messaging template-version-store \
    --template-id ''
```

## template-version-index

The publication history of one template, newest first

```bash
revenexx messaging template-version-index \
    --template-id ''
```

## template-version-show

One published snapshot, whole

```bash
revenexx messaging template-version-show \
    --template-id '' \
    --template-version ''
```

## template-version-restore

Put an older version's content back into the draft

```bash
revenexx messaging template-version-restore \
    --template-id '' \
    --template-version ''
```
