import React, {
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import { View, StyleSheet, Animated } from "react-native";
import { PdfRef } from "react-native-pdf";
import { spacing, useTheme, iconSizes } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

import {
  FloatingPageStrip,
  StripMode,
} from "@/components/Books/FloatingPageStrip";
import { PageStrip } from "@/components/ui/pdf/PageStrip";
import { ReaderSettingsPanel } from "@/components/ui/pdf/ReaderSettingsPanel";
import { ReaderBadges } from "@/components/ui/pdf/ReaderBadges";

import type { BookSection, ReadingMode } from "@budget/core";
import type { CropKey } from "@/components/ui/pdf/types";

import { ZOOM_PRESETS } from "@/constants/readerPresets";
import { useReadingPace } from "@/hooks/useReadingPace";
import { useReadingTracking } from "@/hooks/useReadingTracking";

import { formatDurationShort } from "@/utils/formatDuration";
import { clampBetween } from "@/utils/number";

import { scheduleMotivationNudgeIfNeeded } from "@/utils/motivation";
import { PdfOpenIntroOverlay } from "@/components/ui/pdf/PdfOpenIntroOverlay";
import { useCropTransform } from "@/hooks/ useCropTransform";
import { useReaderPrefs } from "@/hooks/ useReaderPrefs";
import { PdfViewport } from "../ui/pdf/ PdfViewport";
import { ReaderHeaderBar } from "../ui/pdf/ ReaderHeaderBar";

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
    sectionId?: string;
    sectionTitle?: string;
  };

  sections?: BookSection[];
  enableStatsTracking?: boolean;

  timeLeftRemainingPages?: number | null;
};

