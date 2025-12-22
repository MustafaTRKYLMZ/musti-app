import { MText, spacing } from "@budget/ui-native";
import { FC } from "react";
import { StyleSheet, View } from "react-native";
import { CropKey, ReaderPrefs, ReadingScrollMode } from "./types";
import { IconButton } from "../AppIcon";
import { clampBetween } from "@/utils/number";
import { ZOOM_PRESETS } from "@/constants/readerPresets";

export type ReaderSettingsPanelProps = {
  open: boolean;
  onClose: () => void;

  scrollMode: ReadingScrollMode;
  setScrollMode: (m: ReadingScrollMode) => void;

  zoomPresetIndex: number;
  setZoomPresetIndex: (i: number) => void;
  cropKey: CropKey;
  setCropKey: (k: CropKey) => void;
  onPersist: (patch: Partial<ReaderPrefs>) => void;
};

export const ReaderSettingsPanel: FC<ReaderSettingsPanelProps> = ({
  open,
  onClose,
  scrollMode,
  setScrollMode,
  zoomPresetIndex,
  setZoomPresetIndex,
  onPersist,
  cropKey,
  setCropKey,
}) => {
  if (!open) return null;

  const setScroll = (m: ReadingScrollMode) => {
    setScrollMode(m);
    onPersist({ scrollMode: m });
  };

  const setZoom = (idx: number) => {
    const next = clampBetween(idx, 0, ZOOM_PRESETS.length - 1);
    setZoomPresetIndex(next);
    onPersist({ zoomPresetIndex: next });
  };

  const zoomPct = Math.round((ZOOM_PRESETS[zoomPresetIndex] ?? 1) * 100);

  return (
    <View style={panelStyles.overlay}>
      <View style={panelStyles.backdrop} onTouchEnd={onClose} />

      <View style={panelStyles.sheet}>
        <View style={panelStyles.headerRow}>
          <MText variant="heading3" color="textPrimary">
            Reading settings
          </MText>
          <IconButton name="close-outline" onPress={onClose} />
        </View>

        {/* Zoom preset */}
        <View style={panelStyles.section}>
          <MText variant="caption" color="textSecondary">
            Text size
          </MText>
          <View style={panelStyles.zoomRow}>
            <IconButton
              name="remove-outline"
              onPress={() => setZoom(zoomPresetIndex - 1)}
              accessibilityLabel="Smaller text"
            />
            <MText
              variant="body"
              color="textPrimary"
              style={{ minWidth: 72, textAlign: "center" }}
            >
              {zoomPct}%
            </MText>
            <IconButton
              name="add-outline"
              onPress={() => setZoom(zoomPresetIndex + 1)}
              accessibilityLabel="Larger text"
            />
          </View>
        </View>

        {/* Scroll mode */}
        <View style={panelStyles.section}>
          <MText variant="caption" color="textSecondary">
            Scrolling
          </MText>

          <View style={panelStyles.row}>
            <IconButton
              name={
                scrollMode === "vertical-scroll"
                  ? "radio-button-on"
                  : "radio-button-off"
              }
              onPress={() => setScroll("vertical-scroll")}
              accessibilityLabel="Vertical scrolling"
            />
            <MText variant="body" color="textPrimary">
              Vertical (continuous)
            </MText>
          </View>

          <View style={panelStyles.row}>
            <IconButton
              name={
                scrollMode === "horizontal-paged"
                  ? "radio-button-on"
                  : "radio-button-off"
              }
              onPress={() => setScroll("horizontal-paged")}
              accessibilityLabel="Horizontal paging"
            />
            <MText variant="body" color="textPrimary">
              Horizontal (paged)
            </MText>
          </View>
          {/* Crop / margin trim */}
          <View style={panelStyles.section}>
            <MText variant="caption" color="textSecondary">
              Margins
            </MText>
            <View style={panelStyles.margins}>
              <View style={panelStyles.row}>
                <IconButton
                  name={
                    cropKey === "none" ? "radio-button-on" : "radio-button-off"
                  }
                  onPress={() => {
                    setCropKey("none");
                    onPersist({ cropKey: "none" });
                  }}
                  accessibilityLabel="Margins off"
                />
                <MText variant="body" color="textPrimary">
                  Off
                </MText>
              </View>

              <View style={panelStyles.row}>
                <IconButton
                  name={
                    cropKey === "trim" ? "radio-button-on" : "radio-button-off"
                  }
                  onPress={() => {
                    setCropKey("trim");
                    onPersist({ cropKey: "trim" });
                  }}
                  accessibilityLabel="Margins trim"
                />
                <MText variant="body" color="textPrimary">
                  Trim
                </MText>
              </View>

              <View style={panelStyles.row}>
                <IconButton
                  name={
                    cropKey === "tight" ? "radio-button-on" : "radio-button-off"
                  }
                  onPress={() => {
                    setCropKey("tight");
                    onPersist({ cropKey: "tight" });
                  }}
                  accessibilityLabel="Margins tight"
                />
                <MText variant="body" color="textPrimary">
                  Tight
                </MText>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const panelStyles = StyleSheet.create({
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: 16,
    padding: spacing.lg,
    backgroundColor: "#fff",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  section: {
    marginTop: spacing.md,
  },
  margins: {
    flexDirection: "row",
    gap: spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  zoomRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
