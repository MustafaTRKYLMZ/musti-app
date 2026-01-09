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

export type DayMarker = {
  id: string; // eventId
  color: string;
  contL: boolean;
  contR: boolean;
};

type MarkerInput = string[] | DayMarker[];

type Props = {
  date: Date;
  width: number;
  height: number;

  isToday?: boolean;
  isSelected?: boolean;
  isOutside?: boolean;

  onPress?: (d: Date) => void;

  markers?: MarkerInput;
  maxMarkers?: number;
  markerMode?: "stack";

  inlineItems?: DayInlineItem[];
  maxInlineItems?: number;
};

const CONNECT_PX = 10;

const MARKER_H = 4;

const MARKER_TOP = 30;

function isNewMarkerArray(m?: MarkerInput): m is DayMarker[] {
  return Array.isArray(m) && m.length > 0 && typeof (m as any)[0] === "object";
}

export const DayCard: FC<Props> = ({
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
}) => {
  const dayNum = date.getDate();

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

  const renderMarkers = () => {
    if (!markers || markers.length === 0) return null;
    if (markerMode !== "stack") return null;

    if (isNewMarkerArray(markers)) {
      const uniq = (() => {
        const map = new Map<string, DayMarker>();
        for (const it of markers) {
          if (!map.has(it.id)) map.set(it.id, it);
        }
        return Array.from(map.values()).slice(0, maxMarkers);
      })();

      return (
        <View style={styles.markerAbsWrap} pointerEvents="none">
          {uniq.map((m, idx) => {
            const top = MARKER_TOP + idx * (MARKER_H + 4);

            return (
              <View
                key={m.id}
                style={{
                  position: "absolute",
                  top,
                  height: MARKER_H,
                  backgroundColor: m.color,
                  opacity: 0.95,

                  left: m.contL ? -CONNECT_PX : 0,
                  right: m.contR ? -CONNECT_PX : 0,

                  borderTopLeftRadius: m.contL ? 0 : 3,
                  borderBottomLeftRadius: m.contL ? 0 : 3,
                  borderTopRightRadius: m.contR ? 0 : 3,
                  borderBottomRightRadius: m.contR ? 0 : 3,
                }}
              />
            );
          })}
        </View>
      );
    }

    // eski format: sadece renk
    const cols = (markers as string[]).slice(0, maxMarkers);

    return (
      <View style={styles.markerAbsWrap} pointerEvents="none">
        {cols.map((c, idx) => {
          const top = MARKER_TOP + idx * (MARKER_H + 4);
          return (
            <View
              key={`${c}-${idx}`}
              style={{
                position: "absolute",
                top,
                left: 0,
                right: 0,
                height: MARKER_H,
                backgroundColor: c,
                borderRadius: 3,
                opacity: 0.95,
              }}
            />
          );
        })}
      </View>
    );
  };

  const renderInline = () => {
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

      {renderMarkers()}

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

  markerAbsWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
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
