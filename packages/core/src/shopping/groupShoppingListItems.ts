import type { ShoppingListItem } from "../types/shoppingList";

export type ShoppingListGroup = {
  storeId: string | null;
  storeName: string;
  items: ShoppingListItem[];
};

export type GroupShoppingListOptions = {
  /** Maps persisted store ids to a canonical id, or null when the store no longer exists. */
  resolveCanonicalStoreId?: (storeId: string) => string | null;
};

function sortShoppingListItems(items: ShoppingListItem[]): ShoppingListItem[] {
  return [...items].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

function mergeGroupsByStoreName(groups: ShoppingListGroup[]): ShoppingListGroup[] {
  const merged = new Map<string, ShoppingListGroup>();

  for (const group of groups) {
    const existing = merged.get(group.storeName);
    if (!existing) {
      merged.set(group.storeName, {
        storeId: group.storeId,
        storeName: group.storeName,
        items: [...group.items],
      });
      continue;
    }

    existing.items.push(...group.items);
    if (!existing.storeId && group.storeId) {
      existing.storeId = group.storeId;
    }
  }

  return [...merged.values()].map((group) => ({
    ...group,
    items: sortShoppingListItems(group.items),
  }));
}

export function groupShoppingListItems(
  items: ShoppingListItem[],
  storeNameById: Map<string, string>,
  noStoreLabel: string,
  options?: GroupShoppingListOptions
): ShoppingListGroup[] {
  const resolve = options?.resolveCanonicalStoreId ?? ((storeId: string) => storeId);
  const map = new Map<string | null, ShoppingListItem[]>();

  for (const item of items) {
    const key =
      item.storeId == null || item.storeId === ""
        ? null
        : resolve(item.storeId) ?? null;

    const bucket = map.get(key) ?? [];
    bucket.push(item);
    map.set(key, bucket);
  }

  const groups: ShoppingListGroup[] = [...map.entries()].map(
    ([storeId, groupItems]) => ({
      storeId,
      storeName: storeId
        ? storeNameById.get(storeId) ?? noStoreLabel
        : noStoreLabel,
      items: sortShoppingListItems(groupItems),
    })
  );

  const merged = mergeGroupsByStoreName(groups);

  return merged.sort((a, b) => {
    const aOpen = a.items.some((i) => !i.checked);
    const bOpen = b.items.some((i) => !i.checked);
    if (aOpen !== bOpen) return aOpen ? -1 : 1;
    if (a.storeId == null) return 1;
    if (b.storeId == null) return -1;
    return a.storeName.localeCompare(b.storeName);
  });
}

export function resolveShoppingListItemLabel(
  item: ShoppingListItem,
  productNameById?: Map<string, string>,
  unnamedLabel = "?"
): string {
  const direct = item.name?.trim();
  if (direct) {
    return item.quantity && item.quantity > 1
      ? `${item.quantity}× ${direct}`
      : direct;
  }

  const fromProduct =
    item.productId != null
      ? productNameById?.get(item.productId)?.trim()
      : undefined;

  if (fromProduct) {
    return item.quantity && item.quantity > 1
      ? `${item.quantity}× ${fromProduct}`
      : fromProduct;
  }

  return unnamedLabel;
}
