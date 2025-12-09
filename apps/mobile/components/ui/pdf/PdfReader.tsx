import { MText, iconSizes, colors, radii, spacing } from "@budget/ui-native";
import { Ionicons } from "@expo/vector-icons";
import { FC } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import Pdf from "react-native-pdf";

type PdfReaderProps = {
  isFullscreen: boolean;
  name: string;
  setIsFullscreen: (value: boolean) => void;
  handleClose: () => void;
  source: { uri: string } | number;
  initialPage: number;
  handleLoadComplete: (numberOfPages: number, filePath: string) => void;
  handlePageChanged: (page: number, numberOfPages: number) => void;
};
export const PdfReader: FC<PdfReaderProps> = ({
  isFullscreen,
  name,
  setIsFullscreen,
  handleClose,
  source,
  initialPage,
  handleLoadComplete,
  handlePageChanged,
}) => {
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
};

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
