// apps/mobile/utils/getPdfsDirectory.ts
import * as FileSystem from "expo-file-system/legacy";

export type LocalPdfFile = {
  name: string;
  uri: string;
};

export const getPdfsDirectory = async (): Promise<string> => {
  const baseDir =
    FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "/";

  const pdfDir = baseDir + "pdfs/";

  try {
    const info = await FileSystem.getInfoAsync(pdfDir);

    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(pdfDir, { intermediates: true });
    }
  } catch (e) {
    console.warn("Error while ensuring pdf directory:", e);
  }

  return pdfDir;
};

export const listLocalPdfs = async (): Promise<LocalPdfFile[]> => {
  const dir = await getPdfsDirectory();
  const files = await FileSystem.readDirectoryAsync(dir);

  return files
    .filter((name) => name.toLowerCase().endsWith(".pdf"))
    .map((name) => ({
      name,
      uri: dir + name,
    }));
};

export const deleteLocalPdf = async (uri: string) => {
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch (e) {
    console.warn("Error while deleting pdf:", e);
  }
};
