import React from "react";
import { View, StyleSheet } from "react-native";
import dayjs from "dayjs";
import { useTranslation } from "@budget/core";
import { LocalizedDatePicker } from "@/components/ui/LocalizedDatePicker";
import { MText, colors, spacing } from "@budget/ui-native";
import { QuickChip } from "./QuickChip";

interface Props {
  selectedDate: string | undefined;
  currentMonth: string;
  balance: number;
  onChangeDate: (dateStr: string) => void;
  title: string;
  isTransaction?: boolean;
}

export function DailyBalanceSection({
  isTransaction = true,
  title,
  selectedDate,
  currentMonth,
  balance,
  onChangeDate,
}: Props) {
  const { t } = useTranslation();

  const todayStr = dayjs().format("YYYY-MM-DD");
  const effectiveSelectedDate = selectedDate || todayStr;

  const endOfMonthStr = dayjs(`${currentMonth}-01`)
    .endOf("month")
    .format("YYYY-MM-DD");

  const balanceColor: keyof typeof colors =
    balance > 0 ? "success" : balance < 0 ? "danger" : "textSecondary";

  return (
    <>
      <View style={styles.dailyRow}>
        <View style={styles.leftCol}>
          <MText
            style={styles.dailyLabel}
            variant="bodyStrong"
            color="textSecondary"
          >
            {title}
          </MText>

          <LocalizedDatePicker
            value={effectiveSelectedDate}
            onChange={onChangeDate}
          />
        </View>

        <MText
          style={styles.dailyAmount}
          variant="heading3"
          color={balanceColor}
        >
          € {balance.toFixed(2)}
        </MText>
      </View>

      {isTransaction && (
        <View style={styles.quickRow}>
          <QuickChip
            label={t("today")}
            active={effectiveSelectedDate === todayStr}
            onPress={() => onChangeDate(todayStr)}
          />
          <QuickChip
            label={t("end_of_month")}
            active={effectiveSelectedDate === endOfMonthStr}
            onPress={() => onChangeDate(endOfMonthStr)}
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  dailyRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  leftCol: {
    flex: 1,
    gap: spacing.md,
  },
  dailyLabel: {
    marginBottom: spacing.xs * 0.5,
  },
  dailyAmount: {
    textAlign: "right",
    marginBottom: spacing.md,
  },
  quickRow: {
    flexDirection: "row",
    margin: spacing.sm,
    gap: spacing.lg,
  },
});
