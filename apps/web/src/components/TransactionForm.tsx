import { type FormEvent, useState } from "react";
import dayjs from "dayjs";
import type { Transaction, TransactionType } from "@musti/core";

const today = dayjs().format("YYYY-MM-DD");

interface TransactionFormProps {
  mode?: "create" | "edit";
  initialTransaction?: Transaction;
  onSubmit: (transaction: Transaction) => void;
}

export default function TransactionForm({
  mode = "create",
  initialTransaction,
  onSubmit,
}: TransactionFormProps) {
  const [date, setDate] = useState<string>(initialTransaction?.date ?? today);
  const [type, setType] = useState<TransactionType>(
    initialTransaction?.type ?? "Expense"
  );
  const [item, setItem] = useState<string>(initialTransaction?.item ?? "");
  const [category, setCategory] = useState<string>(
    initialTransaction?.category ?? ""
  );
  const [isFixed, setIsFixed] = useState<"yes" | "no">(
    initialTransaction?.isFixed ? "yes" : "no"
  );
  const [amount, setAmount] = useState<string>(
    initialTransaction ? String(initialTransaction.amount) : ""
  );

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const parsedAmount = parseFloat(amount);
    if (!item || !amount || Number.isNaN(parsedAmount)) {
      alert("Item and amount are required.");
      return;
    }

    const monthFromDate =
      date && date.length >= 7 ? date.slice(0, 7) : dayjs().format("YYYY-MM");

    const transaction: Transaction = {
      id: initialTransaction?.id ?? Date.now(),
      date,
      month: monthFromDate,
      type,
      item,
      category: category || undefined,
      amount: parsedAmount,

      isFixed: isFixed === "yes",
      // keep any existing planId when editing;
      // when creating, planId will be attached in App.tsx if isFixed === true
      planId: initialTransaction?.planId,
    };

    onSubmit(transaction);
  };

  const titlePrefix = mode === "edit" ? "Update" : "Save";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* DATE + TYPE + FIXED */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="text-sm text-slate-300 mb-1">Date</label>
          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-slate-300 mb-1">Type</label>
          <select
            value={type}
            onChange={(event) => setType(event.target.value as TransactionType)}
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="Income">Income</option>
            <option value="Expense">Expense</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm text-slate-300 mb-1">Fixed?</label>
          <select
            value={isFixed}
            onChange={(event) =>
              setIsFixed(event.target.value === "yes" ? "yes" : "no")
            }
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <option value="no">No</option>
            <option value="yes">Yes (recurring)</option>
          </select>
        </div>
      </div>

      {/* ITEM */}
      <div className="flex flex-col">
        <label className="text-sm text-slate-300 mb-1">Item</label>
        <input
          type="text"
          value={item}
          onChange={(event) => setItem(event.target.value)}
          placeholder="Rent, Insurance, Salary..."
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* CATEGORY */}
      <div className="flex flex-col">
        <label className="text-sm text-slate-300 mb-1">Category</label>
        <input
          type="text"
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          placeholder="Housing, Food, Transport..."
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* AMOUNT */}
      <div className="flex flex-col">
        <label className="text-sm text-slate-300 mb-1">Amount (€)</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      <button
        type="submit"
        className="w-full py-2 rounded-lg bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-lg transition"
      >
        {titlePrefix}
      </button>
    </form>
  );
}
