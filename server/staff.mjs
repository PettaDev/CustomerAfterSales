import { passwordMatches } from "./security.mjs";

function clean(value) {
  return String(value || "").trim();
}

function normalizeEmail(value) {
  return clean(value).toLowerCase();
}

function normalizeRole(value) {
  return clean(value).toLowerCase() === "manager" ? "manager" : "tfae";
}

export function publicStaff(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    market: user.market,
    country: user.country,
    role: normalizeRole(user.role),
  };
}

function legacyStaffUser() {
  const email = normalizeEmail(process.env.STAFF_EMAIL);
  const passwordHash = clean(process.env.STAFF_PASSWORD_HASH);
  if (!email || !passwordHash) return null;
  return {
    id: clean(process.env.STAFF_ID) || "gustavo",
    name: clean(process.env.STAFF_NAME) || "Gustavo",
    email,
    market: clean(process.env.STAFF_MARKET).toUpperCase() || "BR",
    country: clean(process.env.STAFF_COUNTRY) || "Brasil",
    role: normalizeRole(process.env.STAFF_ROLE),
    passwordHash,
  };
}

export function staffUsers() {
  const users = [];
  const legacy = legacyStaffUser();
  if (legacy) users.push(legacy);

  const raw = process.env.STAFF_USERS_JSON;
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        users.push(...parsed.map((item) => ({
          id: clean(item?.id),
          name: clean(item?.name),
          email: normalizeEmail(item?.email),
          market: clean(item?.market).toUpperCase(),
          country: clean(item?.country),
          role: normalizeRole(item?.role),
          passwordHash: clean(item?.passwordHash),
        })));
      }
    } catch {
      // A malformed multi-user variable must not disable the legacy staff login.
    }
  }

  const byEmail = new Map();
  for (const user of users) {
    if (!user.id || !user.name || !user.email) continue;
    byEmail.set(user.email, user);
  }
  return [...byEmail.values()];
}

export function findStaffByEmail(email) {
  const normalized = normalizeEmail(email);
  return staffUsers().find((item) => item.email === normalized) || null;
}

export function authenticateStaff(email, password) {
  const user = findStaffByEmail(email);
  if (!user || !user.passwordHash || !passwordMatches(String(password || ""), user.passwordHash)) return null;
  return publicStaff(user);
}


/**
 * Operational assignees are not authentication accounts. Gustavo may sign in
 * with a Manager role and still receive TFAE work. Virtual entries below have
 * no login, email or password and cannot authenticate.
 */
export function assignableTfaes() {
  const tfaes = staffUsers().filter((user) => user.role === "tfae").map(publicStaff);
  const known = new Set(tfaes.map((user) => user.name.trim().toLocaleLowerCase()));
  const roster = [
    { id: "tfae-br-gustavo-petta", name: "Gustavo Petta", email: "", market: "BR", country: "Brasil", role: "tfae" },
    { id: "tfae-ec-tommy-alvarado", name: "Tommy Alvarado", email: "", market: "EC", country: "Equador", role: "tfae" },
  ];
  for (const analyst of roster) {
    if (!known.has(analyst.name.toLocaleLowerCase())) {
      tfaes.push(analyst);
      known.add(analyst.name.toLocaleLowerCase());
    }
  }
  return tfaes;
}
