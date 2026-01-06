import { create } from "zustand";
import dayjs from "dayjs";
import { MEvent } from "@musti/planner";

type State = {
  events: MEvent[];
  addEvent: (e: Omit<MEvent, "id"> & { id?: string }) => string;
  updateEvent: (id: string, patch: Partial<MEvent>) => void;
  deleteEvent: (id: string) => void;
  getEventsForDate: (date: Date) => MEvent[];
};

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isSameDayByStart(ev: MEvent, d: Date) {
  return dayjs(ev.start).isSame(d, "day");
}

export const useCalendarEventsStore = create<State>((set, get) => ({
  events: [],

  addEvent: (e) => {
    const id = e.id ?? uid();

    const s = dayjs(e.start);
    const en = dayjs(e.end);
    if (!s.isValid() || !en.isValid() || !en.isAfter(s)) {
   
      throw new Error("Invalid event time range (end must be after start).");
    }

    const ev: MEvent = { ...e, id };
    set((st) => ({ events: [ev, ...st.events] }));
    return id;
  },

  updateEvent: (id, patch) => {
    set((st) => ({
      events: st.events.map((it) => {
        if (it.id !== id) return it;

        const next = { ...it, ...patch } as MEvent;

        const s = dayjs(next.start);
        const en = dayjs(next.end);
        if (!s.isValid() || !en.isValid() || !en.isAfter(s)) {
          return it;
        }

        return next;
      }),
    }));
  },

  deleteEvent: (id) => {
    set((st) => ({ events: st.events.filter((it) => it.id !== id) }));
  },

  getEventsForDate: (date) => {
    return get()
      .events
      .filter((e) => isSameDayByStart(e, date))
      .slice()
      .sort((a, b) => dayjs(a.start).valueOf() - dayjs(b.start).valueOf());
  },
}));
