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
import {
  useReadingTargetsStore,
  type ReadingTarget,
} from "@/store/bookshelf/useReadingTargetsStore";
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
  const markItemDone = useReadingTargetsStore((s) => s.markItemDone);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const active = useMemo(() => {
    return targets
      .filter((t) => t.status === "active")
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }, [targets]);

  const doneAll = useMemo(
    () =>
      targets
        .filter((t) => t.status === "done")
        .sort(
          (a, b) =>
            (b.doneAt ?? b.createdAt ?? 0) - (a.doneAt ?? a.createdAt ?? 0)
        ),
    [targets]
  );

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

  const renderTarget = ({ item }: { item: ReadingTarget }) => {
    return (
      <TargetCard
        target={item}
        progressMap={progressMap}
        onOpen={(t) => {
          router.push({
            pathname: "/(tabs)/bookshelf/target/target-viewer",
            params: { targetId: t.id },
          });
        }}
        onDelete={(t) => deleteTarget(t.id)}
        onAutoDoneItem={(targetId, itemId) => markItemDone(targetId, itemId)}
      />
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <MText variant="heading3">Targets</MText>
        <IconButton
          name="add"
          size={iconSizes.lg}
          color={colors.textPrimary}
          onPress={onOpenCreate}
        />
      </View>

      {active.length === 0 ? (
        <View style={styles.emptyRow}>
          <View style={[styles.empty, { flex: 1 }]}>
            <MText style={{ opacity: 0.8 }}>No active targets.</MText>
            <Pressable onPress={onOpenCreate} style={styles.emptyBtn}>
              <MText style={{ fontWeight: "800" }}>Create one</MText>
            </Pressable>
          </View>

          {doneAll.length > 0 ? (
            <Pressable
              onPress={() => router.push("/(tabs)/bookshelf/target/done")}
              style={styles.doneMini}
            >
              <MText style={{ fontWeight: "900" }}>Done</MText>
              <MText style={{ opacity: 0.75, marginTop: 4 }}>
                {doneAll.length}
              </MText>
              <MText style={{ opacity: 0.65, marginTop: 2 }}>See all</MText>
            </Pressable>
          ) : null}
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

      {/* ✅ done yolu active varken de görünsün */}
      {active.length > 0 && doneAll.length > 0 ? (
        <View style={styles.doneInlineRow}>
          <Pressable
            onPress={() => router.push("/(tabs)/bookshelf/target/done")}
            style={styles.doneInlineBtn}
          >
            <MText style={{ fontWeight: "900" }}>Done ({doneAll.length})</MText>
            <MText style={{ opacity: 0.7 }}>See all</MText>
          </Pressable>
        </View>
      ) : null}
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

  empty: {
    marginHorizontal: spacing.lg,
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

  emptyRow: {
    flexDirection: "row",
    gap: spacing.sm,
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

  doneInlineRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.sm,
  },
  doneInlineBtn: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
