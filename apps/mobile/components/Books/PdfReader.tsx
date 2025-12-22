import React, { FC, useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet } from "react-native";
import { PdfRef } from "react-native-pdf";
import { spacing, useTheme, iconSizes } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

import {
  FloatingPageStrip,
  StripMode,
} from "@/components/Books/FloatingPageStrip";
import { PageStrip } from "../ui/pdf/PageStrip";
import { ReaderSettingsPanel } from "../ui/pdf/ReaderSettingsPanel";

import type { BookSection } from "@budget/core";
import type { CropKey, ReadingContext } from "../ui/pdf/types";

import { ZOOM_PRESETS } from "@/constants/readerPresets";
import { useCropTransform } from "@/hooks/ useCropTransform";
import { useReaderPrefs } from "@/hooks/ useReaderPrefs";
import { useReadingTracking } from "@/hooks/useReadingTracking";
import { PdfViewport } from "../ui/pdf/ PdfViewport";
import { ReaderHeaderBar } from "../ui/pdf/ ReaderHeaderBar";
import { ReaderBadges } from "../ui/pdf/ReaderBadges";

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

  readingContext?: ReadingContext;

  sections?: BookSection[];
  enableStatsTracking?: boolean;
};

const clampIndex = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

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

  // prefs (book-specific)
  const prefs = useReaderPrefs({ source, bookUri: readingContext?.bookUri });

  // crop + zoom transforms
  const { setViewerSize, userScale, visualScale, cropTransform } =
    useCropTransform(prefs.cropKey, prefs.zoomPresetIndex);

  // settings
  const [settingsOpen, setSettingsOpen] = useState(false);

  // zoom hint (badge)
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

  // tracking
  const tracking = useReadingTracking(enableStatsTracking, readingContext);

  // reset tracking baselines when doc/initial changes
  useEffect(() => {
    tracking.resetBaselines(Math.max(1, Math.floor(initialPage ?? 1)));
  }, [initialPage, prefs.storageKey, tracking]);

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

  const handleDoubleTapZoom = useCallback(() => {
    const next = prefs.zoomPresetIndex >= 5 ? 0 : prefs.zoomPresetIndex + 1;
    applyZoomIndex(next);
  }, [prefs.zoomPresetIndex, applyZoomIndex]);

  const toggleScrollMode = useCallback(() => {
    tracking.flushSession();
    tracking.pauseTrackingForNextTick();

    prefs.setScrollMode((m) => {
      const nm =
        m === "vertical-scroll" ? "horizontal-paged" : "vertical-scroll";
      prefs.savePrefsDebounced({ scrollMode: nm });
      return nm;
    });
  }, [prefs, tracking]);

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
    handleClose();
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isFullscreen ? "#000" : colors.background },
      ]}
    >
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

      <PdfViewport
        pdfRef={pdfRef}
        source={source}
        initialPage={initialPage}
        backgroundColor={isFullscreen ? "#000" : colors.background}
        horizontal={pdfHorizontal}
        enablePaging={pdfEnablePaging}
        onLoadComplete={handleLoadComplete}
        onError={(e) => console.log("PDF error:", e)}
        onPageChanged={handlePageChangedInternal}
        onLayoutSize={(w, h) => setViewerSize({ w, h })}
        translateX={cropTransform.tx * userScale}
        translateY={cropTransform.ty * userScale}
        scale={visualScale}
        onDoubleTap={handleDoubleTapZoom}
      />

      {/* ✅ Badges (page + zoom) */}
      <ReaderBadges
        currentPage={currentPage}
        totalPages={totalPages}
        zoomHintVisible={zoomHintVisible}
        zoomPercent={zoomPercent}
        cropLabel={cropLabel}
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
