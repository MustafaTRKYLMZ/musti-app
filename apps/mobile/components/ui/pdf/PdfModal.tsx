// apps/mobile/components/pdf/PdfModal.tsx
import React, { useState } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { MText, colors, spacing, radii } from "@budget/ui-native";
import { getPdfsDirectory } from "@/utils/getPdfsDirectory";

interface PdfModalProps {
  visible: boolean;
  onClose: () => void;
  onPdfImported?: (doc: { uri: string; name: string }) => void;
}

export const PdfModal: React.FC<PdfModalProps> = ({
  visible,
  onClose,
  onPdfImported,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handlePickPdf = async () => {
    try {
      setIsLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets[0];
      const safeName =
        asset.name?.replace(/\s+/g, "_") || `pdf-${Date.now()}.pdf`;

      const pdfDir = await getPdfsDirectory();
      const destPath = pdfDir + `${Date.now()}-${safeName}`;

      await FileSystem.copyAsync({
        from: asset.uri,
        to: destPath,
      });

      onPdfImported?.({
        uri: destPath,
        name: safeName,
      });
    } catch (e) {
      console.warn("PDF import error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalContent}>
          <MText variant="heading2" style={styles.title}>
            Add PDF
          </MText>

          <MText
            variant="body"
            color="textSecondary"
            style={styles.description}
          >
            Select a PDF from your device and save it into your bookshelf.
          </MText>

          <TouchableOpacity
            onPress={handlePickPdf}
            style={styles.primaryButton}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator />
            ) : (
              <MText
                variant="body"
                color="textInverse"
                style={styles.primaryButtonText}
              >
                Pick PDF
              </MText>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MText variant="body" color="textPrimary">
              Close
            </MText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdropStrong,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
  },
  title: {
    marginBottom: spacing.sm,
  },
  description: {
    marginBottom: spacing.lg,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    fontWeight: "600",
  },
  closeButton: {
    marginTop: spacing.lg,
    alignSelf: "flex-end",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});
