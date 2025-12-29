import { useMemo } from "react";

type BookPick = { uri: string; name: string };


export function useAvailableBooksForTarget(
  target: any | null,
  progressItems: any
): BookPick[] {
  return useMemo(() => {
    const map = new Map<string, BookPick>();

    for (const it of target?.items ?? []) {
      if (!it?.bookUri) continue;
      map.set(it.bookUri, { uri: it.bookUri, name: it.bookName ?? "" });
    }

    for (const uri of Object.keys(progressItems ?? {})) {
      const p = (progressItems as any)[uri];
      if (!p?.uri) continue;

      map.set(p.uri, {
        uri: p.uri,
        name: p.name ?? map.get(p.uri)?.name ?? "",
      });
    }

    return Array.from(map.values())
      .filter((b) => !!b.uri && !!b.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [target?.items, progressItems]);
}
