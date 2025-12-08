// apps/mobile/features/transactions/screens/TransactionsHomeScreen.tsx

import React, { useEffect, useState, useMemo, useRef } from "react";
import {
  View,
  StyleSheet,
  PanResponder,
  Animated, // 🔹 animasyon için
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import {
  getLocalizedDateParts,
  Scope,
  useTranslation,
  type LocalTransaction,
} from "@budget/core";

import TransactionList from "../components/TransactionList";
import { useTransactionsStore } from "../../../store/useTransactionsStore";
import { useSettingsStore } from "../../../store/useSettingsStore";

import { HomeHeader } from "../../../components/ui/HomeHeader";
import { DailyBalanceSection } from "../components/DailyBalanceSection";
import { ViewTabs, type ViewTab } from "../../../components/ui/ViewTabs";
import { MonthNavigator } from "../components/MonthNavigator";
import { MonthlyBalanceBar } from "../components/MonthlyBalanceBar";
import { SidebarMenu } from "../../../components/ui/SidebarMenu";
import { DeleteTransactionSheet } from "../components/DeleteTransactionSheet";
import { syncTransactions } from "../../../services/syncTransactions";
import { CustomAlert } from "@/components/CustomAlert";

import { FAB, Screen, colors, spacing } from "@budget/ui-native";
import { PdfModal } from "@/components/ui/pdf/PdfModal";

const getCurrentMonth = () => dayjs().format("YYYY-MM");

export function TransactionsHomeScreen() {
  const allTransactions = useTransactionsStore((s) => s.transactions);
  const loadFromStorage = useTransactionsStore((s) => s.loadFromStorage);
  const deleteScoped = useTransactionsStore((s) => s.deleteTransactionScoped);
  const getBalanceOnDate = useTransactionsStore((s) => s.getBalanceOnDate);
  const [alertMessage, setAlertMessage] = useState("");

  const loadInitialBalance = useSettingsStore((s) => s.loadInitialBalance);

  const [month, setMonth] = useState(getCurrentMonth);
  const [viewTab, setViewTab] = useState<ViewTab>("all");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LocalTransaction | null>(
    null
  );
  const [scrollToDateKey, setScrollToDateKey] = useState<string | undefined>();
  const [scrollToDateTrigger, setScrollToDateTrigger] = useState(0);
  const [pdfModalVisible, setPdfModalVisible] = useState(false);

  const handleOpenPdf = () => setPdfModalVisible(true);
  const handleClosePdf = () => setPdfModalVisible(false);
  const { t, language } = useTranslation();

  const [selectedDate, setSelectedDate] = useState(
    dayjs().format("YYYY-MM-DD")
  );

  // 🔹 value of the animation (-1, 0, 1)
  const monthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void loadInitialBalance();
    void loadFromStorage();
  }, [loadInitialBalance, loadFromStorage]);

  // Only non-deleted transactions are visible in UI
  const transactions = useMemo(
    () => allTransactions.filter((t) => !t.deleted),
    [allTransactions]
  );

  const { month: monthName, year } = getLocalizedDateParts(month, language);

  const filteredByMonth = useMemo(
    () => transactions.filter((t) => t.month === month),
    [transactions, month]
  );

  const filtered = useMemo(() => {
    if (viewTab === "fixed") {
      return filteredByMonth.filter((t) => t.isFixed);
    }
    if (viewTab === "income") {
      return filteredByMonth.filter((t) => t.type === "Income");
    }
    if (viewTab === "expense") {
      return filteredByMonth.filter((t) => t.type === "Expense");
    }
    return filteredByMonth;
  }, [filteredByMonth, viewTab]);

  const handleEdit = (t: LocalTransaction) => {
    router.push({
      pathname: "/(modals)/transaction",
      params: { id: String(t.id), mode: "edit" },
    });
  };

  const handleDelete = (t: LocalTransaction) => {
    setDeleteTarget(t);
  };

  const confirmDelete = (scope: Scope) => {
    if (!deleteTarget) return;
    void deleteScoped(deleteTarget.id as any, scope);
    setDeleteTarget(null);
  };

  const closeDeleteSheet = () => setDeleteTarget(null);

  // monthly calculations (use filtered list which excludes deleted)
  const income = filtered.reduce(
    (sum, t) => (t.type === "Income" ? sum + t.amount : sum),
    0
  );
  const expense = filtered.reduce(
    (sum, t) => (t.type === "Expense" ? sum + t.amount : sum),
    0
  );
  const monthNet = income - expense;
  const dailySummary = getBalanceOnDate(selectedDate);

  // 🔹when date change, update day and month
  const handleChangeDate = (newDate: string) => {
    setSelectedDate(newDate);

    const newMonth = newDate.slice(0, 7);
    setMonth(newMonth);
    setScrollToDateKey(newDate);
    setScrollToDateTrigger((x) => x + 1);
  };

  // 🔹 when month changed animation
  const animateMonthChange = (direction: 1 | -1) => {
    monthAnim.setValue(0);
    Animated.sequence([
      Animated.timing(monthAnim, {
        toValue: direction,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(monthAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const shiftMonth = (delta: number) => {
    setMonth((prevMonth) => {
      const base = dayjs(`${prevMonth}-01`).add(delta, "month");
      const newMonthStr = base.format("YYYY-MM");

      setSelectedDate(base.endOf("month").format("YYYY-MM-DD"));

      return newMonthStr;
    });
    animateMonthChange(delta > 0 ? 1 : -1);
  };

  const goPrevMonth = () => shiftMonth(-1);
  const goNextMonth = () => shiftMonth(1);

  const handleOpenSimulation = () => {
    router.push("/simulation");
  };

  const handleRefresh = () => {
    void syncTransactions();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_evt, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 16 && Math.abs(dx) > Math.abs(dy);
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const { dx } = gestureState;
        if (Math.abs(dx) < 40) return;

        if (dx < 0) {
          goNextMonth();
        } else {
          goPrevMonth();
        }
      },
    })
  ).current;

  const animatedSwipeStyle = {
    transform: [
      {
        translateX: monthAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [30, 0, -30],
        }),
      },
      {
        scale: monthAnim.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [0.98, 1, 0.98],
        }),
      },
    ],
    opacity: monthAnim.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0.4, 1, 0.4],
    }),
  };
  return (
    <Screen style={styles.screen}>
      <View style={styles.content}>
        <HomeHeader
          onOpenMenu={() => setSidebarOpen(true)}
          onOpenSimulation={handleOpenSimulation}
          onLanguageChange={setAlertMessage}
        />

        {/* swipe area */}
        <Animated.View
          style={[styles.swipeArea, animatedSwipeStyle]}
          {...panResponder.panHandlers}
        >
          <DailyBalanceSection
            title={t("balance_as")}
            selectedDate={selectedDate}
            currentMonth={month}
            balance={dailySummary.balance}
            onChangeDate={handleChangeDate}
          />

          <ViewTabs active={viewTab} onChange={setViewTab} />

          <MonthNavigator
            monthName={monthName}
            year={year}
            onPrev={goPrevMonth}
            onNext={goNextMonth}
          />

          <View style={styles.listWrapper}>
            <TransactionList
              transactions={filtered}
              onDelete={handleDelete}
              onEdit={handleEdit}
              onPressRefresh={handleRefresh}
              scrollToDateKey={scrollToDateKey}
              scrollToDateTrigger={scrollToDateTrigger}
            />
          </View>

          <MonthlyBalanceBar income={income} expense={expense} net={monthNet} />
        </Animated.View>
      </View>

      {/* FLOATING + BUTTON */}
      <FAB
        onPress={() =>
          router.push({
            pathname: "/(modals)/transaction",
            params: { mode: "create" },
          })
        }
        icon={<Ionicons name="add" size={30} color={colors.textInverse} />}
      />

      <SidebarMenu open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <DeleteTransactionSheet
        target={deleteTarget}
        onConfirm={confirmDelete}
        onClose={closeDeleteSheet}
      />

      <CustomAlert
        visible={!!alertMessage}
        message={alertMessage}
        onHide={() => setAlertMessage("")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { gap: spacing.lg, backgroundColor: colors.background },
  content: {
    flex: 1,
  },
  swipeArea: {
    flex: 1,
    paddingHorizontal: spacing.sm,
  },
  listWrapper: {
    flex: 1,
    marginBottom: spacing.md,
  },
});
