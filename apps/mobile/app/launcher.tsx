import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useRouter } from "expo-router";
import {
  MText,
  spacing,
  radii,
  iconSizes,
  shadows,
  useTheme,
  BaseIcon,
} from "@musti/ui-native";

type CardItem = {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
};

export default function LauncherScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  // ✅ responsive columns: phone=2, wide=3
  const columns = width >= 420 ? 3 : 2;
  const cardBasis = columns === 3 ? "31.5%" : "48%";

  const items: CardItem[] = useMemo(
    () => [
      {
        title: "Budget",
        description: "Track income, expenses and run simulations.",
        icon: "wallet-outline",
        onPress: () => router.push("/(tabs)/budget"),
      },
      {
        title: "Bookshelf",
        description: "Read PDFs and follow your daily reading plan.",
        icon: "book-outline",
        onPress: () => router.push("/(tabs)/bookshelf"),
      },
      {
        title: "Planner",
        description:
          "Plan your week, manage events, and sync with Google Calendar.",
        icon: "calendar-outline",
        onPress: () => router.push("/(tabs)/planner"),
      },
    ],
    [router]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <MText variant="heading1" style={styles.title}>
          Musti App
        </MText>
        <MText variant="body" color="textSecondary" style={styles.subtitle}>
          Choose an app to continue
        </MText>
      </View>

      <View style={styles.grid}>
        {items.map((it) => (
          <TouchableOpacity
            key={it.title}
            activeOpacity={0.9}
            onPress={it.onPress}
            style={[
              styles.card,
              { backgroundColor: colors.surface, flexBasis: cardBasis },
            ]}
          >
            <View style={styles.iconWrapper}>
              <BaseIcon
                family="ion"
                name={it.icon}
                size={iconSizes.xl}
                color={colors.success}
              />
            </View>

            <View style={styles.cardContent}>
              <MText
                variant="heading3"
                style={[styles.cardTitle, { color: colors.textPrimary }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {it.title}
              </MText>

              <MText
                variant="body"
                color="textSecondary"
                style={styles.cardDescription}
                numberOfLines={3}
                ellipsizeMode="tail"
              >
                {it.description}
              </MText>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing["6xl"],
    paddingHorizontal: spacing.lg,
  },
  header: {
    marginTop: spacing["2xl"],
    marginBottom: spacing["2xl"],
    alignItems: "center",
    gap: spacing.xs,
  },
  title: { marginBottom: spacing.xs },
  subtitle: { maxWidth: 280, textAlign: "center" },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
    width: "100%",
  },

  card: {
    flexGrow: 0,
    flexShrink: 0,
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.lg,
    borderRadius: radii.xl,
    shadowColor: shadows.card.shadowColor,
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    minHeight: 104,
  },

  // ✅ fixed size icon (no flex, no %)
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },

  // ✅ key fix: minWidth:0 allows text to shrink in row layouts
  cardContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },

  cardTitle: {
    marginBottom: 2,
  },

  cardDescription: {
    fontSize: 12,
    lineHeight: 16,
  },
});
