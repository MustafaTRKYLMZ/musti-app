import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { MText, bookshelfTheme } from "@musti/ui-native";
import { useTranslation } from "@musti/core";

import { BookshelfSubScreen } from "@/components/Books/BookshelfSubScreen";
import { bookshelfScreenStyles } from "@/components/Books/bookshelfScreenStyles";
import { TargetCard } from "@/components/Books/TargetCard";

import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { useToast } from "@/components/ui/ToastProvider";
import { ReadingTarget } from "@musti/core";

const { spacing } = bookshelfTheme;

export default function DoneTargetsScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const hydrate = useReadingTargetsStore((s) => s.hydrate);
  const hydrated = useReadingTargetsStore((s) => s.hydrated);

  const targets = useReadingTargetsStore((s) => s.targets);
  const deleteTarget = useReadingTargetsStore((s) => s.deleteTarget);

  const restartItem = useReadingTargetsStore((s) => s.restartItem);

  const { showToast } = useToast();
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  const done = useMemo(() => {
    return targets
      .filter((t) => t.status === "done")
      .sort(
        (a, b) =>
          (b.doneAt ?? b.createdAt ?? 0) - (a.doneAt ?? a.createdAt ?? 0)
      );
  }, [targets]);

  const handleRestart = async (target: ReadingTarget) => {
    for (const it of target.items) {
      await restartItem(target.id, it.id);
    }
    showToast({
      title: t("bookshelf.doneScreen.restarted"),
      message: t("bookshelf.doneScreen.startNow"),
      actions: [
        { label: t("bookshelf.doneScreen.later"), onPress: () => {} },
        {
          label: t("bookshelf.doneScreen.readNow"),
          onPress: () => {
            router.push({
              pathname: "/(tabs)/bookshelf/target/target-viewer",
              params: { targetId: target.id },
            });
          },
        },
      ],
      duration: 6000,
    });
  };

  const markItemDone = useReadingTargetsStore((s) => s.markItemDone);

  return (
    <BookshelfSubScreen
      title={t("bookshelf.doneScreen.title")}
      scroll={false}
      contentContainerStyle={styles.listWrap}
    >
      {done.length === 0 ? (
        <View style={bookshelfScreenStyles.listCard}>
          <MText variant="body" color="textSecondary">
            {t("bookshelf.doneScreen.empty")}
          </MText>
        </View>
      ) : (
        <FlatList
          data={done}
          keyExtractor={(x) => x.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TargetCard
              target={item}
              disableOpen
              onOpen={() => {}}
              onDelete={(t) => deleteTarget(t.id)}
              onAutoDoneItem={(targetId, itemId) =>
                markItemDone(targetId, itemId)
              }
              onRestart={(t) => handleRestart(t)}
            />
          )}
        />
      )}
    </BookshelfSubScreen>
  );
}

const styles = StyleSheet.create({
  listWrap: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  list: {
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
});
