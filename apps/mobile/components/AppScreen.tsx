// components/AppScreen.tsx
import React, { ReactNode } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MText, colors, spacing, radii } from "@budget/ui-native";
import { AppSwitcherButton } from "@/components/AppSwitcherButton";

type AppScreenProps = {
  title?: string;
  showBack?: boolean;
  children: ReactNode;
  headerLeft?: ReactNode;
  headerCenter?: ReactNode;
  headerRight?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
};

export function AppScreen({
  title,
  children,
  headerCenter,
  headerRight,
  contentStyle,
}: AppScreenProps) {
  const renderCenter = () => {
    if (headerCenter) return headerCenter;

    if (title) {
      return (
        <MText variant="heading2" numberOfLines={1} style={styles.title}>
          {title}
        </MText>
      );
    }

    return null;
  };

  const renderRight = () => {
    if (headerRight) return headerRight;

    // default: app switcher
    return <AppSwitcherButton />;
  };

  return (
    <SafeAreaView
      style={styles.safe}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={styles.header}>
        <View style={styles.center}>{renderCenter()}</View>
        <View style={styles.right}>{renderRight()}</View>
      </View>

      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.sm,
  },

  center: {
    flex: 1,
    alignItems: "flex-start",
    justifyContent: "flex-start",
  },
  right: {
    width: 66,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  title: {
    textAlign: "center",
  },
  content: {
    flex: 1,
  },
  floatingSwitcher: {
    position: "absolute",
    top: spacing["2xl"],
    right: spacing.lg,
    zIndex: 20,
  },
});
