import { minuteToHHmm } from "./minuteToHHmm";
import dayjs from "dayjs";
import { clampDay } from "./isBeforeDay";

export const  isoToDayAndTime=(iso?: string) => {
    if (!iso) return null;
    const d = dayjs(iso);
    if (!d.isValid()) return null;
    return {
      day: clampDay(d.toDate()),
      time: minuteToHHmm(d.hour() * 60 + d.minute()),
    };
  }