import { mergeReceiptTexts } from "@musti/core";

export class ReceiptOcrUnavailableError extends Error {
  constructor(message = "Receipt OCR is not available on this device.") {
    super(message);
    this.name = "ReceiptOcrUnavailableError";
  }
}

type TextRecognitionModule = {
  recognize: (uri: string) => Promise<{ text?: string }>;
};

function loadTextRecognition(): TextRecognitionModule {
  try {
    // Native module — requires dev client rebuild after install.
    const mod = require("@react-native-ml-kit/text-recognition");
    return mod.default ?? mod;
  } catch {
    throw new ReceiptOcrUnavailableError();
  }
}

/** Light OCR cleanup before parser heuristics (full normalize runs in core). */
function cleanupOcrText(raw: string): string {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[|]/g, "I")
    .replace(/([A-Za-z])0(\d[.,]\d{2}\b)/g, "$1O$2")
    .replace(
      /(?:^|\n)\s*(?:\d+[ \t]+)?[Cc][Oo][ \t]+(\d+[.,]\d{2})\s*(?=\n|$)/gm,
      "\n€ $1"
    )
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function recognizeReceiptImage(uri: string): Promise<string> {
  const TextRecognition = loadTextRecognition();
  const result = await TextRecognition.recognize(uri);
  return cleanupOcrText(result.text ?? "");
}

export async function recognizeReceiptImages(uris: string[]): Promise<string> {
  if (uris.length === 0) return "";

  const texts: string[] = [];
  for (const uri of uris) {
    texts.push(await recognizeReceiptImage(uri));
  }

  if (texts.length === 1) return texts[0];
  return mergeReceiptTexts(texts[0], texts[1]);
}
