import React from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MText, spacing, radii, iconSizes, useTheme } from "@musti/ui-native";
import { IconButton } from "@musti/ui-native";

import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import type { PlanItemConfig } from "@musti/core";

import { usePlanFormController } from "@/components/Books/controllers/usePlanFormController";
import { PlanForm } from "@/components/Books/forms/PlanForm";

type Plan = {
  id: string;
  name: string;
  items: Array<{ bookUri: string; bookName: string; pagesPerDay: number }>;
};

type Props = {
  visible: boolean;
  planId: string | null;
  plan: Plan | null;
  books: LocalPdfFile[];
  onClose: () => void;

  updatePlan: (args: {
    planId: string;
    name: string;
    items: PlanItemConfig[];
  }) => void;
  deletePlan: (planId: string) => void;
  onDeleted?: () => void;
};

export function EditPlanModal({
  visible,
  planId,
  plan,
  books,
  onClose,
  updatePlan,
  deletePlan,
  onDeleted,
}: Props) {
  const { colors } = useTheme();

  const c = usePlanFormController({
    mode: "edit",
    visible,
    planId,
    plan,
    books,
    updatePlan,
    deletePlan,
    onClose,
    onDeleted,
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.backdrop, { backgroundColor: colors.backdropStrong }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.surface,
              borderTopColor: colors.borderSubtle,
              shadowColor: colors.shadowStrong,
            },
          ]}
        >
          <View style={styles.modalHeader}>
            <View style={{ flex: 1 }}>
              <MText variant="heading1" color="textPrimary" numberOfLines={1}>
                Edit plan
              </MText>
              <MText variant="caption" color="textSecondary" numberOfLines={1}>
                {plan?.name ?? ""}
              </MText>
            </View>

            <IconButton
              name="close-outline"
              size={iconSizes.lg}
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>

          <PlanForm
            mode="edit"
            subtitle={plan?.name ?? ""}
            books={books}
            control={c.control}
            errors={c.errors}
            fields={c.fields}
            availableBooks={c.availableBooks}
            bookItems={c.bookItems}
            selectedBookUri={c.selectedBookUri}
            setSelectedBookUri={c.setSelectedBookUri}
            pagesInput={c.pagesInput}
            setPagesInput={c.setPagesInput}
            multiSelectOpen={c.multiSelectOpen}
            toggleMultiSelectOpen={c.toggleMultiSelectOpen}
            closeMultiSelect={c.closeMultiSelect}
            multiSelected={c.multiSelected}
            toggleMultiBook={c.toggleMultiBook}
            addSelected={c.addSelected}
            addMultiSelected={c.addMultiSelected}
            removeAt={c.removeAt}
            updatePages={c.updatePages}
            setAllTargets={c.setAllTargets}
            clearAllTargets={c.clearAllTargets}
            addAllBooks={c.addAllBooks}
            removeAllBooks={c.removeAllBooks}
            setOrderFromDnd={c.setOrderFromDnd}
            onSave={c.save}
            onDelete={c.confirmDelete}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: "flex-end" },
  backdropTouchable: { flex: 1 },
  modalContent: {
    height: "86%",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  closeButton: { padding: spacing.xs },
});
