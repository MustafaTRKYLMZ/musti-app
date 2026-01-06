import React, { ReactNode, useMemo } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ScrollViewProps,
  ViewStyle,
} from "react-native";
import {
  MText,
  spacing,
  radii,
  iconSizes,
  useTheme,
  colors as defaultColors,
  IconButton,
} from "@musti/ui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AppModalActions = {
  showCancel?: boolean;
  showSave?: boolean;

  cancelLabel?: string; // default "Cancel"
  saveLabel?: string; // default "Save"

  cancelIcon?: string; // default "close-outline"
  saveIcon?: string; // default "checkmark-outline"

  onCancel?: () => void; // default onClose
  onSave?: () => void;

  saveDisabled?: boolean;
};

export type AppModalVariant = "center" | "sheet" | "full";

export type AppModalProps = {
  visible: boolean;
  title?: string;

  onClose: () => void;
  children: ReactNode;

  /** top right extra controls before close button */
  headerRight?: ReactNode;

  /** Optional content below children but still scrolls */
  footer?: ReactNode;

  /** Fixed bottom actions (Samsung style) */
  actions?: AppModalActions;

  /** Close when tapping backdrop */
  closeOnBackdrop?: boolean;

  /** scroll props */
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];

  /** card styling */
  cardStyle?: ViewStyle;

  /** "center" | "sheet" | "full" */
  variant?: AppModalVariant;

  /** for sheet */
  heightPct?: number;

  /** center sizing */
  centerMaxWidth?: number;
  centerMaxHeightPct?: number; // default 82
};

export function AppModal({
  visible,
  title,
  onClose,
  children,

  headerRight,
  footer,
  actions,

  closeOnBackdrop = true,
  contentContainerStyle,
  cardStyle,

  variant = "sheet",
  heightPct = 86,

  centerMaxWidth = 460, // ⬅️ biraz geniş
  centerMaxHeightPct = 92, // ⬅️ ciddi fark
}: AppModalProps) {
  const insets = useSafeAreaInsets();

  const theme = useTheme?.();
  const colors = theme?.colors ?? defaultColors;

  const palette = useMemo(() => {
    const backdrop =
      (colors as any).backdropStrong ??
      (colors as any).backdrop ??
      "rgba(0,0,0,0.55)";

    const surface =
      (colors as any).surface ??
      (colors as any).surfaceStrong ??
      (colors as any).backgroundSecondary ??
      (colors as any).background ??
      "#FFF";

    const border =
      (colors as any).borderSubtle ??
      (colors as any).border ??
      "rgba(0,0,0,0.12)";

    const shadow =
      (colors as any).shadowStrong ?? (colors as any).shadow ?? "#000";

    const primary = (colors as any).primary ?? "#2F6FED";

    return { backdrop, surface, border, shadow, primary };
  }, [colors]);

  const showActions =
    !!actions && (actions.showCancel !== false || actions.showSave !== false);

  const showCancel = showActions && (actions?.showCancel ?? true);
  const showSave = showActions && (actions?.showSave ?? true);

  const cancelLabel = actions?.cancelLabel ?? "Cancel";
  const saveLabel = actions?.saveLabel ?? "Save";

  const cancelIcon = actions?.cancelIcon ?? "close-outline";
  const saveIcon = actions?.saveIcon ?? "checkmark-outline";

  const onCancel = actions?.onCancel ?? onClose;
  const onSave = actions?.onSave;
  const saveDisabled = actions?.saveDisabled ?? false;

  const bottomBarH = showActions ? 64 : 0; // ⬅️ biraz daha rahat
  const bottomPad = bottomBarH + Math.max(insets.bottom, spacing.md);

  const isCenter = variant === "center";
  const isSheet = variant === "sheet";
  const isFull = variant === "full";

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={!isFull}
      animationType={isCenter ? "fade" : "slide"}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[
          styles.root,
          isFull ? { backgroundColor: palette.surface } : null,
        ]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {!isFull && (
          <>
            <View
              style={[
                StyleSheet.absoluteFillObject,
                { backgroundColor: palette.backdrop },
              ]}
            />
            <TouchableOpacity
              style={styles.backdropTouchable}
              activeOpacity={1}
              onPress={closeOnBackdrop ? onClose : undefined}
            />
          </>
        )}

        <View
          style={[
            isFull
              ? styles.fullWrap
              : isSheet
              ? styles.sheetWrap
              : styles.centerWrap,
          ]}
        >
          <View
            style={[
              isFull
                ? styles.fullCard
                : isSheet
                ? styles.sheetCard
                : styles.centerCard,

              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
                shadowColor: palette.shadow,
              },

              isSheet ? { height: `${heightPct}%` } : null,

              isCenter && {
                maxWidth: centerMaxWidth,
                maxHeight: `${centerMaxHeightPct}%`,
                minHeight: "70%",
              },

              cardStyle,
            ]}
          >
            {/* HEADER */}
            <View style={styles.headerRow}>
              <View style={styles.titleWrapper}>
                {!!title && (
                  <MText variant="heading3" numberOfLines={1}>
                    {title}
                  </MText>
                )}
              </View>

              <View style={styles.headerRight}>
                {headerRight}
                <IconButton
                  name="close-outline"
                  size={iconSizes.lg}
                  onPress={onClose}
                  style={{ padding: spacing.xs }}
                />
              </View>
            </View>

            {/* BODY */}
            <ScrollView
              style={{ flex: 1 }}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.contentContainer,
                { paddingBottom: bottomPad },
                contentContainerStyle,
              ]}
            >
              {children}
              {footer && <View style={styles.footer}>{footer}</View>}
            </ScrollView>

            {/* ACTIONS */}
            {showActions && (
              <View
                style={[
                  styles.actionsWrap,
                  {
                    borderTopColor: palette.border,
                    paddingBottom: Math.max(insets.bottom, spacing.md),
                  },
                ]}
              >
                <View style={styles.actionsRow}>
                  {showCancel && (
                    <View style={styles.actionBtn}>
                      <IconButton
                        name={cancelIcon}
                        size={iconSizes.lg}
                        onPress={onCancel}
                      />
                      <MText variant="caption">{cancelLabel}</MText>
                    </View>
                  )}

                  {showSave && (
                    <View
                      style={[
                        styles.actionBtn,
                        { opacity: saveDisabled ? 0.35 : 1 },
                      ]}
                    >
                      <IconButton
                        name={saveIcon}
                        size={iconSizes.lg}
                        onPress={saveDisabled ? undefined : onSave}
                        color={palette.primary}
                      />
                      <MText
                        variant="caption"
                        style={{ color: palette.primary }}
                      >
                        {saveLabel}
                      </MText>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "flex-end",
    marginTop: spacing.lg,

    marginBottom: spacing["4xl"],
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFillObject,
  },

  // presentations
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  sheetWrap: {
    justifyContent: "flex-end",
  },
  fullWrap: {
    flex: 1,
  },

  // cards
  centerCard: {
    width: "100%",
    borderRadius: radii.lg,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    overflow: "hidden",
    minHeight: 260,
  },
  sheetCard: {
    width: "100%",
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    overflow: "hidden",
  },
  fullCard: {
    flex: 1,
    width: "100%",
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleWrapper: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },

  body: {
    marginTop: spacing.xs,
  },
  footer: {
    marginTop: spacing.md,
  },

  actionsWrap: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    minHeight: 56,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
  },
});
