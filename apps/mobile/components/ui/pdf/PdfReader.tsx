// apps/mobile/components/ui/pdf/PdfReader.tsx

import React, { FC, useState, useRef, useEffect } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import Pdf, { PdfRef } from "react-native-pdf";
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

const { colors: bookshelfColors } = bookshelfTheme;

type PdfReaderProps = {
  isFullscreen: boolean;
  name: string;
  setIsFullscreen: (value: boolean) => void;
  handleClose: () => void;
  source: { uri: string } | number;
  initialPage: number;
  handleLoadComplete: (numberOfPages: number, filePath: string) => void;
  handlePageChanged: (page: number, numberOfPages: number) => void;
  pdfRef?: React.RefObject<PdfRef | null>;
  onPressMenu?: () => void;
  currentPage?: number;
  totalPages?: number;
};

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
}) => {
  const theme = useTheme();
  const { colors } = theme;

  const [scale, setScale] = useState(1);
  const [zoomHintVisible, setZoomHintVisible] = useState(false);
  const hideZoomTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zoomPercent = Math.round(scale * 100);

  const scheduleHideZoomHint = () => {
    if (hideZoomTimeoutRef.current) {
      clearTimeout(hideZoomTimeoutRef.current);
    }
    hideZoomTimeoutRef.current = setTimeout(() => {
      setZoomHintVisible(false);
    }, 1200);
  };

  const showZoomHint = () => {
    setZoomHintVisible(true);
    scheduleHideZoomHint();
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(1, Number((prev - 0.2).toFixed(2)));
      return next;
    });
    showZoomHint();
  };

  const handleZoomIn = () => {
    setScale((prev) => {
      const next = Math.min(5, Number((prev + 0.2).toFixed(2)));
      return next;
    });
    showZoomHint();
  };

  const handleInternalScaleChanged = (newScale: number) => {
    setScale(newScale);
    showZoomHint();
  };

  const handlePressPageThumb = (page: number) => {
    if (!pdfRef?.current) return;
    if (page <= 0) return;
    pdfRef.current.setPage(page);
  };

  useEffect(() => {
    return () => {
      if (hideZoomTimeoutRef.current) {
        clearTimeout(hideZoomTimeoutRef.current);
      }
    };
  }, []);

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
              />
              <IconButton
                name="close-outline"
                size={iconSizes.xl}
                onPress={handleClose}
                style={styles.iconButton}
              />
            </View>
          </View>

          {/* Zoom + menu bar  */}
          <View style={styles.menuButton}>
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
          onPageChanged={handlePageChanged}
          onScaleChanged={(newScale: number) =>
            handleInternalScaleChanged(newScale)
          }
        />
      </View>

      {/* Page badge */}
      {typeof currentPage === "number" && typeof totalPages === "number" && (
        <View style={styles.pageBadge}>
          <MText variant="caption" color="textInverse">
            {currentPage} / {totalPages}
          </MText>
        </View>
      )}

      {/* Zoom hint –*/}
      {zoomHintVisible && (
        <View style={styles.zoomBadge}>
          <MText variant="caption" color="textPrimary">
            {zoomPercent}%
          </MText>
        </View>
      )}

      {/* Page strip  */}
      {typeof totalPages === "number" && totalPages > 1 && (
        <View style={styles.pageStripWrapper} pointerEvents="box-none">
          <PageStrip
            totalPages={totalPages}
            currentPage={currentPage}
            onPressPage={handlePressPageThumb}
          />
        </View>
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
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },

  menuButton: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    backgroundColor: bookshelfColors.surface,
    gap: spacing.sm,
  },

  pageBadge: {
    position: "absolute",
    left: "50%",
    bottom: spacing.lg,
    transform: [{ translateX: -25 }],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: bookshelfColors.background,
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

  pageStripWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: spacing.lg * 3,
    paddingHorizontal: spacing.md,
  },
  pageStripContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  pageStripContent: {
    paddingHorizontal: spacing.xs,
    alignItems: "center",
  },
});
