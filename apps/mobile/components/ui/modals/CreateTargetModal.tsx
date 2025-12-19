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
  // ✅ group + items store API (v2)
  const addTarget = useReadingTargetsStore((s) => s.addTarget);
  const addItem = useReadingTargetsStore((s) => s.addItem);
  const deleteItem = useReadingTargetsStore((s) => s.deleteItem);
  const targets = useReadingTargetsStore((s) => s.targets);

  // ⚠️ store’da bu helper varsa direkt al; yoksa (s as any) ile çekiyorsun
  const getResolvedSections = useBookSectionsStore(
    (s) => (s as any).getResolvedSections
  );

  // group state
  const [title, setTitle] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);

  // selection state
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

  const currentBookPage = useMemo(() => {
    if (!selectedUri) return 1;
    const v = clampInt(progressMap[selectedUri]?.lastPage ?? 1);
    return Math.max(1, v || 1);
  }, [progressMap, selectedUri]);

  const totalPages = useMemo(() => {
    if (!selectedUri) return 0;
    return clampInt(progressMap[selectedUri]?.totalPages ?? 0);
  }, [progressMap, selectedUri]);

  // ✅ resolved sections (endPage guaranteed by helper)
  const resolvedSections = useMemo(() => {
    if (!selectedUri) return [];
    if (!getResolvedSections) return [];
    return getResolvedSections(selectedUri, totalPages || null) ?? [];
  }, [getResolvedSections, selectedUri, totalPages]);

  // ✅ kritik: bitmiş section’ları LİSTELEME (instant done biter)
  const sectionLabels = useMemo<TargetLabel[]>(() => {
    if (!selectedBook) return [];
    return resolvedSections
      .filter((sec: any) => {
        const end = Number(sec.endPage ?? 0);
        return end > currentBookPage; // ✅ only not-finished
      })
      .map((sec: any) => ({
        id: `sec:${sec.id}`,
        type: "section",
        label: sec.title,
        endPage: Number(sec.endPage ?? 0),
        jumpPage: Number(sec.startPage ?? 1),
      }));
  }, [resolvedSections, selectedBook, currentBookPage]);

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

      // pages target starts at current reading page (>=1)
      const jumpPage = Math.max(1, currentBookPage || 1);
      const endPage = Math.min(tp, jumpPage + p);

      // ✅ endPage currentPage’den küçük/eşit olmasın
      if (endPage <= jumpPage) return null;

      return {
        id: customPages ? `p:custom:${p}` : `p:${p}`,
        type: "pages",
        label: `${p} pages`,
        endPage,
        jumpPage,
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
    currentBookPage,
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

  // current group (for rendering items)
  const currentTarget = useMemo(() => {
    if (!targetId) return null;
    return targets.find((t) => t.id === targetId) ?? null;
  }, [targets, targetId]);

  // initial book
  useEffect(() => {
    if (!visible) return;
    if (!initialBookUri) return;
    setSelectedUri(initialBookUri);
  }, [visible, initialBookUri]);

  // reset selection when switching book/type
  useEffect(() => {
    setSelectedSectionId(null);
    setCustomPages("");
    setQuickPages(20);
  }, [selectedUri, type]);

  const canAddItem = !!selectedBook && !!selectedLabel && !!targetId;
  const canCreateGroup = title.trim().length > 0 && !targetId;
  const canFinish = !!targetId && (currentTarget?.items?.length ?? 0) > 0;

  const resetAll = () => {
    setTitle("");
    setTargetId(null);

    setQuery("");
    setSelectedUri(null);
    setType("section");
    setQuickPages(20);
    setCustomPages("");
    setSelectedSectionId(null);
  };

  const closeAndReset = () => {
    resetAll();
    onClose();
  };

  const createGroup = async () => {
    const t = title.trim();
    if (!t) return;
    const id = await addTarget(t);
    setTargetId(id);
  };

  const addSelectedItem = async () => {
    if (!targetId || !selectedBook || !selectedLabel) return;

    const jumpPage = Math.max(1, selectedLabel.jumpPage || 1);
    const endPage = Math.max(jumpPage, selectedLabel.endPage || jumpPage);

    // ✅ safety: instant done koruması (pages ve section için)
    if (endPage <= currentBookPage) return;

    await addItem(targetId, {
      bookUri: selectedBook.uri,
      bookName: selectedBook.name,
      type: selectedLabel.type,
      startPage: jumpPage,
      endPage,
      labelId: selectedLabel.id,
      label: selectedLabel.label,
      jumpPage,
    });

    // clear selection for faster adding
    setSelectedSectionId(null);
    setCustomPages("");
    setQuickPages(20);
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
            <MText variant="heading3">
              {targetId ? "Edit Target" : "New Target"}
            </MText>
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
            {/* GROUP TITLE */}
            <MText style={styles.sectionTitle}>Title</MText>
            <View style={styles.titleRow}>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Morning routine"
                placeholderTextColor={colors.textSecondary}
                style={styles.titleInput}
                editable={!targetId}
              />

              {!targetId ? (
                <Pressable
                  onPress={createGroup}
                  disabled={!canCreateGroup}
                  style={[
                    styles.primaryBtn,
                    !canCreateGroup && { opacity: 0.5 },
                  ]}
                >
                  <MText style={styles.primaryBtnText}>Create</MText>
                </Pressable>
              ) : (
                <View style={styles.lockPill}>
                  <MText style={{ fontWeight: "900", opacity: 0.7 }}>
                    Created
                  </MText>
                </View>
              )}
            </View>

            {/* ITEMS LIST */}
            {currentTarget?.items?.length ? (
              <>
                <MText style={styles.sectionTitle}>
                  Items ({currentTarget.items.length})
                </MText>

                <View style={styles.itemsBox}>
                  {currentTarget.items.map((it) => (
                    <View key={it.id} style={styles.itemRow}>
                      <View style={{ flex: 1 }}>
                        <MText numberOfLines={1} style={{ fontWeight: "800" }}>
                          {it.bookName}
                        </MText>
                        <MText style={{ opacity: 0.75 }} numberOfLines={1}>
                          {it.label} • {it.jumpPage}–{it.endPage}
                        </MText>
                      </View>

                      <IconButton
                        name="trash-outline"
                        size={iconSizes.md}
                        color={colors.textPrimary}
                        onPress={() => deleteItem(currentTarget.id, it.id)}
                      />
                    </View>
                  ))}
                </View>
              </>
            ) : null}

            {/* BOOK SELECT */}
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
                  Current page:{" "}
                  <MText style={styles.strong}>{currentBookPage}</MText>
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
                        Selected:{" "}
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
                        No available chapters (or all finished). Add/edit from
                        the PDF menu.
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

                {/* ADD ITEM CTA */}
                <Pressable
                  onPress={addSelectedItem}
                  disabled={!canAddItem}
                  style={[styles.cta, !canAddItem && { opacity: 0.5 }]}
                >
                  <MText style={{ fontWeight: "900" }}>
                    {targetId ? "Add item" : "Create group first"}
                  </MText>
                  {selectedLabel ? (
                    <MText
                      style={{ opacity: 0.75, marginTop: 2 }}
                      numberOfLines={1}
                    >
                      {selectedBook.name} • {selectedLabel.label}
                    </MText>
                  ) : null}
                </Pressable>
              </>
            ) : null}
          </ScrollView>

          {/* FINISH */}
          <Pressable
            onPress={closeAndReset}
            disabled={!canFinish}
            style={[styles.finish, !canFinish && { opacity: 0.5 }]}
          >
            <MText style={{ fontWeight: "900" }}>
              {canFinish ? "Save & Close" : "Add at least 1 item"}
            </MText>
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
  strong: { fontWeight: "900", opacity: 1 },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titleInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  primaryBtn: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
  },
  primaryBtnText: { fontWeight: "900" },
  lockPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },

  itemsBox: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },

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

  finish: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
