import React, { useMemo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import dayjs from "dayjs";

import { Card, MText, radii, spacing, useTheme } from "/ui-native";
import { BaseIcon } from "@/components/ui/AppIcon";

import { DayRow, ReadingEvent } from "/core";
import { toNonNegativeInt } from "@/utils/toNonNegativeInt";
import { formatModeParts } from "@/utils/formatModeParts";
import { modeIcon, modeLabel } from "@/config/statsBookConfig";
import {
  computeTopSection,
  getSectionLabel,
  rangeCount,
} from "@/utils/statsBookUtils";

type Props = {
  item: DayRow;
  dayEventsAll: ReadingEvent[];

  isOpen: boolean;
  showAll: boolean;
  selectedLabel: string | null;

  defaultEventsDisplayLimit: number;

  toggleDate: (date: string) => void;
  toggleShowAll: (date: string) => void;

  toggleSectionFilter: (date: string, label: string) => void;
  clearSectionFilter: (date: string) => void;

  openDate: (date: string) => void;
};

export function DayRowCardContainer({
  item,
  dayEventsAll,
  isOpen,
  showAll,
  selectedLabel,
  defaultEventsDisplayLimit,
  toggleDate,
  toggleShowAll,
  toggleSectionFilter,
  clearSectionFilter,
  openDate,
}: Props) {
  const { colors } = useTheme();

  const parts = useMemo(
    () => formatModeParts(item.pagesByMode),
    [item.pagesByMode]
  );

  const topSection = useMemo(
    () => computeTopSection(dayEventsAll),
    [dayEventsAll]
  );

  const filterActive = !!selectedLabel;

  const dayEvents = useMemo(() => {
    if (!selectedLabel) return dayEventsAll;
    return dayEventsAll.filter((e) => getSectionLabel(e) === selectedLabel);
  }, [dayEventsAll, selectedLabel]);

  const shownEvents = useMemo(() => {
    return showAll ? dayEvents : dayEvents.slice(0, defaultEventsDisplayLimit);
  }, [dayEvents, showAll, defaultEventsDisplayLimit]);

  const onPressTopSection = () => {
    if (!topSection) return;
    openDate(item.date);
    toggleSectionFilter(item.date, topSection.label);
  };

  return (
    <Card
      style={[
        styles.dayRowCard,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
    >
      <View style={styles.dayTop}>
        <MText variant="bodyStrong" color="textPrimary">
          {item.date}
        </MText>

        <View style={styles.rightTop}>
          <View
            style={[
              styles.totalPill,
              {
                backgroundColor: colors.surfaceStrong,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <MText
              variant="caption"
              color="textPrimary"
              style={{ fontWeight: "900" }}
            >
              {item.pagesTotal}
            </MText>
          </View>
        </View>
      </View>

      {parts.length > 0 ? (
        <View style={styles.modesRow}>
          {parts.map((p) => (
            <View key={p.mode} style={styles.modeChip}>
              <BaseIcon
                name={p.icon as any}
                size={12}
                color={colors.textSecondary}
              />
              <MText variant="caption" color="textSecondary">
                {p.value}
              </MText>
            </View>
          ))}
        </View>
      ) : null}

      {/* Top section OR Filtered pill */}
      {!filterActive && topSection ? (
        <Pressable
          onPress={onPressTopSection}
          style={{ marginTop: spacing.sm }}
        >
          <View
            style={[
              styles.topSectionPill,
              {
                backgroundColor: colors.surfaceStrong,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <BaseIcon
              name="albums-outline"
              size={12}
              color={colors.textSecondary}
            />
            <MText
              variant="caption"
              color="textSecondary"
              numberOfLines={1}
              style={{ flex: 1 }}
            >
              {topSection.label}
            </MText>
            <MText
              variant="caption"
              color="textPrimary"
              style={{ fontWeight: "900" }}
            >
              {topSection.pages}p
            </MText>
            {topSection.sectionsCount > 1 ? (
              <MText
                variant="caption"
                color="textSecondary"
                style={{ opacity: 0.75 }}
              >
                · {topSection.sectionsCount} sections
              </MText>
            ) : null}
          </View>
        </Pressable>
      ) : null}

      {filterActive ? (
        <View style={{ marginTop: spacing.sm }}>
          <Pressable onPress={() => clearSectionFilter(item.date)}>
            <View
              style={[
                styles.filteredPill,
                {
                  backgroundColor: colors.surfaceStrong,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <BaseIcon
                name="funnel-outline"
                size={12}
                color={colors.textSecondary}
              />
              <MText
                variant="caption"
                color="textSecondary"
                numberOfLines={1}
                style={{ flex: 1 }}
              >
                Filtered: {selectedLabel}
              </MText>
              <MText
                variant="caption"
                color="textPrimary"
                style={{ fontWeight: "900" }}
              >
                {dayEvents.length} events
              </MText>
              <BaseIcon
                name="close-outline"
                size={14}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>
        </View>
      ) : null}

      {/* Details toggle */}
      {dayEventsAll.length > 0 ? (
        <Pressable
          onPress={() => toggleDate(item.date)}
          style={[
            styles.detailsToggle,
            { borderTopColor: colors.borderSubtle },
          ]}
        >
          <View style={styles.detailsToggleLeft}>
            <BaseIcon
              name="list-outline"
              size={14}
              color={colors.textSecondary}
            />
            <MText variant="caption" color="textSecondary">
              Details
            </MText>
            <MText
              variant="caption"
              color="textSecondary"
              style={{ opacity: 0.8 }}
            >
              · {dayEventsAll.length}
            </MText>
            {filterActive ? (
              <MText
                variant="caption"
                color="textSecondary"
                style={{ opacity: 0.8 }}
              >
                · filtered {dayEvents.length}
              </MText>
            ) : null}
          </View>

          <BaseIcon
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={18}
            color={colors.textSecondary}
          />
        </Pressable>
      ) : null}

      {dayEventsAll.length > 0 && isOpen ? (
        <View style={styles.detailsList}>
          <View style={styles.detailsMetaRow}>
            <MText variant="caption" color="textSecondary">
              Showing {shownEvents.length} / {dayEvents.length}
            </MText>

            {dayEvents.length > defaultEventsDisplayLimit ? (
              <Pressable onPress={() => toggleShowAll(item.date)}>
                <View style={styles.showAllBtn}>
                  <BaseIcon
                    name={showAll ? "contract-outline" : "expand-outline"}
                    size={14}
                    color={colors.textSecondary}
                  />
                  <MText variant="caption" color="textSecondary">
                    {showAll ? "Show less" : "Show all"}
                  </MText>
                </View>
              </Pressable>
            ) : null}
          </View>

          {shownEvents.map((e, idx) => {
            const t = dayjs(e.at).format("HH:mm");
            const from = toNonNegativeInt(e.pageFrom);
            const to = toNonNegativeInt(e.pageTo);
            const delta = rangeCount(from, to);
            const section = getSectionLabel(e);

            return (
              <View key={`${e.at}-${idx}`} style={styles.detailRow}>
                <View style={styles.detailLeft}>
                  <MText
                    variant="caption"
                    color="textSecondary"
                    style={{ width: 44 }}
                  >
                    {t}
                  </MText>

                  <View style={styles.detailMode}>
                    <BaseIcon
                      name={modeIcon[e.mode] as any}
                      size={12}
                      color={colors.textSecondary}
                    />
                    <MText variant="caption" color="textSecondary">
                      {modeLabel[e.mode]}
                    </MText>
                  </View>

                  <MText
                    variant="caption"
                    color="textPrimary"
                    style={{ fontWeight: "900" }}
                  >
                    p{Math.min(from, to)}–p{Math.max(from, to)}
                  </MText>

                  <MText variant="caption" color="textSecondary">
                    (+{delta})
                  </MText>
                </View>

                <MText
                  variant="caption"
                  color="textSecondary"
                  numberOfLines={1}
                  style={{ maxWidth: "55%" }}
                >
                  {section}
                </MText>
              </View>
            );
          })}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  dayRowCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
  },

  dayTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },

  rightTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },

  totalPill: {
    minWidth: 36,
    height: 26,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },

  modesRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexWrap: "wrap",
  },

  modeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },

  topSectionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    maxWidth: "100%",
  },

  filteredPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    maxWidth: "100%",
  },

  detailsToggle: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  detailsToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  detailsList: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },

  detailsMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 2,
  },

  showAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: 4,
  },

  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },

  detailMode: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
});
