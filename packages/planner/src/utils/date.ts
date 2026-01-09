export function snapMinutes(mins: number, step: number) {
  return Math.round(mins / step) * step;
}

export function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

export function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

export function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function startOfWeek(date: Date, weekStartsOn: number) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0..6 (Sun..Sat)
  const diff = (day - weekStartsOn + 7) % 7;
  return addDays(d, -diff);
}

export function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}


export function toDate(input: any): Date {
  if (input instanceof Date) return input;
  if (typeof input === "number") return new Date(input);

  if (typeof input !== "string") return new Date(input);

  let s = input.trim();
  if (!s) return new Date(NaN);

  s = s.replace(" ", "T");

  s = s.replace(/([+\-]\d{2})(\d{2})$/, "$1:$2");

  const hasTz = /([zZ]|[+\-]\d{2}:\d{2})$/.test(s);
  if (hasTz) {
    const d = new Date(s);
    if (Number.isFinite(d.getTime())) return d;
  }

  const m =
    s.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/
    ) || null;

  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const da = Number(m[3]);
    const hh = m[4] ? Number(m[4]) : 0;
    const mm = m[5] ? Number(m[5]) : 0;
    const ss = m[6] ? Number(m[6]) : 0;
    const ms = m[7] ? Number(m[7].padEnd(3, "0")) : 0;

    const d = new Date(y, mo, da, hh, mm, ss, ms); 
    if (Number.isFinite(d.getTime())) return d;
  }

  return new Date(s);
}

export function minutesOfDay(d: Date) {
  const t = d.getTime();
  if (!Number.isFinite(t)) return 0;
  return d.getHours() * 60 + d.getMinutes();
}

export function withDayAndMinutes(day: Date, mins: number) {
  const d = new Date(day);
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  d.setHours(h, m, 0, 0);
  return d;
}

/**
 * ISO week number (UTC based)
 */
export function getISOWeekNumber(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export const pad2 = (n: number) => String(n).padStart(2, "0");
