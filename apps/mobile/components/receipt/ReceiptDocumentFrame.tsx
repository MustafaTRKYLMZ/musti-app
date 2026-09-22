import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "@musti/core";
import { MText, spacing, radii } from "@musti/ui-native";

const RECEIPT_HEIGHT_RATIO = 2;
const SIDE_MARGIN_RATIO = 0.02;
const HINT_BAND_HEIGHT = 36;
const CORNER_SIZE = 32;
const CORNER_THICKNESS = 3;

type Props = {
  layoutWidth: number;
  layoutHeight: number;
  topInset?: number;
  bottomReserved?: number;
  hintText?: string;
  partLabel?: string;
};

export function ReceiptDocumentFrame({
  layoutWidth,
  layoutHeight,
  topInset = 0,
  bottomReserved = 120,
  hintText,
  partLabel,
}: Props) {
  const { t } = useTranslation();
  const hint = hintText ?? t("receipt.camera.hintPortrait");

  const frame = useMemo(() => {
    if (layoutWidth <= 0 || layoutHeight <= 0) {
      return { left: 0, top: 0, width: 0, height: 0 };
    }

    const sideMargin = layoutWidth * SIDE_MARGIN_RATIO;
    const frameWidth = layoutWidth - sideMargin * 2;

    const reservedVertical = topInset + HINT_BAND_HEIGHT + bottomReserved;
    const maxHeight = Math.max(140, layoutHeight - reservedVertical);

    const idealHeight = frameWidth * RECEIPT_HEIGHT_RATIO;
    const frameHeight = Math.min(idealHeight, maxHeight);

    const left = sideMargin;
    const frameTop =
      topInset +
      HINT_BAND_HEIGHT +
      Math.max(0, (maxHeight - frameHeight) / 2);

    return { left, top: frameTop, width: frameWidth, height: frameHeight };
  }, [layoutWidth, layoutHeight, topInset, bottomReserved]);

  const { left, top, width: frameWidth, height: frameHeight } = frame;

  if (frameWidth <= 0 || frameHeight <= 0) {
    return null;
  }

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.mask, { height: top }]} />

      <View style={[styles.hintBand, { top: topInset, height: HINT_BAND_HEIGHT }]}>
        {partLabel ? (
          <MText variant="caption" style={styles.partLabel}>
            {partLabel}
          </MText>
        ) : null}
        <MText variant="caption" style={styles.hint} numberOfLines={2}>
          {hint}
        </MText>
      </View>

      <View style={[styles.row, { top, height: frameHeight }]}>
        <View style={[styles.mask, { width: left }]} />
        <View
          style={[
            styles.frameHole,
            { width: frameWidth, height: frameHeight },
          ]}
        />
        <View style={[styles.mask, { flex: 1 }]} />
      </View>
      <View style={[styles.mask, { top: top + frameHeight, bottom: 0 }]} />

      <View
        style={[
          styles.corners,
          { left, top, width: frameWidth, height: frameHeight },
        ]}
      >
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mask: {
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  row: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
  },
  hintBand: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
  },
  frameHole: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: radii.md,
  },
  corners: {
    position: "absolute",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: "#FFF",
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderTopLeftRadius: radii.md,
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderTopRightRadius: radii.md,
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
    borderBottomLeftRadius: radii.md,
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
    borderBottomRightRadius: radii.md,
  },
  partLabel: {
    color: "#FFF",
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  hint: {
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
  },
});
