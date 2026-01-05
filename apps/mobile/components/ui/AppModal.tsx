import React, { ReactNode } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";

import { MText, colors, spacing, radii, iconSizes } from "@musti/ui-native";
import { IconButton } from "@musti/ui-native";

type AppModalProps = {
  visible: boolean;
  title?: string;
  onClose: () => void;
  children: ReactNode;
};

export function AppModal({ visible, title, onClose, children }: AppModalProps) {
  if (!visible) return null;

  return (
    <View style={styles.root} pointerEvents="box-none">
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />

      <KeyboardAvoidingView
        style={styles.centerWrapper}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.modalCard}>
          <View style={styles.headerRow}>
            <View style={styles.titleWrapper}>
              {!!title && (
                <MText variant="heading3" color="textPrimary">
                  {title}
                </MText>
              )}
            </View>
            <IconButton
              name="close"
              size={iconSizes.lg}
              color={colors.danger}
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>

          <View style={styles.body}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    elevation: 60,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backgroundBackdrop,
  },
  centerWrapper: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  titleWrapper: {
    flex: 1,
    marginRight: spacing.sm,
  },
  closeButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 1.5,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  body: {
    marginTop: spacing.xs,
  },
});
