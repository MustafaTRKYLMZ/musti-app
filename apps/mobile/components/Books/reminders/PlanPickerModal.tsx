import React, { useMemo, useState } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  TextInput,
  FlatList,
} from "react-native";
import { MText, spacing, radii, useTheme, iconSizes } from "/ui-native";
import { BaseIcon, IconButton } from "@/components/ui/AppIcon";
import { useReadingPlanStore } from "@/store/bookshelf/useReadingPlanStore";

type PlanRow = {
  id: string;
  title: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onPick: (plan: PlanRow) => void;
  selectedId?: string;
  title?: string;
};

export function PlanPickerModal({
  visible,
  onClose,
  onPick,
  selectedId,
  title = "Choose plan",
}: Props) {
  const { colors } = useTheme();
  const [q, setQ] = useState("");

  const plans = useReadingPlanStore((s) => s.plans);

  const rows: PlanRow[] = useMemo(() => {
    return (plans ?? [])
      .map((p: any) => ({
        id: String(p.id),
        title: String(p.title ?? p.name ?? "Plan"),
      }))
      .filter((p) => p.id && p.title);
  }, [plans]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((p) => p.title.toLowerCase().includes(query));
  }, [rows, q]);

  const renderItem = ({ item }: { item: PlanRow }) => {
    const selected = selectedId === item.id;

    return (
      <Pressable
        onPress={() => onPick(item)}
        style={[
          styles.row,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: selected ? colors.surfaceStrong : colors.surface,
          },
        ]}
      >
        <View style={{ flex: 1 }}>
          <MText variant="bodyStrong" color="textPrimary" numberOfLines={1}>
            {item.title}
          </MText>
          <MText
            variant="caption"
            color="textSecondary"
            numberOfLines={1}
            style={{ marginTop: 2, opacity: 0.8 }}
          >
            {item.id}
          </MText>
        </View>

        {selected ? (
          <BaseIcon
            name={"checkmark-circle" as any}
            size={iconSizes.md}
            color={colors.success}
          />
        ) : (
          <BaseIcon
            name={"chevron-forward" as any}
            size={iconSizes.md}
            color={colors.textSecondary}
          />
        )}
      </Pressable>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose} />

      <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
        <View style={styles.header}>
          <MText variant="heading3" color="textPrimary">
            {title}
          </MText>
          <IconButton
            name="close-outline"
            size={22}
            color={colors.textPrimary}
            onPress={onClose}
          />
        </View>

        <View
          style={[
            styles.search,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <BaseIcon
            name={"search-outline" as any}
            size={iconSizes.md}
            color={colors.textSecondary}
          />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search plan…"
            placeholderTextColor={colors.textSecondary}
            style={{ flex: 1, color: colors.textPrimary }}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {q.length > 0 ? (
            <Pressable onPress={() => setQ("")} hitSlop={8}>
              <BaseIcon
                name={"close-circle" as any}
                size={iconSizes.md}
                color={colors.textSecondary}
              />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: spacing.lg }}
          ListEmptyComponent={
            <View style={{ padding: spacing.lg, opacity: 0.8 }}>
              <MText color="textSecondary">No plans found.</MText>
            </View>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  sheet: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    top: spacing["6xl"] ?? 64,
    bottom: spacing["6xl"] ?? 64,
    borderRadius: radii.xl,
    overflow: "hidden",
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  search: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  row: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
});
