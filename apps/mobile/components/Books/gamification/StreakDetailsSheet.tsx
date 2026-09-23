import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import dayjs from "dayjs";
import { useTranslation, formatTranslation } from "@musti/core";
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
  const { t } = useTranslation();
  const streak = useReadingGamificationStore((s) => s.streak);
  const xp = useReadingGamificationStore((s) => s.xp);
  const daily = useReadingGamificationStore((s) => s.daily);

  const settings = useGamificationSettingsStore((s) => s.settings);

  const todayKey = dayjs().format("YYYY-MM-DD");
  const today = daily?.[todayKey] ?? { pages: 0, minutes: 0, sessions: 0 };
  const goal = Math.max(1, Number(settings.qualifyPagesPerDay ?? 10));

  const dayLabel =
    streak.current === 1
      ? t("bookshelf.streak.day")
      : t("bookshelf.streak.days");

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
      title={t("bookshelf.streak.detailsTitle")}
      onClose={onClose}
      variant="bookshelf"
    >
      <View style={styles.section}>
        <MText style={styles.h2}>{t("bookshelf.stats.today")}</MText>
        <View style={styles.row}>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>{t("bookshelf.streak.pages")}</MText>
            <MText style={styles.kpiValue}>
              {today.pages} / {goal}
            </MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>
              {t("bookshelf.streak.kpi.minutes")}
            </MText>
            <MText style={styles.kpiValue}>{today.minutes}</MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>
              {t("bookshelf.streak.kpi.sessions")}
            </MText>
            <MText style={styles.kpiValue}>{today.sessions}</MText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <MText style={styles.h2}>{t("bookshelf.streak.title")}</MText>
        <View style={styles.row}>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>
              {t("bookshelf.streak.kpi.current")}
            </MText>
            <MText style={styles.kpiValue}>
              {streak.current} {dayLabel}
            </MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>
              {t("bookshelf.streak.kpi.best")}
            </MText>
            <MText style={styles.kpiValue}>
              {streak.best} {dayLabel}
            </MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>
              {t("bookshelf.streak.kpi.freeze")}
            </MText>
            <MText style={styles.kpiValue}>{streak.freezeTokens ?? 0}</MText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <MText style={styles.h2}>{t("bookshelf.streak.kpi.level")}</MText>
        <View style={styles.row}>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>
              {t("bookshelf.streak.kpi.level")}
            </MText>
            <MText style={styles.kpiValue}>{xp.level}</MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>{t("bookshelf.streak.kpi.xp")}</MText>
            <MText style={styles.kpiValue}>
              {xp.xpIntoLevel} / {xp.xpForNextLevel}
            </MText>
          </View>
          <View style={styles.kpi}>
            <MText style={styles.kpiLabel}>
              {t("bookshelf.streak.kpi.total")}
            </MText>
            <MText style={styles.kpiValue}>{xp.totalXp}</MText>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <MText style={styles.h2}>{t("bookshelf.streak.last7Days")}</MText>
        <View style={styles.list}>
          {last7.map((d) => (
            <View key={d.day} style={styles.listRow}>
              <MText style={styles.day}>
                {dayjs(d.day).format("ddd, MMM D")}
              </MText>
              <MText style={styles.pages}>
                {formatTranslation(t("bookshelf.common.pagesCount"), {
                  count: d.pages,
                })}
              </MText>
            </View>
          ))}
        </View>
      </View>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  section: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  h2: { fontWeight: "900", marginBottom: spacing.sm },
  row: { flexDirection: "row", gap: spacing.sm, flexWrap: "wrap" },
  kpi: { flexGrow: 1, flexBasis: "30%" },
  kpiLabel: { opacity: 0.7, fontSize: 12 },
  kpiValue: { fontWeight: "900", marginTop: 4 },
  list: { gap: spacing.xs },
  listRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.xs,
  },
  day: { opacity: 0.85 },
  pages: { fontWeight: "900" },
});
