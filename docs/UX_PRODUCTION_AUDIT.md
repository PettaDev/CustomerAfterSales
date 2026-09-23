# BRTE UX, Architecture and Production Readiness Audit

Date: 2026-09-22

## Product architecture

Customer: Home / New case → Device → Issue → Evidence collection → Customer details → Case created → Tracking.

Software collection: Phone only/manual evidence OR Computer/Browser Direct Collection.

Hardware collection: Safety check → Manual photo/video evidence → Warranty/logistics information.

Internal team: Team access/TFAE → e-mail verification code → TFAE or Manager workspace.

TFAE: view cases → take ownership → validate evidence → update status/priority → request customer action → resolve.

Manager: read-only case monitoring → evidence/history review → analyst workload overview.

## UX/UI review

### Strong / ready
- Home clearly prioritizes New case.
- No brand or Software/Hardware category is preselected.
- Software build is optional.
- Software and Hardware have separate evidence journeys.
- Hardware never shows Browser Capture to the customer.
- Hardware safety question appears before charger guidance.
- Hardware warranty triage is optional and does not claim warranty approval.
- Browser Collection explains Developer Mode, USB debugging, cable connection and Android permission.
- Browser tutorial is secondary to written instructions and has a fallback.
- Browser evidence uses the same 1 GB per-file limit as the backend.
- Upload progress is visible.
- Customer tracking hides internal owner information.
- Awaiting-customer cases allow replies and additional evidence.
- TFAE and Manager roles are distinct and enforced server-side.
- Team actions identify the authenticated analyst.
- Staff access supports one-time e-mail codes and optional 7-day trusted-device sessions.
- pt-BR, English, es-419 and zh-CN cover active customer and staff flows.
- Mobile retains step number and progress even when the desktop journey rail is hidden.

### Fixed in this audit
- Root `/` is explicitly resolved to New case.
- Team / TFAE access is discoverable from the footer without competing with customer navigation.
- Footer includes the requested developer credit.
- Hardware case detail no longer shows irrelevant Software/Carrier/Capture sections.
- Hardware ZIP/log evidence is rejected server-side.
- Manager edit controls do not appear while staff identity is loading.
- Anonymous case creation is rate-limited by IP.
- TFAE emergency password fallback is visible only when the backend enables it.

### Remaining UX priorities
1. TFAE workspace: add My cases / All cases / Unassigned shortcuts.
2. Add market/region filtering when the Brazil/Ecuador operating policy is finalized.
3. Customer Tracking: add a visual Received → Reviewing → Waiting for you → Resolved timeline.
4. Case recovery: consider sending a receipt with case number and safe recovery guidance.
5. Final visual pass at 320–375 px widths and with long translated strings.
6. Dedicated keyboard/WCAG contrast pass for muted secondary text.

## Architecture/security review

### Current safeguards
- Customer case access requires a private token, not only a case ID.
- Staff permissions are enforced server-side.
- Manager cannot mutate cases.
- OTP codes are short-lived, hashed, single-use and rate-limited.
- Staff cookies are HttpOnly + SameSite=Strict; Secure is enabled on Vercel.
- Evidence storage is private and uses signed URLs.
- Case creation has origin checks, a 64 KB JSON limit and IP rate limiting.
- Hardware evidence MIME types are enforced server-side.
- File size is capped at 1 GB.

### Remaining blockers for broad public exposure
1. Session/account revocation: current logout invalidates only the current session. Add log-out-all-devices / revocation.
2. Malware/content validation: MIME/size controls are not malware scanning. ZIPs/evidence need scanning or quarantine before broad public traffic.
3. Retention/deletion policy: define retention for PII, videos, logs and warranty evidence and a deletion-request workflow.
4. Authentication observability: alert on unusual OTP failures, fallback-password attempts and repeated blocked requests.
5. Public abuse protection: IP rate limiting is present; high-volume public rollout should add Vercel WAF/bot controls where appropriate.

## Production readiness conclusion

### Controlled BRTE pilot
Suitable after environment configuration and final smoke tests.

Recommended scope: known markets/users, monitored rollout, active TFAE monitoring, private storage confirmed, OTP delivery confirmed, emergency access tested.

### Broad public rollout
Not yet recommended as fully production-hardened.

Complete session revocation, upload malware/content controls, retention/deletion policy and production monitoring first.

## Final smoke-test matrix

Customer: 4 languages; Software manual; Software browser; Hardware safe/risk; warranty; upload failure/retry; case creation; all Tracking statuses; customer reply; 320/375/430 px; 1280/1440 px.

Internal: Gustavo TFAE; Tommy TFAE; Leonard Manager; owner assignment; OTP; 7-day trusted device; emergency fallback; logout; evidence download; hardware detail; workload overview.

Infrastructure: PostgreSQL/Neon health; private storage; Resend delivery; Vercel production deployment; CI tests/build; runtime error review.