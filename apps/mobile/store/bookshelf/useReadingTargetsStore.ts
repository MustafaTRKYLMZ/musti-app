import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TargetStatus = "active" | "done";
export type TargetType = "section" | "pages"; // ✅ new

export type ReadingTarget = {
  id: string;
  createdAt: number;

  bookUri: string;
  bookName: string;
  jumpPage: number; // ✅ new

  type: TargetType; // ✅ new (mode yerine daha net)

  // automatic baseline + goal
  startPage: number;
  endPage: number;
  activeFromPage?: number;
  // selected label (from select options)
  labelId: string; // ✅ new (stable identifier)
  label: string;

  status: TargetStatus;
  doneAt?: number;
};

type TargetsState = {
  hydrated: boolean;
  targets: ReadingTarget[];

  hydrate: () => Promise<void>;

  addTarget: (t: Omit<ReadingTarget, "id" | "createdAt" | "status">) => Promise<void>;
  deleteTarget: (id: string) => Promise<void>;
  markDone: (id: string) => Promise<void>;
  markActive: (id: string) => Promise<void>;
  clearDone: () => Promise<void>;
};

const KEY = "bookshelf.readingTargets.v1";
const uid = () => `${Date.now()}_${Math.random().toString(16).slice(2)}`;

async function persist(targets: ReadingTarget[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify({ targets }));
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
      set({ targets: parsed.targets ?? [], hydrated: true });
    } catch {
      set({ hydrated: true });
    }
  },

  addTarget: async (t) => {
    const next: ReadingTarget = {
      id: uid(),
      createdAt: Date.now(),
      status: "active",
      activeFromPage: t.jumpPage ?? t.startPage ?? 1,
      
      ...t,
    };
    const targets = [next, ...get().targets];
    set({ targets });
    await persist(targets);
  },

  deleteTarget: async (id) => {
    const targets = get().targets.filter((x) => x.id !== id);
    set({ targets });
    await persist(targets);
  },

  markDone: async (id) => {
    const now = Date.now();
    const targets = get().targets.map((x) =>
      x.id === id ? { ...x, status: "done" as TargetStatus, doneAt: x.doneAt ?? now } : x
    );
    set({ targets });
    await persist(targets);
  },

  markActive: async (id) => {
    const targets = get().targets.map((x) =>
      x.id === id
        ? {
            ...x,
            status: "active" as TargetStatus,
            doneAt: undefined,
            activeFromPage: x.jumpPage ?? x.startPage ?? 1, // ✅ restart baseline
          }
        : x
    );
    set({ targets });
    await persist(targets);
  },
  

  clearDone: async () => {
    const targets = get().targets.filter((x) => x.status !== "done");
    set({ targets });
    await persist(targets);
  },
}));
