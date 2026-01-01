// apps/mobile/components/ui/pdf/PdfOpenIntroOverlay.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Animated, Easing, Image } from "react-native";
import { MText, spacing, radii, useTheme } from "@budget/ui-native";

type Props = {
  /** Parent controls this: when true overlay shows */
  visible: boolean;

  /** When PDF is truly ready (onLoadComplete), set to true */
  ready: boolean;

  /** Title (book name) */
  title?: string;

  /** Optional subtitle line */
  subtitle?: string;

  /** Optional cover image */
  coverUri?: string | null;

  /** Minimum time overlay stays visible once shown (prevents flash) */
  minShowMs?: number;

  /** Fade duration for crossfade */
  fadeMs?: number;

  /** If true, show a fake progress that ramps to 70% while loading */
  showFakeProgress?: boolean;

  /** Called when overlay has fully hidden (after fade out) */
  onHidden?: () => void;
};

export const PdfOpenIntroOverlay: React.FC<Props> = ({
  visible,
  ready,
  title = "Opening…",
  subtitle = "Preparing pages…",
  coverUri = null,
  minShowMs = 450,
  fadeMs = 180,
  showFakeProgress = true,
  onHidden,
}) => {
  const { colors } = useTheme();

  const [rendered, setRendered] = useState(visible);

  const introOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(8)).current;

  const shownAtRef = useRef<number>(0);

  // fake progress (0..1)
  const prog = useRef(new Animated.Value(0)).current;

  const progressText = useMemo(() => {
    // avoid reading animated value directly; just render a generic text
    return ready ? "Finalizing…" : "Preparing…";
  }, [ready]);

  const startFakeProgress = () => {
    if (!showFakeProgress) return;

    prog.stopAnimation();
    prog.setValue(0);

    // ramp to 0.7 over ~1.1s, then hold
    Animated.timing(prog, {
      toValue: 0.7,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const finishFakeProgress = () => {
    if (!showFakeProgress) return;

    prog.stopAnimation();
    Animated.timing(prog, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const show = () => {
    setRendered(true);
    shownAtRef.current = Date.now();
    startFakeProgress();

    introOpacity.stopAnimation();
    cardTranslate.stopAnimation();

    introOpacity.setValue(0);
    cardTranslate.setValue(8);

    Animated.parallel([
      Animated.timing(introOpacity, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(cardTranslate, {
        toValue: 0,
        useNativeDriver: true,
        friction: 7,
      }),
    ]).start();
  };

  const hide = () => {
    const elapsed = Date.now() - shownAtRef.current;
    const wait = Math.max(0, minShowMs - elapsed);

    finishFakeProgress();

    setTimeout(() => {
      Animated.timing(introOpacity, {
        toValue: 0,
        duration: fadeMs,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start(() => {
        setRendered(false);
        onHidden?.();
      });
    }, wait);
  };

  // when parent toggles visible
  useEffect(() => {
    if (visible) show();
    else if (rendered) hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // when ready flips true while visible, auto-hide
  useEffect(() => {
    if (!visible) return;
    if (!ready) return;
    hide();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  if (!rendered) return null;

  const progressWidth = prog.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        StyleSheet.absoluteFillObject,
        styles.overlay,
        {
          backgroundColor: colors.background,
          opacity: introOpacity,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
            transform: [{ translateY: cardTranslate }],
          },
        ]}
      >
        <View
          style={[
            styles.cover,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          {coverUri ? (
            <Image
              source={{ uri: coverUri }}
              style={styles.coverImg}
              resizeMode="cover"
            />
          ) : (
            <>
              <View
                style={[
                  styles.spine,
                  { backgroundColor: colors.primary, opacity: 0.55 },
                ]}
              />
              <View style={styles.skel} />
              <View style={[styles.skel, { width: "65%", opacity: 0.55 }]} />
            </>
          )}
        </View>

        <View style={{ height: spacing.lg }} />

        <MText
          variant="bodyStrong"
          color="textPrimary"
          numberOfLines={2}
          style={{ textAlign: "center" }}
        >
          {title}
        </MText>

        <View style={{ height: spacing.xs }} />

        <MText
          variant="caption"
          color="textSecondary"
          numberOfLines={1}
          style={{ textAlign: "center", opacity: 0.9 }}
        >
          {subtitle}
        </MText>

        <View style={{ height: spacing.lg }} />

        {showFakeProgress ? (
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: colors.borderSubtle },
            ]}
          >
            <Animated.View
              style={[
                styles.progressFill,
                { backgroundColor: colors.primary, width: progressWidth },
              ]}
            />
          </View>
        ) : null}

        <View style={{ height: spacing.sm }} />

        <MText
          variant="caption"
          color="textSecondary"
          style={{ textAlign: "center", opacity: 0.75 }}
        >
          {progressText}
        </MText>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: "center",
  },
  cover: {
    width: 120,
    height: 160,
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  coverImg: { width: "100%", height: "100%" },
  spine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
  },
  skel: {
    width: "70%",
    height: 10,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.22)",
    marginTop: 10,
  },
  progressTrack: {
    width: "100%",
    height: 8,
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%" },
});
