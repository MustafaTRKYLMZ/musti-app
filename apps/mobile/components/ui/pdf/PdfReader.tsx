import React, { FC, useState, useRef, useEffect, useMemo } from "react";
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

type StripPrefs = {
  mode: StripMode;
  minimized: boolean;
  hidden: boolean;
  pos?: StripPos;
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

  // ✅ Strip prefs (persist)
  const [stripMode, setStripMode] = useState<StripMode>("vertical");
  const [stripMinimized, setStripMinimized] = useState(false);
  const [stripHidden, setStripHidden] = useState(false);
  const [stripPos, setStripPos] = useState<StripPos | undefined>(undefined);
  const [stripPrefsReady, setStripPrefsReady] = useState(false);

  const zoomPercent = Math.round(scale * 100);

  const scheduleHideZoomHint = () => {
    if (hideZoomTimeoutRef.current) clearTimeout(hideZoomTimeoutRef.current);
    hideZoomTimeoutRef.current = setTimeout(() => {
      setZoomHintVisible(false);
    }, 1200);
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

  const handlePressPageThumb = (page: number) => {
    if (!pdfRef?.current) return;
    if (page <= 0) return;
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
        if (alive) setStripPrefsReady(true); // ✅ kritik
      }
    })();

    return () => {
      alive = false;
    };
  }, [storageKey]);

  useEffect(() => {
    return () => {
      if (hideZoomTimeoutRef.current) clearTimeout(hideZoomTimeoutRef.current);
    };
  }, []);

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
                onPress={handleClose}
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
          onPageChanged={handlePageChanged}
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
