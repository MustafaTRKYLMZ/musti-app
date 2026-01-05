import React, { FC, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { MText, plannerTheme, sizes } from "@musti/ui-native";

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

    const rawIndex = nowY / hourHeight; // 0..N
    const nearest = Math.round(rawIndex);

    const hourLineY = nearest * hourHeight;

    const thresholdPx = 12;

    const collides = Math.abs(nowY - hourLineY) <= thresholdPx;

    return { hideIndex: collides ? nearest : -1 };
  }, [nowY, hourHeight]);

  return (
    <View style={[styles.col, { width: TIME_COL_WIDTH, minWidth: 44 }]}>
      {Array.from({ length: hoursCount }).map((_, i) => {
        const hour = weekView.startHour + i;
        const displayHour = hour % 24;

        const hideThis = i === overlap.hideIndex;

        return (
          <MText
            key={`${hour}-${i}`}
            style={[
              styles.timeLabel,
              { height: hourHeight, opacity: hideThis ? 0 : 1 },
            ]}
          >
            {String(displayHour).padStart(2, "0")}
          </MText>
        );
      })}

      {!!bottomSpacerHeight && <View style={{ height: bottomSpacerHeight }} />}

      {/* ✅ NOW label */}
      {nowY != null && nowLabel ? (
        <View pointerEvents="none" style={[styles.nowWrap, { top: nowY - 7 }]}>
          <View style={[styles.nowTick, { backgroundColor: nowColor }]} />
          <MText style={[styles.nowText, { color: nowColor }]}>
            {nowLabel}
          </MText>
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
    fontSize: 11,
    color: colors.textPrimary,
    paddingTop: 2,
    textAlign: "right",
    paddingRight: 6,
  },
  nowWrap: {
    position: "absolute",
    right: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
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
