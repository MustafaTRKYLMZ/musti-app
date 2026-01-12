export const startOfMonth = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), 1);


export const addMonthsClamped = (d: Date, delta: number) => {
  const day = d.getDate();
  const base = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  const lastDay = new Date(
    base.getFullYear(),
    base.getMonth() + 1,
    0
  ).getDate();
  base.setDate(Math.min(day, lastDay));
  return base;
};

export const stripLeadingTimeLabel = (s: string) =>
  s.replace(/^\s*\d{1,2}:\d{2}\s+/, "").trim();
