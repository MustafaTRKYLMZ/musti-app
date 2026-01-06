import { eventToStartDate } from "./eventToStartDate";

export const  eventToTimeLabel=(e: any): string | null=> {
  const d = eventToStartDate(e);
  if (!d) return null;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}
