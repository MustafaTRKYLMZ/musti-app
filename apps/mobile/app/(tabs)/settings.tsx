// apps/mobile/app/(tabs)/settings.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import dayjs from "dayjs";

import { useSettingsStore } from "../../store/useSettingsStore";
import { useTransactionsStore } from "../../store/useTransactionsStore";
import { syncTransactions } from "../../services/syncTransactions";
import { useTranslation } from "@budget/core";
import { LocalizedDatePicker } from "@/components/ui/LocalizedDatePicker";
import {
  MText,
  colors,
  typography,
  spacing,
  radii,
  iconSizes,
} from "@budget/ui-native";
import { BackupSection } from "@/components/BackupSection";

export default function SettingsScreen() {
  const handleClose = () => router.back();
  const { t } = useTranslation();

  const { initialBalance, loadInitialBalance, saveInitialBalance, isLoading } =
    useSettingsStore();
  const { lastSyncAt } = useTransactionsStore();

  const [amount, setAmount] = useState<string>("0");
  const [date, setDate] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    loadInitialBalance();
  }, [loadInitialBalance]);

  useEffect(() => {
    if (initialBalance) {
      setAmount(String(initialBalance.amount));
      setDate(initialBalance.date);
    }
  }, [initialBalance]);

  const handleSave = async () => {
    const payload = {
      amount: Number(amount),
      date,
    };

    if (Number.isNaN(payload.amount)) {
      Alert.alert("Error", "Amount must be a number");
      return;
    }

    const ok = await saveInitialBalance(payload);

    if (!ok) {
      Alert.alert("Error", "Failed to save initial balance (see console log)");
      return;
    }

    Alert.alert("Saved", "Initial balance updated");
  };

  const handleSyncNow = async () => {
    try {
      setIsSyncing(true);
      await syncTransactions();
      setIsSyncing(false);
      Alert.alert("Sync", "Sync completed successfully.");
    } catch (e) {
      setIsSyncing(false);
      Alert.alert("Sync", "Sync failed. Please try again.");
    }
  };

  const lastSyncLabel = lastSyncAt
    ? dayjs(lastSyncAt).format("DD MMM YYYY HH:mm")
    : "Never";

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="close" size={iconSizes.lg} color={colors.danger} />
        </TouchableOpacity>

        <MText style={styles.headerTitle}>{t("settings.title")}</MText>

        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* SECTION: Opening Balance */}
        <View>
          <MText style={styles.sectionTitle}>{t("starting_balance")}</MText>

          {/* Amount Input */}
          <MText style={styles.itemLabel}>{t("initial_amount")}</MText>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            value={amount}
            onChangeText={setAmount}
          />

          {/* Date Picker (Localized) */}
          <LocalizedDatePicker
            value={date}
            onChange={setDate}
            label={t("starting_from_date")}
          />
        </View>
        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.disabled]}
          onPress={handleSave}
          disabled={isLoading}
        >
          <MText style={styles.saveButtonText}>{t("save")}</MText>
        </TouchableOpacity>
        {/* SECTION: Sync */}
        <MText style={[styles.sectionTitle, styles.sectionTitleSpacing]}>
          {t("sync")}
        </MText>
        <View style={styles.syncInfoBox}>
          <View>
            <MText style={styles.syncLabel}>{t("last_sync")}</MText>
            <MText style={styles.syncValue}>{lastSyncLabel}</MText>
          </View>
          <TouchableOpacity
            style={[
              styles.syncButton,
              (isSyncing || isLoading) && styles.disabled,
            ]}
            onPress={handleSyncNow}
            disabled={isSyncing || isLoading}
          >
            <Ionicons
              name={isSyncing ? "sync" : "cloud-upload-outline"}
              size={iconSizes.sm}
              color={colors.textInverse}
              style={styles.syncIcon}
            />
            <MText style={styles.syncButtonText}>
              {isSyncing ? `${t("syncing")}...` : t("now_sync")}
            </MText>
          </TouchableOpacity>
        </View>
        {/* SECTION: Backup */}
        <BackupSection />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: spacing.lg,
  },

  // Header
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  closeButton: {
    width: spacing.xl,
    height: spacing.xl,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: colors.textPrimary,
    fontSize: typography.heading2.fontSize,
    fontWeight: "700",
  },
  headerRightPlaceholder: {
    width: spacing.xl,
  },

  // Content
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },

  // Sections
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.heading3.fontSize,
    fontWeight: "700",
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  sectionTitleSpacing: {
    marginTop: spacing.lg,
  },

  itemLabel: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },

  input: {
    backgroundColor: colors.primaryDark,
    color: colors.textPrimary,
    padding: spacing.md,
    borderRadius: radii.md,
    fontSize: typography.body.fontSize,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  // Save button
  saveButton: {
    backgroundColor: colors.primaryLight,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: "center",
    marginTop: spacing.sm,
  },
  saveButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },

  // Sync box
  syncInfoBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.primaryDark,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  syncLabel: {
    color: colors.textMuted,
    fontSize: typography.body.fontSize,
    marginBottom: spacing.xs,
  },
  syncValue: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "500",
  },

  syncButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
  },
  syncIcon: {
    marginRight: spacing.xs,
  },
  syncButtonText: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: "600",
  },

  // Common
  disabled: {
    opacity: 0.5,
  },
});
