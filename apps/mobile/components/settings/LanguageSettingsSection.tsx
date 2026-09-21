import React from "react";
import { View, Pressable, StyleSheet } from "react-native";
import { useTranslation, type LanguageCode } from "@musti/core";
import { BaseIcon, MText, radii, spacing, touchTargets, useTheme } from "@musti/ui-native";
import { FlagIcon } from "@/components/ui/FlagIcon";
import { useToast } from "@/components/ui/ToastProvider";

const LANGUAGE_CODES: LanguageCode[] = ["en", "tr", "nl"];

type Props = {
  /** card = standalone card; embedded = inside collapsible; inline = sidebar menu */
  variant?: "card" | "embedded" | "inline";
};

export function LanguageSettingsSection({ variant = "card" }: Props) {
  const { language, setLanguage, t } = useTranslation();
  const { colors } = useTheme();
  const { showToast } = useToast();

  const onSelect = (code: LanguageCode) => {
    if (code === language) return;
    setLanguage(code);
    showToast({
      title: t("settings.languageChanged"),
      message: t("settings.languageChangedDesc"),
      variant: "success",
      duration: 2600,
    });
  };

  const labelFor = (code: LanguageCode) => {
    if (code === "en") return t("lang.en");
    if (code === "tr") return t("lang.tr");
    return t("lang.nl");
  };

  const content = (
    <>
      {variant === "card" ? (
        <>
          <MText variant="bodyStrong">{t("settings.language")}</MText>
          <MText variant="caption" color="textSecondary" style={styles.hint}>
            {t("settings.languageChangedDesc")}
          </MText>
        </>
      ) : null}

      <View style={styles.list}>
        {LANGUAGE_CODES.map((code) => {
          const selected = code === language;
          return (
            <Pressable
              key={code}
              onPress={() => onSelect(code)}
              style={[
                styles.row,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: selected
                    ? (colors.surfaceElevated ?? colors.surface)
                    : colors.surface,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={labelFor(code)}
            >
              <FlagIcon code={code} size={variant === "inline" ? 28 : 32} />
              <MText variant="body" style={{ flex: 1, color: colors.textPrimary }}>
                {labelFor(code)}
              </MText>
              {selected ? (
                <BaseIcon name="checkmark" color={colors.primary} />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </>
  );

  if (variant === "inline") {
    return <View style={styles.inlineWrap}>{content}</View>;
  }

  if (variant === "embedded") {
    return <View style={styles.embeddedWrap}>{content}</View>;
  }

  return (
    <View style={[styles.card, { borderColor: colors.borderSubtle }]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  embeddedWrap: {
    gap: spacing.xs,
  },
  inlineWrap: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  hint: {
    marginBottom: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: touchTargets.minimum,
  },
});
