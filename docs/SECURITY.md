# Security
- API enforces case token or staff session server-side; knowing a case ID alone is insufficient.
- Case access tokens: 256-bit random, stored as SHA-256 digest server-side. Plain token returned once to the customer. Token is carried in Authorization, never in query URLs.
- Staff password: scrypt hash with random salt, configured out of band. HttpOnly/SameSite=Strict cookie; Secure on Vercel. Logout invalidates stored session. Eight-hour expiry; login attempts limited per IP.
- Body size and typed input validation. No credentials in source or frontend bundle.
- Private object storage, short-lived upload/download URLs and post-upload size check. Evidence downloads require case or staff authorization. S3 CORS must allow only the actual portal origin and PUT/GET/HEAD as necessary.
- Bridge accepts only exact Host and configured Origin plus a random per-run token. It exposes only predefined actions, not arbitrary shell commands. execFile/spawn use argument arrays and validated serials.
- RC3 binaries are hash verified. Hashes detect corruption and accidental substitution; they do not replace a signed release.

Before external production: provision authentication lifecycle/per-user roles, durable distributed rate limits, abuse prevention for anonymous case creation, malware/content validation for uploads, retention/deletion workflow, monitoring, normalized transactional database and signed installer. Current initial backend is intended for internal validation. Do not advertise it as production-hardened.
