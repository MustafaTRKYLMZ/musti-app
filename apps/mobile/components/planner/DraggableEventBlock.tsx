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
import { eventToTitle } from "@/utils/calendar/format";

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

const MIN_EXPANDED_HEIGHT = 28;

function fmtHHmm(minuteOfDay: number) {
  const m = Math.max(0, Math.min(24 * 60 - 1, Math.round(minuteOfDay)));
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(h)}:${pad2(mm)}`;
}

export function DraggableEventBlock(p: Props) {
  const pxPerMin = p.weekView.pxPerMinute;
  const step = p.weekView.stepMinutes;
  const title = eventToTitle(p.event);
  const blockHeight = Math.max(MIN_EXPANDED_HEIGHT, p.height);

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
    height: Math.max(MIN_EXPANDED_HEIGHT, baseHeight.value + hY.value),
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
              height: Math.max(4, p.height),
              backgroundColor: bg,
            },
          ]}
        />
      </GestureDetector>
    );
  }

  const showTimeInBlock = blockHeight >= 44;

  return (
    <GestureDetector gesture={cardGesture}>
      <Animated.View
        style={[
          styles.card,
          {
            left: p.left + 2,
            top: p.top,
            width: p.width - 4,
            height: blockHeight,
            backgroundColor: bg,
          },
          aStyle,
        ]}
      >
        <View style={styles.headerRow}>
          <Text numberOfLines={blockHeight >= 52 ? 2 : 1} style={styles.title}>
            {title}
          </Text>
          {previewRange ? (
            <Text style={styles.time}>{previewRange}</Text>
          ) : showTimeInBlock ? (
            <Text style={styles.time} numberOfLines={1}>
              {fmtHHmm(p.minMinute + p.top / pxPerMin)}–
              {fmtHHmm(p.minMinute + (p.top + p.height) / pxPerMin)}
            </Text>
          ) : null}
        </View>

        {canDrag && blockHeight >= 40 ? (
          <GestureDetector gesture={resizeGesture}>
            <View style={styles.resizeStrip}>
              <View style={styles.grabber} />
            </View>
          </GestureDetector>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  compactLine: { position: "absolute", borderRadius: 2 },

  card: {
    position: "absolute",
    flexDirection: "column",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
  },

  headerRow: { flex: 1, justifyContent: "flex-start" },

  title: { color: "#fff", fontSize: 12, fontWeight: "800", lineHeight: 15 },

  time: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "600",
    marginTop: 2,
  },

  resizeStrip: {
    height: 12,
    marginTop: "auto",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.45)",
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
