import React, {
  FC,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { View, StyleSheet } from "react-native";
import Pdf, { PdfRef } from "react-native-pdf";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { TapGestureHandler, State } from "react-native-gesture-handler";

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

type StripPrefs = {
  mode: StripMode;
  minimized: boolean;
  hidden: boolean;
  pos?: StripPos;
};

type ReadingScrollMode = "horizontal-paged" | "vertical-scroll";

type ReaderPrefs = StripPrefs & {
  scrollMode: ReadingScrollMode;
  zoomPresetIndex: number;
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

// “Punto” hissi veren preset zoom’lar
const ZOOM_PRESETS = [1, 1.15, 1.3, 1.5, 1.75, 2.0, 2.25, 2.5] as const;

// Constants for stats tracking
const DEDUPE_THRESHOLD_MS = 800;
const TRACKING_PAUSE_BUFFER_MS = 120;
const JUMP_THRESHOLD = 2;

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

  // ✅ Reader prefs
  const [scrollMode, setScrollMode] =
    useState<ReadingScrollMode>("vertical-scroll");
  const [zoomPresetIndex, setZoomPresetIndex] = useState(0);

  // ✅ Strip prefs
  const [stripMode, setStripMode] = useState<StripMode>("vertical");
  const [stripMinimized, setStripMinimized] = useState(false);
  const [stripHidden, setStripHidden] = useState(false);
  const [stripPos, setStripPos] = useState<StripPos | undefined>(undefined);
  const [prefsReady, setPrefsReady] = useState(false);

  const scale = ZOOM_PRESETS[zoomPresetIndex] ?? 1;
  const zoomPercent = Math.round(scale * 100);

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

  const storageKey = useMemo(() => {
    const id = typeof source === "object" ? source.uri : String(source);
    return `pdf_strip_v1:${id}`;
  }, [source]);

  const saveReaderPrefs = async (patch: Partial<ReaderPrefs>) => {
    try {
      const payload: ReaderPrefs = {
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
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.log("reader prefs save error", e);
    }
  };

  // ✅ Load prefs once per PDF
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
          if (typeof data.zoomPresetIndex === "number") {
            setZoomPresetIndex(
              clamp(data.zoomPresetIndex, 0, ZOOM_PRESETS.length - 1)
            );
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

  useEffect(() => {
    return () => {
      flushSession();
      if (hideZoomTimeoutRef.current) clearTimeout(hideZoomTimeoutRef.current);
    };
  }, [flushSession]);

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
      saveReaderPrefs({ minimized: nv });
      return nv;
    });
  };

  const toggleHidden = () => {
    setStripHidden((v) => {
      const nv = !v;
      saveReaderPrefs({ hidden: nv });
      return nv;
    });
  };

  const toggleMode = () => {
    setStripMode((m) => {
      const nm: StripMode = m === "vertical" ? "horizontal" : "vertical";
      saveReaderPrefs({ mode: nm });
      return nm;
    });
  };

  // -------------------------
  // ✅ UI actions: reader
  // -------------------------
  const applyZoomIndex = (idx: number) => {
    const next = clamp(idx, 0, ZOOM_PRESETS.length - 1);
    setZoomPresetIndex(next);
    saveReaderPrefs({ zoomPresetIndex: next });
    showZoomHint();
  };

  const handleAminus = () => applyZoomIndex(zoomPresetIndex - 1);
  const handleAplus = () => applyZoomIndex(zoomPresetIndex + 1);

  const handleDoubleTapZoom = () => {
    // 1.0 → ... → 2.0 → 1.0 (okuma hissi için pratik)
    const next = zoomPresetIndex >= 5 ? 0 : zoomPresetIndex + 1;
    applyZoomIndex(next);
  };

  const toggleScrollMode = () => {
    flushSession();
    pauseTrackingForNextTick();

    setScrollMode((m) => {
      const nm: ReadingScrollMode =
        m === "vertical-scroll" ? "horizontal-paged" : "vertical-scroll";
      saveReaderPrefs({ scrollMode: nm });
      return nm;
    });
  };

  const pdfHorizontal = scrollMode === "horizontal-paged";
  const pdfEnablePaging = scrollMode === "horizontal-paged";

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
                paddingTop: isFullscreen ? 0 : spacing["2xl"],
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
                onPress={() => {
                  flushSession();
                  handleClose();
                }}
                style={styles.iconButton}
                accessibilityLabel="Close reader"
              />
            </View>
          </View>

          {/* ✅ Reader controls: A-/A+ + mode toggle + menu */}
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
              // icon set’inize göre gerekirse değiştirin
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

      {/* Fullscreen button */}
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

      {/* PDF (double tap zoom wrapper) */}
      <View
        style={[
          styles.viewer,
          { backgroundColor: isFullscreen ? "#000" : colors.background },
        ]}
      >
        <TapGestureHandler
          numberOfTaps={2}
          maxDelayMs={250}
          onHandlerStateChange={(e) => {
            if (e.nativeEvent.state === State.ACTIVE) {
              handleDoubleTapZoom();
            }
          }}
        >
          <View style={{ flex: 1 }}>
            <Pdf
              ref={pdfRef}
              source={source}
              style={[
                styles.pdf,
                {
                  backgroundColor: isFullscreen ? "#000" : colors.background,
                  width: "100%",
                  height: "100%",
                },
              ]}
              // ✅ user-selectable reading direction
              horizontal={pdfHorizontal}
              enablePaging={pdfEnablePaging}
              page={initialPage}
              scale={scale}
              minScale={ZOOM_PRESETS[0]}
              maxScale={ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
              // ❗ we handle double tap ourselves
              enableDoubleTapZoom={false}
              fitPolicy={2}
              onLoadComplete={handleLoadComplete}
              onError={(error) => console.log("PDF error:", error)}
              onPageChanged={handlePageChangedInternal}
              onScaleChanged={(newScale: number) => {
                // Kullanıcı pinch yaptıysa en yakın preset’e yuvarla (stabil “punto” hissi)
                const nearest = ZOOM_PRESETS.reduce(
                  (best, z, i) => {
                    const d = Math.abs(z - newScale);
                    return d < best.d ? { i, d } : best;
                  },
                  { i: zoomPresetIndex, d: Infinity }
                ).i;

                if (nearest !== zoomPresetIndex) {
                  setZoomPresetIndex(nearest);
                  saveReaderPrefs({ zoomPresetIndex: nearest });
                }
                showZoomHint();
              }}
            />
          </View>
        </TapGestureHandler>
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

      {/* ✅ Persisted Floating Page Strip */}
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
              saveReaderPrefs({ pos: p });
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

  viewer: {
    flex: 1,
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
