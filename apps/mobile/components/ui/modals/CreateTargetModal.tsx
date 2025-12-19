import React, { useEffect, useMemo, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
} from "react-native";
import {
  MText,
  bookshelfTheme,
  spacing,
  radii,
  iconSizes,
} from "@budget/ui-native";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { IconButton } from "@/components/ui/AppIcon";
import {
  useReadingTargetsStore,
  type TargetType,
} from "@/store/bookshelf/useReadingTargetsStore";
import { useBookSectionsStore } from "@/store/bookshelf/useBookSectionsStore";

const { colors } = bookshelfTheme;

type Props = {
  visible: boolean;
  onClose: () => void;
  books: LocalPdfFile[];
  progressMap: Record<string, any>;
  onOpenChapters: (bookUri: string, bookName: string) => void;
  initialBookUri?: string | null;
};

type TargetLabel = {
  id: string;
  type: TargetType;
  label: string;
  endPage: number;
  jumpPage: number;
};

const clampInt = (n: any) => {
  const v = Math.floor(Number(n) || 0);
  return Math.max(0, Math.min(999999, v));
};

function Chip({
  text,
  active,
  onPress,
  full,
}: {
  text: string;
  active?: boolean;
  onPress: () => void;
  full?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        full && { alignSelf: "stretch" },
        active && styles.chipActive,
      ]}
    >
      <MText
        numberOfLines={1}
        style={[styles.chipText, active && styles.chipTextActive]}
      >
        {text}
      </MText>
    </Pressable>
  );
}

