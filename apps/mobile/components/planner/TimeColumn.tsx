import React, { FC, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { MText, plannerTheme, sizes, spacing } from "@musti/ui-native";

type Props = {
  TIME_COL_WIDTH: number;
  weekView: {
    startHour: number;
    endHour: number;
  };
  hourHeight: number;
  bottomPaddingMinutes?: number;

  nowY: number | null;
  nowLabel: string | null;
  nowColor?: string;
};

const { colors } = plannerTheme;

// Samsung hissi için mikro ayarlar
const LABEL_OFFSET_Y = 6; // çizginin üstüne kayma
const LABEL_FONT_SIZE = sizes.md;

export const TimeColumn: FC<Props> = ({
  TIME_COL_WIDTH,
  weekView,
  hourHeight,
  bottomPaddingMinutes = 0,
  nowY,
  nowLabel,
  nowColor,
}) => {
  const hoursCount = weekView.endHour - weekView.startHour + 1;
  const bottomSpacerHeight = (bottomPaddingMinutes / 60) * hourHeight;

  const overlap = useMemo(() => {
    if (nowY == null) return { hideIndex: -1 };

    const rawIndex = nowY / hourHeight;
    const nearest = Math.round(rawIndex);
    const hourLineY = nearest * hourHeight;

    const thresholdPx = 14; // Samsung daha tight
    const collides = Math.abs(nowY - hourLineY) <= thresholdPx;

    return { hideIndex: collides ? nearest : -1 };
  }, [nowY, hourHeight]);

  return (
    <View style={[styles.col, { width: TIME_COL_WIDTH, minWidth: 44 }]}>
      {/* Saat label’ları */}
      <View style={{ height: hoursCount * hourHeight }}>
        {Array.from({ length: hoursCount }).map((_, i) => {
          const hour = weekView.startHour + i;
          const displayHour = hour % 24;
          const hideThis = i === overlap.hideIndex;

          const lineY = i * hourHeight;

          return (
            <MText
              key={`${hour}-${i}`}
              style={[
                styles.timeLabel,
                {
                  top: lineY - LABEL_OFFSET_Y - LABEL_FONT_SIZE / 2, // ✅ Samsung hizası
                  height: LABEL_FONT_SIZE + 2,
                  opacity: hideThis ? 0 : 1,
                },
              ]}
            >
              {String(displayHour).padStart(2, "0")}
            </MText>
          );
        })}
      </View>

      {!!bottomSpacerHeight && <View style={{ height: bottomSpacerHeight }} />}

      {/* NOW etiketi */}
      {nowY != null && nowLabel ? (
        <View pointerEvents="none" style={[styles.nowWrap, { top: nowY - 7 }]}>
          <MText style={[styles.nowText, { color: nowColor }]}>
            {nowLabel}
          </MText>
          <View style={[styles.nowTick, { backgroundColor: nowColor }]} />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  col: {
    position: "relative",
  },

  timeLabel: {
    position: "absolute",
    right: spacing.sm,
    fontSize: LABEL_FONT_SIZE,
    color: colors.textPrimary,
    fontWeight: "500",
    textAlign: "right",
  },

  nowWrap: {
    position: "absolute",
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    zIndex: 999,
  },
  nowTick: {
    width: 8,
    height: 2,
    borderRadius: 2,
  },
  nowText: {
    fontSize: sizes.sm,
    fontWeight: "800",
  },
});
