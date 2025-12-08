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
  const [lastPageInSession, setLastPageInSession] = useState(1);

  const progressMap = useBooksStore((s) => s.items);
  const setProgress = useBooksStore((s) => s.setProgress);
  const currentProgress = uri ? progressMap[uri] : undefined;

  const addPages = useReadingStatsStore((s) => s.addPages);

  const today = dayjs().format("YYYY-MM-DD");

  // Başlangıç sayfasını sadece kitap progresine göre ayarla
  useEffect(() => {
    if (currentProgress?.lastPage && currentProgress.lastPage > 0) {
      setInitialPage(currentProgress.lastPage);
      setLastPageInSession(currentProgress.lastPage);
    } else {
      setInitialPage(1);
      setLastPageInSession(1);
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
    console.log("PDF loaded, total pages:", pages);

    // totalPages bilgisini güncelle, lastPage'i bozma
    setProgress({
      uri,
      name,
      lastPage: currentProgress?.lastPage ?? 1,
      totalPages: pages,
    });
  };

  const handlePageChanged = (page: number, total: number) => {
    console.log(`Page: ${page} / ${total}`);

    const delta = Math.max(0, page - lastPageInSession);
    if (delta <= 0) {
      // geri gitme / aynı sayfada kalma → istatistik yok
      setLastPageInSession(page);
      return;
    }

    // Kitap progresini güncelle
    setProgress({
      uri,
      name,
      lastPage: page,
      totalPages: total,
    });

    // Günlük istatistik (kitap bazlı)
    addPages({
      bookUri: uri,
      date: today,
      pages: delta,
    });

    setLastPageInSession(page);
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

            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.iconButton}
            >
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
