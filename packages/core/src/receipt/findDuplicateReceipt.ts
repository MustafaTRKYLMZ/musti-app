import type { LocalTransaction } from "../types/transaction";
import { storeNamesMatch } from "./parseReceiptText";

export type ReceiptDuplicateCheck = {
  date: string;
  storeName: string;
  total: number;
  storeId?: string;
};

export function findDuplicateReceipt(
  transactions: LocalTransaction[],
  draft: ReceiptDuplicateCheck
): LocalTransaction | null {
  const match = transactions.find((tx) => {
    if (tx.deleted || tx.type !== "Expense") return false;
    if (tx.date !== draft.date) return false;
    if (Math.abs(tx.amount - draft.total) >= 0.02) return false;

    if (draft.storeId && tx.storeId) {
      return tx.storeId === draft.storeId;
    }

    const txStore = tx.storeName ?? tx.item ?? "";
    return storeNamesMatch(txStore, draft.storeName);
  });

  return match ?? null;
}
