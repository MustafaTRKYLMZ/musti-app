import { ReactNode, useMemo } from "react";
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
  useWindowDimensions,
} from "react-native";
import {
  MText,
  spacing,
  radii,
  iconSizes,
  useTheme,
  colors as defaultColors,
  IconButton,
  ThemeColors,
} from "@musti/ui-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type AppModalActions = {
  showCancel?: boolean;
  showDelete?: boolean;
  showSave?: boolean;

  cancelLabel?: string;
  deleteLabel?: string;
  saveLabel?: string;

  cancelIcon?: string;
  deleteIcon?: string;
  saveIcon?: string;

  onCancel?: () => void;
  onDelete?: () => void;
  onSave?: () => void;

  saveDisabled?: boolean;
  deleteDisabled?: boolean;
};

export type AppModalVariant = "center" | "sheet" | "full";

export type AppModalProps = {
  visible: boolean;
  title?: string;

  onClose: () => void;
  children: ReactNode;

  headerRight?: ReactNode;
  footer?: ReactNode;
  actions?: AppModalActions;

  closeOnBackdrop?: boolean;

  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  cardStyle?: ViewStyle;

  variant?: AppModalVariant;
  heightPct?: number;

  centerMaxWidth?: number;
  centerMaxHeightPct?: number;

  showClose?: boolean;
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

  centerMaxWidth = 460,
  centerMaxHeightPct = 92,

  showClose = true,
}: AppModalProps) {
  const insets = useSafeAreaInsets();

  const theme = useTheme?.();
  const colors = theme?.colors ?? defaultColors;

  const palette = useMemo(() => {
    const backdrop =
      (colors as ThemeColors).backdropStrong ??
      (colors as ThemeColors).backdrop ??
      "rgba(0,0,0,0.55)";

    const surface =
      (colors as ThemeColors).surface ??
      (colors as ThemeColors).surfaceStrong ??
      (colors as ThemeColors).backgroundSecondary ??
      (colors as ThemeColors).background ??
      "#FFF";

    const border =
      (colors as ThemeColors).borderSubtle ??
      (colors as ThemeColors).border ??
      "rgba(0,0,0,0.12)";

    const shadow =
      (colors as ThemeColors).shadowStrong ??
      (colors as ThemeColors).shadow ??
      "#000";

    const primary = (colors as ThemeColors).primary ?? "#2F6FED";

    const danger =
      (colors as any).danger ??
      (colors as any).error ??
      (colors as any).destructive ??
      "#EF4444";

    return { backdrop, surface, border, shadow, primary, danger };
  }, [colors]);

  const showActions =
    !!actions &&
    (actions.showCancel !== false ||
      actions.showDelete === true ||
      actions.showSave !== false ||
      !!actions.onDelete);

  const showCancel = showActions && (actions?.showCancel ?? true);
  const showSave = showActions && (actions?.showSave ?? true);

  const showDelete =
    showActions && ((actions?.showDelete ?? false) || !!actions?.onDelete);

  const cancelLabel = actions?.cancelLabel ?? "Cancel";
  const deleteLabel = actions?.deleteLabel ?? "Delete";
  const saveLabel = actions?.saveLabel ?? "Save";

  const cancelIcon = actions?.cancelIcon ?? "close-outline";
  const deleteIcon = actions?.deleteIcon ?? "trash-outline";
  const saveIcon = actions?.saveIcon ?? "checkmark-outline";

  const onCancel = actions?.onCancel ?? onClose;
  const onDelete = actions?.onDelete;
  const onSave = actions?.onSave;

  const saveDisabled = actions?.saveDisabled ?? false;
  const deleteDisabled = actions?.deleteDisabled ?? false;

  const bottomBarH = showActions ? 64 : 0;
  const bottomPad = bottomBarH + Math.max(insets.bottom, spacing.md);

  const isCenter = variant === "center";
  const isSheet = variant === "sheet";
  const isFull = variant === "full";

  const { height: SCREEN_H } = useWindowDimensions();

  const centerMinHeight = useMemo(() => {
    const raw = Math.floor(SCREEN_H * 0.62);
    return Math.max(360, Math.min(560, raw));
  }, [SCREEN_H]);

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
                minHeight: centerMinHeight,
              },
              cardStyle,
            ]}
          >
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

                {showClose ? (
                  <IconButton
                    name="close-outline"
                    size={iconSizes.lg}
                    onPress={onClose}
                    style={{ padding: spacing.xs }}
                    accessibilityLabel="Close"
                  />
                ) : null}
              </View>
            </View>

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

                  {showDelete && (
                    <View
                      style={[
                        styles.actionBtn,
                        { opacity: deleteDisabled ? 0.35 : 1 },
                      ]}
                    >
                      <IconButton
                        name={deleteIcon}
                        size={iconSizes.lg}
                        onPress={deleteDisabled ? undefined : onDelete}
                        color={palette.danger}
                      />
                      <MText
                        variant="caption"
                        style={{ color: palette.danger }}
                      >
                        {deleteLabel}
                      </MText>
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
