import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  dedupeStores,
  getProductStoreOptions,
  useTranslation,
} from "@musti/core";
import {
  MText,
  colors,
  spacing,
  radii,
  BaseIcon,
  iconSizes,
  touchTargets,
} from "@musti/ui-native";
import { BudgetSubScreenHeader } from "@/components/budget/BudgetSubScreenHeader";
import { StorePickerSheet, type StorePickerOption } from "@/components/budget/StorePickerSheet";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/ToastProvider";
import { useProductsStore } from "@/store/budget/products/useProductsStore";
import type { ProductWithMeta } from "@/store/budget/products/useProductsStore";
import { useShoppingListStore } from "@/store/budget/shopping-list/useShoppingListStore";
import { useStoresStore } from "@/store/budget/stores/useStoresStore";

export function ProductsScreen() {
  const { t } = useTranslation();
  const { showToast } = useToast();

  const products = useProductsStore((s) => s.products);
  const priceSamples = useProductsStore((s) => s.priceSamples);
  const loadProducts = useProductsStore((s) => s.loadFromStorage);

  const stores = useStoresStore((s) => s.stores);
  const loadStores = useStoresStore((s) => s.loadFromStorage);

  const shoppingItems = useShoppingListStore((s) => s.items);
  const loadShoppingList = useShoppingListStore((s) => s.loadFromStorage);
  const addItemIfMissing = useShoppingListStore((s) => s.addItemIfMissing);

  const [pickerVisible, setPickerVisible] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<ProductWithMeta | null>(
    null
  );

  useEffect(() => {
    void loadProducts();
    void loadStores();
    void loadShoppingList();
  }, [loadProducts, loadStores, loadShoppingList]);

  const dedupedStores = useMemo(() => dedupeStores(stores), [stores]);
  const storeNameById = useMemo(
    () => new Map(dedupedStores.map((store) => [store.id, store.name])),
    [dedupedStores]
  );

  const activeListKeys = useMemo(
    () =>
      new Set(
        shoppingItems
          .filter((item) => !item.checked && item.productId)
          .map((item) => `${item.productId}:${item.storeId ?? ""}`)
      ),
    [shoppingItems]
  );

  const isOnAnyList = useCallback(
    (productId: string) =>
      shoppingItems.some(
        (item) => !item.checked && item.productId === productId
      ),
    [shoppingItems]
  );

  const sorted = useMemo(
    () =>
      [...products].sort((a, b) => {
        const aDate = a.lastPurchasedAt ?? "";
        const bDate = b.lastPurchasedAt ?? "";
        return bDate.localeCompare(aDate);
      }),
    [products]
  );

  const buildStoreOptions = useCallback(
    (item: ProductWithMeta): StorePickerOption[] => {
      const seen = new Set<string>();
      const options: StorePickerOption[] = [
        {
          id: null,
          name: t("shoppingList.noStore"),
        },
      ];

      const pushStore = (storeId: string | undefined, hint?: string) => {
        if (!storeId || seen.has(storeId)) return;
        const name = storeNameById.get(storeId);
        if (!name) return;
        seen.add(storeId);
        options.push({ id: storeId, name, hint });
      };

      pushStore(item.lastStoreId, t("products.lastPurchaseStore"));

      for (const entry of getProductStoreOptions(priceSamples, item.id)) {
        pushStore(entry.storeId);
      }

      for (const store of dedupedStores) {
        pushStore(store.id);
      }

      return options;
    },
    [dedupedStores, priceSamples, storeNameById, t]
  );

  const pickerOptions = useMemo(
    () => (pendingProduct ? buildStoreOptions(pendingProduct) : []),
    [pendingProduct, buildStoreOptions]
  );

  const defaultPickerStoreId = pendingProduct?.lastStoreId ?? null;

  const addProductToList = useCallback(
    async (item: ProductWithMeta, storeId: string | null) => {
      const storeName =
        storeId != null
          ? storeNameById.get(storeId) ?? t("shoppingList.unnamed")
          : t("shoppingList.noStore");

      const added = await addItemIfMissing({
        name: item.name,
        productId: item.id,
        storeId: storeId ?? undefined,
      });

      const listKey = `${item.id}:${storeId ?? ""}`;
      if (activeListKeys.has(listKey)) {
        showToast({
          message: t("products.alreadyOnShoppingListAtStore", {
            name: item.name,
            store: storeName,
          }),
          variant: "info",
        });
        return;
      }

      if (added) {
        showToast({
          message: t("products.addedToShoppingListAtStore", {
            name: item.name,
            store: storeName,
          }),
          variant: "success",
          actions: [
            {
              label: t("shopping_list"),
              onPress: () =>
                router.push("/(tabs)/budget/shopping-list" as any),
            },
          ],
        });
      } else {
        showToast({
          message: t("products.alreadyOnShoppingListAtStore", {
            name: item.name,
            store: storeName,
          }),
          variant: "info",
        });
      }
    },
    [activeListKeys, addItemIfMissing, showToast, storeNameById, t]
  );

  const handleAddToList = useCallback((item: ProductWithMeta) => {
    setPendingProduct(item);
    setPickerVisible(true);
  }, []);

  const handlePickStore = (storeId: string | null) => {
    setPickerVisible(false);
    if (!pendingProduct) return;
    void addProductToList(pendingProduct, storeId);
    setPendingProduct(null);
  };

  const renderAddButton = (item: ProductWithMeta) => {
    const onList = isOnAnyList(item.id);

    return (
      <Pressable
        style={[styles.listBtn, onList && styles.listBtnOnList]}
        onPress={() => handleAddToList(item)}
        accessibilityRole="button"
        accessibilityLabel={
          onList
            ? t("products.onShoppingList")
            : t("products.addToShoppingList")
        }
      >
        <BaseIcon
          name={onList ? "checkmark-circle" : "list-outline"}
          size={iconSizes.sm}
          color={onList ? colors.textMuted : colors.primaryLight}
        />
        <MText
          variant="caption"
          color={onList ? "textMuted" : "primaryLight"}
          style={styles.listBtnLabel}
        >
          {onList ? t("products.onShoppingList") : t("products.addToShoppingList")}
        </MText>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <BudgetSubScreenHeader title={t("products")} />

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          sorted.length ? styles.listContent : styles.listEmpty
        }
        ListEmptyComponent={
          <EmptyState
            icon="cube-outline"
            title={t("empty.products.title")}
            subtitle={t("empty.products.subtitle")}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              style={styles.mainTap}
              onPress={() =>
                router.push({
                  pathname: "/(tabs)/budget/products/[id]",
                  params: { id: item.id },
                } as any)
              }
            >
              <BaseIcon
                name="cube-outline"
                size={iconSizes.lg}
                color={colors.primaryLight}
              />
              <View style={styles.body}>
                <MText variant="bodyStrong">{item.name}</MText>
                <MText variant="caption" color="textSecondary">
                  {item.lastStoreName
                    ? `${item.lastStoreName} · ${item.lastPrice?.toFixed(2) ?? "—"} ${item.lastCurrency ?? ""}`
                    : t("products.noPurchaseYet")}
                </MText>
              </View>
            </Pressable>
            {renderAddButton(item)}
          </View>
        )}
      />

      <StorePickerSheet
        visible={pickerVisible}
        title={t("products.pickStoreForList")}
        subtitle={
          pendingProduct
            ? t("products.pickStoreForListSubtitle", {
                name: pendingProduct.name,
              })
            : undefined
        }
        options={pickerOptions}
        selectedId={defaultPickerStoreId}
        cancelLabel={t("cancel")}
        onSelect={handlePickStore}
        onCancel={() => {
          setPickerVisible(false);
          setPendingProduct(null);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingRight: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  mainTap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    minWidth: 0,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
    minWidth: 0,
  },
  listBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: touchTargets.minimum,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryLight,
    backgroundColor: "rgba(0,73,168,0.18)",
  },
  listBtnOnList: {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
  },
  listBtnLabel: {
    fontWeight: "600",
  },
});
