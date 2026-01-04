import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { MText, spacing, radii, useTheme } from "@musti/ui-native";

import { AppChip } from "@/components/ui/AppChip";
import {
  MSelectBottomSheet,
  type MSelectItemBase,
} from "@/components/ui/MSelectBottomSheet";

import type { CreateTargetFormValues } from "@musti/forms";
import type { TargetType } from "@musti/core";
import { formStyles } from "@/components/Books/forms/formStyles";

type ChipColors = {
  active: { bg: string; border: string; text: string; icon: string };
  inactive: { bg: string; border: string; text: string; icon: string };
};

type BookPick = { uri: string; name: string };

type Props = {
  control: Control<CreateTargetFormValues>;
  errors: FieldErrors<CreateTargetFormValues>;
  setValue: (name: any, value: any, options?: any) => void;
  getValues: () => CreateTargetFormValues;

  chipColors: ChipColors;

  bookItems: MSelectItemBase[];
  sectionItems: MSelectItemBase[];
  selectedBook: BookPick | null;

  onOpenChapters: (bookUri: string, bookName: string) => void;

  showTypeToggle?: boolean; // default true
};

export function ReadingRangeFields({
  control,
  errors,
  setValue,
  getValues,
  chipColors,
  bookItems,
  sectionItems,
  selectedBook,
  onOpenChapters,
  showTypeToggle = true,
}: Props) {
  const { colors } = useTheme();
  const type = getValues().type as TargetType;

  return (
    <View>
      {/* Book */}
      <View style={{ marginTop: spacing.md }}>
        <Controller
          control={control}
          name="selectedBookId"
          render={({ field: { value, onChange } }) => (
            <MSelectBottomSheet
              label="Book"
              placeholder="Select a book…"
              valueId={value}
              items={bookItems}
              onChange={(it) => onChange(it.id)}
              searchable
              searchPlaceholder="Search book…"
            />
          )}
        />
      </View>

      {!selectedBook ? null : (
        <>
          {/* Type */}
          {showTypeToggle ? (
            <>
              <MText style={formStyles.sectionTitle} color="textSecondary">
                Type
              </MText>

              <View style={styles.chipsRow}>
                <AppChip
                  label="Section"
                  icon="list-outline"
                  active={type === "section"}
                  onPress={() => setValue("type", "section" as TargetType)}
                  colors={chipColors}
                  size="md"
                  pill={false}
                />
                <AppChip
                  label="Pages"
                  icon="copy-outline"
                  active={type === "pages"}
                  onPress={() => setValue("type", "pages" as TargetType)}
                  colors={chipColors}
                  size="md"
                  pill={false}
                />
              </View>
            </>
          ) : null}

          {/* Section */}
          {type === "section" ? (
            sectionItems.length > 0 ? (
              <View style={{ marginTop: spacing.md }}>
                <Controller
                  control={control}
                  name="selectedSectionId"
                  render={({ field: { value, onChange } }) => (
                    <MSelectBottomSheet
                      label="Section"
                      placeholder="Select a section…"
                      valueId={value}
                      items={sectionItems}
                      onChange={(it) => onChange(it.id)}
                      searchable
                      searchPlaceholder="Search section…"
                    />
                  )}
                />
              </View>
            ) : (
              <View style={{ marginTop: spacing.md }}>
                <MText style={{ opacity: 0.7 }}>
                  No sections found for this book.
                </MText>

                <Pressable
                  onPress={() =>
                    onOpenChapters(selectedBook.uri, selectedBook.name)
                  }
                  style={[
                    styles.smallBtn,
                    {
                      borderColor: colors.borderSubtle,
                      backgroundColor: colors.surface,
                      marginTop: spacing.sm,
                    },
                  ]}
                >
                  <MText style={{ fontWeight: "800" }}>Open chapters</MText>
                </Pressable>
              </View>
            )
          ) : (
            <>
              {/* Pages */}
              <MText style={formStyles.sectionTitle} color="textSecondary">
                Pages
              </MText>

              <View style={styles.pagesRow}>
                <View style={{ flex: 1 }}>
                  <MText style={styles.pagesLabel} color="textSecondary">
                    Start page
                  </MText>

                  <Controller
                    control={control}
                    name="startPageInput"
                    render={({ field: { value, onChange } }) => (
                      <TextInput
                        value={value}
                        onChangeText={(t) => onChange(t.replace(/[^\d]/g, ""))}
                        keyboardType="number-pad"
                        placeholder="e.g. 10"
                        placeholderTextColor={colors.textSecondary}
                        style={[
                          styles.input,
                          {
                            borderColor: colors.borderSubtle,
                            backgroundColor:
                              colors.surfaceElevated ?? colors.surface,
                            color: colors.textPrimary,
                          },
                        ]}
                      />
                    )}
                  />

                  {errors.startPageInput?.message ? (
                    <MText style={styles.error}>
                      {String(errors.startPageInput.message)}
                    </MText>
                  ) : null}
                </View>

                <View style={{ width: spacing.sm }} />

                <View style={{ flex: 1 }}>
                  <MText style={styles.pagesLabel} color="textSecondary">
                    End page
                  </MText>

                  <Controller
                    control={control}
                    name="endPageInput"
                    render={({ field: { value, onChange } }) => (
                      <TextInput
                        value={value}
                        onChangeText={(t) => onChange(t.replace(/[^\d]/g, ""))}
                        keyboardType="number-pad"
                        placeholder="e.g. 30"
                        placeholderTextColor={colors.textSecondary}
                        style={[
                          styles.input,
                          {
                            borderColor: colors.borderSubtle,
                            backgroundColor:
                              colors.surfaceElevated ?? colors.surface,
                            color: colors.textPrimary,
                          },
                        ]}
                      />
                    )}
                  />

                  {errors.endPageInput?.message ? (
                    <MText style={styles.error}>
                      {String(errors.endPageInput.message)}
                    </MText>
                  ) : null}
                </View>
              </View>

              <MText style={{ opacity: 0.7, marginTop: spacing.xs }}>
                Tip: End page must be greater than start page.
              </MText>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.xs,
    alignItems: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  error: { opacity: 0.75, marginTop: spacing.xs },
  pagesRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: spacing.xs,
  },
  pagesLabel: {
    fontWeight: "800",
    opacity: 0.85,
    marginBottom: spacing.xs,
  },
  smallBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
});
