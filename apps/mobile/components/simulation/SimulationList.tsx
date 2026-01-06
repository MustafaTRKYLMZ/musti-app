import React from "react";
import { View, StyleSheet } from "react-native";
import { CashflowRow } from "@/components/ui/CashflowRow";
import { getOccurrencesUntilDate } from "@/utils/getOccurrencesUntilDate";
import { SimulationItem } from "@musti/core";
import { colors, spacing, radii } from "@musti/ui-native";

interface SimulationListProps {
  items: SimulationItem[];
  onDelete: (id: string) => void;
  targetDate: string;
}

export const SimulationList: React.FC<SimulationListProps> = ({
  items,
  onDelete,
  targetDate,
}) => {
  return (
    <View>
      {items.map((it) => {
        const occurrences = getOccurrencesUntilDate(it, targetDate);

        return (
          <View key={it.id} style={styles.cardRow}>
            <CashflowRow
              title={it.item}
              type={it.type}
              amount={it.amount}
              date={it.date}
              category={it.category}
              isFixed={it.isFixed}
              multiplier={occurrences > 1 ? occurrences : undefined}
              onDelete={() => onDelete(it.id)}
            />
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  cardRow: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
});
