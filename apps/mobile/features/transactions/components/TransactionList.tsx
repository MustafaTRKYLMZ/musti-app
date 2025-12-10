import React, {
  useCallback,
  useMemo,
  useState,
  useRef,
  useEffect,
} from "react";
import {
  View,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ViewToken,
} from "react-native";
import dayjs from "dayjs";
import { LocalizedDateText, type LocalTransaction } from "@budget/core";
import { MText, colors, spacing, radii } from "@budget/ui-native";

import { useTransactionsStore } from "../../../store/useTransactionsStore";
import { CashflowRow } from "@/components/ui/CashflowRow";
import { findSectionIndexForDate } from "@/utils/findSectionIndexForDate";
import { AnimatedFutureRow } from "../../../components/ui/AnimatedFutureRow";
import { BaseIcon } from "@/components/ui/AppIcon";

interface TransactionListProps {
  transactions: LocalTransaction[];
  onDelete: (tx: LocalTransaction) => void;
  onEdit: (tx: LocalTransaction) => void;
  onPressRefresh?: () => void | Promise<void>;
  scrollToDateKey?: string;
  scrollToDateTrigger?: number;
}

type SectionPosition = "past" | "today" | "future" | "other";

export type TxSection = {
  key: string;
  data: LocalTransaction[];
  cumulativeBalance: number;
  position: SectionPosition;
};

function getTxDate(tx: LocalTransaction): dayjs.Dayjs | null {
  if (tx.date) return dayjs(tx.date);
  if (tx.month) return dayjs(`${tx.month}-01`);
  return null;
}

