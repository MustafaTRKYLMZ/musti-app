import { MText, radii, shadows, spacing, useTheme } from "@musti/ui-native";
import React, { FC, useMemo, useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { IconButton } from "@musti/ui-native/src/components/AppIcon";

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
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [draftTitle, setDraftTitle] = useState(title);
  const [draftStart, setDraftStart] = useState(String(startPage));
  const [draftEnd, setDraftEnd] = useState(endPage ? String(endPage) : "");

  const endLabel = useMemo(() => {
    if (!endPage) return `Page ${startPage}`;
    return `${startPage}–${endPage}`;
  }, [startPage, endPage]);

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
            placeholder="Title"
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
            placeholder="Start"
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
            placeholder="End"
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
          <IconButton
            name="close-outline"
            onPress={handleCancelEdit}
            style={styles.actionIcon}
          />
          <IconButton
            name="checkmark-outline"
            onPress={handleSaveEdit}
            style={[styles.actionIcon, { backgroundColor: colors.primary }]}
          />
        </View>
      ) : (
        <View style={styles.menuWrapper}>
          <IconButton
            name="ellipsis-vertical"
            onPress={() => setMenuOpen((prev) => !prev)}
          />

          {menuOpen && (
            <View
              style={[
                styles.menuContainer,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                },
              ]}
            >
              <View style={styles.menuRow}>
                <IconButton
                  name="pencil-outline"
                  onPress={handleStartEdit}
                  style={styles.menuIcon}
                  accessibilityLabel="Edit section"
                />
                <IconButton
                  name="trash-outline"
                  onPress={() => {
                    setMenuOpen(false);
                    onDeleteSection(id);
                  }}
                  style={styles.menuIcon}
                  accessibilityLabel="Delete section"
                />
              </View>
            </View>
          )}
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
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    zIndex: 20,
    shadowColor: shadows.card.shadowColor,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    minWidth: 72,
  },

  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  menuIcon: {
    marginHorizontal: spacing.sm,
  },

  editActions: {
    flexDirection: "row",
    alignItems: "center",
  },

  actionIcon: {
    marginLeft: spacing.xs,
  },
});
