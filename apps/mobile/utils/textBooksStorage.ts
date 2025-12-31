import { TextBook } from "@budget/core";
import * as FileSystem from "expo-file-system/legacy";

const DIR = `${FileSystem.documentDirectory}textbooks`;

async function ensureDir() {
  const info = await FileSystem.getInfoAsync(DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true });
  }
}

export async function saveTextBook(book: TextBook) {
  await ensureDir();
  const uri = `${DIR}/${book.id}.json`;
  await FileSystem.writeAsStringAsync(uri, JSON.stringify(book), {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return uri;
}

export async function deleteTextBookById(id: string) {
  await ensureDir();
  const uri = `${DIR}/${id}.json`;
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists) return;
  await FileSystem.deleteAsync(uri, { idempotent: true });
}

export async function listTextBookFiles(): Promise<Array<{ id: string; uri: string }>> {
  await ensureDir();
  const files = await FileSystem.readDirectoryAsync(DIR);
  return files
    .filter((f) => f.endsWith(".json"))
    .map((f) => ({ id: f.replace(".json", ""), uri: `${DIR}/${f}` }));
}

export async function readTextBook(uri: string): Promise<TextBook> {
  const raw = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return JSON.parse(raw) as TextBook;
}
