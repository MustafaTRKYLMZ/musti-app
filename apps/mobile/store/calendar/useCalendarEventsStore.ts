import { create } from "zustand";
import type { MEvent } from "@musti/planner";

type PendingDelete = {
  token: string;
  event: MEvent;
  timeoutId: any;
};

type State = {
  events: MEvent[];

  addEvent: (payload: Omit<MEvent, "id">) => void;
  updateEvent: (id: string, patch: Partial<MEvent>) => void;
  deleteEvent: (id: string) => void;

  pendingDelete?: PendingDelete;
  deleteEventWithUndo: (id: string, durationMs?: number) => void;
  undoDelete: () => void;
};

const uid = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const sortEvents = (arr: MEvent[]) =>
  [...arr].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

export const useCalendarEventsStore = create<State>((set, get) => ({
  events: [],

  addEvent: (payload) =>
    set((s) => {
      const id = uid();
      const ev: MEvent = { ...(payload as any), id } as MEvent;
      return { events: sortEvents([...s.events, ev]) };
    }),

  updateEvent: (id, patch) =>
    set((s) => {
      const next = s.events.map((e) => (e.id === id ? { ...e, ...patch } : e));
      return { events: sortEvents(next) };
    }),

  deleteEvent: (id) =>
    set((s) => ({ events: s.events.filter((e) => e.id !== id) })),

  deleteEventWithUndo: (id, durationMs = 4000) =>
    set((s) => {
      const ev = s.events.find((e) => e.id === id);
      if (!ev) return s;

      if (s.pendingDelete?.timeoutId) clearTimeout(s.pendingDelete.timeoutId);

      const token = uid();
      const timeoutId = setTimeout(() => {
        const cur = get().pendingDelete;
        if (cur?.token === token) set({ pendingDelete: undefined });
      }, durationMs);

      return {
        events: s.events.filter((e) => e.id !== id),
        pendingDelete: { token, event: ev, timeoutId },
      };
    }),

  undoDelete: () =>
    set((s) => {
      const pd = s.pendingDelete;
      if (!pd) return s;

      clearTimeout(pd.timeoutId);

      return {
        events: sortEvents([...s.events, pd.event]),
        pendingDelete: undefined,
      };
    }),
}));
