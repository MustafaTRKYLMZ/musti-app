import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { MText, bookshelfTheme, iconSizes } from "@budget/ui-native";

import { AppScreen } from "@/components/AppScreen";
import { IconButton } from "@/components/ui/AppIcon";
import { TargetCard } from "@/components/Books/TargetCard";

import {
  useReadingTargetsStore,
  type ReadingTarget,
} from "@/store/bookshelf/useReadingTargetsStore";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";
import { AppSwitcherButton } from "@/components/AppSwitcherButton";

const { colors, spacing, radii } = bookshelfTheme;

const bColors = bookshelfTheme.colors;
const bSpacing = bookshelfTheme.spacing;
const bRadii = bookshelfTheme.radii;

const bookshelfHeaderStyles = StyleSheet.create({
  safe: { paddingHorizontal: bSpacing.md, paddingVertical: bSpacing.sm },
  header: {
    borderBottomWidth: 0,
    backgroundColor: bColors.surface,
    borderRadius: bRadii.md,
    borderWidth: 1,
    borderColor: bColors.borderSubtle,
    shadowColor: bColors.shadowStrong,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { fontWeight: "600" },
});

export default function DoneTargetsScreen() {
  const router = useRouter();

  const hydrate = useReadingTargetsStore((s) => s.hydrate);
  const hydrated = useReadingTargetsStore((s) => s.hydrated);

  const targets = useReadingTargetsStore((s) => s.targets);
  const deleteTarget = useReadingTargetsStore((s) => s.deleteTarget);

  // ✅ v2 store APIs
  const restartItem = useReadingTargetsStore((s) => s.restartItem);
  //   const markTargetActive = useReadingTargetsStore((s) => s.markTargetActive);

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

  const handleRestart = async (t: ReadingTarget) => {
    // group restart (senin store'da nasıl yaptığını biliyorum)
    // await markTargetActive(t.id);
    for (const it of t.items) {
      await restartItem(t.id, it.id);
    }

    router.push({
      pathname: "/(tabs)/bookshelf/target/target-viewer",
      params: { targetId: t.id },
    });
  };

  const markItemDone = useReadingTargetsStore((s) => s.markItemDone);

  return (
    <AppScreen
      title="Done Targets"
      headerContainerStyle={bookshelfHeaderStyles.header}
      headerLeft={
        <IconButton
          name="chevron-back"
          size={iconSizes.lg}
          color={colors.textPrimary}
          onPress={() => router.back()}
        />
      }
      headerRight={<AppSwitcherButton />}
    >
      <View style={styles.container}>
        {done.length === 0 ? (
          <View style={styles.empty}>
            <MText style={{ opacity: 0.8 }}>No done targets yet.</MText>
          </View>
        ) : (
          <FlatList
            data={done}
            keyExtractor={(x) => x.id}
            contentContainerStyle={styles.list}
            renderItem={({ item }) => (
              <TargetCard
                target={item}
                onOpen={(t, it, openPage) =>
                  openBook(it.bookUri, it.bookName, openPage)
                }
                onDelete={(t) => deleteTarget(t.id)}
                onAutoDoneItem={(targetId, itemId) =>
                  markItemDone(targetId, itemId)
                }
                onRestart={(t) => handleRestart(t)}
              />
            )}
          />
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  list: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  empty: {
    margin: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    padding: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
});
