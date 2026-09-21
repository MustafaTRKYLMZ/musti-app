import React, { useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { router } from "expo-router";
import {
  useTheme,
  MText,
  spacing,
  ThemeColors,
  BaseIcon,
  DropdownMenu,
  DropdownOption,
} from "@musti/ui-native";
import { AppSwitcherButton } from "../AppSwitcherButton";
import { CalendarView } from "@/store/calendar/useCalendarUiStore";
import { useCalendar } from "@/hooks/useCalendar";

export const PlannerHeaderRight = () => {
  const { colors } = useTheme();
  const { view, setView } = useCalendar();

  const surface =
    (colors as ThemeColors).surface ??
    (colors as ThemeColors).backgroundSecondary ??
    colors.background;

  const options = useMemo<DropdownOption<CalendarView>[]>(
    () => [
      { key: "day", label: "Day", icon: "today-outline" },
      { key: "week", label: "Week", icon: "grid-outline" },
      { key: "month", label: "Month", icon: "calendar-outline" },
    ],
    []
  );

  return (
    <View style={styles.hRightWrap}>
      <DropdownMenu<CalendarView>
        value={view}
        options={options}
        onChange={(v) => setView(v)}
        width={190}
        align="right"
        renderTrigger={({ open, label }) => (
          <Pressable
            onPress={open}
            hitSlop={8}
            style={[
              styles.selectBtn,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: surface,
              },
            ]}
          >
            <MText variant="caption" style={{ color: colors.textPrimary }}>
              {label}
            </MText>

            <BaseIcon
              name="chevron-down-outline"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      />

      <Pressable
        onPress={() => router.push("/(tabs)/planner/settings")}
        hitSlop={8}
        style={[
          styles.iconBtn,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: surface,
          },
        ]}
      >
        <BaseIcon
          name="settings-outline"
          size={18}
          color={colors.textPrimary}
        />
      </Pressable>

      <View style={styles.switcher}>
        <AppSwitcherButton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  hRightWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    width: 210,
    justifyContent: "flex-end",
  },

  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 96,
    justifyContent: "center",
  },

  switcher: {
    marginLeft: 2,
  },
});
