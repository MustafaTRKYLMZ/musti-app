import React, { FC } from "react";
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
  nowColor = "#EF4444",
}) => {
  const hoursCount = weekView.endHour - weekView.startHour + 1;
  const bottomSpacerHeight = (bottomPaddingMinutes / 60) * hourHeight;

  return (
    <View style={[styles.col, { width: TIME_COL_WIDTH, minWidth: 44 }]}>
      {Array.from({ length: hoursCount }).map((_, i) => {
        const hour = weekView.startHour + i;
        const displayHour = hour % 24;
        return (
          <MText
            key={`${hour}-${i}`}
            style={[styles.timeLabel, { height: hourHeight }]}
          >
            {String(displayHour).padStart(2, "0")}
          </MText>
        );
      })}

      {!!bottomSpacerHeight && <View style={{ height: bottomSpacerHeight }} />}

      {/* ✅ NOW LABEL overlay */}
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
