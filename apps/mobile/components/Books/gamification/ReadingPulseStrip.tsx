import React, { useEffect, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import Svg, { Path, Line } from "react-native-svg";
import { useTranslation } from "@musti/core";
import { BaseIcon, bookshelfTheme } from "@musti/ui-native";

const { colors, spacing } = bookshelfTheme;

const WAVE_PERIOD = 128;
const STRIP_HEIGHT = 30;

/** One monitor tile — baseline at y=15 with a single QRS-like beat. */
const EKG_PATH =
  "M0 15 H28 L32 15 L35 14 L38 15 H44 L46 15 L47.5 13 L48.5 15 " +
  "L50 15 L51 4 L52.5 25 L54 7 L55.5 21 L57 15 H128";

type Props = {
  progress: number;
  goalDone: boolean;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function waveColor(progress: number, goalDone: boolean) {
  if (goalDone) return colors.success;
  if (progress < 0.35) return colors.textSecondary;
  if (progress < 1) return colors.primary;
  return colors.success;
}

function WaveTile({ color, opacity }: { color: string; opacity: number }) {
  return (
    <Svg
      width={WAVE_PERIOD}
      height={STRIP_HEIGHT}
      viewBox={`0 0 ${WAVE_PERIOD} ${STRIP_HEIGHT}`}
    >
      <Line
        x1={0}
        y1={15}
        x2={WAVE_PERIOD}
        y2={15}
        stroke={color}
        strokeWidth={1}
        opacity={0.12}
      />
      <Path
        d={EKG_PATH}
        stroke={color}
        fill="none"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={opacity}
      />
    </Svg>
  );
}

export function ReadingPulseStrip({ progress, goalDone }: Props) {
  const { t } = useTranslation();
  const scroll = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  const p = clamp01(progress);
  const amplitude = 0.1 + p * 0.9;
  const strokeOpacity = 0.35 + p * 0.65;
  const color = waveColor(p, goalDone);
  const scrollDuration = Math.round(3400 - p * 1400);

  const a11yLabel = useMemo(() => {
    const percent = Math.round(p * 100);
    if (goalDone) return t("bookshelf.streak.pulseA11yDone");
    return t("bookshelf.streak.pulseA11y").replace("{{percent}}", String(percent));
  }, [goalDone, p, t]);

  useEffect(() => {
    scroll.setValue(0);
    const loop = Animated.loop(
      Animated.timing(scroll, {
        toValue: -WAVE_PERIOD,
        duration: scrollDuration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [scroll, scrollDuration]);

  useEffect(() => {
    if (!goalDone) {
      iconPulse.setValue(1);
      return;
    }

    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, {
          toValue: 1.14,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulse, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.delay(900),
      ])
    );
    beat.start();
    return () => beat.stop();
  }, [goalDone, iconPulse]);

  return (
    <View
      style={styles.strip}
      accessible
      accessibilityRole="image"
      accessibilityLabel={a11yLabel}
    >
      <Animated.View
        style={[styles.iconWrap, { transform: [{ scale: iconPulse }] }]}
      >
        <BaseIcon
          name={goalDone ? "heart" : "pulse-outline"}
          color={color}
        />
      </Animated.View>

      <View style={styles.waveClip}>
        <Animated.View
          style={[styles.waveTrack, { transform: [{ translateX: scroll }] }]}
        >
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.waveTile,
                {
                  transform: [{ scaleY: amplitude }],
                },
              ]}
            >
              <WaveTile color={color} opacity={strokeOpacity} />
            </View>
          ))}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minWidth: 0,
  },
  iconWrap: {
    width: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  waveClip: {
    flex: 1,
    height: STRIP_HEIGHT,
    overflow: "hidden",
    justifyContent: "center",
  },
  waveTrack: {
    flexDirection: "row",
    alignItems: "center",
    width: WAVE_PERIOD * 3,
  },
  waveTile: {
    height: STRIP_HEIGHT,
    justifyContent: "center",
  },
});
