# customers.roles

## permissions-ledger

Read the permission ledger

```bash
revenexx customers-roles permissions-ledger
```

## list

List the customer role catalogue

```bash
revenexx customers-roles list
```

## create

Create a customer role with its permissions

```bash
revenexx customers-roles create \
    --title 'Einkauf Zentrale'
```

## defaults

Seed the built-in customer roles

```bash
revenexx customers-roles defaults \
    --body '{ "key": "value" }'
```

## update

Edit a customer role

```bash
revenexx customers-roles update \
    --key einkauf-zentrale
```

## copy

Start a new role from an existing one

```bash
revenexx customers-roles copy \
    --key buyer \
    --title 'Einkäufer Werk 2'
```

## permissions-replace

Replace a role's permission set

```bash
revenexx customers-roles permissions-replace \
    --key buyer \
    --permissions one two three
```
