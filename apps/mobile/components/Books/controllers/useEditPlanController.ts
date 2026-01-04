import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { listLocalPdfs, type LocalPdfFile } from "@/utils/getPdfsDirectory";
import type { MSelectItemBase } from "@/components/ui/MSelectBottomSheet";
import type { PlanItemConfig } from "@musti/core";

type EntryState = Record<string, string>;
type MultiSelectedState = Record<string, boolean>;

type Deps = {
  visible: boolean;
  planId: string | null;
  plan: { id: string; name: string; items: PlanItemConfig[] } | null;

  updatePlan: (p: { planId: string; name: string; items: PlanItemConfig[] }) => void;
  deletePlan: (planId: string) => void;

  onClose: () => void;
  onDeleted?: () => void; 
};

export function useEditPlanController(deps: Deps) {
  const [books, setBooks] = useState<LocalPdfFile[]>([]);
  const [planName, setPlanName] = useState("");

  const [order, setOrder] = useState<string[]>([]);
  const [entries, setEntries] = useState<EntryState>({});

  const [selectedBookUri, setSelectedBookUri] = useState<string | null>(null);

  const [multiSelectOpen, setMultiSelectOpen] = useState(false);
  const [multiSelected, setMultiSelected] = useState<MultiSelectedState>({});

  // load books once
  useEffect(() => {
    (async () => {
      const all = await listLocalPdfs();
      setBooks(all);
    })();
  }, []);

  // init from plan whenever modal opens or plan/books changes
  useEffect(() => {
    if (!deps.visible) return;
    if (!deps.plan) return;

    setPlanName(deps.plan.name);

    const nextOrder = deps.plan.items.map((it) => it.bookUri);
    const nextEntries: EntryState = {};

    for (const it of deps.plan.items) {
      nextEntries[it.bookUri] = String(it.pagesPerDay ?? "");
    }

    // keep input keys stable for all books
    for (const b of books) {
      if (nextEntries[b.uri] == null) nextEntries[b.uri] = "";
    }

    setOrder(nextOrder);
    setEntries(nextEntries);

    const firstAvailable = books.find((b) => !nextOrder.includes(b.uri));
    setSelectedBookUri(firstAvailable?.uri ?? null);

    setMultiSelectOpen(false);
    setMultiSelected({});
  }, [deps.visible, deps.plan, books]);

  const planBooks = useMemo(() => {
    return order
      .map((uri) => books.find((b) => b.uri === uri))
      .filter(Boolean) as LocalPdfFile[];
  }, [order, books]);

  const availableBooks = useMemo(() => {
    return books.filter((b) => !order.includes(b.uri));
  }, [books, order]);

  // keep single picker valid
  useEffect(() => {
    if (!deps.visible) return;

    if (!availableBooks.length) {
      setSelectedBookUri(null);
      return;
    }

    if (!selectedBookUri || !availableBooks.some((b) => b.uri === selectedBookUri)) {
      setSelectedBookUri(availableBooks[0].uri);
    }
  }, [deps.visible, availableBooks, selectedBookUri]);

  const availableBookItems = useMemo<MSelectItemBase[]>(
    () =>
      availableBooks
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((b) => ({ id: b.uri, label: b.name })),
    [availableBooks]
  );

  const currentPagesValue =
    selectedBookUri && entries[selectedBookUri] ? entries[selectedBookUri] : "";

  const changePages = useCallback((uri: string, value: string) => {
    const cleaned = value.replace(/[^0-9]/g, "");
    setEntries((prev) => ({ ...prev, [uri]: cleaned }));
  }, []);

  const addSelectedBook = useCallback(() => {
    if (!selectedBookUri) {
      Alert.alert("No book selected", "Please select a book first.");
      return;
    }

    const raw = entries[selectedBookUri];
    const pages = raw ? parseInt(raw, 10) : 0;

    if (!pages || pages <= 0) {
      Alert.alert("Invalid pages", "Please enter a positive page amount.");
      return;
    }

    setOrder((prev) => [...prev, selectedBookUri]);

    const nextAvail = availableBooks.find((b) => b.uri !== selectedBookUri);
    setSelectedBookUri(nextAvail?.uri ?? null);
  }, [selectedBookUri, entries, availableBooks]);

  const removeBook = useCallback((uri: string) => {
    setOrder((prev) => prev.filter((x) => x !== uri));
  }, []);

  const setAllTargets = useCallback(
    (pagesPerDay: number) => {
      if (!order.length) return;
      setEntries((prev) => {
        const next = { ...prev };
        for (const uri of order) next[uri] = String(pagesPerDay);
        return next;
      });
    },
    [order]
  );

  const clearAllTargets = useCallback(() => {
    if (!order.length) return;
    setEntries((prev) => {
      const next = { ...prev };
      for (const uri of order) next[uri] = "";
      return next;
    });
  }, [order]);

  const addAllBooks = useCallback(() => {
    if (!books.length) return;
    const allUris = books.map((b) => b.uri);

    setOrder(allUris);
    setEntries((prev) => {
      const next = { ...prev };
      for (const uri of allUris) if (!next[uri]) next[uri] = "5";
      return next;
    });

    setSelectedBookUri(null);
  }, [books]);

  const removeAllBooks = useCallback(() => {
    Alert.alert("Clear plan", "Remove all books from this plan?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setOrder([]) },
    ]);
  }, []);

  const addMultiSelected = useCallback(() => {
    const selectedUris = Object.keys(multiSelected).filter((u) => multiSelected[u]);

    if (!selectedUris.length) {
      setMultiSelectOpen(false);
      return;
    }

    setOrder((prev) => {
      const set = new Set(prev);
      const next = [...prev];
      for (const uri of selectedUris) {
        if (!set.has(uri)) next.push(uri);
      }
      return next;
    });

    setEntries((prev) => {
      const next = { ...prev };
      for (const uri of selectedUris) if (!next[uri]) next[uri] = "5";
      return next;
    });

    setMultiSelected({});
    setMultiSelectOpen(false);
  }, [multiSelected]);

  const toggleMulti = useCallback((uri: string) => {
    setMultiSelected((prev) => ({ ...prev, [uri]: !prev[uri] }));
  }, []);

  const buildItems = useCallback((): PlanItemConfig[] => {
    const items: PlanItemConfig[] = [];
    for (const uri of order) {
      const book = books.find((b) => b.uri === uri);
      if (!book) continue;

      const raw = entries[uri];
      const pages = raw ? parseInt(raw, 10) : 0;
      if (!pages || pages <= 0) continue;

      items.push({ bookUri: uri, bookName: book.name, pagesPerDay: pages });
    }
    return items;
  }, [order, books, entries]);

  const save = useCallback(() => {
    if (!deps.planId || !deps.plan) return;

    const finalName = planName.trim() || "Reading plan";
    const items = buildItems();

    if (!items.length) {
      Alert.alert(
        "Empty plan",
        "Please keep at least one book with a valid pages/day target."
      );
      return;
    }

    deps.updatePlan({ planId: deps.planId, name: finalName, items });
    deps.onClose();
  }, [deps, planName, buildItems]);

  const del = useCallback(() => {
    if (!deps.planId || !deps.plan) return;

    Alert.alert("Delete plan", `Delete "${deps.plan.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deps.deletePlan(deps.planId!);
          deps.onClose();
          deps.onDeleted?.();
        },
      },
    ]);
  }, [deps]);

  return {
    // data
    books,
    planBooks,
    availableBooks,
    availableBookItems,

    // state
    planName,
    setPlanName,
    order,
    setOrder,
    entries,
    selectedBookUri,
    setSelectedBookUri,
    currentPagesValue,

    multiSelectOpen,
    setMultiSelectOpen,
    multiSelected,
    setMultiSelected,

    // actions
    changePages,
    addSelectedBook,
    removeBook,
    setAllTargets,
    clearAllTargets,
    addAllBooks,
    removeAllBooks,
    addMultiSelected,
    toggleMulti,
    save,
    del,
  };
}
