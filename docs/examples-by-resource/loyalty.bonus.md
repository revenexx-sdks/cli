# loyalty.bonus

## list

List bonus agreements

```bash
revenexx loyalty-bonus list
```

## create

Open the bonus agreement of a company for a year

```bash
revenexx loyalty-bonus create \
    --organization-id '' \
    --program-id ''
```

## get

Read one bonus agreement

```bash
revenexx loyalty-bonus get \
    --id ''
```

## update

Correct the base, the document or the turnover source of an agreement

```bash
revenexx loyalty-bonus update \
    --id ''
```

## approve

Approve a calculated bonus

```bash
revenexx loyalty-bonus approve \
    --id ''
```

## calculate

Calculate the bonus after the year has ended

```bash
revenexx loyalty-bonus calculate \
    --id '' \
    --body '{ "key": "value" }'
```

## forfeit

Forfeit a calculated bonus with a reason

```bash
revenexx loyalty-bonus forfeit \
    --id '' \
    --reason ''
```

## pay

Record that an approved bonus was paid

```bash
revenexx loyalty-bonus pay \
    --id ''
```

## progress

Read where a company stands in its bonus year

```bash
revenexx loyalty-bonus progress \
    --id ''
```

## rebuild

Read the year completed orders of the company into the agreement again

```bash
revenexx loyalty-bonus rebuild \
    --id '' \
    --body '{ "key": "value" }'
```

## entries-list

List the turnover lines of agreements

```bash
revenexx loyalty-bonus entries-list
```

## entries-correct

Correct the turnover of an agreement by hand

```bash
revenexx loyalty-bonus entries-correct \
    --agreement-id '' \
    --amount 9.99 \
    --ref ''
```

## entries-get

Read one turnover line

```bash
revenexx loyalty-bonus entries-get \
    --id ''
```

## import

Import turnover figures from the ERP

```bash
revenexx loyalty-bonus import \
    --rows one two three
```
