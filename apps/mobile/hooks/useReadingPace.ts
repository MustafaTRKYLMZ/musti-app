import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { formatDurationShort } from "@/utils/formatDuration";
import { clampBetween } from "@/utils/number";

type PaceState = {
  ppm: number; // pages per minute
  updatedAt: number;
};

/* ------------------------------------------------------------------ */
/* Constants */
/* ------------------------------------------------------------------ */

const PACE_VERSION = "v1";
const DEFAULT_PPM = 1.2; // ~50 sec / page
const MIN_VALID_PPM = 0.2;
const MAX_VALID_PPM = 12;

export function useReadingPace(args: {
  paceKey: string | null;
  currentPage?: number;
  totalPages?: number;
}) {
  const { paceKey, currentPage, totalPages } = args;

  const storageKey = useMemo(() => {
    if (!paceKey) return null;
    return `reader_pace_${PACE_VERSION}:${paceKey}`;
  }, [paceKey]);

  const [ppm, setPpm] = useState<number>(DEFAULT_PPM);
  const loadedRef = useRef(false);

  /* ------------------ load pace ------------------ */

  useEffect(() => {
    let alive = true;
    loadedRef.current = false;

    (async () => {
      if (!storageKey) return;
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (!alive) return;

        if (raw) {
          const data = JSON.parse(raw) as Partial<PaceState>;
          if (typeof data.ppm === "number" && Number.isFinite(data.ppm)) {
            setPpm(clampBetween(data.ppm, MIN_VALID_PPM, MAX_VALID_PPM));
          } else {
            setPpm(DEFAULT_PPM);
          }
        } else {
          setPpm(DEFAULT_PPM);
        }
      } catch {
        setPpm(DEFAULT_PPM);
      } finally {
        if (alive) loadedRef.current = true;
      }
    })();

    return () => {
      alive = false;
    };
  }, [storageKey]);

  /* ------------------ persist pace ------------------ */

  const persist = useCallback(
    async (nextPpm: number) => {
      if (!storageKey) return;
      const payload: PaceState = { ppm: nextPpm, updatedAt: Date.now() };
      await AsyncStorage.setItem(storageKey, JSON.stringify(payload));
    },
    [storageKey]
  );

  /* ------------------ add sample ------------------ */

  const addSample = useCallback(
    (pagesRead: number, msSpent: number) => {
      if (!Number.isFinite(pagesRead) || pagesRead <= 0) return;
      if (!Number.isFinite(msSpent) || msSpent < 5_000) return;

      const minutes = msSpent / 60_000;
      const samplePpm = pagesRead / minutes;
      if (!Number.isFinite(samplePpm)) return;

      const bounded = clampBetween(samplePpm, MIN_VALID_PPM, MAX_VALID_PPM);

      const alpha = 0.25;
      setPpm((prev) => {
        const prevSafe = clampBetween(prev, MIN_VALID_PPM, MAX_VALID_PPM);
        const next = prevSafe * (1 - alpha) + bounded * alpha;

        if (loadedRef.current) {
          persist(next);
        }
        return next;
      });
    },
    [persist]
  );

  /* ------------------ ⏱️ time left label ------------------ */

  const timeLeftLabel = useMemo(() => {
    if (
      typeof currentPage !== "number" ||
      typeof totalPages !== "number" ||
      totalPages <= 0
    )
      return null;

    const remainingPages = Math.max(0, totalPages - currentPage);
    if (remainingPages <= 0) return null;

    const safePpm = clampBetween(ppm, MIN_VALID_PPM, MAX_VALID_PPM);

    // pages → minutes → milliseconds
    const minutes = remainingPages / safePpm;
    const ms = minutes * 60_000;

    return formatDurationShort(ms);
  }, [currentPage, totalPages, ppm]);

  return {
    ppm,
    addSample,
    timeLeftLabel,
  };
}
