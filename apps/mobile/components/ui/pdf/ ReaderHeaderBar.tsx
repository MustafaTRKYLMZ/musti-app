import React, { FC } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { MText, iconSizes, radii, spacing, useTheme } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

type Props = {
  name: string;

  scrollMode: "horizontal-paged" | "vertical-scroll";
  onToggleScrollMode: () => void;

  cropLabel: string;
  onCycleCrop: () => void;

  onZoomMinus: () => void;
  onZoomPlus: () => void;

  onOpenSettings: () => void;
  onOpenMenu?: () => void;

  onEnterFullscreen: () => void;
  onClose: () => void;
};

export const ReaderHeaderBar: FC<Props> = ({
  name,
  scrollMode,
  onToggleScrollMode,
  cropLabel,
  onCycleCrop,
  onZoomMinus,
  onZoomPlus,
  onOpenSettings,
  onOpenMenu,
  onEnterFullscreen,
  onClose,
}) => {
  const { colors } = useTheme();

  return (
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
            paddingTop: spacing["2xl"],
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
            onPress={onEnterFullscreen}
            style={styles.iconButton}
            accessibilityLabel="Enter fullscreen"
          />
          <IconButton
            name="close-outline"
            size={iconSizes.xl}
            onPress={onClose}
            style={styles.iconButton}
            accessibilityLabel="Close reader"
          />
        </View>
      </View>

      <View style={[styles.menuButton, { backgroundColor: colors.surface }]}>
        <IconButton
          name="remove-outline"
          onPress={onZoomMinus}
          accessibilityLabel="Smaller text"
        />
        <IconButton
          name="add-outline"
          onPress={onZoomPlus}
          accessibilityLabel="Larger text"
        />

        <IconButton
          name={
            scrollMode === "vertical-scroll"
              ? "swap-vertical"
              : "swap-horizontal"
          }
          onPress={onToggleScrollMode}
          accessibilityLabel={
            scrollMode === "vertical-scroll"
              ? "Switch to horizontal paging"
              : "Switch to vertical scrolling"
          }
        />

        <IconButton
          name="crop-outline"
          onPress={onCycleCrop}
          accessibilityLabel={`Trim margins: ${cropLabel}`}
        />

        <Pressable
          onPress={onCycleCrop}
          style={[
            styles.badge,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
          accessibilityLabel="Toggle margin trim"
        >
          <MText variant="caption" color="textSecondary">
            {cropLabel}
          </MText>
        </Pressable>

        <IconButton
          name="options-outline"
          onPress={onOpenSettings}
          accessibilityLabel="Reader settings"
        />

        {onOpenMenu && (
          <IconButton
            name="menu"
            onPress={onOpenMenu}
            accessibilityLabel="Open chapters"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
  },
  title: { flex: 1, marginRight: spacing.md },
  headerActions: { flexDirection: "row", alignItems: "center" },
  iconButton: { marginLeft: spacing.sm },

  menuButton: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
