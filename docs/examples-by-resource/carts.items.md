# carts.items

## list

List the items of a cart

```bash
revenexx carts-items list \
    --cart-id ''
```

## create

Add an item to a cart

```bash
revenexx carts-items create \
    --cart-id ''
```

## replace

Replace all items of a cart

```bash
revenexx carts-items replace \
    --cart-id '' \
    --items one two three
```

## priced

Add a line priced for the cart's buyer

```bash
revenexx carts-items priced \
    --cart-id ''
```

## delete

Remove an item from a cart

```bash
revenexx carts-items delete \
    --cart-id '' \
    --id ''
```

## get

Read one cart item

```bash
revenexx carts-items get \
    --cart-id '' \
    --id ''
```

## update

Update a cart item

```bash
revenexx carts-items update \
    --cart-id '' \
    --id ''
```
