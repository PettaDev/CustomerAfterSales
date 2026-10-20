/**
 * Restore the no-computer customer form if Android suspends or reloads the tab
 * while BRTE Collector is being installed or used.
 *
 * Session-only, four-hour expiration. Never store file bytes, access tokens,
 * full hardware identifiers or uploaded evidence. Clear on case creation.
 */
const KEY = "brte-mobile-collector-draft-v1";
const MAX_AGE_MS = 4 * 60 * 60 * 1000;
const TEXT_KEYS = [
  "brand", "model", "build", "category", "problem", "description",
  "expected", "carrier", "name", "email", "phone",
] as const;

export type MobileCollectorDraft<T> = { step: number; form: Partial<T> };

function safeTextFields<T>(value: unknown): Partial<T> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const src = value as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const key of TEXT_KEYS) {
    if (typeof src[key] === "string") {
      result[key] = (src[key] as string).slice(0, key === "description" ? 5000 : 1000);
    }
  }
  return result as unknown as Partial<T>;
}

export function readMobileCollectorDraft<T>(): MobileCollectorDraft<T> | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      clearMobileCollectorDraft(); return null;
    }
    const obj = value as Record<string, unknown>;
    if (
      obj.version !== 1 || obj.method !== "mobile" ||
      typeof obj.savedAt !== "number" || !Number.isFinite(obj.savedAt) ||
      Date.now() - obj.savedAt > MAX_AGE_MS || obj.savedAt > Date.now() + 60_000 ||
      typeof obj.step !== "number" || !Number.isInteger(obj.step) ||
      obj.step < 2 || obj.step > 3 ||
      !obj.form || typeof obj.form !== "object" || Array.isArray(obj.form) ||
      (obj.form as Record<string, unknown>).category !== "software"
    ) {
      clearMobileCollectorDraft(); return null;
    }
    return { step: obj.step, form: safeTextFields<T>(obj.form) };
  } catch {
    clearMobileCollectorDraft();
    return null;
  }
}

export function saveMobileCollectorDraft<T>(step: number, form: T): void {
  if (step < 2 || step > 3) return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify({
      version: 1,
      method: "mobile",
      savedAt: Date.now(),
      step,
      form: safeTextFields<T>(form),
    }));
  } catch { /* Storage may be disabled; customer can still complete the form. */ }
}

export function clearMobileCollectorDraft(): void {
  try { sessionStorage.removeItem(KEY); } catch { /* private mode */ }
}
