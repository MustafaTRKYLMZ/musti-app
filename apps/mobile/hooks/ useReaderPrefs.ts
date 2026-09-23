import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { clampBetween } from "@/utils/number";
import { PREFS_DEBOUNCE_MS, PREFS_VERSION, ZOOM_PRESETS } from "@/constants/readerPresets";
import type { StripMode, StripPos } from "@/components/Books/FloatingPageStrip";
import { CropKey, ReaderPrefs, ReadingScrollMode } from "@/components/ui/pdf/types";

type Args = {
  source: { uri: string } | number;
  bookUri?: string;
};

export function useReaderPrefs({ source, bookUri }: Args) {
  const [prefsReady, setPrefsReady] = useState(false);

  // reader prefs
  const [scrollMode, setScrollMode] = useState<ReadingScrollMode>("vertical-scroll");
  const [zoomPresetIndex, setZoomPresetIndex] = useState(0);
  const [cropKey, setCropKey] = useState<CropKey>("trim");

  // strip prefs
  const [stripMode, setStripMode] = useState<StripMode>("vertical");
  const [stripMinimized, setStripMinimized] = useState(false);
  const [stripHidden, setStripHidden] = useState(false);
  const [stripPos, setStripPos] = useState<StripPos | undefined>(undefined);

  const bookPrefsId = useMemo(() => {
    if (bookUri) return `book:${bookUri}`;
    if (typeof source === "object" && source?.uri) return `pdf:${source.uri}`;
    return `res:${String(source)}`;
  }, [bookUri, source]);

  const storageKey = useMemo(
    () => `pdf_reader_prefs_${PREFS_VERSION}:${bookPrefsId}`,
    [bookPrefsId]
  );

  // ---- Debounced writer ----
  const pendingPrefsRef = useRef<ReaderPrefs | null>(null);
  const prefsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildPayload = useCallback(
    (patch: Partial<ReaderPrefs>): ReaderPrefs => ({
      // strip
      mode: patch.mode ?? stripMode,
      minimized: patch.minimized ?? stripMinimized,
      hidden: patch.hidden ?? stripHidden,
      pos: patch.pos ?? stripPos,

      // reader
      scrollMode: patch.scrollMode ?? scrollMode,
      zoomPresetIndex:
        typeof patch.zoomPresetIndex === "number" ? patch.zoomPresetIndex : zoomPresetIndex,
      cropKey: patch.cropKey ?? cropKey,
    }),
    [stripMode, stripMinimized, stripHidden, stripPos, scrollMode, zoomPresetIndex, cropKey]
  );

  const flushPrefsWrite = useCallback(async () => {
    if (prefsTimerRef.current) {
      clearTimeout(prefsTimerRef.current);
      prefsTimerRef.current = null;
    }
    const payload = pendingPrefsRef.current;
    pendingPrefsRef.current = null;
    if (!payload) return;

    try {
      await AsyncStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.log("reader prefs save error", e);
    }
  }, [storageKey]);

  const savePrefsDebounced = useCallback(
    (patch: Partial<ReaderPrefs>) => {
      const base = pendingPrefsRef.current ?? buildPayload({});
      const next = { ...base, ...buildPayload(patch) };
      pendingPrefsRef.current = next;

      if (prefsTimerRef.current) clearTimeout(prefsTimerRef.current);
      prefsTimerRef.current = setTimeout(() => {
        flushPrefsWrite();
      }, PREFS_DEBOUNCE_MS);
    },
    [buildPayload, flushPrefsWrite]
  );

  useEffect(() => {
    return () => {
      flushPrefsWrite();
    };
  }, [flushPrefsWrite]);

  // ---- Load once per book ----
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (!alive) return;

        if (raw) {
          const data = JSON.parse(raw) as Partial<ReaderPrefs>;

          // strip
          if (data.mode === "vertical" || data.mode === "horizontal") setStripMode(data.mode);
          if (typeof data.minimized === "boolean") setStripMinimized(data.minimized);
          if (typeof data.hidden === "boolean") setStripHidden(data.hidden);
          if (data.pos && typeof data.pos.x === "number" && typeof data.pos.y === "number") {
            setStripPos({ x: data.pos.x, y: data.pos.y });
          }

          // reader
          if (data.scrollMode === "horizontal-paged" || data.scrollMode === "vertical-scroll") {
            setScrollMode(data.scrollMode);
          }

          setZoomPresetIndex(clampBetween(data.zoomPresetIndex, 0, ZOOM_PRESETS.length - 1, 0));

          if (data.cropKey === "none" || data.cropKey === "trim" || data.cropKey === "tight") {
            setCropKey(data.cropKey);
          }
        }
      } catch (e) {
        console.log("reader prefs load error", e);
      } finally {
        if (alive) setPrefsReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [storageKey]);

  return {
    // ids
    storageKey,

    // ready + flush
    prefsReady,
    flushPrefsWrite,

    // reader state
    scrollMode,
    setScrollMode,
    zoomPresetIndex,
    setZoomPresetIndex,
    cropKey,
    setCropKey,

    // strip state
    stripMode,
    setStripMode,
    stripMinimized,
    setStripMinimized,
    stripHidden,
    setStripHidden,
    stripPos,
    setStripPos,

    // save
    savePrefsDebounced,
  };
}
