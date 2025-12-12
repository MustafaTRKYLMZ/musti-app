import { MText, radii, spacing, useTheme } from "@budget/ui-native";
import { FC, useRef, useState, useEffect } from "react";
import { ScrollView, View, Pressable, StyleSheet } from "react-native";

type PageStripProps = {
  totalPages: number;
  currentPage?: number;
  onPressPage: (page: number) => void;
};

const CHIP_WIDTH = 40;
const CHIP_SPACING = 4;

export const PageStrip: FC<PageStripProps> = ({
  totalPages,
  currentPage,
  onPressPage,
}) => {
  const theme = useTheme();
  const { colors } = theme;
  const scrollRef = useRef<ScrollView | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const MAX_CHIPS = 300;

  const buildPages = () => {
    if (totalPages <= MAX_CHIPS) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    return Array.from({ length: MAX_CHIPS }, (_, idx) => {
      const ratio = idx / (MAX_CHIPS - 1);
      return Math.round(ratio * (totalPages - 1)) + 1;
    });
  };

  const pages = buildPages();

  useEffect(() => {
    if (!scrollRef.current || !currentPage || containerWidth <= 0) return;

    const index = pages.findIndex((p) => p === currentPage);
    if (index === -1) return;

    const chipCenterX =
      index * (CHIP_WIDTH + CHIP_SPACING) + CHIP_WIDTH / 2 + CHIP_SPACING;

    const offsetX = Math.max(0, chipCenterX - containerWidth / 2);

    scrollRef.current.scrollTo({ x: offsetX, animated: true });
  }, [currentPage, containerWidth, totalPages]);

  return (
    <View
      style={[
        styles.pageStripContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pageStripContent}
      >
        {pages.map((page) => {
          const isActive = page === currentPage;

          return (
            <Pressable
              key={page}
              onPress={() => onPressPage(page)}
              style={[
                styles.pageChip,
                {
                  backgroundColor: isActive
                    ? colors.primary
                    : colors.background,
                  borderColor: isActive ? colors.primary : colors.borderSubtle,
                },
              ]}
            >
              <MText
                variant="caption"
                color={isActive ? "textInverse" : "textSecondary"}
              >
                {page}
              </MText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  pageStripContainer: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.full,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xs,
  },
  pageStripContent: {
    paddingHorizontal: spacing.xs,
    alignItems: "center",
  },
  pageChip: {
    width: CHIP_WIDTH,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: CHIP_SPACING / 2,
    alignItems: "center",
    justifyContent: "center",
  },
});
