import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import type { PlanItemConfig } from "@budget/core";
import type { MSelectItemBase } from "@/components/ui/MSelectBottomSheet";

import {
  createPlanSchema,
  createPlanDefaultValues,
  type CreatePlanFormValues, // INPUT: pagesPerDay string
  type CreatePlanParsed,     // OUTPUT: pagesPerDay number
} from "@budget/forms";

type Plan = {
  id: string;
  name: string;
  items: Array<{ bookUri: string; bookName: string; pagesPerDay: number }>;
};

type CommonDeps = {
  visible: boolean;
  books: LocalPdfFile[];
  onClose: () => void;
};

type CreateDeps = {
  mode: "create";
  createPlan: (p: { name: string; items: PlanItemConfig[] }) => void;
};

type EditDeps = {
  mode: "edit";
  planId: string | null;
  plan: Plan | null;
  updatePlan: (p: { planId: string; name: string; items: PlanItemConfig[] }) => void;
  deletePlan: (planId: string) => void;
  onDeleted?: () => void;
};

type Deps = CommonDeps & (CreateDeps | EditDeps);

type MultiSelectedState = Record<string, boolean>;

export function usePlanFormController(deps: Deps) {
  const {
    control,
    reset,
    getValues,
    setValue,
    trigger,
    formState: { errors, isValid: rhfIsValid },
  } = useForm<CreatePlanFormValues, any, CreatePlanParsed>({
    defaultValues: createPlanDefaultValues,
    resolver: zodResolver(createPlanSchema),
    mode: "onChange",
  });

  const { fields, append, remove, replace, move } = useFieldArray({
    control,
    name: "items",
    keyName: "id",
  });

  // single add area
  const [selectedBookUri, setSelectedBookUri] = useState<string | null>(null);
  const [pagesInput, setPagesInput] = useState("");

  // multi select
  const [multiSelectOpen, setMultiSelectOpen] = useState(false);
  const [multiSelected, setMultiSelected] = useState<MultiSelectedState>({});

  // hydrate (create/edit)
  useEffect(() => {
    if (!deps.visible) return;

    if (deps.mode === "edit") {
      if (!deps.plan) return;

      reset({
        name: deps.plan.name ?? "Reading plan",
        items: (deps.plan.items ?? []).map((it) => ({
          bookUri: it.bookUri,
          bookName: it.bookName,
          pagesPerDay: String(it.pagesPerDay ?? ""),
        })),
      });

      const selectedSet = new Set((deps.plan.items ?? []).map((x) => x.bookUri));
      const firstAvail = (deps.books ?? []).find((b) => !selectedSet.has(b.uri));
      setSelectedBookUri(firstAvail?.uri ?? null);
    } else {
      reset({
        ...createPlanDefaultValues,
        name: "Reading plan",
        items: [],
      });
      setSelectedBookUri(deps.books[0]?.uri ?? null);
    }

    setPagesInput("");
    setMultiSelectOpen(false);
    setMultiSelected({});
  }, [deps.visible, deps.mode, deps.books, (deps as any).plan, reset]);

  const selectedUris = useMemo(() => {
    const cur = getValues("items") ?? [];
    return new Set(cur.map((x) => x.bookUri).filter(Boolean));
  }, [fields, getValues]);

  const availableBooks = useMemo(() => {
    return (deps.books ?? []).filter((b) => !selectedUris.has(b.uri));
  }, [deps.books, selectedUris]);

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

  const bookItems = useMemo<MSelectItemBase[]>(
    () =>
      availableBooks
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((b) => ({ id: b.uri, label: b.name })),
    [availableBooks]
  );

  const addSelected = useCallback(() => {
    if (!selectedBookUri) return;

    const book = deps.books.find((b) => b.uri === selectedBookUri);
    if (!book) return;

    const cleaned = (pagesInput ?? "").replace(/[^\d]/g, "");
    const pages = cleaned ? Number(cleaned) : 0;

    if (!pages || pages <= 0) {
      Alert.alert("Invalid pages", "Please enter a positive page amount.");
      return;
    }

    append({ bookUri: book.uri, bookName: book.name, pagesPerDay: String(pages) });
    setPagesInput("");
  }, [append, deps.books, pagesInput, selectedBookUri]);

  const removeAt = useCallback((idx: number) => remove(idx), [remove]);

  const updatePages = useCallback(
    (idx: number, text: string) => {
      const cleaned = (text ?? "").replace(/[^\d]/g, "");
      setValue(`items.${idx}.pagesPerDay`, cleaned, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue]
  );

  // quick actions
  const setAllTargets = useCallback(
    (pagesPerDay: number) => {
      for (let i = 0; i < fields.length; i++) {
        setValue(`items.${i}.pagesPerDay`, String(pagesPerDay), {
          shouldDirty: true,
          shouldValidate: true,
        });
      }
    },
    [fields.length, setValue]
  );

  const clearAllTargets = useCallback(() => {
    for (let i = 0; i < fields.length; i++) {
      setValue(`items.${i}.pagesPerDay`, "", { shouldDirty: true, shouldValidate: true });
    }
  }, [fields.length, setValue]);

  const addAllBooks = useCallback(() => {
    if (!deps.books?.length) return;
    replace(deps.books.map((b) => ({ bookUri: b.uri, bookName: b.name, pagesPerDay: "5" })));
    setSelectedBookUri(null);
    setPagesInput("5");
  }, [deps.books, replace]);

  const removeAllBooks = useCallback(() => {
    Alert.alert("Clear plan", "Remove all books from this plan?", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => replace([]) },
    ]);
  }, [replace]);

  // multi select
  const toggleMultiSelectOpen = useCallback(() => {
    if (!availableBooks.length) return;
    setMultiSelectOpen((v) => !v);
  }, [availableBooks.length]);

  const toggleMultiBook = useCallback((uri: string) => {
    setMultiSelected((prev) => ({ ...prev, [uri]: !prev[uri] }));
  }, []);

  const closeMultiSelect = useCallback(() => {
    setMultiSelected({});
    setMultiSelectOpen(false);
  }, []);

  const addMultiSelected = useCallback(() => {
    const selectedUrisToAdd = Object.keys(multiSelected).filter((u) => multiSelected[u]);
    if (!selectedUrisToAdd.length) {
      setMultiSelectOpen(false);
      return;
    }

    const defaultPages = 5;
    for (const uri of selectedUrisToAdd) {
      const book = deps.books.find((b) => b.uri === uri);
      if (!book) continue;
      append({ bookUri: book.uri, bookName: book.name, pagesPerDay: String(defaultPages) });
    }

    setMultiSelected({});
    setMultiSelectOpen(false);
  }, [append, deps.books, multiSelected]);

  // DnD order: pass ordered uris
  const setOrderFromDnd = useCallback(
    (orderedBookUris: string[]) => {
      const cur = getValues("items") ?? [];
      if (!cur.length) return;

      const indexByUri = new Map<string, number>();
      cur.forEach((it, idx) => indexByUri.set(it.bookUri, idx));

      const nextIndices = orderedBookUris
        .map((uri) => indexByUri.get(uri))
        .filter((x): x is number => typeof x === "number");

      if (nextIndices.length !== cur.length) return;

      const pos = cur.map((_, i) => i);
      for (let to = 0; to < nextIndices.length; to++) {
        const from = pos.indexOf(nextIndices[to]);
        if (from !== to && from !== -1) {
          move(from, to);
          const [moved] = pos.splice(from, 1);
          pos.splice(to, 0, moved);
        }
      }
    },
    [getValues, move]
  );

  const save = useCallback(async () => {
    const ok = await trigger(["name", "items"]);
    if (!ok) return;

    const parsed = createPlanSchema.parse(getValues()) as CreatePlanParsed;
    if (!parsed.items?.length) {
      Alert.alert("Empty plan", "Please add at least one book with valid pages/day.");
      return;
    }

    const payload = {
      name: parsed.name.trim() || "Reading plan",
      items: parsed.items.map((it) => ({
        bookUri: it.bookUri,
        bookName: it.bookName,
        pagesPerDay: it.pagesPerDay,
      })),
    };

    if (deps.mode === "create") {
      deps.createPlan(payload);
      deps.onClose();
      return;
    }

    if (!deps.planId) return;
    deps.updatePlan({ planId: deps.planId, ...payload });
    deps.onClose();
  }, [deps, getValues, trigger]);

  const confirmDelete = useCallback(() => {
    if (deps.mode !== "edit") return;
    if (!deps.planId || !deps.plan) return;

    Alert.alert("Delete plan", `Delete "${deps.plan.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deps.deletePlan(deps.planId!);
          deps.onDeleted?.();
          deps.onClose();
        },
      },
    ]);
  }, [deps]);

  const isValid = rhfIsValid && fields.length > 0;

  return {
    // rhf
    control,
    errors,
    isValid,

    // list
    fields,
    removeAt,
    updatePages,
    setOrderFromDnd,

    // add-book
    availableBooks,
    bookItems,
    selectedBookUri,
    setSelectedBookUri,
    pagesInput,
    setPagesInput,
    addSelected,

    // quick
    setAllTargets,
    clearAllTargets,
    addAllBooks,
    removeAllBooks,

    // multi
    multiSelectOpen,
    toggleMultiSelectOpen,
    closeMultiSelect,
    multiSelected,
    toggleMultiBook,
    addMultiSelected,

    // actions
    save,
    confirmDelete,
  };
}
