import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { nanoid } from "nanoid";

export type BookSection = {
  id: string;         
  title: string;
  startPage: number;
  endPage?: number | null;
  color?: string | null; 
};

export type BookSectionsState = {
  byBook: Record<string, BookSection[]>;
  setSectionsForBook: (bookUri: string, sections: BookSection[]) => void;
  addSection: (bookUri: string, section: Omit<BookSection, "id">) => void;
  updateSection: (bookUri: string, id: string, patch: Partial<BookSection>) => void;
  removeSection: (bookUri: string, id: string) => void;
  reorderSections: (bookUri: string, orderedIds: string[]) => void;
  renameBookSections: (oldUri: string, newUri: string) => void;
};

export const useBookSectionsStore = create<BookSectionsState>()(
  persist(
    (set, get) => ({
      byBook: {},

      setSectionsForBook: (bookUri, sections) =>
        set((state) => ({
          byBook: {
            ...state.byBook,
            [bookUri]: sections,
          },
        })),

      addSection: (bookUri, sectionInput) =>
        set((state) => {
          const current = state.byBook[bookUri] ?? [];
          const id = nanoid();
          const newSection: BookSection = {
            id,
            ...sectionInput,
          };

          return {
            byBook: {
              ...state.byBook,
              [bookUri]: [...current, newSection],
            },
          };
        }),

      updateSection: (bookUri, id, patch) =>
        set((state) => {
          const current = state.byBook[bookUri] ?? [];
          return {
            byBook: {
              ...state.byBook,
              [bookUri]: current.map((sec) =>
                sec.id === id ? { ...sec, ...patch } : sec
              ),
            },
          };
        }),

      removeSection: (bookUri, id) =>
        set((state) => {
          const current = state.byBook[bookUri] ?? [];
          return {
            byBook: {
              ...state.byBook,
              [bookUri]: current.filter((sec) => sec.id !== id),
            },
          };
        }),

      reorderSections: (bookUri, orderedIds) =>
        set((state) => {
          const current = state.byBook[bookUri] ?? [];
          const map = new Map(current.map((s) => [s.id, s]));
          const reordered: BookSection[] = [];

          orderedIds.forEach((id) => {
            const found = map.get(id);
            if (found) reordered.push(found);
          });
          current.forEach((sec) => {
            if (!orderedIds.includes(sec.id)) {
              reordered.push(sec);
            }
          });

          return {
            byBook: {
              ...state.byBook,
              [bookUri]: reordered,
            },
          };
        }),

      renameBookSections: (oldUri, newUri) =>
        set((state) => {
          const existing = state.byBook[oldUri];
          if (!existing) return {};
          const { [oldUri]: _, ...rest } = state.byBook;

          return {
            byBook: {
              ...rest,
              [newUri]: existing,
            },
          };
        }),
    }),
    {
      name: "book-sections-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
