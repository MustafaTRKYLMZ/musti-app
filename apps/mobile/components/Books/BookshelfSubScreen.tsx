import React, { ReactNode } from "react";
import {
  ScrollView,
  StyleProp,
  View,
  ViewStyle,
  StyleSheet,
} from "react-native";
import { router } from "expo-router";
import { IconButton, useTheme } from "@musti/ui-native";
import { AppScreen } from "@/components/AppScreen";
import { bookshelfScreenStyles } from "./bookshelfScreenStyles";

type Props = {
  title: string;
  children: ReactNode;
  headerRight?: ReactNode;
  fallbackRoute?: string;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  showSwitcher?: boolean;
};

export function BookshelfSubScreen({
  title,
  children,
  headerRight,
  fallbackRoute = "/(tabs)/bookshelf",
  scroll = true,
  contentContainerStyle,
  showSwitcher = false,
}: Props) {
  const { colors } = useTheme();

  const onBack = () => {
    if (router.canGoBack?.()) router.back();
    else router.replace(fallbackRoute as any);
  };

  const body = scroll ? (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        bookshelfScreenStyles.scrollContent,
        contentContainerStyle,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[bookshelfScreenStyles.content, contentContainerStyle]}>
      {children}
    </View>
  );

  return (
    <AppScreen
      variant="bookshelf"
      title={title}
      showMenu={false}
      showSwitcher={showSwitcher}
      safeAreaStyle={bookshelfScreenStyles.safe}
      headerContainerStyle={bookshelfScreenStyles.header}
      headerTitleStyle={bookshelfScreenStyles.headerTitle}
      headerTitleColor={colors.textPrimary}
      contentStyle={bookshelfScreenStyles.content}
      headerLeft={
        <IconButton
          name="chevron-back"
          onPress={onBack}
          color={colors.textPrimary}
        />
      }
      headerRight={headerRight}
    >
      {body}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
});
