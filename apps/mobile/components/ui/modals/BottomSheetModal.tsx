// apps/mobile/components/ui/BottomSheetModal.tsx
import React, { ReactNode } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MText, colors, spacing, radii, iconSizes } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

type BottomSheetModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export function BottomSheetModal({
  visible,
  title,
  onClose,
  children,
}: BottomSheetModalProps) {
  const isIOS = Platform.OS === "ios";

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={isIOS ? "padding" : undefined}
        keyboardVerticalOffset={isIOS ? 40 : 0}
      >
        <View style={styles.container}>
          {/* BACKDROP */}
          <TouchableOpacity
            activeOpacity={1}
            style={styles.backdrop}
            onPress={onClose}
          />

          {/* SHEET */}
          <View style={styles.sheet}>
            <View style={styles.handle} />

            <View style={styles.headerRow}>
              <MText
                variant="heading4"
                color="textPrimary"
                style={styles.title}
              >
                {title}
              </MText>

              <IconButton
                name="close"
                size={iconSizes.lg}
                color={colors.danger}
                onPress={onClose}
                style={styles.closeButton}
              />
            </View>

            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backdropStrong,
  },

  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.surfaceStrong,
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    maxHeight: "80%",
  },

  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: radii.full,
    backgroundColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },

  title: {
    flex: 1,
  },

  closeButton: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
});
