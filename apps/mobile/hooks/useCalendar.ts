import { useCalendarUiStore } from "@/store/calendar/useCalendarUiStore";
import { useCalendarEventsStore } from "@/store/calendar/useCalendarEventsStore";
import { useShallow } from "zustand/react/shallow";

export const useCalendar=()=> {
  const ui = useCalendarUiStore(
    useShallow((s) => ({
      view: s.view,
      date: s.date,
      selectedDate: s.selectedDate,
      daySheetOpen: s.daySheetOpen,

      setView: s.setView,
      setDate: s.setDate,
      setSelectedDate: s.setSelectedDate,

      openDay: s.openDay,
      closeDaySheet: s.closeDaySheet,

      openCreate: s.openCreate,
      closeCreate: s.closeCreate,

      pressEvent: s.pressEvent,

      createOpen: s.createOpen,
      createDay: s.createDay,
      createStartMinute: s.createStartMinute,

      editOpen: s.editOpen,
      closeEdit: s.closeEdit,
      editEventId: s.editEventId,

      deleteConfirmOpen: s.deleteConfirmOpen,
      deleteEventId: s.deleteEventId,
      requestDelete: s.requestDelete,
      cancelDelete: s.cancelDelete,
      confirmDelete: s.confirmDelete,

      resetModals: s.resetModals,
    }))
  );

  const ev = useCalendarEventsStore(
    useShallow((s) => ({
      events: s.events,
      addEvent: s.addEvent,
      updateEvent: s.updateEvent,
      deleteEvent: s.deleteEvent,
      getEventsForDate: s.getEventsForDate,
    }))
  );

  return { ...ui, ...ev };
}
