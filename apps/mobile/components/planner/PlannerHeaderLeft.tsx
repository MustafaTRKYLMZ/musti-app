import React, { useState } from "react";
import { router } from "expo-router";
import { useTranslation } from "@musti/core";
import { MText, spacing, useTheme } from "@musti/ui-native";
import { View, StyleSheet } from "react-native";
import { PlannerMoreMenu } from "./PlannerMoreMenu";
import { useCalendar } from "@/hooks/useCalendar";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";

type Props = {
  weekNumber: number;
  onPressToday?: () => void;
  onSync?: () => void;
  isSyncing?: boolean;
};

export const PlannerHeaderLeft = ({
  weekNumber,
  onPressToday,
  onSync,
  isSyncing = false,
}: Props) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { view, setView } = useCalendar();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <View style={styles.hLeft}>
      <HeaderIconButton
        icon="menu-outline"
        variant="plain"
        accessibilityLabel={t("planner.header.menu")}
        onPress={() => setMenuOpen(true)}
      />

      <MText
        variant="heading3"
        ellipsizeMode="clip"
        style={[styles.weekLabel, { color: colors.textPrimary }]}
      >
        W{weekNumber}
      </MText>

      {onPressToday ? (
        <HeaderIconButton
          icon="today-outline"
          accessibilityLabel={t("planner.header.today")}
          onPress={onPressToday}
        />
      ) : null}

      <PlannerMoreMenu
        visible={menuOpen}
        isSyncing={isSyncing}
        view={view}
        onClose={() => setMenuOpen(false)}
        onSync={() => onSync?.()}
        onSettings={() => router.push("/(tabs)/planner/settings")}
        onChangeView={setView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  hLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    justifyContent: "flex-start",
  },
  weekLabel: {
    lineHeight: 22,
    flexShrink: 0,
    marginHorizontal: spacing.sm,
  },
});
