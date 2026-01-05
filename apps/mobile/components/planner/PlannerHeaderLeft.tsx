import { MText, useTheme } from "@musti/ui-native";
import { View, StyleSheet } from "react-native";

export const PlannerHeaderLeft = ({ weekNumber }: { weekNumber: number }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.hLeft}>
      <MText
        variant="heading3"
        ellipsizeMode="clip"
        style={[styles.hTitle, { color: colors.textPrimary }]}
      >
        W {weekNumber}
      </MText>
    </View>
  );
};

const styles = StyleSheet.create({
  hLeft: {
    flex: 1,
    minWidth: 92,
    alignItems: "center",
    justifyContent: "center",
  },
  hTitle: {
    lineHeight: 22,
    flexShrink: 1,
  },
});
