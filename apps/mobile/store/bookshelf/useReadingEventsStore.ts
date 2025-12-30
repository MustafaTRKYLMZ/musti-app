import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReadingMode, ReadingEvent } from "@budget/core";
import { toIntOr } from "@/utils/number";

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
  resolveSectionForPage?: ResolveSectionForPage;
  setSectionResolver: (fn?: ResolveSectionForPage) => void;

  addEvent: (e: AddEventInput) => void;

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

const MAX_STORED_EVENTS = 2000;

const normalizePages = (pageFrom: any, pageTo: any) => {
  const a0 = Math.max(1, toIntOr(pageFrom, 1));
  const b0 = Math.max(1, toIntOr(pageTo, a0));
  const from = Math.min(a0, b0);
  const to = Math.max(a0, b0);
  return { from, to };
};

const normalizeDurationMs = (v: any) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return undefined;
  if (n <= 0) return undefined;
  // hard cap: 6 hours (avoid corrupted huge values)
  return Math.min(Math.floor(n), 6 * 60 * 60 * 1000);
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

        const durationMs = normalizeDurationMs((e as any).durationMs);

        const next: ReadingEvent = {
          ...e,
          pageFrom: from,
          pageTo: to,
          sectionId,
          sectionTitle,
          durationMs,
          id: mkId(),
        };

        set((state) => {
          const merged = [next, ...(state.events ?? [])];
          return { events: merged.slice(0, MAX_STORED_EVENTS) };
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
