import React, { useMemo } from "react";
import { View, ScrollView, StyleSheet, Pressable } from "react-native";
import { router } from "expo-router";
import { MText, spacing, radii, useTheme } from "@musti/ui-native";

import { useRemindersStore } from "@/store/reminders/useRemindersStore";
import type { ReminderOwner, ReminderItem } from "@/store/reminders/types";
import { useShallow } from "zustand/react/shallow";
import { AppScreen } from "@/components/AppScreen";

function formatTime(hour: number, minute: number) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${hh}:${mm}`;
}

function scheduleLabel(r: ReminderItem) {
  const s = r.schedule;
  if (s.type === "daily") return `Daily • ${formatTime(s.hour, s.minute)}`;
  if (s.type === "weekly")
    return `Weekly • ${s.weekday} • ${formatTime(s.hour, s.minute)}`;
  return `One-time • ${new Date(s.timestamp).toLocaleString()}`;
}

export function RemindersListScreen({ owner }: { owner: ReminderOwner }) {
  const { colors } = useTheme();

  const reminders = useRemindersStore(
    useShallow((s) => s.reminders.filter((r) => r.owner === owner))
  );

  const updateReminder = useRemindersStore((s) => s.updateReminder);

  const title =
    owner === "bookshelf" ? "Bookshelf Reminders" : "Budget Reminders";

  const basePath =
    owner === "bookshelf"
      ? "/(tabs)/bookshelf/reminders"
      : "/(tabs)/budget/reminders";

  const sorted = useMemo(() => {
    return [...reminders].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [reminders]);

  return (
    <AppScreen
      title={title}
      headerTitleColor={colors.textPrimary}
      headerContainerStyle={{
        borderBottomWidth: 0,
        backgroundColor: colors.surface,
        borderRadius: radii.md,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
        shadowColor: colors.shadowStrong,
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
      }}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => router.push(`${basePath}/new`)}
            style={[
              styles.primaryBtn,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <MText style={{ color: colors.primary }}>+ New</MText>
          </Pressable>
        </View>

        {sorted.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <MText style={{ color: colors.textSecondary }}>
              No reminders yet. Create one with “New”.
            </MText>
          </View>
        ) : null}

        {sorted.map((r) => (
          <Pressable
            key={r.id}
            onPress={() => router.push(`${basePath}/${r.id}`)}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <MText variant="heading3" style={{ color: colors.textPrimary }}>
                  {r.title || "(Untitled)"}
                </MText>
                <MText style={{ marginTop: 4, color: colors.textSecondary }}>
                  {scheduleLabel(r)}
                </MText>
              </View>

              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  updateReminder(r.id, { enabled: !r.enabled });
                }}
                style={[
                  styles.pill,
                  {
                    backgroundColor: r.enabled
                      ? colors.primary
                      : colors.surfaceElevated,
                    borderColor: colors.borderSubtle,
                  },
                ]}
              >
                <MText
                  style={{
                    color: r.enabled ? colors.textInverse : colors.textPrimary,
                  }}
                >
                  {r.enabled ? "On" : "Off"}
                </MText>
              </Pressable>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: spacing.sm,
  },
  primaryBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  emptyCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  card: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    borderWidth: 1,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  pill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
});
