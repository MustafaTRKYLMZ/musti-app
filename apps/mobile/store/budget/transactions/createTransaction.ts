// apps/mobile/store/transactions/createTransaction.ts

import {
    createTransactionWithSeries,
    type TransactionDraft,
  } from "@budget/core";
  import type {
    TransactionsStoreSet,
    TransactionsStoreGet,
  } from "../types";
  
  export async function createTransactionAction(
    set: TransactionsStoreSet,
    get: TransactionsStoreGet,
    tx: TransactionDraft,
    options?: { fixedEndMonth?: string | null }
  ): Promise<void> {
    const now = new Date().toISOString();
  
    set((state) => ({
      ...state,
      transactions: createTransactionWithSeries(
        state.transactions,
        tx,
        now,
        options
      ),
    }));
  }
  