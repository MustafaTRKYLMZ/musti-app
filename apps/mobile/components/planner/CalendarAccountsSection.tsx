import React, { useMemo } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import {
  MText,
  spacing,
  radii,
  useTheme,
  BaseIcon,
  IconButton,
} from "@musti/ui-native";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { GoogleCalendarConnectPanel } from "@/components/planner/GoogleCalendarConnectPanel";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useCalendarSourcesStore } from "@/store/calendar/useCalendarSourcesStore";
import {
  googleCalendarSetupMessage,
  isGoogleCalendarConfigured,
} from "@/constants/googleCalendarConfig";
import { LOCAL_CALENDAR_ID } from "@musti/planner";

export function CalendarAccountsSection() {
  const { colors } = useTheme();
  const accounts = useCalendarSourcesStore((s) => s.accounts);
  const feeds = useCalendarSourcesStore((s) => s.feeds);
  const lastGlobalSyncAt = useCalendarSourcesStore((s) => s.lastGlobalSyncAt);
  const toggleFeed = useCalendarSourcesStore((s) => s.toggleFeed);
  const removeGoogleAccount = useCalendarSourcesStore((s) => s.removeGoogleAccount);

  const isConfigured = isGoogleCalendarConfigured();
  const setupMessage = googleCalendarSetupMessage();
  const { syncNow, isSyncing, lastError } = useCalendarSync(false);

  const googleFeedsByAccount = useMemo(() => {
    const map = new Map<string, typeof feeds>();
    for (const feed of feeds) {
      if (feed.provider !== "google") continue;
      const list = map.get(feed.accountId) ?? [];
      list.push(feed);
      map.set(feed.accountId, list);
    }
    return map;
  }, [feeds]);

  const localFeed = feeds.find((f) => f.id === LOCAL_CALENDAR_ID);

  const handleDisconnect = (accountId: string, email: string) => {
    Alert.alert(
      "Disconnect Google account?",
      `${email} calendars will be removed from Planner.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: () => removeGoogleAccount(accountId),
        },
      ]
    );
  };

  const handleSync = async () => {
    try {
      const result = await syncNow();
      if (result.errors.length === 0) {
        Alert.alert(
          "Sync complete",
          `Updated ${result.importedEvents} events from ${result.syncedFeeds} calendar(s).`
        );
      } else {
        Alert.alert("Sync finished with warnings", result.errors.join("\n"));
      }
    } catch {
      Alert.alert("Sync failed", lastError ?? "Could not sync Google calendars.");
    }
  };

  return (
    <View style={styles.wrap}>
      <MText variant="heading3" style={{ marginBottom: spacing.sm }}>
        Calendars
      </MText>

      {localFeed ? (
        <View style={[styles.card, { borderColor: colors.borderSubtle }]}>
          <View style={styles.row}>
            <View
              style={[styles.dot, { backgroundColor: localFeed.color ?? colors.success }]}
            />
            <View style={{ flex: 1 }}>
              <MText variant="body">{localFeed.name}</MText>
              <MText variant="caption" color="textSecondary">
                Local events created in Musti Planner
              </MText>
            </View>
            <MText variant="caption" color="textSecondary">
              Always on
            </MText>
          </View>
        </View>
      ) : null}

      {accounts.length === 0 ? (
        <MText variant="body" color="textSecondary" style={styles.helper}>
          Connect your Google account to show your personal calendars alongside
          local Planner events.
        </MText>
      ) : null}

      {accounts.map((account) => (
        <View
          key={account.id}
          style={[styles.card, { borderColor: colors.borderSubtle }]}
        >
          <View style={styles.accountHeader}>
            <View style={{ flex: 1 }}>
              <MText variant="body">{account.displayName ?? account.email}</MText>
              <MText variant="caption" color="textSecondary">
                {account.email}
              </MText>
            </View>
            <IconButton
              name="trash-outline"
              size={18}
              color={colors.danger ?? colors.primary}
              onPress={() => handleDisconnect(account.id, account.email)}
            />
          </View>

          {(googleFeedsByAccount.get(account.id) ?? []).map((feed) => (
            <ToggleRow
              key={feed.id}
              label={feed.name}
              description={
                feed.isPrimary ? "Primary Google calendar" : undefined
              }
              value={feed.enabled}
              onToggle={() => toggleFeed(feed.id)}
              onLabel="Shown"
              offLabel="Hidden"
            />
          ))}
        </View>
      ))}

      {!isConfigured ? (
        <View style={[styles.notice, { backgroundColor: colors.surfaceElevated }]}>
          <MText variant="caption" color="textSecondary">
            {setupMessage ||
              "Configure Google OAuth client IDs to enable Calendar sync."}
          </MText>
        </View>
      ) : (
        <GoogleCalendarConnectPanel />
      )}

      {accounts.length > 0 ? (
        <Pressable
          style={[styles.secondaryBtn, { borderColor: colors.borderSubtle }]}
          disabled={isSyncing}
          onPress={() => void handleSync()}
        >
          {isSyncing ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <>
              <BaseIcon name="refresh-outline" size={18} color={colors.textPrimary} />
              <MText variant="body">Sync now</MText>
            </>
          )}
        </Pressable>
      ) : null}

      {lastGlobalSyncAt ? (
        <MText variant="caption" color="textSecondary" style={styles.helper}>
          Last sync: {new Date(lastGlobalSyncAt).toLocaleString()}
        </MText>
      ) : null}

      <Pressable onPress={() => router.back()} style={styles.backLink}>
        <MText variant="body" color="textSecondary">
          Back to Planner
        </MText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  accountHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  helper: {
    marginTop: spacing.xs,
  },
  notice: {
    padding: spacing.md,
    borderRadius: radii.md,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
  },
  backLink: {
    alignSelf: "center",
    paddingVertical: spacing.sm,
  },
});
