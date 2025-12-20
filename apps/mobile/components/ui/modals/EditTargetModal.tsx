import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MText, spacing, radii, iconSizes, useTheme } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";
import {
  useReadingTargetsStore,
  type TargetType,
} from "@/store/bookshelf/useReadingTargetsStore";
import { useBookSectionsStore } from "@/store/bookshelf/useBookSectionsStore";
import {
  MSelectBottomSheet,
  type MSelectItemBase,
} from "@/components/ui/MSelectBottomSheet";
import { TargetItemsList } from "@/components/Books/TargetItemsList";
import { useToast } from "@/components/ui/ToastProvider";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";

type Props = {
  visible: boolean;
  targetId: string | null;
  onClose: () => void;
  onOpenChapters: (bookUri: string, bookName: string) => void;
};

type SectionPick = {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
};

const clampInt = (n: any) => {
  const v = Math.floor(Number(n) || 0);
  return Math.max(0, Math.min(999999, v));
};

function Chip({
  text,
  active,
  onPress,
}: {
  text: string;
  active?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: colors.borderSubtle, backgroundColor: colors.surface },
        active && { backgroundColor: colors.surfaceElevated },
      ]}
    >
      <MText
        numberOfLines={1}
        style={{ fontWeight: "800", opacity: active ? 1 : 0.75 }}
      >
        {text}
      </MText>
    </Pressable>
  );
}

