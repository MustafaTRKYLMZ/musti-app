// apps/mobile/components/ui/pdf/PdfOpenIntroOverlay.tsx
import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
} from "react-native";
import { MText, spacing, radii, useTheme } from "@budget/ui-native";
import { BaseIcon } from "@/components/ui/AppIcon";

type Props = {
  visible: boolean; // parent wants it shown
  ready: boolean; // true when PDF onLoadComplete fires
  title?: string;
  subtitle?: string;

  coverUri?: string | null;

  // UX tuning
  minShowMs?: number;
  onHidden?: () => void;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const PdfOpenIntroOverlay: FC<Props> = ({
  visible,
  ready,
  title = "Opening…",
  subtitle = "Preparing pages…",
  coverUri = null,
  minShowMs = 450,
  onHidden,
}) => {
  const { colors } = useTheme();

  const [mounted, setMounted] = useState(visible);
  const shownAtRef = useRef<number | null>(null);

  // overlay anim
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  // progress anim (0..1)
  const progress = useRef(new Animated.Value(0)).current;
  const progressLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  const [progressText, setProgressText] = useState(0);

  const backdropStyle = useMemo(
    () => ({ backgroundColor: colors.backdropStrong }),
    [colors.backdropStrong]
  );

  const cardStyle = useMemo(
    () => ({
      backgroundColor: colors.surface,
      borderColor: colors.borderSubtle,
    }),
    [colors.surface, colors.borderSubtle]
  );

  // keep % label in sync
  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      setProgressText(Math.round(clamp01(value) * 100));
    });
    return () => progress.removeListener(id);
  }, [progress]);

  const startFakeProgress = () => {
    progress.stopAnimation();
    progress.setValue(0);

    // 0 -> 0.72 in ~1.3s, then 0.72 -> 0.86 slow repeat
    const a = Animated.timing(progress, {
      toValue: 0.72,
      duration: 1300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    const b1 = Animated.timing(progress, {
      toValue: 0.86,
      duration: 2400,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    });

    const b2 = Animated.timing(progress, {
      toValue: 0.74,
      duration: 2600,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    });

    const loop = Animated.loop(Animated.sequence([b1, b2]));
    progressLoopRef.current = loop;

    a.start(({ finished }) => {
      if (!finished) return;
      // start looping only if still not ready
      if (!ready) loop.start();
    });
  };

  const stopFakeProgressLoop = () => {
    progressLoopRef.current?.stop?.();
    progressLoopRef.current = null;
  };

  // show overlay
  useEffect(() => {
    if (!visible) return;

    setMounted(true);
    shownAtRef.current = Date.now();

    // show anim
    opacity.setValue(0);
    scale.setValue(0.98);
    translateY.setValue(10);

    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // progress anim
    startFakeProgress();

    return () => {
      stopFakeProgressLoop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // when ready: fill to 100, wait minShowMs, then hide
  useEffect(() => {
    if (!mounted) return;
    if (!visible) return;
    if (!ready) return;

    stopFakeProgressLoop();

    const shownAt = shownAtRef.current ?? Date.now();
    const elapsed = Date.now() - shownAt;
    const wait = Math.max(0, minShowMs - elapsed);

    // 1) snap progress to 1 quickly
    Animated.timing(progress, {
      toValue: 1,
      duration: 240,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // 2) hide after min show
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.985,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 6,
          duration: 180,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        setMounted(false);
        onHidden?.();
      });
    }, wait);

    return () => clearTimeout(t);
  }, [
    mounted,
    visible,
    ready,
    minShowMs,
    opacity,
    scale,
    translateY,
    progress,
    onHidden,
  ]);

  if (!mounted) return null;

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View
      pointerEvents="auto"
      style={[
        styles.overlay,
        backdropStyle,
        {
          opacity,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          cardStyle,
          {
            transform: [{ translateY }, { scale }],
          },
        ]}
      >
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <BaseIcon
              family="ion"
              name="book-outline"
              size={20}
              color={colors.textPrimary}
            />
          </View>

          <View style={{ flex: 1 }}>
            <MText variant="bodyStrong" color="textPrimary" numberOfLines={2}>
              {title}
            </MText>
            <MText
              variant="body"
              color="textSecondary"
              numberOfLines={2}
              style={{ marginTop: 2, opacity: 0.85 }}
            >
              {subtitle}
            </MText>
          </View>

          <View style={{ alignItems: "flex-end", gap: 6 }}>
            <MText variant="caption" color="textSecondary">
              {progressText}%
            </MText>
            <ActivityIndicator />
          </View>
        </View>

        {/* Book / Cover Visual */}
        <View style={{ height: spacing.md }} />

        <View style={styles.bookRow}>
          <View style={styles.bookMockWrap}>
            {coverUri ? (
              <Image
                source={{ uri: coverUri }}
                style={[
                  styles.coverImage,
                  { borderColor: colors.borderSubtle },
                ]}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.bookMock,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                {/* spine */}
                <View
                  style={[styles.spine, { backgroundColor: colors.primary }]}
                />
                {/* spine highlight */}
                <View
                  style={[
                    styles.spineHighlight,
                    { backgroundColor: "rgba(255,255,255,0.18)" },
                  ]}
                />
                {/* simple title lines */}
                <View style={styles.mockText}>
                  <View
                    style={[
                      styles.mockLine,
                      { backgroundColor: colors.borderSubtle, width: "70%" },
                    ]}
                  />
                  <View
                    style={[
                      styles.mockLine,
                      { backgroundColor: colors.borderSubtle, width: "52%" },
                    ]}
                  />
                  <View
                    style={[
                      styles.mockLine,
                      { backgroundColor: colors.borderSubtle, width: "40%" },
                    ]}
                  />
                </View>
              </View>
            )}
          </View>

          <View style={{ flex: 1, gap: 6, justifyContent: "center" }}>
            <MText
              variant="body"
              color="textPrimary"
              style={{ fontWeight: "800" }}
            >
              Getting things ready…
            </MText>
            <MText
              variant="caption"
              color="textSecondary"
              style={{ opacity: 0.85 }}
            >
              This may take a moment for large PDFs.
            </MText>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={{ height: spacing.md }} />

        <View
          style={[
            styles.progressTrack,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressFill,
              { width: barWidth, backgroundColor: colors.primary },
            ]}
          />
        </View>

        {/* tiny hint */}
        <View style={{ height: spacing.sm }} />
        <MText variant="caption" color="textSecondary" style={{ opacity: 0.8 }}>
          Tip: You can swipe pages as soon as it opens.
        </MText>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },

  card: {
    width: "100%",
    maxWidth: 560,
    borderRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  bookRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },

  bookMockWrap: {
    width: 72,
    height: 92,
  },

  coverImage: {
    width: "100%",
    height: "100%",
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
  },

  bookMock: {
    width: "100%",
    height: "100%",
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: "hidden",
  },

  spine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 14,
  },

  spineHighlight: {
    position: "absolute",
    left: 14,
    top: 0,
    bottom: 0,
    width: 4,
  },

  mockText: {
    flex: 1,
    paddingLeft: 22,
    paddingRight: 10,
    paddingTop: 14,
    gap: 8,
  },

  mockLine: {
    height: 6,
    borderRadius: 4,
    opacity: 0.85,
  },

  progressTrack: {
    height: 8,
    borderRadius: radii.full,
    overflow: "hidden",
    borderWidth: 1,
  },

  progressFill: {
    height: "100%",
    borderRadius: radii.full,
  },
});
