import React from "react";
import { StyleSheet, TextInput } from "react-native";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { useTranslation } from "@musti/core";
import { MText, radii, spacing, useTheme } from "@musti/ui-native";

import type { CreateTargetFormValues } from "@musti/forms";
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
  label,
  placeholder,
}: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const resolvedLabel = label ?? t("bookshelf.plan.titleDefault");
  const resolvedPlaceholder =
    placeholder ?? t("bookshelf.plan.titlePlaceholder");

  return (
    <>
      <MText style={formStyles.sectionTitle} color="textSecondary">
        {resolvedLabel}
      </MText>

      <Controller
        control={control}
        name="title"
        render={({ field: { value, onChange } }) => (
          <TextInput
            value={value}
            onChangeText={onChange}
            placeholder={resolvedPlaceholder}
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
