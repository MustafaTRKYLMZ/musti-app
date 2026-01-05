import React, { FC, useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { iconSizes, radii, spacing, useTheme } from "@musti/ui-native";
import { IconButton } from "@musti/ui-native";
import type { ReaderBookNavItem } from "@/hooks/useReaderBookNav";
import { ReaderHeaderTitleToggle } from "@/components/ui/pdf/ReaderHeaderTitleToggle";
import { HeaderBookTabsBar } from "@/components/ui/pdf/HeaderBookTabsBar";

type Props = {
  name: string;
  activeUri?: string | null;

  bookItems?: ReaderBookNavItem[];
  onSelectBook?: (it: ReaderBookNavItem) => void;

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
  bookNavItems?: ReaderBookNavItem[];
};

export const ReaderHeaderBar: FC<Props> = ({
  name,
  activeUri = null,
  bookNavItems = [],
  onSelectBook,

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
  const [tabsOpen, setTabsOpen] = useState(false);

  const hasTabs = useMemo(
    () => (bookNavItems?.length ?? 0) > 1,
    [bookNavItems]
  );

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle,
          shadowColor: colors.shadowStrong,
        },
      ]}
    >
      <View style={styles.headerTopRow}>
        <View style={styles.left}>
          {hasTabs ? (
            <ReaderHeaderTitleToggle
              title={name}
              open={tabsOpen}
              onToggle={() => setTabsOpen((v) => !v)}
            />
          ) : (
            <ReaderHeaderTitleToggle
              title={name}
              open={false}
              onToggle={() => {}}
            />
          )}
        </View>

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

      {/* ✅ DROPDOWN: FULL WIDTH */}
      {hasTabs && tabsOpen && (
        <HeaderBookTabsBar
          items={bookNavItems}
          activeUri={activeUri}
          onSelect={(it) => {
            setTabsOpen(false);
            onSelectBook?.(it);
          }}
        />
      )}

      <View style={styles.controlsRow}>
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
  wrap: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    zIndex: 2,
  },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["2xl"],
    paddingBottom: spacing.sm,
  },

  left: {
    flex: 1,
    paddingRight: spacing.md,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  iconButton: {
    marginLeft: spacing.sm,
  },

  controlsRow: {
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
    minWidth: 44,
    height: 28,
  },
});
