import dayjs from "dayjs";

export function mergeDateWithTimeOfDay(date: Date, timeOfDay: string) {
  // timeOfDay: "HH:mm"
  const [hh, mm] = timeOfDay.split(":").map((x) => Number(x));
  const safeH = Number.isFinite(hh) ? hh : 0;
  const safeM = Number.isFinite(mm) ? mm : 0;

  return dayjs(date)
    .hour(safeH)
    .minute(safeM)
    .second(0)
    .millisecond(0)
    .valueOf();
}
