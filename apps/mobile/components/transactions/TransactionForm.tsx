import React, { useMemo, useState } from "react";
import dayjs from "dayjs";
import { View, TextInput, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import {
  localizeTransactionCategory,
  normalizeReceiptCategoryKey,
  useTranslation,
  type LocalTransaction,
} from "@musti/core";
import { LocalizedDatePicker } from "@/components/ui/LocalizedDatePicker";
import { MText, colors, spacing, radii, BaseIcon } from "@musti/ui-native";

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
  onDelete?: () => void;
}

export default function TransactionForm({
  mode = "create",
  initialTransaction,
  initialFixedEndMonth,
  onSubmit,
  onDelete,
}: TransactionFormProps) {
  const { t } = useTranslation();

  const hasReceiptDetails = Boolean(
    initialTransaction?.storeName ||
      (initialTransaction?.subItems && initialTransaction.subItems.length > 0)
  );

  const [date, setDate] = useState(
    initialTransaction?.date ?? dayjs().format("YYYY-MM-DD")
  );
  const [type, setType] = useState<TransactionType>(
    (initialTransaction?.type as TransactionType) ?? "Expense"
  );
  const [item, setItem] = useState(initialTransaction?.item ?? "");
  const [category, setCategory] = useState(() =>
    initialTransaction?.category
      ? localizeTransactionCategory(initialTransaction.category, t)
      : ""
  );
  const [isFixed, setIsFixed] = useState<boolean>(
    initialTransaction?.isFixed ?? false
  );
  const [amount, setAmount] = useState(
    initialTransaction ? String(initialTransaction.amount) : ""
  );
  const [fixedEndMonth, setFixedEndMonth] = useState<string | null>(
    initialFixedEndMonth ?? null
  );
  const [showMore, setShowMore] = useState(hasReceiptDetails);
  const [formError, setFormError] = useState<string | null>(null);

  const subItems = useMemo(
    () => initialTransaction?.subItems ?? [],
    [initialTransaction?.subItems]
  );

  const handleSubmit = () => {
    const parsed = Number(String(amount).replace(",", "."));

    if (!item || Number.isNaN(parsed)) {
      setFormError(t("validation.requiredFields"));
      return;
    }

    setFormError(null);

    const month = date.slice(0, 7);

    const tx: Transaction = {
      id: (initialTransaction?.id as any) ?? (Date.now() as any),
      date,
      month,
      type,
      item,
      category: category ? normalizeReceiptCategoryKey(category) : undefined,
      amount: parsed,
      isFixed,
      planId: initialTransaction?.planId,
      storeId: initialTransaction?.storeId,
      storeName: initialTransaction?.storeName,
      subItems: initialTransaction?.subItems,
      updatedAt: initialTransaction?.updatedAt ?? new Date().toISOString(),
    };

    void onSubmit(tx, isFixed ? { fixedEndMonth } : undefined);
  };

  const titlePrefix = mode === "edit" ? t("update") : t("save");

  return (
    <View style={styles.form}>
      <LocalizedDatePicker value={date} onChange={setDate} label={t("date")} />

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

      {isFixed ? (
        <LocalizedDatePicker
          value={fixedEndMonth ?? date.slice(0, 7)}
          onChange={(m) => setFixedEndMonth(m)}
          label={`${t("fixed")} ${t("end")} ${t("month")} (${t("optional")})`}
        />
      ) : null}

      <View style={styles.field}>
        <MText variant="caption" color="textSecondary" style={styles.label}>
          {t("category")}
        </MText>
        <TextInput
          value={category}
          onChangeText={setCategory}
          placeholder={`${t("grocies")}, ${t("transport")}, ${t("food")}...`}
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

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

      {hasReceiptDetails || mode === "edit" ? (
        <View style={styles.moreSection}>
          <Pressable
            style={styles.moreToggle}
            onPress={() => setShowMore((prev) => !prev)}
          >
            <MText variant="bodyStrong">{t("transaction.edit.more")}</MText>
            <BaseIcon
              name={showMore ? "chevron-up-outline" : "chevron-down-outline"}
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>

          {showMore ? (
            <View style={styles.moreBody}>
              {initialTransaction?.storeName ? (
                <View style={styles.field}>
                  <MText variant="caption" color="textSecondary" style={styles.label}>
                    {t("receipt.review.store")}
                  </MText>
                  <View style={styles.storeRow}>
                    <BaseIcon
                      name="storefront-outline"
                      size={18}
                      color={colors.primaryLight}
                    />
                    <TextInput
                      value={initialTransaction.storeName}
                      editable={false}
                      style={[styles.input, styles.inputReadOnly, styles.storeInput]}
                    />
                  </View>
                </View>
              ) : null}

              <View style={styles.field}>
                <MText variant="caption" color="textSecondary" style={styles.label}>
                  {initialTransaction?.storeName
                    ? t("receipt.review.description")
                    : t("item")}
                </MText>
                <TextInput
                  value={item}
                  onChangeText={setItem}
                  placeholder={`${t("rent")}, ${t("insurance")}, ${t("salary")}...`}
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                  multiline
                />
              </View>

              {subItems.length > 0 ? (
                <View style={styles.field}>
                  <MText variant="caption" color="textSecondary" style={styles.label}>
                    {t("transaction.edit.purchasedItems", {
                      count: subItems.length,
                    })}
                  </MText>
                  <View style={styles.subItemsBox}>
                    {subItems.map((line) => (
                      <View key={String(line.id)} style={styles.subItemRow}>
                        <MText variant="body" style={styles.subItemName} numberOfLines={2}>
                          {line.name}
                        </MText>
                        <MText variant="caption" color="textSecondary">
                          {line.quantity != null && line.quantity !== 1
                            ? `${line.quantity}× `
                            : ""}
                          {(line.totalAmount ?? line.unitPrice ?? 0).toFixed(2)} €
                        </MText>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
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
      )}

      {formError ? (
        <MText variant="caption" style={{ color: colors.danger }}>
          {formError}
        </MText>
      ) : null}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <MText variant="bodyStrong" color="textInverse">
          {titlePrefix}
        </MText>
      </TouchableOpacity>

      {mode === "edit" && onDelete ? (
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <MText variant="bodyStrong" style={styles.deleteButtonText}>
            {t("transaction.delete")}
          </MText>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.sm,
    paddingBottom: spacing.xl,
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
  inputReadOnly: {
    opacity: 0.85,
  },
  storeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  storeInput: {
    flex: 1,
  },
  moreSection: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    overflow: "hidden",
    backgroundColor: colors.surfaceStrong,
  },
  moreToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  moreBody: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderSubtle,
  },
  subItemsBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  subItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderSubtle,
  },
  subItemName: {
    flex: 1,
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
  segmentActiveIncome: {
    borderColor: colors.success,
    backgroundColor: colors.background,
  },
  segmentActiveExpense: {
    borderColor: colors.danger,
    backgroundColor: colors.background,
  },
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
  deleteButton: {
    marginTop: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  deleteButtonText: {
    color: colors.danger,
  },
});
