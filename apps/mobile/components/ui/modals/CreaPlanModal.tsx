// apps/mobile/components/ui/modals/ReadingModal.tsx

import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MText, colors, spacing, radii, iconSizes } from "@budget/ui-native";

import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { useReadingPlanStore } from "@/store/useReadingPlanStore";

interface ReadingPlanModalProps {
  visible: boolean;
  onClose: () => void;
  books: LocalPdfFile[];
}

type PlanEntryState = {
  [uri: string]: string; // pages as string for TextInput
};

type SelectionState = {
  [uri: string]: boolean;
};

export function ReadingPlanModal({
  visible,
  onClose,
  books,
}: ReadingPlanModalProps) {
  const setActivePlan = useReadingPlanStore((s) => s.setActivePlan);

  const [planName, setPlanName] = useState("Reading plan");
  const [entries, setEntries] = useState<PlanEntryState>({});
  const [selected, setSelected] = useState<SelectionState>({});

  useEffect(() => {
    if (visible) {
      const initialEntries: PlanEntryState = {};
      const initialSelected: SelectionState = {};
      books.forEach((b) => {
        initialEntries[b.uri] = "";
        initialSelected[b.uri] = false;
      });
      setEntries(initialEntries);
      setSelected(initialSelected);
      setPlanName("Reading plan");
    }
  }, [visible, books]);

  const handleToggleBook = (uri: string) => {
    setSelected((prev) => ({
      ...prev,
      [uri]: !prev[uri],
    }));
  };

  const handleChangePages = (uri: string, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setEntries((prev) => ({
      ...prev,
      [uri]: cleaned,
    }));
  };

  const handleSave = () => {
    const items = books
      .map((b) => {
        const isSelected = selected[b.uri];
        if (!isSelected) return null;

        const raw = entries[b.uri];
        const pages = raw ? parseInt(raw, 10) : 0;
        if (!pages || pages <= 0) return null;

        return {
          bookUri: b.uri,
          bookName: b.name,
          pagesPerDay: pages, // daily target
        };
      })
      .filter(Boolean) as {
      bookUri: string;
      bookName: string;
      pagesPerDay: number;
    }[];

    if (items.length === 0) {
      Alert.alert(
        "Empty plan",
        "Please select at least one book and enter pages."
      );
      return;
    }

    const finalName = planName.trim() || "Reading plan";

    setActivePlan({
      name: finalName,
      items,
    });

    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <MText variant="heading1" color="textPrimary">
              Reading plan
            </MText>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons
                name="close-outline"
                size={iconSizes.lg}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>

          {/* Plan name */}
          <View style={styles.field}>
            <MText variant="body" color="textSecondary">
              Plan name
            </MText>
            <TextInput
              value={planName}
              onChangeText={setPlanName}
              placeholder="Reading plan"
              style={styles.textInput}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Books list */}
          <MText
            variant="body"
            color="textSecondary"
            style={styles.sectionLabel}
          >
            Select books and pages to read
          </MText>

          <ScrollView
            style={styles.booksList}
            contentContainerStyle={styles.booksListContent}
            keyboardShouldPersistTaps="handled"
          >
            {books.length === 0 ? (
              <MText variant="body" color="textSecondary">
                No books available. Add a book first.
              </MText>
            ) : (
              books.map((book) => {
                const isSelected = selected[book.uri] ?? false;
                const pagesValue = entries[book.uri] ?? "";

                return (
                  <TouchableOpacity
                    key={book.uri}
                    style={[
                      styles.bookRow,
                      isSelected && styles.bookRowSelected,
                    ]}
                    activeOpacity={0.9}
                    onPress={() => handleToggleBook(book.uri)}
                  >
                    <View style={styles.bookInfo}>
                      <Ionicons
                        name={
                          isSelected ? "checkbox-outline" : "square-outline"
                        }
                        size={iconSizes.md}
                        color={
                          isSelected ? colors.primary : colors.textSecondary
                        }
                      />
                      <MText
                        variant="body"
                        style={styles.bookTitle}
                        numberOfLines={2}
                      >
                        {book.name}
                      </MText>
                    </View>

                    <View style={styles.pagesInputWrapper}>
                      <TextInput
                        value={pagesValue}
                        onChangeText={(text) =>
                          handleChangePages(book.uri, text)
                        }
                        keyboardType="numeric"
                        placeholder="0"
                        style={[
                          styles.pagesInput,
                          !isSelected && styles.pagesInputDisabled,
                        ]}
                        placeholderTextColor={colors.textSecondary}
                        editable={isSelected}
                      />
                      <MText
                        variant="body"
                        color="textSecondary"
                        style={styles.pagesSuffix}
                      >
                        pages
                      </MText>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.button, styles.secondaryButton]}
            >
              <MText variant="body" color="textPrimary">
                Cancel
              </MText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[styles.button, styles.primaryButton]}
            >
              <MText variant="body" color="textInverse">
                Save plan
              </MText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdropTouchable: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalContent: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  closeButton: {
    padding: spacing.xs,
  },
  field: {
    marginBottom: spacing.md,
  },
  textInput: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },
  booksList: {
    maxHeight: 260,
  },
  booksListContent: {
    paddingBottom: spacing.md,
  },
  bookRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  bookRowSelected: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
  },
  bookInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: spacing.sm,
  },
  bookTitle: {
    marginLeft: spacing.sm,
    flexShrink: 1,
  },
  pagesInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  pagesInput: {
    width: 60,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    textAlign: "center",
    color: colors.textPrimary,
  },
  pagesInputDisabled: {
    opacity: 0.4,
  },
  pagesSuffix: {
    marginLeft: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
});
