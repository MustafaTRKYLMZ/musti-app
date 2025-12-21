import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createId } from "@/utils/id";
import { BookSection } from "@budget/core";
import { clampPage } from "@/utils/number";

function normalizeSections(input: BookSection[]): BookSection[] {
  const arr = (input || [])
    .filter(Boolean)
    .map((s) => {
      const start = clampPage(s.startPage ?? 1);
      const endRaw =
        s.endPage == null || Number.isNaN(Number(s.endPage))
          ? null
          : clampPage(s.endPage);
      const title = (s.title || "").trim() || "Untitled";
      return { ...s, title, startPage: start, endPage: endRaw };
    })
    .sort((a, b) => a.startPage - b.startPage);

    return arr;
}

/**
 * If endPage is empty: use (startPage of the next section) - 1
 * If this is the last section: use totalPages
 * If endPage exists but is smaller than startPage: adjust it
 */
export function resolveEndPages(
  sectionsInput: BookSection[],
  totalPages?: number | null
): Required<BookSection>[] {
  const sections = normalizeSections(sectionsInput);
  const tp = totalPages ? clampPage(totalPages) : 999999;

  return sections.map((sec, idx) => {
    const start = clampPage(sec.startPage);
    let end =
      sec.endPage == null ? null : clampPage(sec.endPage);

    if (end == null) {
      const next = sections[idx + 1];
      if (next?.startPage) {
        end = Math.max(start, clampPage(next.startPage) - 1);
      } else {
        end = tp;
      }
    }

    end = Math.max(start, end);
    end = Math.min(tp, end);

    return {
      ...sec,
      startPage: start,
      endPage: end,
    } as Required<BookSection>;
  });
}

export type BookSectionsState = {
  byBook: Record<string, BookSection[]>;
  setSectionsForBook: (bookUri: string, sections: BookSection[]) => void;
  addSection: (bookUri: string, section: Omit<BookSection, "id">) => void;
  updateSection: (bookUri: string, id: string, patch: Partial<BookSection>) => void;
  removeSection: (bookUri: string, id: string) => void;
  reorderSections: (bookUri: string, orderedIds: string[]) => void;
  renameBookSections: (oldUri: string, newUri: string) => void;

  normalizeBookSections: (bookUri: string) => void;
  getResolvedSections: (bookUri: string, totalPages?: number | null) => Required<BookSection>[];
};

export const useBookSectionsStore = create<BookSectionsState>()(
  persist(
    (set, get) => ({
      byBook: {},

      setSectionsForBook: (bookUri, sections) =>
        set((state) => ({
          byBook: {
            ...state.byBook,
            [bookUri]: normalizeSections(sections),
          },
        })),

      addSection: (bookUri, sectionInput) =>
        set((state) => {
          const current = state.byBook[bookUri] ?? [];
          const newSection: BookSection = {
            id: createId("section"),
            title: (sectionInput.title || "").trim() || "Untitled",
            startPage: clampPage(sectionInput.startPage ?? 1),
            endPage:
              sectionInput.endPage == null ? null : clampPage(sectionInput.endPage),
            color: sectionInput.color ?? null,
          };

          return {
            byBook: {
              ...state.byBook,
              [bookUri]: normalizeSections([...current, newSection]),
            },
          };
        }),

      updateSection: (bookUri, id, patch) =>
        set((state) => {
          const current = state.byBook[bookUri] ?? [];
          const next = current.map((sec) => {
            if (sec.id !== id) return sec;

            const title =
              patch.title != null ? (patch.title || "").trim() || "Untitled" : sec.title;

            const startPage =
              patch.startPage != null ? clampPage(patch.startPage) : sec.startPage;

            const endPage =
              patch.endPage === undefined
                ? sec.endPage
                : patch.endPage == null
                ? null
                : clampPage(patch.endPage);

            const color = patch.color === undefined ? sec.color : patch.color;

            return { ...sec, title, startPage, endPage, color };
          });

          return {
            byBook: {
              ...state.byBook,
              [bookUri]: normalizeSections(next),
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
          const current = normalizeSections(state.byBook[bookUri] ?? []);
          const map = new Map(current.map((s) => [s.id, s]));
          const reordered: BookSection[] = [];

          orderedIds.forEach((id) => {
            const found = map.get(id);
            if (found) reordered.push(found);
          });

          current.forEach((sec) => {
            if (!orderedIds.includes(sec.id)) reordered.push(sec);
          });

          return {
            byBook: {
              ...state.byBook,
              [bookUri]: normalizeSections(reordered),
            },
          };
        }),

      renameBookSections: (oldUri, newUri) =>
        set((state) => {
          const existing = state.byBook[oldUri];
          if (!existing) return state;
          const { [oldUri]: _, ...rest } = state.byBook;

          return {
            byBook: {
              ...rest,
              [newUri]: existing,
            },
          };
        }),

      // ✅ yeni: mevcut book'un sections listesini normalize et (sıra/validity)
      normalizeBookSections: (bookUri) =>
        set((state) => {
          const current = state.byBook[bookUri];
          if (!current) return state;
          return {
            byBook: {
              ...state.byBook,
              [bookUri]: normalizeSections(current),
            },
          };
        }),

      // ✅ yeni: UI’da “endPage garantili” liste
      getResolvedSections: (bookUri, totalPages) => {
        const sections = get().byBook[bookUri] ?? [];
        return resolveEndPages(sections, totalPages);
      },
    }),
    {
      name: "book-sections-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
