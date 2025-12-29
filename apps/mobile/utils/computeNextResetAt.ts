function parseTimeOfDay(s?: string) {
    // "HH:mm"
    const str = (s && /^\d{2}:\d{2}$/.test(s)) ? s : "00:00";
    const [hh, mm] = str.split(":").map((x) => Number(x));
    return { hh: Math.max(0, Math.min(23, hh || 0)), mm: Math.max(0, Math.min(59, mm || 0)) };
  }
  
  function atTime(d: Date, timeOfDay?: string) {
    const { hh, mm } = parseTimeOfDay(timeOfDay);
    const x = new Date(d);
    x.setHours(hh, mm, 0, 0);
    return x;
  }
  
  function startOfDay(d: Date) {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }
  
  function addDays(d: Date, n: number) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }
  
  function addMonths(d: Date, n: number) {
    const x = new Date(d);
    x.setMonth(x.getMonth() + n);
    return x;
  }
  
  export function computeNextResetAt(fromMs: number, repeat: import("@budget/core").TargetRepeat): number {
    const interval = Math.max(1, Math.floor(repeat.interval ?? 1));
    const base = new Date(fromMs);
  
    if (repeat.freq === "daily") {
      const nextDay = addDays(startOfDay(base), interval);
      return atTime(nextDay, repeat.timeOfDay).getTime();
    }
  
    if (repeat.freq === "monthly") {
      const nextMonth = addMonths(startOfDay(base), interval);
      return atTime(nextMonth, repeat.timeOfDay).getTime();
    }
  
    const weekdays = (repeat.weekdays && repeat.weekdays.length)
      ? [...new Set(repeat.weekdays)].filter((x) => x >= 0 && x <= 6).sort((a, b) => a - b)
      : [1]; 
  
    const fromDay = startOfDay(base);
    const fromDow = fromDay.getDay();
  
    for (let delta = 1; delta <= 7 * interval; delta++) {
      const cand = addDays(fromDay, delta);
      const candDow = cand.getDay();
      const withinCycle = delta <= 7; 
      if (weekdays.includes(candDow) && withinCycle) {
        return atTime(cand, repeat.timeOfDay).getTime();
      }
    }
  
    const weeksLater = addDays(fromDay, 7 * interval);
    const wd = weekdays[0];
    const deltaToWd = (wd - weeksLater.getDay() + 7) % 7;
    return atTime(addDays(weeksLater, deltaToWd), repeat.timeOfDay).getTime();
  }
  