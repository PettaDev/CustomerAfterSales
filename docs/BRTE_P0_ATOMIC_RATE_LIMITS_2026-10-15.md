# BRTE P0: Atomic Abuse Controls and Production Release Gate

**Status:** Candidate, pending CI and production end-to-end validation. **Date:** 2026-10-15.
**Baseline / restore branch:** `backup/brte-integrated-2026-10-15-before-rate-hardening` (commit `a5a87b4ce1e593bbcd99f0e1c9c9e851a31c3ad1`).

## What changed

Before this change, request quotas used read → update counters through independent database calls. Parallel serverless functions could overwrite the same value. The new `store.consumeRate` makes admission and counter increment one atomic statement:

- **PostgreSQL:** `INSERT ... ON CONFLICT (id) DO UPDATE ... WHERE ... RETURNING` — one transaction/row-level conflict resolution per key, shared across serverless instances.
- **SQLite development:** equivalent single-statement `UPSERT`, preserving representative local tests.
- Blocked attempts never extend the quota window or consume additional increments.
- OTP email cooldown and quota share one atomic decision.
- No new tables, columns, migrations, secrets, or user-visible data changes.

Protected operations:

| Endpoint | Admission control |
| --- | --- |
| `POST /api/cases` | source IP limit and customer email/phone limit |
| `POST /api/auth/request-code` | per-email fixed window + one-minute cooldown; per-IP quota |
| `POST /api/auth/login` | per-IP login attempt limit |

**Known remaining work:** OTP code-verification attempt counter is still an individual get/put update, and distributed real-user rate-limit testing in production has not been performed. This PR does not claim comprehensive fraud prevention, file sanitization, or production readiness.

## Acceptance gates

1. GitHub CI: `npm ci`, lint baseline, `npm audit --omit=dev`, `npm test`, `npm run build`.
2. Unit tests: concurrent quota consumption, cooldown bursts, fixed-window expiry, invalid arguments.
3. Preview: inspect `/api/health` and ensure configured DB, storage and staff readiness. A READY Vercel deployment proves build, **not runtime health**.
4. Non-destructive E2E with synthetic cases, private evidence upload/download, OTP with a controlled mailbox and TFAE/Manager roles.
5. Operational rollback: source restore branch and prior Vercel deployment. **Database and file storage backups remain separate**; do not overwrite/delete production cases as part of rollback.
6. Legal/privacy and customer-retention approval prior to full national QR rollout.

## Release constraints

- No production merge or promotion in this change.
- No customer data is copied into test logs.
- Do not disable quotas in production to make E2E pass.
- Any DB migration must first run on a branch and carry a reverse/tested restoration plan.
