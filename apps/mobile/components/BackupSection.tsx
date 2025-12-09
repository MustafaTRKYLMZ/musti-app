import React from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useTranslation } from "@budget/core";
import { MText, spacing, colors, radii, typography } from "@budget/ui-native";

import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

import { useSettingsStore } from "@/store/useSettingsStore";
import { useSimulationStore } from "@/store/useSimulationStore";
import { useTransactionsStore } from "@/store/useTransactionsStore";
import { persistSimulationState } from "@/store/simulation/persistState";

export const BackupSection = () => {
  const { t } = useTranslation();

  const buildBackupPayload = () => {
    const transactions = useTransactionsStore.getState().transactions;
    const { scenarios } = useSimulationStore.getState();
    const { initialBalance } = useSettingsStore.getState();

    return {
      version: 1 as const,
      app: "musti-app" as const,
      exportedAt: new Date().toISOString(),
      data: {
        transactions,
        scenarios,
        settings: {
          initialBalance,
        },
      },
    };
  };

  const handleExportData = async () => {
    try {
      const backup = buildBackupPayload();
      const json = JSON.stringify(backup, null, 2);

      const fileName = `musti-backup-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(fileUri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: "application/json",
          dialogTitle: t("export_data"),
        });
      } else {
        Alert.alert(t("export_data"), `Backup file created at:\n${fileUri}`);
      }
    } catch (e) {
      console.log("export error", e);
      Alert.alert(t("export_data"), t("export_failed") || "Export failed.");
    }
  };

  const handleExportToDevice = async () => {
    try {
      if (
        Platform.OS !== "android" ||
        !("StorageAccessFramework" in FileSystem)
      ) {
        Alert.alert(
          t("export_data"),
          t("device_export_android_only") ||
            "Saving directly to device storage is only supported on Android. Please use the normal Export option."
        );
        return;
      }

      const backup = buildBackupPayload();
      const json = JSON.stringify(backup, null, 2);

      const saf = FileSystem.StorageAccessFramework;

      const permissions = await saf.requestDirectoryPermissionsAsync();
      if (!permissions.granted) {
        Alert.alert(
          t("export_data"),
          t("device_export_permission_denied") ||
            "You need to select a folder to save the backup."
        );
        return;
      }

      const fileName = `musti-backup-${Date.now()}.json`;

      const uri = await saf.createFileAsync(
        permissions.directoryUri,
        fileName,
        "application/json"
      );

      await FileSystem.writeAsStringAsync(uri, json, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert(
        t("export_data"),
        t("export_success_device") || "Backup saved to the selected folder."
      );
    } catch (e) {
      console.log("device export error", e);
      Alert.alert(t("export_data"), t("export_failed") || "Export failed.");
    }
  };

  const handleImportData = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];

      const content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      let parsed: any;
      try {
        parsed = JSON.parse(content);
      } catch {
        Alert.alert(
          t("import_data"),
          t("invalid_backup_file") || "Invalid backup file."
        );
        return;
      }

      if (parsed.app !== "musti-app" || parsed.version !== 1) {
        Alert.alert(
          t("import_data"),
          t("unsupported_backup_version") ||
            "Backup file is from an unsupported version."
        );
        return;
      }

      const data = parsed.data || {};
      const transactions = data.transactions || [];
      const scenarios = data.scenarios || [];
      const settings = data.settings || {};

      Alert.alert(
        t("import_data"),
        `${t("import_warning") || "This will REPLACE your current data."}\n\n` +
          `• ${transactions.length} ${t("transactions") || "transactions"}\n` +
          `• ${scenarios.length} ${t("scenarios") || "scenarios"}`,
        [
          { text: t("cancel"), style: "cancel" },
          {
            text: t("import_data"),
            style: "destructive",
            onPress: () => {
              // transactions: state'in geri kalanını koru
              useTransactionsStore.setState((state) => ({
                ...state,
                transactions,
              }));

              // simulation: state'i koru + persist et
              useSimulationStore.setState((state) => {
                const next = {
                  ...state,
                  scenarios,
                  activeScenarioId: null,
                };

                void persistSimulationState({
                  scenarios: next.scenarios,
                  activeScenarioId: next.activeScenarioId,
                });

                return next;
              });

              // settings.initialBalance güncelle
              if (settings.initialBalance) {
                useSettingsStore
                  .getState()
                  .saveInitialBalance(settings.initialBalance);
              }

              Alert.alert(
                t("import_data"),
                t("import_success") || "Data imported successfully."
              );
            },
          },
        ]
      );
    } catch (e) {
      console.log("import error", e);
      Alert.alert(t("import_data"), t("import_failed") || "Import failed.");
    }
  };

  return (
    <>
      <MText style={[styles.sectionTitle, { marginTop: spacing.lg }]}>
        {t("data")}
      </MText>

      <View style={styles.dataButtonsRow}>
        <TouchableOpacity style={styles.dataButton} onPress={handleExportData}>
          <MText color="textInverse">{t("export_data")}</MText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.dataButtonSecondary}
          onPress={handleImportData}
        >
          <MText color="textPrimary">{t("import_data")}</MText>
        </TouchableOpacity>
      </View>

      {/* Export directly to device storage (Android SAF) */}
      <TouchableOpacity
        style={styles.deviceExportButton}
        onPress={handleExportToDevice}
      >
        <MText color="textInverse">
          {t("export_to_device") || "Export to device storage"}
        </MText>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  sectionTitle: {
    marginBottom: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.heading3.fontSize,
    fontWeight: "700",
  },
  dataButtonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dataButton: {
    flex: 1,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: "center",
    marginRight: spacing.sm,
  },
  dataButtonSecondary: {
    flex: 1,
    backgroundColor: colors.background,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: "center",
    marginLeft: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  deviceExportButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: "center",
  },
});
