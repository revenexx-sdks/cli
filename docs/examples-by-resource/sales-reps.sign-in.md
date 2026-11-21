# sales-reps.sign-in

## auth-invitation-accept

Take an invitation up and set the password

```bash
revenexx sales-reps-sign-in auth-invitation-accept \
    --secret '' \
    --user-id usr_7c19f4a2e0
```

## auth-login

Sign a rep in with their address and password

```bash
revenexx sales-reps-sign-in auth-login \
    --email jana.berger@example.com \
    --password ''
```

## auth-logout

End one of a rep's sessions

```bash
revenexx sales-reps-sign-in auth-logout \
    --session-id ses_5f2a91c3d7 \
    --user-id usr_7c19f4a2e0
```

## auth-magic-link-request

Mail a rep a link that signs them in

```bash
revenexx sales-reps-sign-in auth-magic-link-request \
    --email jana.berger@example.com
```

## auth-magic-link-confirm

Sign a rep in with the mailed link

```bash
revenexx sales-reps-sign-in auth-magic-link-confirm \
    --secret '' \
    --user-id usr_7c19f4a2e0
```

## auth-me

The rep behind a session, or 401

```bash
revenexx sales-reps-sign-in auth-me \
    --session-id ses_5f2a91c3d7 \
    --user-id usr_7c19f4a2e0
```

## auth-mfa-challenge-request

Mail the second-factor code again

```bash
revenexx sales-reps-sign-in auth-mfa-challenge-request \
    --session-secret ''
```

## auth-mfa-challenge-confirm

Confirm the second-factor code

```bash
revenexx sales-reps-sign-in auth-mfa-challenge-confirm \
    --challenge-id chl_19e0c4b7aa \
    --code '' \
    --session-secret ''
```

## auth-otp-request

Mail a rep a one-time code

```bash
revenexx sales-reps-sign-in auth-otp-request \
    --email jana.berger@example.com
```

## auth-otp-confirm

Sign a rep in with the mailed code

```bash
revenexx sales-reps-sign-in auth-otp-confirm \
    --code '' \
    --email jana.berger@example.com
```

## auth-recovery-request

Mail a rep a link to set a new password

```bash
revenexx sales-reps-sign-in auth-recovery-request \
    --email jana.berger@example.com
```

## auth-recovery-confirm

Set a new password with the mailed link

```bash
revenexx sales-reps-sign-in auth-recovery-confirm \
    --password '' \
    --secret '' \
    --user-id usr_7c19f4a2e0
```

## reps-identity

Link or create a rep's login, mailing nothing

```bash
revenexx sales-reps-sign-in reps-identity \
    --id ''
```

## reps-invite

Give a rep their login and mail the invitation

```bash
revenexx sales-reps-sign-in reps-invite \
    --id ''
```