export function EditTargetModal({
  visible,
  targetId,
  onClose,
  onOpenChapters,
}: Props) {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const targets = useReadingTargetsStore((s) => s.targets);
  const addItem = useReadingTargetsStore((s) => s.addItem);
  const deleteItem = useReadingTargetsStore((s) => s.deleteItem);

  const updateTargetTitle = useReadingTargetsStore((s) => s.updateTargetTitle);

  const getResolvedSections = useBookSectionsStore(
    (s) => (s as any).getResolvedSections
  );

  const progressItems = useBooksStore((s) => s.items);

  const target = useMemo(() => {
    if (!targetId) return null;
    return targets.find((t) => t.id === targetId) ?? null;
  }, [targets, targetId]);

  // --- local UI state ---
  const [title, setTitle] = useState("");
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [type, setType] = useState<TargetType>("section");
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );
  const [startPageInput, setStartPageInput] = useState<string>("");
  const [endPageInput, setEndPageInput] = useState<string>("");

  const availableBooks = useMemo(() => {
    const map = new Map<string, { uri: string; name: string }>();

    // 1) target items
    for (const it of target?.items ?? []) {
      if (it?.bookUri)
        map.set(it.bookUri, { uri: it.bookUri, name: it.bookName ?? "" });
    }

    // 2) progress store
    for (const uri of Object.keys(progressItems ?? {})) {
      const p = (progressItems as any)[uri];
      if (!p?.uri) continue;
      map.set(p.uri, {
        uri: p.uri,
        name: p.name ?? map.get(p.uri)?.name ?? "",
      });
    }

    return Array.from(map.values())
      .filter((b) => !!b.uri && !!b.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [target?.items, progressItems]);

  const bookItems = useMemo<MSelectItemBase[]>(
    () => availableBooks.map((b) => ({ id: b.uri, label: b.name })),
    [availableBooks]
  );

  const selectedBook = useMemo(() => {
    if (!selectedBookId) return null;
    return availableBooks.find((b) => b.uri === selectedBookId) ?? null;
  }, [availableBooks, selectedBookId]);

  useEffect(() => {
    if (!visible) return;
    if (!target) return;

    setTitle(target.title);

    const firstBookUri = target.items?.[0]?.bookUri ?? null;
    setSelectedBookId(firstBookUri);

    setType("section");
    setSelectedSectionId(null);
    setStartPageInput("");
    setEndPageInput("");
  }, [visible, target]);

  useEffect(() => {
    setSelectedSectionId(null);
    setStartPageInput("");
    setEndPageInput("");
  }, [selectedBookId, type]);

  // sections
  const resolvedSections = useMemo<SectionPick[]>(() => {
    if (!selectedBookId) return [];
    if (!getResolvedSections) return [];

    const secs = getResolvedSections(selectedBookId, null) ?? [];
    return secs
      .map((s: any) => ({
        id: String(s.id),
        title: String(s.title ?? "Untitled"),
        startPage: Math.max(1, clampInt(s.startPage ?? 1) || 1),
        endPage: Math.max(1, clampInt(s.endPage ?? 1) || 1),
      }))
      .filter((s: any) => s.endPage >= s.startPage);
  }, [getResolvedSections, selectedBookId]);

  const sectionItems = useMemo<MSelectItemBase[]>(
    () =>
      resolvedSections.map((s) => ({
        id: `sec:${s.id}`,
        label: s.title,
        subLabel: `${s.startPage}–${s.endPage}`,
      })),
    [resolvedSections]
  );

  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null;
    const rawId = selectedSectionId.replace("sec:", "");
    return resolvedSections.find((s) => String(s.id) === rawId) ?? null;
  }, [selectedSectionId, resolvedSections]);

  const pagesStart = Math.max(1, clampInt(startPageInput) || 0);
  const pagesEnd = Math.max(1, clampInt(endPageInput) || 0);

  const canAddItem = useMemo(() => {
    if (!targetId) return false;
    if (!selectedBook) return false;

    if (type === "section") return !!selectedSection;
    return pagesStart > 0 && pagesEnd > 0 && pagesEnd >= pagesStart;
  }, [targetId, selectedBook, type, selectedSection, pagesStart, pagesEnd]);

  const addSelectedItem = async () => {
    if (!targetId || !selectedBook) return;

    if (type === "section") {
      if (!selectedSection) {
        showToast({ message: "Select a section first.", duration: 2500 });
        return;
      }

      const jumpPage = Math.max(1, selectedSection.startPage);
      const endPage = Math.max(jumpPage, selectedSection.endPage);

      try {
        await addItem(targetId, {
          bookUri: selectedBook.uri,
          bookName: selectedBook.name,
          type: "section",
          startPage: jumpPage,
          endPage,
          labelId: `sec:${selectedSection.id}`,
          label: selectedSection.title,
          jumpPage,
        });

        showToast({ message: "Item added.", duration: 1800 });
        setSelectedSectionId(null);
      } catch {
        showToast({ message: "Failed to add item.", duration: 3500 });
      }
      return;
    }

    // pages
    if (!(pagesEnd >= pagesStart)) {
      showToast({
        message: "End page must be greater than or equal to start page.",
        duration: 3500,
      });
      return;
    }

    try {
      await addItem(targetId, {
        bookUri: selectedBook.uri,
        bookName: selectedBook.name,
        type: "pages",
        startPage: pagesStart,
        endPage: pagesEnd,
        labelId: `pages:${pagesStart}-${pagesEnd}`,
        label: `${pagesStart} → ${pagesEnd}`,
        jumpPage: pagesStart,
      });

      showToast({ message: "Item added.", duration: 1800 });
      setStartPageInput("");
      setEndPageInput("");
    } catch {
      showToast({ message: "Failed to add item.", duration: 3500 });
    }
  };

  const handleSave = async () => {
    try {
      if (
        target &&
        updateTargetTitle &&
        title.trim() &&
        title.trim() !== target.title
      ) {
        await updateTargetTitle(target.id, title.trim());
      }
    } catch {
      showToast({ message: "Failed to update title.", duration: 3500 });
    }

    onClose();
    showToast({ message: "Target saved.", duration: 2000 });
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[styles.backdrop, { backgroundColor: colors.backdropStrong }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ justifyContent: "flex-end" }}
        >
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <MText variant="heading3">Edit Target</MText>
              <IconButton
                name="close"
                size={iconSizes.lg}
                color={colors.textPrimary}
                onPress={onClose}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              keyboardShouldPersistTaps="handled"
            >
              <MText style={styles.sectionTitle}>Title</MText>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Target title"
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.titleInput,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surface,
                    color: colors.textPrimary,
                  },
                ]}
              />

              <View style={{ marginTop: spacing.md }}>
                <MSelectBottomSheet
                  label="Book"
                  placeholder="Select a book…"
                  valueId={selectedBookId}
                  items={bookItems}
                  onChange={(it) => setSelectedBookId(it.id)}
                  searchable
                  searchPlaceholder="Search book…"
                />
              </View>

              {selectedBook ? (
                <>
                  <MText style={styles.sectionTitle}>Type</MText>
                  <View style={styles.chipsRow}>
                    <Chip
                      text="Section"
                      active={type === "section"}
                      onPress={() => setType("section")}
                    />
                    <Chip
                      text="Pages"
                      active={type === "pages"}
                      onPress={() => setType("pages")}
                    />
                  </View>

                  {type === "section" ? (
                    sectionItems.length > 0 ? (
                      <View style={{ marginTop: spacing.md }}>
                        <MSelectBottomSheet
                          label="Section"
                          placeholder="Select a section…"
                          valueId={selectedSectionId}
                          items={sectionItems}
                          onChange={(it) => setSelectedSectionId(it.id)}
                          searchable
                          searchPlaceholder="Search section…"
                        />
                      </View>
                    ) : (
                      <View style={{ marginTop: spacing.md }}>
                        <MText style={{ opacity: 0.7 }}>
                          No sections found for this book.
                        </MText>

                        <Pressable
                          onPress={() =>
                            onOpenChapters(selectedBook.uri, selectedBook.name)
                          }
                          style={[
                            styles.smallBtn,
                            {
                              borderColor: colors.borderSubtle,
                              backgroundColor: colors.surface,
                              marginTop: spacing.sm,
                            },
                          ]}
                        >
                          <MText style={{ fontWeight: "800" }}>
                            Open chapters
                          </MText>
                        </Pressable>
                      </View>
                    )
                  ) : (
                    <>
                      <MText style={styles.sectionTitle}>Pages</MText>

                      <View style={styles.pagesRow}>
                        <View style={{ flex: 1 }}>
                          <MText style={styles.pagesLabel}>Start page</MText>
                          <TextInput
                            value={startPageInput}
                            onChangeText={(t) =>
                              setStartPageInput(t.replace(/[^\d]/g, ""))
                            }
                            keyboardType="number-pad"
                            placeholder="e.g. 10"
                            placeholderTextColor={colors.textSecondary}
                            style={[
                              styles.pageInput,
                              {
                                borderColor: colors.borderSubtle,
                                backgroundColor: colors.surface,
                                color: colors.textPrimary,
                              },
                            ]}
                          />
                        </View>

                        <View style={{ width: spacing.sm }} />

                        <View style={{ flex: 1 }}>
                          <MText style={styles.pagesLabel}>End page</MText>
                          <TextInput
                            value={endPageInput}
                            onChangeText={(t) =>
                              setEndPageInput(t.replace(/[^\d]/g, ""))
                            }
                            keyboardType="number-pad"
                            placeholder="e.g. 30"
                            placeholderTextColor={colors.textSecondary}
                            style={[
                              styles.pageInput,
                              {
                                borderColor: colors.borderSubtle,
                                backgroundColor: colors.surface,
                                color: colors.textPrimary,
                              },
                            ]}
                          />
                        </View>
                      </View>
                    </>
                  )}

                  <Pressable
                    onPress={addSelectedItem}
                    disabled={!canAddItem}
                    style={[
                      styles.cta,
                      {
                        borderColor: colors.borderSubtle,
                        backgroundColor: colors.surface,
                        opacity: canAddItem ? 1 : 0.5,
                      },
                    ]}
                  >
                    <MText style={{ fontWeight: "900" }}>Add item</MText>
                  </Pressable>
                </>
              ) : null}

              {target?.items?.length ? (
                <TargetItemsList
                  items={target.items}
                  onDeleteItem={(itemId) => {
                    if (!targetId) return;
                    deleteItem(targetId, itemId);
                    showToast({ message: "Item removed.", duration: 1800 });
                  }}
                />
              ) : null}
            </ScrollView>

            <Pressable
              onPress={handleSave}
              disabled={!targetId}
              style={[
                styles.finish,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceElevated,
                  opacity: targetId ? 1 : 0.5,
                },
              ]}
            >
              <MText style={{ fontWeight: "900" }}>Save & Close</MText>
            </Pressable>
          </View>

          <View style={{ height: spacing["2xl"] }} />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    fontWeight: "800",
    opacity: 0.85,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
  },
  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  pagesRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: spacing.xs,
  },
  pagesLabel: { fontWeight: "800", opacity: 0.85, marginBottom: spacing.xs },
  pageInput: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  smallBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  cta: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  finish: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
