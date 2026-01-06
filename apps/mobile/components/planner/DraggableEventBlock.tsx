import React, { useMemo } from "react";
import { Pressable, Text, View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
  clamp,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import type { MEvent, WeekViewConfig } from "@musti/planner/src/types";
import { withDayAndMinutes, snapMinutes } from "@musti/planner";

type Props = {
  density: "compact" | "expanded";
  weekView: WeekViewConfig;

  top: number;
  height: number;
  left: number;
  width: number;

  event: MEvent;

  minMinute: number;
  maxMinute: number;
  dayDate: Date;

  onPress?: (e: MEvent) => void;
  onChange?: (next: MEvent) => void;
};

export function DraggableEventBlock(p: Props) {
  const pxPerMin = p.weekView.pxPerMinute;
  const step = p.weekView.stepMinutes;

  const tY = useSharedValue(0);
  const hY = useSharedValue(0);

  const baseTop = useSharedValue(p.top);
  const baseHeight = useSharedValue(p.height);

  React.useEffect(() => {
    baseTop.value = p.top;
    baseHeight.value = p.height;
    tY.value = 0;
    hY.value = 0;
  }, [p.top, p.height]);

  const commit = (startMin: number, durationMin: number) => {
    const start = withDayAndMinutes(p.dayDate, startMin);
    const end = withDayAndMinutes(p.dayDate, startMin + durationMin);
    p.onChange?.({
      ...p.event,
      start: start.toISOString(),
      end: end.toISOString(),
    });
  };

  const moveGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(p.density === "expanded")
        .onChange((e) => {
          tY.value = e.translationY;
        })
        .onEnd(() => {
          const nextTopPx = baseTop.value + tY.value;
          const rawStartMin = p.minMinute + nextTopPx / pxPerMin;

          const snappedStart = snapMinutes(rawStartMin, step);
          const rawDurMin = (baseHeight.value + hY.value) / pxPerMin;
          const snappedDur = snapMinutes(rawDurMin, step);

          const minDur = step;
          const clampedStart = clamp(
            snappedStart,
            p.minMinute,
            p.maxMinute - minDur
          );
          const clampedDur = clamp(
            snappedDur,
            minDur,
            p.maxMinute - clampedStart
          );

          runOnJS(commit)(clampedStart, clampedDur);
          tY.value = 0;
          hY.value = 0;
        }),
    [p.density, p.weekView, p.minMinute, p.maxMinute]
  );

  const resizeGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(p.density === "expanded")
        .onChange((e) => {
          hY.value = e.translationY;
        })
        .onEnd(() => {
          const startMin = p.minMinute + baseTop.value / pxPerMin;
          const rawDurMin = (baseHeight.value + hY.value) / pxPerMin;

          const snappedDur = snapMinutes(rawDurMin, step);
          const minDur = step;
          const clampedDur = clamp(snappedDur, minDur, p.maxMinute - startMin);

          runOnJS(commit)(startMin, clampedDur);
          tY.value = 0;
          hY.value = 0;
        }),
    [p.density, p.weekView, p.minMinute, p.maxMinute]
  );

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tY.value }],
    height: baseHeight.value + hY.value,
  }));

  if (p.density === "compact") {
    return (
      <Pressable
        onPress={() => p.onPress?.(p.event)}
        style={[
          styles.compactLine,
          {
            left: p.left + 2,
            top: p.top,
            width: p.width - 6,
            backgroundColor: p.event.color ?? "#2F6FED",
          },
        ]}
      />
    );
  }

  return (
    <Animated.View
      style={[
        styles.card,
        {
          left: p.left,
          top: p.top,
          width: p.width - 4,
          backgroundColor: p.event.color ?? "#2F6FED",
        },
        aStyle,
      ]}
    >
      <GestureDetector gesture={moveGesture}>
        <Pressable onPress={() => p.onPress?.(p.event)} style={{ flex: 1 }}>
          <Text numberOfLines={1} style={styles.title}>
            {p.event.title}
          </Text>
        </Pressable>
      </GestureDetector>

      <GestureDetector gesture={resizeGesture}>
        <View style={styles.resizeHandle} />
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  compactLine: { position: "absolute", height: 4, borderRadius: 2 },
  card: {
    position: "absolute",
    borderRadius: 10,
    padding: 6,
    overflow: "hidden",
  },
  title: { color: "#fff", fontSize: 11, fontWeight: "800" },
  resizeHandle: {
    height: 14,
    marginTop: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
});
