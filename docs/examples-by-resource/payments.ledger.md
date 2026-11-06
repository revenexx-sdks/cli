# payments.ledger

## list

List payments

```bash
revenexx payments-ledger list
```

## create

Create and authorize a payment

```bash
revenexx payments-ledger create \
    --amount 49.9 \
    --method-code invoice
```

## dunning-scan

Scan the dunning and webhook clocks

```bash
revenexx payments-ledger dunning-scan
```

## errors-redact

Reclassify pre-taxonomy error messages

```bash
revenexx payments-ledger errors-redact
```

## orders-relink

Link payments to the order their reference names

```bash
revenexx payments-ledger orders-relink
```

## orders-capture

Capture what an order owes

```bash
revenexx payments-ledger orders-capture \
    --order-ref ORD-10042
```

## vocabularies-list

List vocabularies

```bash
revenexx payments-ledger vocabularies-list
```

## vocabularies-get

Read one vocabulary

```bash
revenexx payments-ledger vocabularies-get \
    --name connection-states
```

## webhooks-ingest

Ingest a PSP webhook callback

```bash
revenexx payments-ledger webhooks-ingest \
    --provider stripe
```

## get

Read one payment

```bash
revenexx payments-ledger get \
    --id ''
```

## cancel

Cancel a payment before capture

```bash
revenexx payments-ledger cancel \
    --id ''
```

## capture

Capture an authorized payment

```bash
revenexx payments-ledger capture \
    --id ''
```

## confirm

Finish a payment after the PSP redirect

```bash
revenexx payments-ledger confirm \
    --id ''
```

## refund

Refund a captured payment in full

```bash
revenexx payments-ledger refund \
    --id ''
```
