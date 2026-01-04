import { iconSizes, radii, spacing, useTheme } from "@musti/ui-native";
import { View, TextInput, StyleSheet } from "react-native";
import { IconButton } from "../ui/AppIcon";
import { FC } from "react";
import { MText } from "@musti/ui-native";

type AddSectionFormProps = {
  title: string;
  setTitle: (value: string) => void;

  startPage: string;
  setStartPage: (value: string) => void;

  // ✅ new
  endPage: string;
  setEndPage: (value: string) => void;

  handleAdd: () => void;

  pageError?: string | null;
  // ✅ new
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

  const theme = useTheme();
  const { colors } = theme;

  return (
    <>
      <View style={styles.formRow}>
        <TextInput
          placeholder="Chapter title"
          value={title}
          onChangeText={setTitle}
          style={[
            styles.input,
            { borderColor: colors.borderSubtle, color: colors.textPrimary },
          ]}
          placeholderTextColor={colors.textSecondary}
        />

        <View style={styles.pageAndButton}>
          <TextInput
            placeholder="Start"
            value={startPage}
            onChangeText={setStartPage}
            keyboardType="number-pad"
            style={[
              styles.inputPage,
              {
                borderColor: pageError ? colors.danger : colors.borderSubtle,
                color: colors.textPrimary,
              },
            ]}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="next"
          />

          <TextInput
            placeholder="End"
            value={endPage}
            onChangeText={setEndPage}
            keyboardType="number-pad"
            style={[
              styles.inputPage,
              {
                borderColor: endPageError ? colors.danger : colors.borderSubtle,
                color: colors.textPrimary,
              },
            ]}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="done"
            onSubmitEditing={handleSubmit}
          />

          <IconButton
            name="add-outline"
            size={iconSizes.md}
            color={colors.textInverse}
            style={[
              styles.addButton,
              {
                opacity: isValid ? 1 : 0.4,
                backgroundColor: isValid ? colors.primary : colors.background,
              },
            ]}
            onPress={handleSubmit}
            accessibilityLabel="Add chapter"
          />
        </View>
      </View>

      {pageError ? (
        <MText variant="caption" color="danger" style={styles.errorText}>
          {pageError}
        </MText>
      ) : null}

      {endPageError ? (
        <MText variant="caption" color="danger" style={styles.errorText}>
          {endPageError}
        </MText>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  formRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },
  pageAndButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputPage: {
    width: 70,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
    textAlign: "center",
  },
  addButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
  },
  errorText: {
    marginBottom: spacing.sm,
  },
});
