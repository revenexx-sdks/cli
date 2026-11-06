# pages.collaboration

## editor-notifications-list

List the current user's notifications

```bash
revenexx pages-collaboration editor-notifications-list
```

## editor-notifications-mark-all-read

Mark all notifications read

```bash
revenexx pages-collaboration editor-notifications-mark-all-read
```

## editor-notifications-unread-count

Unread notification count

```bash
revenexx pages-collaboration editor-notifications-unread-count
```

## editor-users

List users for @mentions

```bash
revenexx pages-collaboration editor-users
```

## editor-comments-list

List a page's comments

```bash
revenexx pages-collaboration editor-comments-list \
    --page-id ''
```

## editor-comments-create

Add a comment or reply

```bash
revenexx pages-collaboration editor-comments-create \
    --page-id '' \
    --body '<p>Please shorten this headline.</p>'
```

## editor-comments-delete

Delete a comment

```bash
revenexx pages-collaboration editor-comments-delete \
    --page-id '' \
    --uuid ''
```

## editor-comments-update

Edit a comment body

```bash
revenexx pages-collaboration editor-comments-update \
    --page-id '' \
    --uuid '' \
    --body '<p>Please shorten this headline.</p>'
```

## editor-comments-resolve

Resolve a comment thread

```bash
revenexx pages-collaboration editor-comments-resolve \
    --page-id '' \
    --uuid ''
```

## editor-comments-toggle-task

Toggle a task checkbox in a comment

```bash
revenexx pages-collaboration editor-comments-toggle-task \
    --page-id '' \
    --uuid '' \
    --task-index 1
```

## editor-comments-unresolve

Reopen a resolved thread

```bash
revenexx pages-collaboration editor-comments-unresolve \
    --page-id '' \
    --uuid ''
```
