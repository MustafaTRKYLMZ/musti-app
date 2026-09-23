import { MText, spacing, useTheme } from "@musti/ui-native";
import { View, StyleSheet } from "react-native";

export const PlannerHeaderCenter = ({
  date,
  locale = "en",
}: {
  date: Date;
  locale?: string;
}) => {
  const { colors } = useTheme();

  const monthLabel = date
    .toLocaleDateString(locale, { month: "short" })
    .replace(".", "");
  const currentYear = new Date().getFullYear();
  const showYear = date.getFullYear() !== currentYear;

  return (
    <View style={styles.hCenter}>
      <MText
        variant="heading3"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={[styles.monthLabel, { color: colors.textPrimary }]}
      >
        {monthLabel}
        {showYear ? ` '${String(date.getFullYear()).slice(-2)}` : ""}
      </MText>
    </View>
  );
};

const styles = StyleSheet.create({
  hCenter: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  monthLabel: {
    textAlign: "center",
    textTransform: "capitalize",
  },
});
