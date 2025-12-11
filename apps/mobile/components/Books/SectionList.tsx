// apps/mobile/components/ui/Books/SectionList.tsx

import { BookSection } from "@/store/useBookSectionsStore";
import { spacing } from "@budget/ui-native";
import React, { FC } from "react";
import { FlatList, StyleSheet } from "react-native";
import { Divider } from "../ui/Divider";
import { Section } from "./Section";

type SectionListProps = {
  sections: BookSection[];
  onDeleteSection: (id: string) => void;
  onUpdateSection: (id: string, title: string, startPage: number) => void;
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
