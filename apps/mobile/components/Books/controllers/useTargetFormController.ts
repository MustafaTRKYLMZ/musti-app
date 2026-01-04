import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import type { TargetRepeat } from "/core";
import {
  createTargetSchema,
  createTargetDefaultValues,
  type CreateTargetFormValues,
  buildTargetRepeatFromForm,
} from "/forms";

import type { MSelectItemBase } from "@/components/ui/MSelectBottomSheet";
import { clampInt } from "@/utils/number";

type SectionPick = {
  id: string;
  title: string;
  startPage: number;
  endPage: number;
};

type BookPick = { uri: string; name: string };

type CommonDeps = {
  showToast: (p: { message: string; duration?: number }) => void;

  // sections resolver
  getResolvedSections?: (bookUri: string, _unused: any) => any[];

  // store actions needed by both modes
  setTargetRepeat: (
    targetId: string,
    repeat: TargetRepeat | null
  ) => Promise<void>;
  addItem: (targetId: string, item: any) => Promise<void>;
};

type CreateDeps = {
  mode: "create";
  visible: boolean;
  books: BookPick[];
  initialBookUri?: string | null;

  addTarget: (title: string) => Promise<string>;
};

type EditDeps = {
  mode: "edit";
  visible: boolean;
  targetId: string | null;
  target: any | null;

  availableBooks: BookPick[];
  updateTargetTitle: (targetId: string, title: string) => Promise<void>;
};

type Deps = CommonDeps & (CreateDeps | EditDeps);

