import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, Pressable, Animated, ScrollView } from "react-native";
import dayjs from "dayjs";
import { useTranslation, formatTranslation } from "@musti/core";
import { MText, bookshelfTheme, BaseIcon, iconSizes } from "@musti/ui-native";

import { CircularProgress } from "@/components/ui/CircularProgress";
import { StreakSheet } from "@/components/Books/gamification/StreakSheet";
import { ReadingPulseStrip } from "@/components/Books/gamification/ReadingPulseStrip";

import { useReadingGamificationStore } from "@/store/bookshelf/readingGamification/useReadingGamificationStore";
import { useGamificationSettingsStore } from "@/store/bookshelf/readingGamification/useGamificationSettingsStore";

import { useToast } from "@/components/ui/ToastProvider";
import { useLastGain } from "@/hooks/useLastGain";

const { colors, spacing, radii } = bookshelfTheme;

const TODAY_RING = 52;
const RING_STROKE = 6;
const CHIP_ICON = iconSizes.md;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function StreakCard() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { showToast } = useToast();

  const { last, consume } = useLastGain();

  useEffect(() => {
    const settingsState = useGamificationSettingsStore.getState();
    if (!settingsState.hydrated) settingsState.hydrate();

    const readingState = useReadingGamificationStore.getState();
    if (!readingState.hydrated) readingState.hydrate();
  }, []);

  const gHydrated = useReadingGamificationStore((s) => s.hydrated);
  const sHydrated = useGamificationSettingsStore((s) => s.hydrated);

  const daily = useReadingGamificationStore((s) => s.daily);
  const streak = useReadingGamificationStore((s) => s.streak);
  const xp = useReadingGamificationStore((s) => s.xp);

  const settings = useGamificationSettingsStore((s) => s.settings);

  const todayKey = useMemo(() => dayjs().format("YYYY-MM-DD"), []);
  const today = daily?.[todayKey] ?? { pages: 0, minutes: 0, sessions: 0 };

  const goalPages = Math.max(1, Number(settings.qualifyPagesPerDay ?? 10));
  const goalProgress = clamp01(today.pages / goalPages);
  const goalDone = today.pages >= goalPages;

  const xpProgress = clamp01(
    xp.xpForNextLevel > 0 ? xp.xpIntoLevel / xp.xpForNextLevel : 0
  );

  const pulse = useRef(new Animated.Value(1)).current;
  const prevGoalDoneRef = useRef(false);

  useEffect(() => {
    if (!gHydrated || !sHydrated) return;

    const prev = prevGoalDoneRef.current;

    if (!prev && goalDone) {
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.03,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1.0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();

      showToast({
        title: t("bookshelf.streak.securedTitle"),
        message: `${t("bookshelf.streak.securedMsgPrefix")} ${goalPages} ${t("bookshelf.streak.securedMsgSuffix")}`,
        duration: 3200,
      });
    }

    prevGoalDoneRef.current = goalDone;
  }, [goalDone, goalPages, gHydrated, sHydrated, pulse, showToast, t]);

  useEffect(() => {
    if (!gHydrated || !sHydrated) return;
    if (!last) return;

    const title =
      last.kind === "pages"
        ? t("bookshelf.toast.progressSaved")
        : last.kind === "planComplete"
          ? t("bookshelf.toast.planComplete")
          : t("bookshelf.toast.targetComplete");

    let message = "";
    if (last.kind === "pages") {
      const parts: string[] = [];
      if (last.pages > 0) {
        parts.push(
          `${last.pages} ${last.pages === 1 ? t("bookshelf.toast.page") : t("bookshelf.toast.pages")}`
        );
      }
      if ((last.minutes ?? 0) > 0) {
        parts.push(`${last.minutes} ${t("bookshelf.toast.min")}`);
      }
      if (last.xp > 0) parts.push(`+${last.xp} XP`);
      message = parts.join(" · ");
    } else {
      message = last.xp > 0 ? `+${last.xp} XP` : t("bookshelf.toast.nice");
    }

    showToast({
      title,
      message,
      duration: 2600,
    });

    consume();
  }, [last, consume, showToast, gHydrated, sHydrated, t]);

  const dayLabel =
    streak.current === 1
      ? t("bookshelf.streak.day")
      : t("bookshelf.streak.days");

  const levelChipLabel = formatTranslation(t("bookshelf.streak.levelChip"), {
    level: String(xp.level),
    percent: String(Math.round(xpProgress * 100)),
  });

  const cardA11yLabel = formatTranslation(t("bookshelf.streak.cardA11y"), {
    pages: String(today.pages),
    goal: String(goalPages),
    streak: String(streak.current),
    level: String(xp.level),
  });

  if (!gHydrated || !sHydrated) return null;

  return (
    <>
      <Animated.View style={{ transform: [{ scale: pulse }] }}>
        <Pressable
          style={({ pressed }) => [
            styles.card,
            goalDone && styles.cardDone,
            pressed && styles.cardPressed,
          ]}
          onPress={() => setOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={cardA11yLabel}
          accessibilityHint={t("bookshelf.streak.detailsHint")}
        >
          <View style={styles.pulseRow}>
            <ReadingPulseStrip progress={goalProgress} goalDone={goalDone} />
            <CircularProgress
              size={TODAY_RING}
              stroke={RING_STROKE}
              value={goalProgress}
              labelTop={`${today.pages}/${goalPages}`}
              labelBottom={t("bookshelf.streak.pages")}
              progressColor={goalDone ? colors.success : colors.primary}
              style={styles.todayRing}
            />
          </View>

          <View style={styles.bottomRow}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.chipScroll}
              contentContainerStyle={styles.chipRow}
            >
              <View style={styles.chip}>
                <BaseIcon name="flame-outline" size={CHIP_ICON} color={colors.primary} />
                <MText variant="caption" style={styles.chipText}>
                  {streak.current} {dayLabel}
                </MText>
              </View>

              <View style={styles.chip}>
                <BaseIcon
                  name="trophy-outline"
                  size={CHIP_ICON}
                  color={colors.textSecondary}
                />
                <MText variant="caption" style={styles.chipText}>
                  {t("bookshelf.streak.best")} {streak.best}
                </MText>
              </View>

              <View style={styles.chip}>
                <BaseIcon name="ribbon-outline" size={CHIP_ICON} color={colors.primary} />
                <MText variant="caption" style={styles.chipText} numberOfLines={1}>
                  {levelChipLabel}
                </MText>
              </View>
            </ScrollView>

            <View style={styles.detailsCue} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              <BaseIcon
                name="chevron-forward"
                size={CHIP_ICON}
                color={colors.textSecondary}
              />
            </View>
          </View>
        </Pressable>
      </Animated.View>

      <StreakSheet visible={open} onClose={() => setOpen(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardDone: {
    borderColor: colors.success,
  },
  cardPressed: {
    opacity: 0.92,
  },

  pulseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  todayRing: {
    flexShrink: 0,
  },

  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  chipScroll: {
    flex: 1,
    minWidth: 0,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingRight: spacing.xs,
  },
  detailsCue: {
    flexShrink: 0,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.75,
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chipText: {
    fontWeight: "600",
    opacity: 0.9,
  },
});
