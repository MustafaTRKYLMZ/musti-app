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
  plannerTheme,
} from "@musti/ui-native";
import { AppSwitcherButton } from "@/components/AppSwitcherButton";
import { HeaderMenuButton } from "@/components/ui/HeaderMenuButton";

type AppScreenVariant = "default" | "bookshelf" | "budget" | "planner";

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
    case "planner":
      return plannerTheme;
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

  const renderTitle = () => {
    if (!title) return null;

    const mergedTitleStyle = StyleSheet.flatten<TextStyle>([
      styles.title,
      headerTitleStyle,
      { color: headerTitleColor ?? colors.textPrimary },
    ]);

    return (
      <MText
        variant="heading2"
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={mergedTitleStyle}
      >
        {title}
      </MText>
    );
  };

  const renderCenter = () => {
    if (headerCenter) return headerCenter;
    return renderTitle();
  };

  const renderRight = () => {
    if (headerRight) return headerRight;
    if (!showSwitcher || headerLeft) return null;
    return <AppSwitcherButton />;
  };

  const renderLeft = () => {
    if (headerLeft) return headerLeft;
    if (showMenu && onPressMenu)
      return <HeaderMenuButton onPress={onPressMenu} />;
    return null;
  };

  const isPlanner = variant === "planner";
  const leftContent = renderLeft();
  const rightContent = renderRight();
  const hasCustomRight = !!headerRight;

  return (
    <SafeAreaView
      style={[
        styles.safe,
        isPlanner ? styles.safePlanner : null,
        safeAreaStyle,
      ]}
      edges={["top", "left", "right", "bottom"]}
    >
      <View
        style={[
          styles.header,
          variant === "budget" ? styles.headerBudget : null,
          isPlanner ? styles.headerPlanner : null,
          {
            borderBottomColor: headerBorder,
            backgroundColor: headerBg,
          },
          headerContainerStyle,
        ]}
      >
        {leftContent ? (
          <View
            style={variant === "planner" ? styles.plannerLeft : styles.left}
          >
            {leftContent}
          </View>
        ) : null}
        <View
          style={[
            variant === "planner" ? styles.plannerCenter : styles.center,
            !leftContent && !isPlanner ? styles.centerFlushLeft : null,
          ]}
        >
          {renderCenter()}
        </View>
        {rightContent ? (
          <View
            style={
              variant === "planner" || hasCustomRight
                ? styles.plannerRight
                : styles.right
            }
          >
            {rightContent}
          </View>
        ) : null}
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
  safePlanner: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 64,
    gap: spacing.sm,
  },
  headerPlanner: {
    borderRadius: 0,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.md,
    minHeight: 64,
    marginBottom: spacing.sm,
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
    flexShrink: 0,
    minHeight: 44,
    minWidth: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  plannerLeft: {
    flexShrink: 0,
    justifyContent: "center",
    alignItems: "flex-start",
    paddingRight: spacing.xs,
  },
  center: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
  },
  centerFlushLeft: {
    alignItems: "flex-start",
  },
  plannerCenter: {
    flex: 1,
    minWidth: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  right: {
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  plannerRight: {
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  title: {
    textAlign: "left",
    width: "100%",
    flexShrink: 1,
  },
  content: {
    flex: 1,
  },
});
