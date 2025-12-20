import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { TransactionsStore } from "../../types";
import { createTransactionAction } from "./createTransaction";
import { updateTransactionScopedAction } from "./updateTransactionScoped";
import { deleteTransactionScopedAction } from "./deleteTransactionScoped";
import { getBalanceOnDateSelector } from "./getBalanceOnDate";
import { getZustandStorage } from "@/utils/storage/zustandStorage";


const STORAGE_KEY = "transactions_v1";

export const useTransactionsStore = create(
  persist<TransactionsStore>(
    (set, get) => ({
      transactions: [],
      lastSyncAt: null,
      isHydrated: false,

      async loadFromStorage() {
        if (!get().isHydrated) {
          set({ isHydrated: true });
        }
      },

      async createTransaction(tx, options) {
        await createTransactionAction(set, get, tx, options);
      },

      async updateTransactionScoped(id, body, scope, options) {
        await updateTransactionScopedAction(
          set,
          get,
          id,
          body,
          scope,
          options
        );
      },

      async deleteTransactionScoped(id, scope) {
        await deleteTransactionScopedAction(set, get, id, scope);
      },

      getBalanceOnDate(date) {
        return getBalanceOnDateSelector(get, date);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => getZustandStorage()),
      onRehydrateStorage: () => () => {
        useTransactionsStore.setState({ isHydrated: true });
      },
    }
  )
);
