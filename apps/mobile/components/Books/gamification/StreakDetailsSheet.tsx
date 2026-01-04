import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import dayjs from "dayjs";
import { MText, bookshelfTheme } from "@musti/ui-native";

import { useReadingGamificationStore } from "@/store/bookshelf/readingGamification/useReadingGamificationStore";
import { useGamificationSettingsStore } from "@/store/bookshelf/readingGamification/useGamificationSettingsStore";
import { BottomSheetModal } from "@/components/ui/modals/BottomSheetModal";

const { spacing, radii, colors } = bookshelfTheme;

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function StreakDetailsSheet({ visible, onClose }: Props) {
  const streak = useReadingGamificationStore((s) => s.streak);
  const xp = useReadingGamificationStore((s) => s.xp);
  const daily = useReadingGamificationStore((s) => s.daily);

  const settings = useGamificationSettingsStore((s) => s.settings);

  const todayKey = dayjs().format("YYYY-MM-DD");
  const today = daily?.[todayKey] ?? { pages: 0, minutes: 0, sessions: 0 };
  const goal = Math.max(1, Number(settings.qualifyPagesPerDay ?? 10));

  const last7 = useMemo(() => {
    const out: Array<{ day: string; pages: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const k = dayjs().subtract(i, "day").format("YYYY-MM-DD");
      out.push({ day: k, pages: daily?.[k]?.pages ?? 0 });
    }
    return out;
  }, [daily]);

  return (
    <BottomSheetModal
      visible={visible}
      title="Streak & Level"
      onClose={onClose}
      variant="bookshelf"
    >
      <View style={styles.section}>
        <MText style={styles.h2}>Today</MText>
        <View style={styles.row}>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>Pages</MText>
            <MText style={styles.kpiValue}>
              {today.pages} / {goal}
            </MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>Minutes</MText>
            <MText style={styles.kpiValue}>{today.minutes}</MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>Sessions</MText>
            <MText style={styles.kpiValue}>{today.sessions}</MText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <MText style={styles.h2}>Streak</MText>
        <View style={styles.row}>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>Current</MText>
            <MText style={styles.kpiValue}>{streak.current} days</MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>Best</MText>
            <MText style={styles.kpiValue}>{streak.best} days</MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>Freeze</MText>
            <MText style={styles.kpiValue}>{streak.freezeTokens ?? 0}</MText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <MText style={styles.h2}>Level</MText>
        <View style={styles.row}>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>Level</MText>
            <MText style={styles.kpiValue}>{xp.level}</MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>XP</MText>
            <MText style={styles.kpiValue}>
              {xp.xpIntoLevel} / {xp.xpForNextLevel}
            </MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>Total</MText>
            <MText style={styles.kpiValue}>{xp.totalXp}</MText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <MText style={styles.h2}>Last 7 days</MText>
        <View style={styles.list}>
          {last7.map((d) => (
            <View key={d.day} style={styles.listRow}>
              <MText style={styles.day}>
                {dayjs(d.day).format("ddd, MMM D")}
              </MText>
              <MText style={styles.pages}>{d.pages} pages</MText>
            </View>
          ))}
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  h2: { fontWeight: "800", marginBottom: spacing.sm },

  row: { flexDirection: "row", gap: spacing.md },
  kpi: { flex: 1, minWidth: 0 },
  kpiLabel: { opacity: 0.7, fontSize: 12 },
  kpiValue: { fontWeight: "800", marginTop: 3 },

  list: { marginTop: spacing.xs, gap: spacing.xs },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  day: { opacity: 0.85 },
  pages: { fontWeight: "700" },
});
