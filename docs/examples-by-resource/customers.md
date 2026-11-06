# customers

## auth-handoff

Sign a buyer in for a trusted app

```bash
revenexx customers auth-handoff \
    --handoff-key ''
```

## auth-login

Create a platform session

```bash
revenexx customers auth-login \
    --password ''
```

## auth-logout

Revoke a platform session

```bash
revenexx customers auth-logout \
    --session-id '' \
    --user-id ''
```

## auth-magic-link

Send a sign-in link

```bash
revenexx customers auth-magic-link \
    --email einkauf@example.com \
    --url https://example.com
```

## auth-magic-link-confirm

Sign in with a mailed link

```bash
revenexx customers auth-magic-link-confirm \
    --secret '' \
    --user-id ''
```

## auth-me

Resolve the signed-in buyer

```bash
revenexx customers auth-me \
    --session-id '' \
    --user-id ''
```

## auth-mfa-challenge

Send a second-factor code

```bash
revenexx customers auth-mfa-challenge \
    --user-id ''
```

## auth-mfa-challenge-confirm

Answer a second-factor challenge

```bash
revenexx customers auth-mfa-challenge-confirm \
    --challenge-id '' \
    --code '' \
    --session-secret ''
```

## auth-otp

Send a sign-in code

```bash
revenexx customers auth-otp \
    --email einkauf@example.com
```

## auth-otp-confirm

Sign in with a mailed code

```bash
revenexx customers auth-otp-confirm \
    --secret '' \
    --user-id ''
```

## auth-recovery

Start password recovery

```bash
revenexx customers auth-recovery \
    --email einkauf@example.com \
    --url https://example.com
```

## auth-recovery-confirm

Confirm password recovery

```bash
revenexx customers auth-recovery-confirm \
    --password '' \
    --secret '' \
    --user-id ''
```

## auth-register

Register a buyer

```bash
revenexx customers auth-register \
    --email einkauf@example.com \
    --password ''
```

## auth-verification

Send an address verification

```bash
revenexx customers auth-verification \
    --url https://example.com \
    --user-id ''
```

## auth-verification-confirm

Confirm an address

```bash
revenexx customers auth-verification-confirm \
    --secret '' \
    --user-id ''
```

## principal-resolve

Resolve an acting principal

```bash
revenexx customers principal-resolve
```
