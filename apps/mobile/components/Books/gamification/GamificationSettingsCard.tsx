import React, { useEffect, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { MText, bookshelfTheme } from "@budget/ui-native";
import { useGamificationSettingsStore } from "@/store/bookshelf/readingGamification/useGamificationSettingsStore";
import { Stepper } from "./Stepper";
import { useToast } from "@/components/ui/ToastProvider";

const { colors, spacing, radii } = bookshelfTheme;

export function GamificationSettingsCard() {
  useEffect(() => {
    useGamificationSettingsStore.getState().hydrate();
  }, []);

  const { showToast } = useToast();

  const hydrated = useGamificationSettingsStore((s) => s.hydrated);
  const settings = useGamificationSettingsStore((s) => s.settings);
  const update = useGamificationSettingsStore((s) => s.update);
  const reset = useGamificationSettingsStore((s) => s.reset);

  const preview = useMemo(() => {
    const pages = 20;
    const xpPerPage = Math.max(0, Number(settings.xpPerPage ?? 0));
    const base = pages * xpPerPage;

    const plan = Math.round(base * Number(settings.planMultiplier ?? 1));
    const target = Math.round(base * Number(settings.targetMultiplier ?? 1));

    return { pages, base: Math.round(base), plan, target };
  }, [settings.xpPerPage, settings.planMultiplier, settings.targetMultiplier]);

  const onPressReset = () => {
    showToast({
      title: "Reset gamification settings?",
      message: "This will restore all values to defaults.",
      actions: [
        { label: "Cancel", onPress: () => {} },
        {
          label: "Reset",
          destructive: true,
          onPress: () => reset(),
        },
      ],
      duration: 7000,
    });
  };

  if (!hydrated) return null;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        {/* ✅ left side: allow wrapping but don't push reset out */}
        <View style={styles.headerLeft}>
          <MText style={styles.title}>Gamification</MText>
          <MText style={styles.preview} numberOfLines={2}>
            Preview: {preview.pages} pages → {preview.base} XP (normal) ·{" "}
            {preview.plan} XP (plan) · {preview.target} XP (target)
          </MText>
        </View>

        {/* ✅ right side: never shrink out of view */}
        <MText style={styles.reset} onPress={onPressReset} numberOfLines={1}>
          Reset
        </MText>
      </View>

      <View style={{ height: spacing.sm }} />

      <Stepper
        label="Daily streak goal (pages)"
        info={{
          title: "Daily streak goal",
          message:
            "Your streak counts for a day if you read at least this many pages.\n\nExample: If it’s 10, reading 10+ pages keeps your streak alive.",
        }}
        value={settings.qualifyPagesPerDay}
        min={1}
        max={200}
        step={1}
        onChange={(v) => update({ qualifyPagesPerDay: v })}
      />

      <Stepper
        label="XP per page"
        info={{
          title: "XP per page",
          message:
            "How much XP you earn for each page you read.\n\nHigher values make leveling up faster.",
        }}
        value={settings.xpPerPage}
        min={0}
        max={20}
        step={1}
        onChange={(v) => update({ xpPerPage: v })}
      />

      <Stepper
        label="Plan multiplier"
        info={{
          title: "Plan multiplier",
          message:
            "XP boost when reading in Plan mode.\n\nThis rewards sticking to your daily plan.",
        }}
        value={Math.round(settings.planMultiplier * 100)}
        valueLabel={`${Math.round(settings.planMultiplier * 100)}%`}
        min={100}
        max={300}
        step={5}
        onChange={(v) => update({ planMultiplier: v / 100 })}
      />

      <Stepper
        label="Target multiplier"
        info={{
          title: "Target multiplier",
          message:
            "XP boost when reading in Target mode (chapter/page range).\n\nTargets are more focused, so they can reward more XP.",
        }}
        value={Math.round(settings.targetMultiplier * 100)}
        valueLabel={`${Math.round(settings.targetMultiplier * 100)}%`}
        min={100}
        max={500}
        step={5}
        onChange={(v) => update({ targetMultiplier: v / 100 })}
      />

      <Stepper
        label="Plan completion bonus"
        info={{
          title: "Plan completion bonus",
          message:
            "Extra XP awarded when you complete all planned pages for the day.",
        }}
        value={settings.planCompleteBonus}
        min={0}
        max={5000}
        step={50}
        onChange={(v) => update({ planCompleteBonus: v })}
      />

      <Stepper
        label="Target completion bonus"
        info={{
          title: "Target completion bonus",
          message:
            "Extra XP awarded when you fully complete a target.\n\nThis is usually a bigger reward than plan completion.",
        }}
        value={settings.targetCompleteBonus}
        min={0}
        max={5000}
        step={50}
        onChange={(v) => update({ targetCompleteBonus: v })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.md,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
  },

  headerLeft: {
    flex: 1, // ✅ lets preview take remaining space
    minWidth: 0, // ✅ IMPORTANT: allows text to wrap instead of pushing reset out
  },

  title: {
    fontSize: 16,
    fontWeight: "700",
  },

  preview: {
    opacity: 0.7,
    marginTop: 2,
  },

  reset: {
    color: colors.primary,
    fontWeight: "600",
    flexShrink: 0, // ✅ never shrink away
    paddingLeft: spacing.sm,
  },
});
