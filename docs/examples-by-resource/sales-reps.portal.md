# sales-reps.portal

## acting-end

The shop ends a handed-over session

```bash
revenexx sales-reps-portal acting-end \
    --id ''
```

## my-acting-leave

End the signed-in rep's open handover

```bash
revenexx sales-reps-portal my-acting-leave
```

## my-customers-list

The signed-in rep's worklist: the customers they carry

```bash
revenexx sales-reps-portal my-customers-list
```

## my-customers-contacts-list

The people of one customer the signed-in rep carries

```bash
revenexx sales-reps-portal my-customers-contacts-list \
    --organization-id ''
```

## my-customers-contacts-act

Open the shop as one buyer of a customer the rep carries

```bash
revenexx sales-reps-portal my-customers-contacts-act \
    --organization-id '' \
    --contact-id ''
```

## my-profile-update

Choose what a buyer sees of the signed-in rep

```bash
revenexx sales-reps-portal my-profile-update
```

## my-reps-list

The reps who carry the signed-in buyer's company

```bash
revenexx sales-reps-portal my-reps-list
```

## principal-resolve

Resolve an asserted sales rep for the gateway

```bash
revenexx sales-reps-portal principal-resolve \
    --rep-code VK-04711
```
