import { useBudgetNotificationScheduler } from "@/store/budget/notification/useBudgetNotificationScheduler";
import { useBookshelfNotificationScheduler } from "@/store/bookshelf/useBookshelfNotificationScheduler";
import { useReminderScheduler } from "@/hooks/useReminderScheduler";

export function SchedulersHost() {
  useBudgetNotificationScheduler();
  useBookshelfNotificationScheduler();

  useReminderScheduler("budget");
  useReminderScheduler("bookshelf");

  return null;
}
