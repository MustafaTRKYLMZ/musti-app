import { MText, sizes, spacing, useTheme } from "@musti/ui-native";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { HeaderPill } from "./HeaderPill";

export const PlannerHeaderCenter = ({
  label,
  onPressToday,
}: {
  label: string;
  onPressToday: () => void;
}) => {
  const { colors } = useTheme();
  return (
    <View style={styles.hCenter}>
      <HeaderPill label={"Today"} onPress={onPressToday} />
      <MText
        variant="caption"
        style={[styles.hSub, { color: colors.textSecondary }]}
      >
        {label}
      </MText>
    </View>
  );
};

const styles = StyleSheet.create({
  hCenter: {
    flex: 2,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },

  hSub: {
    fontSize: sizes.lg,
    lineHeight: sizes.lg + 2,
    marginTop: 1,
    opacity: 0.9,
  },
});
