import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product, ShoppingListItem, Store } from "@musti/core";
import { buildCanonicalStoreIdMap } from "@musti/core";
import { getZustandStorage } from "@/utils/storage/zustandStorage";
import { createId } from "@/utils/id";

const STORAGE_KEY = "shopping_list_v1";

type AddItemInput = {
  name: string;
  productId?: string;
  storeId?: string;
  quantity?: number;
  unit?: string;
};

type ShoppingListState = {
  items: ShoppingListItem[];
  isHydrated: boolean;
  loadFromStorage: () => Promise<void>;
  addItem: (input: AddItemInput) => Promise<void>;
  addItemIfMissing: (input: AddItemInput) => Promise<boolean>;
  hasActiveItem: (input: {
    productId?: string;
    name?: string;
    storeId?: string;
  }) => boolean;
  toggleItem: (id: string) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  clearChecked: () => Promise<void>;
  syncWithCatalog: (input: {
    stores: Store[];
    products: Product[];
  }) => void;
};

export const useShoppingListStore = create(
  persist<ShoppingListState>(
    (set, get) => ({
      items: [],
      isHydrated: false,

      async loadFromStorage() {
        if (!get().isHydrated) {
          set({ isHydrated: true });
        }
      },

      hasActiveItem(input) {
        const name = input.name?.trim().toLowerCase();
        const targetStoreId = input.storeId ?? undefined;
        return get().items.some((item) => {
          if (item.checked) return false;
          const itemStoreId = item.storeId ?? undefined;
          if (input.productId && item.productId === input.productId) {
            return itemStoreId === targetStoreId;
          }
          if (name && item.name.trim().toLowerCase() === name) {
            return itemStoreId === targetStoreId;
          }
          return false;
        });
      },

      async addItemIfMissing(input) {
        if (get().hasActiveItem(input)) return false;
        await get().addItem(input);
        return true;
      },

      async addItem(input) {
        const trimmed = input.name.trim();
        if (!trimmed) return;

        const item: ShoppingListItem = {
          id: createId("shop"),
          name: trimmed,
          productId: input.productId,
          storeId: input.storeId,
          quantity: input.quantity,
          unit: input.unit,
          checked: false,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          items: [item, ...state.items],
        }));
      },

      async toggleItem(id) {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, checked: !item.checked } : item
          ),
        }));
      },

      async removeItem(id) {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      async clearChecked() {
        set((state) => ({
          items: state.items.filter((item) => !item.checked),
        }));
      },

      syncWithCatalog({ stores, products }) {
        const canonicalStoreIds = buildCanonicalStoreIdMap(stores);
        const knownStoreIds = new Set(stores.map((store) => store.id));
        const productNameById = new Map(products.map((p) => [p.id, p.name]));

        let changed = false;
        const items = get()
          .items.map((item) => {
            let next = item;

            if (item.storeId) {
              if (canonicalStoreIds.has(item.storeId)) {
                const canonical = canonicalStoreIds.get(item.storeId)!;
                if (canonical !== item.storeId) {
                  next = { ...next, storeId: canonical };
                  changed = true;
                }
              } else if (!knownStoreIds.has(item.storeId)) {
                next = { ...next, storeId: undefined };
                changed = true;
              }
            }

            if (!next.name?.trim() && next.productId) {
              const productName = productNameById.get(next.productId)?.trim();
              if (productName) {
                next = { ...next, name: productName };
                changed = true;
              }
            }

            return next;
          })
          .filter((item) => item.name?.trim() || item.productId);

        if (changed || items.length !== get().items.length) {
          set({ items });
        }
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => getZustandStorage()),
      onRehydrateStorage: () => (state) => {
        if (!state?.items?.length) {
          useShoppingListStore.setState({ isHydrated: true });
          return;
        }

        const items = state.items
          .map((item) => {
            const legacyName =
              item.name?.trim() ||
              (item as { title?: string }).title?.trim() ||
              "";
            return legacyName ? { ...item, name: legacyName } : item;
          })
          .filter((item) => item.name?.trim() || item.productId);

        useShoppingListStore.setState({ items, isHydrated: true });
      },
    }
  )
);
