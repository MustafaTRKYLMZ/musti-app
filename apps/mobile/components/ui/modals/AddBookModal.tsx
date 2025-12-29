import React from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { MText, spacing, radii, useTheme } from "@budget/ui-native";

import { useImportPdfController } from "@/components/Books/controllers/useImportPdfController";

type Props = {
  visible: boolean;
  onClose: () => void;
  onBookImported?: (doc: { uri: string; name: string }) => void;
};

export const AddBookModal: React.FC<Props> = ({
  visible,
  onClose,
  onBookImported,
}) => {
  const { colors } = useTheme();

  const c = useImportPdfController({
    onImported: (doc) => {
      onBookImported?.(doc);
      onClose();
    },
    onError: (e) => {
      console.warn("PDF import error:", e);
    },
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={[styles.backdrop, { backgroundColor: colors.backdropStrong }]}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.borderSubtle,
              shadowColor: colors.shadowStrong,
            },
          ]}
        >
          <MText variant="heading2" color="textPrimary" style={styles.title}>
            Add book
          </MText>

          <MText
            variant="body"
            color="textSecondary"
            style={styles.description}
          >
            Select a PDF from your device and save it into your bookshelf.
          </MText>

          <TouchableOpacity
            onPress={c.pickAndImport}
            style={[
              styles.primaryButton,
              {
                backgroundColor: colors.primary,
                opacity: c.isLoading ? 0.8 : 1,
              },
            ]}
            disabled={c.isLoading}
          >
            {c.isLoading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <MText
                variant="bodyStrong"
                color="textInverse"
                style={styles.primaryButtonText}
              >
                Pick PDF
              </MText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onClose}
            style={styles.closeButton}
            disabled={c.isLoading}
          >
            <MText
              variant="body"
              color="textPrimary"
              style={{ opacity: c.isLoading ? 0.6 : 1 }}
            >
              Close
            </MText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  modalContent: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    marginBottom: spacing["6xl"],
  },
  title: { marginBottom: spacing.sm },
  description: { marginBottom: spacing.lg },
  primaryButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { fontWeight: "600" },
  closeButton: {
    marginTop: spacing.lg,
    alignSelf: "flex-end",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
