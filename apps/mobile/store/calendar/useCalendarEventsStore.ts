// apps/mobile/store/useCalendarEventsStore.ts

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { isGoogleEvent, type MEvent } from "@musti/planner";

type PendingDelete = {
  token: string;
  event: MEvent;
  timeoutId: any;
};

type DayKey = string; 

type State = {
  events: MEvent[];

  eventsById: Record<string, MEvent>;
  idsByDay: Record<DayKey, string[]>;
  hasHydrated: boolean;

  addEvent: (payload: Omit<MEvent, "id">) => MEvent;
  updateEvent: (id: string, patch: Partial<MEvent>) => void;
  deleteEvent: (id: string) => void;

  pendingDelete?: PendingDelete;
  deleteEventWithUndo: (id: string, durationMs?: number) => void;
  undoDelete: () => void;

  upsertExternalEvents: (calendarId: string, events: MEvent[]) => void;
  mergeEvent: (event: MEvent) => void;
  removeEventById: (id: string) => void;
  removeEventsForAccount: (accountId: string) => void;
  removeEventsForCalendar: (calendarId: string) => void;

  // internal helpers
  rebuildIndexes: () => void;
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const sortEvents = (arr: MEvent[]) =>
  [...arr].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);


const toDayKeyLocal = (isoLike: string): DayKey => {
  const d = new Date(isoLike);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
};

const buildIndexes = (events: MEvent[]) => {
  const byId: Record<string, MEvent> = {};
  const byDay: Record<DayKey, string[]> = {};

  for (const e of events) {
    byId[e.id] = e;

    const dk = toDayKeyLocal(e.start);
    if (!byDay[dk]) byDay[dk] = [];
    byDay[dk].push(e.id);
  }

  for (const dk of Object.keys(byDay)) {
    byDay[dk].sort((a, b) => {
      const ea = byId[a];
      const eb = byId[b];
      return new Date(ea.start).getTime() - new Date(eb.start).getTime();
    });
  }

  return { byId, byDay };
};

export const useCalendarEventsStore = create<State>()(
  persist(
    (set, get) => ({
      events: [],

      eventsById: {},
      idsByDay: {},
      hasHydrated: false,

      rebuildIndexes: () => {
        const evs = get().events;
        const { byId, byDay } = buildIndexes(evs);
        set({ eventsById: byId, idsByDay: byDay });
      },

      addEvent: (payload) => {
        const id = uid();
        const ev: MEvent = {
          ...payload,
          id,
          source: payload.source ?? "planner",
          calendarId: payload.calendarId ?? "local:planner",
        };

        set((s) => {
          const nextEvents = sortEvents([...s.events, ev]);
          const { byId, byDay } = buildIndexes(nextEvents);
          return { events: nextEvents, eventsById: byId, idsByDay: byDay };
        });

        return ev;
      },

      updateEvent: (id, patch) =>
        set((s) => {
          const current = s.eventsById[id] ?? s.events.find((e) => e.id === id);
          if (current && isGoogleEvent(current)) {
            return s;
          }

          const nextEvents = sortEvents(
            s.events.map((e) => (e.id === id ? { ...e, ...patch } : e))
          );
          const { byId, byDay } = buildIndexes(nextEvents);

          return { events: nextEvents, eventsById: byId, idsByDay: byDay };
        }),

      deleteEvent: (id) =>
        set((s) => {
          const target = s.eventsById[id] ?? s.events.find((e) => e.id === id);
          if (target && isGoogleEvent(target)) {
            return s;
          }

          const nextEvents = s.events.filter((e) => e.id !== id);
          const { byId, byDay } = buildIndexes(nextEvents);

          return { events: nextEvents, eventsById: byId, idsByDay: byDay };
        }),

      upsertExternalEvents: (calendarId, incoming) =>
        set((s) => {
          const kept = s.events.filter((e) => e.calendarId !== calendarId);
          const nextEvents = sortEvents([...kept, ...incoming]);
          const { byId, byDay } = buildIndexes(nextEvents);
          return { events: nextEvents, eventsById: byId, idsByDay: byDay };
        }),

      mergeEvent: (event) =>
        set((s) => {
          const without = s.events.filter((e) => e.id !== event.id);
          const nextEvents = sortEvents([...without, event]);
          const { byId, byDay } = buildIndexes(nextEvents);
          return { events: nextEvents, eventsById: byId, idsByDay: byDay };
        }),

      removeEventById: (id) =>
        set((s) => {
          const nextEvents = s.events.filter((e) => e.id !== id);
          const { byId, byDay } = buildIndexes(nextEvents);
          return { events: nextEvents, eventsById: byId, idsByDay: byDay };
        }),

      removeEventsForAccount: (accountId) =>
        set((s) => {
          const nextEvents = s.events.filter((e) => e.accountId !== accountId);
          const { byId, byDay } = buildIndexes(nextEvents);
          return { events: nextEvents, eventsById: byId, idsByDay: byDay };
        }),

      removeEventsForCalendar: (calendarId) =>
        set((s) => {
          const nextEvents = s.events.filter((e) => e.calendarId !== calendarId);
          const { byId, byDay } = buildIndexes(nextEvents);
          return { events: nextEvents, eventsById: byId, idsByDay: byDay };
        }),

      deleteEventWithUndo: (id, durationMs = 4000) =>
        set((s) => {
          const ev = s.eventsById[id] ?? s.events.find((e) => e.id === id);
          if (!ev || isGoogleEvent(ev)) return s;

          if (s.pendingDelete?.timeoutId) {
            clearTimeout(s.pendingDelete.timeoutId);
          }

          const token = uid();
          const timeoutId = setTimeout(() => {
            const cur = get().pendingDelete;
            if (cur?.token === token) set({ pendingDelete: undefined });
          }, durationMs);

          const nextEvents = s.events.filter((e) => e.id !== id);
          const { byId, byDay } = buildIndexes(nextEvents);

          return {
            events: nextEvents,
            eventsById: byId,
            idsByDay: byDay,
            pendingDelete: { token, event: ev, timeoutId },
          };
        }),

      undoDelete: () =>
        set((s) => {
          const pd = s.pendingDelete;
          if (!pd) return s;

          clearTimeout(pd.timeoutId);

          const nextEvents = sortEvents([...s.events, pd.event]);
          const { byId, byDay } = buildIndexes(nextEvents);

          return {
            events: nextEvents,
            eventsById: byId,
            idsByDay: byDay,
            pendingDelete: undefined,
          };
        }),
    }),
    {
      name: "calendar-events",
      storage: createJSONStorage(() => AsyncStorage),

      partialize: (state) => ({ events: state.events }),

      onRehydrateStorage: () => (state, err) => {
        if (err) return;
        if (!state) return;

        state.rebuildIndexes();
        useCalendarEventsStore.setState({ hasHydrated: true });
      },
    }
  )
);
