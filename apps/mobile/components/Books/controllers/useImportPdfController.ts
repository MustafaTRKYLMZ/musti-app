import { useCallback, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { getPdfsDirectory } from "@/utils/getPdfsDirectory";

type ImportedDoc = { uri: string; name: string };

type Deps = {
  onImported?: (doc: ImportedDoc) => void;
  onError?: (e: unknown) => void;
};

function sanitizePdfName(name: string | undefined) {
  const base = (name || `pdf-${Date.now()}.pdf`).trim();

  // whitespace -> underscore, remove weird chars
  const cleaned = base
    .replace(/\s+/g, "_")
    .replace(/[^\w.\-()]/g, "");

  // ensure .pdf extension
  if (cleaned.toLowerCase().endsWith(".pdf")) return cleaned;
  return `${cleaned}.pdf`;
}

export function useImportPdfController(deps: Deps) {
  const [isLoading, setIsLoading] = useState(false);

  const pickAndImport = useCallback(async () => {
    try {
      setIsLoading(true);

      const result = await DocumentPicker.getDocumentAsync({
        type: "application/pdf",
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;

      const asset = result.assets?.[0];
      if (!asset?.uri) return;

      const safeName = sanitizePdfName(asset.name);

      const pdfDir = await getPdfsDirectory();
      const destPath = `${pdfDir}${Date.now()}-${safeName}`;

      await FileSystem.copyAsync({ from: asset.uri, to: destPath });

      deps.onImported?.({ uri: destPath, name: safeName });
    } catch (e) {
      deps.onError?.(e);
    } finally {
      setIsLoading(false);
    }
  }, [deps]);

  return { isLoading, pickAndImport };
}
