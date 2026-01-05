import { View } from "react-native";
import { WeekViewConfig } from "../../types";
import React from "react";

export type RenderHorizontalLinesProps = {
  weekView: WeekViewConfig;
  width: number;
  bottomPaddingMinutes: number;
  minorStyle: any;
  majorStyle?: any;
};
export const RenderHorizontalLines = ({
  weekView,
  width,
  bottomPaddingMinutes,
  minorStyle,
  majorStyle,
}) => {
  const lines = [];

  const totalMinutes =
    (weekView.endHour - weekView.startHour) * 60 + bottomPaddingMinutes;

  const steps = Math.floor(totalMinutes / weekView.stepMinutes);

  for (let i = 0; i <= steps; i++) {
    const minuteFromStart = i * weekView.stepMinutes;
    const y = minuteFromStart * weekView.pxPerMinute;

    const isHourLine = minuteFromStart % 60 === 0;

    lines.push(
      <View
        key={`h-line-${i}`}
        style={[
          isHourLine ? majorStyle ?? minorStyle : minorStyle,
          {
            position: "absolute",
            top: y,
            left: 0,
            width,
            height: 1,
          },
        ]}
      />
    );
  }

  return lines;
};
