import React, { useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { useTranslation } from "@musti/core";
import { MText, spacing, useTheme, Divider } from "@musti/ui-native";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useCalendarSourcesStore } from "@/store/calendar/useCalendarSourcesStore";
import { LOCAL_CALENDAR_ID } from "@musti/planner";

function sortFeeds<T extends { isPrimary?: boolean; name: string }>(feeds: T[]): T[] {
  return [...feeds].sort((a, b) => {
    if (a.isPrimary && !b.isPrimary) return -1;
    if (!a.isPrimary && b.isPrimary) return 1;
    return a.name.localeCompare(b.name);
  });
}

export function CalendarFeedsList() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const accounts = useCalendarSourcesStore((s) => s.accounts);
  const feeds = useCalendarSourcesStore((s) => s.feeds);
  const toggleFeed = useCalendarSourcesStore((s) => s.toggleFeed);

  const googleFeedsByAccount = useMemo(() => {
    const map = new Map<string, typeof feeds>();
    for (const feed of feeds) {
      if (feed.provider !== "google") continue;
      const list = map.get(feed.accountId) ?? [];
      list.push(feed);
      map.set(feed.accountId, list);
    }
    for (const [accountId, list] of map) {
      map.set(accountId, sortFeeds(list));
    }
    return map;
  }, [feeds]);

  const localFeed = feeds.find((f) => f.id === LOCAL_CALENDAR_ID);

  return (
    <View style={styles.wrap}>
      {localFeed ? (
        <View style={styles.row}>
          <View
            style={[styles.dot, { backgroundColor: localFeed.color ?? colors.success }]}
          />
          <MText variant="body" style={{ flex: 1 }}>
            {localFeed.name}
          </MText>
          <MText variant="caption" color="textSecondary">
            {t("planner.feed.shown")}
          </MText>
        </View>
      ) : null}

      {accounts.length > 0 && localFeed ? <Divider inset={0} thickness={1} /> : null}

      {accounts.map((account) => (
        <View key={account.id} style={styles.feedGroup}>
          <MText variant="caption" color="textSecondary" style={styles.groupLabel}>
            {account.email}
          </MText>
          {(googleFeedsByAccount.get(account.id) ?? []).map((feed) => (
            <ToggleRow
              key={feed.id}
              label={
                feed.isPrimary
                  ? `${feed.name}${t("planner.feed.primarySuffix")}`
                  : feed.name
              }
              value={Boolean(feed.enabled || feed.isPrimary)}
              onToggle={() => toggleFeed(feed.id)}
              disabled={Boolean(feed.isPrimary)}
              onLabel={t("planner.feed.shown")}
              offLabel={t("planner.feed.hidden")}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.xs,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  feedGroup: {
    gap: spacing.xs,
  },
  groupLabel: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
});
