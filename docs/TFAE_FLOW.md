# TFAE and Manager flow

Team access uses individual configured corporate e-mail accounts. No default or hardcoded production password exists.

## Authentication

Normal staff access is passwordless:

1. Enter the configured corporate e-mail address.
2. After the request passes rate limits, a 6-digit one-time code is sent by e-mail.
3. The code expires after 10 minutes, is stored only as a salted scrypt hash, and is removed after successful use.
4. Five incorrect verification attempts invalidate the code.
5. Requesting codes is rate-limited and has a one-minute resend cooldown.
6. The login response is neutral for unknown e-mail addresses so the endpoint does not expose the staff allowlist.

By default the authenticated browser receives a non-persistent session cookie and the server session expires after 8 hours.

If **Trust this device for 7 days** is selected, the server session and the secure HttpOnly cookie expire after exactly 7 days. After that, a new e-mail code is required. Signing out invalidates the session earlier.

Trusted-device access should only be used on a personal or dedicated corporate computer.

Production e-mail delivery requires `RESEND_API_KEY` and a verified `AUTH_EMAIL_FROM`. Until those are configured, the legacy password route remains available for migration. Once e-mail delivery is configured, password login is disabled unless `AUTH_ALLOW_PASSWORD_FALLBACK=true` is deliberately enabled.

## Roles

### TFAE

Operational analysts can:
- review all received cases;
- filter and search cases;
- open case details and private evidence;
- change status and priority;
- assign a case to a configured TFAE;
- publish customer-visible updates;
- have their identity recorded in the case timeline.

Only accounts with role `tfae` can be assigned as case owners.

### Manager

Manager accounts are supervisory and read-only. They can:
- review all cases and evidence;
- see the responsible TFAE on each case;
- inspect the full case timeline and which TFAE performed each action;
- see TFAE workload with active and assigned case counts.

Managers cannot change status, priority, owner, publish operational updates, or add evidence as staff.

## Current access policy

Market and country are staff metadata, not access boundaries. TFAEs and Managers currently have global visibility across the workspace. Regional restrictions should only be added after an explicit operating policy is defined.

## Case workflow

Statuses: received → reviewing → awaiting_customer / resolved.

Resolving a case never deletes evidence. Status and assignment changes create timeline records. Customer-visible updates are not hidden internal notes.
