import { MText, radii, spacing, useTheme } from "@budget/ui-native";
import { FC, useRef, useState, useEffect } from "react";
import { ScrollView, View, Pressable, StyleSheet } from "react-native";

type PageStripProps = {
  totalPages: number;
  currentPage?: number;
  onPressPage: (page: number) => void;
  orientation?: "horizontal" | "vertical";
};

const CHIP_WIDTH = 40;
const CHIP_SPACING = 4;

export const PageStrip: FC<PageStripProps> = ({
  totalPages,
  currentPage,
  onPressPage,
  orientation = "horizontal",
}) => {
  const theme = useTheme();
  const { colors } = theme;

  const scrollRef = useRef<ScrollView | null>(null);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const chipLayoutsRef = useRef<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});

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
    if (!scrollRef.current || !currentPage) return;
    if (containerSize.width <= 0 || containerSize.height <= 0) return;

    const layout = chipLayoutsRef.current[currentPage];
    if (!layout) return;

    const isVertical = orientation === "vertical";

    if (isVertical) {
      const chipCenterY = layout.y + layout.height / 2;
      const offsetY = Math.max(0, chipCenterY - containerSize.height / 2);
      scrollRef.current.scrollTo({ y: offsetY, animated: true });
    } else {
      const chipCenterX = layout.x + layout.width / 2;
      const offsetX = Math.max(0, chipCenterX - containerSize.width / 2);
      scrollRef.current.scrollTo({ x: offsetX, animated: true });
    }
  }, [currentPage, containerSize.width, containerSize.height, orientation]);

  return (
    <View
      style={[
        styles.pageStripContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setContainerSize({ width, height });
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal={orientation !== "vertical"}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.pageStripContent,
          orientation === "vertical" && { alignItems: "center" },
        ]}
      >
        {pages.map((page) => {
          const isActive = page === currentPage;

          return (
            <Pressable
              key={page}
              onPress={() => onPressPage(page)}
              onLayout={(e) => {
                chipLayoutsRef.current[page] = e.nativeEvent.layout;
              }}
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
    borderRadius: radii.lg,
    padding: spacing.xs,
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
