import { MText, radii, shadows, spacing, useTheme } from "@budget/ui-native";
import React, { FC, useState } from "react";
import { View, StyleSheet, TextInput, TouchableOpacity } from "react-native";
import { IconButton } from "../ui/AppIcon";

type SectionProps = {
  id: string;
  title: string;
  startPage: number;
  onDeleteSection: (id: string) => void;
  onUpdateSection: (id: string, title: string, startPage: number) => void;
  onJumpToPage: (page: number) => void;
};

export const Section: FC<SectionProps> = ({
  id,
  title,
  startPage,
  onDeleteSection,
  onUpdateSection,
  onJumpToPage,
}) => {
  const { colors } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftPage, setDraftPage] = useState(String(startPage));

  const handleStartEdit = () => {
    setDraftTitle(title);
    setDraftPage(String(startPage));
    setMenuOpen(false);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setDraftTitle(title);
    setDraftPage(String(startPage));
  };

  const handleSaveEdit = () => {
    const pageNum = Number(draftPage);
    if (!draftTitle.trim() || !pageNum || pageNum <= 0) return;

    onUpdateSection(id, draftTitle.trim(), pageNum);
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
              {
                borderColor: colors.borderSubtle,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Title"
            placeholderTextColor={colors.textSecondary}
          />
          <TextInput
            value={draftPage}
            onChangeText={setDraftPage}
            keyboardType="number-pad"
            style={[
              styles.pageInput,
              {
                borderColor: colors.borderSubtle,
                color: colors.textPrimary,
              },
            ]}
            placeholder="Page"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.sectionInfo} onPress={handleJump}>
          <MText variant="bodyStrong" numberOfLines={2}>
            {title}
          </MText>
          <MText variant="body" color="textSecondary">
            Page {startPage}
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
                />
                <IconButton
                  name="trash-outline"
                  onPress={() => {
                    setMenuOpen(false);
                    onDeleteSection(id);
                  }}
                  style={styles.menuIcon}
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
