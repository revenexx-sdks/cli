# carts

## list

List carts

```bash
revenexx carts list
```

## create

Create a cart

```bash
revenexx carts create
```

## claim

Claim guest carts for a contact

```bash
revenexx carts claim \
    --contact-id '' \
    --session-key a1b2c3d4e5f6
```

## held-codes

List the voucher codes open carts hold

```bash
revenexx carts held-codes
```

## maintenance-run

Run the cart maintenance sweep

```bash
revenexx carts maintenance-run
```

## merge

Merge a source cart into a target cart

```bash
revenexx carts merge \
    --source-cart-id '' \
    --target-cart-id ''
```

## on-behalf

Open a cart in a customer's name

```bash
revenexx carts on-behalf \
    --contact-id ''
```

## vocabularies-list

List vocabularies

```bash
revenexx carts vocabularies-list
```

## vocabularies-get

Read one vocabulary

```bash
revenexx carts vocabularies-get \
    --name io-apply-modes
```

## delete

Delete a cart including its items

```bash
revenexx carts delete \
    --id ''
```

## get

Read one cart by id

```bash
revenexx carts get \
    --id ''
```

## update

Update a cart

```bash
revenexx carts update \
    --id ''
```

## abandon

Abandon an active cart

```bash
revenexx carts abandon \
    --id ''
```

## activate

Make a cart the owner's current cart

```bash
revenexx carts activate \
    --id ''
```

## merge-into

Merge this cart into another cart

```bash
revenexx carts merge-into \
    --id '' \
    --target-cart-id ''
```

## order

Mark an active cart as ordered

```bash
revenexx carts order \
    --id ''
```

## reopen

Reopen an abandoned cart

```bash
revenexx carts reopen \
    --id ''
```
