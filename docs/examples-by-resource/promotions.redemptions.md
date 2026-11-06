# promotions.redemptions

## commit

Commit a cart holds against the order it became

```bash
revenexx promotions-redemptions commit \
    --order-id ''
```

## sweep

Clear away holds that stopped counting

```bash
revenexx promotions-redemptions sweep
```

## list

List redemptions

```bash
revenexx promotions-redemptions list
```

## get

Read one redemption

```bash
revenexx promotions-redemptions get \
    --id ''
```

## release

Give a cart or an order redemptions back

```bash
revenexx promotions-redemptions release
```

## reserve

Hold a cart promotions so nobody else can spend them

```bash
revenexx promotions-redemptions reserve \
    --cart-id ''
```

## returns

Credit back what a return took out of an order

```bash
revenexx promotions-redemptions returns \
    --order-id ''
```
