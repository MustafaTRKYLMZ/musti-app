import { MText, radii, spacing, useTheme } from "@musti/ui-native";
import { FC, useRef, useState, useEffect, useMemo } from "react";
import { ScrollView, View, Pressable, StyleSheet } from "react-native";

type PageStripProps = {
  totalPages: number;
  currentPage?: number;
  onPressPage: (page: number) => void;
  orientation?: "horizontal" | "vertical";
  maxVisibleChips?: number;
};

const CHIP_WIDTH = 40;
const CHIP_SPACING = 4;
const VERTICAL_MAX_HEIGHT = 260;

export const PageStrip: FC<PageStripProps> = ({
  totalPages,
  currentPage,
  onPressPage,
  orientation = "horizontal",
  maxVisibleChips,
}) => {
  const { colors } = useTheme();

  const scrollRef = useRef<ScrollView | null>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  const chipLayoutsRef = useRef<
    Record<number, { x: number; y: number; width: number; height: number }>
  >({});

  const MAX_CHIPS = 10000;

  const pages = useMemo(() => {
    if (totalPages <= MAX_CHIPS) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    return Array.from({ length: MAX_CHIPS }, (_, idx) => {
      const ratio = idx / (MAX_CHIPS - 1);
      return Math.round(ratio * (totalPages - 1)) + 1;
    });
  }, [totalPages]);

  const getNearestPage = (target: number, list: number[]) => {
    let best = list[0];
    let bestDiff = Math.abs(best - target);

    for (let i = 1; i < list.length; i++) {
      const diff = Math.abs(list[i] - target);
      if (diff < bestDiff) {
        best = list[i];
        bestDiff = diff;
      }
    }
    return best;
  };

  const isVertical = orientation === "vertical";

  useEffect(() => {
    if (!scrollRef.current || !currentPage) return;
    if (containerSize.width <= 0 || containerSize.height <= 0) return;

    const actualPage = chipLayoutsRef.current[currentPage]
      ? currentPage
      : getNearestPage(currentPage, pages);

    const layout = chipLayoutsRef.current[actualPage];
    if (!layout) return;

    if (isVertical) {
      const chipCenterY = layout.y + layout.height / 2;
      const offsetY = Math.max(0, chipCenterY - containerSize.height / 2);
      scrollRef.current.scrollTo({ y: offsetY, animated: true });
    } else {
      const chipCenterX = layout.x + layout.width / 2;
      const offsetX = Math.max(0, chipCenterX - containerSize.width / 2);
      scrollRef.current.scrollTo({ x: offsetX, animated: true });
    }
  }, [
    currentPage,
    containerSize.width,
    containerSize.height,
    isVertical,
    pages,
  ]);

  const visibleWindowStyle =
    maxVisibleChips && maxVisibleChips > 0
      ? isVertical
        ? {
            maxHeight:
              maxVisibleChips * (CHIP_WIDTH + CHIP_SPACING) +
              spacing.xs * 2 +
              CHIP_SPACING,
          }
        : {
            width:
              maxVisibleChips * CHIP_WIDTH +
              (maxVisibleChips - 1) * CHIP_SPACING +
              spacing.xs * 2,
          }
      : null;

  return (
    <View
      style={[
        styles.pageStripContainer,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
        isVertical && { maxHeight: VERTICAL_MAX_HEIGHT },
        visibleWindowStyle,
      ]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;

        // ✅ Only update state when size actually changes (prevents first-render jump)
        setContainerSize((prev) => {
          if (prev.width === width && prev.height === height) return prev;
          return { width, height };
        });
      }}
    >
      <ScrollView
        ref={scrollRef}
        horizontal={!isVertical}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.pageStripContent,
          isVertical && { alignItems: "center", paddingVertical: spacing.xs },
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
                isVertical
                  ? { marginVertical: CHIP_SPACING / 2 }
                  : { marginHorizontal: CHIP_SPACING / 2 },
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
    alignItems: "center",
    justifyContent: "center",
  },
});
