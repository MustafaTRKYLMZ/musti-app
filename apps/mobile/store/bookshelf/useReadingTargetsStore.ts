import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type {
  ReadingTarget,
  TargetItem,
  TargetRepeat,
  TargetRepeatEnd,
  TargetStatus,
} from "@musti/core";

import { useReadingGamificationStore } from "./readingGamification/useReadingGamificationStore";
import { recomputeTargetStatus } from "@/utils/targetStatus";
import {
  applyRepeatEndAfterRollover,
  computeNextResetAt,
  resetTargetForNewCycle,
  rolloverRepeatingTargets,
} from "@/utils/targetRepeat";
import { clampInt } from "@/utils/number";

type TargetsState = {
  hydrated: boolean;
  targets: ReadingTarget[];

  hydrate: () => Promise<void>;

  // group actions
  addTarget: (title: string) => Promise<string>;
  updateTargetTitle: (targetId: string, title: string) => Promise<void>;

  deleteTarget: (id: string) => Promise<void>;
  clearDone: () => Promise<void>;

  addItem: (
    targetId: string,
    item: Omit<
      TargetItem,
      "id" | "status" | "doneAt" | "activeFromPage" | "cursorPage"
    >
  ) => Promise<void>;
  deleteItem: (targetId: string, itemId: string) => Promise<void>;

  setActiveItem: (targetId: string, itemId: string) => Promise<void>;

  markItemDone: (targetId: string, itemId: string) => Promise<void>;

  setItemCursor: (
    targetId: string,
    itemId: string,
    cursorPage: number
  ) => Promise<void>;

  restartTarget: (targetId: string) => Promise<void>;
  restartItem: (targetId: string, itemId: string) => Promise<void>;

  // repeat
  rolloverRepeatingTargets: () => Promise<void>;
  setTargetRepeat: (
    targetId: string,
    repeat: TargetRepeat | null
  ) => Promise<void>;
  skipTargetCycle: (targetId: string) => Promise<void>;
};

const KEY = "bookshelf.readingTargets.v2";
const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

async function persist(targets: ReadingTarget[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify({ targets }));
}


function normalizeRange(startLike: any, endLike: any) {
  const start = Math.max(1, clampInt(startLike) || 1);
  const end = Math.max(start, clampInt(endLike) || start);
  return { start, end };
}

function ensureSingleActive(t: ReadingTarget): ReadingTarget {
  const items = t.items ?? [];
  if (!items.length) return t;

  const activeIdx = items.findIndex((it) => it.status === "active");

  if (activeIdx !== -1) {
    const nextItems = items.map((it, idx) => {
      if (idx === activeIdx) return it;
      if (it.status === "active") return { ...it, status: "pending" as const };
      return it;
    });
    return { ...t, items: nextItems };
  }

  const pendingIdx = items.findIndex((it) => it.status === "pending");
  if (pendingIdx === -1) return t;

  const nextItems = items.map((it, idx) =>
    idx === pendingIdx ? { ...it, status: "active" as const } : it
  );
  return { ...t, items: nextItems };
}

function normalizeRepeatEnd(end?: TargetRepeatEnd): TargetRepeatEnd | undefined {
  if (!end) return undefined;
  if (end.kind === "never") return end;
  if (end.kind === "until") return end;

  if (end.kind === "count") {
    const anyEnd = end as any;
    const remaining = Math.max(1, Math.floor(Number(anyEnd.remaining) || 1));
    // new model: keep total too. if missing, assume total == remaining
    const total = Math.max(
      1,
      Math.floor(Number(anyEnd.total ?? remaining) || remaining)
    );
    return { kind: "count", total, remaining } as any;
  }

  return end;
}

function normalizeRepeat(repeat: TargetRepeat): TargetRepeat {
  const nr: TargetRepeat = {
    ...repeat,
    interval: Math.max(1, Math.floor(Number(repeat.interval ?? 1) || 1)),
    end: normalizeRepeatEnd(repeat.end),
  };
  return nr;
}

