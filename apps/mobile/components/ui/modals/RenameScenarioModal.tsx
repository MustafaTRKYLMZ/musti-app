import { useTranslation } from "@musti/core";
import React from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { MText, colors, spacing, radii, AppModal } from "@musti/ui-native";

interface RenameScenarioModalProps {
  visible: boolean;
  value: string;
  onChangeValue: (v: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

function RenameScenarioModal({
  visible,
  value,
  onChangeValue,
  onCancel,
  onSave,
}: RenameScenarioModalProps) {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <AppModal visible={visible} title={t("rename_scenario")} onClose={onCancel}>
      <View>
        <TextInput
          value={value}
          onChangeText={onChangeValue}
          style={styles.renameInput}
          placeholder={t("scenario_name")}
          placeholderTextColor={colors.textMuted}
        />

        <View style={styles.renameActions}>
          <TouchableOpacity
            onPress={onCancel}
            style={[styles.renameButton, styles.renameCancelButton]}
          >
            <MText variant="bodyStrong" color="textSecondary">
              {t("cancel")}
            </MText>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onSave}
            style={[styles.renameButton, styles.renameSaveButton]}
          >
            <MText variant="bodyStrong" color="textInverse">
              {t("save")}
            </MText>
          </TouchableOpacity>
        </View>
      </View>
    </AppModal>
  );
}

export { RenameScenarioModal };

const styles = StyleSheet.create({
  renameInput: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  renameActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  renameButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    marginLeft: spacing.xs,
  },
  renameCancelButton: {
    backgroundColor: "transparent",
  },
  renameSaveButton: {
    backgroundColor: colors.success,
  },
});
