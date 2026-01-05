import React from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "@musti/core";
import { MText, colors, spacing, radii } from "@musti/ui-native";
import { BaseIcon, IconButton } from "@musti/ui-native/src/components/AppIcon";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function SidebarMenu({ open, onClose }: Props) {
  const { t } = useTranslation();

  if (!open) return null;

  const go = (path: string) => {
    onClose();
    router.push(path as any);
  };

  return (
    <View style={styles.sidebarOverlay}>
      {/* Panel */}
      <View style={styles.sidebarPanel}>
        <View style={styles.sidebarHeaderRow}>
          <MText variant="heading3" color="textPrimary">
            Menu
          </MText>

          <IconButton
            name="close"
            color={colors.textSecondary}
            size={22}
            onPress={onClose}
            style={styles.sidebarCloseButton}
          />
        </View>

        {/* MONEY */}
        <MText
          variant="caption"
          color="textSecondary"
          style={styles.sectionLabel}
        >
          {t("money")}
        </MText>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/(tabs)/budget")}
        >
          <BaseIcon
            name="wallet-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("transactions")}
          </MText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/coming-soon")}
        >
          <BaseIcon
            name="repeat-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("fixed_expenses")}
          </MText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/(tabs)/budget/simulation")}
        >
          <BaseIcon
            name="flask-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("simulation.title")}
          </MText>
        </TouchableOpacity>

        {/* GROCERIES */}
        <MText
          variant="caption"
          color="textSecondary"
          style={styles.sectionLabel}
        >
          {t("grocies")} & {t("products")}
        </MText>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/coming-soon")}
        >
          <BaseIcon
            name="storefront-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("markets")}
          </MText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/coming-soon")}
        >
          <BaseIcon
            name="cube-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("products")}
          </MText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/coming-soon")}
        >
          <BaseIcon
            name="list-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("shopping_list")}
          </MText>
        </TouchableOpacity>

        {/* INSIGHTS */}
        <MText
          variant="caption"
          color="textSecondary"
          style={styles.sectionLabel}
        >
          {t("insights")}
        </MText>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/coming-soon")}
        >
          <BaseIcon
            name="analytics-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("analytics")} / {t("reports")}
          </MText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/coming-soon")}
        >
          <BaseIcon
            name="pricetags-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("price_history")}
          </MText>
        </TouchableOpacity>

        {/* SYSTEM */}
        <MText
          variant="caption"
          color="textSecondary"
          style={styles.sectionLabel}
        >
          {t("data")} & {t("system")}
        </MText>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/coming-soon")}
        >
          <BaseIcon
            name="cloudy-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("sync")}
          </MText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/coming-soon")}
        >
          <BaseIcon
            name="download-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("import")} / {t("export")}
          </MText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/(tabs)/budget/settings")}
        >
          <BaseIcon
            name="settings-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("settings.title")}
          </MText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sidebarItem}
          onPress={() => go("/about")}
        >
          <BaseIcon
            name="information-circle-outline"
            size={22}
            color={colors.textPrimary}
            style={styles.sidebarItemIcon}
          />
          <MText variant="body" color="textPrimary">
            {t("about")}
          </MText>
        </TouchableOpacity>
      </View>

      {/* Backdrop */}
      <TouchableOpacity
        style={styles.sidebarBackdrop}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Close sidebar"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 40,
  },
  sidebarPanel: {
    width: 260,
    backgroundColor: colors.surfaceStrong,
    paddingHorizontal: spacing.md,
    paddingTop: spacing["3xl"],
    paddingBottom: spacing.lg,
    borderRightWidth: 1,
    borderRightColor: colors.borderSubtle,
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: colors.backdropStrong,
  },
  sidebarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  sidebarCloseButton: {
    padding: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sectionLabel: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  sidebarItemIcon: {
    marginRight: spacing.sm,
  },
});
