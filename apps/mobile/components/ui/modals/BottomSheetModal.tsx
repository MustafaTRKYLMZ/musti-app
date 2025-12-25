import React, { ReactNode, useMemo } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  MText,
  spacing,
  radii,
  iconSizes,
  bookshelfTheme,
  useTheme,
} from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

type BottomSheetOwner = "budget" | "bookshelf";

type BottomSheetModalProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;

  /** default: "budget" */
  variant?: BottomSheetOwner;

  /** Optional action/content at the LEFT side of the header (e.g. Reset/Settings/Back) */
  leftAction?: ReactNode;

  /** Optional action/content at the RIGHT side (if you want to override close button) */
  rightAction?: ReactNode;
};

export function BottomSheetModal({
  visible,
  title,
  onClose,
  children,
  variant = "budget",
  leftAction,
  rightAction,
}: BottomSheetModalProps) {
  const isIOS = Platform.OS === "ios";

  // ✅ budget colors: app theme
  const theme = useTheme();
  const budgetColors = theme.colors;

  // ✅ bookshelf colors: fixed theme
  const shelfColors = bookshelfTheme.colors;

  const colors = useMemo(() => {
    return variant === "bookshelf" ? shelfColors : budgetColors;
  }, [variant, shelfColors, budgetColors]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      transparent
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
            style={[
              styles.backdrop,
              { backgroundColor: colors.backdropStrong },
            ]}
            onPress={onClose}
          />

          {/* SHEET */}
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.surfaceStrong,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View
              style={[styles.handle, { backgroundColor: colors.borderSubtle }]}
            />

            <View style={styles.headerRow}>
              {/* LEFT */}
              <View style={styles.leftSlot}>{leftAction}</View>

              {/* TITLE */}
              <MText
                variant="heading4"
                color="textPrimary"
                style={styles.title}
                numberOfLines={1}
              >
                {title}
              </MText>

              {/* RIGHT */}
              <View style={styles.rightSlot}>
                {rightAction ?? (
                  <IconButton
                    name="close"
                    size={iconSizes.lg}
                    color={colors.danger}
                    onPress={onClose}
                    style={[
                      styles.closeButton,
                      { borderColor: colors.borderSubtle },
                    ]}
                  />
                )}
              </View>
            </View>

            {children}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, justifyContent: "flex-end" },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },

  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: 1,
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
    marginBottom: spacing.sm,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },

  leftSlot: {
    minWidth: 44,
    alignItems: "flex-start",
    justifyContent: "center",
  },

  title: {
    flex: 1,
    textAlign: "center",
  },

  rightSlot: {
    minWidth: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },

  closeButton: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
