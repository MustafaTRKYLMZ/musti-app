import type { ReadingTarget, TargetRepeat } from "/core";

function parseTimeOfDay(s?: string) {
  const str = s && /^\d{2}:\d{2}$/.test(s) ? s : "00:00";
  const [hhRaw, mmRaw] = str.split(":");
  const hh = Math.max(0, Math.min(23, Number(hhRaw) || 0));
  const mm = Math.max(0, Math.min(59, Number(mmRaw) || 0));
  return { hh, mm };
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


export function computeNextResetAt(fromMs: number, repeat: TargetRepeat): number {
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

  const weekdays =
    repeat.weekdays && repeat.weekdays.length
      ? [...new Set(repeat.weekdays)]
          .filter((x) => x >= 0 && x <= 6)
          .sort((a, b) => a - b)
      : [1]; 

  const fromDay = startOfDay(base);

  for (let delta = 1; delta <= 7; delta++) {
    const cand = addDays(fromDay, delta);
    if (weekdays.includes(cand.getDay())) {
      return atTime(cand, repeat.timeOfDay).getTime();
    }
  }

  const weeksLater = addDays(fromDay, 7 * interval);
  const wd = weekdays[0];
  const deltaToWd = (wd - weeksLater.getDay() + 7) % 7;
  return atTime(addDays(weeksLater, deltaToWd), repeat.timeOfDay).getTime();
}


export function applyRepeatEndAfterRollover(
  repeat: TargetRepeat
): TargetRepeat | null {
  const end = repeat.end;
  if (!end || end.kind === "never") return repeat;

  if (end.kind === "until") {
    return repeat;
  }

  if (end.kind === "count") {
    const remaining = Math.max(0, Math.floor(end.remaining ?? 0));
    const nextRemaining = remaining - 1;
    if (nextRemaining <= 0) return null;
    return { ...repeat, end: { kind: "count", remaining: nextRemaining, total: end.total } };
  }

  return repeat;
}

  

export function resetTargetForNewCycle(
  t: ReadingTarget,
  cycleStartAt: number,
  normalizeRange: (startLike: any, endLike: any) => { start: number; end: number }
): ReadingTarget {
  const resetItems = (t.items ?? []).map((it) => {
    const { start, end } = normalizeRange(
      it.jumpPage ?? it.startPage ?? 1,
      it.endPage ?? it.startPage ?? 1
    );

    return {
      ...it,
      status: "pending" as const,
      doneAt: undefined,
      activeFromPage: start,
      cursorPage: start,
      startPage: start,
      endPage: end,
      jumpPage: start,
    };
  });

  return {
    ...t,
    status: "active",
    doneAt: undefined,
    cycleCompletedAt: undefined,
    cycleStartAt,
    items: resetItems,
  };
}

export function rolloverRepeatingTargets(
  targets: ReadingTarget[],
  nowMs: number,
  normalizeRange: (startLike: any, endLike: any) => { start: number; end: number }
): { targets: ReadingTarget[]; changed: boolean } {
  let changed = false;

  const nextTargets = targets.map((t) => {
    if (!t.repeat) return t;

    const baseCycleStart = t.cycleStartAt ?? t.createdAt ?? nowMs;

    const nextResetAt =
      t.nextResetAt ?? computeNextResetAt(baseCycleStart, t.repeat);

    if (t.nextResetAt == null) {
      changed = true;
      return { ...t, cycleStartAt: baseCycleStart, nextResetAt };
    }

    if (nextResetAt <= nowMs) {
      changed = true;

      const newCycleStart = nextResetAt;
      const nextNextReset = computeNextResetAt(newCycleStart, t.repeat);

      const rolled: ReadingTarget = {
        ...t,
        cycleStartAt: newCycleStart,
        lastResetAt: nextResetAt,
        nextResetAt: nextNextReset,
      };

      return resetTargetForNewCycle(rolled, newCycleStart, normalizeRange);
    }

    return t;
  });

  return { targets: nextTargets, changed };
}
