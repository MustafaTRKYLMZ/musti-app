

import {
    updateTransactionSeries,
    type LocalTransaction,
    type Scope,
  } from "@budget/core";
  import type {
    TransactionsStoreSet,
    TransactionsStoreGet,
  } from "../types";
  
  export async function updateTransactionScopedAction(
    set: TransactionsStoreSet,
    get: TransactionsStoreGet,
    id: number | string,
    body: Partial<LocalTransaction>,
    scope: Scope,
    options?: { fixedEndMonth?: string | null }
  ): Promise<void> {
    const now = new Date().toISOString();
    const all = get().transactions;
  
    const updated = updateTransactionSeries(
      all,
      id,
      body,
      scope,
      now,
      options
    );
  
    if (!updated) return;
  
    set({ transactions: updated });
  }
  