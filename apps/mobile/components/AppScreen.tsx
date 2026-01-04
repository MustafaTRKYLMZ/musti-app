// components/AppScreen.tsx
import React, { ReactNode, useMemo } from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TextStyle,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  MText,
  spacing,
  radii,
  bookshelfTheme,
  budgetTheme,
} from "@musti/ui-native";
import { AppSwitcherButton } from "@/components/AppSwitcherButton";
import { HeaderMenuButton } from "@/components/ui/HeaderMenuButton";

type AppScreenVariant = "default" | "bookshelf" | "budget";

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

  safeAreaStyle?: StyleProp<ViewStyle>;
  headerContainerStyle?: StyleProp<ViewStyle>;
  headerTitleStyle?: StyleProp<TextStyle>;
  headerTitleColor?: string;
};

function getThemeByVariant(variant: AppScreenVariant) {
  switch (variant) {
    case "budget":
      return budgetTheme;
    case "bookshelf":
      return bookshelfTheme;
    case "default":
    default:
      return bookshelfTheme;
  }
}

function getHeaderBackground(variant: AppScreenVariant, colors: any) {
  if (variant === "budget") {
    return (
      colors.surface ??
      colors.card ??
      colors.backgroundSecondary ??
      colors.background
    );
  }
  return colors.background;
}

function getHeaderBorderColor(variant: AppScreenVariant, colors: any) {
  if (variant === "budget") {
    return colors.borderSubtle ?? colors.border ?? "rgba(0,0,0,0.12)";
  }
  return colors.borderSubtle;
}

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
  const theme = useMemo(() => getThemeByVariant(variant), [variant]);
  const colors = theme.colors;

  const headerBg = getHeaderBackground(variant, colors);
  const headerBorder = getHeaderBorderColor(variant, colors);

  const renderCenter = () => {
    if (headerCenter) return headerCenter;

    if (title) {
      const mergedTitleStyle = StyleSheet.flatten<TextStyle>([
        styles.title,
        headerTitleStyle,
        { color: headerTitleColor ?? colors.textPrimary },
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
    if (showMenu && onPressMenu)
      return <HeaderMenuButton onPress={onPressMenu} />;
    return null;
  };

  return (
    <SafeAreaView
      style={[styles.safe, safeAreaStyle]}
      edges={["top", "left", "right", "bottom"]}
    >
      <View
        style={[
          styles.header,
          variant === "budget" ? styles.headerBudget : null,
          {
            borderBottomColor: headerBorder,
            backgroundColor: headerBg,
          },
          headerContainerStyle,
        ]}
      >
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
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },

  headerBudget: Platform.select({
    ios: {
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
    },
    android: {
      elevation: 2,
    },
    default: {},
  }) as ViewStyle,

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
