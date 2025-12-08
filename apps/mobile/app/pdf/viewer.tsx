import React, { useEffect, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import Pdf from "react-native-pdf";
import { Ionicons } from "@expo/vector-icons";
import { MText, colors, spacing, iconSizes, radii } from "@budget/ui-native";
import dayjs from "dayjs";

import { useBooksStore } from "@/store/useBooksStore";
import { useReadingStatsStore } from "@/store/useReadingStatsStore";

export default function PdfViewerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ uri?: string; name?: string }>();

  const uri = params.uri as string | undefined;
  const name = (params.name as string) || "PDF";

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [initialPage, setInitialPage] = useState(1);

  const progressMap = useBooksStore((s) => s.items);
  const setProgress = useBooksStore((s) => s.setProgress);
  const currentProgress = uri ? progressMap[uri] : undefined;

  const addPages = useReadingStatsStore((s) => s.addPages);
  const today = dayjs().format("YYYY-MM-DD");

  // Oturumun başlarken hangi sayfadan başladığını snapshot al
  const [sessionStartPage] = useState<number>(
    currentProgress?.lastPage && currentProgress.lastPage > 0
      ? currentProgress.lastPage
      : 1
  );

  // Oturum boyunca geldiğin son sayfa
  const [sessionLastPage, setSessionLastPage] = useState<number>(
    currentProgress?.lastPage && currentProgress.lastPage > 0
      ? currentProgress.lastPage
      : 1
  );

  // PDF total page sayısı
  const [total, setTotal] = useState<number>(currentProgress?.totalPages ?? 0);

  // Başlangıç sayfasını kitap progresine göre ayarla
  useEffect(() => {
    if (currentProgress?.lastPage && currentProgress.lastPage > 0) {
      setInitialPage(currentProgress.lastPage);
    } else {
      setInitialPage(1);
    }
  }, [currentProgress]);

  if (!uri) {
    return (
      <View style={styles.container}>
        <MText variant="body" color="textPrimary">
          Invalid PDF path
        </MText>
      </View>
    );
  }

  const source = { uri, cache: true };

  const handleLoadComplete = (pages: number) => {
    // Sadece local state'e yaz
    setTotal(pages);
  };

  const handlePageChanged = (page: number, totalPages: number) => {
    // Sadece local state güncelle
    if (sessionLastPage === page && total === totalPages) {
      return;
    }

    setSessionLastPage(page);
    setTotal(totalPages);

    console.log("Page changed:", page, "of", totalPages);
  };

  const handleClose = () => {
    // 1) Kitap progresini kaydet
    setProgress({
      uri,
      name,
      lastPage: sessionLastPage,
      totalPages: total || currentProgress?.totalPages || undefined,
    });

    // 2) Bugünkü okunan sayfa sayısını hesapla
    const delta = Math.max(0, sessionLastPage - sessionStartPage);

    if (delta > 0) {
      addPages({
        bookUri: uri,
        date: today,
        pages: delta,
      });
    }

    router.back();
  };

  return (
    <View
      style={[styles.container, isFullscreen && styles.containerFullscreen]}
    >
      {/* Header only when not fullscreen */}
      {!isFullscreen && (
        <View style={styles.header}>
          <MText
            variant="heading1"
            color="textPrimary"
            style={styles.title}
            numberOfLines={1}
          >
            {name}
          </MText>

          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setIsFullscreen(true)}
              style={styles.iconButton}
            >
              <Ionicons
                name="expand-outline"
                size={iconSizes.lg}
                color={colors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleClose} style={styles.iconButton}>
              <Ionicons
                name="close-outline"
                size={iconSizes.lg}
                color={colors.textPrimary}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            onPress={() => setIsFullscreen(false)}
            style={styles.fullscreenButton}
          >
            <Ionicons
              name="contract-outline"
              size={iconSizes.lg}
              color={colors.textInverse}
            />
          </TouchableOpacity>
        </View>
      )}

      {/* PDF viewer */}
      <View style={[styles.viewer, isFullscreen && styles.viewerFullscreen]}>
        <Pdf
          source={source}
          style={[styles.pdf, isFullscreen && styles.pdfFullscreen]}
          horizontal
          enablePaging
          page={initialPage}
          onLoadComplete={handleLoadComplete}
          onError={(error) => console.log("PDF error:", error)}
          onPageChanged={handlePageChanged}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Normal mode
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Fullscreen mode
  containerFullscreen: {
    backgroundColor: "#000",
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    flex: 1,
    marginRight: spacing.md,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconButton: {
    marginLeft: spacing.sm,
  },

  viewer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  viewerFullscreen: {
    backgroundColor: "#000",
  },

  pdf: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: colors.background,
  },
  pdfFullscreen: {
    backgroundColor: "#000",
  },

  fullscreenOverlay: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
  fullscreenButton: {
    padding: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: "rgba(0,0,0,0.7)",
  },
});
