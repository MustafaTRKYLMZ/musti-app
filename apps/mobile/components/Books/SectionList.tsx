import { BookSection } from "@/store/bookshelf/useBookSectionsStore";
import { spacing } from "@budget/ui-native";
import React, { FC } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Divider } from "../ui/Divider";
import { Section } from "./Section";

type SectionListProps = {
  sections: BookSection[];
  onDeleteSection: (id: string) => void;

  // ✅ endPage eklendi (null = boş bırak)
  onUpdateSection: (
    id: string,
    title: string,
    startPage: number,
    endPage: number | null
  ) => void;

  onJumpToPage: (page: number) => void;
};

export const SectionList: FC<SectionListProps> = ({
  sections,
  onDeleteSection,
  onUpdateSection,
  onJumpToPage,
}) => {
  return (
    <FlatList
      data={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={Divider}
      renderItem={({ item }) => (
        <Section
          id={item.id}
          title={item.title}
          startPage={item.startPage}
          endPage={item.endPage ?? null} // ✅ pass through
          onDeleteSection={onDeleteSection}
          onUpdateSection={onUpdateSection}
          onJumpToPage={onJumpToPage}
        />
      )}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: spacing["2xl"],
  },
});
