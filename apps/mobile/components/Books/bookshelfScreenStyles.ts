import { StyleSheet } from "react-native";
import { bookshelfTheme, spacing } from "@musti/ui-native";

const { colors, radii } = bookshelfTheme;

/** Shared shell for bookshelf home + sub-screens (header card on wood background). */
export const bookshelfScreenStyles = StyleSheet.create({
  safe: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  header: {
    minHeight: 64,
    paddingVertical: spacing.md,
    borderBottomWidth: 0,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: colors.shadowStrong,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerTitle: {
    fontWeight: "600",
  },
  content: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing["3xl"],
    gap: spacing.md,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  listCard: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
  },
});
