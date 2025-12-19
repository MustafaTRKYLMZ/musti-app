import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TargetStatus = "active" | "done";
export type TargetType = "section" | "pages";

// ✅ sequential flow
export type TargetItemStatus = "pending" | "active" | "done";

export type TargetItem = {
  id: string;

  bookUri: string;
  bookName: string;

  type: TargetType;

  startPage: number;
  endPage: number;
  jumpPage: number;

  labelId: string;
  label: string;

  // run baseline for THIS item (reset on activate/restart)
  activeFromPage?: number;

  status: TargetItemStatus;
  doneAt?: number;
};

export type ReadingTarget = {
  id: string;
  createdAt: number;

  title: string;
  status: TargetStatus;
  doneAt?: number;

  items: TargetItem[];
};

type TargetsState = {
  hydrated: boolean;
  targets: ReadingTarget[];

  hydrate: () => Promise<void>;

  // group actions
  addTarget: (title: string) => Promise<string>;
  deleteTarget: (id: string) => Promise<void>;
  markTargetActive: (id: string) => Promise<void>;
  clearDone: () => Promise<void>;

  // item actions
  addItem: (
    targetId: string,
    item: Omit<TargetItem, "id" | "status" | "doneAt" | "activeFromPage">
  ) => Promise<void>;

  deleteItem: (targetId: string, itemId: string) => Promise<void>;
  markItemDone: (targetId: string, itemId: string) => Promise<void>;
  restartItem: (targetId: string, itemId: string) => Promise<void>;
};

const KEY = "bookshelf.readingTargets.v2";
const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

async function persist(targets: ReadingTarget[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify({ targets }));
}

function ensureSingleActive(items: TargetItem[]): TargetItem[] {
  const firstActiveIndex = items.findIndex((it) => it.status === "active");
  if (firstActiveIndex === -1) return items;

  return items.map((it, idx) => {
    if (it.status !== "active") return it;
    if (idx === firstActiveIndex) return it;
    return { ...it, status: "pending" as const };
  });
}

function promoteNextPending(items: TargetItem[]): TargetItem[] {
  if (items.some((it) => it.status === "active")) return items;

  const nextIdx = items.findIndex((it) => it.status === "pending");
  if (nextIdx === -1) return items;

  return items.map((it, idx) => {
    if (idx !== nextIdx) return it;
    const baseline = it.jumpPage ?? it.startPage ?? 1;
    return { ...it, status: "active" as const, activeFromPage: baseline };
  });
}

function recomputeTarget(t: ReadingTarget): ReadingTarget {
  const items = promoteNextPending(ensureSingleActive(t.items ?? []));

  const allDone =
    items.length > 0 && items.every((it) => it.status === "done");

  if (allDone) {
    return { ...t, items, status: "done", doneAt: t.doneAt ?? Date.now() };
  }

  return { ...t, items, status: "active", doneAt: undefined };
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
      const hydratedTargets = (parsed.targets ?? []).map((t) =>
        recomputeTarget(t)
      );
      set({ targets: hydratedTargets, hydrated: true });
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
    const targets = get().targets.filter((x) => x.id !== id);
    set({ targets });
    await persist(targets);
  },

  markTargetActive: async (id) => {
    const targets = get().targets.map((t) => {
      if (t.id !== id) return t;

      const nextItems = (t.items ?? []).map((it, idx) => {
        const baseline = it.jumpPage ?? it.startPage ?? 1;

        if (idx === 0) {
          return {
            ...it,
            status: "active" as const,
            doneAt: undefined,
            activeFromPage: baseline,
          };
        }

        return {
          ...it,
          status: "pending" as const,
          doneAt: undefined,
          activeFromPage: baseline,
        };
      });

      return recomputeTarget({
        ...t,
        status: "active",
        doneAt: undefined,
        items: nextItems,
      });
    });

    set({ targets });
    await persist(targets);
  },

  clearDone: async () => {
    const targets = get().targets.filter((x) => x.status !== "done");
    set({ targets });
    await persist(targets);
  },

  addItem: async (targetId, itemInput) => {
    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      const baseline = itemInput.jumpPage ?? itemInput.startPage ?? 1;
      const isFirst = (t.items?.length ?? 0) === 0;

      const item: TargetItem = {
        id: uid(),
        status: isFirst ? ("active" as const) : ("pending" as const),
        activeFromPage: baseline,
        doneAt: undefined,
        ...itemInput,
      };

      return recomputeTarget({ ...t, items: [...(t.items ?? []), item] });
    });

    set({ targets });
    await persist(targets);
  },

  deleteItem: async (targetId, itemId) => {
    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;
      const next = { ...t, items: (t.items ?? []).filter((it) => it.id !== itemId) };
      return recomputeTarget(next);
    });

    set({ targets });
    await persist(targets);
  },

  markItemDone: async (targetId, itemId) => {
    const now = Date.now();

    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      const nextItems = (t.items ?? []).map((it) =>
        it.id === itemId
          ? { ...it, status: "done" as const, doneAt: it.doneAt ?? now }
          : it
      );

      return recomputeTarget({ ...t, items: nextItems });
    });

    set({ targets });
    await persist(targets);
  },

  restartItem: async (targetId, itemId) => {
    const targets = get().targets.map((t) => {
      if (t.id !== targetId) return t;

      const nextItems = ensureSingleActive(
        (t.items ?? []).map((it) => {
          if (it.id !== itemId) return it;
          const baseline = it.jumpPage ?? it.startPage ?? 1;
          return {
            ...it,
            status: "active" as const,
            doneAt: undefined,
            activeFromPage: baseline,
          };
        })
      ).map((it) => {
        // normalize other actives to pending, keep done as done
        if (it.status === "done") return it;
        if (it.status === "active") return it;
        return { ...it, status: "pending" as const };
      });

      return recomputeTarget({
        ...t,
        status: "active",
        doneAt: undefined,
        items: nextItems,
      });
    });

    set({ targets });
    await persist(targets);
  },
}));
