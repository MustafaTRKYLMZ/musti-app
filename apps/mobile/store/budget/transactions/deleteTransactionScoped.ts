// apps/mobile/store/transactions/deleteTransactionScoped.ts

import {
    deleteTransactionSeries,
    type Scope,
  } from "@budget/core";
  import type {
    TransactionsStoreSet,
    TransactionsStoreGet,
  } from "../types";
  
  export async function deleteTransactionScopedAction(
    set: TransactionsStoreSet,
    get: TransactionsStoreGet,
    id: number | string,
    scope: Scope
  ): Promise<void> {
    const now = new Date().toISOString();
    const all = get().transactions;
  
    const updated = deleteTransactionSeries(all, id, scope, now);
    if (!updated) return;
  
    set({ transactions: updated });
  }
  