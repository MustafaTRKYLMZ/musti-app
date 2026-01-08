import { create } from "zustand";
import dayjs from "dayjs";
import { useCalendarEventsStore } from "@/store/calendar/useCalendarEventsStore";

export type CalendarView = "week" | "month" | "day" | "year";

const clampDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate());

type CalendarUiState = {
  // navigation
  view: CalendarView;
  date: Date;
  selectedDate: Date;

  // sheet
  daySheetOpen: boolean;

  // create
  createOpen: boolean;
  createDay: Date;
  createStartMinute?: number;

  // edit
  editOpen: boolean;
  editEventId: string | null;

  // delete confirm
  deleteConfirmOpen: boolean;
  deleteEventId: string | null;

  // actions
  setView: (v: CalendarView) => void;

  setDate: (d: Date) => void;
  setSelectedDate: (d: Date) => void;

  openDay: (d: Date) => void;
  closeDaySheet: () => void;

  openCreate: (day: Date, startMinute?: number) => void;
  closeCreate: () => void;

  openEdit: (eventId: string) => void;
  closeEdit: () => void;

  pressEvent: (eventId: string, eventStartIso?: string) => void;

  requestDelete: (eventId: string) => void;
  cancelDelete: () => void;

  confirmDelete: () => void;

  resetModals: () => void;
};

export const useCalendarUiStore = create<CalendarUiState>((set, get) => ({
  view: "month",
  date: clampDay(new Date()),
  selectedDate: clampDay(new Date()),

  daySheetOpen: false,

  createOpen: false,
  createDay: clampDay(new Date()),
  createStartMinute: undefined,

  editOpen: false,
  editEventId: null,

  deleteConfirmOpen: false,
  deleteEventId: null,

  setView: (v) => set({ view: v }),

  setDate: (d) =>
    set((s) => {
      const dd = clampDay(d);
      return { ...s, date: dd, selectedDate: dd };
    }),

  setSelectedDate: (d) => set({ selectedDate: clampDay(d) }),

  openDay: (d) => {
    const dd = clampDay(d);
    set({
      selectedDate: dd,
      date: dd,
      daySheetOpen: true,

      createOpen: false,
      createStartMinute: undefined,
      editOpen: false,
      editEventId: null,
      deleteConfirmOpen: false,
      deleteEventId: null,
    });
  },

  closeDaySheet: () => set({ daySheetOpen: false }),

  openCreate: (day, startMinute) => {
    const dd = clampDay(day);
    set({
        selectedDate: dd,
        date: dd,
        createOpen: true,
        createDay: dd,
        createStartMinute: startMinute,
        editOpen: false,
        editEventId: null,
        deleteConfirmOpen: false,
        deleteEventId: null,
     
    });
  },

  closeCreate: () =>
    set({
      createOpen: false,
      createStartMinute: undefined,
    }),

  openEdit: (eventId) => {
    if (!eventId) return;
    set({
      editOpen: true,
      editEventId: eventId,

      createOpen: false,
      createStartMinute: undefined,
      deleteConfirmOpen: false,
      deleteEventId: null,
     
    });
  },

  closeEdit: () =>
    set({
      editOpen: false,
      editEventId: null,
    }),

  pressEvent: (eventId, eventStartIso) => {
    if (!eventId) return;

    if (eventStartIso) {
      const d = dayjs(eventStartIso);
      if (d.isValid()) {
        const dd = clampDay(d.toDate());
        set({ selectedDate: dd, date: dd });
      }
    }

    set({
      editOpen: true,
      editEventId: eventId,

      createOpen: false,
      createStartMinute: undefined,
      deleteConfirmOpen: false,
      deleteEventId: null,

    });
  },

  requestDelete: (eventId) => {
    if (!eventId) return;
    set({
      deleteConfirmOpen: true,
      deleteEventId: eventId,

      createOpen: false,
      createStartMinute: undefined,
      editOpen: false,
      editEventId: null,
    });
  },

  cancelDelete: () =>
    set({
      deleteConfirmOpen: false,
      deleteEventId: null,
    }),

  confirmDelete: () => {
    const id = get().deleteEventId;
    if (id) {
      useCalendarEventsStore.getState().deleteEvent(id);
    }
    set({
      deleteConfirmOpen: false,
      deleteEventId: null,
    });
  },

  resetModals: () =>
    set({
      createOpen: false,
      createStartMinute: undefined,
      editOpen: false,
      editEventId: null,
      deleteConfirmOpen: false,
      deleteEventId: null,
    }),
}));
