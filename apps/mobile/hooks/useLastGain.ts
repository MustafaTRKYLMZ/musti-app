import { create } from "zustand";
import type { ReadingMode } from "@musti/core";

export type LastGainKind = "pages" | "planComplete" | "targetComplete";

export type LastGain = {
  at: number; // timestamp ms
  xp: number; // gained xp (this event)
  pages: number; // pages delta used
  minutes?: number;
  mode: ReadingMode;
  bookUri?: string;
  kind: LastGainKind;
};

type LastGainState = {
  last: LastGain | null;
  emit: (gain: LastGain) => void;

  // one-shot pattern:
  consume: () => LastGain | null;

  clear: () => void;
};

export const useLastGainStore = create<LastGainState>((set, get) => ({
  last: null,

  emit: (gain) => set({ last: gain }),

  consume: () => {
    const cur = get().last;
    if (!cur) return null;
    set({ last: null });
    return cur;
  },

  clear: () => set({ last: null }),
}));

export function useLastGain() {
  const last = useLastGainStore((s) => s.last);
  const emit = useLastGainStore((s) => s.emit);
  const consume = useLastGainStore((s) => s.consume);
  const clear = useLastGainStore((s) => s.clear);

  return { last, emit, consume, clear };
}
