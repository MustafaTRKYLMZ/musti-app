import { useCallback, useEffect, useRef } from "react";
import {
  DEDUPE_THRESHOLD_MS,
  JUMP_THRESHOLD,
  TRACKING_PAUSE_BUFFER_MS,
} from "@/constants/readerPresets";
import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";
import type { ReadingMode } from "@budget/core";

type Ctx = {
  date?: string;
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

    if (start == null || startAt == null || end == null) {
      sessionStartPageRef.current = null;
      sessionStartAtRef.current = null;
      return;
    }

    const now = Date.now();
    const durationMs = Math.max(0, now - startAt);

    // ✅ event only if moved forward
    if (end > start) {
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

    // ✅ pace sample: allow even if only 1 page (end>=start), but require some time
    if (options?.onPaceSample && end >= start && durationMs >= 6_000) {
      options.onPaceSample({
        pagesRead: Math.max(1, end - start),
        msSpent: durationMs,
      });
    }

    sessionStartPageRef.current = null;
    sessionStartAtRef.current = null;
  }, [enable, ctx?.date, ctx?.bookUri, ctx?.mode, ctx?.targetId, addEvent, options]);

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
    [enable, ctx, ensureStarted, lastEvent, setLastEvent, flushSession, addPages]
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
