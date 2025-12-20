import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  View,
  StyleSheet,
  Pressable,
  Modal,
  Platform,
} from "react-native";
import { MText, radii, spacing, useTheme } from "@budget/ui-native";
import type { ToastAction } from "./ToastProvider";

type ToastProps = {
  visible: boolean;
  title?: string;
  message: string;
  actions?: ToastAction[];
  onDismiss: () => void;
};

export const Toast = ({
  visible,
  title,
  message,
  actions,
  onDismiss,
}: ToastProps) => {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

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
              backgroundColor: colors.surface,
              borderColor: colors.borderSubtle,
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
              {actions.map((a, idx) => (
                <Pressable
                  key={`${a.label}-${idx}`}
                  onPress={() => {
                    onDismiss();
                    a.onPress();
                  }}
                  style={[
                    styles.actionBtn,
                    { borderColor: colors.borderSubtle },
                    a.destructive
                      ? {
                          borderColor: colors.danger,
                          backgroundColor: colors.danger + "1A",
                        }
                      : { backgroundColor: colors.surfaceElevated },
                  ]}
                >
                  <MText
                    variant="body"
                    numberOfLines={1}
                    style={[
                      styles.actionText,
                      a.destructive
                        ? { color: colors.danger }
                        : { color: colors.textPrimary },
                    ]}
                  >
                    {a.label}
                  </MText>
                </Pressable>
              ))}
            </View>
          ) : null}
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
    maxWidth: "94%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
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