export default function TransactionList({
  transactions,
  onDelete,
  onEdit,
  onPressRefresh,
  scrollToDateKey,
  scrollToDateTrigger,
}: TransactionListProps) {
  const [refreshing, setRefreshing] = useState(false);
  const listRef = useRef<SectionList<LocalTransaction, TxSection> | null>(null);
  const initialScrollDoneRef = useRef(false);

  const [visibleItemIds, setVisibleItemIds] = useState<Record<string, boolean>>(
    {}
  );

  const handleRefresh = useCallback(async () => {
    if (!onPressRefresh) return;
    try {
      setRefreshing(true);
      await onPressRefresh();
    } finally {
      setRefreshing(false);
    }
  }, [onPressRefresh]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
      setVisibleItemIds(() => {
        const next: Record<string, boolean> = {};

        for (const v of viewableItems) {
          if (!v.isViewable) continue;

          const item = v.item as LocalTransaction | null;
          if (!item) continue;

          const id = String(item.id);
          next[id] = true;
        }

        return next;
      });
    }
  ).current;

  const sections: TxSection[] = useMemo(() => {
    if (!transactions.length) return [];

    const getBalanceOnDate = useTransactionsStore.getState().getBalanceOnDate;
    const today = dayjs().startOf("day");

    const sorted = [...transactions].sort((a, b) => {
      const da = getTxDate(a);
      const db = getTxDate(b);

      if (!da && !db) return 0;
      if (!da) return 1;
      if (!db) return -1;

      return da.valueOf() - db.valueOf();
    });

    const groups: Record<string, LocalTransaction[]> = {};
    const order: string[] = [];

    for (const tx of sorted) {
      const d = getTxDate(tx);
      const key = d ? d.format("YYYY-MM-DD") : "other";

      if (!groups[key]) {
        groups[key] = [];
        order.push(key);
      }
      groups[key].push(tx);
    }

    const rawSections: TxSection[] = order.map((key) => {
      const groupTxs = groups[key];
      let cumulativeBalance = 0;
      let position: SectionPosition = "other";

      if (key !== "other") {
        const sectionDate = dayjs(key).startOf("day");
        const balanceResult = getBalanceOnDate(key);
        cumulativeBalance = balanceResult.balance;

        if (sectionDate.isSame(today, "day")) {
          position = "today";
        } else if (sectionDate.isBefore(today, "day")) {
          position = "past";
        } else {
          position = "future";
        }
      }

      return {
        key,
        data: groupTxs,
        cumulativeBalance,
        position,
      };
    });

    const todaySections = rawSections.filter((s) => s.position === "today");

    const pastSections = rawSections
      .filter((s) => s.position === "past")
      .sort((a, b) => dayjs(b.key).valueOf() - dayjs(a.key).valueOf());

    const futureSections = rawSections
      .filter((s) => s.position === "future")
      .sort((a, b) => dayjs(b.key).valueOf() - dayjs(a.key).valueOf());

    const otherSections = rawSections.filter((s) => s.position === "other");

    return [
      ...futureSections,
      ...todaySections,
      ...pastSections,
      ...otherSections,
    ];
  }, [transactions]);

  const scrollToDate = useCallback(
    (targetKey?: string) => {
      if (!sections.length) return;
      if (!listRef.current) return;

      const sectionIndex = findSectionIndexForDate(sections, targetKey);
      if (sectionIndex === -1) return;

      listRef.current.scrollToLocation({
        sectionIndex,
        itemIndex: 0,
        animated: true,
        viewPosition: 0,
      });
    },
    [sections]
  );

  useEffect(() => {
    if (!sections.length) return;
    if (initialScrollDoneRef.current) return;

    initialScrollDoneRef.current = true;

    const target = scrollToDateKey;
    requestAnimationFrame(() => {
      scrollToDate(target);
    });
  }, [sections]);

  useEffect(() => {
    if (!scrollToDateKey) return;
    if (scrollToDateTrigger == null) return;
    scrollToDate(scrollToDateKey);
  }, [scrollToDateKey, scrollToDateTrigger, sections, scrollToDate]);

  if (!transactions.length) {
    return (
      <View style={styles.emptyState}>
        <BaseIcon
          name="wallet-outline"
          size={40}
          color={colors.textSecondary}
        />

        <MText variant="bodyStrong" color="textPrimary">
          No transactions yet
        </MText>

        <MText
          variant="body"
          color="textSecondary"
          style={styles.emptySubtitle}
        >
          Add a new one with the + button or refresh.
        </MText>

        {onPressRefresh && (
          <TouchableOpacity
            style={styles.emptyRefreshButton}
            onPress={() => void handleRefresh()}
          >
            <BaseIcon
              name="refresh-outline"
              size={16}
              color={colors.textMuted}
              style={{ marginRight: spacing.xs }}
            />
            <MText variant="bodyStrong" color="primary">
              Refresh
            </MText>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <SectionList
      ref={listRef}
      sections={sections}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.listContent}
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={{ itemVisiblePercentThreshold: 40 }}
      stickySectionHeadersEnabled={false}
      onScrollToIndexFailed={() => {
        setTimeout(() => {
          scrollToDate(scrollToDateKey);
        }, 50);
      }}
      renderSectionHeader={({ section }) =>
        section.key === "other" ? null : (
          <View style={styles.dateHeader}>
            <LocalizedDateText
              date={section.key}
              style={styles.dateHeaderTitle}
              shortMonth
            />
            <MText
              variant="bodyStrong"
              color={
                section.cumulativeBalance > 0
                  ? "success"
                  : section.cumulativeBalance < 0
                  ? "danger"
                  : "textMuted"
              }
            >
              {section.cumulativeBalance.toFixed(2)} €
            </MText>
          </View>
        )
      }
      renderItem={({ item, section, index }) => {
        const isFuture = section.position === "future";
        const id = String(item.id);
        const isVisible = !!visibleItemIds[id];

        const content = (
          <View style={[styles.cardRow, isFuture && styles.cardRowFuture]}>
            <CashflowRow
              title={item.item}
              type={item.type}
              amount={item.amount}
              date={item.date}
              category={item.category}
              isFixed={item.isFixed}
              onPress={() => onEdit(item)}
              onDelete={() => onDelete(item)}
            />
          </View>
        );

        if (!isFuture) return content;

        return (
          <AnimatedFutureRow
            visible={isVisible}
            variant="softPop"
            index={index}
          >
            {content}
          </AnimatedFutureRow>
        );
      }}
      refreshing={refreshing}
      onRefresh={onPressRefresh ? handleRefresh : undefined}
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: spacing.xs,
  },

  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing["2xl"],
    gap: spacing.xs,
  },
  emptySubtitle: {
    textAlign: "center",
    marginTop: spacing.xs / 2,
  },
  emptyRefreshButton: {
    marginTop: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },

  dateHeader: {
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateHeaderTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: "700",
  },

  cardRow: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },

  cardRowFuture: {
    backgroundColor: colors.surfaceStrong,
    opacity: 0.75,
  },
});
