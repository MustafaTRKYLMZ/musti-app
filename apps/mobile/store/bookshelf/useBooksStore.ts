// apps/mobile/store/useBooksStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { BookProgress } from "@musti/core";

interface BooksState {
  items: Record<string, BookProgress>;
  setProgress: (input: {
    uri: string;
    name: string;
    lastPage: number;
    totalPages?: number;
  }) => void;
  clearProgressForUri: (uri: string) => void;
  renameBook: (oldUri: string, newUri: string, newName: string) => void;
  reset: () => void;
}

export const useBooksStore = create<BooksState>()(
  persist(
    (set) => ({
      items: {},

      setProgress: ({ uri, name, lastPage, totalPages }) =>
        set((state) => {
          const prev = state.items[uri];

          const nextLastPage =
            typeof lastPage === "number" && lastPage > 0
              ? lastPage
              : prev?.lastPage ?? 1;

          const nextTotalPages =
            typeof totalPages === "number" && totalPages > 0
              ? totalPages
              : prev?.totalPages ?? undefined;

          return {
            items: {
              ...state.items,
              [uri]: {
                uri,
                name: name ?? prev?.name ?? "",
                lastPage: nextLastPage,
                totalPages: nextTotalPages,
                updatedAt: new Date().toISOString(),
                lastOpenedAt: new Date().toISOString(),
              },
            },
          };
        }),

      clearProgressForUri: (uri) =>
        set((state) => {
          const { [uri]: _removed, ...rest } = state.items;
          return { items: rest };
        }),

      renameBook: (oldUri, newUri, newName) =>
        set((state) => {
          const prev = state.items[oldUri];
          if (!prev) return state;

          const { [oldUri]: _removed, ...rest } = state.items;

          return {
            items: {
              ...rest,
              [newUri]: {
                ...prev,
                name: newName,
                updatedAt: new Date().toISOString(),
              },
            },
          };
        }),

      reset: () => set({ items: {} }),
    }),
    {
      name: "books-progress",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
