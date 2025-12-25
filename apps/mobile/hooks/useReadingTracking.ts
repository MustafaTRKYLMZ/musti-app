import { useCallback, useEffect, useRef } from "react";
import {
  DEDUPE_THRESHOLD_MS,
  JUMP_THRESHOLD,
  TRACKING_PAUSE_BUFFER_MS,
} from "@/constants/readerPresets";
import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";
import type { ReadingMode } from "@budget/core";

// ✅ Gamification: only on flush, never on every page change
import { useReadingGamificationStore } from "@/store/bookshelf/readingGamification/useReadingGamificationStore";

type Ctx = {
  date?: string; // YYYY-MM-DD
  mode?: ReadingMode;
  bookUri?: string;
  targetId?: string;
};

export type PaceSample = {
  pagesRead: number;
  msSpent: number;
};

export type TrackingOptions = {
  /** Called when a session flush happens and we have a valid sample */
  onPaceSample?: (sample: PaceSample) => void;
};

export function useReadingTracking(
  enable: boolean,
  ctx?: Ctx,
  options?: TrackingOptions
) {
  const addPages = useReadingStatsStore((s) => s.addPages);
  const lastEvent = useReadingStatsStore((s) => s.lastEvent);
  const setLastEvent = useReadingStatsStore((s) => s.setLastEvent);

  const addEvent = useReadingEventsStore((s) => s.addEvent);

  const sessionStartPageRef = useRef<number | null>(null);
  const sessionStartAtRef = useRef<number | null>(null);

  const isPausedForProgrammaticJump = useRef(false);
  const lastSeenPageRef = useRef<number | null>(null);
  const maxVisitedRef = useRef<number | null>(null);
  const maxCountedRef = useRef<number | null>(null);

  const ensureStarted = useCallback(
    (page: number) => {
      if (!enable) return;
      if (!ctx?.date || !ctx?.bookUri || !ctx?.mode) return;

      if (sessionStartPageRef.current == null) {
        sessionStartPageRef.current = page;
        sessionStartAtRef.current = Date.now();
      }

      if (lastSeenPageRef.current == null) lastSeenPageRef.current = page;
      if (maxVisitedRef.current == null) maxVisitedRef.current = page;
      if (maxCountedRef.current == null) maxCountedRef.current = page;
    },
    [enable, ctx?.date, ctx?.bookUri, ctx?.mode]
  );

  const flushSession = useCallback(() => {
    if (!enable) return;
    if (!ctx?.date || !ctx?.bookUri || !ctx?.mode) return;

    const start = sessionStartPageRef.current;
    const startAt = sessionStartAtRef.current;
    const end = maxVisitedRef.current;

    // Always clear baseline if missing
    if (start == null || startAt == null || end == null) {
      sessionStartPageRef.current = null;
      sessionStartAtRef.current = null;
      return;
    }

    const now = Date.now();
    const durationMs = Math.max(0, now - startAt);

    // ✅ write event even if end === start (0 pages · N minutes)
    if (durationMs > 0) {
      addEvent({
        date: ctx.date,
        at: now,
        mode: ctx.mode,
        bookUri: ctx.bookUri,
        targetId: ctx.targetId,
        pageFrom: start,
        pageTo: end,
        durationMs,
      });
    }

    // ✅ Gamification: ONLY on flush (close / switch / done), not on every page
    const pagesRead = Math.max(0, end - start);
    const minutesDelta = Math.max(0, Math.round(durationMs / 60_000));

    // Optional tiny-noise gate:
    // If you want: require at least 1 page OR at least 1 minute.
    if (pagesRead > 0 || minutesDelta > 0) {
      useReadingGamificationStore.getState().logReadingProgress({
        bookUri: ctx.bookUri,
        at: now,
        mode: ctx.mode,
        fromPage: start,
        toPage: end,
        pagesDelta: pagesRead,
        minutesDelta,
      });
    }

    // ✅ Pace sample fix: only if actually read pages and session >= 6s
    if (options?.onPaceSample && pagesRead > 0 && durationMs >= 6_000) {
      options.onPaceSample({
        pagesRead,
        msSpent: durationMs,
      });
    }

    // reset session baseline
    sessionStartPageRef.current = null;
    sessionStartAtRef.current = null;
  }, [
    enable,
    ctx?.date,
    ctx?.bookUri,
    ctx?.mode,
    ctx?.targetId,
    addEvent,
    options,
  ]);

  const pauseTrackingForNextTick = useCallback(() => {
    flushSession();
    isPausedForProgrammaticJump.current = true;
    setTimeout(() => {
      isPausedForProgrammaticJump.current = false;
    }, TRACKING_PAUSE_BUFFER_MS);
  }, [flushSession]);

  const resetBaselines = useCallback(
    (startPage: number) => {
      flushSession();

      lastSeenPageRef.current = startPage;
      maxVisitedRef.current = startPage;
      maxCountedRef.current = startPage;

      sessionStartPageRef.current = null;
      sessionStartAtRef.current = null;

      isPausedForProgrammaticJump.current = false;
    },
    [flushSession]
  );

  const onPageChangedInternal = useCallback(
    (page: number) => {
      if (!enable) return;
      if (!ctx?.date || !ctx?.mode) return;

      ensureStarted(page);
      const now = Date.now();

      // dedupe: ignore repeated same page events in short time
      if (
        lastEvent &&
        lastEvent.date === ctx.date &&
        lastEvent.mode === ctx.mode &&
        lastEvent.page === page &&
        (lastEvent.bookUri ?? "") === (ctx.bookUri ?? "") &&
        (lastEvent.targetId ?? "") === (ctx.targetId ?? "") &&
        now - lastEvent.at < DEDUPE_THRESHOLD_MS
      ) {
        return;
      }

      setLastEvent({
        date: ctx.date,
        mode: ctx.mode,
        page,
        bookUri: ctx.bookUri,
        targetId: ctx.targetId,
        at: now,
      });

      // programmatic jump window: reset baselines and start time at this page
      if (isPausedForProgrammaticJump.current) {
        lastSeenPageRef.current = page;
        maxVisitedRef.current = page;
        maxCountedRef.current = page;

        sessionStartPageRef.current = page;
        sessionStartAtRef.current = now;
        return;
      }

      const lastSeen = lastSeenPageRef.current;
      if (lastSeen == null) {
        lastSeenPageRef.current = page;
        maxVisitedRef.current = page;
        maxCountedRef.current = page;
        return;
      }

      const step = page - lastSeen;

      // big jump => treat as navigation; flush previous session and restart
      if (Math.abs(step) > JUMP_THRESHOLD) {
        flushSession();

        lastSeenPageRef.current = page;
        maxVisitedRef.current = page;
        maxCountedRef.current = page;

        sessionStartPageRef.current = page;
        sessionStartAtRef.current = now;

        return;
      }

      lastSeenPageRef.current = page;

      const currentMax = maxVisitedRef.current ?? page;
      const nextMax = Math.max(currentMax, page);
      maxVisitedRef.current = nextMax;

      const countedMax = maxCountedRef.current ?? nextMax;
      const inc = nextMax - countedMax;

      // pages stats only move forward
      if (inc > 0) {
        addPages({
          date: ctx.date,
          pages: inc,
          mode: ctx.mode,
          bookUri: ctx.bookUri,
          targetId: ctx.targetId,
        });
        maxCountedRef.current = nextMax;
      }
    },
    [
      enable,
      ctx,
      ensureStarted,
      lastEvent,
      setLastEvent,
      flushSession,
      addPages,
    ]
  );

  useEffect(() => {
    return () => {
      flushSession();
    };
  }, [flushSession]);

  return {
    flushSession,
    pauseTrackingForNextTick,
    resetBaselines,
    onPageChangedInternal,
    ensureStarted,
  };
}
