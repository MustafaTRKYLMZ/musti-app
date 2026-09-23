import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import {
  buildProductPriceSeries,
  getProductStoreOptions,
  useTranslation,
} from "@musti/core";
import { MText, colors, spacing, radii } from "@musti/ui-native";
import { BudgetSubScreenHeader } from "@/components/budget/BudgetSubScreenHeader";
import { ProductPriceChart } from "@/components/products/ProductPriceChart";
import { useProductsStore } from "@/store/budget/products/useProductsStore";

export function ProductPriceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t } = useTranslation();
  const { width } = useWindowDimensions();

  const products = useProductsStore((s) => s.products);
  const priceSamples = useProductsStore((s) => s.priceSamples);
  const loadProducts = useProductsStore((s) => s.loadFromStorage);

  const [storeId, setStoreId] = useState<string | null>(null);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const product = products.find((p) => p.id === id);

  const storeOptions = useMemo(
    () => (id ? getProductStoreOptions(priceSamples, id) : []),
    [id, priceSamples]
  );

  const series = useMemo(
    () => (id ? buildProductPriceSeries(priceSamples, id, storeId) : []),
    [id, priceSamples, storeId]
  );

  const chartWidth = width - spacing.md * 2;

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <BudgetSubScreenHeader title={product?.name ?? t("price_history")} />

      <ScrollView contentContainerStyle={styles.content}>
        {storeOptions.length > 0 ? (
          <View style={styles.filters}>
            <Pressable
              style={[styles.chip, storeId == null && styles.chipActive]}
              onPress={() => setStoreId(null)}
            >
              <MText
                variant="caption"
                color={storeId == null ? "textPrimary" : "textSecondary"}
              >
                {t("priceHistory.allStores")}
              </MText>
            </Pressable>
            {storeOptions.map((store) => (
              <Pressable
                key={store.storeId}
                style={[
                  styles.chip,
                  storeId === store.storeId && styles.chipActive,
                ]}
                onPress={() => setStoreId(store.storeId)}
              >
                <MText
                  variant="caption"
                  color={
                    storeId === store.storeId ? "textPrimary" : "textSecondary"
                  }
                >
                  {store.storeName}
                </MText>
              </Pressable>
            ))}
          </View>
        ) : null}

        <ProductPriceChart
          points={series}
          width={chartWidth}
          emptyLabel={t("empty.priceHistory.chart")}
        />

        <View style={styles.historyList}>
          {[...series].reverse().map((point) => (
            <View key={`${point.date}_${point.storeId ?? "all"}`} style={styles.historyRow}>
              <View style={styles.historyLeft}>
                <MText variant="body">{point.date}</MText>
                {point.storeName ? (
                  <MText variant="caption" color="textSecondary">
                    {point.storeName}
                  </MText>
                ) : null}
              </View>
              <MText variant="bodyStrong">
                {point.unitPrice.toFixed(2)} {point.currency ?? ""}
              </MText>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing["3xl"],
  },
  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: "rgba(47,111,237,0.08)",
  },
  historyList: {
    gap: spacing.sm,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
  },
  historyLeft: {
    flex: 1,
    gap: spacing.xs,
  },
});
