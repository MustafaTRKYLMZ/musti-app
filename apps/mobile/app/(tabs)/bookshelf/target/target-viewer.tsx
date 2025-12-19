import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { View, StyleSheet, Animated } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { MText, spacing, radii, iconSizes, useTheme } from "@budget/ui-native";
import { PdfRef } from "react-native-pdf";

import { PdfReader } from "@/components/ui/pdf/PdfReader";
import { IconButton } from "@/components/ui/AppIcon";
import { BookSectionsSidebar } from "@/components/Books/BookSectionsSidebar";

import {
  useReadingTargetsStore,
  type ReadingTarget,
  type TargetItem,
} from "@/store/bookshelf/useReadingTargetsStore";

/* ---------------- Toast (no external lib) ---------------- */

type ToastState = { visible: boolean; text: string };

function Toast({
  visible,
  text,
  colors,
}: {
  visible: boolean;
  text: string;
  colors: any;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 140,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  return (
    <View style={styles.toastWrap} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: colors.surface,
            borderColor: colors.borderSubtle,
            opacity: anim,
            transform: [
              {
                translateY: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [18, 0],
                }),
              },
              {
                scale: anim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.98, 1],
                }),
              },
            ],
          },
        ]}
      >
        <MText variant="body" color="textPrimary" numberOfLines={2}>
          {text}
        </MText>
      </Animated.View>
    </View>
  );
}

/* ---------------- Helpers ---------------- */

function pickActiveItem(t: ReadingTarget | null): TargetItem | null {
  if (!t?.items?.length) return null;
  return t.items.find((it) => it.status === "active") ?? null;
}

function findItemById(t: ReadingTarget | null, itemId: string | null) {
  if (!t || !itemId) return null;
  return t.items.find((x) => x.id === itemId) ?? null;
}

export default function TargetViewerScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const params = useLocalSearchParams<{ targetId?: string }>();
  const targetId = params.targetId ? String(params.targetId) : undefined;

  const hydrate = useReadingTargetsStore((s) => s.hydrate);
  const hydrated = useReadingTargetsStore((s) => s.hydrated);
  const targets = useReadingTargetsStore((s) => s.targets);
  const markItemDone = useReadingTargetsStore((s) => s.markItemDone);

  const target = useMemo(() => {
    if (!targetId) return null;
    return targets.find((t) => t.id === targetId) ?? null;
  }, [targets, targetId]);

  const displayItem = useMemo(() => pickActiveItem(target), [target]);

  const uri = displayItem?.bookUri;
  const name = displayItem?.bookName ?? "PDF";

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const pdfRef = useRef<PdfRef | null>(null);

  const [initialPage, setInitialPage] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<ToastState>({ visible: false, text: "" });
  const toastTimerRef = useRef<any>(null);

  const showToast = useCallback((text: string, durationMs = 1200) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    setToast({ visible: true, text });

    toastTimerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, durationMs);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // prevent duplicate done
  const doneOnceRef = useRef<string | null>(null);

  // for “completed -> continuing”
  const lastCompletedItemIdRef = useRef<string | null>(null);

  // hydrate
  useEffect(() => {
    if (!hydrated) hydrate();
  }, [hydrated, hydrate]);

  // When active item changes => set initial page
  useEffect(() => {
    if (!displayItem) return;

    const baseline =
      displayItem.activeFromPage ??
      displayItem.jumpPage ??
      displayItem.startPage ??
      1;

    const start = Math.max(1, Math.floor(baseline));
    setInitialPage(start);
    setCurrentPage(start);
    setTotalPages(null);

    doneOnceRef.current = null;
  }, [displayItem?.id]);

  // After marking an item done, store should switch to next item OR target becomes done.
  useEffect(() => {
    if (!targetId || !target) return;

    const completedId = lastCompletedItemIdRef.current;
    if (!completedId) return;

    // wait until active item changed away from completed
    if (displayItem?.id === completedId) return;

    const completed = findItemById(target, completedId);

    // Next item exists
    if (displayItem) {
      const a = completed?.bookName ?? "Item";
      const b = displayItem.bookName ?? "Next item";
      showToast(`${a} completed — continuing with ${b}`, 1300);
      lastCompletedItemIdRef.current = null;
      return;
    }

    // No active item => target finished
    showToast("Target completed 🎉", 1200);
    lastCompletedItemIdRef.current = null;

    const tmr = setTimeout(() => router.back(), 900);
    return () => clearTimeout(tmr);
  }, [targetId, target, displayItem, showToast, router]);

  // ✅ If target exists but no active item (already done) => toast + close
  useEffect(() => {
    if (!hydrated) return;
    if (!targetId) return;
    if (!target) return;

    if (!displayItem) {
      showToast("Target completed 🎉", 1200);
      const tmr = setTimeout(() => router.back(), 900);
      return () => clearTimeout(tmr);
    }
  }, [hydrated, targetId, target, displayItem, showToast, router]);

  // Guards (safe)
  if (!targetId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary">
          Invalid route params (targetId missing)
        </MText>
      </View>
    );
  }

  if (!hydrated) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary">
          Loading…
        </MText>
      </View>
    );
  }

  if (!target) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary">
          Target not found.
        </MText>
        <View style={{ height: spacing.md }} />
        <IconButton
          family="ion"
          name="chevron-back"
          size={iconSizes.lg}
          color={colors.textPrimary}
          onPress={() => router.back()}
        />
      </View>
    );
  }

  // If no active item, effect will close; render a minimal screen meanwhile
  if (!displayItem || !uri) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <MText variant="body" color="textPrimary" style={{ opacity: 0.8 }}>
          Finishing…
        </MText>
        <Toast visible={toast.visible} text={toast.text} colors={colors} />
      </View>
    );
  }

  const source = { uri, cache: true };

  const handleLoadComplete = (pages: number) => setTotalPages(pages);

  const handleClose = () => {
    router.back();
    // alternatively:
    // router.replace("/(tabs)/bookshelf");
  };

  const handlePageChanged = async (page: number, total: number) => {
    setTotalPages(total);
    setCurrentPage(page);

    const end = Math.max(1, Math.floor(displayItem.endPage ?? 1));
    if (page < end) return;

    if (doneOnceRef.current === displayItem.id) return;
    doneOnceRef.current = displayItem.id;

    lastCompletedItemIdRef.current = displayItem.id;
    showToast(`${displayItem.bookName} completed`, 900);

    await markItemDone(targetId, displayItem.id);
    // next toast / close is handled by the effect watching displayItem/target changes
  };

  return (
    <>
      <PdfReader
        isFullscreen={isFullscreen}
        name={`${target.title} • ${name}`}
        setIsFullscreen={setIsFullscreen}
        handleClose={handleClose}
        source={source}
        initialPage={initialPage}
        handleLoadComplete={handleLoadComplete}
        handlePageChanged={handlePageChanged}
        pdfRef={pdfRef}
        onPressMenu={() => setSectionsOpen(true)}
        currentPage={currentPage}
        totalPages={totalPages ?? undefined}
      />

      <BookSectionsSidebar
        visible={sectionsOpen}
        onClose={() => setSectionsOpen(false)}
        bookUri={uri}
        onJumpToPage={(p) => {
          if (!pdfRef.current) return;
          if (p <= 0) return;
          pdfRef.current.setPage(p);
        }}
      />

      <Toast visible={toast.visible} text={toast.text} colors={colors} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },

  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: spacing["6xl"] + 16,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },

  toast: {
    maxWidth: "94%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },
});
