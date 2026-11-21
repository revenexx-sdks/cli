# journeys.templates

## list

List the shipped flows

```bash
revenexx journeys-templates list
```

## defaults

Write the shipped templates if they are missing (deprecated, use ensure)

```bash
revenexx journeys-templates defaults \
    --body '{ "key": "value" }'
```

## ensure

Write the shipped templates if they are missing

```bash
revenexx journeys-templates ensure \
    --body '{ "key": "value" }'
```

## copy

Copy a template into a new draft journey

```bash
revenexx journeys-templates copy \
    --code ''
```

## get

Read one template

```bash
revenexx journeys-templates get \
    --id ''
```
