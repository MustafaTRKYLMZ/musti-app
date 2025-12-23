import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import DraggableFlatList, {
  RenderItemParams,
} from "react-native-draggable-flatlist";

import {
  MText,
  spacing,
  radii,
  iconSizes,
  useTheme,
  Card,
  bookshelfTheme,
} from "@budget/ui-native";
import { IconButton, BaseIcon, IconTile } from "@/components/ui/AppIcon";
import { listLocalPdfs, type LocalPdfFile } from "@/utils/getPdfsDirectory";
import { useReadingPlanStore } from "@/store/bookshelf/useReadingPlanStore";
import { PlanBottomActionButtons } from "@/components/Books/PlanBottomActionButtons";
import { PlanItemConfig } from "@budget/core";
const { colors } = bookshelfTheme;

type EntryState = Record<string, string>; // pages/day as string
type MultiSelectedState = Record<string, boolean>;

export default function EditPlanScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const params = useLocalSearchParams<{ planId?: string }>();
  const planId = params.planId ? String(params.planId) : undefined;

  const plans = useReadingPlanStore((s) => s.plans);
  const updatePlan = useReadingPlanStore((s) => s.updatePlan);
  const deletePlan = useReadingPlanStore((s) => s.deletePlan);

  const plan = useMemo(() => {
    if (!planId) return null;
    return (plans ?? []).find((p) => p.id === planId) ?? null;
  }, [plans, planId]);

  const [books, setBooks] = useState<LocalPdfFile[]>([]);
  const [planName, setPlanName] = useState("");

  const [order, setOrder] = useState<string[]>([]);
  const [entries, setEntries] = useState<EntryState>({});

  // single picker (optional)
  const [bookPickerOpen, setBookPickerOpen] = useState(false);
  const [selectedBookUri, setSelectedBookUri] = useState<string | null>(null);

  // ✅ multi select
  const [multiSelectOpen, setMultiSelectOpen] = useState(false);
  const [multiSelected, setMultiSelected] = useState<MultiSelectedState>({});

  useEffect(() => {
    (async () => {
      const all = await listLocalPdfs();
      setBooks(all);
    })();
  }, []);

  // init from plan
  useEffect(() => {
    if (!plan) return;

    setPlanName(plan.name);

    const nextOrder = plan.items.map((it) => it.bookUri);
    const nextEntries: EntryState = {};

    for (const it of plan.items) {
      nextEntries[it.bookUri] = String(it.pagesPerDay ?? "");
    }

    for (const b of books) {
      if (nextEntries[b.uri] == null) nextEntries[b.uri] = "";
    }

    setOrder(nextOrder);
    setEntries(nextEntries);

    const firstAvailable = books.find((b) => !nextOrder.includes(b.uri));
    setSelectedBookUri(firstAvailable?.uri ?? null);
  }, [plan, books]);

  const planBooks = useMemo(() => {
    return order
      .map((uri) => books.find((b) => b.uri === uri))
      .filter(Boolean) as LocalPdfFile[];
  }, [order, books]);

  const availableBooks = useMemo(() => {
    return books.filter((b) => !order.includes(b.uri));
  }, [books, order]);

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

  const selectedBook = useMemo(() => {
    if (!selectedBookUri) return null;
    return availableBooks.find((b) => b.uri === selectedBookUri) ?? null;
  }, [availableBooks, selectedBookUri]);

  const handleChangePages = (uri: string, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setEntries((prev) => ({ ...prev, [uri]: cleaned }));
  };

  const handleAddSelectedBook = () => {
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

    setOrder((prev) => [...prev, selectedBookUri]);
    setBookPickerOpen(false);

    const nextAvail = availableBooks.find((b) => b.uri !== selectedBookUri);
    setSelectedBookUri(nextAvail?.uri ?? null);
  };

  const handleRemoveBook = (uri: string) => {
    setOrder((prev) => prev.filter((x) => x !== uri));
  };

  const setAllTargets = (pagesPerDay: number) => {
    if (!order.length) return;
    setEntries((prev) => {
      const next = { ...prev };
      for (const uri of order) next[uri] = String(pagesPerDay);
      return next;
    });
  };

  const clearAllTargets = () => {
    if (!order.length) return;
    setEntries((prev) => {
      const next = { ...prev };
      for (const uri of order) next[uri] = "";
      return next;
    });
  };

  const addAllBooks = () => {
    if (!books.length) return;
    const allUris = books.map((b) => b.uri);
    setOrder(allUris);
    setEntries((prev) => {
      const next = { ...prev };
      for (const uri of allUris) {
        if (!next[uri]) next[uri] = "5";
      }
      return next;
    });
    setBookPickerOpen(false);
    setSelectedBookUri(null);
  };

  const removeAllBooks = () => {
    Alert.alert("Clear plan", "Remove all books from this plan?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setOrder([]) },
    ]);
  };

  const buildItems = useCallback((): PlanItemConfig[] => {
    const items: PlanItemConfig[] = [];
    for (const uri of order) {
      const book = books.find((b) => b.uri === uri);
      if (!book) continue;

      const raw = entries[uri];
      const pages = raw ? parseInt(raw, 10) : 0;
      if (!pages || pages <= 0) continue;

      items.push({
        bookUri: uri,
        bookName: book.name,
        pagesPerDay: pages,
      });
    }
    return items;
  }, [order, books, entries]);

  const handleSave = () => {
    if (!planId || !plan) return;

    const finalName = planName.trim() || "Reading plan";
    const items = buildItems();

    if (!items.length) {
      Alert.alert(
        "Empty plan",
        "Please keep at least one book with a valid pages/day target."
      );
      return;
    }

    updatePlan({ planId, name: finalName, items });
    router.back();
  };

  const handleDelete = () => {
    if (!planId || !plan) return;

    Alert.alert("Delete plan", `Delete "${plan.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deletePlan(planId);
          router.replace("/(tabs)/bookshelf");
        },
      },
    ]);
  };

  const addMultiSelected = () => {
    const selectedUris = Object.keys(multiSelected).filter(
      (u) => multiSelected[u]
    );
    if (!selectedUris.length) {
      setMultiSelectOpen(false);
      return;
    }

    setOrder((prev) => {
      const set = new Set(prev);
      const next = [...prev];
      for (const uri of selectedUris) {
        if (!set.has(uri)) next.push(uri);
      }
      return next;
    });

    // default target for new ones if empty
    setEntries((prev) => {
      const next = { ...prev };
      for (const uri of selectedUris) {
        if (!next[uri]) next[uri] = "5";
      }
      return next;
    });

    setMultiSelected({});
    setMultiSelectOpen(false);
  };

  if (!planId || !plan) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary">
          Plan not found.
        </MText>
      </View>
    );
  }

  const currentPagesValue =
    selectedBookUri && entries[selectedBookUri] ? entries[selectedBookUri] : "";

  const renderRow = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<LocalPdfFile>) => {
    const value = entries[item.uri] ?? "";

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onLongPress={drag}
        disabled={isActive}
        style={[
          styles.rowCard,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
            opacity: isActive ? 0.85 : 1,
          },
        ]}
      >
        <View style={styles.rowLeft}>
          <View
            style={[
              styles.dragHandle,
              {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <BaseIcon
              family="ion"
              name="reorder-three-outline"
              size={18}
              color={colors.textSecondary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <MText variant="bodyStrong" color="textPrimary" numberOfLines={1}>
              {item.name}
            </MText>
            <MText variant="caption" color="textSecondary" numberOfLines={1}>
              Long press to reorder
            </MText>
          </View>
        </View>

        <View style={styles.rowRight}>
          <TextInput
            value={value}
            onChangeText={(t) => handleChangePages(item.uri, t)}
            keyboardType="numeric"
            placeholder="0"
            style={[
              styles.pagesInput,
              {
                borderColor: colors.borderSubtle,
                color: colors.textPrimary,
                backgroundColor: colors.surface,
              },
            ]}
            placeholderTextColor={colors.textSecondary}
          />
          <MText
            variant="body"
            color="textSecondary"
            style={{ marginLeft: spacing.xs }}
          >
            /day
          </MText>

          <IconButton
            name="trash-outline"
            size={iconSizes.md}
            onPress={() => handleRemoveBook(item.uri)}
            style={{ marginLeft: spacing.sm }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
        <IconButton
          name="arrow-back"
          size={iconSizes.lg}
          onPress={() => router.back()}
        />
        <View style={{ flex: 1 }}>
          <MText variant="heading2" color="textPrimary" numberOfLines={1}>
            Edit plan
          </MText>
          <MText variant="caption" color="textSecondary" numberOfLines={1}>
            {plan.name}
          </MText>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: spacing["5xl"] }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Plan name */}
        <Card
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
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
        </Card>

        {/* Quick actions */}
        <Card
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <MText variant="bodyStrong" color="textPrimary">
              Quick actions
            </MText>
            <MText variant="caption" color="textSecondary">
              Fast edits
            </MText>
          </View>

          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => setAllTargets(5)}
            >
              <MText variant="body" color="textPrimary">
                Set all 5
              </MText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={() => setAllTargets(10)}
            >
              <MText variant="body" color="textPrimary">
                Set all 10
              </MText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={clearAllTargets}
            >
              <MText variant="body" color="textSecondary">
                Clear targets
              </MText>
            </TouchableOpacity>
          </View>

          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={[
                styles.chip,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={addAllBooks}
            >
              <MText variant="body" color="textPrimary">
                Add all books
              </MText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surface,
                },
              ]}
              onPress={removeAllBooks}
            >
              <MText variant="body" color="danger">
                Remove all
              </MText>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Add book */}
        <Card
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <MText variant="bodyStrong" color="textPrimary">
              Add book
            </MText>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <TouchableOpacity
                onPress={() => {
                  if (!availableBooks.length) return;
                  setMultiSelectOpen((v) => !v);
                }}
              >
                <MText variant="body" color="textSecondary">
                  Multi select
                </MText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Multi select panel */}
          {multiSelectOpen && (
            <View style={{ marginTop: spacing.sm }}>
              <View style={styles.multiHeader}>
                <MText variant="caption" color="textSecondary">
                  Tap to select multiple books
                </MText>

                <TouchableOpacity
                  onPress={() => {
                    setMultiSelected({});
                    setMultiSelectOpen(false);
                  }}
                >
                  <MText variant="caption" color="textSecondary">
                    Close
                  </MText>
                </TouchableOpacity>
              </View>

              <View
                style={[styles.multiList, { borderColor: colors.borderSubtle }]}
              >
                <ScrollView
                  style={{ maxHeight: 260 }}
                  keyboardShouldPersistTaps="handled"
                >
                  {availableBooks.map((b) => {
                    const checked = !!multiSelected[b.uri];
                    return (
                      <TouchableOpacity
                        key={b.uri}
                        style={styles.multiRow}
                        onPress={() =>
                          setMultiSelected((prev) => ({
                            ...prev,
                            [b.uri]: !prev[b.uri],
                          }))
                        }
                      >
                        <BaseIcon
                          family="ion"
                          name={checked ? "checkbox-outline" : "square-outline"}
                          size={22}
                          color={
                            checked ? colors.primary : colors.textSecondary
                          }
                        />
                        <MText
                          variant="body"
                          color="textPrimary"
                          numberOfLines={1}
                          style={{ marginLeft: spacing.sm, flex: 1 }}
                        >
                          {b.name}
                        </MText>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <TouchableOpacity
                style={[
                  styles.primaryWideBtn,
                  { backgroundColor: colors.primary },
                ]}
                onPress={addMultiSelected}
              >
                <MText variant="body" color="textInverse">
                  Add selected
                </MText>
              </TouchableOpacity>

              <View style={{ height: spacing.sm }} />
            </View>
          )}

          {/* Single add (optional) */}
          <View style={styles.selectRow}>
            <View style={{ flex: 1.4 }}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.bookSelect,
                  {
                    borderColor: colors.borderSubtle,
                    backgroundColor: colors.surface,
                  },
                ]}
                onPress={() => {
                  if (!availableBooks.length) return;
                  setBookPickerOpen((v) => !v);
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
                    : "All books are already in the plan"}
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

            <View style={styles.selectRight}>
              <View style={styles.pagesInputWrap}>
                <TextInput
                  value={currentPagesValue}
                  onChangeText={(t) => {
                    if (!selectedBookUri) return;
                    setEntries((prev) => ({
                      ...prev,
                      [selectedBookUri]: t.replace(/[^0-9]/g, ""),
                    }));
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  editable={!!selectedBookUri}
                  style={[
                    styles.pagesInput,
                    {
                      borderColor: colors.borderSubtle,
                      color: colors.textPrimary,
                      backgroundColor: colors.surface,
                    },
                  ]}
                  placeholderTextColor={colors.textSecondary}
                />
                <MText
                  variant="body"
                  color="textSecondary"
                  style={{ marginLeft: spacing.xs }}
                >
                  pages
                </MText>
              </View>

              <IconButton
                name="add-circle-outline"
                size={iconSizes.lg}
                onPress={handleAddSelectedBook}
              />
            </View>
          </View>

          {bookPickerOpen && availableBooks.length > 0 && (
            <View
              style={[
                styles.dropdown,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <ScrollView
                style={{ maxHeight: 240 }}
                keyboardShouldPersistTaps="handled"
              >
                {availableBooks.map((b) => {
                  const isActive = b.uri === selectedBookUri;
                  return (
                    <TouchableOpacity
                      key={b.uri}
                      activeOpacity={0.85}
                      style={[
                        styles.dropdownItem,
                        isActive && {
                          backgroundColor: colors.backgroundSecondary,
                        },
                      ]}
                      onPress={() => {
                        setSelectedBookUri(b.uri);
                        setBookPickerOpen(false);
                      }}
                    >
                      <MText
                        variant="body"
                        color="textPrimary"
                        numberOfLines={1}
                      >
                        {b.name}
                      </MText>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </Card>

        {/* DnD list */}
        <Card
          style={[
            styles.sectionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <MText variant="bodyStrong" color="textPrimary">
              Books in this plan
            </MText>
            <MText variant="caption" color="textSecondary">
              Drag to reorder
            </MText>
          </View>

          {planBooks.length === 0 ? (
            <View
              style={[styles.emptyBox, { borderColor: colors.borderSubtle }]}
            >
              <MText variant="body" color="textSecondary">
                No books selected.
              </MText>
            </View>
          ) : (
            <View style={{ marginTop: spacing.sm }}>
              <DraggableFlatList
                data={planBooks}
                keyExtractor={(item) => item.uri}
                onDragEnd={({ data }) => setOrder(data.map((b) => b.uri))}
                renderItem={renderRow}
                activationDistance={8}
                scrollEnabled={false} // inside ScrollView
              />
            </View>
          )}
        </Card>
      </ScrollView>

      {/* Bottom actions */}
      <PlanBottomActionButtons
        handleDelete={handleDelete}
        handleSave={handleSave}
      />
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingTop: spacing["2xl"],
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    paddingTop: spacing["3xl"],
  },

  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  sectionCard: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },

  textInput: {
    marginTop: spacing.xs,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  chip: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  selectRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },

  bookSelect: {
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
    gap: spacing.sm,
  },

  pagesInputWrap: {
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

  dropdown: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.md,
    overflow: "hidden",
  },

  dropdownItem: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },

  emptyBox: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  rowCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },

  dragHandle: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  actions: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: spacing["2xl"],
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
  },

  btn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },

  multiHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  multiList: {
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
  },

  multiRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },

  primaryWideBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
