# quotes.quotes

## open-items

List the open quote positions that name a product

```bash
revenexx quotes-quotes open-items \
    --product-id ''
```

## list

List quotes

```bash
revenexx quotes-quotes list
```

## create

Open a quote at a desk

```bash
revenexx quotes-quotes create \
    --currency EUR \
    --items one two three
```

## get

Read one quote

```bash
revenexx quotes-quotes get \
    --id ''
```

## copy

Copy a quote as a new one

```bash
revenexx quotes-quotes copy \
    --id ''
```

## detail

Read a quote with everything on it

```bash
revenexx quotes-quotes detail \
    --id ''
```

## items

List the positions of a quote

```bash
revenexx quotes-quotes items \
    --id ''
```

## request

Ask for a quote

```bash
revenexx quotes-quotes request \
    --currency EUR \
    --items one two three
```

## vocabularies

Read the closed lists this app enforces

```bash
revenexx quotes-quotes vocabularies
```

## vocabulary

Read one list with the words and colours a screen shows

```bash
revenexx quotes-quotes vocabulary \
    --name actor
```
