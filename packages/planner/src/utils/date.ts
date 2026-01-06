
export function snapMinutes(mins: number, step: number) {
    return Math.round(mins / step) * step;
  }
  
  export function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n));
  }
  
  export const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate());
  
  export const addDays = (d: Date, days: number) => {
    const x = new Date(d);
    x.setDate(x.getDate() + days);
    return x;
  };
  
  export const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  
  export const startOfWeek = (d: Date, weekStartsOn: number) => {
    const day = d.getDay(); // 0 Sun
    const diff = (day - weekStartsOn + 7) % 7;
    return startOfDay(addDays(d, -diff));
  };
  
  export const toDate = (iso: string) => new Date(iso);
  
  export const minutesOfDay = (d: Date) => d.getHours() * 60 + d.getMinutes();
  
  export function withDayAndMinutes(day: Date, mins: number) {
    const d = new Date(day);
    const h = Math.floor(mins / 60);
    const m = Math.round(mins % 60);
    d.setHours(h, m, 0, 0);
    return d;
  }
  
  export function getISOWeekNumber(date: Date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }
  
  export const pad2 = (n: number) => String(n).padStart(2, "0");
  