import { TurboModuleRegistry } from "react-native";

type DocumentScannerModule = {
  scanDocument: (options?: {
    maxNumDocuments?: number;
    croppedImageQuality?: number;
  }) => Promise<{ scannedImages?: string[]; status?: string }>;
};

let cachedScanner: DocumentScannerModule | null | undefined;

function isDocumentScannerNativeLinked(): boolean {
  return TurboModuleRegistry.get("DocumentScanner") != null;
}

function loadDocumentScanner(): DocumentScannerModule | null {
  if (cachedScanner !== undefined) return cachedScanner;
  if (!isDocumentScannerNativeLinked()) {
    cachedScanner = null;
    return null;
  }

  try {
    const mod = require("react-native-document-scanner-plugin");
    cachedScanner = mod.default ?? mod;
  } catch {
    cachedScanner = null;
  }

  return cachedScanner;
}

export function isDocumentScannerAvailable(): boolean {
  return isDocumentScannerNativeLinked();
}

export async function scanReceiptDocument(): Promise<string | null> {
  const DocumentScanner = loadDocumentScanner();
  if (!DocumentScanner) return null;

  try {
    const result = await DocumentScanner.scanDocument({
      maxNumDocuments: 1,
      croppedImageQuality: 95,
    });

    if (result.status === "cancel") return null;
    return result.scannedImages?.[0] ?? null;
  } catch {
    return null;
  }
}
