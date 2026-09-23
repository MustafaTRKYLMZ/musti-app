import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTranslation } from "@musti/core";
import { MText, colors, spacing, radii, BaseIcon, iconSizes } from "@musti/ui-native";
import { BudgetSubScreenHeader } from "@/components/budget/BudgetSubScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useProductsStore } from "@/store/budget/products/useProductsStore";

export function PriceHistoryScreen() {
  const { t } = useTranslation();
  const products = useProductsStore((s) => s.products);
  const priceSamples = useProductsStore((s) => s.priceSamples);
  const loadProducts = useProductsStore((s) => s.loadFromStorage);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const rows = useMemo(() => {
    const sampleCount = new Map<string, number>();
    for (const sample of priceSamples) {
      sampleCount.set(sample.productId, (sampleCount.get(sample.productId) ?? 0) + 1);
    }

    return [...products]
      .filter((p) => (sampleCount.get(p.id) ?? 0) > 0)
      .map((p) => ({
        ...p,
        sampleCount: sampleCount.get(p.id) ?? 0,
      }))
      .sort((a, b) => {
        const aDate = a.lastPurchasedAt ?? "";
        const bDate = b.lastPurchasedAt ?? "";
        return bDate.localeCompare(aDate);
      });
  }, [products, priceSamples]);

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <BudgetSubScreenHeader title={t("price_history")} />

      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          rows.length ? styles.listContent : styles.listEmpty
        }
        ListEmptyComponent={
          <EmptyState
            icon="pricetags-outline"
            title={t("empty.priceHistory.title")}
            subtitle={t("empty.priceHistory.subtitle")}
          />
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: "/(tabs)/budget/products/[id]",
                params: { id: item.id },
              } as any)
            }
          >
            <BaseIcon
              name="pricetags-outline"
              size={iconSizes.lg}
              color={colors.primary}
            />
            <View style={styles.body}>
              <MText variant="bodyStrong">{item.name}</MText>
              <MText variant="caption" color="textSecondary">
                {item.lastStoreName
                  ? `${item.lastStoreName} · ${item.lastPrice?.toFixed(2) ?? "—"} ${item.lastCurrency ?? ""}`
                  : t("products.noPurchaseYet")}
              </MText>
            </View>
            <MText variant="caption" color="textSecondary">
              {item.sampleCount}×
            </MText>
          </Pressable>
        )}
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
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  body: {
    flex: 1,
    gap: spacing.xs,
  },
});
