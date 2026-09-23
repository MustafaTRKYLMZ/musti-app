import React from "react";
import { View, StyleSheet, Pressable } from "react-native";

import { BaseIcon } from "@musti/ui-native";
import { Card, MText, radii, spacing, useTheme } from "@musti/ui-native";
import {
  useTranslation,
  formatTranslation,
  type ReadingMode,
  type TranslationKey,
} from "@musti/core";
import { EventList } from "./EventList";

type ModePart = {
  mode: ReadingMode;
  value: number;
  icon: string;
  labelKey: TranslationKey;
};

type SectionTop = { label: string; pages: number };

type Props = {
  today: string;
  todayTotal: number;

  modeParts: ModePart[];

  sectionsTop: SectionTop[];
  selectedSectionLabel: string | null;

  eventsAllCount: number;
  eventsFilteredCount: number;
  shownEventsCount: number;
  eventsShown: any[];

  isOpen: boolean;
  showAll: boolean;

  onToggleOpen: () => void;
  onToggleShowAll: () => void;
  onSelectSection: (label: string) => void;
  onClearSectionFilter: () => void;

  eventsDisplayLimit: number;
};

export function TodayCard({
  today,
  todayTotal,
  modeParts,
  sectionsTop,
  selectedSectionLabel,
  eventsAllCount,
  eventsFilteredCount,
  shownEventsCount,
  eventsShown,
  isOpen,
  showAll,
  onToggleOpen,
  onToggleShowAll,
  onSelectSection,
  onClearSectionFilter,
  eventsDisplayLimit,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Card
      style={[
        styles.summaryCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.borderSubtle,
        },
      ]}
    >
      <View style={styles.summaryTitleRow}>
        <BaseIcon name="today-outline" color={colors.textSecondary} />
        <MText variant="bodyStrong" color="textPrimary">
          {t("bookshelf.stats.today")}
        </MText>
        <MText
          variant="caption"
          color="textSecondary"
          style={{ marginLeft: "auto" }}
        >
          {today}
        </MText>
      </View>

      <MText
        variant="heading2"
        color="textPrimary"
        style={{ marginTop: spacing.xs, fontWeight: "900" }}
      >
        {formatTranslation(t("bookshelf.common.pagesCount"), {
          count: todayTotal,
        })}
      </MText>

      {modeParts.length > 0 ? (
        <View style={styles.modeBreakdown}>
          {modeParts.map((p) => (
            <View
              key={p.mode}
              style={[
                styles.modeBreakdownItem,
                {
                  backgroundColor: colors.surfaceStrong,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <BaseIcon
                name={p.icon as any}
                color={colors.textSecondary}
              />
              <MText variant="caption" color="textSecondary">
                {t(p.labelKey)}:
              </MText>
              <MText
                variant="caption"
                color="textPrimary"
                style={{ fontWeight: "900" }}
              >
                {p.value}
              </MText>
            </View>
          ))}
        </View>
      ) : (
        <MText
          variant="caption"
          color="textSecondary"
          style={{ marginTop: spacing.sm }}
        >
          {t("bookshelf.stats.noPagesToday")}
        </MText>
      )}

      {sectionsTop.length > 0 ? (
        <View style={{ marginTop: spacing.md }}>
          <View style={styles.subHeaderRow}>
            <View style={styles.subHeaderLeft}>
              <BaseIcon
                name="albums-outline"
                color={colors.textSecondary}
              />
              <MText variant="bodyStrong" color="textPrimary">
                {t("bookshelf.stats.sectionsToday")}
              </MText>
            </View>
            <MText variant="caption" color="textSecondary">
              {formatTranslation(t("bookshelf.stats.topSections"), {
                count: sectionsTop.length,
              })}
            </MText>
          </View>

          <View style={styles.sectionPills}>
            {sectionsTop.map((s) => {
              const isActive = selectedSectionLabel === s.label;
              return (
                <Pressable
                  key={s.label}
                  onPress={() => onSelectSection(s.label)}
                >
                  <View
                    style={[
                      styles.sectionPill,
                      {
                        backgroundColor: colors.surfaceStrong,
                        borderColor: colors.borderSubtle,
                        opacity: isActive ? 1 : 0.92,
                      },
                    ]}
                  >
                    <MText
                      variant="caption"
                      color="textSecondary"
                      numberOfLines={1}
                      style={{ maxWidth: 160 }}
                    >
                      {s.label}
                    </MText>
                    <MText
                      variant="caption"
                      color="textPrimary"
                      style={{ fontWeight: "900" }}
                    >
                      {formatTranslation(t("bookshelf.stats.pagesShort"), {
                        count: s.pages,
                      })}
                    </MText>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {selectedSectionLabel ? (
            <View style={{ marginTop: spacing.xs }}>
              <Pressable onPress={onClearSectionFilter}>
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
                    {formatTranslation(t("bookshelf.stats.filtered"), {
                      label: selectedSectionLabel,
                    })}
                  </MText>
                  <MText
                    variant="caption"
                    color="textPrimary"
                    style={{ fontWeight: "900" }}
                  >
                    {formatTranslation(t("bookshelf.stats.eventsCount"), {
                      count: eventsFilteredCount,
                    })}
                  </MText>
                  <BaseIcon
                    name="close-outline"
                    color={colors.textSecondary}
                  />
                </View>
              </Pressable>
            </View>
          ) : null}
        </View>
      ) : null}

      {eventsAllCount > 0 ? (
        <Pressable
          onPress={onToggleOpen}
          style={[
            styles.detailsToggle,
            { borderTopColor: colors.borderSubtle, marginTop: spacing.md },
          ]}
        >
          <View style={styles.detailsToggleLeft}>
            <BaseIcon
              name="list-outline"
              color={colors.textSecondary}
            />
            <MText variant="caption" color="textSecondary">
              {t("bookshelf.stats.todayDetails")}
            </MText>
            <MText
              variant="caption"
              color="textSecondary"
              style={{ opacity: 0.8 }}
            >
              · {eventsAllCount}
            </MText>
            {selectedSectionLabel ? (
              <MText
                variant="caption"
                color="textSecondary"
                style={{ opacity: 0.8 }}
              >
                ·{" "}
                {formatTranslation(t("bookshelf.stats.filteredCount"), {
                  count: eventsFilteredCount,
                })}
              </MText>
            ) : null}
          </View>

          <BaseIcon
            name={isOpen ? "chevron-up" : "chevron-down"}
            color={colors.textSecondary}
          />
        </Pressable>
      ) : null}

      {eventsAllCount > 0 && isOpen ? (
        <View style={styles.detailsList}>
          <View style={styles.detailsMetaRow}>
            <MText variant="caption" color="textSecondary">
              {formatTranslation(t("bookshelf.stats.showing"), {
                shown: shownEventsCount,
                total: eventsFilteredCount,
              })}
            </MText>

            {eventsFilteredCount > eventsDisplayLimit ? (
              <Pressable onPress={onToggleShowAll}>
                <View style={styles.showAllBtn}>
                  <BaseIcon
                    name={showAll ? "contract-outline" : "expand-outline"}
                    color={colors.textSecondary}
                  />
                  <MText variant="caption" color="textSecondary">
                    {showAll
                      ? t("bookshelf.stats.showLess")
                      : t("bookshelf.stats.showAll")}
                  </MText>
                </View>
              </Pressable>
            ) : null}
          </View>

          <EventList events={eventsShown as any} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  summaryTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  subHeaderRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  subHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  modeBreakdown: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  modeBreakdownItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
  },

  sectionPills: {
    marginTop: spacing.sm,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  sectionPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    maxWidth: 240,
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
});
