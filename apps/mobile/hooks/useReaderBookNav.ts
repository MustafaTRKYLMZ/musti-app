import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";

import { listLocalPdfs, type LocalPdfFile } from "@/utils/getPdfsDirectory";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";

export type ReaderBookNavItem = {
  uri: string;
  name: string;
  lastOpened: number;
};

type Options = {
  activeUri?: string | null;
  sort?: "recent" | "alpha";
  limit?: number;
  enabled?: boolean;
};

export function useReaderBookNav({
  activeUri = null,
  sort = "recent",
  limit = 30,
  enabled = true,
}: Options) {
  const router = useRouter();
  const progressMap = useBooksStore((s) => s.items);

  const [books, setBooks] = useState<LocalPdfFile[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const all = await listLocalPdfs();
      setBooks(all);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void load();
  }, [load]);

  const items: ReaderBookNavItem[] = useMemo(() => {
    const arr = books.map((b) => {
      const meta: any = progressMap[b.uri];
      const updatedAt = Number(meta?.updatedAt ?? 0) || 0;
      return { uri: b.uri, name: b.name, lastOpened: updatedAt };
    });

    if (sort === "alpha") {
      arr.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      // recent
      arr.sort((a, b) => (b.lastOpened ?? 0) - (a.lastOpened ?? 0));
    }

    // aktif kitabı görünür kılmak için: listede yoksa en başa ekle
    if (activeUri) {
      const idx = arr.findIndex((x) => x.uri === activeUri);
      if (idx > 0) {
        const [it] = arr.splice(idx, 1);
        arr.unshift(it);
      }
    }

    return arr.slice(0, Math.max(0, limit));
  }, [books, progressMap, sort, limit, activeUri]);

  const openBook = useCallback(
    (it: ReaderBookNavItem) => {
      router.replace({
        pathname: "/(tabs)/bookshelf/pdf/viewer",
        params: {
          uri: encodeURIComponent(it.uri),
          name: encodeURIComponent(it.name),
        },
      } as any);
    },
    [router]
  );

  return {
    items,
    loading,
    reload: load,
    openBook,
  };
}