const clampIndex = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const MIN_VALID_PPM = 0.2;
const MAX_VALID_PPM = 12;

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
  timeLeftRemainingPages = null,
}) => {
  const { colors } = useTheme();

  const prefs = useReaderPrefs({ source, bookUri: readingContext?.bookUri });

  /** Intro overlay control */
  const [introVisible, setIntroVisible] = useState(true);
  const [pdfReady, setPdfReady] = useState(false);

  const pdfOpacity = useRef(new Animated.Value(0)).current;

  const paceKey =
    readingContext?.bookUri ??
    (typeof source === "object" ? source.uri : String(source));

  useEffect(() => {
    setIntroVisible(true);
    setPdfReady(false);
    pdfOpacity.setValue(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // en güvenlisi: pdf’in kimliği
    typeof source === "object" ? source.uri : String(source),
    // bazı akışlarda aynı source ama farklı context olabilir:
    readingContext?.mode,
    readingContext?.targetId,
  ]);

  const onLoadCompleteInternal = useCallback(
    (n: number, fp?: string) => {
      handleLoadComplete(n, fp);
      setPdfReady(true);

      Animated.timing(pdfOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    },
    [handleLoadComplete, pdfOpacity]
  );

  const pace = useReadingPace({
    paceKey: paceKey ?? null,
    currentPage,
    totalPages,
  });

  const timeLeftLabel = useMemo(() => {
    let remainingPages: number | null = null;

    if (
      typeof timeLeftRemainingPages === "number" &&
      Number.isFinite(timeLeftRemainingPages)
    ) {
      remainingPages = Math.max(0, Math.floor(timeLeftRemainingPages));
    } else if (
      typeof currentPage === "number" &&
      typeof totalPages === "number" &&
      Number.isFinite(currentPage) &&
      Number.isFinite(totalPages) &&
      totalPages > 0
    ) {
      remainingPages = Math.max(0, Math.floor(totalPages - currentPage));
    }

    if (remainingPages == null || remainingPages <= 0) return null;

    const safePpm = clampBetween(pace.ppm, MIN_VALID_PPM, MAX_VALID_PPM);
    const minutes = remainingPages / safePpm;
    const ms = minutes * 60_000;

    return formatDurationShort(ms);
  }, [timeLeftRemainingPages, currentPage, totalPages, pace.ppm]);

  // crop + zoom transforms
  const { setViewerSize, userScale, visualScale, cropTransform } =
    useCropTransform(prefs.cropKey, prefs.zoomPresetIndex);

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [zoomHintVisible, setZoomHintVisible] = useState(false);
  const hideZoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showZoomHint = useCallback(() => {
    setZoomHintVisible(true);
    if (hideZoomTimeoutRef.current) clearTimeout(hideZoomTimeoutRef.current);
    hideZoomTimeoutRef.current = setTimeout(() => {
      setZoomHintVisible(false);
    }, 1200);
  }, []);

  useEffect(() => {
    return () => {
      if (hideZoomTimeoutRef.current) clearTimeout(hideZoomTimeoutRef.current);
    };
  }, []);

  const cropLabel =
    prefs.cropKey === "none"
      ? "Off"
      : prefs.cropKey === "trim"
      ? "Trim"
      : "Tight";

  const zoomPercent = Math.round(userScale * 100);

  const tracking = useReadingTracking(enableStatsTracking, readingContext, {
    onPaceSample: (s) => pace.addSample(s.pagesRead, s.msSpent),
  });

  useEffect(() => {
    const startPage = Math.max(1, Math.floor(initialPage ?? 1));
    tracking.resetBaselines(startPage);
    tracking.ensureStarted(startPage);
  }, [
    initialPage,
    prefs.storageKey,
    tracking.resetBaselines,
    tracking.ensureStarted,
  ]);

  const applyZoomIndex = useCallback(
    (nextIdx: number) => {
      const next = clampIndex(nextIdx, 0, ZOOM_PRESETS.length - 1);
      prefs.setZoomPresetIndex(next);
      prefs.savePrefsDebounced({ zoomPresetIndex: next });
      showZoomHint();
    },
    [prefs, showZoomHint]
  );

  const handleAminus = () => applyZoomIndex(prefs.zoomPresetIndex - 1);
  const handleAplus = () => applyZoomIndex(prefs.zoomPresetIndex + 1);

  const handleDoubleTapZoom = useCallback(() => {
    const next = prefs.zoomPresetIndex >= 5 ? 0 : prefs.zoomPresetIndex + 1;
    applyZoomIndex(next);
  }, [prefs.zoomPresetIndex, applyZoomIndex]);

  const toggleScrollMode = () => {
    tracking.flushSession();
    tracking.pauseTrackingForNextTick();

    prefs.setScrollMode((m) => {
      const nm =
        m === "vertical-scroll" ? "horizontal-paged" : "vertical-scroll";
      prefs.savePrefsDebounced({ scrollMode: nm });
      return nm;
    });
  };

  const cycleCrop = useCallback(() => {
    const next: CropKey =
      prefs.cropKey === "none"
        ? "trim"
        : prefs.cropKey === "trim"
        ? "tight"
        : "none";
    prefs.setCropKey(next);
    prefs.savePrefsDebounced({ cropKey: next });
  }, [prefs]);

  const pdfHorizontal = prefs.scrollMode === "horizontal-paged";
  const pdfEnablePaging = prefs.scrollMode === "horizontal-paged";

  const onPressPageThumb = (page: number) => {
    if (!pdfRef?.current) return;
    tracking.pauseTrackingForNextTick();
    pdfRef.current.setPage(page);
  };

  const handlePageChangedInternal = (page: number, numberOfPages: number) => {
    handlePageChanged(page, numberOfPages);
    tracking.onPageChangedInternal(page);
  };

  const handleCloseInternal = async () => {
    tracking.flushSession();
    await prefs.flushPrefsWrite();
    scheduleMotivationNudgeIfNeeded().catch(() => {});
    handleClose();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isFullscreen ? "#000" : colors.background },
      ]}
    >
      <PdfOpenIntroOverlay
        visible={introVisible}
        ready={pdfReady}
        title={`Opening “${name}”`}
        subtitle="Preparing pages…"
        coverUri={null}
        onHidden={() => setIntroVisible(false)}
      />

      {!isFullscreen && (
        <ReaderHeaderBar
          name={name}
          scrollMode={prefs.scrollMode}
          onToggleScrollMode={toggleScrollMode}
          cropLabel={cropLabel}
          onCycleCrop={cycleCrop}
          onZoomMinus={handleAminus}
          onZoomPlus={handleAplus}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenMenu={onPressMenu}
          onEnterFullscreen={() => setIsFullscreen(true)}
          onClose={handleCloseInternal}
        />
      )}

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

      {/* ✅ crossfade PDF */}
      <Animated.View style={{ flex: 1, opacity: pdfOpacity }}>
        <PdfViewport
          pdfRef={pdfRef}
          source={source}
          initialPage={initialPage}
          backgroundColor={isFullscreen ? "#000" : colors.background}
          horizontal={pdfHorizontal}
          enablePaging={pdfEnablePaging}
          onLoadComplete={onLoadCompleteInternal}
          onError={(e) => console.log("PDF error:", e)}
          onPageChanged={handlePageChangedInternal}
          onLayoutSize={(w, h) => setViewerSize({ w, h })}
          translateX={cropTransform.tx * userScale}
          translateY={cropTransform.ty * userScale}
          scale={visualScale}
          onDoubleTap={handleDoubleTapZoom}
        />
      </Animated.View>

      <ReaderBadges
        currentPage={currentPage}
        totalPages={totalPages}
        zoomHintVisible={zoomHintVisible}
        zoomPercent={zoomPercent}
        cropLabel={cropLabel}
        timeLeftLabel={timeLeftLabel}
        isFullscreen={isFullscreen}
      />

      {prefs.prefsReady &&
        !isFullscreen &&
        typeof totalPages === "number" &&
        totalPages > 1 && (
          <FloatingPageStrip
            mode={prefs.stripMode}
            minimized={prefs.stripMinimized}
            hidden={prefs.stripHidden}
            initialPos={prefs.stripPos}
            onPosChange={(p) => {
              prefs.setStripPos(p);
              prefs.savePrefsDebounced({ pos: p });
            }}
            onToggleMinimized={() => {
              prefs.setStripMinimized((v) => {
                const nv = !v;
                prefs.savePrefsDebounced({ minimized: nv });
                return nv;
              });
            }}
            onToggleHidden={() => {
              prefs.setStripHidden((v) => {
                const nv = !v;
                prefs.savePrefsDebounced({ hidden: nv });
                return nv;
              });
            }}
            onToggleMode={() => {
              prefs.setStripMode((m) => {
                const nm: StripMode =
                  m === "vertical" ? "horizontal" : "vertical";
                prefs.savePrefsDebounced({ mode: nm });
                return nm;
              });
            }}
          >
            <PageStrip
              totalPages={totalPages}
              currentPage={currentPage}
              onPressPage={onPressPageThumb}
              orientation={
                prefs.stripMode === "vertical" ? "vertical" : "horizontal"
              }
              maxVisibleChips={prefs.stripMinimized ? 3 : undefined}
            />
          </FloatingPageStrip>
        )}

      <ReaderSettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        scrollMode={prefs.scrollMode}
        setScrollMode={(m) => {
          tracking.flushSession();
          tracking.pauseTrackingForNextTick();
          prefs.setScrollMode(m);
          prefs.savePrefsDebounced({ scrollMode: m });
        }}
        zoomPresetIndex={prefs.zoomPresetIndex}
        setZoomPresetIndex={(i) => applyZoomIndex(i)}
        cropKey={prefs.cropKey}
        setCropKey={(k) => {
          prefs.setCropKey(k);
          prefs.savePrefsDebounced({ cropKey: k });
        }}
        onPersist={(patch) => prefs.savePrefsDebounced(patch)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  fullscreenOverlay: {
    position: "absolute",
    top: spacing["2xl"],
    right: spacing.lg,
    zIndex: 10,
  },
});
