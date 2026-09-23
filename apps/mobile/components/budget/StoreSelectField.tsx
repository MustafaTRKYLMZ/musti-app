import React, { useMemo, useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import type { Store } from "@musti/core";
import {
  dedupeStores,
  findMatchingStore,
  suggestStoresForName,
  useTranslation,
} from "@musti/core";
import { MText, colors, spacing, radii, BaseIcon, iconSizes } from "@musti/ui-native";
import {
  StorePickerSheet,
  type StorePickerOption,
} from "@/components/budget/StorePickerSheet";

type Props = {
  value: string;
  selectedStoreId?: string | null;
  stores: Store[];
  onChangeName: (name: string) => void;
  onSelectStore: (store: Store | null) => void;
  placeholder?: string;
};

export function StoreSelectField({
  value,
  selectedStoreId,
  stores,
  onChangeName,
  onSelectStore,
  placeholder,
}: Props) {
  const { t } = useTranslation();
  const [pickerVisible, setPickerVisible] = useState(false);

  const dedupedStores = useMemo(() => dedupeStores(stores), [stores]);

  const matchedStore = useMemo(
    () => findMatchingStore(stores, value),
    [stores, value]
  );

  const linkedStore = useMemo(() => {
    if (selectedStoreId) {
      return dedupedStores.find((store) => store.id === selectedStoreId);
    }
    return matchedStore;
  }, [selectedStoreId, dedupedStores, matchedStore]);

  const suggestions = useMemo(() => {
    if (linkedStore) return [];
    return suggestStoresForName(stores, value, 3);
  }, [linkedStore, stores, value]);

  const pickerOptions = useMemo<StorePickerOption[]>(
    () => [
      ...dedupedStores.map((store) => ({
        id: store.id,
        name: store.name,
      })),
    ],
    [dedupedStores]
  );

  const handleNameChange = (next: string) => {
    onChangeName(next);
    const match = findMatchingStore(stores, next);
    onSelectStore(match ?? null);
  };

  const handlePickStore = (storeId: string | null) => {
    setPickerVisible(false);
    if (storeId == null) {
      onSelectStore(null);
      return;
    }

    const store = dedupedStores.find((entry) => entry.id === storeId);
    if (!store) return;
    onChangeName(store.name);
    onSelectStore(store);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={handleNameChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
        />
        {dedupedStores.length > 0 ? (
          <Pressable
            style={styles.pickBtn}
            onPress={() => setPickerVisible(true)}
            accessibilityLabel={t("storePicker.selectExisting")}
          >
            <BaseIcon
              name="storefront-outline"
              size={iconSizes.md}
              color={colors.primaryLight}
            />
          </Pressable>
        ) : null}
      </View>

      {linkedStore ? (
        <View style={styles.linkedRow}>
          <BaseIcon
            name="checkmark-circle"
            size={iconSizes.sm}
            color={colors.success}
          />
          <MText variant="caption" color="textSecondary">
            {t("storePicker.matched", { name: linkedStore.name })}
          </MText>
        </View>
      ) : suggestions.length > 0 ? (
        <View style={styles.suggestions}>
          <MText variant="caption" color="textSecondary">
            {t("storePicker.suggestions")}
          </MText>
          <View style={styles.suggestionRow}>
            {suggestions.map((store) => (
              <Pressable
                key={store.id}
                style={styles.suggestionChip}
                onPress={() => handlePickStore(store.id)}
              >
                <MText variant="caption" color="primaryLight">
                  {store.name}
                </MText>
              </Pressable>
            ))}
            <Pressable
              style={styles.suggestionChip}
              onPress={() => setPickerVisible(true)}
            >
              <MText variant="caption" color="textSecondary">
                {t("storePicker.allStores")}
              </MText>
            </Pressable>
          </View>
        </View>
      ) : null}

      <StorePickerSheet
        visible={pickerVisible}
        title={t("storePicker.title")}
        subtitle={t("storePicker.subtitle")}
        options={pickerOptions}
        selectedId={linkedStore?.id ?? null}
        cancelLabel={t("cancel")}
        onSelect={handlePickStore}
        onCancel={() => setPickerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    fontSize: 16,
  },
  pickBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  linkedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  suggestions: {
    gap: spacing.xs,
  },
  suggestionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceStrong,
  },
});
