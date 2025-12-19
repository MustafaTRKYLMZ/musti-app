import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import {
  MText,
  bookshelfTheme,
  spacing,
  radii,
  iconSizes,
} from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";
import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { TargetCard } from "./TargetCard";

const { colors } = bookshelfTheme;

type Props = {
  progressMap: Record<string, any>;
  onOpenCreate: () => void;
};

export function TargetList({ progressMap, onOpenCreate }: Props) {
  const router = useRouter();

  const hydrate = useReadingTargetsStore((s) => s.hydrate);
  const hydrated = useReadingTargetsStore((s) => s.hydrated);
  const targets = useReadingTargetsStore((s) => s.targets);

  const deleteTarget = useReadingTargetsStore((s) => s.deleteTarget);
  const markDone = useReadingTargetsStore((s) => s.markDone);
  const markActive = useReadingTargetsStore((s) => s.markActive);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const active = useMemo(() => {
    return targets
      .filter((t) => t.status === "active")
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [targets]);

  const doneAll = useMemo(() => {
    return targets
      .filter((t) => t.status === "done")
      .sort(
        (a, b) =>
          (b.doneAt ?? b.createdAt ?? 0) - (a.doneAt ?? a.createdAt ?? 0)
      );
  }, [targets]);

  const goDone = () => router.push("/(tabs)/bookshelf/target/done");

  const openBook = (bookUri: string, bookName: string, jumpPage: number) => {
    router.push({
      pathname: "/(tabs)/bookshelf/pdf/viewer",
      params: {
        uri: encodeURIComponent(bookUri),
        name: encodeURIComponent(bookName),
        jumpPage: String(Math.max(1, jumpPage || 1)),
      },
    });
  };

  const getCurrentPage = (bookUri: string) => {
    const v = progressMap[bookUri]?.lastPage ?? 0;
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  };

  const handleRestart = (id: string) => {
    markActive(id);
  };

  const renderTarget = ({ item }: any) => {
    const currentPage = getCurrentPage(item.bookUri);
    return (
      <TargetCard
        target={item}
        currentPage={currentPage}
        onOpen={(t, openPage) => openBook(t.bookUri, t.bookName, openPage)}
        onDelete={(t) => deleteTarget(t.id)}
        onAutoDone={(id) => markDone(id)}
        onRestart={(t) => handleRestart(t.id)}
      />
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <MText variant="heading3">Targets</MText>

        <View style={styles.headerActions}>
          {doneAll.length > 0 ? (
            <Pressable onPress={goDone} style={styles.doneChip}>
              <MText style={styles.doneChipText}>Done ({doneAll.length})</MText>
              <View style={styles.badge}>
                <MText style={styles.badgeText}>{doneAll.length}</MText>
              </View>
            </Pressable>
          ) : null}

          <IconButton
            name="add-circle-outline"
            size={iconSizes.lg}
            color={colors.textPrimary}
            onPress={onOpenCreate}
          />
        </View>
      </View>

      {/* ACTIVE */}
      {active.length === 0 ? (
        <View style={styles.emptyRow}>
          <View style={[styles.empty, { flex: 1 }]}>
            <MText style={{ opacity: 0.8 }}>No active targets.</MText>
            <Pressable onPress={onOpenCreate} style={styles.emptyBtn}>
              <MText style={{ fontWeight: "700" }}>Create one</MText>
            </Pressable>
          </View>
        </View>
      ) : (
        <FlatList
          data={active}
          keyExtractor={(x) => x.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
          }}
          renderItem={renderTarget}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },

  headerRow: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  doneChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
  },
  doneChipText: { fontWeight: "800", opacity: 0.8 },
  badge: {
    minWidth: 22,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.backgroundSecondary,
  },
  badgeText: { fontWeight: "900", opacity: 0.8 },

  emptyRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
  },

  empty: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
    gap: spacing.sm,
  },
  emptyBtn: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
  },

  doneMini: {
    width: 110,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
    alignItems: "flex-start",
    justifyContent: "center",
  },
});
