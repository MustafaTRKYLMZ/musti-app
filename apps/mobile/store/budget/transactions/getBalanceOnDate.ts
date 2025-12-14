// apps/mobile/store/transactions/getBalanceOnDate.ts

import { BalanceOnDate, computeBalanceOnDate } from "@budget/core";
import { useSettingsStore } from "../useSettingsStore";
import { TransactionsStoreGet } from "../types";


export function getBalanceOnDateSelector(
  get: TransactionsStoreGet,
  date: string
): BalanceOnDate {
  const { transactions } = get();
  const { initialBalance } = useSettingsStore.getState();

  return computeBalanceOnDate(transactions, date, initialBalance);
}
