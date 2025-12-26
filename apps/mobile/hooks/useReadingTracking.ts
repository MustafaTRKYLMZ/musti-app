import { useCallback, useMemo, useRef } from "react";
import type { ReadingMode } from "@budget/core";
import { useReadingGamificationStore } from "@/store/bookshelf/readingGamification/useReadingGamificationStore";
import { useLastGainStore } from "@/hooks/useLastGain";

type ReadingContext = {
  mode: ReadingMode;
  date: string;
  bookUri?: string;
  targetId?: string;
  sectionId?: string;
  sectionTitle?: string;
};

type PaceSample = { pagesRead: number; msSpent: number };

type Options = {
  onPaceSample?: (s: PaceSample) => void;
};

type FlushResult = {
  pagesDelta: number;
  minutesDelta: number;
  fromPage: number;
  toPage: number;
  msSpent: number;
  gainedXp: number;
};

const clampInt = (n: number) => (Number.isFinite(n) ? Math.floor(n) : 0);

export function useReadingTracking(
  enabled: boolean,
  readingContext: ReadingContext | undefined,
  opts: Options = {}
) {
  const ctxRef = useRef(readingContext);
  ctxRef.current = readingContext;

  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;

  // session baselines
  const startedRef = useRef(false);
  const startPageRef = useRef(1);
  const lastPageRef = useRef(1);
  const maxVisitedRef = useRef(1);

  // time tracking
  const startedAtRef = useRef<number | null>(null);
  const lastTickRef = useRef<number | null>(null);
  const msSpentRef = useRef(0);

  // one-tick pause (jump/strip)
  const pauseNextTickRef = useRef(false);

  const resetBaselines = useCallback((startPage: number) => {
    const sp = Math.max(1, clampInt(startPage || 1));
    startedRef.current = false;

    startPageRef.current = sp;
    lastPageRef.current = sp;
    maxVisitedRef.current = sp;

    startedAtRef.current = null;
    lastTickRef.current = null;
    msSpentRef.current = 0;

    pauseNextTickRef.current = false;
  }, []);

  const ensureStarted = useCallback((page: number) => {
    if (!enabledRef.current) return;
    if (!ctxRef.current?.bookUri) return;

    const p = Math.max(1, clampInt(page || 1));

    if (!startedRef.current) {
      startedRef.current = true;
      startPageRef.current = p;
      lastPageRef.current = p;
      maxVisitedRef.current = p;

      const now = Date.now();
      startedAtRef.current = now;
      lastTickRef.current = now;
      msSpentRef.current = 0;
    }
  }, []);

  const pauseTrackingForNextTick = useCallback(() => {
    pauseNextTickRef.current = true;
  }, []);

  const onPageChangedInternal = useCallback(
    (page: number) => {
      if (!enabledRef.current) return;
      const ctx = ctxRef.current;
      if (!ctx?.bookUri) return;

      const p = Math.max(1, clampInt(page || 1));

      // ensure session started
      if (!startedRef.current) ensureStarted(p);

      // accumulate time since last tick
      const now = Date.now();
      const lastTick = lastTickRef.current;
      if (lastTick != null) {
        const dt = Math.max(0, now - lastTick);
        msSpentRef.current += dt;
      }
      lastTickRef.current = now;

      // If user jumped via strip/sidebar, don't count this as reading delta
      if (pauseNextTickRef.current) {
        pauseNextTickRef.current = false;
        lastPageRef.current = p;
        maxVisitedRef.current = Math.max(maxVisitedRef.current, p);
        return;
      }

      lastPageRef.current = p;
      maxVisitedRef.current = Math.max(maxVisitedRef.current, p);
    },
    [ensureStarted]
  );

  const flushSession = useCallback((): FlushResult => {
    if (!enabledRef.current) {
      return {
        pagesDelta: 0,
        minutesDelta: 0,
        fromPage: 1,
        toPage: 1,
        msSpent: 0,
        gainedXp: 0,
      };
    }

    const ctx = ctxRef.current;
    if (!ctx?.bookUri) {
      return {
        pagesDelta: 0,
        minutesDelta: 0,
        fromPage: 1,
        toPage: 1,
        msSpent: 0,
        gainedXp: 0,
      };
    }

    // ensure last time tick is closed
    const now = Date.now();
    const lastTick = lastTickRef.current;
    if (startedRef.current && lastTick != null) {
      msSpentRef.current += Math.max(0, now - lastTick);
    }
    lastTickRef.current = now;

    const fromPage = Math.max(1, clampInt(startPageRef.current));
    const toPage = Math.max(fromPage, clampInt(maxVisitedRef.current));
    const pagesDelta = Math.max(0, toPage - fromPage);

    const msSpent = Math.max(0, clampInt(msSpentRef.current));
    const minutesDelta = Math.max(0, clampInt(msSpent / 60_000));

    let gainedXp = 0;

    // ✅ Only log when meaningful
    if (pagesDelta > 0 || minutesDelta > 0) {
      gainedXp = useReadingGamificationStore.getState().logReadingProgress({
        bookUri: ctx.bookUri,
        at: now,
        mode: ctx.mode,
        fromPage,
        toPage,
        minutesDelta,
      });

      // ✅ emit one-shot lastGain event for toast layer (anti-spam threshold)
      if (gainedXp > 0) {
        const shouldToast =
          pagesDelta >= 2 || msSpent >= 30_000 || ctx.mode !== "normal";

        if (shouldToast) {
          useLastGainStore.getState().emit({
            at: now,
            xp: gainedXp,
            pages: pagesDelta,
            minutes: minutesDelta,
            mode: ctx.mode,
            bookUri: ctx.bookUri,
            kind: "pages",
          });
        }
      }

      // optional: pace sampling
      if (opts.onPaceSample && msSpent > 0 && pagesDelta > 0) {
        opts.onPaceSample({ pagesRead: pagesDelta, msSpent });
      }
    }

    // ✅ start new baseline at current position after flush
    const newStart = Math.max(1, clampInt(lastPageRef.current || toPage));
    resetBaselines(newStart);
    ensureStarted(newStart);

    return { pagesDelta, minutesDelta, fromPage, toPage, msSpent, gainedXp };
  }, [ensureStarted, opts.onPaceSample, resetBaselines]);

  return useMemo(
    () => ({
      resetBaselines,
      ensureStarted,
      pauseTrackingForNextTick,
      onPageChangedInternal,
      flushSession,
    }),
    [
      resetBaselines,
      ensureStarted,
      pauseTrackingForNextTick,
      onPageChangedInternal,
      flushSession,
    ]
  );
}
