export const eventToStartDate=(e: any): Date | null =>{
  const v =
    e?.startAt ??
    e?.start ??
    e?.at ??
    e?.date ??
    e?.startDate ??
    e?.start_time ??
    e?.startTime;

  if (v == null) return null;

  if (typeof v === "number") return new Date(v);
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}