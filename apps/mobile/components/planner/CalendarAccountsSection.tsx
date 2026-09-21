import React, { useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  MText,
  spacing,
  radii,
  useTheme,
  BaseIcon,
  IconButton,
} from "@musti/ui-native";
import { MSelectBottomSheet } from "@/components/ui/MSelectBottomSheet";
import { InfoIcon } from "@/components/ui/InfoIcon";
import { GoogleCalendarConnectPanel } from "@/components/planner/GoogleCalendarConnectPanel";
import { useTranslation } from "@musti/core";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useToast } from "@/components/ui/ToastProvider";
import { useCalendarSourcesStore } from "@/store/calendar/useCalendarSourcesStore";
import {
  googleCalendarSetupMessage,
  isGoogleCalendarConfigured,
} from "@/constants/googleCalendarConfig";
import { getWritableCalendarFeeds } from "@musti/planner";

function SectionHeader({
  title,
  info,
}: {
  title: string;
  info?: { title: string; message: string };
}) {
  return (
    <View style={styles.sectionHeader}>
      <MText variant="bodyStrong">{title}</MText>
      {info ? <InfoIcon title={info.title} message={info.message} /> : null}
    </View>
  );
}

export function CalendarAccountsSection() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const accounts = useCalendarSourcesStore((s) => s.accounts);
  const feeds = useCalendarSourcesStore((s) => s.feeds);
  const lastGlobalSyncAt = useCalendarSourcesStore((s) => s.lastGlobalSyncAt);
  const defaultWriteCalendarId = useCalendarSourcesStore(
    (s) => s.defaultWriteCalendarId
  );
  const setDefaultWriteCalendarId = useCalendarSourcesStore(
    (s) => s.setDefaultWriteCalendarId
  );
  const removeGoogleAccount = useCalendarSourcesStore((s) => s.removeGoogleAccount);

  const isConfigured = isGoogleCalendarConfigured();
  const setupMessage = googleCalendarSetupMessage();
  const { syncNow, isSyncing, lastError } = useCalendarSync(false);

  const writableCalendarOptions = useMemo(() => {
    return getWritableCalendarFeeds(feeds).map((feed) => ({
      id: feed.id,
      label: feed.name,
      subLabel:
        feed.provider === "google"
          ? accounts.find((a) => a.id === feed.accountId)?.email
          : t("planner.feed.localPlanner"),
    }));
  }, [feeds, accounts, t]);

  const handleDisconnect = (accountId: string, email: string) => {
    Alert.alert(
      t("planner.google.disconnectTitle"),
      `${email} ${t("planner.google.disconnectBody")}`,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("planner.google.disconnect"),
          style: "destructive",
          onPress: () => removeGoogleAccount(accountId),
        },
      ]
    );
  };

  const handleSync = useCallback(async () => {
    try {
      const result = await syncNow();
      if (result.errors.length === 0) {
        showToast({
          title: t("planner.syncComplete"),
          message: `${result.importedEvents} ${t("planner.eventsImported")} ${result.syncedFeeds} ${t("planner.calendars")}.`,
          variant: "success",
          duration: 4000,
        });
      } else {
        showToast({
          title: t("planner.syncWarnings"),
          message: result.errors.join("\n"),
          variant: "warning",
          duration: 6000,
        });
      }
    } catch {
      showToast({
        title: t("planner.syncFailed"),
        message: lastError ?? t("planner.google.syncFailed"),
        variant: "danger",
        duration: 5000,
      });
    }
  }, [syncNow, lastError, showToast, t]);

  const lastSyncLabel = lastGlobalSyncAt
    ? new Date(lastGlobalSyncAt).toLocaleString()
    : t("planner.google.never");

  return (
    <View style={styles.wrap}>
      <View style={[styles.card, { borderColor: colors.borderSubtle }]}>
        <SectionHeader
          title={t("planner.google.title")}
          info={{
            title: t("planner.google.title"),
            message: t("planner.google.connectInfo"),
          }}
        />

        {accounts.length === 0 ? (
          !isConfigured ? (
            <View style={[styles.notice, { backgroundColor: colors.surfaceElevated }]}>
              <MText variant="caption" color="textSecondary">
                {setupMessage || t("planner.google.setupOAuth")}
              </MText>
            </View>
          ) : (
            <GoogleCalendarConnectPanel />
          )
        ) : (
          <>
            {accounts.map((account) => (
              <View key={account.id} style={styles.accountRow}>
                <View style={[styles.avatar, { backgroundColor: colors.success }]}>
                  <BaseIcon name="logo-google" color={colors.textInverse} />
                </View>
                <View style={{ flex: 1 }}>
                  <MText variant="body">{account.displayName ?? account.email}</MText>
                  <MText variant="caption" color="textSecondary">
                    {account.email}
                  </MText>
                </View>
                <IconButton
                  name="trash-outline"
                  color={colors.danger ?? colors.primary}
                  onPress={() => handleDisconnect(account.id, account.email)}
                />
              </View>
            ))}

            <View style={styles.syncRow}>
              <Pressable
                style={[
                  styles.syncBtn,
                  { backgroundColor: colors.success, opacity: isSyncing ? 0.7 : 1 },
                ]}
                disabled={isSyncing}
                onPress={() => void handleSync()}
              >
                {isSyncing ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <>
                    <BaseIcon name="refresh-outline" color={colors.textInverse} />
                    <MText variant="body" style={{ color: colors.textInverse, fontWeight: "700" }}>
                      {t("now_sync")}
                    </MText>
                  </>
                )}
              </Pressable>
            </View>

            <MText variant="caption" color="textSecondary">
              {t("planner.google.lastSync")}: {lastSyncLabel}
            </MText>
          </>
        )}
      </View>

      {writableCalendarOptions.length > 0 ? (
        <View style={[styles.card, { borderColor: colors.borderSubtle }]}>
          <SectionHeader
            title={t("planner.google.defaultCalendar")}
            info={{
              title: t("planner.google.defaultCalendar"),
              message: t("planner.google.defaultCalendarInfo"),
            }}
          />
          <MSelectBottomSheet
            placeholder={t("planner.google.chooseCalendar")}
            valueId={defaultWriteCalendarId}
            items={writableCalendarOptions}
            searchable={writableCalendarOptions.length > 6}
            onChange={(item) => setDefaultWriteCalendarId(item.id)}
          />
        </View>
      ) : null}

      {accounts.length > 0 && isConfigured ? (
        <View style={[styles.card, { borderColor: colors.borderSubtle }]}>
          <GoogleCalendarConnectPanel />
        </View>
      ) : null}
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
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  syncRow: {
    marginTop: spacing.xs,
  },
  syncBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
  },
  notice: {
    padding: spacing.md,
    borderRadius: radii.md,
  },
});
