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
  id: string; // eventId
  color: string;
  contL: boolean;
  contR: boolean;
  title: string | null;
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
const BAR_H = 4;

const BAR_TOP_COMPACT = 30;
const BAR_TOP_EXPANDED = 22;

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
  const barTop = expanded ? BAR_TOP_EXPANDED : BAR_TOP_COMPACT;

  const containerStyle = useMemo<StyleProp<ViewStyle>>(() => {
    const s: ViewStyle = {
      width,
      height,
      backgroundColor: colors.background,
      borderRadius: radii.xl,
      paddingHorizontal: spacing.sm,
      paddingTop: spacing.sm,
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

  const renderBars = () => {
    if (!bars || bars.length === 0) return null;

    const uniq = (() => {
      const map = new Map<string, DayBar>();
      for (const b of bars) if (!map.has(b.id)) map.set(b.id, b);
      return Array.from(map.values()).slice(0, maxBars);
    })();

    return (
      <View style={styles.barAbsWrap} pointerEvents="none">
        {uniq.map((b, idx) => {
          const top = barTop + idx * (BAR_H + 10);

          return (
            <View
              key={b.id}
              style={{ position: "absolute", left: 0, right: 0, top }}
            >
              {/* bar */}
              <View
                style={{
                  height: BAR_H,
                  backgroundColor: b.color,
                  opacity: 0.95,
                  left: b.contL ? -CONNECT_PX : 0,
                  right: b.contR ? -CONNECT_PX : 0,
                  borderTopLeftRadius: b.contL ? 0 : 3,
                  borderBottomLeftRadius: b.contL ? 0 : 3,
                  borderTopRightRadius: b.contR ? 0 : 3,
                  borderBottomRightRadius: b.contR ? 0 : 3,
                }}
              />

              {expanded && b.title ? (
                <View style={styles.barTitleWrap} pointerEvents="none">
                  <MText numberOfLines={1} style={styles.barTitleText}>
                    {b.title}
                  </MText>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

  const renderInline = () => {
    if (!expanded) return null;
    if (!inlineItems || inlineItems.length === 0) return null;

    const items = inlineItems.slice(0, maxInlineItems);

    return (
      <View style={styles.inlineWrap}>
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

  // title barın üstünde, hafif içerden
  barTitleWrap: {
    marginTop: 4,
    paddingHorizontal: 2,
  },
  barTitleText: {
    fontSize: sizes.sm,
    fontWeight: "800",
    color: colors.textPrimary,
    opacity: 0.95,
  },

  inlineWrap: {
    marginTop: spacing.xs,
    gap: 4,
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
