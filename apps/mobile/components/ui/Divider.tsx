import { spacing } from "@budget/ui-native";
import { View, StyleSheet } from "react-native";

export const Divider = () => {
  return <View style={styles.divider} />;
};
const styles = StyleSheet.create({
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
    marginVertical: spacing.sm,
  },
});
