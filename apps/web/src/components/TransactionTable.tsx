// src/components/TransactionTable.tsx
import type { Transaction } from "@musti/core";

interface TransactionTableProps {
  transactions: Transaction[];
  onDelete: (transaction: Transaction) => void;
  onEdit: (transaction: Transaction) => void;
}

export default function TransactionTable({
  transactions,
  onDelete,
  onEdit,
}: TransactionTableProps) {
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 tracking-wide">
            Transactions
          </h2>
          <p className="text-xs text-slate-400">
            {transactions.length} record
            {transactions.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="relative -mx-4 mt-2">
        <div className="overflow-x-auto overflow-y-auto max-h-[480px] px-4">
          <table className="min-w-full text-xs text-left">
            <thead className="bg-slate-900/90 sticky top-0 z-10">
              <tr className="text-slate-400">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Month</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Item</th>
                <th className="py-2 pr-4">Category</th>
                <th className="py-2 pr-4">Fixed?</th>
                <th className="py-2 pr-4 text-right">Amount</th>
                <th className="py-2 pl-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No records.
                  </td>
                </tr>
              )}

              {transactions.map((transaction) => {
                const isIncome = transaction.type === "Income";
                const amountClasses = isIncome
                  ? "text-emerald-400"
                  : "text-rose-400";

                return (
                  <tr
                    key={transaction.id}
                    className="border-b border-slate-800/70 hover:bg-slate-800/70 transition"
                  >
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {transaction.date}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {transaction.month}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          isIncome
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/10 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <span className="text-slate-100">{transaction.item}</span>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <span className="text-slate-300">
                        {transaction.category ?? ""}
                      </span>
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          transaction.isFixed
                            ? "bg-amber-500/10 text-amber-300 border border-amber-500/40"
                            : "bg-slate-700/60 text-slate-200 border border-slate-600"
                        }`}
                      >
                        {transaction.isFixed ? "Yes" : "No"}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-right whitespace-nowrap">
                      <span className={`font-semibold ${amountClasses}`}>
                        {transaction.amount.toFixed(2)} €
                      </span>
                    </td>
                    <td className="py-2 pl-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(transaction)}
                          className="px-2 py-1 rounded-md border border-slate-700 text-[11px] text-slate-200 hover:bg-slate-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(transaction)}
                          className="px-2 py-1 rounded-md border border-rose-700/80 text-[11px] text-rose-300 hover:bg-rose-900/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* subtle gradient fade at bottom */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>
    </div>
  );
}
