import React, { FC } from "react";
import { View, StyleSheet } from "react-native";
import {
  MText,
  radii,
  spacing,
  useTheme,
  bookshelfTheme,
} from "@budget/ui-native";

const { colors: bookshelfColors } = bookshelfTheme;

type Props = {
  currentPage?: number;
  totalPages?: number;

  zoomHintVisible: boolean;
  zoomPercent: number;
  cropLabel?: string;
  isFullscreen?: boolean;
};

export const ReaderBadges: FC<Props> = ({
  currentPage,
  totalPages,
  zoomHintVisible,
  zoomPercent,
  cropLabel,
  isFullscreen = false,
}) => {
  const { colors } = useTheme();

  const showPage =
    typeof currentPage === "number" && typeof totalPages === "number";
  const showCrop = typeof cropLabel === "string" && cropLabel.length > 0;

  return (
    <>
      {/* Page badge */}
      {showPage && (
        <View style={styles.pageBadgeContainer} pointerEvents="none">
          <View
            style={[
              styles.pageBadge,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <MText variant="caption" color="textPrimary">
              {currentPage} / {totalPages}
            </MText>

            {showCrop && (
              <MText
                variant="caption"
                color="textSecondary"
                style={{ marginLeft: spacing.sm }}
              >
                • {cropLabel}
              </MText>
            )}
          </View>
        </View>
      )}

      {/* Zoom hint */}
      {zoomHintVisible && (
        <View style={styles.zoomBadge} pointerEvents="none">
          <MText variant="caption" color="textPrimary">
            {zoomPercent}%
          </MText>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  pageBadgeContainer: {
    position: "absolute",
    bottom: spacing["2xl"] + 16,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  pageBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
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
