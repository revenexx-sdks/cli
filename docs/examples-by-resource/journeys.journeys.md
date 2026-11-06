# journeys.journeys

## list

List journeys

```bash
revenexx journeys-journeys list
```

## create

Create a draft journey

```bash
revenexx journeys-journeys create \
    --name ''
```

## empty-trash

Empty the journey trash, deleting each one for good

```bash
revenexx journeys-journeys empty-trash
```

## purge

Delete the journeys that outlived the trash retention

```bash
revenexx journeys-journeys purge
```

## delete

Move a journey to the trash, or delete it for good from there

```bash
revenexx journeys-journeys delete \
    --id ''
```

## get

Read one journey

```bash
revenexx journeys-journeys get \
    --id ''
```

## update

Correct a journey

```bash
revenexx journeys-journeys update \
    --id ''
```

## archive

Archive a journey

```bash
revenexx journeys-journeys archive \
    --id '' \
    --body '{ "key": "value" }'
```

## enrol

Put one person into a live journey by hand

```bash
revenexx journeys-journeys enrol \
    --id ''
```

## graph

Read the steps of a journey version

```bash
revenexx journeys-journeys graph \
    --id ''
```

## save-graph

Save the canvas as the draft

```bash
revenexx journeys-journeys save-graph \
    --id '' \
    --steps one two three
```

## pause

Pause a live journey

```bash
revenexx journeys-journeys pause \
    --id '' \
    --body '{ "key": "value" }'
```

## publish

Publish the draft

```bash
revenexx journeys-journeys publish \
    --id '' \
    --body '{ "key": "value" }'
```

## report

Read per-step counts of a journey

```bash
revenexx journeys-journeys report \
    --id ''
```

## restore

Bring a journey back out of the trash

```bash
revenexx journeys-journeys restore \
    --id ''
```

## resume

Resume a paused journey

```bash
revenexx journeys-journeys resume \
    --id '' \
    --body '{ "key": "value" }'
```

## run

Process the due steps of one journey now

```bash
revenexx journeys-journeys run \
    --id '' \
    --body '{ "key": "value" }'
```

## timeline

Read entries and reached goals of a journey per day

```bash
revenexx journeys-journeys timeline \
    --id ''
```
