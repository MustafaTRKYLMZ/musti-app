import * as FileSystem from "expo-file-system/legacy";
import { decode as atob } from "base-64";

export type TextBook = {
  id: string;
  title: string;
  sourcePdfUri: string;
  createdAt: number;
  pages: Array<{
    page: number;
    text: string;
    lines: string[];
  }>;
  fullText: string;
};

function normalizeText(input: string) {
  return input
    .replace(/\u00AD/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function base64ToUint8Array(base64: string) {
  const bin = atob(base64);
  const len = bin.length;
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function loadPdfJs() {
  const pdfjsLib: any = await import("pdfjs-dist/legacy/build/pdf.js");
  if (pdfjsLib?.GlobalWorkerOptions) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = undefined;
  }
  return pdfjsLib;
}

export async function pdfUriToTextBook(opts: {
  pdfUri: string;
  title: string;
  id: string;
}): Promise<TextBook> {
  const { pdfUri, title, id } = opts;

  const base64 = await FileSystem.readAsStringAsync(pdfUri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const data = base64ToUint8Array(base64);

  const pdfjsLib = await loadPdfJs();

  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;

  const pages: TextBook["pages"] = [];
  const fullTextParts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();

    const strings = (content.items as any[])
      .map((it) => (typeof it?.str === "string" ? it.str : ""))
      .filter((s) => s && String(s).trim().length > 0);

    const joined = normalizeText(strings.join(" "));
    const lines = joined
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    pages.push({ page: pageNumber, text: joined, lines });
    fullTextParts.push(joined);
  }

  const fullText = normalizeText(fullTextParts.join("\n\n"));

  return {
    id,
    title,
    sourcePdfUri: pdfUri,
    createdAt: Date.now(),
    pages,
    fullText,
  };
}
