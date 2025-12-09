import { MText, iconSizes, colors, spacing } from "@budget/ui-native";
import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";

type BookshelfHeaderProps = {
  handleOpenModal: () => void;
  handleOpenPlanModal: () => void;
};

export const BookshelfHeader: FC<BookshelfHeaderProps> = ({
  handleOpenModal,
  handleOpenPlanModal,
}) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <MText variant="heading1" style={styles.headerTitle}>
          Bookshelf
        </MText>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity
          onPress={handleOpenPlanModal}
          style={styles.planButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="list-outline"
            size={iconSizes.lg}
            color={colors.textPrimary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleOpenModal}
          style={styles.addButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name="add-circle-outline"
            size={iconSizes.xl}
            color={colors.success}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    padding: spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    flexShrink: 1,
  },
  planButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  addButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
});
