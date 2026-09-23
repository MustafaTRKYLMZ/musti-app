import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "@musti/receipt/archive";
const MAX_ENTRIES = 40;

export type ReceiptArchiveEntry = {
  id: string;
  savedAt: string;
  storeName: string;
  total: number;
  currency: string;
  imageUris: string[];
  rawTextPreview: string;
};

async function readArchive(): Promise<ReceiptArchiveEntry[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReceiptArchiveEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function appendReceiptArchiveEntry(
  entry: Omit<ReceiptArchiveEntry, "id" | "savedAt">
): Promise<void> {
  const existing = await readArchive();
  const next: ReceiptArchiveEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    savedAt: new Date().toISOString(),
    ...entry,
  };

  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([next, ...existing].slice(0, MAX_ENTRIES))
  );
}

export async function loadReceiptArchive(): Promise<ReceiptArchiveEntry[]> {
  return readArchive();
}
