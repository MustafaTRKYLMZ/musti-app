import type { ReadingTarget } from "@musti/core";

export function recomputeTargetStatus(t: ReadingTarget): ReadingTarget {
  if (!t.items.length) {
    return {
      ...t,
      status: "active",
      doneAt: undefined,
      cycleCompletedAt: undefined,
    };
  }

  const allDone = t.items.every((it) => it.status === "done");

  if (t.repeat) {
    if (allDone) {
      const at = t.cycleCompletedAt ?? Date.now();
      return {
        ...t,
        status: "active",
        doneAt: undefined,
        cycleCompletedAt: at,
      };
    }

    return {
      ...t,
      status: "active",
      doneAt: undefined,
      cycleCompletedAt: undefined,
    };
  }

  if (allDone) {
    return { ...t, status: "done", doneAt: t.doneAt ?? Date.now() };
  }

  return { ...t, status: "active", doneAt: undefined };
}
