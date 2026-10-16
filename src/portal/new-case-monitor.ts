import type { Case } from "./api";

export function findNewCases(
  known: ReadonlySet<string> | null,
  pending: readonly Case[],
  now = Date.now(),
): { known: Set<string>; fresh: Case[] } {
  const unique = new Map<string, Case>();
  for (const item of pending) {
    if (item?.id && item.status === "received" &&
        (item.moderationState || "active") === "active") unique.set(item.id, item);
  }
  const current = new Set(unique.keys());
  if (known === null) return { known: current, fresh: [] };
  const fresh = [...unique.values()].filter(item => {
    const created = Date.parse(item.createdAt);
    return !known.has(item.id) && Number.isFinite(created) &&
      created <= now + 60_000 && now - created <= 30 * 60_000;
  });
  return { known: new Set([...known, ...current]), fresh };
}
