import { useEffect, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import type { PdfRef } from "react-native-pdf";

import { useBooksStore } from "@/store/bookshelf/useBooksStore";
import type { ReaderShellProps } from "@/components/Books/ReaderShell";

export function useNormalReaderController(): ReaderShellProps {
  const router = useRouter();

  const params = useLocalSearchParams<{
    uri?: string;
    name?: string;
    openSections?: string;
    jumpPage?: string;
    returnTo?: string;
    returnBookUri?: string;
  }>();

  const returnTo = params.returnTo as string | undefined;
  const returnBookUri = params.returnBookUri
    ? decodeURIComponent(params.returnBookUri)
    : undefined;

  const uri = params.uri ? decodeURIComponent(params.uri) : undefined;
  const name = params.name ? decodeURIComponent(params.name) : "PDF";

  const shouldOpenSections = params.openSections === "1";
  const jumpPageParam = params.jumpPage ? Number(params.jumpPage) : null;
  const jumpPage = Number.isFinite(jumpPageParam as number)
    ? (jumpPageParam as number)
    : null;

  const today = dayjs().format("YYYY-MM-DD");

  const pdfRef = useRef<PdfRef | null>(null);

  const progressMap = useBooksStore((s) => s.items);
  const setProgress = useBooksStore((s) => s.setProgress);
  const currentProgress = uri ? progressMap[uri] : undefined;

  const [initialPage, setInitialPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const openedSectionsOnceRef = useRef(false);
  const appliedJumpOnceRef = useRef(false);

  useEffect(() => {
    if (!uri) return;

    const last =
      currentProgress?.lastPage && currentProgress.lastPage > 0
        ? currentProgress.lastPage
        : 1;

    setInitialPage(last);
    setCurrentPage(last);
  }, [uri, currentProgress]);

  const guard: ReaderShellProps["guard"] = !uri
    ? { kind: "message", text: "Invalid PDF path" }
    : { kind: "ok" };

  const source = { uri: uri ?? "", cache: true };

  const onLoadComplete = (pages: number) => {
    setTotalPages(pages);

    if (uri) {
      setProgress({
        uri,
        name,
        lastPage: currentProgress?.lastPage ?? 1,
        totalPages: pages,
      });
    }

    if (jumpPage && !appliedJumpOnceRef.current) {
      appliedJumpOnceRef.current = true;
      const safe = Math.max(1, Math.min(pages, jumpPage));
      setTimeout(() => {
        pdfRef.current?.setPage(safe);
      }, 0);
    }
  };

  const onPageChanged = (page: number, total: number) => {
    setCurrentPage(page);
    setTotalPages(total);
  };

  const onClose = () => {
    if (uri) {
      setProgress({
        uri,
        name,
        lastPage: currentPage ?? 1,
        totalPages: totalPages ?? currentProgress?.totalPages ?? undefined,
      });
    }

    if (returnTo === "createTarget") {
      router.replace({
        pathname: "/(tabs)/bookshelf",
        params: {
          openCreateTarget: "1",
          targetBookUri: returnBookUri ? encodeURIComponent(returnBookUri) : "",
        },
      });
      return;
    }

    router.replace("/(tabs)/bookshelf");
  };

  // initialSectionsOpen: only once per open
  let initialSectionsOpen = false;
  if (shouldOpenSections && !openedSectionsOnceRef.current) {
    openedSectionsOnceRef.current = true;
    initialSectionsOpen = true;
  }

  return {
    guard,
    source,
    name,
    initialPage,
    currentPage,
    totalPages: totalPages ?? undefined,
    onLoadComplete,
    onPageChanged,
    onClose,
    readingContext: { mode: "normal", date: today, bookUri: uri },
    timeLeftRemainingPages: null,
    bookUriForSidebar: uri ?? "",
    initialSectionsOpen,
    banner: null,
    pdfRef,
  };
}
