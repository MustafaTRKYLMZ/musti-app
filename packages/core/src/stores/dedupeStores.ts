import type { Store } from "../types/store";
import { storeNamesMatch } from "../receipt/parseReceiptText";

/** Merge stores that refer to the same chain/location. Keeps the most specific name. */
export function dedupeStores(stores: Store[]): Store[] {
  const result: Store[] = [];

  for (const store of stores) {
    const index = result.findIndex((entry) => storeNamesMatch(entry.name, store.name));
    if (index < 0) {
      result.push(store);
      continue;
    }

    const kept = result[index];
    if (store.name.trim().length > kept.name.trim().length) {
      result[index] = {
        ...kept,
        name: store.name.trim(),
        fullName: store.fullName ?? store.name.trim(),
        branchName: store.branchName ?? kept.branchName,
      };
    }
  }

  return result;
}

/** Maps every persisted store id to the canonical id kept after deduplication. */
export function buildCanonicalStoreIdMap(stores: Store[]): Map<string, string> {
  const deduped = dedupeStores(stores);
  const map = new Map<string, string>();

  for (const store of stores) {
    const canonical =
      deduped.find((entry) => storeNamesMatch(entry.name, store.name)) ??
      store;
    map.set(store.id, canonical.id);
  }

  return map;
}
