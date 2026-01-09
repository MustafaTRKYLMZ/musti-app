import React, { useMemo, useEffect, useState, useCallback } from "react";
import { Text, View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import type { MEvent, WeekViewConfig } from "@musti/planner/src/types";
import { withDayAndMinutes, pad2 } from "@musti/planner";
import { colors } from "@musti/ui-native";

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

  draggable?: boolean;
  onPress?: (e: MEvent) => void;
  onChange?: (next: MEvent) => void;
};

function fmtHHmm(minuteOfDay: number) {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minuteOfDay)));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(h)}:${pad2(mm)}`;
}

export function DraggableEventBlock(p: Props) {
  const pxPerMin = p.weekView.pxPerMinute;
  const step = p.weekView.stepMinutes;

  const canDrag = p.draggable !== false;

  const tY = useSharedValue(0);
  const hY = useSharedValue(0);

  const baseTop = useSharedValue(p.top);
  const baseHeight = useSharedValue(p.height);

  const moved = useSharedValue(false);
  const [previewRange, setPreviewRange] = useState<string>("");

  useEffect(() => {
    baseTop.value = p.top;
    baseHeight.value = p.height;
    tY.value = 0;
    hY.value = 0;
    moved.value = false;
    setPreviewRange("");
  }, [p.top, p.height]);

  const commitJS = useCallback(
    (startMin: number, durMin: number) => {
      const start = withDayAndMinutes(p.dayDate, startMin);
      const end = withDayAndMinutes(p.dayDate, startMin + durMin);

      p.onChange?.({
        ...p.event,
        start: start.toISOString(),
        end: end.toISOString(),
      });
    },
    [p.dayDate, p.event, p.onChange]
  );

  const setPreviewJS = useCallback((startMin: number, durMin: number) => {
    setPreviewRange(`${fmtHHmm(startMin)}–${fmtHHmm(startMin + durMin)}`);
  }, []);

  const clearPreviewJS = useCallback(() => setPreviewRange(""), []);

  const tapGesture = useMemo(() => {
    const maxDist = p.density === "expanded" ? 5 : 8;

    return Gesture.Tap()
      .maxDuration(220)
      .maxDistance(maxDist)
      .onEnd((_e, success) => {
        if (!success) return;
        if (moved.value) return;
        if (p.onPress) runOnJS(p.onPress)(p.event);
      });
  }, [p.density, p.onPress, p.event]);

  const moveGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(canDrag && p.density === "expanded")
        .onBegin(() => {
          moved.value = false;

          const startMin = p.minMinute + baseTop.value / pxPerMin;
          const durMin = baseHeight.value / pxPerMin;
          runOnJS(setPreviewJS)(startMin, durMin);
        })
        .onChange((e) => {
          if (Math.abs(e.translationY) > 4) moved.value = true;

          tY.value = e.translationY;

          const nextTopPx = baseTop.value + tY.value;
          const nextHeightPx = baseHeight.value + hY.value;

          const rawStart = p.minMinute + nextTopPx / pxPerMin;
          const rawDur = nextHeightPx / pxPerMin;

          const snappedStart = Math.round(rawStart / step) * step;
          const snappedDur = Math.round(rawDur / step) * step;

          const minDur = step;
          const maxStart = p.maxMinute - minDur;

          const clampedStart = Math.max(
            p.minMinute,
            Math.min(maxStart, snappedStart)
          );
          const clampedDur = Math.max(
            minDur,
            Math.min(p.maxMinute - clampedStart, snappedDur)
          );

          runOnJS(setPreviewJS)(clampedStart, clampedDur);
        })
        .onEnd(() => {
          if (!canDrag) return;

          const nextTopPx = baseTop.value + tY.value;
          const nextHeightPx = baseHeight.value + hY.value;

          const rawStart = p.minMinute + nextTopPx / pxPerMin;
          const rawDur = nextHeightPx / pxPerMin;

          const snappedStart = Math.round(rawStart / step) * step;
          const snappedDur = Math.round(rawDur / step) * step;

          const minDur = step;
          const maxStart = p.maxMinute - minDur;

          const clampedStart = Math.max(
            p.minMinute,
            Math.min(maxStart, snappedStart)
          );
          const clampedDur = Math.max(
            minDur,
            Math.min(p.maxMinute - clampedStart, snappedDur)
          );

          runOnJS(commitJS)(clampedStart, clampedDur);
          tY.value = 0;
          hY.value = 0;
          moved.value = false;
          runOnJS(clearPreviewJS)();
        }),
    [
      canDrag,
      p.density,
      p.minMinute,
      p.maxMinute,
      pxPerMin,
      step,
      baseTop,
      baseHeight,
      tY,
      hY,
      commitJS,
      setPreviewJS,
      clearPreviewJS,
    ]
  );

  const resizeGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(canDrag && p.density === "expanded")
        .onBegin(() => {
          moved.value = false;

          const startMin = p.minMinute + baseTop.value / pxPerMin;
          const durMin = baseHeight.value / pxPerMin;
          runOnJS(setPreviewJS)(startMin, durMin);
        })
        .onChange((e) => {
          if (Math.abs(e.translationY) > 4) moved.value = true;

          hY.value = e.translationY;

          const nextTopPx = baseTop.value + tY.value;
          const nextHeightPx = baseHeight.value + hY.value;

          const rawStart = p.minMinute + nextTopPx / pxPerMin;
          const rawDur = nextHeightPx / pxPerMin;

          const snappedStart = Math.round(rawStart / step) * step;
          const snappedDur = Math.round(rawDur / step) * step;

          const minDur = step;
          const maxStart = p.maxMinute - minDur;

          const clampedStart = Math.max(
            p.minMinute,
            Math.min(maxStart, snappedStart)
          );
          const clampedDur = Math.max(
            minDur,
            Math.min(p.maxMinute - clampedStart, snappedDur)
          );

          runOnJS(setPreviewJS)(clampedStart, clampedDur);
        })
        .onEnd(() => {
          if (!canDrag) return;

          const nextTopPx = baseTop.value + tY.value;
          const nextHeightPx = baseHeight.value + hY.value;

          const rawStart = p.minMinute + nextTopPx / pxPerMin;
          const rawDur = nextHeightPx / pxPerMin;

          const snappedStart = Math.round(rawStart / step) * step;
          const snappedDur = Math.round(rawDur / step) * step;

          const minDur = step;
          const maxStart = p.maxMinute - minDur;

          const clampedStart = Math.max(
            p.minMinute,
            Math.min(maxStart, snappedStart)
          );
          const clampedDur = Math.max(
            minDur,
            Math.min(p.maxMinute - clampedStart, snappedDur)
          );

          runOnJS(commitJS)(clampedStart, clampedDur);
          tY.value = 0;
          hY.value = 0;
          moved.value = false;
          runOnJS(clearPreviewJS)();
        }),
    [
      canDrag,
      p.density,
      p.minMinute,
      p.maxMinute,
      pxPerMin,
      step,
      baseTop,
      baseHeight,
      tY,
      hY,
      commitJS,
      setPreviewJS,
      clearPreviewJS,
    ]
  );

  const cardGesture = useMemo(
    () => Gesture.Simultaneous(tapGesture, moveGesture),
    [tapGesture, moveGesture]
  );

  const aStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: tY.value }],
    height: Math.max(6, baseHeight.value + hY.value),
  }));

  const bg = p.event.color ?? "#2F6FED";

  if (p.density === "compact") {
    return (
      <GestureDetector gesture={tapGesture}>
        <Animated.View
          style={[
            styles.compactLine,
            {
              left: p.left + 2,
              top: p.top,
              width: p.width - 6,
              backgroundColor: bg,
            },
          ]}
        />
      </GestureDetector>
    );
  }

  return (
    <GestureDetector gesture={cardGesture}>
      <Animated.View
        style={[
          styles.card,
          {
            left: p.left,
            top: p.top,
            width: p.width - 4,
            backgroundColor: bg,
          },
          aStyle,
        ]}
      >
        <View style={styles.headerRow}>
          <Text numberOfLines={1} style={styles.title}>
            {p.event.title}
          </Text>
          {previewRange ? (
            <Text style={styles.time}>{previewRange}</Text>
          ) : null}
        </View>

        <GestureDetector gesture={resizeGesture}>
          <View style={styles.resizeStrip}>
            <View style={styles.grabber} />
          </View>
        </GestureDetector>
      </Animated.View>
    </GestureDetector>
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

  headerRow: { flex: 1, justifyContent: "space-between" },

  title: { color: "#fff", fontSize: 11, fontWeight: "800" },

  time: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },

  resizeStrip: {
    height: 14,
    marginTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },

  grabber: {
    width: 22,
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.backgroundSecondary,
    opacity: 0.9,
  },
});
