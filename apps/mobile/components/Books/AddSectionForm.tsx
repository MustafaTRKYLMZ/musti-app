import { radii, spacing, useTheme } from "@musti/ui-native";
import { View, TextInput, StyleSheet } from "react-native";
import { FC } from "react";
import { MText } from "@musti/ui-native";
import { useTranslation } from "@musti/core";

import { SectionAddButton } from "@/components/ui/SectionAddButton";
import { bookshelfScreenStyles } from "@/components/Books/bookshelfScreenStyles";

type AddSectionFormProps = {
  title: string;
  setTitle: (value: string) => void;

  startPage: string;
  setStartPage: (value: string) => void;

  endPage: string;
  setEndPage: (value: string) => void;

  handleAdd: () => void;

  pageError?: string | null;
  endPageError?: string | null;
};

export const AddSectionForm: FC<AddSectionFormProps> = ({
  title,
  setTitle,
  startPage,
  setStartPage,
  endPage,
  setEndPage,
  handleAdd,
  pageError,
  endPageError,
}) => {
  const { t } = useTranslation();
  const startNum = Number(startPage);
  const endNum = endPage.trim() ? Number(endPage) : null;

  const baseValid = title.trim().length > 0 && startNum > 0 && !pageError;
  const endValid =
    !endPageError &&
    (endNum == null || (!Number.isNaN(endNum) && endNum >= startNum));

  const isValid = baseValid && endValid;

  const handleSubmit = () => {
    if (!isValid) return;
    handleAdd();
  };

  const { colors } = useTheme();

  const fieldStyle = {
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceElevated ?? colors.surface,
    color: colors.textPrimary,
  };

  return (
    <View style={bookshelfScreenStyles.sectionCard}>
      <TextInput
        placeholder={t("bookshelf.chapters.chapterTitle")}
        value={title}
        onChangeText={setTitle}
        style={[styles.input, fieldStyle]}
        placeholderTextColor={colors.textSecondary}
      />

      <View style={styles.pagesRow}>
        <TextInput
          placeholder={t("bookshelf.chapters.start")}
          value={startPage}
          onChangeText={setStartPage}
          keyboardType="number-pad"
          style={[
            styles.inputPage,
            styles.input,
            fieldStyle,
            pageError ? { borderColor: colors.danger } : null,
          ]}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="next"
        />

        <TextInput
          placeholder={t("bookshelf.chapters.end")}
          value={endPage}
          onChangeText={setEndPage}
          keyboardType="number-pad"
          style={[
            styles.inputPage,
            styles.input,
            fieldStyle,
            endPageError ? { borderColor: colors.danger } : null,
          ]}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="done"
          onSubmitEditing={handleSubmit}
        />

        <SectionAddButton
          onPress={handleSubmit}
          disabled={!isValid}
          accessibilityLabel={t("bookshelf.chapters.add")}
        />
      </View>

      {pageError ? (
        <MText variant="caption" color="danger">
          {pageError}
        </MText>
      ) : null}

      {endPageError ? (
        <MText variant="caption" color="danger">
          {endPageError}
        </MText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pagesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  inputPage: {
    flex: 1,
    minWidth: 72,
    textAlign: "center",
  },
});
