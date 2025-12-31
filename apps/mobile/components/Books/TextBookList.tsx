import React from "react";
import { Alert, Pressable, StyleSheet, View } from "react-native";
import {
  bookshelfTheme,
  MText,
  spacing,
  radii,
  iconSizes,
} from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

export type TextBookListItem = {
  id: string;
  title: string;
  createdAt: number;
  uri: string;
};

type Props = {
  items: TextBookListItem[];
  onOpen: (item: TextBookListItem) => void;
  onDelete: (item: TextBookListItem) => void;
};

const bColors = bookshelfTheme.colors;

export function TextBookList({ items, onOpen, onDelete }: Props) {
  if (!items.length) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <MText style={styles.sectionTitle}>Text Books</MText>
      </View>

      <View style={{ height: spacing.sm }} />

      <View style={styles.list}>
        {items.map((it) => (
          <Pressable
            key={it.id}
            onPress={() => onOpen(it)}
            style={({ pressed }) => [styles.row, pressed && { opacity: 0.8 }]}
          >
            <View style={{ flex: 1 }}>
              <MText style={styles.title} numberOfLines={1}>
                {it.title}
              </MText>
              <MText
                color="textSecondary"
                style={styles.meta}
                numberOfLines={1}
              >
                {new Date(it.createdAt).toLocaleString()}
              </MText>
            </View>

            <IconButton
              name="trash-outline"
              size={iconSizes.lg}
              color={bColors.textPrimary}
              onPress={() => {
                Alert.alert("Delete", `Delete "${it.title}"?`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => onDelete(it),
                  },
                ]);
              }}
            />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: bColors.textPrimary },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: bColors.surface,
    borderWidth: 1,
    borderColor: bColors.borderSubtle,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  title: { fontSize: 15, fontWeight: "600", color: bColors.textPrimary },
  meta: { fontSize: 12 },
});
