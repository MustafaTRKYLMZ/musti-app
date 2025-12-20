// apps/mobile/components/Books/BookSectionsSidebar.tsx

import React, { useState } from "react";
import { View, StyleSheet, Pressable, Dimensions } from "react-native";
import { spacing, useTheme } from "@budget/ui-native";
import {
  useBookSectionsStore,
  type BookSection,
} from "@/store/bookshelf/useBookSectionsStore";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";
import { SectionHeader } from "./SectionHeader";
import { AddSectionForm } from "./AddSectionForm";
import { SectionList } from "./SectionList";
import { Divider } from "../ui/Divider";

type Props = {
  visible: boolean;
  onClose: () => void;
  bookUri: string;
  onJumpToPage: (page: number) => void;
};

const { width } = Dimensions.get("window");
const SIDEBAR_WIDTH = Math.min(width * 0.7, 340);

export function BookSectionsSidebar({
  visible,
  onClose,
  bookUri,
  onJumpToPage,
}: Props) {
  const { colors } = useTheme();

  const byBook = useBookSectionsStore((s) => s.byBook);
  const addSectionToStore = useBookSectionsStore((s) => s.addSection);
  const removeSectionFromStore = useBookSectionsStore((s) => s.removeSection);
  const updateSection = useBookSectionsStore((s) => s.updateSection);

  const sectionsData: BookSection[] = bookUri ? byBook[bookUri] ?? [] : [];
  // const sections = sectionsData.sort((a, b) => a.startPage - b.startPage);
  const sections = [...sectionsData].sort((a, b) => a.startPage - b.startPage);

  const [title, setTitle] = useState("");
  const [startPage, setStartPage] = useState("");
  const [pageError, setPageError] = useState<string | null>(null);
  const [endPage, setEndPage] = useState("");
  const [endPageError, setEndPageError] = useState<string | null>(null);

  const totalPages = useBooksStore((s) =>
    bookUri ? s.items[bookUri]?.totalPages ?? null : null
  );

  if (!visible) return null;

  const handleChangeStartPage = (value: string) => {
    setStartPage(value);
    setPageError(null);

    const num = Number(value);
    if (!value || !totalPages || Number.isNaN(num)) return;
    if (num < 1) return;

    if (num > totalPages) {
      setPageError(`This book has only ${totalPages} pages.`);
    }
    setEndPageError(null);
  };
  const handleChangeEndPage = (value: string) => {
    setEndPage(value);
    setEndPageError(null);

    const num = Number(value);
    if (!value || !totalPages || Number.isNaN(num)) return;
    if (num < 1) return;

    if (num > totalPages) {
      setEndPageError(`This book has only ${totalPages} pages.`);
    }
  };

  const handleAdd = () => {
    const page = Number(startPage);
    const end = endPage.trim() ? Number(endPage) : null;
    if (!title.trim() || !page || page < 1 || !bookUri) return;
    if (end != null) {
      if (Number.isNaN(end) || end < page) {
        setEndPageError("End page must be >= start page.");
        return;
      }
      if (totalPages && end > totalPages) {
        setEndPageError(`This book has only ${totalPages} pages.`);
        return;
      }
    }
    if (totalPages && page > totalPages) {
      setPageError(`This book has only ${totalPages} pages.`);
      return;
    }

    addSectionToStore(bookUri, {
      title: title.trim(),
      startPage: page,
      endPage: end,
      color: null,
    });

    setTitle("");
    setStartPage("");
    setEndPage("");
    setPageError(null);
    setEndPageError(null);
  };

  const handleDeleteSection = (id: string) => {
    if (!bookUri) return;
    removeSectionFromStore(bookUri, id);
  };

  const handleUpdateSection = (
    id: string,
    newTitle: string,
    newStartPage: number,
    newEndPage: number | null
  ) => {
    if (!bookUri) return;

    updateSection(bookUri, id, {
      title: newTitle,
      startPage: newStartPage,
      endPage: newEndPage,
    });
  };

  const handleJumpAndClose = (page: number) => {
    onJumpToPage(page);
    onClose();
  };

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.backdropStrong }]}
        onPress={onClose}
      />

      <View
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.surface,
            borderLeftColor: colors.borderSubtle,
            shadowColor: colors.shadowStrong,
          },
        ]}
      >
        <SectionHeader title="Chapters" onClose={onClose} />
        <AddSectionForm
          title={title}
          setTitle={setTitle}
          startPage={startPage}
          setStartPage={handleChangeStartPage}
          endPage={endPage}
          setEndPage={handleChangeEndPage}
          handleAdd={handleAdd}
          pageError={pageError}
          endPageError={endPageError}
        />

        <Divider />
        <SectionList
          sections={sections}
          onDeleteSection={handleDeleteSection}
          onUpdateSection={handleUpdateSection}
          onJumpToPage={handleJumpAndClose}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    zIndex: 30,
  },
  backdrop: {
    flex: 1,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    paddingTop: spacing["2xl"],
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    borderLeftWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: -4, height: 0 },
  },
});
