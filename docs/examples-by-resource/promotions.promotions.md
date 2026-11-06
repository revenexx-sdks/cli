# promotions.promotions

## bundles-list

List bundles

```bash
revenexx promotions-promotions bundles-list
```

## bundles-create

Define a bundle

```bash
revenexx promotions-promotions bundles-create \
    --name '' \
    --promotion-id ''
```

## bundles-delete

Remove a bundle

```bash
revenexx promotions-promotions bundles-delete \
    --id ''
```

## bundles-get

Read one bundle

```bash
revenexx promotions-promotions bundles-get \
    --id ''
```

## bundles-update

Correct a bundle

```bash
revenexx promotions-promotions bundles-update \
    --id ''
```

## conditions-list

List conditions

```bash
revenexx promotions-promotions conditions-list
```

## conditions-create

Add a condition

```bash
revenexx promotions-promotions conditions-create \
    --promotion-id ''
```

## conditions-validate

Check one condition without saving it

```bash
revenexx promotions-promotions conditions-validate
```

## conditions-delete

Remove a condition

```bash
revenexx promotions-promotions conditions-delete \
    --id ''
```

## conditions-get

Read one condition

```bash
revenexx promotions-promotions conditions-get \
    --id ''
```

## conditions-update

Correct a condition

```bash
revenexx promotions-promotions conditions-update \
    --id ''
```

## custom-effect-types-list

List registered effect types

```bash
revenexx promotions-promotions custom-effect-types-list
```

## custom-effect-types-create

Register an effect type

```bash
revenexx promotions-promotions custom-effect-types-create \
    --name ''
```

## custom-effect-types-delete

Delete an effect type nothing uses

```bash
revenexx promotions-promotions custom-effect-types-delete \
    --id ''
```

## custom-effect-types-get

Read one effect type

```bash
revenexx promotions-promotions custom-effect-types-get \
    --id ''
```

## custom-effect-types-update

Change an effect type

```bash
revenexx promotions-promotions custom-effect-types-update \
    --id ''
```

## effects-list

List effects

```bash
revenexx promotions-promotions effects-list
```

## effects-create

Add an effect

```bash
revenexx promotions-promotions effects-create \
    --promotion-id ''
```

## effects-delete

Remove an effect

```bash
revenexx promotions-promotions effects-delete \
    --id ''
```

## effects-get

Read one effect

```bash
revenexx promotions-promotions effects-get \
    --id ''
```

## effects-update

Correct an effect

```bash
revenexx promotions-promotions effects-update \
    --id ''
```

## groups-list

List stacking groups

```bash
revenexx promotions-promotions groups-list
```

## groups-create

Create a stacking group

```bash
revenexx promotions-promotions groups-create \
    --code '' \
    --name ''
```

## groups-delete

Delete a stacking group

```bash
revenexx promotions-promotions groups-delete \
    --id ''
```

## groups-get

Read one stacking group

```bash
revenexx promotions-promotions groups-get \
    --id ''
```

## groups-update

Correct a stacking group

```bash
revenexx promotions-promotions groups-update \
    --id ''
```

## list

List promotions

```bash
revenexx promotions-promotions list
```

## create

Write a promotion down

```bash
revenexx promotions-promotions create \
    --code '' \
    --name ''
```

## overlap-check

Say whether a promotion is running that a new one would meet

```bash
revenexx promotions-promotions overlap-check
```

## empty-trash

Empty the promotion trash, deleting each one for good

```bash
revenexx promotions-promotions empty-trash
```

## purge

Delete the promotions that outlived the trash retention

```bash
revenexx promotions-promotions purge
```

## delete

Move a promotion to the trash, or delete one in the trash for good

```bash
revenexx promotions-promotions delete \
    --id ''
```

## get

Read one promotion

```bash
revenexx promotions-promotions get \
    --id ''
```

## update

Correct a promotion

```bash
revenexx promotions-promotions update \
    --id ''
```

## conditions

Read a promotion condition tree, assembled

```bash
revenexx promotions-promotions conditions \
    --id ''
```

## conditions-check

Check a promotion condition tree before it is relied on

```bash
revenexx promotions-promotions conditions-check \
    --id ''
```

## copy

Copy a promotion as a draft under a new code

```bash
revenexx promotions-promotions copy \
    --id '' \
    --code ''
```

## end

End a promotion now or at a date

```bash
revenexx promotions-promotions end \
    --id ''
```

## overlaps

List the live promotions this one can meet in one cart

```bash
revenexx promotions-promotions overlaps \
    --id ''
```

## overview

Say what a promotion does and how it stands

```bash
revenexx promotions-promotions overview \
    --id ''
```

## restore

Bring a promotion back out of the trash

```bash
revenexx promotions-promotions restore \
    --id ''
```

## state

Report what a promotion is right now

```bash
revenexx promotions-promotions state \
    --id ''
```

## timeline

Read the redemptions of a promotion per day

```bash
revenexx promotions-promotions timeline \
    --id ''
```
