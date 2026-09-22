import { passwordMatches } from "./security.mjs";

function clean(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

export function publicStaff(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    market: user.market,
    country: user.country,
  };
}

export function staffUsers() {
  const raw = process.env.STAFF_USERS_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => ({
            id: clean(item?.id),
            name: clean(item?.name),
            email: normalizeEmail(item?.email),
            market: clean(item?.market).toUpperCase(),
            country: clean(item?.country),
            passwordHash: clean(item?.passwordHash),
          }))
          .filter((item) => item.id && item.name && item.email && item.passwordHash);
      }
    } catch {
      return [];
    }
  }

  const legacyEmail = normalizeEmail(process.env.STAFF_EMAIL);
  const legacyHash = clean(process.env.STAFF_PASSWORD_HASH);
  if (!legacyEmail || !legacyHash) return [];
  return [{
    id: clean(process.env.STAFF_ID) || "legacy",
    name: clean(process.env.STAFF_NAME) || "TFAE",
    email: legacyEmail,
    market: clean(process.env.STAFF_MARKET).toUpperCase() || "GLOBAL",
    country: clean(process.env.STAFF_COUNTRY),
    passwordHash: legacyHash,
  }];
}

export function authenticateStaff(email, password) {
  const normalized = normalizeEmail(email);
  const user = staffUsers().find((item) => item.email === normalized);
  if (!user || !passwordMatches(String(password || ""), user.passwordHash)) return null;
  return publicStaff(user);
}
