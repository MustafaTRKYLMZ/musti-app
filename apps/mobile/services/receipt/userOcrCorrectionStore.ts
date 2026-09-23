import AsyncStorage from "@react-native-async-storage/async-storage";
import type { OcrUserCorrection } from "@musti/core";

const STORAGE_KEY = "@musti/receipt/ocr-corrections";
const MAX_CORRECTIONS = 120;

type StoredCorrection = OcrUserCorrection & { count: number };

async function readCorrections(): Promise<StoredCorrection[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredCorrection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function loadUserOcrCorrections(): Promise<OcrUserCorrection[]> {
  const stored = await readCorrections();
  return stored
    .sort((a, b) => b.count - a.count)
    .slice(0, 40)
    .map(({ from, to }) => ({ from, to }));
}

export async function recordUserOcrCorrections(
  edits: Array<{ original: string; corrected: string }>
): Promise<void> {
  if (edits.length === 0) return;

  const stored = await readCorrections();
  const byKey = new Map<string, StoredCorrection>();

  for (const item of stored) {
    byKey.set(`${item.from}→${item.to}`, item);
  }

  for (const edit of edits) {
    const from = edit.original.trim();
    const to = edit.corrected.trim();
    if (!from || !to || from === to) continue;

    const key = `${from}→${to}`;
    const existing = byKey.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      byKey.set(key, { from, to, count: 1 });
    }
  }

  const next = [...byKey.values()]
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_CORRECTIONS);

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export async function collectLineCorrections(
  originalLines: Array<{ name: string }>,
  editedLines: Array<{ name: string }>
): Promise<Array<{ original: string; corrected: string }>> {
  const edits: Array<{ original: string; corrected: string }> = [];
  const limit = Math.min(originalLines.length, editedLines.length);

  for (let i = 0; i < limit; i += 1) {
    const original = originalLines[i]?.name?.trim() ?? "";
    const corrected = editedLines[i]?.name?.trim() ?? "";
    if (original && corrected && original !== corrected) {
      edits.push({ original, corrected });
    }
  }

  return edits;
}
