import React, { useMemo } from "react";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MText, spacing, radii, iconSizes, useTheme } from "@musti/ui-native";
import { IconButton } from "@/components/ui/AppIcon";

import { useToast } from "@/components/ui/ToastProvider";
import { TargetForm } from "@/components/Books/forms/TargetForm";
import { useTargetFormController } from "@/components/Books/controllers/useTargetFormController";

import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { useBookSectionsStore } from "@/store/bookshelf/useBookSectionsStore";
import { useBooksStore } from "@/store/bookshelf/useBooksStore";

import { useChipColors } from "@/hooks/useChipColors";
import { useAvailableBooksForTarget } from "@/hooks/useAvailableBooksForTarget";

type Props = {
  visible: boolean;
  targetId: string | null;
  onClose: () => void;
  onOpenChapters: (bookUri: string, bookName: string) => void;
};

export function EditTargetModal({
  visible,
  targetId,
  onClose,
  onOpenChapters,
}: Props) {
  const { colors } = useTheme();
  const { showToast } = useToast();

  const chipColors = useChipColors();

  const targets = useReadingTargetsStore((s) => s.targets);
  const addItem = useReadingTargetsStore((s) => s.addItem);
  const deleteItem = useReadingTargetsStore((s) => s.deleteItem);
  const updateTargetTitle = useReadingTargetsStore((s) => s.updateTargetTitle);
  const setTargetRepeat = useReadingTargetsStore((s) => s.setTargetRepeat);

  const getResolvedSections = useBookSectionsStore(
    (s) => (s as any).getResolvedSections
  );

  const progressItems = useBooksStore((s) => s.items);

  const target = useMemo(() => {
    if (!targetId) return null;
    return targets.find((t) => t.id === targetId) ?? null;
  }, [targets, targetId]);

  const availableBooks = useAvailableBooksForTarget(target, progressItems);

  const c = useTargetFormController({
    mode: "edit",
    visible,
    targetId,
    target,
    availableBooks,
    getResolvedSections,
    addItem,
    updateTargetTitle,
    setTargetRepeat,
    showToast,
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View
        style={[styles.backdrop, { backgroundColor: colors.backdropStrong }]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ justifyContent: "flex-end" }}
        >
          <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
            <View style={styles.header}>
              <MText variant="heading3">Edit Target</MText>
              <IconButton
                name="close"
                size={iconSizes.lg}
                color={colors.textPrimary}
                onPress={onClose}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: spacing.lg }}
              keyboardShouldPersistTaps="handled"
            >
              <TargetForm
                {...c.formProps({
                  chipColors,
                  items: target?.items ?? [],
                  canAddItem: c.canAddItem,
                  addItemLabel: "Add item",
                  onAddItem: c.addSelectedItem,
                  onDeleteItem: (itemId) => {
                    if (!targetId) return;
                    deleteItem(targetId, itemId);
                    showToast({ message: "Item removed.", duration: 1800 });
                  },
                  onOpenChapters,
                })}
              />
            </ScrollView>

            <Pressable
              onPress={async () => {
                await c.saveEdit();
                onClose();
              }}
              disabled={!targetId}
              style={[
                styles.finish,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: colors.surfaceElevated,
                  opacity: targetId ? 1 : 0.5,
                },
              ]}
            >
              <MText style={{ fontWeight: "900" }}>Save & Close</MText>
            </Pressable>
          </View>

          <View style={{ height: spacing["2xl"] }} />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  finish: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
