import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  View,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { MText, radii, spacing, useTheme, ThemeColors } from "@musti/ui-native";
import type { ToastAction, ToastVariant } from "./ToastProvider";

type ToastProps = {
  visible: boolean;
  title?: string;
  message: string;
  actions?: ToastAction[];
  variant?: ToastVariant; // ✅ NEW
  onDismiss: () => void;
};

export const Toast = ({
  visible,
  title,
  message,
  actions,
  variant = "default",
  onDismiss,
}: ToastProps) => {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  const palette = useMemo(() => {
    const surface =
      (colors as ThemeColors).surface ??
      (colors as ThemeColors).backgroundSecondary ??
      colors.background;

    const border =
      (colors as ThemeColors).borderSubtle ??
      (colors as ThemeColors).border ??
      "rgba(0,0,0,0.12)";

    const danger =
      (colors as any).danger ??
      (colors as any).error ??
      (colors as any).destructive ??
      "#EF4444";

    const success = (colors as any).success ?? "#22C55E";
    const warning = (colors as any).warning ?? "#F59E0B";
    const info =
      (colors as any).info ?? (colors as ThemeColors).primary ?? "#2F6FED";
    const primary = (colors as ThemeColors).primary ?? "#2F6FED";

    const accent =
      variant === "danger"
        ? danger
        : variant === "success"
        ? success
        : variant === "warning"
        ? warning
        : variant === "info"
        ? info
        : primary;

    return { surface, border, danger, accent };
  }, [colors, variant]);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 140,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  const wrapPointerEvents = useMemo(
    () => (visible ? ("box-none" as const) : ("none" as const)),
    [visible]
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      presentationStyle="overFullScreen"
      statusBarTranslucent={Platform.OS === "android"}
      onRequestClose={onDismiss}
    >
      <View style={styles.toastWrap} pointerEvents={wrapPointerEvents}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onDismiss} />

        <Animated.View
          style={[
            styles.toast,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
              opacity: anim,
              transform: [
                {
                  translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [18, 0],
                  }),
                },
                {
                  scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.98, 1],
                  }),
                },
              ],
            },
          ]}
        >
          {/* accent bar */}
          <View style={[styles.accent, { backgroundColor: palette.accent }]} />

          <View style={{ flex: 1 }}>
            {title ? (
              <MText
                variant="body"
                color="textPrimary"
                numberOfLines={1}
                style={styles.title}
              >
                {title}
              </MText>
            ) : null}

            <MText variant="body" color="textPrimary" numberOfLines={2}>
              {message}
            </MText>

            {actions?.length ? (
              <View style={styles.actionsRow}>
                {actions.map((a, idx) => {
                  const isDestructive = !!a.destructive;
                  const btnBorder = isDestructive
                    ? palette.danger
                    : palette.border;
                  const btnBg = isDestructive
                    ? `${palette.danger}1A`
                    : palette.surface;

                  return (
                    <Pressable
                      key={`${a.label}-${idx}`}
                      onPress={() => {
                        onDismiss();
                        a.onPress();
                      }}
                      style={[
                        styles.actionBtn,
                        { borderColor: btnBorder, backgroundColor: btnBg },
                      ]}
                    >
                      <MText
                        variant="body"
                        numberOfLines={1}
                        style={[
                          styles.actionText,
                          isDestructive
                            ? { color: palette.danger }
                            : { color: colors.textPrimary },
                        ]}
                      >
                        {a.label}
                      </MText>
                    </Pressable>
                  );
                })}
              </View>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  toastWrap: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing["6xl"] + 16,
  },
  toast: {
    width: "100%",
    maxWidth: 460,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
    flexDirection: "row",
    gap: spacing.md,
  },
  accent: {
    width: 4,
    borderRadius: 999,
    opacity: 0.9,
  },
  title: {
    fontWeight: "900",
    marginBottom: spacing.xs,
  },

  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
    justifyContent: "flex-end",
  },
  actionBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
  },
  actionText: {
    fontWeight: "900",
  },
});
