/* Ephemeral customer intake recovery. Never send this draft to the backend.
   sessionStorage is limited to this browser tab; 2-hour expiry reduces exposure
   on shared devices. Evidence Files, IMEI/serial, consent and tokens are excluded. */
export const CUSTOMER_DRAFT_KEY = "brte-customer-intake-draft-v1";
export const CUSTOMER_DRAFT_TTL_MS = 2 * 60 * 60 * 1000;

type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

export type CustomerDraft = {
  step: number;
  form: Record<string, string | boolean>;
  collectionMethod: "mobile" | "browser" | null;
  hardwareSafety: "safe" | "risk" | null;
  hadFiles: boolean;
};

const storage = (): DraftStorage | null => {
  try { return typeof window !== "undefined" ? window.sessionStorage : null; }
  catch { return null; }
};

const cleanForm = (form: Record<string, unknown>) => {
  const safe: Record<string, string | boolean> = {};
  for (const [key, value] of Object.entries(form)) {
    if (key === "deviceIdentifier" || key === "consent" || key === "accessToken") continue;
    if (typeof value === "string") safe[key] = value.slice(0, 5000);
    else if (typeof value === "boolean") safe[key] = value;
  }
  return safe;
};

export function readCustomerDraft(store: DraftStorage | null = storage(), now = Date.now()): CustomerDraft | null {
  if (!store) return null;
  try {
    const raw = store.getItem(CUSTOMER_DRAFT_KEY);
    if (!raw || raw.length > 25000) return null;
    const saved = JSON.parse(raw);
    if (saved?.version !== 1 || !Number.isFinite(saved?.savedAt) ||
        saved.savedAt > now || now - saved.savedAt > CUSTOMER_DRAFT_TTL_MS ||
        !saved.form || typeof saved.form !== "object" || Array.isArray(saved.form) ||
        !Number.isInteger(saved.step) || saved.step < 0 || saved.step > 3) {
      store.removeItem(CUSTOMER_DRAFT_KEY);
      return null;
    }
    return {
      step: saved.step,
      form: cleanForm(saved.form),
      collectionMethod: ["mobile", "browser"].includes(saved.collectionMethod) ? saved.collectionMethod : null,
      hardwareSafety: ["safe", "risk"].includes(saved.hardwareSafety) ? saved.hardwareSafety : null,
      hadFiles: saved.hadFiles === true,
    };
  } catch { return null; }
}

export function saveCustomerDraft(draft: CustomerDraft, store: DraftStorage | null = storage(), now = Date.now()): boolean {
  if (!store) return false;
  try {
    const form = cleanForm(draft.form);
    const meaningful = draft.step > 0 || draft.collectionMethod != null ||
      Object.values(form).some(value => typeof value === "string" ? value.trim().length > 0 : value === true);
    if (!meaningful) { store.removeItem(CUSTOMER_DRAFT_KEY); return true; }
    store.setItem(CUSTOMER_DRAFT_KEY, JSON.stringify({
      version: 1, savedAt: now, step: Math.min(Math.max(draft.step, 0), 3),
      form, collectionMethod: draft.collectionMethod, hardwareSafety: draft.hardwareSafety,
      hadFiles: draft.hadFiles,
    }));
    return true;
  } catch { return false; }
}

export function clearCustomerDraft(store: DraftStorage | null = storage()) {
  try { store?.removeItem(CUSTOMER_DRAFT_KEY); } catch { /* storage denied */ }
}
