// Day.tsx
import React, { FC } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
} from "react-native";
import { plannerTheme, radii, typography } from "@musti/ui-native";

const { colors } = plannerTheme;

export type DayInlineItem = { color: string; title: string };

export type DayProps = {
  date: Date;
  width: number;
  height?: number;

  isToday?: boolean;
  isSelected?: boolean;
  isOutside?: boolean;

  onPress?: (d: Date) => void;

  markers?: string[];
  maxMarkers?: number;

  markerMode?: "stack" | "row";

  inlineItems?: DayInlineItem[];
  maxInlineItems?: number;

  containerStyle?: StyleProp<ViewStyle>;
  pillStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;

  todayPillStyle?: StyleProp<ViewStyle>;
  todayTextStyle?: StyleProp<TextStyle>;

  outsidePillStyle?: StyleProp<ViewStyle>;
  outsideTextStyle?: StyleProp<TextStyle>;

  selectedStyle?: StyleProp<ViewStyle>;

  cellBg?: string;
};

export const Day: FC<DayProps> = ({
  date,
  width,
  height,

  isToday = false,
  isSelected = false,
  isOutside = false,
  onPress,

  markers,
  maxMarkers = 4,
  markerMode = "stack",

  inlineItems,
  maxInlineItems = 2,

  containerStyle,
  pillStyle,
  textStyle,
  todayPillStyle,
  todayTextStyle,
  outsidePillStyle,
  outsideTextStyle,
  selectedStyle,

  cellBg,
}) => {
  const count = markers?.length ?? 0;
  const shown = count ? markers!.slice(0, maxMarkers) : [];
  const overflow = count > maxMarkers ? count - maxMarkers : 0;

  const inCount = inlineItems?.length ?? 0;
  const inShown = inCount ? inlineItems!.slice(0, maxInlineItems) : [];
  const inOverflow = inCount > maxInlineItems ? inCount - maxInlineItems : 0;

  const markerW =
    markerMode === "stack" ? Math.max(10, Math.floor(width * 0.55)) : 10;

  return (
    <Pressable
      // delayPressIn is not a valid prop for Pressable, so it has been removed
      pressRetentionOffset={{ top: 12, left: 12, bottom: 12, right: 12 }}
      onPress={onPress ? () => onPress(date) : undefined}
      style={[
        styles.cell,
        { width, height: height ?? undefined },
        cellBg ? { backgroundColor: cellBg } : null,
        containerStyle,
      ]}
    >
      {isSelected && (
        <View
          //   pointerEvents="none"
          style={[styles.selectedOverlay, selectedStyle]}
        />
      )}

      <View
        style={[
          styles.pill,
          pillStyle,
          isToday && styles.pillToday,
          isToday && todayPillStyle,
          isOutside && styles.pillOutside,
          isOutside && outsidePillStyle,
        ]}
      >
        <Text
          style={[
            styles.text,
            textStyle,
            isToday && styles.todayText,
            isToday && todayTextStyle,
            isOutside && styles.outsideText,
            isOutside && outsideTextStyle,
          ]}
        >
          {date.getDate()}
        </Text>
      </View>

      {!!inShown.length && (
        <View style={styles.inlineWrap}>
          {inShown.map((it, i) => (
            <View key={`${it.title}-${i}`} style={styles.inlineRow}>
              <View style={[styles.inlineBar, { backgroundColor: it.color }]} />
              <Text style={styles.inlineText} numberOfLines={1}>
                {it.title}
              </Text>
            </View>
          ))}
          {inOverflow > 0 && (
            <Text style={styles.inlineMore}>{`+${inOverflow}`}</Text>
          )}
        </View>
      )}

      {!inShown.length && !!shown.length && (
        <View
          style={[
            styles.markersWrap,
            markerMode === "row" ? styles.markersRow : styles.markersStack,
          ]}
        >
          {shown.map((c, i) => (
            <View
              key={`${c}-${i}`}
              style={[
                styles.marker,
                { backgroundColor: c, width: markerW },
                markerMode === "row" ? styles.markerRow : styles.markerStack,
              ]}
            />
          ))}
          {overflow > 0 && (
            <Text style={styles.overflowText}>{`+${overflow}`}</Text>
          )}
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cell: {
    alignItems: "center",
    justifyContent: "flex-start",
    paddingVertical: 2,
    paddingHorizontal: 2,
    borderRadius: radii.sm,
  },

  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: radii.sm,
  },

  pill: {
    minWidth: 16,
    minHeight: 16,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    paddingVertical: 1,
  },

  pillToday: {
    backgroundColor: colors.backgroundSecondary,
  },

  pillOutside: {
    opacity: 0.5,
  },

  text: {
    fontSize: typography.heading4.fontSize,
    fontWeight: typography.heading4.fontWeight,
    color: colors.textPrimary,
    lineHeight: typography.heading4.fontSize,
  },

  todayText: {
    color: colors.primary,
  },

  outsideText: {
    color: colors.textSecondary ?? colors.textPrimary,
  },

  inlineWrap: {
    width: "100%",
    marginTop: 4,
    paddingHorizontal: 2,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },

  inlineBar: {
    width: 3,
    height: 10,
    borderRadius: 2,
    marginRight: 4,
  },

  inlineText: {
    flex: 1,
    fontSize: 10,
    color: colors.textPrimary,
    opacity: 0.95,
  },

  inlineMore: {
    fontSize: 10,
    color: colors.textSecondary ?? colors.textPrimary,
    opacity: 0.9,
    marginTop: 1,
  },

  markersWrap: {
    marginTop: 2,
    alignItems: "center",
    justifyContent: "flex-start",
    minHeight: 8,
  },

  markersStack: { flexDirection: "column" },
  markersRow: { flexDirection: "row" },

  marker: {
    height: 3,
    borderRadius: 2,
  },

  markerStack: { marginBottom: 2 },
  markerRow: { marginRight: 3 },

  overflowText: {
    fontSize: 9,
    fontWeight: "600",
    color: colors.textSecondary ?? colors.textPrimary,
    opacity: 0.9,
    marginTop: 0,
  },
});
