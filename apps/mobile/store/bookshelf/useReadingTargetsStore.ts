import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ReadingTarget, TargetItem } from "@budget/core";

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

  // ✅ explicit: user picked another item to start => make it active
  setActiveItem: (targetId: string, itemId: string) => Promise<void>;

  // ✅ when item reaches end
  markItemDone: (targetId: string, itemId: string) => Promise<void>;

  // ✅ target-only progress update (do NOT touch book progressMap)
  setItemCursor: (
    targetId: string,
    itemId: string,
    cursorPage: number
  ) => Promise<void>;

  // restart
  restartTarget: (targetId: string) => Promise<void>;
  restartItem: (targetId: string, itemId: string) => Promise<void>;
};

const KEY = "bookshelf.readingTargets.v2";
const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

async function persist(targets: ReadingTarget[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify({ targets }));
}

function clampInt(n: any) {
  const v = Math.floor(Number(n) || 0);
  return Math.max(0, Math.min(999999, v));
}

function normalizeRange(startLike: any, endLike: any) {
  const start = Math.max(1, clampInt(startLike) || 1);
  const end = Math.max(start, clampInt(endLike) || start);
  return { start, end };
}

function recomputeTargetStatus(t: ReadingTarget): ReadingTarget {
  if (!t.items.length) return { ...t, status: "active", doneAt: undefined };

  const allDone = t.items.every((it) => it.status === "done");
  if (allDone) return { ...t, status: "done", doneAt: t.doneAt ?? Date.now() };

  return { ...t, status: "active", doneAt: undefined };
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

  // no active => promote first pending
  const pendingIdx = items.findIndex((it) => it.status === "pending");
  if (pendingIdx === -1) return t;

  const nextItems = items.map((it, idx) =>
    idx === pendingIdx ? { ...it, status: "active" as const } : it
  );
  return { ...t, items: nextItems };
}

export const useReadingTargetsStore = create<TargetsState>((set, get) => ({
  hydrated: false,
  targets: [],

  hydrate: async () => {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (!raw) return set({ hydrated: true });

      const parsed = JSON.parse(raw) as { targets?: ReadingTarget[] };
      set({ targets: parsed.targets ?? [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addTarget: async (title) => {
    const next: ReadingTarget = {
      id: uid(),
      createdAt: Date.now(),
      title: title.trim() || "Untitled target",
      status: "active",
      items: [],
    };
    const targets = [next, ...get().targets];
    set({ targets });
    await persist(targets);
    return next.id;
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

      const hasActive = t.items.some((it) => it.status === "active");

      const { start, end } = normalizeRange(
        itemInput.jumpPage ?? itemInput.startPage ?? 1,
        itemInput.endPage ?? itemInput.startPage ?? 1
      );

      const item: TargetItem = {
        id: uid(),
        status: hasActive ? "pending" : "active",
        doneAt: undefined,
        activeFromPage: start,
        cursorPage: start,
        ...itemInput,
        startPage: start,
        endPage: end,
        jumpPage: start,
      };

      let nextTarget: ReadingTarget = { ...t, items: [...t.items, item] };
      nextTarget = ensureSingleActive(nextTarget);
      nextTarget = recomputeTargetStatus(nextTarget);
      return nextTarget;
    });

    set({ targets });
    await persist(targets);
  },
  updateTargetTitle: async (targetId: string, title: string) => {
    const nextTitle = title.trim() || "Untitled target";
    const targets = get().targets.map((t) =>
      t.id === targetId ? { ...t, title: nextTitle } : t
    );
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

      const chosen = t.items.find((it) => it.id === itemId);
      if (!chosen) return t;

      // don't auto-reactivate done items (safer UX)
      if (chosen.status === "done") return t;

      const nextItems = t.items.map((it) => {
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

      const nextItems = t.items.map((it) => {
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

    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      // 1) mark done
      const items = t.items.map((it) =>
        it.id === itemId
          ? { ...it, status: "done" as const, doneAt: it.doneAt ?? now }
          : it
      );

      // 2) promote next pending -> active (ONLY if no active remains)
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
      return nextTarget;
    });

    set({ targets });
    await persist(targets);
  },

  restartItem: async (targetId, itemId) => {
    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      const nextItems = t.items.map((it) => {
        // ✅ any existing active -> pending (we will activate the restarted one)
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
        status: "active",
        doneAt: undefined,
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

      // all -> pending, cursor reset, then first becomes active
      const resetItems = t.items.map((it) => {
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
        status: "active",
        doneAt: undefined,
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
