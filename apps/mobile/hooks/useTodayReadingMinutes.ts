import { useMemo } from "react";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";

export function useTodayReadingMinutes(date: string) {
  const events = useReadingEventsStore((s) => s.events);

  return useMemo(() => {
    let ms = 0;

    for (const e of events) {
      if (e.date !== date) continue;
      const d = (e as any).durationMs;
      if (typeof d === "number" && Number.isFinite(d) && d > 0) ms += d;
    }

    return {
      ms,
      minutes: Math.round(ms / 60000),
    };
  }, [events, date]);
}
