import { MText, radii, spacing, useTheme } from "@musti/ui-native";
import React, { FC, useMemo, useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { useTranslation, formatTranslation } from "@musti/core";
import { HeaderIconButton } from "@/components/ui/HeaderIconButton";

type SectionProps = {
  id: string;
  title: string;
  startPage: number;
  endPage: number | null;

  onDeleteSection: (id: string) => void;
  onUpdateSection: (
    id: string,
    title: string,
    startPage: number,
    endPage: number | null
  ) => void;

  onJumpToPage: (page: number) => void;
};

export const Section: FC<SectionProps> = ({
  id,
  title,
  startPage,
  endPage,
  onDeleteSection,
  onUpdateSection,
  onJumpToPage,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [draftTitle, setDraftTitle] = useState(title);
  const [draftStart, setDraftStart] = useState(String(startPage));
  const [draftEnd, setDraftEnd] = useState(endPage ? String(endPage) : "");

  const endLabel = useMemo(() => {
    if (!endPage) {
      return formatTranslation(t("bookshelf.chapters.pageN"), { n: startPage });
    }
    return `${startPage}–${endPage}`;
  }, [startPage, endPage, t]);

  const handleStartEdit = () => {
    setDraftTitle(title);
    setDraftStart(String(startPage));
    setDraftEnd(endPage ? String(endPage) : "");
    setMenuOpen(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDraftTitle(title);
    setDraftStart(String(startPage));
    setDraftEnd(endPage ? String(endPage) : "");
  };

  const handleSaveEdit = () => {
    const st = Number(draftStart);
    const en = draftEnd.trim() ? Number(draftEnd) : null;

    if (!draftTitle.trim() || !st || st <= 0) return;
    if (en != null && (Number.isNaN(en) || en < st)) return;

    onUpdateSection(id, draftTitle.trim(), st, en);
    setIsEditing(false);
  };

  const handleJump = () => {
    if (isEditing) return;
    onJumpToPage(startPage);
  };

  return (
    <View style={styles.sectionRow}>
      {isEditing ? (
        <View style={styles.sectionInfo}>
          <TextInput
            value={draftTitle}
            onChangeText={setDraftTitle}
            style={[
              styles.titleInput,
              { borderColor: colors.borderSubtle, color: colors.textPrimary },
            ]}
            placeholder={t("bookshelf.chapters.titleLabel")}
            placeholderTextColor={colors.textSecondary}
          />

          <TextInput
            value={draftStart}
            onChangeText={(t) => setDraftStart(t.replace(/[^\d]/g, ""))}
            keyboardType="number-pad"
            style={[
              styles.pageInput,
              { borderColor: colors.borderSubtle, color: colors.textPrimary },
            ]}
            placeholder={t("bookshelf.chapters.start")}
            placeholderTextColor={colors.textSecondary}
          />

          <TextInput
            value={draftEnd}
            onChangeText={(t) => setDraftEnd(t.replace(/[^\d]/g, ""))}
            keyboardType="number-pad"
            style={[
              styles.pageInput,
              {
                borderColor:
                  draftEnd.trim() && Number(draftEnd) < Number(draftStart)
                    ? colors.danger
                    : colors.borderSubtle,
                color: colors.textPrimary,
              },
            ]}
            placeholder={t("bookshelf.chapters.end")}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="done"
            onSubmitEditing={handleSaveEdit}
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.sectionInfo} onPress={handleJump}>
          <MText variant="bodyStrong" numberOfLines={2} style={{ flex: 1 }}>
            {title}
          </MText>
          <MText variant="body" color="textSecondary">
            {endLabel}
          </MText>
        </TouchableOpacity>
      )}

      {isEditing ? (
        <View style={styles.editActions}>
          <HeaderIconButton
            icon="close"
            variant="plain"
            onPress={handleCancelEdit}
            accessibilityLabel={t("common.cancel")}
          />
          <HeaderIconButton
            icon="checkmark"
            variant="circle"
            iconColor={colors.textInverse}
            onPress={handleSaveEdit}
            accessibilityLabel={t("common.save")}
            style={{
              borderColor: colors.primary,
              backgroundColor: colors.primary,
            }}
          />
        </View>
      ) : (
        <View style={styles.menuWrapper}>
          <HeaderIconButton
            icon="ellipsis-vertical"
            variant="plain"
            onPress={() => setMenuOpen((prev) => !prev)}
            accessibilityLabel={t("bookshelf.chapters.title")}
          />

          {menuOpen ? (
            <View
              style={[
                styles.menuContainer,
                {
                  backgroundColor: colors.surfaceElevated ?? colors.surface,
                  borderColor: colors.borderSubtle,
                  shadowColor: colors.shadowStrong,
                },
              ]}
            >
              <HeaderIconButton
                icon="pencil-outline"
                variant="plain"
                onPress={handleStartEdit}
                accessibilityLabel={t("bookshelf.chapters.edit")}
              />
              <HeaderIconButton
                icon="trash-outline"
                variant="plain"
                onPress={() => {
                  setMenuOpen(false);
                  onDeleteSection(id);
                }}
                accessibilityLabel={t("bookshelf.chapters.delete")}
              />
            </View>
          ) : null}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },

  sectionInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.xs,
  },

  titleInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.xs,
  },

  pageInput: {
    width: 70,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: "center",
  },

  menuWrapper: {
    position: "relative",
  },

  menuContainer: {
    position: "absolute",
    top: spacing["2xl"],
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    zIndex: 20,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    gap: spacing.xs,
  },

  editActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
});
