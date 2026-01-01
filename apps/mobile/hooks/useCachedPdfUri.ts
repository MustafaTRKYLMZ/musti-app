// apps/mobile/hooks/useCachedPdfUri.ts
import { useEffect, useMemo, useState } from "react";
import * as FileSystem from "expo-file-system/legacy";

// tiny stable hash (fast, good enough for filenames)
function hashString(input: string) {
  let h = 2166136261; // FNV-1a seed
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

function safeStem(input: string) {
  const base = input.replace(/[^a-zA-Z0-9]/g, "_");
  return (base.slice(0, 40) || "pdf").toLowerCase();
}

export function useCachedPdfUri(uri?: string) {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      setReady(false);
      setCachedUri(null);

      if (!uri) {
        setReady(true);
        return;
      }

      // Already a file path → best case
      if (uri.startsWith("file://")) {
        setCachedUri(uri);
        setReady(true);
        return;
      }

      const baseDir =
        FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? null;

      // No base dir? fallback
      if (!baseDir) {
        setCachedUri(uri);
        setReady(true);
        return;
      }

      // Put PDFs into a subfolder to avoid polluting cache root
      const folder = baseDir.endsWith("/") ? `${baseDir}pdf-cache/` : `${baseDir}/pdf-cache/`;

      try {
        // ensure dir exists
        const dirInfo = await FileSystem.getInfoAsync(folder);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(folder, { intermediates: true });
        }
      } catch {
        // if can't create folder, fallback
        setCachedUri(uri);
        setReady(true);
        return;
      }

      const fileName = `${safeStem(uri)}_${hashString(uri)}.pdf`;
      const dest = folder + fileName;

      try {
        const info = await FileSystem.getInfoAsync(dest);
        if (!cancelled && info.exists) {
          setCachedUri(dest);
          setReady(true);
          return;
        }

        // remote URL
        if (uri.startsWith("http://") || uri.startsWith("https://")) {
          const dl = await FileSystem.downloadAsync(uri, dest);
          if (!cancelled) setCachedUri(dl.uri);
          if (!cancelled) setReady(true);
          return;
        }

        await FileSystem.copyAsync({ from: uri, to: dest });

        if (!cancelled) setCachedUri(dest);
      } catch (e) {
        if (!cancelled) setCachedUri(uri);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return useMemo(() => ({ cachedUri, ready }), [cachedUri, ready]);
}
