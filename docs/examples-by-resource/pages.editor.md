# pages.editor

## edit-states

Search open edit states across pages

```bash
revenexx pages-editor edit-states
```

## translate

Machine-translate text fields

```bash
revenexx pages-editor translate
```

## user-settings-get

Load the current user's editor settings

```bash
revenexx pages-editor user-settings-get
```

## user-settings-put

Persist the current user's editor settings

```bash
revenexx pages-editor user-settings-put
```

## history

Move the undo/redo pointer

```bash
revenexx pages-editor history \
    --page-id '' \
    --index 1
```

## last-changed

Poll the edit state's last change

```bash
revenexx pages-editor last-changed \
    --page-id ''
```

## mutation-status

Soft-enable/disable a single mutation in the log

```bash
revenexx pages-editor mutation-status \
    --page-id '' \
    --enabled true \
    --index 1
```

## mutate

Append a mutation to the edit state

```bash
revenexx pages-editor mutate \
    --page-id '' \
    --plugin add
```

## preview-grant

Create a preview share token

```bash
revenexx pages-editor preview-grant \
    --page-id ''
```

## publish

Publish the edit state

```bash
revenexx pages-editor publish \
    --page-id ''
```

## revert

Discard all unpublished changes

```bash
revenexx pages-editor revert \
    --page-id ''
```

## schedule

Park the edit state for a future publication date

```bash
revenexx pages-editor schedule \
    --page-id '' \
    --scheduled-at 2026-01-01T12:00:00Z
```

## state

Load the editor state for a page

```bash
revenexx pages-editor state \
    --page-id ''
```

## take-ownership

Take ownership of the edit state

```bash
revenexx pages-editor take-ownership \
    --page-id ''
```

## templates-create

Create a template from the edit state

```bash
revenexx pages-editor templates-create \
    --page-id '' \
    --label 'Hero with two teasers' \
    --uuids one two three
```

## unschedule

Cancel a scheduled publish

```bash
revenexx pages-editor unschedule \
    --page-id ''
```
