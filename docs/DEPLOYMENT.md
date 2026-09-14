# Vercel deployment
Repository: https://github.com/PettaDev/CustomerAfterSales
Root directory: repository root. Framework preset: Vite. Build: npm run build. Output: dist. Node.js: 24.x. /api/index.mjs exports the Express app; vercel.json preserves API paths and browser SPA routes.

Only the clean repository should be deployed. .vercelignore excludes local evidence, bridge/test/docs folders and environment files. Customer uploads never become deployment assets.

## Production configuration
Set APP_ORIGIN to exact HTTPS deployment origin. Configure:
- DATABASE_URL: PostgreSQL connection string.
- STAFF_EMAIL and STAFF_PASSWORD_HASH: generated with scripts/setup-staff.mjs; hash stored as an encrypted Vercel environment variable.
- S3_BUCKET, S3_REGION, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY; optional S3_PATH_STYLE.
- Optional GOOGLE_GENERATIVE_AI_API_KEY / GEMINI_MODEL for guide assistant.

Configure private bucket CORS for the actual portal origin. Restrict credentials to that bucket and required object operations. No secrets should be sent in chat or committed.

```sh
npm ci
npm test
npm run build
vercel link
vercel deploy
```

Validate preview /api/health and full case/upload/auth flow with test data, then deploy production. Missing cloud configuration produces explicit 503 errors; it never silently stores data in ephemeral Vercel disk or localStorage.

Read deployment build logs and verify final READY state. A successful local build alone does not mean the site is deployed.

Tutorial screenshots, videos and flags are reused through Vercel rewrites to the immutable CustomersGuide commit d11db7bcbc0543e955b723ea326ee838b6118e13, avoiding duplicate media uploads. Local copies can be restored from that source for offline guide development.
