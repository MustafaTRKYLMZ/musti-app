// store/bookshelf/useReadingEventsStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ReadingMode = "normal" | "plan" | "target";

export type ReadingEvent = {
  id: string;

  date: string; // YYYY-MM-DD
  at: number; // ms

  mode: ReadingMode;

  bookUri: string;

  targetId?: string;

  pageFrom: number;
  pageTo: number;

  sectionId?: string;
  sectionTitle?: string;
};

type AddEventInput = Omit<ReadingEvent, "id">;

export type ResolvedSection = { id: string; title?: string } | undefined;
export type ResolveSectionForPage = (args: {
  bookUri: string;
  page: number;
  mode: ReadingMode;
  targetId?: string;
}) => ResolvedSection;

type ReadingEventsState = {
  events: ReadingEvent[];

  /**
   * Optional resolver to auto-attach section info based on page.
   * You set this once from a place that knows book sections (PdfViewer / Sidebar).
   */
  resolveSectionForPage?: ResolveSectionForPage;
  setSectionResolver: (fn?: ResolveSectionForPage) => void;

  addEvent: (e: AddEventInput) => void;

  // helpers
  getEventsForBookDate: (bookUri: string, date: string) => ReadingEvent[];
  getEventsForBookRange: (
    bookUri: string,
    fromDate: string,
    toDate: string
  ) => ReadingEvent[];

  reset: () => void;
};

const mkId = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;
const dateLTE = (a: string, b: string) => a <= b;

const clampInt = (n: any, fallback: number) => {
  const x = Math.floor(Number(n));
  return Number.isFinite(x) ? x : fallback;
};

/**
 * Normalize pages:
 * - accepts reversed ranges
 * - min page is 1
 */
const normalizePages = (pageFrom: any, pageTo: any) => {
  const a0 = Math.max(1, clampInt(pageFrom, 1));
  const b0 = Math.max(1, clampInt(pageTo, a0));
  const from = Math.min(a0, b0);
  const to = Math.max(a0, b0);
  return { from, to };
};

export const useReadingEventsStore = create<ReadingEventsState>()(
  persist(
    (set, get) => ({
      events: [],

      resolveSectionForPage: undefined,
      setSectionResolver: (fn) => set({ resolveSectionForPage: fn }),

      addEvent: (e) => {
        if (!e?.bookUri) return;
        if (!e?.date) return;

        const { from, to } = normalizePages(e.pageFrom, e.pageTo);

        // If caller didn't pass section, try to resolve.
        let sectionId = (e.sectionId ?? "").trim() || undefined;
        let sectionTitle = (e.sectionTitle ?? "").trim() || undefined;

        if (!sectionId && !sectionTitle) {
          const resolver = get().resolveSectionForPage;
          if (resolver) {
            // Prefer resolving by "to" page (usually the current page after reading)
            const res = resolver({
              bookUri: e.bookUri,
              page: to,
              mode: e.mode,
              targetId: e.targetId,
            });

            if (res?.id) sectionId = res.id;
            if (res?.title) sectionTitle = res.title;
          }
        }

        const next: ReadingEvent = {
          ...e,
          pageFrom: from,
          pageTo: to,
          sectionId,
          sectionTitle,
          id: mkId(),
        };

        // keep it bounded (prevents storage bloat)
        set((state) => {
          const merged = [next, ...(state.events ?? [])];
          const MAX = 2000;
          return { events: merged.slice(0, MAX) };
        });
      },

      getEventsForBookDate: (bookUri, date) => {
        if (!bookUri || !date) return [];
        return (get().events ?? []).filter(
          (e) => e.bookUri === bookUri && e.date === date
        );
      },

      getEventsForBookRange: (bookUri, fromDate, toDate) => {
        if (!bookUri || !fromDate || !toDate) return [];
        return (get().events ?? []).filter(
          (e) =>
            e.bookUri === bookUri &&
            dateLTE(fromDate, e.date) &&
            dateLTE(e.date, toDate)
        );
      },

      reset: () => set({ events: [] }),
    }),
    {
      name: "reading-events-v1",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
