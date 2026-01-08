import React, { useMemo } from "react";
import { View, Pressable, StyleSheet } from "react-native";
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
      { key: "week", label: "Week", icon: "calendar-outline" },
      { key: "month", label: "Month", icon: "grid-outline" },
      { key: "day", label: "Day", icon: "today-outline" },
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
    width: 170,
    justifyContent: "flex-end",
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
