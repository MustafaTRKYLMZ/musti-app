import React, { useMemo, useState } from "react";
import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import dayjs from "dayjs";
import { MText, bookshelfTheme, iconSizes } from "@musti/ui-native";

import { CircularProgress } from "@/components/ui/CircularProgress";
import { IconButton } from "@musti/ui-native";

import { useReadingGamificationStore } from "@/store/bookshelf/readingGamification/useReadingGamificationStore";
import { useGamificationSettingsStore } from "@/store/bookshelf/readingGamification/useGamificationSettingsStore";
import { BottomSheetModal } from "@/components/ui/modals/BottomSheetModal";
import { GamificationSettingsCard } from "./GamificationSettingsCard";

const { colors, spacing, radii } = bookshelfTheme;

type Mode = "details" | "settings";
type Props = { visible: boolean; onClose: () => void };

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

export function StreakSheet({ visible, onClose }: Props) {
  const [mode, setMode] = useState<Mode>("details");

  const streak = useReadingGamificationStore((s) => s.streak);
  const xp = useReadingGamificationStore((s) => s.xp);
  const daily = useReadingGamificationStore((s) => s.daily);
  const settings = useGamificationSettingsStore((s) => s.settings);

  const todayKey = dayjs().format("YYYY-MM-DD");
  const today = daily?.[todayKey] ?? { pages: 0, minutes: 0, sessions: 0 };

  const goalPages = Math.max(1, Number(settings.qualifyPagesPerDay ?? 10));
  const goalProgress = clamp01(today.pages / goalPages);

  const xpProgress = clamp01(
    xp.xpForNextLevel > 0 ? xp.xpIntoLevel / xp.xpForNextLevel : 0
  );

  const last7 = useMemo(() => {
    const out: Array<{ day: string; pages: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const k = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      out.push({ day: k, pages: daily?.[k]?.pages ?? 0 });
    }
    return out;
  }, [daily]);

  const title = mode === "settings" ? "Gamification settings" : "Streak";

  const handleClose = () => {
    setMode("details");
    onClose();
  };

  const leftAction =
    mode === "settings" ? (
      <IconButton
        name="arrow-back"
        size={iconSizes.lg}
        color={colors.textPrimary}
        onPress={() => setMode("details")}
        style={styles.backBtn}
      />
    ) : null;

  return (
    <BottomSheetModal
      variant="bookshelf"
      visible={visible}
      title={title}
      onClose={handleClose}
      leftAction={leftAction}
    >
      {mode === "settings" ? (
        <GamificationSettingsCard inModal />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Summary row */}
          <View style={styles.summaryRow}>
            <CircularProgress
              size={60}
              stroke={7}
              value={goalProgress}
              labelTop={`${today.pages}/${goalPages}`}
              labelBottom="today"
              progressColor={colors.primary}
            />

            <View style={styles.summaryMid}>
              <MText style={styles.h1}>
                🔥 {streak.current} day{streak.current === 1 ? "" : "s"}
              </MText>
              <MText style={styles.sub} numberOfLines={2}>
                {today.pages >= goalPages
                  ? "Today secured ✅"
                  : `Read ${Math.max(
                      0,
                      goalPages - today.pages
                    )} more pages to secure today`}
              </MText>
            </View>

            <CircularProgress
              size={52}
              stroke={6}
              value={xpProgress}
              labelTop={`L${xp.level}`}
              labelBottom="xp"
              progressColor={colors.primary}
            />
          </View>

          {/* KPIs */}
          <View style={styles.kpiGrid}>
            <View style={styles.kpi}>
              <MText style={styles.kpiLabel}>Best</MText>
              <MText style={styles.kpiValue}>{streak.best} days</MText>
            </View>
            <View style={styles.kpi}>
              <MText style={styles.kpiLabel}>Minutes</MText>
              <MText style={styles.kpiValue}>{today.minutes}</MText>
            </View>
            <View style={styles.kpi}>
              <MText style={styles.kpiLabel}>Sessions</MText>
              <MText style={styles.kpiValue}>{today.sessions}</MText>
            </View>
            <View style={styles.kpi}>
              <MText style={styles.kpiLabel}>Freeze</MText>
              <MText style={styles.kpiValue}>{streak.freezeTokens ?? 0}</MText>
            </View>
          </View>

          {/* Last 7 days */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MText style={styles.sectionTitle}>Last 7 days</MText>
              <MText style={styles.sectionHint}>pages</MText>
            </View>

            <View style={styles.list}>
              {last7
                .map((d) => (
                  <View key={d.day} style={styles.listRow}>
                    <MText style={styles.day}>
                      {dayjs(d.day).format("ddd, MMM D")}
                    </MText>
                    <MText style={styles.pages}>{d.pages}</MText>
                  </View>
                ))
                .reverse()}
            </View>
          </View>

          {/* Settings CTA */}
          <Pressable style={styles.cta} onPress={() => setMode("settings")}>
            <MText style={styles.ctaTitle}>Gamification settings</MText>
            <MText style={styles.ctaSub} numberOfLines={1}>
              Tune streak goal, XP per page, multipliers, bonuses
            </MText>
          </Pressable>
        </ScrollView>
      )}
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing["6xl"] ?? spacing.xl,
  },

  backBtn: {
    width: 30,
    height: 30,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.md,
  },
  summaryMid: { flex: 1, minWidth: 0 },
  h1: { fontSize: 16, fontWeight: "900" },
  sub: { opacity: 0.75, marginTop: 2 },

  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  kpi: {
    flexGrow: 1,
    flexBasis: "48%",
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
  },
  kpiLabel: { opacity: 0.7, fontSize: 12 },
  kpiValue: { fontWeight: "900", marginTop: 4 },

  section: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  sectionTitle: { fontWeight: "900" },
  sectionHint: { opacity: 0.6 },

  list: { gap: spacing.xs },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  day: { opacity: 0.85 },
  pages: { fontWeight: "900" },

  cta: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
  },
  ctaTitle: { fontWeight: "900" },
  ctaSub: { opacity: 0.75, marginTop: 2 },
});
