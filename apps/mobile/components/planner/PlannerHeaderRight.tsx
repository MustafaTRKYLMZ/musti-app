import { useTheme, MText, spacing } from "@musti/ui-native";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { AppSwitcherButton } from "../AppSwitcherButton";

export const PlannerHeaderRight = ({
  view,
  onToggleView,
}: {
  view: "week" | "month";
  onToggleView: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <View style={styles.hRightWrap}>
      <TouchableOpacity
        onPress={onToggleView}
        activeOpacity={0.85}
        style={[styles.pill, { borderColor: colors.borderSubtle }]}
      >
        <MText variant="caption" style={{ color: colors.textPrimary }}>
          {view === "week" ? "Month" : "Week"}
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
  switcher: {
    marginLeft: 2,
  },
  hRightWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    width: 170,
    justifyContent: "flex-end",
  },
});
