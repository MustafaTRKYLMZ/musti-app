import { useEffect, useState } from "react";
import { listLocalPdfs, type LocalPdfFile } from "@/utils/getPdfsDirectory";

export function useLocalBooks() {
  const [books, setBooks] = useState<LocalPdfFile[]>([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const all = await listLocalPdfs();
        if (mounted) setBooks(all);
      } catch {
        if (mounted) setBooks([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { books };
}
