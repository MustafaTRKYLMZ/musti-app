import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  buildCanonicalStoreIdMap,
  dedupeStores,
  groupShoppingListItems,
  resolveShoppingListItemLabel,
  useTranslation,
} from "@musti/core";
import {
  MText,
  colors,
  spacing,
  radii,
  typography,
  BaseIcon,
  iconSizes,
  touchTargets,
} from "@musti/ui-native";
import { BudgetSubScreenHeader } from "@/components/budget/BudgetSubScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useShoppingListStore } from "@/store/budget/shopping-list/useShoppingListStore";
import { useStoresStore } from "@/store/budget/stores/useStoresStore";
import { useProductsStore } from "@/store/budget/products/useProductsStore";
import type { ShoppingListItem } from "@musti/core";

export function ShoppingListScreen() {
  const { t } = useTranslation();
  const items = useShoppingListStore((s) => s.items);
  const loadFromStorage = useShoppingListStore((s) => s.loadFromStorage);
  const syncWithCatalog = useShoppingListStore((s) => s.syncWithCatalog);
  const addItem = useShoppingListStore((s) => s.addItem);
  const toggleItem = useShoppingListStore((s) => s.toggleItem);
  const removeItem = useShoppingListStore((s) => s.removeItem);
  const clearChecked = useShoppingListStore((s) => s.clearChecked);

  const stores = useStoresStore((s) => s.stores);
  const storesHydrated = useStoresStore((s) => s.isHydrated);
  const loadStores = useStoresStore((s) => s.loadFromStorage);

  const products = useProductsStore((s) => s.products);
  const productsHydrated = useProductsStore((s) => s.isHydrated);
  const loadProducts = useProductsStore((s) => s.loadFromStorage);

  const [draft, setDraft] = useState("");
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null);
  const [checkedExpanded, setCheckedExpanded] = useState(false);

  useEffect(() => {
    void loadFromStorage();
    void loadStores();
    void loadProducts();
  }, [loadFromStorage, loadStores, loadProducts]);

  useEffect(() => {
    if (!storesHydrated || !productsHydrated) return;
    syncWithCatalog({ stores, products });
  }, [stores, products, storesHydrated, productsHydrated, syncWithCatalog]);

  const dedupedStores = useMemo(() => dedupeStores(stores), [stores]);

  const canonicalStoreIdByRawId = useMemo(
    () => buildCanonicalStoreIdMap(stores),
    [stores]
  );

  const storeNameById = useMemo(
    () => new Map(dedupedStores.map((s) => [s.id, s.name])),
    [dedupedStores]
  );

  const productNameById = useMemo(
    () => new Map(products.map((p) => [p.id, p.name])),
    [products]
  );

  const noStoreLabel = t("shoppingList.noStore");

  const resolveItemStoreId = (storeId?: string) => {
    if (!storeId) return null;
    return canonicalStoreIdByRawId.get(storeId) ?? storeId;
  };

  const activeItems = useMemo(
    () => items.filter((item) => !item.checked),
    [items]
  );

  const checkedItems = useMemo(
    () => items.filter((item) => item.checked),
    [items]
  );

  const filteredActiveItems = useMemo(() => {
    if (selectedStoreId == null) return activeItems;
    return activeItems.filter(
      (item) => resolveItemStoreId(item.storeId) === selectedStoreId
    );
  }, [activeItems, selectedStoreId, canonicalStoreIdByRawId]);

  const activeSections = useMemo(() => {
    const groups = groupShoppingListItems(
      filteredActiveItems,
      storeNameById,
      noStoreLabel,
      {
        resolveCanonicalStoreId: (storeId) =>
          canonicalStoreIdByRawId.get(storeId) ?? null,
      }
    );

    return groups.filter((group) => group.items.length > 0);
  }, [
    filteredActiveItems,
    storeNameById,
    noStoreLabel,
    canonicalStoreIdByRawId,
  ]);

  const storeChips = useMemo(
    () => [...dedupedStores].sort((a, b) => a.name.localeCompare(b.name)),
    [dedupedStores]
  );

  const selectedStoreName =
    selectedStoreId != null
      ? storeNameById.get(selectedStoreId) ?? t("shoppingList.unnamed")
      : null;

  const labelForItem = (item: ShoppingListItem) =>
    resolveShoppingListItemLabel(
      item,
      productNameById,
      t("shoppingList.unnamed")
    );

  const handleAdd = () => {
    const name = draft.trim();
    if (!name) return;
    void addItem({
      name,
      storeId: selectedStoreId ?? undefined,
    });
    setDraft("");
  };

  const renderRow = (item: ShoppingListItem) => {
    const label = labelForItem(item);

    return (
      <View key={item.id} style={styles.row}>
        <Pressable
          style={styles.checkArea}
          onPress={() => void toggleItem(item.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: item.checked }}
        >
          <BaseIcon
            name={item.checked ? "checkbox" : "square-outline"}
            size={iconSizes.lg}
            color={item.checked ? colors.primaryLight : colors.textSecondary}
          />
        </Pressable>

        <View style={styles.itemBody}>
          <MText
            variant="bodyStrong"
            color={item.checked ? "textSecondary" : "textPrimary"}
            style={item.checked ? styles.checkedText : undefined}
            numberOfLines={2}
          >
            {label}
          </MText>
        </View>

        <Pressable
          onPress={() => void removeItem(item.id)}
          hitSlop={8}
          style={styles.removeBtn}
          accessibilityLabel={t("delete")}
        >
          <BaseIcon
            name="trash-outline"
            size={iconSizes.md}
            color={colors.textSecondary}
          />
        </Pressable>
      </View>
    );
  };

  const hasListContent = activeItems.length > 0 || checkedItems.length > 0;
  const filteredListEmpty =
    selectedStoreId != null && filteredActiveItems.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <BudgetSubScreenHeader
        title={t("shopping_list")}
        right={
          checkedItems.length > 0 ? (
            <Pressable onPress={() => void clearChecked()} hitSlop={8}>
              <MText variant="caption" color="primaryLight">
                {t("shoppingList.clearChecked")}
              </MText>
            </Pressable>
          ) : undefined
        }
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.addBlock}>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={setDraft}
              placeholder={t("shoppingList.addPlaceholder")}
              placeholderTextColor={colors.textMuted}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
            />
            <Pressable style={styles.addBtn} onPress={handleAdd}>
              <BaseIcon name="add" size={iconSizes.lg} color="#FFF" />
            </Pressable>
          </View>

          {storeChips.length > 0 ? (
            <View style={styles.storeFilterBlock}>
              <MText variant="caption" color="textSecondary">
                {t("shoppingList.addToStore")}
              </MText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.storeFilters}
              >
                <Pressable
                  style={[
                    styles.storeChip,
                    selectedStoreId == null && styles.storeChipActive,
                  ]}
                  onPress={() => setSelectedStoreId(null)}
                >
                  <MText
                    variant="bodyStrong"
                    color={
                      selectedStoreId == null ? "textPrimary" : "textSecondary"
                    }
                  >
                    {t("shoppingList.allStores")}
                  </MText>
                </Pressable>
                {storeChips.map((store) => (
                  <Pressable
                    key={store.id}
                    style={[
                      styles.storeChip,
                      selectedStoreId === store.id && styles.storeChipActive,
                    ]}
                    onPress={() => setSelectedStoreId(store.id)}
                  >
                    <MText
                      variant="bodyStrong"
                      color={
                        selectedStoreId === store.id
                          ? "textPrimary"
                          : "textSecondary"
                      }
                    >
                      {store.name}
                    </MText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}
        </View>

        {!hasListContent ? (
          <View style={styles.listEmpty}>
            <EmptyState
              icon="list-outline"
              title={t("empty.shoppingList.title")}
              subtitle={t("empty.shoppingList.subtitle")}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {filteredListEmpty ? (
              <View style={styles.filteredEmpty}>
                <MText variant="body" color="textSecondary">
                  {t("shoppingList.emptyForStore", {
                    store: selectedStoreName ?? "",
                  })}
                </MText>
              </View>
            ) : (
              activeSections.map((section) => (
                <View key={section.storeId ?? "any-store"} style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <BaseIcon
                      name={
                        section.storeId
                          ? "storefront-outline"
                          : "ellipsis-horizontal"
                      }
                      size={iconSizes.md}
                      color={colors.primaryLight}
                    />
                    <MText variant="heading4" style={styles.sectionTitle}>
                      {section.storeName}
                    </MText>
                    <MText variant="caption" color="textMuted">
                      {section.items.length}
                    </MText>
                  </View>

                  {section.items.map((item) => renderRow(item))}
                </View>
              ))
            )}

            {checkedItems.length > 0 ? (
              <View style={styles.section}>
                <Pressable
                  style={styles.checkedHeader}
                  onPress={() => setCheckedExpanded((open) => !open)}
                >
                  <BaseIcon
                    name={checkedExpanded ? "chevron-down" : "chevron-forward"}
                    size={iconSizes.md}
                    color={colors.textSecondary}
                  />
                  <MText variant="heading4" color="textSecondary">
                    {t("shoppingList.checkedSection")}
                  </MText>
                  <MText variant="caption" color="textMuted">
                    {checkedItems.length}
                  </MText>
                </Pressable>

                {checkedExpanded
                  ? checkedItems.map((item) => renderRow(item))
                  : null}
              </View>
            ) : null}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  addBlock: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  addRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  storeFilterBlock: {
    gap: spacing.xs,
  },
  storeFilters: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  storeChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  storeChipActive: {
    borderColor: colors.primaryLight,
    backgroundColor: "rgba(0,73,168,0.25)",
  },
  input: {
    flex: 1,
    ...typography.body,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  addBtn: {
    width: touchTargets.minimum,
    height: touchTargets.minimum,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing["3xl"],
    gap: spacing.md,
  },
  listEmpty: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  filteredEmpty: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  sectionTitle: {
    flex: 1,
  },
  checkedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  checkArea: {
    padding: spacing.xs,
  },
  itemBody: {
    flex: 1,
    minWidth: 0,
  },
  checkedText: {
    textDecorationLine: "line-through",
  },
  removeBtn: {
    padding: spacing.xs,
  },
});
