# audiences.members

## composition

Read who is in an audience by market and by source, as bar-list rows

```bash
revenexx audiences-members composition \
    --id ''
```

## audiences-import

Import rows into a static audience, with the reason for every row refused

```bash
revenexx audiences-members audiences-import \
    --id ''
```

## read

Read the members of an audience, keyset-paged and stable

```bash
revenexx audiences-members read \
    --id ''
```

## add

Add contacts to a static audience

```bash
revenexx audiences-members add \
    --id ''
```

## remove

Take one contact out of a static audience

```bash
revenexx audiences-members remove \
    --id '' \
    --contact-id ''
```

## timeline

Read the joins and leaves of an audience per day

```bash
revenexx audiences-members timeline \
    --id ''
```

## imports-list

List imports

```bash
revenexx audiences-members imports-list
```

## imports-get

Read one import

```bash
revenexx audiences-members imports-get \
    --id ''
```

## member-events-list

List joins and leaves

```bash
revenexx audiences-members member-events-list
```

## member-events-get

Read one join or leave

```bash
revenexx audiences-members member-events-get \
    --id ''
```

## list

List membership rows

```bash
revenexx audiences-members list
```

## get

Read one membership row

```bash
revenexx audiences-members get \
    --id ''
```

## memberships

Say which audiences one contact is in

```bash
revenexx audiences-members memberships \
    --contact-id ''
```