export const useReadingTargetsStore = create<TargetsState>((set, get) => ({
  hydrated: false,
  targets: [],

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) {
        set({ hydrated: true });
        return;
      }

      const parsed = JSON.parse(raw) as { targets?: ReadingTarget[] };

      // ✅ migrate + normalize repeat end.count to include "total"
      const migrated = (parsed.targets ?? []).map((t) => {
        const repeat = t.repeat ? normalizeRepeat(t.repeat) : undefined;

        return {
          ...t,
          repeat,
          cycleStartAt: (t as any).cycleStartAt ?? t.createdAt ?? Date.now(),
          // keep existing fields as-is
        };
      });

      set({ targets: migrated, hydrated: true });

      await get().rolloverRepeatingTargets();
    } catch {
      set({ hydrated: true });
    }
  },

  rolloverRepeatingTargets: async () => {
    const now = Date.now();
    const { targets: nextTargets, changed } = rolloverRepeatingTargets(
      get().targets,
      now,
      normalizeRange
    );

    if (!changed) return;

    const finalTargets = nextTargets.map((t) => {
      let nt = ensureSingleActive(t);
      nt = recomputeTargetStatus(nt);
      return nt;
    });

    set({ targets: finalTargets });
    await persist(finalTargets);
  },

  setTargetRepeat: async (targetId, repeat) => {
    const now = Date.now();

    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      if (repeat) {
        const safeRepeat = normalizeRepeat(repeat);

        // ✅ if count, ensure total exists (total=remaining when user sets)
        if (safeRepeat.end?.kind === "count") {
          const anyEnd = safeRepeat.end as any;
          const remaining = Math.max(1, Math.floor(Number(anyEnd.remaining) || 1));
          const total = Math.max(
            1,
            Math.floor(Number(anyEnd.total ?? remaining) || remaining)
          );
          safeRepeat.end = { kind: "count", total, remaining } as any;
        }

        const baseCycleStart = t.cycleStartAt ?? t.createdAt ?? now;
        const nextResetAt = computeNextResetAt(baseCycleStart, safeRepeat);

        const nextTarget: ReadingTarget = {
          ...t,
          repeat: safeRepeat,
          cycleStartAt: baseCycleStart,
          nextResetAt,
          cycleCompletedAt: undefined,
          status: "active" as TargetStatus,
          doneAt: undefined,
        };

        let nt = ensureSingleActive(nextTarget);
        nt = recomputeTargetStatus(nt);
        return nt;
      }

      // disable repeat
      const nextTarget: ReadingTarget = {
        ...t,
        repeat: undefined,
        nextResetAt: undefined,
        lastResetAt: undefined,
        cycleCompletedAt: undefined,
        status: "active" as TargetStatus,
        doneAt: undefined,
      };

      let nt = ensureSingleActive(nextTarget);
      nt = recomputeTargetStatus(nt);
      return nt;
    });

    set({ targets });
    await persist(targets);

    await get().rolloverRepeatingTargets();
  },

  skipTargetCycle: async (targetId) => {
    const now = Date.now();

    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;
      if (!t.repeat) return t;

      const repeat = normalizeRepeat(t.repeat);

      // until end: if already beyond -> stop repeat
      if (repeat.end?.kind === "until" && now >= repeat.end.untilAt) {
        const stopped: ReadingTarget = {
          ...t,
          repeat: undefined,
          nextResetAt: undefined,
          lastResetAt: undefined,
          cycleCompletedAt: undefined,
          status: "active" as TargetStatus,
          doneAt: undefined,
        };
        let nt = ensureSingleActive(stopped);
        nt = recomputeTargetStatus(nt);
        return nt;
      }

      const baseCycleStart = t.cycleStartAt ?? t.createdAt ?? now;
      const cycleStart = t.nextResetAt ?? computeNextResetAt(baseCycleStart, repeat);

      const maybeRepeat = applyRepeatEndAfterRollover(repeat);

      // if repeat ended (count reached 0), we reset one last time and disable repeat
      if (!maybeRepeat) {
        const reset = resetTargetForNewCycle(
          { ...t, repeat: undefined } as any,
          cycleStart,
          normalizeRange
        ) as ReadingTarget;

        const finalTarget: ReadingTarget = {
          ...reset,
          repeat: undefined,
          nextResetAt: undefined,
          lastResetAt: cycleStart,
          cycleStartAt: cycleStart,
          status: "active" as TargetStatus,
          doneAt: undefined,
        };

        let nt = ensureSingleActive(finalTarget);
        nt = recomputeTargetStatus(nt);
        return nt;
      }

      const nextNext = computeNextResetAt(cycleStart, maybeRepeat);

      const rolled = resetTargetForNewCycle(
        {
          ...t,
          repeat: maybeRepeat,
          cycleStartAt: cycleStart,
          lastResetAt: cycleStart,
          nextResetAt: nextNext,
        },
        cycleStart,
        normalizeRange
      ) as ReadingTarget;

      let nt = ensureSingleActive(rolled);
      nt = recomputeTargetStatus(nt);
      return nt;
    });

    set({ targets });
    await persist(targets);
  },

  addTarget: async (title) => {
    const now = Date.now();
    const next: ReadingTarget = {
      id: uid(),
      createdAt: now,
      title: title.trim() || "Untitled target",
      status: "active" as TargetStatus,
      items: [],

      cycleStartAt: now,
      nextResetAt: undefined,
      lastResetAt: undefined,
      cycleCompletedAt: undefined,
      repeat: undefined,
    };

    const targets = [next, ...get().targets];
    set({ targets });
    await persist(targets);
    return next.id;
  },

  updateTargetTitle: async (targetId: string, title: string) => {
    const nextTitle = title.trim() || "Untitled target";
    const targets = get().targets.map((t) =>
      t.id === targetId ? { ...t, title: nextTitle } : t
    );
    set({ targets });
    await persist(targets);
  },

  deleteTarget: async (id) => {
    const targets = get().targets.filter((t) => t.id !== id);
    set({ targets });
    await persist(targets);
  },

  clearDone: async () => {
    const targets = get().targets.filter((t) => t.status !== "done");
    set({ targets });
    await persist(targets);
  },

  addItem: async (targetId, itemInput) => {
    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      const hasActive = (t.items ?? []).some((it) => it.status === "active");

      const { start, end } = normalizeRange(
        itemInput.jumpPage ?? itemInput.startPage ?? 1,
        itemInput.endPage ?? itemInput.startPage ?? 1
      );

      const item: TargetItem = {
        id: uid(),
        status: hasActive ? ("pending" as const) : ("active" as const),
        doneAt: undefined,
        activeFromPage: start,
        cursorPage: start,
        ...itemInput,
        startPage: start,
        endPage: end,
        jumpPage: start,
      };

      let nextTarget: ReadingTarget = { ...t, items: [...(t.items ?? []), item] };
      nextTarget = ensureSingleActive(nextTarget);
      nextTarget = recomputeTargetStatus(nextTarget);
      return nextTarget;
    });

    set({ targets });
    await persist(targets);
  },

  deleteItem: async (targetId, itemId) => {
    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      let next: ReadingTarget = {
        ...t,
        items: (t.items ?? []).filter((it) => it.id !== itemId),
      };

      next = ensureSingleActive(next);
      next = recomputeTargetStatus(next);
      return next;
    });

    set({ targets });
    await persist(targets);
  },

  setActiveItem: async (targetId, itemId) => {
    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      const chosen = (t.items ?? []).find((it) => it.id === itemId);
      if (!chosen) return t;
      if (chosen.status === "done") return t;

      const nextItems = (t.items ?? []).map((it) => {
        if (it.status === "done") return it;

        if (it.id === itemId) {
          return { ...it, status: "active" as const };
        }

        if (it.status === "active") return { ...it, status: "pending" as const };
        if (it.status === "pending") return it;

        return it;
      });

      let nextTarget: ReadingTarget = { ...t, items: nextItems };
      nextTarget = ensureSingleActive(nextTarget);
      nextTarget = recomputeTargetStatus(nextTarget);
      return nextTarget;
    });

    set({ targets });
    await persist(targets);
  },

  setItemCursor: async (targetId, itemId, cursorPage) => {
    const c = clampInt(cursorPage) || 1;

    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      const nextItems = (t.items ?? []).map((it) => {
        if (it.id !== itemId) return it;
        if (it.status !== "active") return it;

        const { start, end } = normalizeRange(it.activeFromPage, it.endPage);
        const clamped = Math.max(start, Math.min(end, c));
        return { ...it, cursorPage: clamped };
      });

      return { ...t, items: nextItems };
    });

    set({ targets });
    await persist(targets);
  },

  markItemDone: async (targetId, itemId) => {
    const now = Date.now();

    const before = get().targets.find((t) => t.id === targetId);
    const fallbackBookUri =
      before?.items?.find((it) => it.bookUri)?.bookUri ?? "";

    let becameDone = false;
    let becameCycleCompleted = false;

    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      const wasDone = t.status === "done";
      const wasCycleCompleted = Boolean(t.cycleCompletedAt);

      const items = (t.items ?? []).map((it) => {
        if (it.id !== itemId) return it;
        if (it.status === "done") return it;
        return { ...it, status: "done" as const, doneAt: it.doneAt ?? now };
      });

      const hasActive = items.some((it) => it.status === "active");
      let nextItems = items;

      if (!hasActive) {
        const nextIdx = items.findIndex((it) => it.status === "pending");
        if (nextIdx !== -1) {
          const nxt = items[nextIdx];
          nextItems = items.map((it, idx) => {
            if (idx !== nextIdx) return it;
            const { start } = normalizeRange(
              nxt.activeFromPage ?? nxt.jumpPage ?? nxt.startPage ?? 1,
              nxt.endPage
            );
            return {
              ...nxt,
              status: "active" as const,
              doneAt: undefined,
              activeFromPage: start,
              cursorPage: start,
            };
          });
        }
      }

      let nextTarget: ReadingTarget = { ...t, items: nextItems };
      nextTarget = ensureSingleActive(nextTarget);
      nextTarget = recomputeTargetStatus(nextTarget);

      if (t.repeat) {
        const isCycleCompleted = Boolean(nextTarget.cycleCompletedAt);
        if (!wasCycleCompleted && isCycleCompleted) {
          becameCycleCompleted = true;
        }
      } else {
        if (!wasDone && nextTarget.status === "done") {
          becameDone = true;
        }
      }

      return nextTarget;
    });

    set({ targets });
    await persist(targets);

    if (becameDone || becameCycleCompleted) {
      useReadingGamificationStore.getState().onTargetCompleted({
        at: Date.now(),
        bookUri: fallbackBookUri,
      });
    }
  },

  restartItem: async (targetId, itemId) => {
    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      const nextItems = (t.items ?? []).map((it) => {
        if (it.status === "active" && it.id !== itemId) {
          return { ...it, status: "pending" as const };
        }

        if (it.id !== itemId) return it;

        const { start, end } = normalizeRange(
          it.jumpPage ?? it.startPage ?? 1,
          it.endPage ?? it.startPage ?? 1
        );

        return {
          ...it,
          status: "active" as const,
          doneAt: undefined,
          activeFromPage: start,
          cursorPage: start,
          startPage: start,
          endPage: end,
          jumpPage: start,
        };
      });

      let next: ReadingTarget = {
        ...t,
        status: "active" as TargetStatus,
        doneAt: undefined,
        cycleCompletedAt: undefined,
        items: nextItems,
      };

      next = ensureSingleActive(next);
      next = recomputeTargetStatus(next);
      return next;
    });

    set({ targets });
    await persist(targets);
  },

  restartTarget: async (targetId) => {
    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

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

      let next: ReadingTarget = {
        ...t,
        status: "active" as TargetStatus,
        doneAt: undefined,
        cycleCompletedAt: undefined,
        items: resetItems,
      };

      next = ensureSingleActive(next);
      next = recomputeTargetStatus(next);
      return next;
    });

    set({ targets });
    await persist(targets);
  },
}));
