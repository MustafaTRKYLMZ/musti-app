import React, { FC, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { MText, plannerTheme, sizes } from "@musti/ui-native";

type TimeColumnProps = {
  TIME_COL_WIDTH: number;
  weekView: {
    startHour: number;
    endHour: number;
    pxPerMinute?: number;
  };
  hourHeight: number;

  bottomPaddingMinutes?: number;

  // now indicator (time column)
  nowY?: number | null;
  nowLabel?: string | null;
  nowColor?: string;
};

const { colors } = plannerTheme;

export const TimeColumn: FC<TimeColumnProps> = ({
  TIME_COL_WIDTH,
  weekView,
  hourHeight,
  bottomPaddingMinutes = 0,
  nowY = null,
  nowLabel = null,
  nowColor,
}) => {
  const hours = useMemo(() => {
    const res: number[] = [];
    const count = weekView.endHour - weekView.startHour; // 1..24 => 23
    for (let i = 0; i <= count; i++) {
      const h = (weekView.startHour + i) % 24;
      res.push(h);
    }
    return res;
  }, [weekView.startHour, weekView.endHour]);

  const bottomSpacerHeight = (bottomPaddingMinutes / 60) * hourHeight;

  return (
    <View style={[styles.col, { width: TIME_COL_WIDTH, minWidth: 44 }]}>
      {hours.map((h, idx) => (
        <MText
          key={`${h}-${idx}`}
          style={[styles.timeLabel, { height: hourHeight }]}
        >
          {String(h).padStart(2, "0")}
        </MText>
      ))}

      {bottomSpacerHeight > 0 ? (
        <View style={{ height: bottomSpacerHeight }} />
      ) : null}

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
