import { useMemo } from "react";
import type { ReaderShellProps } from "@/components/Books/ReaderShell";
import { useCachedPdfUri } from "@/hooks/useCachedPdfUri";

type Args = {
  uri?: string | null;
  invalidText?: string;   
  preparingText?: string; 
  failedText?: string;   
};

export function usePdfSource({
  uri,
  invalidText = "Invalid PDF path",
  preparingText = "Preparing PDF…",
  failedText = "Failed to load PDF.",
}: Args): {
  guard: ReaderShellProps["guard"];
  source: { uri: string; cache: true };
  cachedUri: string | null;
  ready: boolean;
} {
  const { cachedUri, ready } = useCachedPdfUri(uri ?? undefined);

  const guard: ReaderShellProps["guard"] = !uri
    ? { kind: "message", text: invalidText }
    : !ready
    ? { kind: "message", text: preparingText }
    : !cachedUri
    ? { kind: "message", text: failedText }
    : { kind: "ok" };

  const source = useMemo(
    () => ({ uri: cachedUri ?? "", cache: true as const }),
    [cachedUri]
  );

  return { guard, source, cachedUri, ready };
}
