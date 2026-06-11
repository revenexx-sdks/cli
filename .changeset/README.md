# Changesets

This folder is managed by [`@changesets/cli`](https://github.com/changesets/changesets). Each PR that ships a user-visible change should drop a markdown file in here describing the bump.

## Adding a changeset

```sh
$ npx changeset
```

You'll be prompted for:

1. The bump type — **major**, **minor**, or **patch** (semver).
2. A short summary that will end up in `CHANGELOG.md`.

The CLI writes the answers to `.changeset/<random-name>.md`. Commit that file with the rest of your PR.

## Releasing

`.changeset/*.md` files are consumed at release time by the publish workflow:

1. A maintainer pushes a `v*.*.*` tag.
2. `.github/workflows/publish.yml` runs `npx changeset version`, which:
   - bumps `package.json`
   - aggregates all pending changesets into `CHANGELOG.md`
   - deletes the consumed `.changeset/*.md` files
3. The workflow then builds + publishes to the npm registry and attaches binaries to the release.

If you want to preview what a release would produce locally:

```sh
$ npx changeset status            # show pending changesets
$ npx changeset version --snapshot rc   # dry-run version stamping
```
