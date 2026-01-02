import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Controller } from "react-hook-form";
import { MText, spacing, radii, useTheme } from "@budget/ui-native";
import { useRenameBookController } from "@/components/Books/controllers/useRenameBookController";

type Props = {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onConfirm: (nextName: string) => Promise<void> | void;
};

export const RenameBookModal = ({
  visible,
  currentName,
  onClose,
  onConfirm,
}: Props) => {
  const { colors } = useTheme();

  const c = useRenameBookController({
    visible,
    currentName,
    onClose,
    onConfirm,
  });

  const lastPrefillRef = useRef<string>("");

  useEffect(() => {
    if (!visible) {
      lastPrefillRef.current = "";
      return;
    }

    const next = (currentName ?? "").trim();

    if (lastPrefillRef.current === next) return;
    lastPrefillRef.current = next;

    c.setValue("name", next, { shouldDirty: false, shouldTouch: false });
  }, [visible, currentName]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.overlay, { backgroundColor: colors.backdropStrong }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />

        {/* dialog */}
        <View
          style={[
            styles.box,
            {
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
            },
          ]}
        >
          <MText variant="bodyStrong" color="textPrimary" style={styles.title}>
            Rename book
          </MText>

          <Controller
            control={c.control}
            name="name"
            render={({ field: { value, onChange } }) => (
              <TextInput
                value={value}
                onChangeText={onChange}
                style={[
                  styles.input,
                  {
                    borderColor: colors.borderSubtle,
                    color: colors.textPrimary,
                    backgroundColor: colors.surface,
                  },
                ]}
                placeholder="Book name"
                placeholderTextColor={colors.textSecondary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={c.submit}
              />
            )}
          />

          {c.errors.name?.message ? (
            <MText
              variant="caption"
              color="danger"
              style={{ marginTop: spacing.xs }}
            >
              {String(c.errors.name.message)}
            </MText>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.button,
                styles.cancelBtn,
                { borderColor: colors.borderSubtle },
              ]}
              disabled={c.isSubmitting}
            >
              <MText variant="body" color="textSecondary">
                Cancel
              </MText>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={c.submit}
              style={[
                styles.button,
                styles.saveBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: c.canSubmit ? 1 : 0.7,
                },
              ]}
              disabled={!c.canSubmit || c.isSubmitting}
            >
              <MText variant="body" color="textInverse">
                Save
              </MText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  box: {
    width: "100%",
    borderRadius: radii.lg,
    padding: spacing.lg,
    borderWidth: 1,
  },
  title: { marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
  },
  cancelBtn: { borderWidth: 1 },
  saveBtn: {},
});
