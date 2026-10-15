# BRTE — Neon bootstrap for Production
Date: 2026-10-15

This package is a versioned, **non-destructive** production schema for the existing `customers-guide` deployment. It does not migrate data, configure staff login, or authorize rollout.

## Evidence
- Public `/api/health` after Vercel Production redeploy: `database:ready`, `storage:configured`, `staff:false`, `staffEmailCode:false`, `ok:false`.
- This DB check only confirms `SELECT 1` works; **it does not prove `public.records` exists**.
- The production backend at commit `5adb9fa43030ecf311ede0ed4c7384dac784f862` runs database DDL **only outside** the Vercel environment. A fresh Neon DB requires one-time schema setup.
- The new Vercel-managed Neon project is **not visible** to the currently connected ChatGPT Neon organization. Do not accidentally apply SQL to the old project `customer-after-sales` / `cold-brook-36220874`.

## Procedure — new empty production database
1. In Neon (from the linked Vercel storage resource), verify project identity `spring-hat-82594085`, region São Paulo and branch `main` before opening SQL Editor. Avoid any backup/test branch accidentally chosen.
2. Execute `sql/000_brte_schema_preflight.sql` first; confirm the database and `to_regclass('public.records')` outcome. If the table already exists, stop and compare structure before making changes.
3. If missing, execute `sql/001_brte_records_initial.sql`. It is transactional and uses `CREATE IF NOT EXISTS`; **do not add destructive SQL**.
4. Execute the verification SQL after successful migration; expect the `records` table and primary-key/indexes. Since this is a newly provisioned database, record counts should be zero.
5. Retest the browser flow using a **synthetic** customer case, only once team authentication and privacy gates are ready. A `/api/health` success alone is insufficient for case E2E.
6. Record the exact Neon project/branch and results in the release checklist, without copying database credentials into GitHub or ChatGPT.

## Operational gates
- Production: `DATABASE_URL` bound to the pooled URL for the intended branch; Preview must use a **separate** Neon development branch.
- Blob is private but backend upload + download remain unverified; keep production customer intake gated pending synthetic E2E.
- Staff: `STAFF_USERS_JSON` with allowlisted e-mails, `RESEND_API_KEY` and verified `AUTH_EMAIL_FROM`. Set `AUTH_ALLOW_PASSWORD_FALLBACK=false`.
- Verify `staff:true`, `staffEmailCode:true` and `teamAuthReady:true` once configured. Confirm a real OTP request/verification with authorized test staff.
- Legal/privacy: approval and data deletion/retention process before opening to real customers.
- Existing Vercel rollback: deployment `dpl_5k8fYQTHJMgaqV1nAUDfqLN9aWR9` (same source SHA; old env). Source rollback does **not** undo DB/Blob writes; protect both separately.

## Scope and warnings
- No `DROP`, `DELETE`, `TRUNCATE`, schema reset or production data cleanup.
- Migration is specifically for current backend. Future schema changes require separate numbered SQL files, preview/branch execution and verified recovery.
- The legacy `docs/production-setup.md` says the table is created automatically; that statement does not apply in Vercel, per `server/store.mjs`.
