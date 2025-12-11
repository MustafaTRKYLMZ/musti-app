import React, { FC } from "react";
import { View, StyleSheet } from "react-native";
import Pdf from "react-native-pdf";
import { MText, iconSizes, spacing, useTheme } from "@budget/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

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
  const theme = useTheme();
  const { colors } = theme;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isFullscreen ? "#000" : colors.background },
      ]}
    >
      {/* Header only when not fullscreen */}
      {!isFullscreen && (
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.surface,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.borderSubtle,
              shadowColor: colors.shadowStrong,
              shadowOpacity: 0.12,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
            },
          ]}
        >
          <MText
            variant="heading2"
            color="textPrimary"
            style={styles.title}
            numberOfLines={1}
          >
            {name}
          </MText>

          <View style={styles.headerActions}>
            <IconButton
              name="expand-outline"
              size={iconSizes.lg}
              onPress={() => setIsFullscreen(true)}
              style={styles.iconButton}
            />

            <IconButton
              name="close-outline"
              size={iconSizes["xl"]}
              onPress={handleClose}
              style={styles.iconButton}
            />
          </View>
        </View>
      )}

      {/* Fullscreen overlay */}
      {isFullscreen && (
        <View style={styles.fullscreenOverlay}>
          <IconButton
            name="contract-outline"
            size={iconSizes.lg}
            color={colors.textInverse}
            backgroundColor={colors.surfaceStrong}
            padding={spacing.sm}
            onPress={() => setIsFullscreen(false)}
            accessibilityLabel="Exit fullscreen"
          />
        </View>
      )}

      {/* PDF viewer */}
      <View
        style={[
          styles.viewer,
          { backgroundColor: isFullscreen ? "#000" : colors.background },
        ]}
      >
        <Pdf
          source={source}
          style={[
            styles.pdf,
            { backgroundColor: isFullscreen ? "#000" : colors.background },
          ]}
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
  container: {
    flex: 1,
  },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing["xl"],
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 2,
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
  },

  pdf: {
    flex: 1,
    width: "100%",
    height: "100%",
  },

  fullscreenOverlay: {
    position: "absolute",
    top: spacing.lg,
    right: spacing.lg,
    zIndex: 10,
  },
});
