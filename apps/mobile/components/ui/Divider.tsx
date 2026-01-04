import { spacing } from "@musti/ui-native";
import { View, StyleSheet } from "react-native";

export const Divider = () => {
  return <View style={styles.divider} />;
};
const styles = StyleSheet.create({
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: spacing.sm,
  },
});
