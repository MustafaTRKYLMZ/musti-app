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
  visible: boolean;
  ready: boolean;

  totalPages?: number;

  title?: string;
  subtitle?: string;
  coverUri?: string | null;

  minShowMs?: number;
  maxShowMs?: number;

  onHidden?: () => void;
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export const PdfOpenIntroOverlay: FC<Props> = ({
  visible,
  ready,
  totalPages,
  title = "Opening…",
  subtitle = "Preparing pages…",
  coverUri = null,
  minShowMs = 450,
  maxShowMs = 9000,
  onHidden,
}) => {
  const { colors } = useTheme();

  const [mounted, setMounted] = useState(visible);
  const shownAtRef = useRef<number | null>(null);

  const readyRef = useRef(ready);
  useEffect(() => {
    readyRef.current = ready;
  }, [ready]);

  // overlay anim
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;
  const translateY = useRef(new Animated.Value(10)).current;

  // book anim
  const bookWobble = useRef(new Animated.Value(0)).current; // 0..1
  const shimmerX = useRef(new Animated.Value(0)).current; // 0..1

  // progress 0..1
  const progress = useRef(new Animated.Value(0)).current;

  // visual loops (wobble + shimmer)
  const visualLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // progress loop (creep)
  const progressLoopRef = useRef<Animated.CompositeAnimation | null>(null);

  // UI texts
  const [phase, setPhase] = useState<"Indexing" | "Rendering" | "Finalizing">(
    "Indexing"
  );
  const [progressPct, setProgressPct] = useState(0);
  const [pagesPrepared, setPagesPrepared] = useState(0);

  const safeTotalPages = Math.max(0, Number(totalPages ?? 0) || 0);

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

  useEffect(() => {
    const id = progress.addListener(({ value }) => {
      const v = clamp01(value);
      setProgressPct(Math.round(v * 100));

      if (safeTotalPages > 0) {
        const cap = Math.max(1, Math.floor(safeTotalPages * 0.88));
        const prepared = Math.min(safeTotalPages, Math.round(v * cap));
        setPagesPrepared(prepared);
      } else {
        setPagesPrepared(0);
      }
    });
    return () => progress.removeListener(id);
  }, [progress, safeTotalPages]);

  const stopVisualLoops = () => {
    visualLoopRef.current?.stop?.();
    visualLoopRef.current = null;
  };

  const stopProgressLoop = () => {
    progressLoopRef.current?.stop?.();
    progressLoopRef.current = null;
  };

  const stopAllLoops = () => {
    stopVisualLoops();
    stopProgressLoop();
  };

  const startVisualLoops = () => {
    stopVisualLoops();

    bookWobble.setValue(0);
    shimmerX.setValue(0);

    const wobble = Animated.loop(
      Animated.sequence([
        Animated.timing(bookWobble, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(bookWobble, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );

    const shimmer = Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );

    visualLoopRef.current = Animated.parallel([wobble, shimmer]);
    visualLoopRef.current.start();
  };

  const startProgressCreep = () => {
    stopProgressLoop();

    const creep = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 0.92,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0.96,
          duration: 2400,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0.98,
          duration: 3200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );

    progressLoopRef.current = creep;
    creep.start();
  };

  const startProgressToSoftCap = () => {
    stopProgressLoop();

    progress.stopAnimation();
    progress.setValue(0);

    const base = 900;
    const per100 = 650;
    const pagesBucket = Math.min(700, safeTotalPages);
    const duration =
      safeTotalPages > 0 ? base + (pagesBucket / 100) * per100 : 1400;

    Animated.timing(progress, {
      toValue: 0.88,
      duration: Math.round(duration),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (!finished) return;
      if (!readyRef.current) {
        startProgressCreep();
      }
    });
  };

  const hideNow = () => {
    stopAllLoops();

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
  };

  // show overlay
  useEffect(() => {
    if (!visible) return;

    setMounted(true);
    shownAtRef.current = Date.now();

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

    // phases (cosmetic)
    setPhase("Indexing");
    const t1 = setTimeout(
      () => !readyRef.current && setPhase("Rendering"),
      650
    );
    const t2 = setTimeout(
      () => !readyRef.current && setPhase("Finalizing"),
      1500
    );

    startVisualLoops();
    startProgressToSoftCap();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      stopAllLoops();
      progress.stopAnimation();
    };
  }, [visible]);

  // hide logic
  useEffect(() => {
    if (!mounted) return;

    if (!visible) {
      hideNow();
      return;
    }

    if (ready) {
      stopAllLoops();

      progress.stopAnimation();
      Animated.timing(progress, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();

      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,
          duration: 90,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 120,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      const shownAt = shownAtRef.current ?? Date.now();
      const elapsed = Date.now() - shownAt;
      const wait = Math.max(0, minShowMs - elapsed);
      const t = setTimeout(() => hideNow(), wait);
      return () => clearTimeout(t);
    }

    const shownAt = shownAtRef.current ?? Date.now();
    const elapsed = Date.now() - shownAt;
    const left = Math.max(0, maxShowMs - elapsed);
    const t = setTimeout(() => hideNow(), left);
    return () => clearTimeout(t);
  }, [mounted, visible, ready, minShowMs, maxShowMs, progress, scale]);

  if (!mounted) return null;

  const coverTilt = bookWobble.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "-10deg"],
  });
  const coverScaleX = bookWobble.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.92],
  });

  const shimmerTranslate = shimmerX.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 110],
  });

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const pagesLine =
    safeTotalPages > 0
      ? `${Math.min(safeTotalPages, pagesPrepared)} / ${safeTotalPages} pages`
      : `${progressPct}%`;

  return (
    <Animated.View style={[styles.overlay, backdropStyle, { opacity }]}>
      <Animated.View
        style={[
          styles.card,
          cardStyle,
          { transform: [{ translateY }, { scale }] },
        ]}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.backgroundSecondary },
            ]}
          >
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
              {phase}…
            </MText>
            <ActivityIndicator />
          </View>
        </View>

        <View style={{ height: spacing.md }} />

        {/* Book Animation */}
        <View style={styles.bookStage}>
          {/* Pages block */}
          <View
            style={[
              styles.pages,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <Animated.View
              pointerEvents="none"
              style={[
                styles.shimmer,
                {
                  transform: [{ translateX: shimmerTranslate }],
                  backgroundColor: "rgba(255,255,255,0.20)",
                },
              ]}
            />
          </View>

          {/* Cover */}
          <Animated.View
            style={[
              styles.cover,
              {
                borderColor: colors.borderSubtle,
                transform: [
                  { perspective: 800 },
                  { rotateY: coverTilt },
                  { scaleX: coverScaleX },
                ],
              },
            ]}
          >
            {coverUri ? (
              <Image
                source={{ uri: coverUri }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={[
                  styles.coverFallback,
                  { backgroundColor: colors.primary },
                ]}
              />
            )}
          </Animated.View>

          {/* shadow under book */}
          <View
            pointerEvents="none"
            style={[styles.bookShadow, { backgroundColor: "rgba(0,0,0,0.16)" }]}
          />
        </View>

        {/* Progress */}
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

        <View style={{ height: spacing.sm }} />

        <View style={styles.metaRow}>
          <MText
            variant="caption"
            color="textSecondary"
            style={{ opacity: 0.85 }}
          >
            {pagesLine}
          </MText>
          <MText
            variant="caption"
            color="textSecondary"
            style={{ opacity: 0.85 }}
          >
            {progressPct}%
          </MText>
        </View>
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

  bookStage: {
    height: 110,
    justifyContent: "center",
    alignItems: "center",
  },

  pages: {
    position: "absolute",
    width: 96,
    height: 108,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },

  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 28,
    borderRadius: 16,
    opacity: 0.85,
  },

  cover: {
    width: 92,
    height: 108,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },

  coverFallback: {
    flex: 1,
    opacity: 0.9,
  },

  bookShadow: {
    position: "absolute",
    bottom: 10,
    width: 90,
    height: 10,
    borderRadius: 999,
    opacity: 0.35,
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

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
});
