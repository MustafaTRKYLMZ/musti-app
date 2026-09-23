import React, { useEffect, useMemo, useState } from "react";
import { View, StyleSheet, TextInput, Pressable } from "react-native";
import type { MEvent } from "@musti/planner";
import { useTranslation, toBcp47 } from "@musti/core";
import { AppModal, MText, spacing, useTheme } from "@musti/ui-native";
import { eventToTitle } from "@/utils/calendar/format";

type Props = {
  visible: boolean;
  events: MEvent[];
  onClose: () => void;
  onSelectEvent: (event: MEvent) => void;
};

export function PlannerEventSearchModal({
  visible,
  events,
  onClose,
  onSelectEvent,
}: Props) {
  const { colors } = useTheme();
  const { t, language } = useTranslation();
  const [query, setQuery] = useState("");
  const localeTag = toBcp47(language);

  useEffect(() => {
    if (!visible) {
      setQuery("");
    }
  }, [visible]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return events
      .filter((ev) => {
        const title = eventToTitle(ev).toLowerCase();
        const notes = (ev.notes ?? "").toLowerCase();
        const location = (ev.location ?? "").toLowerCase();
        return title.includes(q) || notes.includes(q) || location.includes(q);
      })
      .sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      )
      .slice(0, 50);
  }, [events, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <AppModal
      visible={visible}
      onClose={handleClose}
      variant="sheet"
      title={t("planner.search.title")}
      contentContainerStyle={styles.modalContent}
      actions={{
        showSave: false,
        showDelete: false,
        cancelLabel: t("common.close"),
        onCancel: handleClose,
      }}
    >
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t("planner.search.placeholder")}
        placeholderTextColor={colors.textSecondary}
        autoFocus={visible}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surfaceElevated ?? colors.background,
          },
        ]}
      />

      {!query.trim() ? (
        <MText variant="caption" color="textSecondary" style={styles.hint}>
          {events.length > 0
            ? `${t("planner.search.hintPrefix")} ${events.length} ${t("planner.search.events")}`
            : t("planner.search.noEvents")}
        </MText>
      ) : results.length === 0 ? (
        <MText variant="body" color="textSecondary" style={styles.empty}>
          {t("planner.search.noResults")} “{query.trim()}”
        </MText>
      ) : (
        <View style={styles.list}>
          {results.map((item) => {
            const start = new Date(item.start);
            const label = Number.isFinite(start.getTime())
              ? start.toLocaleDateString(localeTag, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })
              : "";

            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  onSelectEvent(item);
                  handleClose();
                }}
                style={[
                  styles.row,
                  { borderBottomColor: colors.borderSubtle },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: item.color ?? colors.primary },
                  ]}
                />
                <View style={styles.rowText}>
                  <MText variant="body" numberOfLines={1}>
                    {eventToTitle(item)}
                  </MText>
                  {label ? (
                    <MText variant="caption" color="textSecondary">
                      {label}
                    </MText>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      )}
    </AppModal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flexGrow: 1,
  },
  input: {
    borderWidth: 1,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  list: {
    gap: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  empty: {
    paddingVertical: spacing.lg,
    textAlign: "center",
  },
  hint: {
    paddingVertical: spacing.sm,
  },
});
