# loyalty.programs

## list

List loyalty programmes

```bash
revenexx loyalty-programs list
```

## create

Create a loyalty programme

```bash
revenexx loyalty-programs create \
    --code '' \
    --kind points \
    --labels 
```

## empty-trash

Empty the programme trash, deleting each one for good

```bash
revenexx loyalty-programs empty-trash
```

## purge

Delete the programmes that outlived the trash retention

```bash
revenexx loyalty-programs purge
```

## delete

Move a programme to the trash, or delete it for good from there

```bash
revenexx loyalty-programs delete \
    --id ''
```

## get

Read one programme

```bash
revenexx loyalty-programs get \
    --id ''
```

## update

Correct a programme

```bash
revenexx loyalty-programs update \
    --id ''
```

## figures

Read the active members of a programme per tier

```bash
revenexx loyalty-programs figures \
    --id ''
```

## open-period

Open the yearly bonus agreements for every member of a turnover bonus programme

```bash
revenexx loyalty-programs open-period \
    --id ''
```

## restore

Bring a programme back out of the trash

```bash
revenexx loyalty-programs restore \
    --id ''
```
