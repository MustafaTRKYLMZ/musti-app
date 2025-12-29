import React from "react";
import { StyleSheet, TextInput } from "react-native";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { MText, radii, spacing, useTheme } from "@budget/ui-native";

import type { CreateTargetFormValues } from "@budget/forms";
import { formStyles } from "@/components/Books/forms/formStyles";

type Props = {
  control: Control<CreateTargetFormValues>;
  errors: FieldErrors<CreateTargetFormValues>;
  label?: string;
  placeholder?: string;
};

export function TitleField({
  control,
  errors,
  label = "Title",
  placeholder = "e.g. Morning routine",
}: Props) {
  const { colors } = useTheme();

  return (
    <>
      <MText style={formStyles.sectionTitle} color="textSecondary">
        {label}
      </MText>

      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={placeholder}
            placeholderTextColor={colors.textSecondary}
            style={[
              styles.input,
              {
                borderColor: colors.borderSubtle,
                backgroundColor: colors.surfaceElevated ?? colors.surface,
                color: colors.textPrimary,
              },
            ]}
          />
        )}
      />

      {errors.title?.message ? (
        <MText style={styles.error}>{String(errors.title.message)}</MText>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  error: { opacity: 0.75, marginTop: spacing.xs },
});
