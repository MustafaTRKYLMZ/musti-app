import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import dayjs from "dayjs";
import { MText, bookshelfTheme } from "@budget/ui-native";

import { StreakSheet } from "@/components/Books/gamification/StreakSheet";

import { useReadingGamificationStore } from "@/store/bookshelf/readingGamification/useReadingGamificationStore";
import { useGamificationSettingsStore } from "@/store/bookshelf/readingGamification/useGamificationSettingsStore";
import { CircularProgress } from "@/components/ui/CircularProgress";

const { colors, spacing, radii } = bookshelfTheme;

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function StreakCard() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    useGamificationSettingsStore.getState().hydrate();
    useReadingGamificationStore.getState().hydrate();
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

  const xpProgress = clamp01(
    xp.xpForNextLevel > 0 ? xp.xpIntoLevel / xp.xpForNextLevel : 0
  );

  const subtitle =
    today.pages >= goalPages
      ? "Today secured ✅ Tap for details"
      : `Read ${Math.max(
          0,
          goalPages - today.pages
        )} more pages · Tap for details`;

  if (!gHydrated || !sHydrated) return null;

  return (
    <>
      <Pressable style={styles.card} onPress={() => setOpen(true)}>
        <View style={styles.row}>
          <CircularProgress
            size={58}
            stroke={7}
            value={goalProgress}
            labelTop={`${today.pages}/${goalPages}`}
            labelBottom="today"
            progressColor={colors.success}
          />

          <View style={styles.mid}>
            <MText style={styles.title}>Streak</MText>
            <MText style={styles.sub} numberOfLines={2}>
              {subtitle}
            </MText>

            <View style={{ height: spacing.xs }} />

            <View style={styles.microRow}>
              <View style={styles.chip}>
                <MText style={styles.chipText}>
                  🔥 {streak.current} day{streak.current === 1 ? "" : "s"}
                </MText>
              </View>

              <View style={styles.chip}>
                <MText style={styles.chipText}>🏆 best {streak.best}</MText>
              </View>
            </View>
          </View>

          <View style={styles.right}>
            <CircularProgress
              size={46}
              stroke={6}
              value={xpProgress}
              labelTop={`L${xp.level}`}
              labelBottom="xp"
              progressColor={colors.success}
            />
            <MText style={styles.tap} numberOfLines={1}>
              Tap
            </MText>
          </View>
        </View>
      </Pressable>

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
    borderRadius: radii.lg,
    padding: spacing.md,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  mid: {
    flex: 1,
    minWidth: 0,
  },

  title: { fontSize: 16, fontWeight: "900" },
  sub: { opacity: 0.75, marginTop: 2 },

  microRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },

  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
    opacity: 0.9,
  },

  right: {
    alignItems: "center",
    gap: 4,
  },

  tap: {
    fontSize: 11,
    opacity: 0.65,
    fontWeight: "700",
  },
});
