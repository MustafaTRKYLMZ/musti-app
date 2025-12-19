import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import { MText, radii, spacing, useTheme } from "@budget/ui-native";

export type ToastState = { visible: boolean; text: string };

type ToastProps = {
  visible: boolean;
  text: string;
};

export const Toast = ({ visible, text }: ToastProps) => {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration: visible ? 180 : 140,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  return (
    <View style={styles.toastWrap} pointerEvents="none">
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
        <MText variant="body" color="textPrimary" numberOfLines={2}>
          {text}
        </MText>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  toastWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: spacing["6xl"] + 16,
    alignItems: "center",
    paddingHorizontal: spacing.lg,
  },
  toast: {
    maxWidth: "94%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 6,
  },
});
