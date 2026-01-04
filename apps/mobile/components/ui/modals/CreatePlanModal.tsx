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
import { IconButton } from "@/components/ui/AppIcon";

import type { LocalPdfFile } from "@/utils/getPdfsDirectory";
import { useReadingPlanStore } from "@/store/bookshelf/useReadingPlanStore";

import { usePlanFormController } from "@/components/Books/controllers/usePlanFormController";
import { PlanForm } from "@/components/Books/forms/PlanForm";

type Props = {
  visible: boolean;
  onClose: () => void;
  books: LocalPdfFile[];
};

export function CreatePlanModal({ visible, onClose, books }: Props) {
  const { colors } = useTheme();
  const createPlan = useReadingPlanStore((s) => s.createPlan);

  const c = usePlanFormController({
    mode: "create",
    visible,
    books,
    createPlan,
    onClose,
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
            <MText variant="heading1" color="textPrimary">
              Create plan
            </MText>

            <IconButton
              name="close-outline"
              size={iconSizes.lg}
              onPress={onClose}
              style={styles.closeButton}
            />
          </View>

          <PlanForm
            mode="create"
            subtitle=""
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
  },
  closeButton: { padding: spacing.xs },
});
