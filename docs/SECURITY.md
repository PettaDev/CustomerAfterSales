# Security
- API enforces case token or staff session server-side; knowing a case ID alone is insufficient.
- Case access tokens: 256-bit random, stored as SHA-256 digest server-side. Plain token returned once to the customer. Token is carried in Authorization, never in query URLs.
- Staff access: allowlisted corporate e-mail + 6-digit one-time code. Codes expire after 10 minutes, are stored only as salted scrypt hashes, are single-use, allow at most five incorrect verification attempts, and requests are rate-limited with a resend cooldown. HttpOnly/SameSite=Strict cookie; Secure on Vercel. Normal sessions are non-persistent and expire server-side after eight hours. Explicit trusted-device sessions persist for seven days, then require a new code. Logout invalidates the stored session. Legacy password login is migration-only and is disabled automatically when e-mail-code delivery is configured unless an explicit fallback flag is enabled.
- Body size and typed input validation. Anonymous case creation is rate-limited per source IP. No credentials in source or frontend bundle.
- Private object storage, short-lived upload/download URLs and post-upload size check. Evidence downloads require case or staff authorization. Hardware cases reject non-photo/video evidence server-side. S3 CORS must allow only the actual portal origin and PUT/GET/HEAD as necessary.
- Bridge accepts only exact Host and configured Origin plus a random per-run token. It exposes only predefined actions, not arbitrary shell commands. execFile/spawn use argument arrays and validated serials.
- RC3 binaries are hash verified. Hashes detect corruption and accidental substitution; they do not replace a signed release.

Before broader external production: add account revocation/session management, stronger audit/monitoring around authentication, abuse prevention for anonymous case creation, malware/content validation for uploads, retention/deletion workflow, normalized transactional database and signed installer. Current initial backend is intended for internal validation. Do not advertise it as production-hardened.


## Abuse controls and evidence lifecycle

BRTE applies layered abuse controls without relying on IP alone:

- Anonymous case creation is rate-limited by source IP and by a hashed normalized customer identity (e-mail + phone). The customer identity counter avoids scanning the case table for every submission.
- A case accepts at most 15 active evidence files and 3 GB total evidence, while each individual file remains capped at 1 GB.
- Evidence reservations are bounded so abandoned/retried uploads cannot create unlimited database records for one case.
- The browser computes a sampled SHA-256 fingerprint from small beginning/middle/end slices plus size/type. This catches common accidental duplicate uploads without reading a multi-GB file into memory. It is a deduplication aid, not a malware or authenticity check.
- Customer uploads are open for the initial submission window. TFAE can reopen the window by setting the case to `awaiting_customer`; that request remains open for seven days.
- Spam, duplicate and archived cases are soft-moderated. They leave the active operational queue but retain case history and audit events. Moderation notes are internal and are not returned in customer case views.
- Physical evidence deletion is intentionally separate from moderation. Retention/deletion and malware scanning remain required before a broad public rollout.
