import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { bookshelfTheme, MText, spacing, radii } from "@budget/ui-native";

import { saveTextBook } from "@/utils/textBooksStorage";
import { TextBook } from "@budget/core";

type Props = {
  visible: boolean;
  onClose: () => void;
  onCreated?: (book: TextBook) => void;
};

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function getConvertUrl() {
  const path = "/bookshelf/textbooks/convert";

  if (Platform.OS === "android") {
    return `http://10.0.2.2:3001${path}`;
  }

  return `http://localhost:3001${path}`;
}

export function AddTextBookModal({ visible, onClose, onCreated }: Props) {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  const canPick = useMemo(() => visible && !busy, [visible, busy]);

  async function pickPdf() {
    if (!canPick) return;

    const res = await DocumentPicker.getDocumentAsync({
      type: "application/pdf",
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (res.canceled) return;

    const asset = res.assets?.[0];
    if (!asset?.uri) return;

    const title =
      (asset.name?.replace(/\.pdf$/i, "") || "Untitled").trim() || "Untitled";

    const id = uid();
    const url = getConvertUrl();

    try {
      setBusy(true);
      setStatus("Uploading...");

      const uploadRes = await FileSystem.uploadAsync(url, asset.uri, {
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        fieldName: "file",
        parameters: { title, id },
      });

      if (uploadRes.status !== 200) {
        const body = String(uploadRes.body ?? "");
        throw new Error(
          `Server error: ${uploadRes.status}${
            body ? ` - ${body.slice(0, 200)}` : ""
          }`
        );
      }

      setStatus("Saving...");

      const parsed = JSON.parse(uploadRes.body) as TextBook;

      const book: TextBook = {
        ...parsed,
        sourcePdfUri: asset.uri,
      };

      await saveTextBook(book);

      Alert.alert("Done", "Text book created.");
      onCreated?.(book);
      onClose();
    } catch (e: any) {
      console.warn(e);
      Alert.alert("Error", e?.message ?? "Failed to create text book.");
    } finally {
      setBusy(false);
      setStatus("");
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <MText style={styles.title}>Add Text Book</MText>

            <Pressable onPress={onClose} hitSlop={12}>
              <MText style={styles.close}>✕</MText>
            </Pressable>
          </View>

          <MText color="textSecondary">
            Select a PDF. The file will be uploaded to your local API, converted
            to JSON, and saved on device.
          </MText>

          <View style={{ height: spacing.lg }} />

          <Pressable
            onPress={pickPdf}
            disabled={!canPick}
            style={({ pressed }) => [
              styles.button,
              (!canPick || pressed) && styles.buttonPressed,
            ]}
          >
            <MText style={styles.buttonText}>
              {busy ? "Working..." : "Pick PDF"}
            </MText>
          </Pressable>

          {!!status && (
            <>
              <View style={{ height: spacing.md }} />
              <MText color="textSecondary">{status}</MText>
            </>
          )}

          <View style={{ height: spacing.sm }} />
          <MText color="textSecondary" style={{ fontSize: 12 }}>
            Endpoint: {getConvertUrl()}
          </MText>
        </View>
      </View>
    </Modal>
  );
}

const { colors } = bookshelfTheme;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  title: { fontSize: 18, fontWeight: "600", color: colors.textPrimary },
  close: { fontSize: 18, color: colors.textSecondary },
  button: {
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  buttonPressed: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: "600", color: colors.textPrimary },
});
