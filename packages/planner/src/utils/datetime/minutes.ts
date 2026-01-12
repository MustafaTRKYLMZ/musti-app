export function snapMinutes(mins: number, step: number) {
    return Math.round(mins / step) * step;
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
  export const addMinutes = (d: Date, min: number) =>
    new Date(d.getTime() + min * 60 * 1000);
  