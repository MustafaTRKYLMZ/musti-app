import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { dedupeStores, useTranslation } from "@musti/core";
import { MText, colors, spacing, radii, BaseIcon, iconSizes } from "@musti/ui-native";
import { BudgetSubScreenHeader } from "@/components/budget/BudgetSubScreenHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStoresStore } from "@/store/budget/stores/useStoresStore";

export function MarketsScreen() {
  const { t } = useTranslation();
  const stores = useStoresStore((s) => s.stores);
  const loadFromStorage = useStoresStore((s) => s.loadFromStorage);

  useEffect(() => {
    void loadFromStorage();
  }, [loadFromStorage]);

  const sorted = useMemo(
    () =>
      dedupeStores([...stores]).sort((a, b) => a.name.localeCompare(b.name)),
    [stores]
  );

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <BudgetSubScreenHeader title={t("markets")} />

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={
          sorted.length ? styles.listContent : styles.listEmpty
        }
        ListEmptyComponent={
          <EmptyState
            icon="storefront-outline"
            title={t("empty.markets.title")}
            subtitle={t("empty.markets.subtitle")}
          />
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <BaseIcon
              name="storefront-outline"
              size={iconSizes.lg}
              color={colors.primary}
            />
            <View style={styles.body}>
              <MText variant="bodyStrong">{item.name}</MText>
              {item.branchName ? (
                <MText variant="caption" color="textSecondary">
                  {item.branchName}
                </MText>
              ) : null}
            </View>
          </View>
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
