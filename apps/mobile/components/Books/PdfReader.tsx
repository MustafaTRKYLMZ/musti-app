import React, {
  FC,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import { View, StyleSheet } from "react-native";
import type { PdfRef } from "react-native-pdf";
import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system/legacy";

import { spacing, useTheme, iconSizes } from "@musti/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

import { ReaderBadges } from "@/components/ui/pdf/ReaderBadges";
import { ReaderSettingsPanel } from "@/components/ui/pdf/ReaderSettingsPanel";
import {
  FloatingPageStrip,
  StripMode,
} from "@/components/Books/FloatingPageStrip";
import { PageStrip } from "@/components/ui/pdf/PageStrip";

import type { BookSection, ReadingMode } from "@musti/core";
import type { CropKey } from "@/components/ui/pdf/types";

import { ZOOM_PRESETS } from "@/constants/readerPresets";
import { useReadingPace } from "@/hooks/useReadingPace";
import { useReadingTracking } from "@/hooks/useReadingTracking";
import { formatDurationShort } from "@/utils/formatDuration";
import { clampBetween } from "@/utils/number";
import { scheduleMotivationNudgeIfNeeded } from "@/utils/motivation";
import { PdfOpenIntroOverlay } from "../ui/pdf/PdfOpenIntroOverlay";

import { ensureCoversDir, getCoverPathForPdfUri } from "@/hooks/pdfCoverCache";
import { useCropTransform } from "@/hooks/ useCropTransform";
import { useReaderPrefs } from "@/hooks/ useReaderPrefs";
import { PdfViewport } from "../ui/pdf/ PdfViewport";
import { ReaderHeaderBar } from "../ui/pdf/ ReaderHeaderBar";
import { useReaderBookNav } from "@/hooks/useReaderBookNav";

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

const coverJobLock = new Set<string>();

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

  const [introVisible, setIntroVisible] = useState(true);
  const [pdfReady, setPdfReady] = useState(false);

  const pdfCaptureRef = useRef<View | null>(null);

  const bookUriForCover = useMemo(() => {
    const u =
      readingContext?.bookUri ??
      (typeof source === "object" ? source.uri : null);
    return typeof u === "string" ? u : null;
  }, [readingContext?.bookUri, source]);

  const tryCaptureCover = useCallback(async () => {
    try {
      const pdfUri = bookUriForCover;
      if (!pdfUri) return;
      if (!pdfUri.startsWith("file://")) return;

      // only once per pdf
      if (coverJobLock.has(pdfUri)) return;
      coverJobLock.add(pdfUri);

      await ensureCoversDir();
      const dest = getCoverPathForPdfUri(pdfUri);

      const info = await FileSystem.getInfoAsync(dest);
      if (info.exists) {
        coverJobLock.delete(pdfUri);
        return;
      }

      // wait a couple frames so the PDF view is actually painted
      await new Promise<void>((res) => requestAnimationFrame(() => res()));
      await new Promise<void>((res) => requestAnimationFrame(() => res()));

      if (!pdfCaptureRef.current) {
        coverJobLock.delete(pdfUri);
        return;
      }

      const tmpUri = await captureRef(pdfCaptureRef, {
        format: "jpg",
        quality: 0.82,
        result: "tmpfile",
      });

      if (!tmpUri) {
        coverJobLock.delete(pdfUri);
        return;
      }

      await FileSystem.copyAsync({ from: tmpUri, to: dest }).catch(
        async (copyErr) => {
          console.warn(
            "PdfReader: copyAsync failed while saving cover, falling back to moveAsync",
            copyErr
          );
          await FileSystem.moveAsync({ from: tmpUri, to: dest }).catch(
            (moveErr) => {
              console.error(
                "PdfReader: moveAsync fallback also failed while saving cover",
                moveErr
              );
            }
          );
        }
      );

      coverJobLock.delete(pdfUri);
    } catch (e) {
      console.log("tryCaptureCover error:", e);
      if (bookUriForCover) coverJobLock.delete(bookUriForCover);
    }
  }, [bookUriForCover]);

  const onLoadComplete = useCallback(
    (n: number, fp?: string) => {
      handleLoadComplete(n, fp);
      setPdfReady(true);
      void tryCaptureCover();
    },
    [handleLoadComplete, tryCaptureCover]
  );

  useEffect(() => {
    setIntroVisible(true);
    setPdfReady(false);
  }, [prefs.storageKey]);

  const paceKey =
    readingContext?.bookUri ??
    (typeof source === "object" ? source.uri : String(source));

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
    return formatDurationShort(minutes * 60_000);
  }, [timeLeftRemainingPages, currentPage, totalPages, pace.ppm]);

  const { setViewerSize, userScale, visualScale, cropTransform } =
    useCropTransform(prefs.cropKey, prefs.zoomPresetIndex);

  // settings
  const [settingsOpen, setSettingsOpen] = useState(false);

  // zoom hint
  const [zoomHintVisible, setZoomHintVisible] = useState(false);
  const hideZoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showZoomHint = useCallback(() => {
    setZoomHintVisible(true);
    if (hideZoomTimeoutRef.current) clearTimeout(hideZoomTimeoutRef.current);
    hideZoomTimeoutRef.current = setTimeout(
      () => setZoomHintVisible(false),
      1200
    );
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

  // ✅ tracking (pace sampling burada)
  const tracking = useReadingTracking(enableStatsTracking, readingContext, {
    onPaceSample: (s) => {
      pace.addSample(s.pagesRead, s.msSpent);
    },
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

  // zoom actions
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
  const activeBookUri = useMemo(() => {
    const u =
      readingContext?.bookUri ??
      (typeof source === "object" ? source.uri : null);
    return typeof u === "string" ? u : null;
  }, [readingContext?.bookUri, source]);

  const bookNav = useReaderBookNav({
    activeUri: activeBookUri,
    sort: "recent",
    limit: 30,
    enabled: !isFullscreen,
  });

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
        totalPages={totalPages}
        title={`Opening “${name}”`}
        subtitle="Preparing pages…"
        coverUri={null}
        onHidden={() => setIntroVisible(false)}
      />

      {!isFullscreen && (
        <ReaderHeaderBar
          name={name}
          bookNavItems={bookNav.items}
          activeUri={activeBookUri}
          onSelectBook={bookNav.openBook}
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

      <PdfViewport
        pdfRef={pdfRef}
        captureRef={pdfCaptureRef}
        source={source}
        initialPage={initialPage}
        backgroundColor={isFullscreen ? "#000" : colors.background}
        horizontal={pdfHorizontal}
        enablePaging={pdfEnablePaging}
        onLoadComplete={onLoadComplete}
        onError={(e) => console.log("PDF error:", e)}
        onPageChanged={handlePageChangedInternal}
        onLayoutSize={(w, h) => setViewerSize({ w, h })}
        translateX={cropTransform.tx * userScale}
        translateY={cropTransform.ty * userScale}
        scale={visualScale}
        onDoubleTap={handleDoubleTapZoom}
      />

      <ReaderBadges
        currentPage={currentPage}
        totalPages={totalPages}
        zoomHintVisible={zoomHintVisible}
        zoomPercent={zoomPercent}
        cropLabel={cropLabel}
        timeLeftLabel={timeLeftLabel}
        isFullscreen={isFullscreen}
      />

      {/* Strip */}
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
