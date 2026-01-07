import { useTheme, MText, spacing } from "@musti/ui-native";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { AppSwitcherButton } from "../AppSwitcherButton";
import { useCalendarUiStore } from "@/store/calendar/useCalendarUiStore";

export const PlannerHeaderRight = () => {
  const { colors } = useTheme();
  const view = useCalendarUiStore((s) => s.view);
  const setView = useCalendarUiStore((s) => s.setView);

  return (
    <View style={styles.hRightWrap}>
      <TouchableOpacity
        onPress={() => setView(view === "week" ? "month" : "week")}
        activeOpacity={0.85}
        style={[styles.pill, { borderColor: colors.borderSubtle }]}
      >
        <MText variant="caption" style={{ color: colors.textPrimary }}>
          {view === "week" ? "Week" : "Month"}
        </MText>
      </TouchableOpacity>

      <View style={styles.switcher}>
        <AppSwitcherButton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  switcher: { marginLeft: 2 },
  hRightWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    width: 170,
    justifyContent: "flex-end",
  },
});
