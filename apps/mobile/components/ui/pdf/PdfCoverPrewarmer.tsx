import React, {
  FC,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { View, StyleSheet, InteractionManager, Platform } from "react-native";
import Pdf from "react-native-pdf";
import { captureRef } from "react-native-view-shot";
import * as FileSystem from "expo-file-system/legacy";

import { ensureCoversDir, getCoverPathForPdfUri } from "@/hooks/pdfCoverCache";

type Props = {
  pdfUris: string[]; // file:// URIs
  enabled?: boolean; // default true
  maxToProcess?: number; // default 12 (enough for first screen)
  onProgress?: (done: number, total: number) => void;
};

const inFlight = new Set<string>();

export const PdfCoverPrewarmer: FC<Props> = ({
  pdfUris,
  enabled = true,
  maxToProcess = 12,
  onProgress,
}) => {
  const [queue, setQueue] = useState<string[]>([]);
  const [active, setActive] = useState<string | null>(null);

  const wrapRef = useRef<View | null>(null);
  const cancelledRef = useRef(false);

  // prepare queue: only file:// URIs and those not in cache
  useEffect(() => {
    cancelledRef.current = false;

    if (!enabled) {
      setQueue([]);
      setActive(null);
      return;
    }

    const task = InteractionManager.runAfterInteractions(async () => {
      try {
        await ensureCoversDir();

        const unique = Array.from(new Set(pdfUris)).filter(
          (u) => typeof u === "string" && u.startsWith("file://")
        );

        const picked: string[] = [];
        for (const uri of unique) {
          if (picked.length >= maxToProcess) break;
          const dest = getCoverPathForPdfUri(uri);
          const info = await FileSystem.getInfoAsync(dest);
          if (!info.exists) picked.push(uri);
        }

        if (!cancelledRef.current) {
          setQueue(picked);
          setActive((prev) => prev ?? picked[0] ?? null);
          onProgress?.(0, picked.length);
        }
      } catch (e) {
        // silently skip on error
        console.warn("PdfCoverPrewarmer: failed to prepare cover queue", e);
        if (!cancelledRef.current) {
          setQueue([]);
          setActive(null);
        }
      }
    });

    return () => {
      cancelledRef.current = true;
      task.cancel?.();
    };
  }, [pdfUris, enabled, maxToProcess, onProgress]);

  const total = queue.length;
  const done = useMemo(() => {
    if (!total) return 0;
    const idx = active ? queue.indexOf(active) : total;
    return Math.max(0, idx);
  }, [queue, active, total]);

  // move to next element in queue
  const advance = useCallback(() => {
    setActive((cur) => {
      if (!cur) return null;
      const idx = queue.indexOf(cur);
      const next = idx >= 0 ? queue[idx + 1] : null;
      return next ?? null;
    });
  }, [queue]);

  // capture and write to cache
  const captureAndSave = useCallback(async (pdfUri: string) => {
    if (cancelledRef.current) return;

    if (inFlight.has(pdfUri)) return;
    inFlight.add(pdfUri);

    try {
      const dest = getCoverPathForPdfUri(pdfUri);

      // check again to prevent race condition
      const info = await FileSystem.getInfoAsync(dest);
      if (info.exists) return;

      // wait 2 frames for render to settle
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
      await new Promise<void>((r) => requestAnimationFrame(() => r()));

      if (!wrapRef.current) return;

      const tmpUri = await captureRef(wrapRef as React.RefObject<View>, {
        format: "jpg",
        quality: 0.82,
        result: "tmpfile",
      });

      if (!tmpUri) return;

      await FileSystem.copyAsync({ from: tmpUri, to: dest }).catch(async (copyErr) => {
        console.warn("PdfCoverPrewarmer: copyAsync failed, trying moveAsync", copyErr);
        await FileSystem.moveAsync({ from: tmpUri, to: dest }).catch((moveErr) => {
          console.error("PdfCoverPrewarmer: moveAsync also failed", moveErr);
        });
      });
    } finally {
      inFlight.delete(pdfUri);
    }
  }, []);

  const onLoadComplete = useCallback(async () => {
    if (!active) return;
    try {
      await captureAndSave(active);
    } catch (error) {
      console.error("PdfCoverPrewarmer: failed to capture and save PDF cover", error);
    }
    onProgress?.(Math.min(done + 1, total), total);
    advance();
  }, [active, captureAndSave, advance, done, total, onProgress]);

  if (!enabled || !active) return null;

  /**
   * ✅ Önemli:
   * - opacity: 0 yapma (bazı cihazlarda render olmaz -> boş capture)
   * - ekran dışına al ama ölçü ver
   */
  return (
    <View style={styles.host} pointerEvents="none">
      <View ref={wrapRef} collapsable={false} style={styles.captureBox}>
        <Pdf
          source={{ uri: active, cache: true }}
          page={1}
          scale={1}
          minScale={1}
          maxScale={1}
          enablePaging
          horizontal={false}
          fitPolicy={2}
          onLoadComplete={() => onLoadComplete()}
          onError={(error) => {
            // if error, move to next item
            console.warn("PdfCoverPrewarmer: PDF load error", error);
            onProgress?.(Math.min(done + 1, total), total);
            advance();
          }}
          style={styles.pdf}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: -9999,
    top: -9999,
    width: 10,
    height: 10,
  },
  captureBox: {
    width: 360,
    height: 520,
    // opacity is intentionally not 0 (some devices won't render with opacity: 0)
    opacity: Platform.OS === "android" ? 0.03 : 0.01,
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  pdf: { width: "100%", height: "100%" },
});