export function CreateTargetModal({
  visible,
  onClose,
  books,
  progressMap,
  onOpenChapters,
  initialBookUri,
}: Props) {
  const addTarget = useReadingTargetsStore((s) => s.addTarget);

  const getResolvedSections = useBookSectionsStore(
    (s) => s.getResolvedSections
  );

  const [query, setQuery] = useState("");
  const [selectedUri, setSelectedUri] = useState<string | null>(null);

  const [type, setType] = useState<TargetType>("section");

  // pages: quick + custom
  const [quickPages, setQuickPages] = useState<number | null>(20);
  const [customPages, setCustomPages] = useState<string>("");

  // section selection
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(
    null
  );

  const selectedBook = useMemo(
    () => books.find((b) => b.uri === selectedUri) ?? null,
    [books, selectedUri]
  );

  const startPage = useMemo(() => {
    if (!selectedUri) return 0;
    return clampInt(progressMap[selectedUri]?.lastPage ?? 0);
  }, [progressMap, selectedUri]);

  const totalPages = useMemo(() => {
    if (!selectedUri) return 0;
    return clampInt(progressMap[selectedUri]?.totalPages ?? 0);
  }, [progressMap, selectedUri]);

  // ✅ resolved sections (endPage guaranteed)
  const resolvedSections = useMemo(() => {
    if (!selectedUri) return [];
    // totalPages yoksa bile store helper 999999 gibi davranır (bizim store update’te)
    return getResolvedSections(selectedUri, totalPages || null);
  }, [getResolvedSections, selectedUri, totalPages]);

  const sectionLabels = useMemo<TargetLabel[]>(() => {
    if (!selectedBook) return [];
    return resolvedSections
      .filter((sec) => (sec.endPage ?? 0) > startPage)
      .map((sec) => ({
        id: `sec:${sec.id}`,
        type: "section",
        label: sec.title,
        endPage: sec.endPage ?? 0, // Ensure endPage is a number
        jumpPage: sec.startPage, // ✅ chapter başı
      }));
  }, [resolvedSections, selectedBook, startPage]);

  const pagesSelected = useMemo(() => {
    const custom = clampInt(parseInt(customPages, 10));
    if (custom > 0) return custom;
    if (quickPages != null) return quickPages;
    return 0;
  }, [customPages, quickPages]);

  const selectedLabel = useMemo<TargetLabel | null>(() => {
    if (!selectedBook) return null;

    if (type === "pages") {
      const p = pagesSelected;
      if (!p) return null;
      const tp = Math.max(1, totalPages || 1);
      const endPage = Math.min(tp, startPage + p);

      return {
        id: customPages ? `p:custom:${p}` : `p:${p}`,
        type: "pages",
        label: `${p} pages`,
        endPage,
        jumpPage: startPage,
      };
    }

    // section
    if (!selectedSectionId) return null;
    return sectionLabels.find((l) => l.id === selectedSectionId) ?? null;
  }, [
    selectedBook,
    type,
    pagesSelected,
    totalPages,
    startPage,
    customPages,
    selectedSectionId,
    sectionLabels,
  ]);

  const filteredBooks = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...books].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter((b) => b.name.toLowerCase().includes(q));
  }, [books, query]);

  useEffect(() => {
    if (!visible) return;
    if (!initialBookUri) return;
    setSelectedUri(initialBookUri);
  }, [visible, initialBookUri]);

  useEffect(() => {
    setSelectedSectionId(null);
    setCustomPages("");
    setQuickPages(20);
  }, [selectedUri, type]);

  const canCreate = !!selectedBook && !!selectedLabel;

  const closeAndReset = () => {
    setQuery("");
    setSelectedUri(null);
    setType("section");
    setQuickPages(20);
    setCustomPages("");
    setSelectedSectionId(null);
    onClose();
  };

  const onCreate = async () => {
    if (!selectedBook || !selectedLabel) return;

    await addTarget({
      bookUri: selectedBook.uri,
      bookName: selectedBook.name,
      type: selectedLabel.type,
      startPage,
      endPage: selectedLabel.endPage,
      labelId: selectedLabel.id,
      label: selectedLabel.label,
      jumpPage: selectedLabel.jumpPage,
    });

    closeAndReset();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={closeAndReset}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <MText variant="heading3">New Target</MText>
            <IconButton
              name="close"
              size={iconSizes.lg}
              color={colors.textPrimary}
              onPress={closeAndReset}
            />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: spacing.lg }}
          >
            <MText style={styles.sectionTitle}>Book</MText>

            <View style={styles.searchWrap}>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search book…"
                placeholderTextColor={colors.textSecondary}
                style={styles.search}
              />
              {!!query && (
                <IconButton
                  name="close-circle"
                  size={iconSizes.md}
                  color={colors.textSecondary}
                  onPress={() => setQuery("")}
                />
              )}
            </View>

            <View style={styles.bookList}>
              {filteredBooks.slice(0, 20).map((b) => {
                const active = b.uri === selectedUri;
                return (
                  <Pressable
                    key={b.uri}
                    onPress={() => setSelectedUri(b.uri)}
                    style={[styles.bookRow, active && styles.bookRowActive]}
                  >
                    <MText numberOfLines={1} style={styles.bookName}>
                      {b.name}
                    </MText>
                    {active ? (
                      <MText style={{ opacity: 0.85, fontWeight: "800" }}>
                        ✓
                      </MText>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>

            {selectedBook ? (
              <>
                <MText style={styles.hint}>
                  Start page: <MText style={styles.strong}>{startPage}</MText>
                  {"  "}• Total:{" "}
                  <MText style={styles.strong}>{totalPages || "—"}</MText>
                </MText>

                <MText style={styles.sectionTitle}>Type</MText>
                <View style={styles.chipsRow}>
                  <Chip
                    active={type === "section"}
                    text="Section"
                    onPress={() => setType("section")}
                  />
                  <Chip
                    active={type === "pages"}
                    text="Pages"
                    onPress={() => setType("pages")}
                  />
                </View>

                {type === "pages" ? (
                  <>
                    <MText style={styles.sectionTitle}>Quick + Custom</MText>
                    <View style={styles.chipsRow}>
                      {[5, 10, 20, 30, 50, 100].map((p) => (
                        <Chip
                          key={p}
                          text={`${p}`}
                          active={!customPages && quickPages === p}
                          onPress={() => {
                            setCustomPages("");
                            setQuickPages(p);
                          }}
                        />
                      ))}

                      <View style={styles.quickInputWrap}>
                        <TextInput
                          value={customPages}
                          onChangeText={(t) => {
                            setCustomPages(t.replace(/[^\d]/g, ""));
                            setQuickPages(null);
                          }}
                          keyboardType="number-pad"
                          placeholder="Custom"
                          placeholderTextColor={colors.textSecondary}
                          style={styles.quickInput}
                        />
                      </View>
                    </View>

                    {selectedLabel ? (
                      <MText style={styles.hint}>
                        Target:{" "}
                        <MText style={styles.strong}>
                          {selectedLabel.label}
                        </MText>
                        {"  "}• End page:{" "}
                        <MText style={styles.strong}>
                          {selectedLabel.endPage}
                        </MText>
                      </MText>
                    ) : null}
                  </>
                ) : (
                  <>
                    <View style={styles.sectionHeaderRow}>
                      <MText style={styles.sectionTitle}>Choose section</MText>

                      {sectionLabels.length === 0 ? (
                        <Pressable
                          onPress={() =>
                            onOpenChapters(selectedBook.uri, selectedBook.name)
                          }
                          style={styles.smallBtn}
                        >
                          <MText style={{ fontWeight: "800" }}>
                            Open chapters
                          </MText>
                        </Pressable>
                      ) : null}
                    </View>

                    {sectionLabels.length === 0 ? (
                      <MText style={{ opacity: 0.7 }}>
                        No chapters found for this book yet. Add them from the
                        PDF menu.
                      </MText>
                    ) : (
                      <View style={styles.sectionList}>
                        {sectionLabels.map((l) => (
                          <Chip
                            key={l.id}
                            full
                            text={l.label}
                            active={selectedSectionId === l.id}
                            onPress={() => setSelectedSectionId(l.id)}
                          />
                        ))}
                      </View>
                    )}
                  </>
                )}
              </>
            ) : null}
          </ScrollView>

          <Pressable
            onPress={onCreate}
            disabled={!canCreate}
            style={[styles.cta, !canCreate && { opacity: 0.5 }]}
          >
            <MText style={{ fontWeight: "800" }}>Create Target</MText>
            {selectedLabel ? (
              <MText style={{ opacity: 0.75, marginTop: 2 }} numberOfLines={1}>
                {selectedLabel.label}
              </MText>
            ) : null}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.backdropStrong,
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "90%",
    marginBottom: spacing["2xl"],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },

  sectionTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    fontWeight: "800",
    opacity: 0.85,
  },
  hint: { marginTop: spacing.sm, opacity: 0.75 },
  strong: { fontWeight: "800", opacity: 1 },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
  },
  search: {
    flex: 1,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },

  bookList: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  bookRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  bookRowActive: { backgroundColor: colors.textInverse },
  bookName: { flex: 1, fontWeight: "600" },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
  },
  sectionList: { gap: spacing.sm, marginTop: spacing.xs },

  chip: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.textInverse },
  chipText: { fontWeight: "700", opacity: 0.8 },
  chipTextActive: { opacity: 1 },

  quickInputWrap: {
    minWidth: 110,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
  },
  quickInput: { color: colors.textPrimary, paddingVertical: spacing.xs },

  cta: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
