import React from "react";
import { View } from "react-native";
import type { Control, FieldErrors } from "react-hook-form";

import type { CreateTargetFormValues } from "/forms";
import type { MSelectItemBase } from "@/components/ui/MSelectBottomSheet";

import { TitleField } from "@/components/Books/forms/TitleField";
import { RepeatFields } from "@/components/Books/forms/RepeatFields";
import { ReadingRangeFields } from "@/components/Books/forms/ReadingRangeFields";
import { TargetItemsFields } from "@/components/Books/forms/TargetItemsFields";

type ChipColors = {
  active: { bg: string; border: string; text: string; icon: string };
  inactive: { bg: string; border: string; text: string; icon: string };
};

type BookPick = { uri: string; name: string };

export type TargetFormProps = {
  // form
  control: Control<CreateTargetFormValues>;
  errors: FieldErrors<CreateTargetFormValues>;
  setValue: (name: any, value: any, options?: any) => void;
  getValues: () => CreateTargetFormValues;

  // UI
  chipColors: ChipColors;

  // data
  bookItems: MSelectItemBase[];
  sectionItems: MSelectItemBase[];
  selectedBook: BookPick | null;

  // items
  items: any[];
  canAddItem: boolean;
  addItemLabel: string;

  // callbacks
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onOpenChapters: (bookUri: string, bookName: string) => void;

  // switches
  showRepeat?: boolean;
  showItems?: boolean;

  // title config
  titleLabel?: string;
  titlePlaceholder?: string;

  // range config
  showTypeToggle?: boolean; // if false, type is still used but UI toggle is hidden
};

export function TargetForm({
  control,
  errors,
  setValue,
  getValues,
  chipColors,
  bookItems,
  sectionItems,
  selectedBook,
  items,
  canAddItem,
  addItemLabel,
  onAddItem,
  onDeleteItem,
  onOpenChapters,
  showRepeat = true,
  showItems = true,
  titleLabel,
  titlePlaceholder,
  showTypeToggle = true,
}: TargetFormProps) {
  return (
    <View>
      <TitleField
        control={control}
        errors={errors}
        label={titleLabel}
        placeholder={titlePlaceholder}
      />

      {showRepeat ? (
        <RepeatFields
          control={control}
          errors={errors}
          setValue={setValue}
          getValues={getValues}
          chipColors={chipColors}
        />
      ) : null}

      <ReadingRangeFields
        control={control}
        errors={errors}
        setValue={setValue}
        getValues={getValues}
        chipColors={chipColors}
        bookItems={bookItems}
        sectionItems={sectionItems}
        selectedBook={selectedBook}
        onOpenChapters={onOpenChapters}
        showTypeToggle={showTypeToggle}
      />

      {showItems ? (
        <TargetItemsFields
          visible={!!selectedBook}
          canAddItem={canAddItem}
          addItemLabel={addItemLabel}
          onAddItem={onAddItem}
          items={items}
          onDeleteItem={onDeleteItem}
        />
      ) : null}
    </View>
  );
}
