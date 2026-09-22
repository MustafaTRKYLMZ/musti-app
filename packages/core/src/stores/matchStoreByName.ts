import type { Store } from "../types/store";
import { storeNamesMatch } from "../receipt/parseReceiptText";
import { dedupeStores } from "./dedupeStores";

export function findMatchingStore(
  stores: Store[],
  name: string
): Store | undefined {
  const trimmed = name.trim();
  if (!trimmed) return undefined;

  return dedupeStores(stores).find((store) =>
    storeNamesMatch(store.name, trimmed)
  );
}

/** Suggest existing stores when OCR/manual name does not exactly match. */
export function suggestStoresForName(
  stores: Store[],
  name: string,
  limit = 5
): Store[] {
  const deduped = dedupeStores(stores);
  if (!deduped.length) return [];

  const exact = findMatchingStore(stores, name);
  if (exact) return [exact];

  const needle = name.trim().toLowerCase();
  if (!needle) return deduped.slice(0, limit);

  const scored = deduped
    .map((store) => {
      const hay = store.name.toLowerCase();
      let score = 0;
      if (storeNamesMatch(store.name, name)) score += 5;
      if (hay.includes(needle) || needle.includes(hay)) score += 2;

      for (const word of needle.split(/\s+/).filter((part) => part.length >= 3)) {
        if (hay.includes(word)) score += 1;
      }

      return { store, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.store.name.localeCompare(b.store.name));

  return scored.slice(0, limit).map((entry) => entry.store);
}
