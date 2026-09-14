# Architecture
Gustavo / PettaDev

React 19 + TypeScript + Vite browser application; Node.js 24 Express API; Node.js Support Bridge on the customer's Windows PC.

- Browser: / (customer wizard), /tracking, /capture, /dashboard, /guide, /privacy.
- API: /api/cases, per-case scoped evidence and capture session endpoints, /api/auth.
- Persistence: PostgreSQL in production; SQLite only for local development. Serverless deployments explicitly reject missing database/storage configuration.
- Large files: direct signed PUT to a private S3-compatible bucket, then completion check with HEAD and size validation. API does not proxy large files through Vercel.
- Bridge: loopback 127.0.0.1:43127, host and exact-origin check, random per-run bearer token, allowlisted operations, verified runtime.
- Case and Capture Session are independent entities; 1:N relationship. Each capture creates its own UUID, remote filename and local archive.

Storage schema uses records(id, kind, data). This flexible initial schema should be migrated to normalized tables and transactional event updates before high-volume operation. Current dashboard scans records; suitable for internal validation only.
