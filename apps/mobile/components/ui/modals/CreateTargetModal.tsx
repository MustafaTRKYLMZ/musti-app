import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { MText, spacing, radii, useTheme } from "@musti/ui-native";
import { useTranslation } from "@musti/core";

import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { useToast } from "@/components/ui/ToastProvider";
import { CreateModal } from "@/components/ui/modals/CreateModal";
import { TargetForm } from "@/components/Books/forms/TargetForm";

import { useReadingTargetsStore } from "@/store/bookshelf/useReadingTargetsStore";
import { useBookSectionsStore } from "@/store/bookshelf/useBookSectionsStore";

import { useTargetFormController } from "@/components/Books/controllers/useTargetFormController";
import { useChipColors } from "@/hooks/useChipColors";

type CreateTargetModalProps = {
  visible: boolean;
  onClose: () => void;
  books: LocalPdfFile[];
  onOpenChapters: (bookUri: string, bookName: string) => void;
  initialBookUri?: string | null;
};

export const CreateTargetModal = ({
  visible,
  onClose,
  books,
  onOpenChapters,
  initialBookUri,
}: CreateTargetModalProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { showToast } = useToast();

  const chipColors = useChipColors();

  const addTarget = useReadingTargetsStore((s) => s.addTarget);
  const addItem = useReadingTargetsStore((s) => s.addItem);
  const deleteItem = useReadingTargetsStore((s) => s.deleteItem);
  const targets = useReadingTargetsStore((s) => s.targets);
  const setTargetRepeat = useReadingTargetsStore((s) => s.setTargetRepeat);

  const getResolvedSections = useBookSectionsStore(
    (s) => (s as any).getResolvedSections
  );

  const controllerBooks = useMemo(
    () => books.map((b) => ({ uri: b.uri, name: b.name })),
    [books]
  );

  const c = useTargetFormController({
    mode: "create",
    visible,
    books: controllerBooks,
    initialBookUri,
    getResolvedSections,
    addTarget,
    setTargetRepeat,
    addItem,
    showToast,
  });

  const currentTarget = useMemo(() => {
    if (!c.targetId) return null;
    return targets.find((t) => t.id === c.targetId) ?? null;
  }, [targets, c.targetId]);

  const canFinish = !!c.targetId && (currentTarget?.items?.length ?? 0) > 0;

  const handleClose = () => {
    c.resetAll();
    onClose();
  };

  const handleSave = () => {
    if (!canFinish) return;
    c.resetAll();
    onClose();
    showToast({ message: t("bookshelf.target.saved"), duration: 2000 });
  };

  return (
    <CreateModal
      visible={visible}
      onClose={handleClose}
      title={
        c.targetId ? t("bookshelf.target.editTitle") : t("bookshelf.target.newTitle")
      }
      sheetStyle={{ padding: spacing.lg }}
      footer={
        <Pressable
          onPress={handleSave}
          disabled={!canFinish}
          style={[
            styles.finish,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: colors.surfaceElevated,
              opacity: canFinish ? 1 : 0.5,
            },
          ]}
        >
          <MText style={{ fontWeight: "900" }}>
            {canFinish
              ? t("bookshelf.target.saveAndClose")
              : t("bookshelf.target.addAtLeastOneItem")}
          </MText>
        </Pressable>
      }
    >
      {!c.targetId ? (
        <Pressable
          onPress={c.createGroup}
          disabled={!c.canCreateGroup}
          style={[
            styles.primaryBtn,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: colors.surfaceElevated,
              opacity: c.canCreateGroup ? 1 : 0.5,
            },
          ]}
        >
          <MText style={styles.primaryBtnText} color="textPrimary">
            {t("bookshelf.target.createGroup")}
          </MText>
        </Pressable>
      ) : (
        <View
          style={[
            styles.lockPill,
            {
              borderColor: colors.borderSubtle,
              backgroundColor: colors.surface,
            },
          ]}
        >
          <MText style={{ fontWeight: "900", opacity: 0.7 }}>
            {t("bookshelf.target.created")}
          </MText>
        </View>
      )}

      <TargetForm
        {...c.formProps({
          chipColors,
          items: currentTarget?.items ?? [],
          canAddItem: c.canAddItem,
          addItemLabel: c.targetId
            ? t("bookshelf.target.addItem")
            : t("bookshelf.target.createGroupFirst"),
          onAddItem: c.addSelectedItem,
          onDeleteItem: (itemId) => {
            if (!currentTarget) return;
            deleteItem(currentTarget.id, itemId);
            showToast({
              message: t("bookshelf.target.itemRemoved"),
              duration: 1800,
            });
          },
          onOpenChapters,
        })}
      />
    </CreateModal>
  );
};

const styles = StyleSheet.create({
  primaryBtn: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  primaryBtnText: { fontWeight: "900" },
  lockPill: {
    alignSelf: "flex-start",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.full,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  finish: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
