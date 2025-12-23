import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, StyleSheet, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import dayjs from "dayjs";
import {
  MText,
  bookshelfTheme,
  spacing,
  radii,
  iconSizes,
} from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { useReadingStatsStore } from "@/store/bookshelf/useReadingStatsStore";
import { useReadingEventsStore } from "@/store/bookshelf/useReadingEventsStore";

import { TargetCard } from "./TargetCard";
import { EditTargetModal } from "@/components/ui/modals/EditTargetModal";
import { DoneTargetsShortcut } from "./DoneTargetsShortcut";
import type { ReadingTarget, ReadingEvent, ReadingMode } from "@budget/core";

const { colors } = bookshelfTheme;

type TargetListProps = {
  onOpenCreate: () => void;
  onOpenChapters: (bookUri: string, bookName: string) => void;
};

const makeTargetKey = (targetId: string, date: string) =>
  `${targetId}::${date}`;

const sumMinutesFromEvents = (events: ReadingEvent[]) => {
  // durationMs optional olabilir
  const totalMs = (events ?? []).reduce((acc, e) => {
    const ms = (e as any)?.durationMs;
    if (typeof ms === "number" && Number.isFinite(ms) && ms > 0)
      return acc + ms;
    return acc;
  }, 0);
  return Math.max(0, Math.round(totalMs / 60000));
};

export const TargetList = ({
  onOpenCreate,
  onOpenChapters,
}: TargetListProps) => {
  const router = useRouter();
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  const hydrate = useReadingTargetsStore((s) => s.hydrate);
  const hydrated = useReadingTargetsStore((s) => s.hydrated);

  const targets = useReadingTargetsStore((s) => s.targets);
  const deleteTarget = useReadingTargetsStore((s) => s.deleteTarget);
  const markItemDone = useReadingTargetsStore((s) => s.markItemDone);
  const setActiveItem = useReadingTargetsStore((s) => s.setActiveItem);

  // pages: target-level stats store (senin mevcut mantığın)
  const byTargetDate = useReadingStatsStore((s) => s.byTargetDate);

  // minutes: events store (durationMs üzerinden)
  const events = useReadingEventsStore((s) => s.events);

  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // ✅ local date (Amsterdam-safe)
  const today = useMemo(() => dayjs().format("YYYY-MM-DD"), []);

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

  /**
   * ✅ Target card "Today pages"
   * - ONLY this target's reading
   * - ONLY mode:"target"
   */
  const getTodayTargetPagesForTarget = useCallback(
    (target: ReadingTarget) => {
      if (!target?.id) return 0;
      const key = makeTargetKey(target.id, today);
      const stat = byTargetDate?.[key];

      const n = stat?.pagesByMode?.target ?? 0;
      return Math.max(0, Math.floor(Number(n) || 0));
    },
    [byTargetDate, today]
  );

  /**
   * ✅ Target card "Today minutes"
   * - events filtered by date + mode:"target" + targetId
   */
  const getTodayTargetMinutesForTarget = useCallback(
    (target: ReadingTarget) => {
      if (!target?.id) return 0;

      const relevant = (events ?? []).filter((e) => {
        if (!e) return false;
        if (e.date !== today) return false;
        if ((e.mode as ReadingMode) !== "target") return false;
        if ((e.targetId ?? "") !== target.id) return false;
        return true;
      });

      return sumMinutesFromEvents(relevant);
    },
    [events, today]
  );

  const renderTarget = ({ item }: { item: ReadingTarget }) => {
    const todayPages = getTodayTargetPagesForTarget(item);
    const todayMinutes = getTodayTargetMinutesForTarget(item);

    return (
      <TargetCard
        target={item}
        todayPages={todayPages}
        todayMinutes={todayMinutes}
        onBeforeOpen={async (targetId, itemId) => {
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
        onEditTarget={(t) => setEditTargetId(t.id)}
      />
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <MText variant="heading3">Targets</MText>

        <View style={styles.headerRight}>
          <IconButton
            name="add-circle-outline"
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

          <DoneTargetsShortcut
            count={doneAll.length}
            onPress={() => router.push("/(tabs)/bookshelf/target/done")}
          />
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
              <DoneTargetsShortcut
                count={doneAll.length}
                onPress={() => router.push("/(tabs)/bookshelf/target/done")}
              />
            ) : null
          }
        />
      )}

      <EditTargetModal
        visible={!!editTargetId}
        targetId={editTargetId}
        onClose={() => setEditTargetId(null)}
        onOpenChapters={onOpenChapters}
      />
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
  emptyRow: { flexDirection: "row", gap: spacing.sm },
});
