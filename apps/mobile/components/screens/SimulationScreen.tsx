import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import dayjs from "dayjs";

import { useTransactionsStore } from "../../store/budget/transactions/useTransactionsStore";
import { SimulationItemModal } from "../ui/modals/SimulationItemModal";
import { RenameScenarioModal } from "@/components/ui/modals/RenameScenarioModal";
import { DailyBalanceSection } from "@/components/transactions";
import { CashflowTotals } from "@/components/ui/CashflowTotals";
import { SimulationList } from "../simulation/SimulationList";
import { getOccurrencesUntilDate } from "@/utils/getOccurrencesUntilDate";
import { SimulationScenario, useTranslation } from "@musti/core";
import {
  MText,
  colors,
  spacing,
  radii,
  FAB,
  shadows,
  BaseIcon,
  IconButton,
} from "@musti/ui-native";
import { useSimulationStore } from "@/store/budget/simulation/useSimulationStore";

export function SimulationScreen() {
  const {
    scenarios,
    activeScenarioId,
    addScenario,
    setActiveScenario,
    addItemToActive,
    removeItemFromActive,
    getActiveScenario,
    loadFromStorage,
    renameScenario,
    deleteScenario,
    setScenarioTargetDate,
  } = useSimulationStore();

  const getBalanceOnDate = useTransactionsStore((s) => s.getBalanceOnDate);

  const todayStr = dayjs().format("YYYY-MM-DD");
  const [targetDate, setTargetDate] = useState(todayStr);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScenarioSidebar, setShowScenarioSidebar] = useState(false);
  const { t } = useTranslation();

  const [renameTarget, setRenameTarget] = useState<SimulationScenario | null>(
    null
  );
  const [renameDraft, setRenameDraft] = useState("");

  const activeScenario = getActiveScenario();

  useEffect(() => {
    void loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (!scenarios.length) {
      const newPlan = t("new_future_plan");
      addScenario(newPlan);
    }
  }, [scenarios.length, addScenario, t]);

  useEffect(() => {
    if (activeScenario?.targetDate) {
      setTargetDate(activeScenario.targetDate);
    } else {
      setTargetDate(todayStr);
    }
  }, [activeScenario?.id, activeScenario?.targetDate, todayStr]);

  const handleGoBack = () => {
    router.replace("/(tabs)/budget");
  };

  const baseBalance = getBalanceOnDate(targetDate);

  const simIncomeTotalForDate =
    activeScenario?.items.reduce((sum, it) => {
      const occurrences = getOccurrencesUntilDate(it, targetDate);
      if (occurrences === 0 || it.type !== "Income") return sum;
      return sum + it.amount * occurrences;
    }, 0) ?? 0;

  const simExpenseTotalForDate =
    activeScenario?.items.reduce((sum, it) => {
      const occurrences = getOccurrencesUntilDate(it, targetDate);
      if (occurrences === 0 || it.type !== "Expense") return sum;
      return sum + it.amount * occurrences;
    }, 0) ?? 0;

  const simNetTotalForDate = simIncomeTotalForDate - simExpenseTotalForDate;

  const withSimulationBalance = baseBalance.balance + simNetTotalForDate;

  const openRename = (scenario: SimulationScenario) => {
    setRenameTarget(scenario);
    setRenameDraft(scenario.name);
  };

  const handleConfirmRename = () => {
    if (!renameTarget) return;
    const trimmed = renameDraft.trim();
    if (!trimmed) {
      setRenameTarget(null);
      return;
    }
    renameScenario(renameTarget.id, trimmed);
    setRenameTarget(null);
  };

  const activeScenarioName = activeScenario?.name ?? t("no_scenario");
  const activeScenarioDisplayName =
    activeScenarioName.length > 18
      ? `${activeScenarioName.slice(0, 18)}…`
      : activeScenarioName;

  const withSimColor: keyof typeof colors =
    withSimulationBalance > 0
      ? "success"
      : withSimulationBalance < 0
      ? "danger"
      : "textSecondary";

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={handleGoBack}
          style={styles.backButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <BaseIcon
            name="chevron-back"
            size={22}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <MText variant="heading3" color="textPrimary">
            {t("simulation.title")}
          </MText>
        </View>

        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.descriptionWrapper}>
          <MText variant="body" color="textSecondary">
            {t("simulation.description")}
          </MText>
        </View>

        {/* Scenario header row */}
        <View style={styles.futureSection}>
          <View>
            <MText variant="bodyStrong" color="textPrimary">
              {t("scenario")}
            </MText>
          </View>

          <TouchableOpacity
            style={styles.activeScenarioButton}
            onPress={() => setShowScenarioSidebar(true)}
            activeOpacity={0.85}
          >
            <BaseIcon
              name="flask-outline"
              size={14}
              color={colors.textMuted}
              style={{ marginRight: 6 }}
            />
            <MText
              variant="body"
              color="textPrimary"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {activeScenarioDisplayName}
            </MText>
            <BaseIcon
              name="ellipsis-vertical"
              size={16}
              color={colors.textMuted}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>
        </View>

        <DailyBalanceSection
          isTransaction={false}
          title={t("real_balance_on")}
          selectedDate={targetDate}
          currentMonth={dayjs().format("YYYY-MM")}
          balance={baseBalance.balance}
          onChangeDate={(dateStr) => {
            setTargetDate(dateStr);
            if (activeScenario) {
              setScenarioTargetDate(activeScenario.id, dateStr);
            }
          }}
        />

        {/* Items list */}
        <View style={styles.section}>
          <View style={styles.sectionTitleContainer}>
            <MText variant="bodyStrong" color="textPrimary">
              {t("planned_transactions")}
            </MText>
          </View>

          {activeScenario && activeScenario.items.length > 0 ? (
            <>
              <View style={styles.simListCard}>
                <SimulationList
                  items={activeScenario.items}
                  onDelete={removeItemFromActive}
                  targetDate={targetDate}
                />
              </View>

              <CashflowTotals
                income={simIncomeTotalForDate}
                expense={simExpenseTotalForDate}
                incomeLabel="Income (all)"
                expenseLabel="Expense (all)"
                netLabel="Balance (all)"
              />
            </>
          ) : (
            <View style={styles.emptySimTextWrapper}>
              <MText variant="body" color="textMuted">
                {t("no_sumalation_data")}
              </MText>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <FAB
        onPress={() => setShowAddModal(true)}
        style={{ marginBottom: spacing["4xl"] * 2 }}
      />

      {/* ADD ITEM MODAL */}
      <SimulationItemModal
        visible={showAddModal}
        initialDate={targetDate}
        onClose={() => setShowAddModal(false)}
        onSubmit={(payload) => {
          addItemToActive(payload);
        }}
      />

      {/* Scenario sidebar */}
      {showScenarioSidebar && (
        <View style={styles.sidebarOverlay}>
          <TouchableOpacity
            style={styles.sidebarBackdrop}
            activeOpacity={1}
            onPress={() => setShowScenarioSidebar(false)}
          />

          <View style={styles.sidebarPanel}>
            <View style={styles.sidebarHeaderRow}>
              <MText variant="heading3" color="textPrimary">
                {t("scenarios")}
              </MText>

              <IconButton
                name="close"
                size={18}
                color={colors.textSecondary}
                onPress={() => setShowScenarioSidebar(false)}
                style={styles.sidebarCloseButton}
                hitSlop={8}
              />
            </View>

            <ScrollView>
              <TouchableOpacity
                style={styles.sidebarNewScenarioRow}
                onPress={() => addScenario(`Plan ${scenarios.length + 1}`)}
              >
                <BaseIcon
                  name="add-circle-outline"
                  size={18}
                  color={colors.success}
                  style={{ marginRight: 8 }}
                />
                <MText variant="bodyStrong" color="success">
                  {t("new_scenario")}
                </MText>
              </TouchableOpacity>

              {scenarios.map((s) => {
                const isActive = s.id === activeScenarioId;
                return (
                  <TouchableOpacity
                    key={s.id}
                    style={[
                      styles.sidebarScenarioRow,
                      isActive && styles.sidebarScenarioRowActive,
                    ]}
                    onPress={() => {
                      setActiveScenario(s.id);
                      setShowScenarioSidebar(false);
                    }}
                    onLongPress={() => openRename(s)}
                    delayLongPress={300}
                  >
                    <View style={styles.sidebarScenarioLeft}>
                      <BaseIcon
                        name="flask-outline"
                        size={16}
                        color={isActive ? colors.background : colors.textMuted}
                        style={{ marginRight: 8 }}
                      />
                      <View style={{ flex: 1 }}>
                        <MText
                          variant="bodyStrong"
                          color={isActive ? "success" : "textPrimary"}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {s.name}
                        </MText>
                        <MText variant="caption" color="textSecondary">
                          {s.items.length} {t("items")}
                        </MText>
                      </View>
                    </View>

                    <IconButton
                      name="trash-outline"
                      size={16}
                      color={colors.textMuted}
                      onPress={() => deleteScenario(s.id)}
                      hitSlop={6}
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* RENAME SCENARIO MODAL */}
      <RenameScenarioModal
        visible={!!renameTarget}
        value={renameDraft}
        onChangeValue={setRenameDraft}
        onCancel={() => setRenameTarget(null)}
        onSave={handleConfirmRename}
      />

      {/* WITH SIMULATION FOOTER */}
      <View style={styles.withSimFooter}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <BaseIcon
            name="sparkles-outline"
            size={16}
            color={colors.textMuted}
            style={{ marginRight: 6 }}
          />
          <MText variant="caption" color="textSecondary">
            {t("with_simulation_balance")}{" "}
            {dayjs(targetDate).format("DD MMM YYYY")}
          </MText>
        </View>

        <MText variant="bodyStrong" color={withSimColor}>
          €{withSimulationBalance.toFixed(2)}
        </MText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    marginTop: spacing.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing["4xl"],
  },
  descriptionWrapper: {
    marginBottom: spacing.sm,
  },
  baseBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
  },
  section: {
    marginTop: spacing.sm,
  },
  sectionTitleContainer: {
    marginBottom: spacing.xs,
  },
  futureSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderColor: colors.borderSubtle,
    marginBottom: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  activeScenarioButton: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 180,
  },
  simListCard: {
    borderRadius: radii.md,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  emptySimTextWrapper: {
    marginTop: spacing.xs,
  },
  withSimFooter: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surfaceStrong,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: shadows.card.shadowColor,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  // Sidebar
  sidebarOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    zIndex: 40,
  },
  sidebarBackdrop: {
    flex: 1,
    backgroundColor: colors.backdropStrong,
  },
  sidebarPanel: {
    width: 260,
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderSubtle,
    paddingHorizontal: spacing.md,
    marginTop: 40,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  sidebarHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  sidebarCloseButton: {
    padding: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  sidebarScenarioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  sidebarScenarioRowActive: {
    backgroundColor: colors.background,
  },
  sidebarScenarioLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  sidebarNewScenarioRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
});
