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
import { BookSection } from "@/store/bookshelf/useBookSectionsStore";
import { ReadingMode } from "@budget/core";

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

    /**
     * @deprecated Kept for backward compatibility; not used in Option A.
     * Prefer using {@link readingContext.targetId} together with the
     * resolver-based sections. New code should avoid passing this prop.
     */
    sectionId?: string;
    /**
     * @deprecated Kept for backward compatibility; not used in Option A.
     * Prefer resolver-based metadata derived from {@link readingContext.targetId}.
     * New code should avoid passing this prop.
     */
    sectionTitle?: string;
  };

  /**
   * @deprecated Kept for backward compatibility; not used in Option A
   * because the resolver is responsible for providing sections.
   * Callers should rely on the resolver instead of passing sections here.
   */
  sections?: BookSection[];

  enableStatsTracking?: boolean;
};

type StripPrefs = {
  mode: StripMode;
  minimized: boolean;
  hidden: boolean;
  pos?: StripPos;
};

// Constants for stats tracking
const DEDUPE_THRESHOLD_MS = 800; // Time window to deduplicate rapid page change events
const TRACKING_PAUSE_BUFFER_MS = 120; // Buffer to prevent tracking programmatic page changes that may trigger multiple pageChanged events

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
  sections,
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

  const [scale, setScale] = useState(1);
  const [zoomHintVisible, setZoomHintVisible] = useState(false);
  const hideZoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isPausedForProgrammaticJump = useRef(false);

  const lastSeenPageRef = useRef<number | null>(null);
  const maxVisitedRef = useRef<number | null>(null);
  const maxCountedRef = useRef<number | null>(null);

  const JUMP_THRESHOLD = 2;

  const [stripMode, setStripMode] = useState<StripMode>("vertical");
  const [stripMinimized, setStripMinimized] = useState(false);
  const [stripHidden, setStripHidden] = useState(false);
  const [stripPos, setStripPos] = useState<StripPos | undefined>(undefined);
  const [stripPrefsReady, setStripPrefsReady] = useState(false);

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

  const handleZoomOut = () => {
    setScale((prev) => Math.max(1, Number((prev - 0.2).toFixed(2))));
    showZoomHint();
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(5, Number((prev + 0.2).toFixed(2))));
    showZoomHint();
  };

  const handleInternalScaleChanged = (newScale: number) => {
    setScale(newScale);
    showZoomHint();
  };

  // -------------------------
  // ✅ Session helpers
  // -------------------------
  const ensureSessionStarted = useCallback(
    (page: number) => {
      if (!enableStatsTracking) return;
      if (!readingContext?.date) return;
      if (!readingContext?.bookUri) return;

      // session start
      if (sessionStartPageRef.current == null) {
        sessionStartPageRef.current = page;
        sessionStartAtRef.current = Date.now();
      }

      // safety: if baselines somehow null, initialize
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

    // cleanup if incomplete
    if (start == null || startAt == null || end == null) {
      sessionStartPageRef.current = null;
      sessionStartAtRef.current = null;
      return;
    }

    // ✅ Option A:
    // - Only log forward unique progress (end > start)
    // - Do NOT attach sectionId/sectionTitle here
    //   Store resolver (set from sidebar) will fill section based on pageTo.
    if (end > start) {
      addEvent({
        date: readingContext.date,
        at: Date.now(),
        mode: readingContext.mode, // ✅ mode ayrımı
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

  const storageKey = useMemo(() => {
    const id = typeof source === "object" ? source.uri : String(source);
    return `pdf_strip_v1:${id}`;
  }, [source]);

  const saveStripPrefs = async (patch: Partial<StripPrefs>) => {
    try {
      const payload: StripPrefs = {
        mode: patch.mode ?? stripMode,
        minimized: patch.minimized ?? stripMinimized,
        hidden: patch.hidden ?? stripHidden,
        pos: patch.pos ?? stripPos,
      };
      await AsyncStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      console.log("strip prefs save error", e);
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
          const data = JSON.parse(raw) as Partial<StripPrefs>;

          if (data.mode === "vertical" || data.mode === "horizontal") {
            setStripMode(data.mode);
          }
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
        }
      } catch (e) {
        console.log("strip prefs load error", e);
      } finally {
        if (alive) setStripPrefsReady(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [storageKey]);

  // ✅ Reset tracking baselines when doc / initialPage changes
  useEffect(() => {
    // önce eski session’ı kapat
    flushSession();

    const start = Math.max(1, Math.floor(initialPage ?? 1));

    lastSeenPageRef.current = start;
    maxVisitedRef.current = start;
    maxCountedRef.current = start;

    // yeni session başlangıcı: ilk valid pageChanged’de ensureSessionStarted çalışacak
    sessionStartPageRef.current = null;
    sessionStartAtRef.current = null;

    isPausedForProgrammaticJump.current = false;
  }, [initialPage, storageKey, flushSession]);

  const toggleMinimized = () => {
    setStripMinimized((v) => {
      const nv = !v;
      saveStripPrefs({ minimized: nv });
      return nv;
    });
  };

  const toggleHidden = () => {
    setStripHidden((v) => {
      const nv = !v;
      saveStripPrefs({ hidden: nv });
      return nv;
    });
  };

  const toggleMode = () => {
    setStripMode((m) => {
      const nm: StripMode = m === "vertical" ? "horizontal" : "vertical";
      saveStripPrefs({ mode: nm });
      return nm;
    });
  };

  const handlePageChangedInternal = (page: number, numberOfPages: number) => {
    // keep existing behavior
    handlePageChanged(page, numberOfPages);

    // stats + events tracking
    if (!enableStatsTracking) return;
    if (!readingContext?.date) return;

    ensureSessionStarted(page);

    const now = Date.now();

    // ✅ dedupe noisy duplicate events (include targetId!)
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

    // ✅ If tracking paused for a programmatic jump, resync baselines
    // IMPORTANT FIX:
    // Previously you kept old maxVisited/maxCounted (Math.max(prevVisited, page)),
    // which caused logs like 2->30 after a jump. We must RESET maxes on jumps.
    if (isPausedForProgrammaticJump.current) {
      lastSeenPageRef.current = page;

      // ✅ reset maxes to the jumped page (new chunk)
      maxVisitedRef.current = page;
      maxCountedRef.current = page;

      // ✅ new session chunk from this page
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

    // Teleport detection: big forward/back jumps should NOT count skipped pages.
    // ✅ jump = close chunk + start new chunk (and RESET maxes)
    if (Math.abs(step) > JUMP_THRESHOLD) {
      flushSession();

      lastSeenPageRef.current = page;

      // ✅ reset: otherwise old maxVisited makes fake ranges in logs
      maxVisitedRef.current = page;
      maxCountedRef.current = page;

      sessionStartPageRef.current = page;
      sessionStartAtRef.current = now;

      return;
    }

    // Update last seen
    lastSeenPageRef.current = page;

    // Only consider forward movement for "maxVisited"
    const currentMax = maxVisitedRef.current ?? page;
    const nextMax = Math.max(currentMax, page);
    maxVisitedRef.current = nextMax;

    const countedMax = maxCountedRef.current ?? nextMax;

    // Count only the NEW increase in maxVisited (prevents zigzag inflation)
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

          {/* Zoom + menu bar */}
          <View
            style={[styles.menuButton, { backgroundColor: colors.surface }]}
          >
            <IconButton
              name="remove-outline"
              onPress={handleZoomOut}
              accessibilityLabel="Zoom out"
            />
            <IconButton
              name="add-outline"
              onPress={handleZoomIn}
              accessibilityLabel="Zoom in"
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

      {/* PDF */}
      <View
        style={[
          styles.viewer,
          { backgroundColor: isFullscreen ? "#000" : colors.background },
        ]}
      >
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
          horizontal
          enablePaging
          page={initialPage}
          scale={scale}
          minScale={1}
          maxScale={5}
          enableDoubleTapZoom
          fitPolicy={2}
          onLoadComplete={handleLoadComplete}
          onError={(error) => console.log("PDF error:", error)}
          onPageChanged={handlePageChangedInternal}
          onScaleChanged={(newScale: number) =>
            handleInternalScaleChanged(newScale)
          }
        />
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
      {stripPrefsReady &&
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
              saveStripPrefs({ pos: p });
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
