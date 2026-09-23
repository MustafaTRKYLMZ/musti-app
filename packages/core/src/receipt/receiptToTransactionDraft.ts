import type { ReceiptDraft } from "../types/receipt";
import type { TransactionDraft } from "../types/transaction";
import { normalizeReceiptCategoryKey } from "./normalizeReceiptCategoryKey";

export function receiptToTransactionDraft(
  receipt: ReceiptDraft,
  options?: { category?: string }
): TransactionDraft {
  return {
    type: "Expense",
    date: receipt.date,
    item: receipt.description?.trim() || receipt.storeName,
    category: normalizeReceiptCategoryKey(
      options?.category ?? receipt.suggestedCategory ?? "grocies"
    ),
    amount: receipt.total,
    storeId: receipt.storeId,
    storeName: receipt.storeName,
    subItems: receipt.lines.length
      ? receipt.lines.map((line, index) => ({
          id: `line_${index + 1}`,
          name: line.name,
          quantity: line.quantity ?? 1,
          unit: line.unit,
          unitPrice: line.unitPrice,
          totalAmount: line.totalAmount,
          currency: receipt.currency,
          productId: line.productId,
          category: line.productCategory,
          standardUnit: line.unit,
          pricePerStandardUnit: line.unitPrice,
        }))
      : undefined,
  };
}
