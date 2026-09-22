# BRTE Portal · Customer After-Sales

Gustavo Petta / PettaDev

Customer portal, Android diagnostic bridge and TFAE case management. Node.js 24 + React 19 + TypeScript. Internal validation build implementing the three requested product flows.

## Start locally
```sh
npm ci
cp .env.example .env
npm run setup:staff
npm run server
```
In another terminal:
```sh
npm run dev
```
Open http://localhost:5173. API on port 3001. Local records/evidence are persisted in .local and are ignored by git. No demo records or default staff password are shipped.

## Included
- Four-step customer flow: device, problem, evidence, contact/consent.
- Case protocol + private access code, tracking and later evidence upload.
- Protected TFAE dashboard with search, status, priority, assignment and timeline.
- Source-based PC/mobile guide, screenshots, videos, brand themes and seven original languages.
- Local Bridge: verified RC3 runtime, automatic device detection, platform routing, START/STOP, native screen mirroring, validated video, partial recovery, ZIP and multiple sessions per case.
- Direct upload interfaces for private cloud evidence; automatic upload/retry from Bridge.

## Validation and release status
npm test passes 12 tests; npm run build succeeds. The 14 mandatory RC3 components passed SHA-256/size verification. Windows/USB acceptance, production PostgreSQL/private bucket, staff credentials and privacy operating policy are still required. This is not yet a qualified public-customer release.

## Documentation
- [Reuse matrix](docs/REUSE_MATRIX.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Customer flow](docs/CUSTOMER_FLOW.md)
- [TFAE flow](docs/TFAE_FLOW.md)
- [Support Bridge setup](docs/SUPPORT_BRIDGE.md)
- [Capture pipeline](docs/CAPTURE_PIPELINE.md)
- [Security](docs/SECURITY.md) · [Privacy](docs/PRIVACY.md)
- [Tests](docs/TESTING.md) · [Deployment](docs/DEPLOYMENT.md)
- [Decisions](docs/DECISIONS.md)

## Sources
CustomersGuide branch agent/transsion-log-guide (d11db7bcbc0543e955b723ea326ee838b6118e13), owner-supplied MobileQA RC3, and [official scrcpy](https://github.com/Genymobile/scrcpy). Existing public guide assets remain under the original repository MIT license. No captures, private logs or binary distributions are published here.

Tutorial screenshots, videos and flags are reused through Vercel rewrites to the immutable CustomersGuide commit d11db7bcbc0543e955b723ea326ee838b6118e13, avoiding duplicate media uploads. Local copies can be restored from that source for offline guide development.
