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
import { MText, spacing, radii, iconSizes, useTheme } from "@budget/ui-native";

import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { useReadingPlanStore } from "@/store/useReadingPlanStore";
import { BaseIcon, IconButton } from "@/components/ui/AppIcon";

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

  const theme = useTheme();
  const { colors } = theme;

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
          pagesPerDay: pages,
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
        style={[
          styles.backdrop,
          {
            backgroundColor: colors.backdropStrong,
          },
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

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
          {/* Header */}
          <View style={styles.modalHeader}>
            <MText variant="heading1" color="textPrimary">
              Reading plan
            </MText>

            <IconButton
              name="close-outline"
              size={iconSizes.lg}
              onPress={onClose}
              style={styles.closeButton}
            />
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
              style={[
                styles.textInput,
                {
                  borderColor: colors.borderSubtle,
                  color: colors.textPrimary,
                  backgroundColor: colors.surface,
                },
              ]}
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
                      isSelected && {
                        backgroundColor:
                          (colors as any).surfaceElevated || colors.surface,
                        borderRadius: radii.md,
                        paddingHorizontal: spacing.xs,
                        borderWidth: 1,
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                    activeOpacity={0.9}
                    onPress={() => handleToggleBook(book.uri)}
                  >
                    <View style={styles.bookInfo}>
                      <BaseIcon
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
                        color="textPrimary"
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
                          {
                            borderColor: colors.borderSubtle,
                            color: colors.textPrimary,
                            backgroundColor: colors.surface, // 🔥 her zaman açık zemin
                          },
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
              style={[
                styles.button,
                styles.secondaryButton,
                { borderColor: colors.borderSubtle },
              ]}
            >
              <MText variant="body" color="textPrimary">
                Cancel
              </MText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              style={[
                styles.button,
                styles.primaryButton,
                { backgroundColor: colors.primary },
              ]}
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
  },
  modalContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing["2xl"],
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
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
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
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
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    textAlign: "center",
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
  },
  primaryButton: {},
});
