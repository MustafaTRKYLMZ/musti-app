import React, { useEffect, FC, useRef } from "react";
import { Animated, Text, StyleSheet, View, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { theme } from "@musti/core";
import { colors } from "@musti/ui-native";

type Props = {
  message: string;
  visible: boolean;
  onHide?: () => void;
};

export const CustomAlert: FC<Props> = ({ message, visible, onHide }) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => hide(), 2600);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onHide && onHide());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 20,
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,

    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",

    // shadow
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  text: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    fontWeight: "600",
    textAlign: "center",
  },
});
