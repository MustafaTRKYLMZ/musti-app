import {
  mergeManyReceiptTexts,
  pickBestOcrText,
  reconstructReceiptTextFromBlocks,
  type ReceiptTextBlock,
} from "@musti/core";
import type { ReceiptCaptureMeta } from "./receiptCapture";
import { buildReceiptImageVariants } from "./preprocessReceiptImage";

export class ReceiptOcrUnavailableError extends Error {
  constructor(message = "Receipt OCR is not available on this device.") {
    super(message);
    this.name = "ReceiptOcrUnavailableError";
  }
}

type TextRecognitionResult = {
  text?: string;
  blocks?: ReceiptTextBlock[];
};

type TextRecognitionModule = {
  recognize: (uri: string, script?: string) => Promise<TextRecognitionResult>;
  TextRecognitionScript?: { LATIN: string };
};

function loadTextRecognition(): TextRecognitionModule {
  try {
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

async function recognizeVariant(
  TextRecognition: TextRecognitionModule,
  uri: string
): Promise<string> {
  const script = TextRecognition.TextRecognitionScript?.LATIN;
  const result = await TextRecognition.recognize(uri, script);
  const plain = cleanupOcrText(result.text ?? "");
  const blockText =
    result.blocks && result.blocks.length > 0
      ? cleanupOcrText(reconstructReceiptTextFromBlocks(result.blocks))
      : "";

  const candidates = [plain, blockText].filter(Boolean);
  return pickBestOcrText(candidates);
}

export async function recognizeReceiptImage(
  uri: string,
  meta?: ReceiptCaptureMeta | null
): Promise<string> {
  const TextRecognition = loadTextRecognition();
  const variants = await buildReceiptImageVariants(uri, meta);

  const texts: string[] = [];
  for (const variant of variants) {
    texts.push(await recognizeVariant(TextRecognition, variant.uri));
  }

  return pickBestOcrText(texts);
}

export async function recognizeReceiptImages(
  uris: string[],
  metas?: Array<ReceiptCaptureMeta | null | undefined>
): Promise<string> {
  if (uris.length === 0) return "";

  const texts: string[] = [];
  for (let i = 0; i < uris.length; i += 1) {
    texts.push(await recognizeReceiptImage(uris[i], metas?.[i]));
  }

  if (texts.length === 1) return texts[0];
  return mergeManyReceiptTexts(texts);
}
