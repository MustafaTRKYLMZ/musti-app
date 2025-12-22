import React, {
  FC,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Pdf, { PdfRef } from "react-native-pdf";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

import {
  MText,
  bookshelfTheme,
  iconSizes,
  radii,
  spacing,
  useTheme,
} from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";
import { PageStrip } from "./PageStrip";
import {
  FloatingPageStrip,
  StripMode,
  StripPos,
} from "@/components/Books/FloatingPageStrip";

import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";
import { BookSection, ReadingMode } from "@budget/core";
import { CropKey, ReaderPrefs, ReadingScrollMode } from "./types";
import { clampBetween } from "@/utils/number";
import {
  CROP_PRESETS,
  DEDUPE_THRESHOLD_MS,
  JUMP_THRESHOLD,
  PREFS_DEBOUNCE_MS,
  PREFS_VERSION,
  TRACKING_PAUSE_BUFFER_MS,
  ZOOM_PRESETS,
} from "@/constants/readerPresets";
import { ReaderSettingsPanel } from "./ReaderSettingsPanel";

const { colors: bookshelfColors } = bookshelfTheme;

type PdfReaderProps = {
  isFullscreen: boolean;
  name: string;
  setIsFullscreen: (value: boolean) => void;
  handleClose: () => void;

  source: { uri: string } | number;
  initialPage: number;

  handleLoadComplete: (numberOfPages: number, filePath?: string) => void;
  handlePageChanged: (page: number, numberOfPages: number) => void;

  pdfRef?: React.RefObject<PdfRef | null>;
  onPressMenu?: () => void;

  currentPage?: number;
  totalPages?: number;

  readingContext?: {
    mode: ReadingMode;
    date: string;
    bookUri?: string;
    targetId?: string;

    /** @deprecated */
    sectionId?: string;
    /** @deprecated */
    sectionTitle?: string;
  };

  /** @deprecated */
  sections?: BookSection[];

  enableStatsTracking?: boolean;
};

/* -------------------------- Main PdfReader -------------------------- */

export const PdfReader: FC<PdfReaderProps> = ({
  isFullscreen,
  name,
  setIsFullscreen,
  handleClose,
  source,
  initialPage,
  handleLoadComplete,
  handlePageChanged,
  pdfRef,
  onPressMenu,
  currentPage,
  totalPages,
  readingContext,
  enableStatsTracking = true,
}) => {
  const { colors } = useTheme();

  // ✅ aggregate stats
  const addPages = useReadingStatsStore((s) => s.addPages);
  const lastEvent = useReadingStatsStore((s) => s.lastEvent);
  const setLastEvent = useReadingStatsStore((s) => s.setLastEvent);

  // ✅ detailed sessions
  const addEvent = useReadingEventsStore((s) => s.addEvent);

  // ✅ session refs (for detailed logging)
  const sessionStartPageRef = useRef<number | null>(null);
  const sessionStartAtRef = useRef<number | null>(null);

  const [zoomHintVisible, setZoomHintVisible] = useState(false);
  const hideZoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPausedForProgrammaticJump = useRef(false);
  const lastSeenPageRef = useRef<number | null>(null);
  const maxVisitedRef = useRef<number | null>(null);
  const maxCountedRef = useRef<number | null>(null);

  // ✅ Reader prefs (book-specific)
  const [scrollMode, setScrollMode] =
    useState<ReadingScrollMode>("vertical-scroll");
  const [zoomPresetIndex, setZoomPresetIndex] = useState(0);
  const [cropKey, setCropKey] = useState<CropKey>("trim");

  // ✅ Settings panel
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ✅ Viewer size (for crop transform)
  const [viewerSize, setViewerSize] = useState({ w: 0, h: 0 });

  // ✅ Strip prefs
  const [stripMode, setStripMode] = useState<StripMode>("vertical");
  const [stripMinimized, setStripMinimized] = useState(false);
  const [stripHidden, setStripHidden] = useState(false);
  const [stripPos, setStripPos] = useState<StripPos | undefined>(undefined);
  const [prefsReady, setPrefsReady] = useState(false);

  // ✅ stable book-level id (best-effort)
  const bookPrefsId = useMemo(() => {
    if (readingContext?.bookUri) return `book:${readingContext.bookUri}`;
    if (typeof source === "object" && source?.uri) return `pdf:${source.uri}`;
    return `res:${String(source)}`;
  }, [readingContext?.bookUri, source]);

  const storageKey = useMemo(() => {
    return `pdf_reader_prefs_${PREFS_VERSION}:${bookPrefsId}`;
  }, [bookPrefsId]);

  const cropLabel =
    cropKey === "none" ? "Off" : cropKey === "trim" ? "Trim" : "Tight";

  // “Punto” scale (user intent)
  const userScale = ZOOM_PRESETS[zoomPresetIndex] ?? 1;
  const zoomPercent = Math.round(userScale * 100);

  const crop = CROP_PRESETS[cropKey];

  const scheduleHideZoomHint = () => {
    if (hideZoomTimeoutRef.current) clearTimeout(hideZoomTimeoutRef.current);
    hideZoomTimeoutRef.current = setTimeout(
      () => setZoomHintVisible(false),
      1200
    );
  };

  const showZoomHint = () => {
    setZoomHintVisible(true);
    scheduleHideZoomHint();
  };

  // -------------------------
  // ✅ Debounced prefs writer (prevents AsyncStorage spam)
  // -------------------------
  const pendingPrefsRef = useRef<ReaderPrefs | null>(null);
  const prefsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildPrefsPayload = useCallback(
    (patch: Partial<ReaderPrefs>): ReaderPrefs => {
      return {
        // strip
        mode: patch.mode ?? stripMode,
        minimized: patch.minimized ?? stripMinimized,
        hidden: patch.hidden ?? stripHidden,
        pos: patch.pos ?? stripPos,

        // reader
        scrollMode: patch.scrollMode ?? scrollMode,
        zoomPresetIndex:
          typeof patch.zoomPresetIndex === "number"
            ? patch.zoomPresetIndex
            : zoomPresetIndex,
        cropKey: patch.cropKey ?? cropKey,
      };
    },
    [
      cropKey,
      scrollMode,
      stripHidden,
      stripMinimized,
      stripMode,
      stripPos,
      zoomPresetIndex,
    ]
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

  const saveReaderPrefsDebounced = useCallback(
    (patch: Partial<ReaderPrefs>) => {
      const base = pendingPrefsRef.current ?? buildPrefsPayload({});
      const next = { ...base, ...buildPrefsPayload(patch) };
      pendingPrefsRef.current = next;

      if (prefsTimerRef.current) clearTimeout(prefsTimerRef.current);
      prefsTimerRef.current = setTimeout(() => {
        flushPrefsWrite();
      }, PREFS_DEBOUNCE_MS);
    },
    [buildPrefsPayload, flushPrefsWrite]
  );

  // On storageKey change/unmount: flush pending write
  useEffect(() => {
    return () => {
      flushPrefsWrite();
      if (hideZoomTimeoutRef.current) clearTimeout(hideZoomTimeoutRef.current);
    };
  }, [flushPrefsWrite]);

  // -------------------------
  // ✅ Load prefs once per BOOK
  // -------------------------
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        if (!alive) return;

        if (raw) {
          const data = JSON.parse(raw) as Partial<ReaderPrefs>;

          // strip
          if (data.mode === "vertical" || data.mode === "horizontal")
            setStripMode(data.mode);
          if (typeof data.minimized === "boolean")
            setStripMinimized(data.minimized);
          if (typeof data.hidden === "boolean") setStripHidden(data.hidden);
          if (
            data.pos &&
            typeof data.pos.x === "number" &&
            typeof data.pos.y === "number"
          ) {
            setStripPos({ x: data.pos.x, y: data.pos.y });
          }

          // reader
          if (
            data.scrollMode === "horizontal-paged" ||
            data.scrollMode === "vertical-scroll"
          ) {
            setScrollMode(data.scrollMode);
          }

          // NOTE: clampBetween handles unknown/NaN/float safely
          setZoomPresetIndex(
            clampBetween(data.zoomPresetIndex, 0, ZOOM_PRESETS.length - 1, 0)
          );

          if (
            data.cropKey === "none" ||
            data.cropKey === "trim" ||
            data.cropKey === "tight"
          ) {
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

  // -------------------------
  // ✅ Session helpers
  // -------------------------
  const ensureSessionStarted = useCallback(
    (page: number) => {
      if (!enableStatsTracking) return;
      if (!readingContext?.date) return;
      if (!readingContext?.bookUri) return;

      if (sessionStartPageRef.current == null) {
        sessionStartPageRef.current = page;
        sessionStartAtRef.current = Date.now();
      }

      if (lastSeenPageRef.current == null) lastSeenPageRef.current = page;
      if (maxVisitedRef.current == null) maxVisitedRef.current = page;
      if (maxCountedRef.current == null) maxCountedRef.current = page;
    },
    [enableStatsTracking, readingContext?.date, readingContext?.bookUri]
  );

  const flushSession = useCallback(() => {
    if (!enableStatsTracking) return;
    if (!readingContext?.date) return;
    if (!readingContext?.bookUri) return;

    const start = sessionStartPageRef.current;
    const startAt = sessionStartAtRef.current;
    const end = maxVisitedRef.current;

    if (start == null || startAt == null || end == null) {
      sessionStartPageRef.current = null;
      sessionStartAtRef.current = null;
      return;
    }

    if (end > start) {
      addEvent({
        date: readingContext.date,
        at: Date.now(),
        mode: readingContext.mode,
        bookUri: readingContext.bookUri,
        targetId: readingContext.targetId,
        pageFrom: start,
        pageTo: end,
      });
    }

    sessionStartPageRef.current = null;
    sessionStartAtRef.current = null;
  }, [
    addEvent,
    enableStatsTracking,
    readingContext?.bookUri,
    readingContext?.date,
    readingContext?.mode,
    readingContext?.targetId,
  ]);

  const pauseTrackingForNextTick = () => {
    flushSession();

    isPausedForProgrammaticJump.current = true;
    setTimeout(() => {
      isPausedForProgrammaticJump.current = false;
    }, TRACKING_PAUSE_BUFFER_MS);
  };

  const handlePressPageThumb = (page: number) => {
    if (!pdfRef?.current) return;
    if (page <= 0) return;
    pauseTrackingForNextTick();
    pdfRef.current.setPage(page);
  };

  // ✅ Reset tracking baselines when doc / initialPage changes
  useEffect(() => {
    flushSession();

    const start = Math.max(1, Math.floor(initialPage ?? 1));
    lastSeenPageRef.current = start;
    maxVisitedRef.current = start;
    maxCountedRef.current = start;

    sessionStartPageRef.current = null;
    sessionStartAtRef.current = null;

    isPausedForProgrammaticJump.current = false;
  }, [initialPage, storageKey, flushSession]);

  // -------------------------
  // ✅ UI actions: strip
  // -------------------------
  const toggleMinimized = () => {
    setStripMinimized((v) => {
      const nv = !v;
      saveReaderPrefsDebounced({ minimized: nv });
      return nv;
    });
  };

  const toggleHidden = () => {
    setStripHidden((v) => {
      const nv = !v;
      saveReaderPrefsDebounced({ hidden: nv });
      return nv;
    });
  };

  const toggleMode = () => {
    setStripMode((m) => {
      const nm: StripMode = m === "vertical" ? "horizontal" : "vertical";
      saveReaderPrefsDebounced({ mode: nm });
      return nm;
    });
  };

  // -------------------------
  // ✅ UI actions: reader
  // -------------------------
  const applyZoomIndex = (idx: number) => {
    const next = clampBetween(idx, 0, ZOOM_PRESETS.length - 1, 0);
    setZoomPresetIndex(next);
    saveReaderPrefsDebounced({ zoomPresetIndex: next });
    showZoomHint();
  };

  const handleAminus = () => applyZoomIndex(zoomPresetIndex - 1);
  const handleAplus = () => applyZoomIndex(zoomPresetIndex + 1);

  const handleDoubleTapZoom = useCallback(() => {
    const next = zoomPresetIndex >= 5 ? 0 : zoomPresetIndex + 1;
    applyZoomIndex(next);
  }, [zoomPresetIndex, applyZoomIndex]);

  const toggleScrollMode = () => {
    flushSession();
    pauseTrackingForNextTick();

    setScrollMode((m) => {
      const nm: ReadingScrollMode =
        m === "vertical-scroll" ? "horizontal-paged" : "vertical-scroll";
      saveReaderPrefsDebounced({ scrollMode: nm });
      return nm;
    });
  };

  const cycleCrop = useCallback(() => {
    const next: CropKey =
      cropKey === "none" ? "trim" : cropKey === "trim" ? "tight" : "none";
    setCropKey(next);
    saveReaderPrefsDebounced({ cropKey: next });
  }, [cropKey, saveReaderPrefsDebounced]);

  const pdfHorizontal = scrollMode === "horizontal-paged";
  const pdfEnablePaging = scrollMode === "horizontal-paged";

  // ✅ NEW: Gesture API (TapGestureHandler deprecated)
  const doubleTapGesture = useMemo(() => {
    return Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(250)
      .onEnd(() => {
        // Gesture callbacks may run on the UI thread; ensure JS state updates safely.
        runOnJS(handleDoubleTapZoom)();
      });
  }, [handleDoubleTapZoom]);

  // -------------------------
  // ✅ Crop transform (visual trim)
  // -------------------------
  const cropTransform = useMemo(() => {
    const W = viewerSize.w;
    const H = viewerSize.h;
    if (W <= 0 || H <= 0) {
      return { cropScale: 1, tx: 0, ty: 0 };
    }

    const visibleW = W * (1 - crop.l - crop.r);
    const visibleH = H * (1 - crop.t - crop.b);

    const cropScale = Math.max(
      W / Math.max(1, visibleW),
      H / Math.max(1, visibleH)
    );

    const tx = -W * (crop.l - crop.r) * 0.5 * cropScale;
    const ty = -H * (crop.t - crop.b) * 0.5 * cropScale;

    return { cropScale, tx, ty };
  }, [viewerSize.w, viewerSize.h, crop.l, crop.r, crop.t, crop.b]);

  const visualScale = userScale * cropTransform.cropScale;

  // -------------------------
  // ✅ Page changed
  // -------------------------
  const handlePageChangedInternal = (page: number, numberOfPages: number) => {
    handlePageChanged(page, numberOfPages);

    if (!enableStatsTracking) return;
    if (!readingContext?.date) return;

    ensureSessionStarted(page);

    const now = Date.now();

    if (
      lastEvent &&
      lastEvent.date === readingContext.date &&
      lastEvent.mode === readingContext.mode &&
      lastEvent.page === page &&
      (lastEvent.bookUri ?? "") === (readingContext.bookUri ?? "") &&
      (lastEvent.targetId ?? "") === (readingContext.targetId ?? "") &&
      now - lastEvent.at < DEDUPE_THRESHOLD_MS
    ) {
      return;
    }

    setLastEvent({
      date: readingContext.date,
      mode: readingContext.mode,
      page,
      bookUri: readingContext.bookUri,
      targetId: readingContext.targetId,
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
        date: readingContext.date,
        pages: inc,
        mode: readingContext.mode,
        bookUri: readingContext.bookUri,
        targetId: readingContext.targetId,
      });
      maxCountedRef.current = nextMax;
    }
  };

  // -------------------------
  // ✅ Close handler: flush prefs + session (no data loss)
  // -------------------------
  const handleCloseInternal = async () => {
    flushSession();
    await flushPrefsWrite();
    handleClose();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isFullscreen ? "#000" : colors.background },
      ]}
    >
      {/* Header */}
      {!isFullscreen && (
        <View>
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.surface,
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: colors.borderSubtle,
                shadowColor: colors.shadowStrong,
                shadowOpacity: 0.12,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 3 },
                paddingTop: spacing["2xl"],
              },
            ]}
          >
            <MText
              variant="heading2"
              color="textPrimary"
              style={styles.title}
              numberOfLines={1}
            >
              {name}
            </MText>

            <View style={styles.headerActions}>
              <IconButton
                name="expand-outline"
                size={iconSizes.lg}
                onPress={() => setIsFullscreen(true)}
                style={styles.iconButton}
                accessibilityLabel="Enter fullscreen"
              />

              <IconButton
                name="close-outline"
                size={iconSizes.xl}
                onPress={handleCloseInternal}
                style={styles.iconButton}
                accessibilityLabel="Close reader"
              />
            </View>
          </View>

          {/* Controls: A-/A+ + scroll toggle + crop icon + crop badge + settings + menu */}
          <View
            style={[styles.menuButton, { backgroundColor: colors.surface }]}
          >
            <IconButton
              name="remove-outline"
              onPress={handleAminus}
              accessibilityLabel="Smaller text"
            />
            <IconButton
              name="add-outline"
              onPress={handleAplus}
              accessibilityLabel="Larger text"
            />

            <IconButton
              name={
                scrollMode === "vertical-scroll"
                  ? "swap-vertical"
                  : "swap-horizontal"
              }
              onPress={toggleScrollMode}
              accessibilityLabel={
                scrollMode === "vertical-scroll"
                  ? "Switch to horizontal paging"
                  : "Switch to vertical scrolling"
              }
            />

            {/* ✅ crop on header bar */}
            <IconButton
              name="crop-outline"
              onPress={cycleCrop}
              accessibilityLabel={`Trim margins: ${cropLabel}`}
            />

            {/* optional: show current crop mode as a small badge; tap cycles too */}
            <Pressable
              onPress={cycleCrop}
              style={[
                styles.badge,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
              accessibilityLabel="Toggle margin trim"
            >
              <MText variant="caption" color="textSecondary">
                {cropLabel}
              </MText>
            </Pressable>

            <IconButton
              name="options-outline"
              onPress={() => setSettingsOpen(true)}
              accessibilityLabel="Reader settings"
            />

            {onPressMenu && (
              <IconButton
                name="menu"
                onPress={onPressMenu}
                accessibilityLabel="Open chapters"
              />
            )}
          </View>
        </View>
      )}

      {/* Fullscreen exit button */}
      {isFullscreen && (
        <View style={styles.fullscreenOverlay}>
          <IconButton
            name="contract-outline"
            size={iconSizes.lg}
            color={colors.textInverse}
            backgroundColor={colors.surfaceStrong}
            padding={spacing.sm}
            onPress={() => setIsFullscreen(false)}
            accessibilityLabel="Exit fullscreen"
          />
        </View>
      )}

      {/* PDF (double tap zoom wrapper + visual crop) */}
      <View
        style={[
          styles.viewer,
          { backgroundColor: isFullscreen ? "#000" : colors.background },
        ]}
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          setViewerSize({ w: width, h: height });
        }}
      >
        <GestureDetector gesture={doubleTapGesture}>
          <View style={styles.cropClip}>
            <Pdf
              ref={pdfRef}
              source={source}
              style={[
                styles.pdf,
                {
                  backgroundColor: isFullscreen ? "#000" : colors.background,
                  width: "100%",
                  height: "100%",
                  transform: [
                    { translateX: cropTransform.tx * userScale },
                    { translateY: cropTransform.ty * userScale },
                    { scale: visualScale },
                  ],
                },
              ]}
              horizontal={pdfHorizontal}
              enablePaging={pdfEnablePaging}
              page={initialPage}
              // IMPORTANT: zoom handled visually via transform
              scale={1}
              minScale={1}
              maxScale={1}
              enableDoubleTapZoom={false}
              fitPolicy={2}
              onLoadComplete={handleLoadComplete}
              onError={(error) => console.log("PDF error:", error)}
              onPageChanged={handlePageChangedInternal}
            />
          </View>
        </GestureDetector>
      </View>

      {/* Page badge */}
      {typeof currentPage === "number" && typeof totalPages === "number" && (
        <View style={styles.pageBadgeContainer}>
          <View
            style={[styles.pageBadge, { backgroundColor: colors.background }]}
          >
            <MText variant="caption" color="textInverse">
              {currentPage} / {totalPages}
            </MText>
          </View>
        </View>
      )}

      {/* Zoom hint */}
      {zoomHintVisible && (
        <View style={styles.zoomBadge}>
          <MText variant="caption" color="textPrimary">
            {zoomPercent}%
          </MText>
        </View>
      )}

      {/* Persisted Floating Page Strip */}
      {prefsReady &&
        !isFullscreen &&
        typeof totalPages === "number" &&
        totalPages > 1 && (
          <FloatingPageStrip
            mode={stripMode}
            minimized={stripMinimized}
            hidden={stripHidden}
            initialPos={stripPos}
            onPosChange={(p) => {
              setStripPos(p);
              saveReaderPrefsDebounced({ pos: p });
            }}
            onToggleMinimized={toggleMinimized}
            onToggleHidden={toggleHidden}
            onToggleMode={toggleMode}
          >
            <PageStrip
              totalPages={totalPages}
              currentPage={currentPage}
              onPressPage={handlePressPageThumb}
              orientation={stripMode === "vertical" ? "vertical" : "horizontal"}
              maxVisibleChips={stripMinimized ? 3 : undefined}
            />
          </FloatingPageStrip>
        )}

      <ReaderSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        scrollMode={scrollMode}
        setScrollMode={(m) => {
          flushSession();
          pauseTrackingForNextTick();
          setScrollMode(m);
        }}
        zoomPresetIndex={zoomPresetIndex}
        setZoomPresetIndex={(i) => {
          setZoomPresetIndex(i);
          showZoomHint();
        }}
        cropKey={cropKey}
        setCropKey={setCropKey}
        onPersist={(patch) => {
          saveReaderPrefsDebounced(patch);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  title: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: spacing.sm,
  },

  viewer: { flex: 1 },

  cropClip: {
    flex: 1,
    overflow: "hidden",
  },

  pdf: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  fullscreenOverlay: {
    position: "absolute",
    top: spacing["2xl"],
    right: spacing.lg,
    zIndex: 10,
  },

  menuButton: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },

  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
  },

  pageBadgeContainer: {
    position: "absolute",
    bottom: spacing["2xl"] + 16,
    left: 0,
    right: 0,
    alignItems: "center",
    pointerEvents: "none",
  },

  pageBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },

  zoomBadge: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg + 80,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: bookshelfColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: bookshelfColors.borderSubtle,
  },
});
