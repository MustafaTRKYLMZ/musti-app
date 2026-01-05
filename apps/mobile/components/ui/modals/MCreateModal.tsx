import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  ScrollViewProps,
} from "react-native";
import { MText, spacing, radii, iconSizes, useTheme } from "@musti/ui-native";
import { IconButton } from "@musti/ui-native";

type MCreateModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  sheetStyle?: ViewStyle;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  heightPct?: number;
};

export const MCreateModal = ({
  visible,
  onClose,
  title,
  headerRight,
  children,
  footer,
  sheetStyle,
  contentContainerStyle,
  heightPct = 86,
}: MCreateModalProps) => {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.backdrop, { backgroundColor: colors.backdropStrong }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        {/* tap outside */}
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.sheet,
            {
              height: `${heightPct}%`,
              backgroundColor: colors.surface,
              borderTopColor: colors.borderSubtle,
              shadowColor: colors.shadowStrong,
            },
            sheetStyle,
          ]}
        >
          {/* header */}
          <View style={styles.header}>
            <MText variant="heading1" color="textPrimary" numberOfLines={1}>
              {title}
            </MText>

            <View style={styles.headerRight}>
              {headerRight}
              <IconButton
                name="close-outline"
                size={iconSizes.lg}
                onPress={onClose}
                style={{ padding: spacing.xs }}
              />
            </View>
          </View>

          {/* content */}
          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={[
              { paddingBottom: spacing["3xl"] ?? spacing.xl },
              contentContainerStyle,
            ]}
          >
            {children}
          </ScrollView>

          {/* footer */}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  footer: {
    marginTop: spacing.md,
  },
});
