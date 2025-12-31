import { Router } from "express";
import multer from "multer";
import * as pdfParseModule from "pdf-parse";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 60 * 1024 * 1024 },
});

type PdfParseFn = (data: Buffer, options?: any) => Promise<{ text: string }>;

function getPdfParseFn(): PdfParseFn {
  const m: any = pdfParseModule as any;

  if (typeof m === "function") return m as PdfParseFn;
  if (typeof m?.default === "function") return m.default as PdfParseFn;

  const cjs =
    m && typeof m === "object" && "pdfParse" in m ? (m as any).pdfParse : undefined;
  if (typeof cjs === "function") return cjs as PdfParseFn;

  throw new Error("pdf-parse export is not callable");
}

const pdfParse = getPdfParseFn();

function normalizeText(input: string) {
  let out = String(input || "")
    .replace(/\u00AD/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{4,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  for (let i = 0; i < 8; i++) {
    const next = out.replace(/([\u0600-\u06FF])\s+([\u0600-\u06FF])/g, "$1$2");
    if (next === out) break;
    out = next;
  }

  out = out.replace(/[ \t]+/g, " ");

  return out.trim();
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

router.post("/convert", upload.single("file"), async (req, res) => {
  try {
    if (!req.file?.buffer) {
      res.status(400).json({ error: "Missing file" });
      return;
    }

    const title = String(req.body?.title || "Untitled").trim() || "Untitled";
    const id = String(req.body?.id || uid());

    const parsed = await pdfParse(req.file.buffer, {
      pagerender: (pageData: any) =>
        pageData
          .getTextContent({
            normalizeWhitespace: false,
            disableCombineTextItems: false,
          })
          .then((tc: any) => {
            const items = (tc.items || [])
              .map((it: any) => {
                const t = it.transform || [];
                const x = Number(t[4] ?? 0);
                const y = Number(t[5] ?? 0);
                const w = Number(it.width ?? 0);
                const s = String(it.str ?? "");
                return { s, x, y, w };
              })
              .filter((it: any) => it.s !== undefined && it.s !== null);

            items.sort((a: any, b: any) => {
              if (a.y === b.y) return a.x - b.x;
              return b.y - a.y;
            });

            const yTol = 4.0;

            const lines: any[] = [];
            for (const it of items) {
              const lastLine = lines[lines.length - 1] as any[] | undefined;

              if (!lastLine) {
                const first: any = [{ s: it.s, x: it.x, w: it.w }];
                first._y = it.y;
                lines.push(first);
                continue;
              }

              const baseY = Number((lastLine as any)._y ?? it.y);

              if (Math.abs(it.y - baseY) <= yTol) {
                lastLine.push({ s: it.s, x: it.x, w: it.w });
              } else {
                const next: any = [{ s: it.s, x: it.x, w: it.w }];
                next._y = it.y;
                lines.push(next);
              }
            }

            const outLines = lines.map((line: any[]) => {
              line.sort((a, b) => a.x - b.x);

              const widths = line.map((it) => Number(it.w || 0)).filter((n) => n > 0);
              const avgW =
                widths.length > 0
                  ? widths.reduce((acc, n) => acc + n, 0) / widths.length
                  : 8;

              const spaceTol = Math.max(2.0, avgW * 0.18);

              let out = "";
              let lastEndX = Number.NEGATIVE_INFINITY;

              for (const it of line) {
                const gap = it.x - lastEndX;
                if (out && gap > spaceTol) out += " ";
                out += it.s;
                lastEndX = it.x + (it.w || 0);
              }

              return out.trim();
            });

            return outLines.filter(Boolean).join("\n");
          }),
    });

    const fullText = normalizeText(parsed.text);

    res.json({
      id,
      title,
      sourcePdfUri: null,
      createdAt: Date.now(),
      pages: [
        {
          page: 1,
          text: fullText,
          lines: fullText
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean),
        },
      ],
      fullText,
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: e?.message ?? "Convert failed" });
  }
});

export default router;
