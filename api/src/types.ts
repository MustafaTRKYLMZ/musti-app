// import type { Transaction as CoreTransaction } from "@musti/core"; // Removed as Transaction is not exported
type CoreTransaction = {}; // Define a placeholder or replace with the correct type if available


export type TransactionType = "Income" | "Expense";

export type Transaction = CoreTransaction & {
 // we can add more fields here in the future if needed
 id: number | string;
  date: string;         // "YYYY-MM-DD"
  month: string;        // "YYYY-MM"
  type: TransactionType;
  item: string;
  category?: string;
  amount: number;
  isFixed?: boolean;
  planId?: number | string;

  // Sync-related fields:
  updatedAt: string;    // ISO timestamp of last modification
  deleted?: boolean;    // Soft delete flag
};
