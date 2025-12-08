// apps/mobile/components/ui/Books/BookCard.tsx
import React, { FC, useRef, useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  UIManager,
  findNodeHandle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MText, colors, spacing, radii, iconSizes } from "@budget/ui-native";
import type { LocalPdfFile } from "@/utils/getPdfsDirectory";

type BookCardProps = {
  file: LocalPdfFile;
  onOpen: () => void;
  onDelete: () => void;
  onRename?: (newName: string) => void;
  lastPage?: number;
  totalPages?: number;
  todayPages?: number;
  todayTargetPages?: number;
};

export const BookCard: FC<BookCardProps> = ({
  file,
  onOpen,
  onDelete,
  onRename,
  lastPage,
  totalPages,
  todayPages,
  todayTargetPages,
}) => {
  // 3-dot menu state
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const menuIconRef = useRef<View | null>(null);

  // rename modal state
  const [renameVisible, setRenameVisible] = useState(false);
  const [tempName, setTempName] = useState(file.name);

  const progress =
    totalPages && totalPages > 0 && lastPage && lastPage > 0
      ? Math.min(1, lastPage / totalPages)
      : 0;

  const openMenu = () => {
    const handle = findNodeHandle(menuIconRef.current);
    if (!handle) return;

    UIManager.measure(handle, (_x, _y, width, height, pageX, pageY) => {
      setMenuPos({
        x: pageX + width - 140,
        y: pageY + height + 8,
      });
      setMenuVisible(true);
    });
  };

  const closeMenu = () => setMenuVisible(false);

  const openRename = () => {
    setTempName(file.name);
    setMenuVisible(false);
    setRenameVisible(true);
  };

  const cancelRename = () => {
    setRenameVisible(false);
  };

  const confirmRename = () => {
    if (!onRename) {
      setRenameVisible(false);
      return;
    }
    const trimmed = tempName.trim();
    if (!trimmed || trimmed === file.name) {
      setRenameVisible(false);
      return;
    }
    onRename(trimmed);
    setRenameVisible(false);
  };

  const handleDeleteFromMenu = () => {
    setMenuVisible(false);
    onDelete();
  };

  return (
    <>
      {/* CARD */}
      <TouchableOpacity
        onPress={onOpen}
        style={styles.card}
        activeOpacity={0.8}
      >
        {/* Header: icon + title + 3-dot */}
        <View style={styles.cardHeader}>
          <View style={styles.cardIconTitle}>
            <Ionicons
              name="document-text-outline"
              size={iconSizes.lg}
              color={colors.textPrimary}
            />
            <MText variant="body" style={styles.itemTitle} numberOfLines={2}>
              {file.name}
            </MText>
          </View>

          <TouchableOpacity
            ref={menuIconRef}
            onPress={openMenu}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="ellipsis-vertical"
              size={iconSizes.md}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Progress (lastPage / totalPages) */}
        {totalPages && totalPages > 0 ? (
          <>
            <View style={styles.progressContainer}>
              <View
                style={[styles.progressBar, { width: `${progress * 100}%` }]}
              />
            </View>
            <MText
              variant="body"
              color="textSecondary"
              style={styles.progressLabel}
              numberOfLines={1}
            >
              {Math.round(progress * 100)}% · {lastPage ?? 0} / {totalPages}{" "}
              pages
            </MText>
          </>
        ) : (
          <MText
            variant="body"
            color="textSecondary"
            style={styles.cardHint}
            numberOfLines={1}
          >
            Tap to open
          </MText>
        )}

        {/* Footer: today info */}
        <View style={styles.cardFooter}>
          {typeof todayPages === "number" && todayPages > 0 && (
            <MText
              variant="body"
              color="textSecondary"
              style={styles.cardHint}
              numberOfLines={1}
            >
              {todayTargetPages
                ? `Today: ${todayPages} / ${todayTargetPages} pages`
                : `Today: ${todayPages} pages`}
            </MText>
          )}
        </View>
      </TouchableOpacity>

      {/* 3-dot POPOVER MENU */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={closeMenu}
        >
          <View
            style={[
              styles.popover,
              {
                top: menuPos.y,
                left: menuPos.x,
              },
            ]}
          >
            {onRename && (
              <TouchableOpacity style={styles.menuItem} onPress={openRename}>
                <MText variant="body" color="textPrimary">
                  Rename
                </MText>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteFromMenu}
            >
              <MText variant="body" color="danger">
                Delete
              </MText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* RENAME MODAL */}
      <Modal
        visible={renameVisible}
        transparent
        animationType="fade"
        onRequestClose={cancelRename}
      >
        <KeyboardAvoidingView
          style={styles.renameOverlay}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.renameBox}>
            <MText
              variant="body"
              color="textPrimary"
              style={styles.renameTitle}
            >
              Rename book
            </MText>

            <TextInput
              value={tempName}
              onChangeText={setTempName}
              style={styles.renameInput}
              placeholder="Book name"
              placeholderTextColor={colors.textSecondary}
            />

            <View style={styles.renameActions}>
              <TouchableOpacity
                onPress={cancelRename}
                style={[styles.renameButton, styles.renameCancel]}
              >
                <MText variant="body" color="textSecondary">
                  Cancel
                </MText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmRename}
                style={[styles.renameButton, styles.renameConfirm]}
              >
                <MText variant="body" color="textInverse">
                  Save
                </MText>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 220,
    height: 140,
    marginRight: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.background,
    justifyContent: "space-between",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  cardIconTitle: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  itemTitle: {
    marginLeft: spacing.sm,
    flexShrink: 1,
  },

  cardHint: {
    marginTop: spacing.xs,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  // Progress
  progressContainer: {
    height: 6,
    width: "100%",
    backgroundColor: colors.borderSubtle,
    borderRadius: 4,
    overflow: "hidden",
    marginTop: spacing.sm,
  },
  progressBar: {
    height: "100%",
    backgroundColor: colors.success,
  },
  progressLabel: {
    marginTop: spacing.xs,
  },

  // Popover menu
  menuOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  popover: {
    position: "absolute",
    backgroundColor: colors.background,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    width: 140,
    elevation: 6,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuItem: {
    paddingVertical: spacing.sm,
  },

  // Rename modal
  renameOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  renameBox: {
    width: "85%",
    backgroundColor: colors.background,
    borderRadius: radii.lg,
    padding: spacing.lg,
  },
  renameTitle: {
    marginBottom: spacing.sm,
  },
  renameInput: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  renameActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  renameButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  renameCancel: {
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  renameConfirm: {
    backgroundColor: colors.primary,
  },
});
