

import type {
    LocalTransaction,
    BalanceOnDate,
    TransactionDraft,
    Scope,
  } from "@musti/core";
  
  export interface TransactionsStore {
    transactions: LocalTransaction[];
    lastSyncAt: string | null;
    isHydrated: boolean;
  
    loadFromStorage: () => Promise<void>;
  
    createTransaction: (
      tx: TransactionDraft,
      options?: { fixedEndMonth?: string | null }
    ) => Promise<void>;
  
    updateTransactionScoped: (
      id: number | string,
      body: Partial<LocalTransaction>,
      scope: Scope,
      options?: { fixedEndMonth?: string | null }
    ) => Promise<void>;
  
    deleteTransactionScoped: (
      id: number | string,
      scope: Scope
    ) => Promise<void>;
  
    getBalanceOnDate: (date: string) => BalanceOnDate;
  }
  
  export type TransactionsStoreSet = (
    partial:
      | TransactionsStore
      | Partial<TransactionsStore>
      | ((
          state: TransactionsStore
        ) => TransactionsStore | Partial<TransactionsStore>)
  ) => void;
  
  export type TransactionsStoreGet = () => TransactionsStore;
  
  // Re-export domain types if needed in other files
  export type {
    LocalTransaction,
    BalanceOnDate,
    TransactionDraft,
    Scope,
  };
  