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
import { IconButton, IconTile } from "@/components/ui/AppIcon";
import {
  useReadingTargetsStore,
  type ReadingTarget,
} from "@/store/bookshelf/useReadingTargetsStore";
import { TargetCard } from "./TargetCard";

const { colors } = bookshelfTheme;

type TargetListProps = {
  onOpenCreate: () => void;
};

export const TargetList = ({ onOpenCreate }: TargetListProps) => {
  const router = useRouter();

  const hydrate = useReadingTargetsStore((s) => s.hydrate);
  const hydrated = useReadingTargetsStore((s) => s.hydrated);

  const targets = useReadingTargetsStore((s) => s.targets);

  const deleteTarget = useReadingTargetsStore((s) => s.deleteTarget);
  const markItemDone = useReadingTargetsStore((s) => s.markItemDone);

  // ✅ moved here (TargetCard is UI only now)
  const setActiveItem = useReadingTargetsStore((s) => s.setActiveItem);

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

  const renderTarget = ({ item }: { item: ReadingTarget }) => {
    return (
      <TargetCard
        target={item}
        onBeforeOpen={async (targetId, itemId) => {
          // ✅ store side-effect here
          await setActiveItem(targetId, itemId);
        }}
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

        <View style={styles.headerRight}>
          <IconButton
            name="add"
            size={iconSizes.lg}
            color={colors.textPrimary}
            onPress={onOpenCreate}
          />
        </View>
      </View>

      {active.length === 0 ? (
        <View style={styles.emptyRow}>
          <View style={[styles.empty, { flex: 1 }]}>
            <MText style={{ opacity: 0.8 }}>No active targets.</MText>
            <Pressable onPress={onOpenCreate} style={styles.emptyBtn}>
              <MText style={{ fontWeight: "800" }}>Create one</MText>
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
            alignItems: "stretch",
          }}
          renderItem={renderTarget}
          ListFooterComponent={
            doneAll.length > 0 ? (
              <Pressable
                onPress={() => router.push("/(tabs)/bookshelf/target/done")}
                style={[styles.doneMini, { marginLeft: spacing.sm }]}
              >
                <View style={styles.doneIconWrap}>
                  <IconButton
                    name="checkmark"
                    size={iconSizes.md}
                    color={colors.textPrimary}
                  />
                </View>

                <View
                  style={{ flex: 1, flexDirection: "row", gap: spacing.sm }}
                >
                  <MText style={{ fontWeight: "900" }}>Done</MText>
                  <MText style={{ opacity: 0.7, marginTop: 2 }}>
                    {doneAll.length}
                  </MText>
                </View>

                <IconButton
                  name="chevron-forward"
                  size={iconSizes.md}
                  color={colors.textPrimary}
                  onPress={() => router.push("/(tabs)/bookshelf/target/done")}
                />
              </Pressable>
            ) : null
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: spacing.xl },

  headerRow: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },

  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
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

  // ✅ improved Done button (mini card / chip)
  doneMini: {
    minWidth: 150,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  doneIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
});
