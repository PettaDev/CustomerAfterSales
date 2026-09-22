# Production setup

The production backend expects three groups of configuration: PostgreSQL, TFAE staff authentication, and S3-compatible evidence storage.

## PostgreSQL

Set `DATABASE_URL` to a pooled PostgreSQL connection string. Neon is the recommended provider for this project. The server creates the `records` table automatically on first access and also creates an index on `kind`.

Recommended Vercel environments:

- Preview: a Neon development/preview branch
- Production: the production Neon branch

After redeploying, verify `/api/health` returns:

```json
{
  "ok": true,
  "database": "configured"
}
```

## Team access

The internal dashboard lives at `/dashboard`.

Normal authentication is passwordless. Configure the team identities in `STAFF_USERS_JSON` and configure transactional e-mail delivery:

```text
STAFF_USERS_JSON=<JSON generated with npm run setup:staff>
RESEND_API_KEY=<server-side secret>
AUTH_EMAIL_FROM=Aftercare <verified-sender@example.com>
AUTH_ALLOW_PASSWORD_FALLBACK=false
```

`AUTH_EMAIL_FROM` must use a sender/domain verified by the e-mail provider. Never expose `RESEND_API_KEY` to the frontend.

The helper script is:

```bash
npm run setup:staff
```

Run it once for each TFAE or Manager. It writes/updates `STAFF_USERS_JSON` in the local `.env` without creating a password.

For migration only, the old `STAFF_EMAIL` / `STAFF_PASSWORD_HASH` variables remain supported when e-mail-code delivery is not configured. Once `RESEND_API_KEY` and `AUTH_EMAIL_FROM` are available, password login is disabled unless `AUTH_ALLOW_PASSWORD_FALLBACK=true` is deliberately set.

After deployment, verify `/api/health` reports both `staff: true` and `staffEmailCode: true`.

## Evidence storage

The database stores metadata only. Videos, ZIP archives, screenshots and text logs require S3-compatible object storage in production.

Required variables:

```text
S3_BUCKET=
S3_REGION=auto
S3_ENDPOINT=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
S3_PATH_STYLE=false
```

Cloudflare R2, AWS S3, or another S3-compatible provider can be used. Keep the bucket private; uploads and downloads use short-lived signed URLs.

After redeploying, verify `/api/health` returns:

```json
{
  "ok": true,
  "database": "configured",
  "storage": "configured",
  "staff": true
}
```

## Final validation

1. Open `/dashboard`, enter an allowlisted corporate e-mail and confirm that the one-time code arrives.
2. Validate login once without trusting the device, then again with “Trust this device for 7 days”.
3. Submit one test case from the customer portal.
4. Confirm the case appears in the TFAE dashboard.
5. Open the case and verify the customer contact data, software build, evidence list and capture session.
6. Download one MP4 and one diagnostic ZIP from the case.
