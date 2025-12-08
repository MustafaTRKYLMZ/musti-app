// apps/mobile/app/bookshelf.tsx

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import { MText, colors, spacing, radii, iconSizes } from "@budget/ui-native";
import dayjs from "dayjs";

import {
  listLocalPdfs,
  deleteLocalPdf,
  type LocalPdfFile,
} from "@/utils/getPdfsDirectory";
import { PdfModal } from "@/components/ui/pdf/PdfModal";
import { useBooksStore } from "@/store/useBooksStore";
import { useReadingStatsStore } from "@/store/useReadingStatsStore";
import {
  useReadingPlanStore,
  type ActiveReadingPlan,
} from "@/store/useReadingPlanStore";
import { ReadingPlanModal } from "@/components/ui/modals/ReadingModal";
import { CurrentPlanCard } from "@/features/books/CurrentPlanCard";
import { BookCard } from "@/components/ui/Books/BookCard";

export default function BookshelfScreen() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<LocalPdfFile[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);

  const progressMap = useBooksStore((s) => s.items);
  const readingStats = useReadingStatsStore((s) => s.stats);

  const activePlan = useReadingPlanStore((s) => s.activePlan);
  const clearActivePlan = useReadingPlanStore((s) => s.clearActivePlan);
  const ensureTodayPlan = useReadingPlanStore((s) => s.ensureTodayPlan);

  const today = dayjs().format("YYYY-MM-DD");

  const loadPdfs = useCallback(async () => {
    const all = await listLocalPdfs();
    setPdfs(all);
  }, []);

  useEffect(() => {
    loadPdfs();
  }, [loadPdfs]);

  // planı günlük modda tut: gün değiştiğinde progress reset
  useEffect(() => {
    ensureTodayPlan(today);
  }, [ensureTodayPlan, today]);

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  const handleOpenPlanModal = () => setPlanModalVisible(true);
  const handleClosePlanModal = () => setPlanModalVisible(false);

  const handleOpenPdf = (item: LocalPdfFile) => {
    router.push({
      pathname: "/pdf/viewer",
      params: { uri: item.uri, name: item.name },
    });
  };

  const handleDeletePdf = (item: LocalPdfFile) => {
    Alert.alert(
      "Delete PDF",
      `Are you sure you want to delete "${item.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await deleteLocalPdf(item.uri);
            loadPdfs();
          },
        },
      ]
    );
  };

  const handleDeletePlan = () => {
    Alert.alert(
      "Delete plan",
      "Are you sure you want to clear the current plan?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            clearActivePlan();
          },
        },
      ]
    );
  };

  const currentPlanInfo = useMemo(() => {
    if (!activePlan || activePlan.items.length === 0) return null;

    const plan: ActiveReadingPlan = activePlan;

    const totalPagesInPlan = plan.items.reduce(
      (sum, it) => sum + it.pagesPerDay,
      0
    );

    const pagesCompletedBeforeCurrent = plan.items
      .slice(0, plan.currentIndex)
      .reduce((sum, it) => sum + it.pagesPerDay, 0);

    const totalCompleted = pagesCompletedBeforeCurrent + plan.currentPageInItem;

    const currentItem =
      plan.currentIndex < plan.items.length
        ? plan.items[plan.currentIndex]
        : plan.items[plan.items.length - 1];

    const remainingInItem = currentItem.pagesPerDay - plan.currentPageInItem;

    const currentBookName = currentItem.bookName || currentItem.bookUri;

    // Kitap nesnesini bul (URI'den)
    const currentBook = pdfs.find((b) => b.uri === currentItem.bookUri);

    return {
      name: plan.name,
      totalCompleted,
      totalPagesInPlan,
      currentBookName: currentBook?.name ?? currentBookName,
      currentBookUri: currentItem.bookUri,
      remainingInItem,
      isCompleted: plan.isCompletedForToday,
    };
  }, [activePlan, pdfs]);

  const handlePressPlanCard = () => {
    if (!currentPlanInfo) return;
    if (currentPlanInfo.isCompleted) return;
    if (!currentPlanInfo.currentBookUri) return;

    const book = pdfs.find((b) => b.uri === currentPlanInfo.currentBookUri);
    if (!book) return;

    router.push({
      pathname: "/pdf/viewer",
      params: {
        uri: book.uri,
        name: book.name,
        fromPlan: "1",
      },
    });
  };

  // kitap rename
  async function renameBook(file: LocalPdfFile, newName: string) {
    try {
      const parts = file.name.split(".");
      const ext = parts.length > 1 ? parts[parts.length - 1] : "";
      const baseNewName = newName.trim();

      const finalName = ext
        ? baseNewName.endsWith(`.${ext}`)
          ? baseNewName
          : `${baseNewName}.${ext}`
        : baseNewName;

      const lastSlashIndex = file.uri.lastIndexOf("/");
      const dirUri = file.uri.slice(0, lastSlashIndex + 1);
      const newUri =
        dirUri + encodeURIComponent(finalName).replace(/%2F/g, "/");

      console.log("Renaming PDF:", { from: file.uri, to: newUri });

      await FileSystem.moveAsync({
        from: file.uri,
        to: newUri,
      });

      await loadPdfs();
    } catch (e) {
      console.warn("Rename error", e);
      Alert.alert(
        "Rename failed",
        "Could not rename this file. Please try a different name."
      );
    }
  }

  return (
    <View style={styles.container}>
      {/* Header with back + title + add + plan */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="arrow-back-outline"
              size={iconSizes.lg}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <MText variant="heading1" style={styles.headerTitle}>
            Bookshelf
          </MText>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={handleOpenPlanModal}
            style={styles.planButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="list-outline"
              size={iconSizes.lg}
              color={colors.textPrimary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleOpenModal}
            style={styles.addButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="add-circle-outline"
              size={iconSizes.xl}
              color={colors.success}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Current plan summary */}
      <CurrentPlanCard
        currentPlanInfo={currentPlanInfo}
        onPress={handlePressPlanCard}
        onDeletePlan={handleDeletePlan}
      />

      {/* Books list */}
      {pdfs.length === 0 ? (
        <View style={styles.emptyState}>
          <MText color="textSecondary">
            No books yet. Use the plus button to add one.
          </MText>
        </View>
      ) : (
        <FlatList
          data={pdfs}
          keyExtractor={(item) => item.uri}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const progress = progressMap[item.uri];
            const statKey = `${item.uri}:${today}`;
            const todayStat = readingStats[statKey];

            return (
              <BookCard
                file={item}
                onOpen={() => handleOpenPdf(item)}
                onDelete={() => handleDeletePdf(item)}
                lastPage={progress?.lastPage}
                totalPages={progress?.totalPages}
                todayPages={todayStat?.pagesRead}
                todayTargetPages={todayStat?.targetPages}
                onRename={(newName) => renameBook(item, newName)}
              />
            );
          }}
        />
      )}

      <PdfModal
        visible={modalVisible}
        onClose={handleCloseModal}
        onPdfImported={() => {
          handleCloseModal();
          loadPdfs();
        }}
      />

      <ReadingPlanModal
        visible={planModalVisible}
        onClose={handleClosePlanModal}
        books={pdfs}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
    marginTop: spacing["3xl"],
  },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerTitle: {
    flexShrink: 1,
  },
  planButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  addButton: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
