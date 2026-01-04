import React, { useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Scope, useTranslation, type LocalTransaction } from "@musti/core";
import { useTransactionsStore } from "@/store/budget/transactions/useTransactionsStore";
import { AppModal } from "@/components/ui/AppModal";
import { ScopeSheet } from "@/components/transactions/ScopeSheet";
import TransactionForm from "@/components/transactions/TransactionForm";

export function TransactionModalScreen() {
  const router = useRouter();
  const { mode = "create", id } = useLocalSearchParams<{
    mode?: string;
    id?: string;
  }>();
  const { t } = useTranslation();

  const transactions = useTransactionsStore((s) => s.transactions);
  const createTransaction = useTransactionsStore((s) => s.createTransaction);
  const updateTransactionScoped = useTransactionsStore(
    (s) => s.updateTransactionScoped
  );

  const [scopeSheetOpen, setScopeSheetOpen] = useState(false);
  const [draftUpdate, setDraftUpdate] = useState<LocalTransaction | null>(null);
  const [draftOptions, setDraftOptions] = useState<
    { fixedEndMonth?: string | null } | undefined
  >(undefined);

  const existing = useMemo(
    () =>
      mode === "edit" && id
        ? transactions.find((tx) => String(tx.id) === id)
        : undefined,
    [mode, id, transactions]
  );

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

  return (
    <>
      <AppModal visible={true} title={title} onClose={handleClose}>
        <TransactionForm
          mode={existing ? "edit" : "create"}
          initialTransaction={existing}
          initialFixedEndMonth={planEndMonth}
          onSubmit={handleSubmit}
        />
      </AppModal>

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
