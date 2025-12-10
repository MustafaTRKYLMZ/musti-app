// apps/mobile/app/bookshelf.tsx

import React, { useEffect, useState, useCallback } from "react";
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
import { MText, colors, spacing, iconSizes } from "@budget/ui-native";
import dayjs from "dayjs";

import {
  listLocalPdfs,
  deleteLocalPdf,
  type LocalPdfFile,
} from "@/utils/getPdfsDirectory";
import { PdfModal } from "@/components/ui/pdf/PdfModal";
import { useBooksStore } from "@/store/useBooksStore";
import { useReadingStatsStore } from "@/store/useReadingStatsStore";
import { useReadingPlanStore } from "@/store/useReadingPlanStore";
import { ReadingPlanModal } from "@/components/ui/modals/CreaPlanModal";
import { CurrentPlanCard } from "@/features/books/CurrentPlanCard";
import { BookCard } from "@/components/ui/Books/BookCard";
import { useCurrentPlanInfo } from "@/hooks/useCurrentPlanInfo";
import { AppScreen } from "@/components/AppScreen";
import { BookshelfHeader } from "@/components/BookshelfHeader";

export default function BookshelfScreen() {
  const router = useRouter();
  const [pdfs, setPdfs] = useState<LocalPdfFile[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const progressMap = useBooksStore((s) => s.items);
  const readingStats = useReadingStatsStore((s) => s.stats);

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

  // Daily plan reset/ensure
  useEffect(() => {
    ensureTodayPlan(today);
  }, [ensureTodayPlan, today]);

  // Plan summary + item details (for now we only use summary)
  const { summary: currentPlanInfo } = useCurrentPlanInfo(pdfs);

  const handleOpenModal = () => setModalVisible(true);
  const handleCloseModal = () => setModalVisible(false);

  const handleOpenPlanModal = () => setPlanModalVisible(true);
  const handleClosePlanModal = () => setPlanModalVisible(false);

  // book open
  const handleOpenPdf = (item: LocalPdfFile) => {
    router.push({
      pathname: "/pdf/viewer",
      params: { uri: item.uri, name: item.name },
    });
  };

  // book delete
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

  // plan delete
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

  // plan card -> open related book
  const handlePressPlanCard = () => {
    if (!currentPlanInfo) return;
    if (currentPlanInfo.isCompleted) return;
    if (!currentPlanInfo.currentBookUri) return;

    const book = pdfs.find((b) => b.uri === currentPlanInfo.currentBookUri);
    if (!book) return;

    router.push({
      pathname: "/plan/plan-viewer",
      params: {
        uri: book.uri,
        name: book.name,
        fromPlan: "1",
      },
    });
  };

  // book rename
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
    <AppScreen
      onPressMenu={() => setSidebarOpen(true)}
      headerCenter={
        <BookshelfHeader
          handleOpenModal={handleOpenModal}
          handleOpenPlanModal={handleOpenPlanModal}
        />
      }
    >
      <View style={styles.container}>
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
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
    marginTop: spacing["3xl"],
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
