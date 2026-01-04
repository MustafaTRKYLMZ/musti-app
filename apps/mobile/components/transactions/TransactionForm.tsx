// apps/mobile/components/TransactionForm.tsx

import React, { useState } from "react";
import dayjs from "dayjs";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation, type LocalTransaction } from "/core";
import { LocalizedDatePicker } from "@/components/ui/LocalizedDatePicker";
import { MText, colors, spacing, radii } from "/ui-native";

type TransactionType = "Income" | "Expense";
type Transaction = LocalTransaction;

interface TransactionFormProps {
  mode?: "create" | "edit";
  initialTransaction?: Transaction;
  initialFixedEndMonth?: string | null;
  onSubmit: (
    tx: Transaction,
    options?: { fixedEndMonth?: string | null }
  ) => void | Promise<void>;
}

export default function TransactionForm({
  mode = "create",
  initialTransaction,
  initialFixedEndMonth,
  onSubmit,
}: TransactionFormProps) {
  const { t } = useTranslation();

  const [date, setDate] = useState(
    initialTransaction?.date ?? dayjs().format("YYYY-MM-DD")
  );
  const [type, setType] = useState<TransactionType>(
    (initialTransaction?.type as TransactionType) ?? "Expense"
  );
  const [item, setItem] = useState(initialTransaction?.item ?? "");
  const [category, setCategory] = useState(initialTransaction?.category ?? "");
  const [isFixed, setIsFixed] = useState<boolean>(
    initialTransaction?.isFixed ?? false
  );
  const [amount, setAmount] = useState(
    initialTransaction ? String(initialTransaction.amount) : ""
  );
  const [fixedEndMonth, setFixedEndMonth] = useState<string | null>(
    initialFixedEndMonth ?? null
  );

  const handleSubmit = () => {
    const parsed = Number(String(amount).replace(",", "."));

    if (!item || Number.isNaN(parsed)) {
      alert("Item and valid amount are required.");
      return;
    }

    const month = date.slice(0, 7);

    const tx: Transaction = {
      id: (initialTransaction?.id as any) ?? (Date.now() as any),
      date,
      month,
      type,
      item,
      category: category || undefined,
      amount: parsed,
      isFixed,
      planId: initialTransaction?.planId,
      updatedAt: initialTransaction?.updatedAt ?? new Date().toISOString(),
    };

    void onSubmit(tx, isFixed ? { fixedEndMonth } : undefined);
  };

  const titlePrefix = mode === "edit" ? t("update") : t("save");

  return (
    <View style={styles.form}>
      <LocalizedDatePicker value={date} onChange={setDate} label={t("date")} />

      {/* TYPE */}
      <View style={styles.field}>
        <MText variant="caption" color="textSecondary" style={styles.label}>
          {t("type")}
        </MText>

        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[
              styles.segment,
              type === "Income" && styles.segmentActiveIncome,
            ]}
            onPress={() => setType("Income")}
          >
            <MText
              variant="bodyStrong"
              color={type === "Income" ? "textPrimary" : "textSecondary"}
              style={styles.segmentText}
            >
              {t("income")}
            </MText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segment,
              type === "Expense" && styles.segmentActiveExpense,
            ]}
            onPress={() => setType("Expense")}
          >
            <MText
              variant="bodyStrong"
              color={type === "Expense" ? "textPrimary" : "textSecondary"}
              style={styles.segmentText}
            >
              {t("expense")}
            </MText>
          </TouchableOpacity>
        </View>
      </View>

      {/* FIXED? */}
      <View style={styles.field}>
        <MText variant="caption" color="textSecondary" style={styles.label}>
          {t("fixed")}?
        </MText>

        <View style={styles.segmentRow}>
          <TouchableOpacity
            style={[styles.segment, !isFixed && styles.segmentActiveNeutral]}
            onPress={() => {
              setIsFixed(false);
              setFixedEndMonth(null);
            }}
          >
            <MText
              variant="bodyStrong"
              color={!isFixed ? "textPrimary" : "textSecondary"}
              style={styles.segmentText}
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
              color={isFixed ? "textPrimary" : "textSecondary"}
              style={styles.segmentText}
            >
              {t("yes")} ({t("recurring")})
            </MText>
          </TouchableOpacity>
        </View>
      </View>

      {/* FIXED END MONTH */}
      {isFixed && (
        <LocalizedDatePicker
          value={fixedEndMonth ?? date.slice(0, 7)}
          onChange={(m) => setFixedEndMonth(m)}
          label={`${t("fixed")} ${t("end")} ${t("month")} (${t("optional")})`}
        />
      )}

      {/* ITEM */}
      <View style={styles.field}>
        <MText variant="caption" color="textSecondary" style={styles.label}>
          {t("item")}
        </MText>
        <TextInput
          value={item}
          onChangeText={setItem}
          placeholder={`${t("rent")}, ${t("insurance")}, ${t("salary")}...`}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      {/* CATEGORY */}
      <View style={styles.field}>
        <MText variant="caption" color="textSecondary" style={styles.label}>
          {t("category")}
        </MText>
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder={`${t("transport")}, ${t("food")}...`}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      {/* AMOUNT */}
      <View style={styles.field}>
        <MText variant="caption" color="textSecondary" style={styles.label}>
          {t("amount")} (€)
        </MText>
        <TextInput
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <MText variant="bodyStrong" color="textInverse">
          {titlePrefix}
        </MText>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
  },

  field: {
    gap: spacing.xs,
  },

  label: {
    marginBottom: spacing.xs * 0.3,
  },

  input: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: 14,
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
    paddingVertical: spacing.sm * 0.7,
    alignItems: "center",
    backgroundColor: colors.surfaceStrong,
  },

  // Income
  segmentActiveIncome: {
    borderColor: colors.success,
    backgroundColor: colors.background,
  },

  // Expense
  segmentActiveExpense: {
    borderColor: colors.danger,
    backgroundColor: colors.background,
  },

  // Fixed yes/no (neutral)
  segmentActiveNeutral: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },

  segmentText: {
    textAlign: "center",
  },

  submitButton: {
    marginTop: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
});
