import React, { FC, useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from "react-native";
import { MText, plannerTheme, spacing, radii, sizes } from "@musti/ui-native";

const { colors } = plannerTheme;

export type DayInlineItem = {
  color: string;
  title: string;
};

export type DayBar = {
  id: string;
  color: string;
  contL: boolean;
  contR: boolean;
  title: string | null;
  row: number;
};

type Props = {
  date: Date;
  width: number;
  height: number;

  isToday?: boolean;
  isSelected?: boolean;
  isOutside?: boolean;

  onPress?: (d: Date) => void;

  expanded?: boolean;

  bars?: DayBar[];
  maxBars?: number;

  inlineItems?: DayInlineItem[];
  maxInlineItems?: number;
};

const CONNECT_PX = 10;

// tight
const BAR_H_EXPANDED = 14;
const BAR_H_COMPACT = 4;

const BAR_TOP_EXPANDED = 34;
const BAR_TOP_COMPACT = 30;

const BAR_ROW_GAP_EXPANDED = 2;
const BAR_ROW_GAP_COMPACT = 4;

const DAY_TOP_PAD = 10;
const MORE_H = 14;

const INLINE_AFTER_BARS_GAP = 2;

export const DayCard: FC<Props> = ({
  date,
  width,
  height,
  isToday = false,
  isSelected = false,
  isOutside = false,
  onPress,

  expanded = false,

  bars,
  maxBars = 4,

  inlineItems,
  maxInlineItems = 2,
}) => {
  const dayNum = date.getDate();

  const BAR_H = expanded ? BAR_H_EXPANDED : BAR_H_COMPACT;
  const BAR_TOP = expanded ? BAR_TOP_EXPANDED : BAR_TOP_COMPACT;
  const BAR_ROW_GAP = expanded ? BAR_ROW_GAP_EXPANDED : BAR_ROW_GAP_COMPACT;

  const containerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    const s: ViewStyle = {
      width,
      height,
      backgroundColor: colors.background,
      borderRadius: radii.xl,

      paddingHorizontal: spacing.sm,
      paddingTop: DAY_TOP_PAD,
      paddingBottom: spacing.xs,

      overflow: "visible",

      justifyContent: "flex-start",
      borderWidth: 2,
      borderColor: isSelected ? colors.primary : "transparent",
      opacity: isOutside ? 0.45 : 1,
    };
    return [s];
  }, [width, height, isOutside, isSelected]);

  const dayTextStyle = useMemo<StyleProp<TextStyle>>(() => {
    const base: TextStyle = {
      fontSize: sizes.md,
      fontWeight: "700",
      color: colors.textPrimary,
    };
    if (isToday) return [base, { color: colors.primary, fontWeight: "800" }];
    return base;
  }, [isToday]);

  const barLayout = useMemo(() => {
    if (!bars || bars.length === 0) {
      return { render: [] as DayBar[], hiddenCount: 0, maxRowRendered: -1 };
    }

    const uniqMap = new Map<string, DayBar>();
    for (const b of bars) if (!uniqMap.has(b.id)) uniqMap.set(b.id, b);
    const uniq = Array.from(uniqMap.values());

    const sorted = uniq.sort((a, b) => a.row - b.row);

    const rawRender = sorted.slice(0, maxBars);
    const hiddenCount = Math.max(0, sorted.length - rawRender.length);

    const rowVals = Array.from(new Set(rawRender.map((b) => b.row))).sort(
      (a, b) => a - b
    );
    const rowMap = new Map<number, number>();
    rowVals.forEach((rv, idx) => rowMap.set(rv, idx));

    const render: DayBar[] = rawRender.map((b) => ({
      ...b,
      row: rowMap.get(b.row) ?? 0,
    }));

    const maxRowRendered = rowVals.length ? rowVals.length - 1 : -1;

    return { render, hiddenCount, maxRowRendered };
  }, [bars, maxBars]);

  const barBottomY = useMemo(() => {
    if (!expanded) return 0;

    const rowsUsed = Math.max(0, barLayout.maxRowRendered + 1);
    const barsAreaH = rowsUsed > 0 ? rowsUsed * (BAR_H + BAR_ROW_GAP) : 0;
    const moreAreaH = barLayout.hiddenCount > 0 ? MORE_H + 4 : 0;

    return BAR_TOP + barsAreaH + moreAreaH;
  }, [
    expanded,
    barLayout.maxRowRendered,
    barLayout.hiddenCount,
    BAR_H,
    BAR_ROW_GAP,
    BAR_TOP,
  ]);

  const renderBars = () => {
    if (!barLayout.render.length) return null;

    return (
      <View style={styles.barAbsWrap} pointerEvents="none">
        {barLayout.render.map((b) => {
          const top = BAR_TOP + b.row * (BAR_H + BAR_ROW_GAP);

          const left = b.contL ? -CONNECT_PX : 0;
          const right = b.contR ? -CONNECT_PX : 0;

          const rTL = b.contL ? 0 : 6;
          const rBL = b.contL ? 0 : 6;
          const rTR = b.contR ? 0 : 6;
          const rBR = b.contR ? 0 : 6;

          return (
            <View
              key={b.id}
              style={{
                position: "absolute",
                top,
                left,
                right,
                height: BAR_H,
                backgroundColor: b.color,
                opacity: 0.96,
                borderTopLeftRadius: rTL,
                borderBottomLeftRadius: rBL,
                borderTopRightRadius: rTR,
                borderBottomRightRadius: rBR,
                alignItems: expanded ? "center" : undefined,
                justifyContent: expanded ? "center" : undefined,
                paddingHorizontal: expanded ? 8 : 0,
              }}
            >
              {expanded && b.title ? (
                <MText numberOfLines={1} style={styles.barTitleText}>
                  {b.title}
                </MText>
              ) : null}
            </View>
          );
        })}

        {expanded && barLayout.hiddenCount > 0 ? (
          <View
            style={{
              position: "absolute",
              top:
                BAR_TOP +
                (barLayout.maxRowRendered + 1) * (BAR_H + BAR_ROW_GAP) +
                2,
              left: 0,
              right: 0,
              height: MORE_H,
              justifyContent: "center",
            }}
          >
            <MText numberOfLines={1} style={styles.moreText}>
              +{barLayout.hiddenCount} more
            </MText>
          </View>
        ) : null}
      </View>
    );
  };

  const renderInline = () => {
    if (!inlineItems || inlineItems.length === 0) return null;
    const items = inlineItems.slice(0, maxInlineItems);

    // compact: normal flow
    if (!expanded) {
      return (
        <View style={[styles.inlineWrap, { marginTop: spacing.xs }]}>
          {items.map((it, idx) => (
            <View key={`${it.title}-${idx}`} style={styles.inlineRow}>
              <View style={[styles.inlineDot, { backgroundColor: it.color }]} />
              <MText numberOfLines={1} style={styles.inlineText}>
                {it.title}
              </MText>
            </View>
          ))}
        </View>
      );
    }

    return (
      <View
        style={[
          styles.inlineWrap,
          {
            position: "absolute",
            left: spacing.sm,
            right: spacing.sm,
            top: barBottomY + INLINE_AFTER_BARS_GAP,
          },
        ]}
        pointerEvents="none"
      >
        {items.map((it, idx) => (
          <View key={`${it.title}-${idx}`} style={styles.inlineRow}>
            <View style={[styles.inlineDot, { backgroundColor: it.color }]} />
            <MText numberOfLines={1} style={styles.inlineText}>
              {it.title}
            </MText>
          </View>
        ))}
      </View>
    );
  };

  return (
    <Pressable
      onPress={() => onPress?.(date)}
      style={containerStyle}
      android_ripple={{ color: "rgba(255,255,255,0.06)" }}
    >
      <View style={styles.topRow}>
        <MText style={dayTextStyle}>{dayNum}</MText>
      </View>

      {renderBars()}
      {renderInline()}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  barAbsWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },

  barTitleText: {
    fontSize: sizes.sm,
    fontWeight: "800",
    color: "#fff",
    opacity: 0.98,
    textAlign: "center",
  },

  moreText: {
    fontSize: sizes.sm,
    fontWeight: "800",
    color: colors.textPrimary,
    opacity: 0.75,
  },

  inlineWrap: {
    gap: 2,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  inlineDot: {
    width: 6,
    height: 6,
    borderRadius: 6,
  },

  inlineText: {
    flex: 1,
    fontSize: sizes.sm,
    color: colors.textPrimary,
    fontWeight: "600",
    opacity: 0.92,
  },
});
