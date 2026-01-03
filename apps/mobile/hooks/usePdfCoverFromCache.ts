// apps/mobile/hooks/usePdfCoverFromCache.ts
import { useEffect, useMemo, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";
import { getCoverPathForPdfUri, ensureCoversDir } from "./pdfCoverCache";

type Result = { coverUri: string | null; ready: boolean };

export function usePdfCoverFromCache(pdfUri?: string | null): Result {
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setReady(false);
      setCoverUri(null);

      if (!pdfUri) {
        setReady(true);
        return;
      }

      try {
        await ensureCoversDir();
        const dest = getCoverPathForPdfUri(pdfUri);

        const info = await FileSystem.getInfoAsync(dest);

        if (!cancelled) setCoverUri(info.exists ? dest : null);
      } catch (e) {
        console.error("usePdfCoverFromCache error:", e);
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
