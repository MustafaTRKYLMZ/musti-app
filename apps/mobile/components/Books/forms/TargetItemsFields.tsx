import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MText, spacing, radii, useTheme } from "@musti/ui-native";

import { TargetItemsList } from "@/components/Books/TargetItemsList";

type Props = {
  visible: boolean; // selectedBook varsa true geç
  canAddItem: boolean;
  addItemLabel: string;
  onAddItem: () => void;

  items: any[];
  onDeleteItem: (itemId: string) => void;
};

export function TargetItemsFields({
  visible,
  canAddItem,
  addItemLabel,
  onAddItem,
  items,
  onDeleteItem,
}: Props) {
  const { colors } = useTheme();

  if (!visible) return null;

  return (
    <View>
      <Pressable
        onPress={onAddItem}
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
        <MText style={{ fontWeight: "900" }}>{addItemLabel}</MText>
      </Pressable>

      {items?.length ? (
        <TargetItemsList items={items} onDeleteItem={onDeleteItem} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cta: {
    marginTop: spacing.lg,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
