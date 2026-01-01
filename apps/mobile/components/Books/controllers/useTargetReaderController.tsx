import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import dayjs from "dayjs";
import type { PdfRef } from "react-native-pdf";

import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { scheduleMotivationNudgeIfNeeded } from "@/utils/motivation";
import { useToast } from "@/components/ui/ToastProvider";

import type { ReaderShellProps } from "@/components/Books/ReaderShell";
import { clampInt } from "@/utils/number";

export function useTargetReaderController(): ReaderShellProps {
  const router = useRouter();
  const { showToast } = useToast();

  const params = useLocalSearchParams<{
    targetId?: string;
    uri?: string;
    name?: string;
    jumpPage?: string; // ✅ added
  }>();

  const targetId = params.targetId ? String(params.targetId) : undefined;
  const uri = params.uri ? decodeURIComponent(String(params.uri)) : undefined;

  const routeName = params.name
    ? decodeURIComponent(String(params.name))
    : undefined;

  // ✅ jumpPage from route (TargetCard/TargetList)
  const jumpPageParam = useMemo(() => {
    if (params.jumpPage == null) return null;
    const n = clampInt(params.jumpPage);
    return n > 0 ? n : null;
  }, [params.jumpPage]);

  const today = dayjs().format("YYYY-MM-DD");

  const targets = useReadingTargetsStore((s) => s.targets);
  const hydrated = useReadingTargetsStore((s) => s.hydrated);
  const hydrateTargets = useReadingTargetsStore((s) => s.hydrate);
  const setItemCursor = useReadingTargetsStore((s) => s.setItemCursor);
  const markItemDone = useReadingTargetsStore((s) => s.markItemDone);

  useEffect(() => {
    if (!hydrated) hydrateTargets();
  }, [hydrated, hydrateTargets]);

  const target = useMemo(() => {
    if (!targetId) return null;
    return (targets ?? []).find((t) => t.id === targetId) ?? null;
  }, [targets, targetId]);

  const activeItem = useMemo(() => {
    const items = target?.items ?? [];
    return items.find((it) => it.status === "active") ?? null;
  }, [target]);

  const bookUri = uri ?? activeItem?.bookUri ?? null;

  const effectiveName =
    routeName ??
    (activeItem?.bookName ? String(activeItem.bookName) : undefined) ??
    "PDF";

  const pdfRef = useRef<PdfRef | null>(null);

  const [initialPage, setInitialPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  const doneOnceRef = useRef(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleClose = useCallback(() => {
    void scheduleMotivationNudgeIfNeeded().catch((error) => {
      console.error(
        "Failed to schedule motivation nudge on target close:",
        error
      );
    });
    router.replace("/(tabs)/bookshelf");
  }, [router]);

  // auto-close when all done, but not while advancing
  useEffect(() => {
    if (!hydrated) return;
    if (!target) return;
    if (!targetId) return;
    if (isClosing) return;
    if (isAdvancing) return;

    const items = target.items ?? [];
    const hasActive = items.some((it) => it.status === "active");
    const allDone =
      items.length > 0 && items.every((it) => it.status === "done");

    if (!hasActive && allDone) {
      setIsClosing(true);
      handleClose();
    }
  }, [hydrated, target, targetId, isClosing, isAdvancing, handleClose]);

  useEffect(() => {
    doneOnceRef.current = false;

    const fallbackStart = Math.max(
      1,
      Number(activeItem?.cursorPage ?? activeItem?.jumpPage ?? 1)
    );

    const start = Math.max(1, Number(jumpPageParam ?? fallbackStart));

    setInitialPage(start);
    setCurrentPage(start);

    // ✅ if opened with jumpPage, sync cursor immediately
    if (targetId && activeItem?.id && jumpPageParam) {
      void setItemCursor(targetId, activeItem.id, start).catch(() => {});
    }

    setIsAdvancing((prev) => (prev ? false : prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeItem?.id, jumpPageParam]);

  const guard: ReaderShellProps["guard"] = (() => {
    if (!targetId) return { kind: "message", text: "Invalid targetId" };
    if (!hydrated) return { kind: "message", text: "Loading…" };
    if (!target) return { kind: "message", text: "Target not found." };
    if (isClosing) return { kind: "message", text: "Done." };
    if (isAdvancing) return { kind: "message", text: "Loading…" };
    if (!activeItem || !bookUri) return { kind: "message", text: "Loading…" };
    return { kind: "ok" };
  })();

  const source = { uri: bookUri ?? "", cache: true };

  const startPage = Math.max(
    1,
    Number(activeItem?.activeFromPage ?? activeItem?.startPage ?? 1)
  );
  const endPage = Math.max(startPage, Number(activeItem?.endPage ?? startPage));

  const remainingPages =
    typeof currentPage === "number"
      ? Math.max(0, endPage - currentPage)
      : Math.max(0, endPage - (activeItem?.cursorPage ?? startPage));

  const onLoadComplete = (pages: number) => {
    setTotalPages(pages);
  };

  const goToNextActiveItemInTarget = () => {
    if (!targetId) return;
    setIsAdvancing(true);

    router.replace({
      pathname: "/(tabs)/bookshelf/target/target-viewer",
      params: {
        targetId,
      },
    });
  };

  const onPageChanged = (page: number, _total: number) => {
    setCurrentPage(page);
    console.log("onPageChanged:", { page, _total });
    if (!targetId || !activeItem) return;

    const clamped = Math.max(startPage, Math.min(endPage, page));
    void setItemCursor(targetId, activeItem.id, clamped).catch(() => {});

    if (!doneOnceRef.current && clamped >= endPage) {
      doneOnceRef.current = true;

      // ✅ mark done (store handles repeat + rewards)
      void markItemDone(targetId, activeItem.id).catch(() => {});

      // ✅ toast (NO XP calculation here to avoid double-award)
      showToast({
        title: "Target completed 🎯",
        message: "Nice work!",
        duration: 2500,
      });

      void scheduleMotivationNudgeIfNeeded().catch(() => {});
      goToNextActiveItemInTarget();
    }
  };

  const onClose = handleClose;

  return {
    guard,
    source,
    name: effectiveName,
    initialPage,
    currentPage,
    totalPages: totalPages ?? undefined,
    onLoadComplete,
    onPageChanged,
    onClose,
    readingContext: {
      mode: "target",
      date: today,
      bookUri: bookUri ?? undefined,
      targetId,
      sectionId: activeItem?.id,
      sectionTitle: activeItem?.label ?? activeItem?.bookName,
    },
    timeLeftRemainingPages: remainingPages,
    bookUriForSidebar: bookUri ?? "",
    initialSectionsOpen: false,
    banner: null,
    pdfRef,
  };
}
