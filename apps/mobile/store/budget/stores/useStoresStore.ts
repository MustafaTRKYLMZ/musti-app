import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Store } from "@musti/core";
import { dedupeStores, storeNamesMatch } from "@musti/core";
import { getZustandStorage } from "@/utils/storage/zustandStorage";
import { createId } from "@/utils/id";

const STORAGE_KEY = "stores_v1";

type StoresState = {
  stores: Store[];
  isHydrated: boolean;
  loadFromStorage: () => Promise<void>;
  addStore: (store: Store) => Promise<void>;
  findByName: (name: string) => Store | undefined;
  resolveOrCreate: (name: string) => { store: Store; isNew: boolean };
};

export const useStoresStore = create(
  persist<StoresState>(
    (set, get) => ({
      stores: [],
      isHydrated: false,

      async loadFromStorage() {
        if (!get().isHydrated) {
          set({ isHydrated: true });
        }
      },

      async addStore(store) {
        const existing = get().findByName(store.name);
        if (existing) return;

        set((state) => ({
          stores: dedupeStores([...state.stores, store]),
        }));
      },

      findByName(name) {
        return get().stores.find((s) => storeNamesMatch(s.name, name));
      },

      resolveOrCreate(name) {
        const trimmed = name.trim();
        const existing = get().findByName(trimmed);
        if (existing) {
          if (trimmed.length > existing.name.length) {
            const updated = {
              ...existing,
              name: trimmed,
              fullName: trimmed,
            };
            set((state) => ({
              stores: state.stores.map((entry) =>
                entry.id === existing.id ? updated : entry
              ),
            }));
            return { store: updated, isNew: false };
          }
          return { store: existing, isNew: false };
        }

        const draft: Store = {
          id: createId("store"),
          name: trimmed,
          fullName: trimmed,
        };

        set((state) => ({
          stores: dedupeStores([...state.stores, draft]),
        }));

        const canonical = get().findByName(trimmed) ?? draft;
        return { store: canonical, isNew: canonical.id === draft.id };
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => getZustandStorage()),
      onRehydrateStorage: () => (state) => {
        if (state?.stores?.length) {
          useStoresStore.setState({
            stores: dedupeStores(state.stores),
            isHydrated: true,
          });
          return;
        }
        useStoresStore.setState({ isHydrated: true });
      },
    }
  )
);
