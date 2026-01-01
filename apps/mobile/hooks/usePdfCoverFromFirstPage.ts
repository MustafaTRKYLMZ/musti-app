// apps/mobile/hooks/usePdfCoverFromFirstPage.ts
import { useEffect, useMemo, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import PdfThumbnail from "react-native-pdf-thumbnail";

function safeKey(input: string) {
  return input.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 120) || "pdf";
}

type Result = {
  coverUri: string | null;
  ready: boolean;
};

function toAbsolutePath(fileUri: string) {
  // "file:///data/user/0/..." -> "/data/user/0/..."
  return fileUri.startsWith("file://") ? fileUri.replace("file://", "") : fileUri;
}

async function fileExists(uri: string) {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return !!info.exists;
  } catch {
    return false;
  }
}

async function tryGenerate(pdfFileUri: string) {
  // bazı cihazlarda decode gerekiyor
  const decoded = decodeURI(pdfFileUri);
  // 1) file:// ile dene
  try {
    const r1: any = await (PdfThumbnail as any).generate(decoded, 1);
    if (r1?.uri) return String(r1.uri);
  } catch {}

  // 2) absolute path ile dene (Android fix)
  try {
    const abs = toAbsolutePath(decoded);
    console.log("absolute path:", abs);
    const r2: any = await (PdfThumbnail as any).generate(abs, 1);
    console.log("thumbnail result:", r2);
    if (r2?.uri) return String(r2.uri);
  } catch(e) {console.log("error generating thumbnail:", e);}

  return null;
}

export function usePdfCoverFromFirstPage(pdfUri?: string | null): Result {
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;

    async function run() {
      setReady(false);
      setCoverUri(null);

      if (!pdfUri || typeof pdfUri !== "string") {
        setReady(true);
        return;
      }

      if (!pdfUri.startsWith("file://")) {
        setReady(true);
        return;
      }

      const exists = await fileExists(pdfUri);

      if (!exists) {
        if (!cancelled) setReady(true);
        return;
      }

      const dir =
        (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? "") +
        "pdf_covers/";

      const key = safeKey(pdfUri);
      const dest = dir + key + "_p1.jpg";


      try {
        await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch((e) => {console.log("mkdir error:", e);});

        const info = await FileSystem.getInfoAsync(dest);

        if (info.exists) {
          if (!cancelled) setCoverUri(dest);
          if (!cancelled) setReady(true);
          return;
        }

        const tmpUri = await tryGenerate(pdfUri);
console.log("generated tmpUri:", tmpUri);
        if (tmpUri) {
          // tmpUri bazen "file://", bazen absolute gelebilir
          const tmpFileUri = tmpUri.startsWith("file://") ? tmpUri : `file://${tmpUri}`;

          // bazı durumlarda copy fail, move succeed
          await FileSystem.copyAsync({ from: tmpFileUri, to: dest }).catch(async () => {
            await FileSystem.moveAsync({ from: tmpFileUri, to: dest }).catch(() => {});
          });

          if (!cancelled) setCoverUri(dest);
        } else {
          if (!cancelled) setCoverUri(null);
        }
      } catch (e) {
        
        console.log("[cover] failed:", e);
        if (!cancelled) setCoverUri(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [pdfUri]);

  return useMemo(() => ({ coverUri, ready }), [coverUri, ready]);
}
