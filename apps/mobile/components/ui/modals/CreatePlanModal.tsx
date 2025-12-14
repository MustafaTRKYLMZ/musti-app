import React, { useEffect, useState, useMemo } from "react";
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
import { useReadingPlanStore } from "@/store/bookshelf/useReadingPlanStore";
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

  const [selectedBookUri, setSelectedBookUri] = useState<string | null>(null);
  const [bookPickerOpen, setBookPickerOpen] = useState(false);

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
      setBookPickerOpen(false);
      setSelectedBookUri(books[0]?.uri ?? null);
    }
  }, [visible, books]);

  const availableBooks = useMemo(
    () => books.filter((b) => !selected[b.uri]),
    [books, selected]
  );

  const selectedBook = useMemo(
    () => availableBooks.find((b) => b.uri === selectedBookUri) ?? null,
    [availableBooks, selectedBookUri]
  );

  useEffect(() => {
    if (!availableBooks.length) {
      setSelectedBookUri(null);
      return;
    }

    if (
      !selectedBookUri ||
      !availableBooks.some((b) => b.uri === selectedBookUri)
    ) {
      setSelectedBookUri(availableBooks[0].uri);
    }
  }, [availableBooks, selectedBookUri]);

  const handleChangePages = (uri: string, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setEntries((prev) => ({
      ...prev,
      [uri]: cleaned,
    }));
  };

  const handleAddOrUpdateSelected = () => {
    if (!selectedBookUri) {
      Alert.alert("No book selected", "Please select a book first.");
      return;
    }

    const raw = entries[selectedBookUri];
    const pages = raw ? parseInt(raw, 10) : 0;

    if (!pages || pages <= 0) {
      Alert.alert("Invalid pages", "Please enter a positive page amount.");
      return;
    }

    setSelected((prev) => ({
      ...prev,
      [selectedBookUri]: true,
    }));
  };

  const handleRemoveBook = (uri: string) => {
    setSelected((prev) => ({
      ...prev,
      [uri]: false,
    }));
  };

  const applyQuickPlanAll = (pagesPerDay: number) => {
    if (books.length === 0) return;

    const nextSelected: SelectionState = {};
    const nextEntries: PlanEntryState = {};

    books.forEach((b) => {
      nextSelected[b.uri] = true;
      nextEntries[b.uri] = String(pagesPerDay);
    });

    setSelected(nextSelected);
    setEntries(nextEntries);
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
      Alert.alert("Empty plan", "Please add at least one book with pages.");
      return;
    }

    const finalName = planName.trim() || "Reading plan";

    setActivePlan({
      name: finalName,
      items,
    });

    onClose();
  };

  const selectedBooks = books.filter((b) => selected[b.uri]);

  const currentPagesValue =
    selectedBookUri && entries[selectedBookUri] ? entries[selectedBookUri] : "";

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
                  backgroundColor: colors.surfaceElevated ?? colors.surface,
                },
              ]}
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          {/* Quick actions */}
          <View style={styles.quickRow}>
            <MText variant="body" color="textSecondary">
              Quick plan
            </MText>
            <View style={styles.quickButtons}>
              <TouchableOpacity
                style={[
                  styles.quickButton,
                  { borderColor: colors.borderSubtle },
                ]}
                onPress={() => applyQuickPlanAll(5)}
              >
                <MText variant="body" color="textPrimary">
                  Use all (5 pages/day)
                </MText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Book select + input + plus */}
          <MText
            variant="body"
            color="textSecondary"
            style={styles.sectionLabel}
          >
            Add book to plan
          </MText>

          <View style={styles.selectRow}>
            {/* Select field */}
            <View style={styles.selectColumn}>
              <MText variant="body" color="textSecondary">
                Book
              </MText>
              <TouchableOpacity
                style={[
                  styles.bookSelectField,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surfaceElevated ?? colors.surface,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (!availableBooks.length) return;
                  setBookPickerOpen((prev) => !prev);
                }}
              >
                <MText
                  variant="body"
                  color={selectedBook ? "textPrimary" : "textSecondary"}
                  numberOfLines={1}
                >
                  {selectedBook
                    ? selectedBook.name
                    : availableBooks.length
                    ? "Select book"
                    : "All books are in the plan"}
                </MText>

                {availableBooks.length > 0 && (
                  <BaseIcon
                    family="ion"
                    name={bookPickerOpen ? "chevron-up" : "chevron-down"}
                    size={iconSizes.md}
                  />
                )}
              </TouchableOpacity>
            </View>

            {/* Pages input + plus */}
            <View style={styles.selectRight}>
              <View style={styles.pagesInputWrapper}>
                <TextInput
                  value={currentPagesValue}
                  onChangeText={(text) => {
                    if (!selectedBookUri) return;
                    handleChangePages(selectedBookUri, text);
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  style={[
                    styles.pagesInput,
                    {
                      borderColor: colors.borderSubtle,
                      color: colors.textPrimary,
                      backgroundColor:
                        (colors as any).surfaceElevated || colors.surface,
                    },
                  ]}
                  placeholderTextColor={colors.textSecondary}
                  editable={!!selectedBookUri}
                />
                <MText
                  variant="body"
                  color="textSecondary"
                  style={styles.pagesSuffix}
                >
                  pages
                </MText>
              </View>

              <IconButton
                name="add-circle-outline"
                size={iconSizes.lg}
                onPress={handleAddOrUpdateSelected}
                style={styles.addButton}
              />
            </View>
          </View>

          {/* Dropdown list */}
          {bookPickerOpen && availableBooks.length > 0 && (
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.surface, // 🔹 her zaman açık yüzey
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <ScrollView
                style={styles.dropdownList}
                contentContainerStyle={styles.dropdownContent}
                keyboardShouldPersistTaps="handled"
              >
                {availableBooks.map((book) => {
                  const isActive = book.uri === selectedBookUri;
                  return (
                    <TouchableOpacity
                      key={book.uri}
                      style={[
                        styles.dropdownItem,
                        isActive && {
                          backgroundColor:
                            (colors as any).surfaceStrong || colors.surface,
                        },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSelectedBookUri(book.uri);
                        setBookPickerOpen(false);
                      }}
                    >
                      <MText
                        variant="body"
                        color="textPrimary"
                        numberOfLines={1}
                      >
                        {book.name}
                      </MText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Selected books list */}
          {selectedBooks.length > 0 && (
            <View style={styles.selectedSection}>
              <MText
                variant="body"
                color="textSecondary"
                style={styles.sectionLabel}
              >
                Selected books
              </MText>

              {selectedBooks.map((book) => {
                const pagesValue = entries[book.uri] ?? "";

                return (
                  <View key={book.uri} style={styles.selectedRow}>
                    <View style={styles.selectedInfo}>
                      <MText
                        variant="body"
                        color="textPrimary"
                        numberOfLines={1}
                      >
                        {book.name}
                      </MText>
                    </View>

                    <View style={styles.selectedControls}>
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
                              backgroundColor:
                                colors.surfaceElevated ?? colors.surface,
                            },
                          ]}
                          placeholderTextColor={colors.textSecondary}
                        />
                        <MText
                          variant="body"
                          color="textSecondary"
                          style={styles.pagesSuffix}
                        >
                          pages
                        </MText>
                      </View>

                      <IconButton
                        name="trash-outline"
                        size={iconSizes.md}
                        onPress={() => handleRemoveBook(book.uri)}
                        style={styles.removeButton}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          )}

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
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  quickButtons: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  quickButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  sectionLabel: {
    marginBottom: spacing.xs,
  },

  selectRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  selectColumn: {
    flex: 1.4,
  },
  bookSelectField: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectRight: {
    flex: 1.2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },

  pagesInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  pagesInput: {
    width: 70,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs / 2,
    textAlign: "center",
  },
  pagesSuffix: {
    marginLeft: spacing.xs,
  },
  addButton: {
    marginLeft: spacing.sm,
  },

  dropdown: {
    maxHeight: 200,
    borderRadius: radii.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownContent: {
    paddingVertical: spacing.xs,
  },
  dropdownItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },

  selectedSection: {
    marginTop: spacing.md,
  },
  selectedRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  selectedInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  selectedControls: {
    flexDirection: "row",
    alignItems: "center",
  },
  removeButton: {
    marginLeft: spacing.sm,
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
