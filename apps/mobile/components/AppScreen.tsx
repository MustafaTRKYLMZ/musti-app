// components/AppScreen.tsx
import React, { ReactNode } from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MText, spacing, radii, bookshelfTheme } from "@budget/ui-native";
import { AppSwitcherButton } from "@/components/AppSwitcherButton";
import { HeaderMenuButton } from "@/components/ui/HeaderMenuButton";

type AppScreenVariant = "default" | "bookshelf" | "budget";
const { colors } = bookshelfTheme;

type AppScreenProps = {
  title?: string;
  children: ReactNode;
  headerLeft?: ReactNode;
  headerCenter?: ReactNode;
  headerRight?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  onPressMenu?: () => void;
  showMenu?: boolean;
  showSwitcher?: boolean;
  variant?: AppScreenVariant;

  // style overrides from parent
  safeAreaStyle?: StyleProp<ViewStyle>;
  headerContainerStyle?: StyleProp<ViewStyle>;
  headerTitleStyle?: StyleProp<TextStyle>;
  headerTitleColor?: string; // direct color value (e.g. bookshelfTheme.colors.textPrimary)
};

export function AppScreen({
  title,
  children,
  headerCenter,
  headerRight,
  headerLeft,
  contentStyle,
  onPressMenu,
  showMenu = true,
  showSwitcher = true,
  variant = "default",
  safeAreaStyle,
  headerContainerStyle,
  headerTitleStyle,
  headerTitleColor,
}: AppScreenProps) {
  const renderCenter = () => {
    if (headerCenter) return headerCenter;

    if (title) {
      const mergedTitleStyle = StyleSheet.flatten<TextStyle>([
        styles.title,
        headerTitleStyle,
        headerTitleColor ? { color: headerTitleColor } : null,
      ]);

      return (
        <MText variant="heading2" numberOfLines={1} style={mergedTitleStyle}>
          {title}
        </MText>
      );
    }

    return null;
  };

  const renderRight = () => {
    if (headerRight) return headerRight;
    if (!showSwitcher) return null;

    return <AppSwitcherButton />;
  };

  const renderLeft = () => {
    if (headerLeft) return headerLeft;

    if (showMenu && onPressMenu) {
      return <HeaderMenuButton onPress={onPressMenu} />;
    }

    return null;
  };

  return (
    <SafeAreaView
      style={[styles.safe, safeAreaStyle]}
      edges={["top", "left", "right", "bottom"]}
    >
      <View style={[styles.header, headerContainerStyle]}>
        <View style={styles.left}>{renderLeft()}</View>
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
    padding: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
  },
  left: {
    width: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  center: {
    flex: 1,
    justifyContent: "center",
  },
  right: {
    width: 66,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  title: {
    textAlign: "left",
  },
  content: {
    flex: 1,
  },
});
