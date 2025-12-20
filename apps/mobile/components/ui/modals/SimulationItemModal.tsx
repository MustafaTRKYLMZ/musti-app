// apps/mobile/components/modals/SimulationItemModal.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from "react-native";
import { LocalizedDatePicker } from "@/components/ui/LocalizedDatePicker";
import { BalanceType, useTranslation } from "@budget/core";
import { MText, colors, spacing, radii } from "@budget/ui-native";
import { BottomSheetModal } from "./BottomSheetModal";

interface Props {
  visible: boolean;
  initialDate: string; // "YYYY-MM-DD"
  onClose: () => void;
  onSubmit: (payload: {
    type: BalanceType;
    item: string;
    amount: number;
    date: string; // "YYYY-MM-DD"
    isFixed: boolean;
  }) => void;
}

export function SimulationItemModal({
  visible,
  initialDate,
  onClose,
  onSubmit,
}: Props) {
  const [type, setType] = useState<BalanceType>("Expense");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(initialDate);
  const [isFixed, setIsFixed] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (visible) {
      setType("Expense");
      setItem("");
      setAmount("");
      setDate(initialDate);
      setIsFixed(false);
    }
  }, [visible, initialDate]);

  const handleSubmit = () => {
    const numericAmount = Number(amount);

    if (!item.trim() || !numericAmount || !date) {
      return;
    }

    onSubmit({
      type,
      item: item.trim(),
      amount: numericAmount,
      date,
      isFixed,
    });

    onClose();
  };

  return (
    <BottomSheetModal
      visible={visible}
      title={t("add_simulation_item")}
      onClose={onClose}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
          {/* TYPE */}
          <View style={styles.smallLabelWrapper}>
            <MText variant="caption" color="textSecondary">
              {t("type")}
            </MText>
          </View>
          <View style={styles.typeRow}>
            <TypeChip
              label={t("expense")}
              active={type === "Expense"}
              onPress={() => setType("Expense")}
            />
            <TypeChip
              label={t("income")}
              active={type === "Income"}
              onPress={() => setType("Income")}
            />
          </View>

          {/* FIXED? */}
          <View style={styles.field}>
            <View style={styles.labelWrapper}>
              <MText variant="caption" color="textSecondary">
                {t("fixed")}?
              </MText>
            </View>

            <View style={styles.segmentRow}>
              <TouchableOpacity
                style={[
                  styles.segment,
                  !isFixed && styles.segmentActiveNeutral,
                ]}
                onPress={() => setIsFixed(false)}
              >
                <MText
                  variant="bodyStrong"
                  color={!isFixed ? "textInverse" : "textMuted"}
                >
                  {t("no")}
                </MText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segment, isFixed && styles.segmentActiveNeutral]}
                onPress={() => setIsFixed(true)}
              >
                <MText
                  variant="bodyStrong"
                  color={isFixed ? "textInverse" : "textMuted"}
                >
                  {t("yes")} ({t("recurring")})
                </MText>
              </TouchableOpacity>
            </View>
          </View>

          {/* ITEM */}
          <View style={styles.smallLabelWrapper}>
            <MText variant="caption" color="textSecondary">
              {t("item")}
            </MText>
          </View>
          <TextInput
            placeholder={t("new_sofa")}
            placeholderTextColor={colors.textMuted}
            value={item}
            onChangeText={setItem}
            style={styles.input}
            returnKeyType="next"
          />

          {/* AMOUNT */}
          <View style={styles.smallLabelWrapper}>
            <MText variant="caption" color="textSecondary">
              {t("amount")}
            </MText>
          </View>
          <TextInput
            placeholder="e.g. 1200"
            placeholderTextColor={colors.textMuted}
            value={amount}
            onChangeText={setAmount}
            keyboardType="numeric"
            style={styles.input}
            returnKeyType="done"
          />

          {/* DATE */}
          <View style={{ marginTop: spacing.sm }}>
            <LocalizedDatePicker
              value={date}
              onChange={setDate}
              label={t("date")}
            />
          </View>
        </View>
      </ScrollView>

      {/* FOOTER  */}
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
          <MText variant="bodyStrong" color="textSecondary">
            {t("cancel")}
          </MText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
          <MText variant="bodyStrong" color="textInverse">
            {t("to_scenario")}
          </MText>
        </TouchableOpacity>
      </View>
    </BottomSheetModal>
  );
}

interface TypeChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

function TypeChip({ label, active, onPress }: TypeChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.typeChip, active && styles.typeChipActive]}
    >
      <MText variant="caption" color={active ? "background" : "textSecondary"}>
        {label}
      </MText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingBottom: spacing.lg,
  },

  content: {
    marginTop: spacing.xs,
  },

  // Labels
  smallLabelWrapper: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  labelWrapper: {
    marginBottom: spacing.xs,
  },

  // Type chips
  typeRow: {
    flexDirection: "row",
    marginBottom: spacing.xs,
  },
  typeChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: spacing.xs,
  },
  typeChipActive: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },

  // Fixed segment
  field: {
    marginTop: spacing.sm,
  },
  segmentRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  segment: {
    flex: 1,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.sm / 1.5,
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
  },
  segmentActiveNeutral: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryDark ?? colors.surfaceStrong,
  },

  // Inputs
  input: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
  },

  // Footer buttons
  footerRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.md,
  },
  cancelButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginRight: spacing.sm,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.success,
  },
});
