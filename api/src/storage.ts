import { promises as fs } from "fs";
import path from "path";
import type { Transaction } from "./types";

const DATA_DIR = path.join(__dirname, "..", "data");
const DATA_FILE = path.join(DATA_DIR, "transactions.json");

async function ensureDataFile() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, "[]", "utf-8");
  }
}

export async function readTransactions(): Promise<Transaction[]> {
  await ensureDataFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Transaction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function writeTransactions(
  transactions: Transaction[]
): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(transactions, null, 2), "utf-8");
}

export async function getTransactionById(
  id: string
): Promise<Transaction | undefined> {
  const all = await readTransactions();
  return all.find((t) => String(t.id) === id);
}
