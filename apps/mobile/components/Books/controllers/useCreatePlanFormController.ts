import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import {
  createPlanSchema,
  createPlanDefaultValues,
  type CreatePlanFormValues, 
  type CreatePlanParsed,     
} from "/forms";

import type { MSelectItemBase } from "@/components/ui/MSelectBottomSheet";

type Deps = {
  visible: boolean;
  books: LocalPdfFile[];
  createPlan: (p: {
    name: string;
    items: { bookUri: string; bookName: string; pagesPerDay: number }[];
  }) => void;
  onClose: () => void;
};

export function useCreatePlanFormController(deps: Deps) {
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

  const { fields, append, remove, replace } = useFieldArray({
    control,
    name: "items",
    keyName: "id",
  });

  // Add-book UI state
  const [selectedBookUri, setSelectedBookUri] = useState<string | null>(null);
  const [pagesInput, setPagesInput] = useState<string>("");

  // modal açılınca reset + ilk selectable
  useEffect(() => {
    if (!deps.visible) return;

    reset({
      ...createPlanDefaultValues,
      name: "Reading plan",
      items: [],
    });

    setSelectedBookUri(deps.books[0]?.uri ?? null);
    setPagesInput("");
  }, [deps.visible, deps.books, reset]);

  const selectedUris = useMemo(() => {
    const cur = getValues("items") ?? [];
    return new Set(cur.map((x) => x.bookUri).filter(Boolean));
  }, [fields, getValues]);

  const availableBooks = useMemo(() => {
    return (deps.books ?? []).filter((b) => !selectedUris.has(b.uri));
  }, [deps.books, selectedUris]);

  // selectedBookUri geçerli kalsın
  useEffect(() => {
    if (!deps.visible) return;

    if (!availableBooks.length) {
      setSelectedBookUri(null);
      return;
    }

    if (
      !selectedBookUri ||
      !availableBooks.some((b) => b.uri === selectedBookUri)
    ) {
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
    const uri = selectedBookUri;
    if (!uri) return;

    const book = deps.books.find((b) => b.uri === uri);
    if (!book) return;

    const cleaned = (pagesInput ?? "").replace(/[^\d]/g, "");
    const pages = cleaned ? Number(cleaned) : 0;
    if (!pages || pages <= 0) return;

    append({
      bookUri: book.uri,
      bookName: book.name,
      pagesPerDay: String(pages), // ✅ input string
    });

    setPagesInput("");
  }, [append, deps.books, pagesInput, selectedBookUri]);

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

  const applyQuickAll = useCallback(
    (pagesPerDay: number) => {
      if (!deps.books?.length) return;

      replace(
        deps.books.map((b) => ({
          bookUri: b.uri,
          bookName: b.name,
          pagesPerDay: String(pagesPerDay),
        }))
      );

      setSelectedBookUri(null);
      setPagesInput(String(pagesPerDay));
    },
    [deps.books, replace]
  );

  const save = useCallback(async () => {
    const ok = await trigger(["name", "items"]);
    if (!ok) return;

    // ✅ getValues: input type (string)
    const values = getValues();

    // ✅ schema output: number
    const parsed = createPlanSchema.parse(values) as CreatePlanParsed;

    deps.createPlan({
      name: parsed.name,
      items: parsed.items.map((it) => ({
        bookUri: it.bookUri,
        bookName: it.bookName,
        pagesPerDay: it.pagesPerDay, // ✅ number
      })),
    });

    deps.onClose();
  }, [deps, getValues, trigger]);

  const isValid = rhfIsValid && fields.length > 0;

  return {
    control,
    errors,
    isValid,

    fields,
    remove,

    availableBooks,
    bookItems,

    selectedBookUri,
    setSelectedBookUri,

    pagesInput,
    setPagesInput,

    addSelected,
    updatePages,
    applyQuickAll,
    save,
  };
}