export function useTargetFormController(deps: Deps) {
  const {
    control,
    setValue,
    getValues,
    reset,
    trigger,
    formState: { errors },
  } = useForm<CreateTargetFormValues>({
    defaultValues: createTargetDefaultValues,
    resolver: zodResolver(createTargetSchema),
    mode: "onChange",
  });

  // create flow state
  const [createdTargetId, setCreatedTargetId] = useState<string | null>(null);

  // watch (form values)
  const title = useWatch({ control, name: "title" });
  const selectedBookId = useWatch({ control, name: "selectedBookId" });
  const type = useWatch({ control, name: "type" });
  const selectedSectionId = useWatch({ control, name: "selectedSectionId" });
  const startPageInput = useWatch({ control, name: "startPageInput" });
  const endPageInput = useWatch({ control, name: "endPageInput" });

  const books: BookPick[] =
    deps.mode === "create" ? deps.books : deps.availableBooks;

  const targetId = deps.mode === "create" ? createdTargetId : deps.targetId;

  const bookItems = useMemo<MSelectItemBase[]>(
    () => books.map((b) => ({ id: b.uri, label: b.name })),
    [books]
  );

  const selectedBook = useMemo(() => {
    if (!selectedBookId) return null;
    return books.find((b) => b.uri === selectedBookId) ?? null;
  }, [books, selectedBookId]);

  // ✅ hydrate for create: initial book
  useEffect(() => {
    if (deps.mode !== "create") return;
    if (!deps.visible) return;
    if (!deps.initialBookUri) return;

    setValue("selectedBookId", deps.initialBookUri, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [deps, setValue]);

  // ✅ hydrate for edit: from target
  useEffect(() => {
    if (deps.mode !== "edit") return;
    if (!deps.visible) return;
    if (!deps.target) return;

    const firstBookUri = deps.target.items?.[0]?.bookUri ?? null;

    const next: CreateTargetFormValues = {
      ...createTargetDefaultValues,
      title: deps.target.title ?? "",
      selectedBookId: firstBookUri,
      type: "section",
      selectedSectionId: null,
      startPageInput: "",
      endPageInput: "",
      repeat: { ...createTargetDefaultValues.repeat },
    };

    if (deps.target.repeat) {
      next.repeat.enabled = true;
      next.repeat.freq = deps.target.repeat.freq as any;
      next.repeat.interval = String(deps.target.repeat.interval ?? 1);
      next.repeat.timeOfDay = deps.target.repeat.timeOfDay ?? "00:00";
      next.repeat.weekdays =
        deps.target.repeat.weekdays && deps.target.repeat.weekdays.length
          ? deps.target.repeat.weekdays
          : [1];

      const end = deps.target.repeat.end as any;
      if (!end || end.kind === "never") {
        next.repeat.endKind = "never";
      } else if (end.kind === "until") {
        next.repeat.endKind = "until";
        next.repeat.untilDate = new Date(end.untilAt);
      } else if (end.kind === "count") {
        next.repeat.endKind = "count";
        const total = Number(end.total ?? end.remaining ?? 1);
        next.repeat.countRemaining = String(
          Math.max(1, Math.floor(total || 1))
        );
      } else {
        next.repeat.endKind = "never";
      }
    }

    reset(next);
  }, [deps, reset]);

  // clear dependent fields on book/type change
  useEffect(() => {
    setValue("selectedSectionId", null, { shouldDirty: true });
    setValue("startPageInput", "", { shouldDirty: true });
    setValue("endPageInput", "", { shouldDirty: true });
  }, [selectedBookId, type, setValue]);

  // sections list
  const resolvedSections = useMemo<SectionPick[]>(() => {
    if (!selectedBookId) return [];
    if (!deps.getResolvedSections) return [];

    const secs = deps.getResolvedSections(selectedBookId, null) ?? [];
    return secs
      .map((s: any) => ({
        id: String(s.id),
        title: String(s.title ?? "Untitled"),
        startPage: Math.max(1, clampInt(s.startPage ?? 1) || 1),
        endPage: Math.max(1, clampInt(s.endPage ?? 1) || 1),
      }))
      .filter((s: any) => s.endPage >= s.startPage);
  }, [deps.getResolvedSections, selectedBookId]);

  const sectionItems = useMemo<MSelectItemBase[]>(
    () =>
      resolvedSections.map((s) => ({
        id: `sec:${s.id}`,
        label: s.title,
        subLabel: `${s.startPage}–${s.endPage}`,
      })),
    [resolvedSections]
  );

  const selectedSection = useMemo(() => {
    if (!selectedSectionId) return null;
    const rawId = selectedSectionId.replace("sec:", "");
    return resolvedSections.find((s) => String(s.id) === rawId) ?? null;
  }, [selectedSectionId, resolvedSections]);

  const pagesStart = Math.max(1, clampInt(startPageInput) || 0);
  const pagesEnd = Math.max(1, clampInt(endPageInput) || 0);

  const canAddItem = useMemo(() => {
    if (!targetId) return false;
    if (!selectedBook) return false;

    if (type === "section") return !!selectedSection;
    return pagesStart > 0 && pagesEnd > 0 && pagesEnd > pagesStart;
  }, [targetId, selectedBook, type, selectedSection, pagesStart, pagesEnd]);

  const canCreateGroup =
    deps.mode === "create" ? title.trim().length > 0 && !createdTargetId : false;

  // ✅ create group (only create mode)
  const createGroup = useCallback(async () => {
    if (deps.mode !== "create") return;

    const ok = await trigger(["title", "repeat"]);
    if (!ok) return;

    const vals = getValues();
    const t = vals.title.trim();
    if (!t) return;

    try {
      const id = await deps.addTarget(t);
      setCreatedTargetId(id);

      const payload = buildTargetRepeatFromForm(vals);
      if (payload) await deps.setTargetRepeat(id, payload);

      deps.showToast({ message: "Target created. Now add items.", duration: 2500 });
    } catch {
      deps.showToast({ message: "Failed to create target.", duration: 4000 });
    }
  }, [deps, trigger, getValues]);

  // ✅ add item (both modes)
  const addSelectedItem = useCallback(async () => {
    if (!targetId || !selectedBook) return;

    const vals = getValues();

    if (vals.type === "section") {
      if (!selectedSection) {
        deps.showToast({ message: "Select a section first.", duration: 2500 });
        return;
      }

      const jumpPage = Math.max(1, selectedSection.startPage);
      const endPage = Math.max(jumpPage, selectedSection.endPage);

      try {
        await deps.addItem(targetId, {
          bookUri: selectedBook.uri,
          bookName: selectedBook.name,
          type: "section",
          startPage: jumpPage,
          endPage,
          labelId: `sec:${selectedSection.id}`,
          label: selectedSection.title,
          jumpPage,
        });

        deps.showToast({ message: "Item added.", duration: 1800 });
        setValue("selectedSectionId", null, { shouldDirty: true });
      } catch {
        deps.showToast({ message: "Failed to add item.", duration: 3500 });
      }
      return;
    }

    const ok = await trigger(["startPageInput", "endPageInput"]);
    if (!ok) return;

    const jumpPage = Math.max(1, Math.floor(Number(vals.startPageInput) || 0));
    const endPage = Math.max(1, Math.floor(Number(vals.endPageInput) || 0));

    if (!(endPage > jumpPage)) {
      deps.showToast({
        message: "End page must be greater than start page.",
        duration: 3500,
      });
      return;
    }

    try {
      await deps.addItem(targetId, {
        bookUri: selectedBook.uri,
        bookName: selectedBook.name,
        type: "pages",
        startPage: jumpPage,
        endPage,
        labelId: `pages:${jumpPage}-${endPage}`,
        label: `${jumpPage} → ${endPage}`,
        jumpPage,
      });

      deps.showToast({ message: "Item added.", duration: 1800 });
      setValue("startPageInput", "", { shouldDirty: true });
      setValue("endPageInput", "", { shouldDirty: true });
    } catch {
      deps.showToast({ message: "Failed to add item.", duration: 3500 });
    }
  }, [
    deps,
    targetId,
    selectedBook,
    selectedSection,
    getValues,
    trigger,
    setValue,
  ]);

  // ✅ save edit (only edit mode)
  const saveEdit = useCallback(async () => {
    if (deps.mode !== "edit") return;
    if (!deps.target) return;

    const ok = await trigger(["title", "repeat"]);
    if (!ok) return;

    const vals = getValues();

    try {
      if (vals.title.trim() && vals.title.trim() !== deps.target.title) {
        await deps.updateTargetTitle(deps.target.id, vals.title.trim());
      }

      const payload = buildTargetRepeatFromForm(vals);
      await deps.setTargetRepeat(deps.target.id, payload);

      deps.showToast({ message: "Target saved.", duration: 2000 });
    } catch {
      deps.showToast({ message: "Failed to save target.", duration: 3500 });
    }
  }, [deps, trigger, getValues]);

  const resetAll = useCallback(() => {
    reset(createTargetDefaultValues);
    setCreatedTargetId(null);
  }, [reset]);

  const formProps = useCallback(
    (p: {
      chipColors: any;
      items: any[];
      canAddItem: boolean;
      addItemLabel: string;
      onAddItem: () => void;
      onDeleteItem: (itemId: string) => void;
      onOpenChapters: (bookUri: string, bookName: string) => void;
    }) => {
      return {
        control,
        errors,
        setValue,
        getValues: () => getValues(),
        chipColors: p.chipColors,
        bookItems,
        sectionItems,
        selectedBook: selectedBook
          ? { uri: selectedBook.uri, name: selectedBook.name }
          : null,
        items: p.items,
        canAddItem: p.canAddItem,
        addItemLabel: p.addItemLabel,
        onAddItem: p.onAddItem,
        onDeleteItem: p.onDeleteItem,
        onOpenChapters: p.onOpenChapters,
      };
    },
    [control, errors, setValue, getValues, bookItems, sectionItems, selectedBook]
  );

  return {
    // rhf
    control,
    errors,
    setValue,
    getValues,
    trigger,
    resetAll,

    // computed
    targetId,
    createdTargetId,
    canCreateGroup,
    canAddItem,

    bookItems,
    sectionItems,
    selectedBook,

    // actions
    createGroup,
    addSelectedItem,
    saveEdit,
    formProps,
  };
}
