import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
export const token = () => randomBytes(32).toString("hex");
export const hash = (v) => createHash("sha256").update(v).digest("hex");
export function equal(a, b) {
  const x = Buffer.from(String(a)),
    y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
}
export function passwordMatches(password, encoded) {
  if (!encoded) return false;
  const [salt, digest] = encoded.split(":");
  try {
    return equal(scryptSync(password, salt, 64).toString("hex"), digest);
  } catch {
    return false;
  }
}
export function safeCase(c) {
  if (!c) return c;
  const { accessHash, ...rest } = c;
  return rest;
}
