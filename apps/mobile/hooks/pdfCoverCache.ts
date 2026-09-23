import * as FileSystem from "expo-file-system/legacy";

function safeKey(input: string) {
  return input.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 120) || "pdf";
}

export function getCoversDir() {
  const base = FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "";
  return base + "pdf_covers/";
}

export async function ensureCoversDir() {
  const dir = getCoversDir();
  await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch((error) => {
    console.warn("Failed to create PDF covers directory:", dir, error);
  });
  return dir;
}

export function getCoverPathForPdfUri(pdfUri: string) {
  const dir = getCoversDir();
  const key = safeKey(pdfUri);
  return `${dir}${key}_p1.jpg`;
}
