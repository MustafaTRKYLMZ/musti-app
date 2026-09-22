import React, { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Scope, useTranslation, type LocalTransaction } from "@musti/core";
import { useTransactionsStore } from "@/store/budget/transactions/useTransactionsStore";
import { ScopeSheet } from "@/components/transactions/ScopeSheet";
import { DeleteTransactionSheet } from "@/components/transactions/DeleteTransactionSheet";
import TransactionForm from "@/components/transactions/TransactionForm";
import {
  CreateTransactionTabs,
  type CreateTransactionTab,
} from "@/components/transactions/CreateTransactionTabs";
import { ReceiptScanFlow } from "@/components/receipt/ReceiptScanFlow";
import { AppModal, spacing } from "@musti/ui-native";

export function TransactionModalScreen() {
  const router = useRouter();
  const { mode = "create", id, tab } = useLocalSearchParams<{
    mode?: string;
    id?: string;
    tab?: string;
  }>();
  const { t } = useTranslation();

  const transactions = useTransactionsStore((s) => s.transactions);
  const createTransaction = useTransactionsStore((s) => s.createTransaction);
  const updateTransactionScoped = useTransactionsStore(
    (s) => s.updateTransactionScoped
  );
  const deleteTransactionScoped = useTransactionsStore(
    (s) => s.deleteTransactionScoped
  );

  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [draftUpdate, setDraftUpdate] = useState<LocalTransaction | null>(null);
  const [draftOptions, setDraftOptions] = useState<
    { fixedEndMonth?: string | null } | undefined
  >(undefined);
  const [activeTab, setActiveTab] = useState<CreateTransactionTab>(
    tab === "manual" ? "manual" : "scan"
  );
  const [scanStep, setScanStep] = useState<"camera" | "processing" | "review">(
    "camera"
  );

  const existing = useMemo(
    () =>
      mode === "edit" && id
        ? transactions.find((tx) => String(tx.id) === id)
        : undefined,
    [mode, id, transactions]
  );

  const isCreate = !existing;

  const planEndMonth: string | null = useMemo(() => {
    if (!existing || !existing.isFixed || !existing.planId) return null;

    const planTxs = transactions.filter(
      (t) => t.planId === existing.planId && !t.deleted
    );

    if (planTxs.length === 0) return null;

    const sortedMonths = planTxs
      .map((t) => t.month)
      .filter(Boolean)
      .sort();

    return sortedMonths[sortedMonths.length - 1] ?? null;
  }, [existing, transactions]);

  const title = existing ? t("transaction.edit") : t("transaction.create");

  const handleClose = () => {
    router.back();
  };

  const handleSubmit = async (
    tx: LocalTransaction,
    options?: { fixedEndMonth?: string | null }
  ) => {
    if (!existing) {
      await createTransaction(tx, options);
      handleClose();
      return;
    }

    const isPlanBased = Boolean(existing.isFixed && existing.planId);

    if (!isPlanBased) {
      await updateTransactionScoped(existing.id as any, tx, "this");
      handleClose();
      return;
    }
    setDraftUpdate(tx);
    setDraftOptions(options);
    setScopeSheetOpen(true);
  };

  const applyScope = async (scope: Scope) => {
    if (!existing || !draftUpdate) return;

    await updateTransactionScoped(
      existing.id as any,
      draftUpdate,
      scope,
      draftOptions
    );

    setScopeSheetOpen(false);
    router.back();
  };

  const showScanTab = isCreate && activeTab === "scan";

  return (
    <>
      <AppModal
        visible
        variant={isCreate ? "full" : "sheet"}
        title={title}
        onClose={handleClose}
        scrollable
        contentContainerStyle={showScanTab ? styles.scanModalContent : undefined}
      >
        {isCreate && scanStep === "review" ? (
          <CreateTransactionTabs
            value={activeTab}
            onChange={(next) => {
              setActiveTab(next);
              if (next === "scan") {
                setScanStep("camera");
              }
            }}
          />
        ) : null}

        {showScanTab ? (
          <View
            style={[
              styles.scanPane,
              scanStep === "camera" ? styles.scanPaneCamera : styles.scanPaneReview,
            ]}
          >
            <ReceiptScanFlow
              key="receipt-scan-flow"
              embedded
              onDone={handleClose}
              onSwitchToManual={() => setActiveTab("manual")}
              onStepChange={setScanStep}
            />
          </View>
        ) : (
          <TransactionForm
            mode={existing ? "edit" : "create"}
            initialTransaction={existing}
            initialFixedEndMonth={planEndMonth}
            onSubmit={handleSubmit}
            onDelete={existing ? () => setDeleteSheetOpen(true) : undefined}
          />
        )}
      </AppModal>

      <DeleteTransactionSheet
        target={deleteSheetOpen && existing ? existing : null}
        onConfirm={(scope) => {
          if (!existing) return;
          void deleteTransactionScoped(existing.id as any, scope);
          setDeleteSheetOpen(false);
          handleClose();
        }}
        onClose={() => setDeleteSheetOpen(false)}
      />

      <ScopeSheet
        visible={scopeSheetOpen && !!existing && !!draftUpdate}
        title={t("update_fixed_transaction")}
        subtitle={
          existing ? `${existing.item} · ${existing.amount.toFixed(2)} €` : ""
        }
        options={[
          { scope: "this", label: t("this_only") },
          { scope: "thisAndFuture", label: t("this_and_future") },
          {
            scope: "all",
            label: t("all_occurrences"),
            variant: "danger",
          },
        ]}
        cancelLabel={t("cancel")}
        onSelect={(scope) => void applyScope(scope as Scope)}
        onCancel={() => setScopeSheetOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  scanModalContent: {
    flexGrow: 1,
  },
  scanPane: {
    flex: 1,
  },
  scanPaneCamera: {
    marginHorizontal: -spacing.lg,
    marginTop: -spacing.sm,
    marginBottom: -spacing.md,
    minHeight: 520,
  },
  scanPaneReview: {
    minHeight: 0,
  },
});
