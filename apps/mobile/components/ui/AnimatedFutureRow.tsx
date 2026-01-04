import React, { useEffect, useRef } from "react";
import { Animated, Easing } from "react-native";

type AnimatedVariant = "softPop" | "slideUp" | "springBounce";

interface AnimatedFutureRowProps {
  children: React.ReactNode;
  visible: boolean;
  variant?: AnimatedVariant;
  index?: number;
}

export const AnimatedFutureRow = ({
  children,
  visible,
  variant = "softPop",
  index,
}: AnimatedFutureRowProps) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) return;

    opacity.setValue(0);
    translateY.setValue(8);
    scale.setValue(0.97);

    const delay = index != null ? index * 25 : 0;

    let animation: Animated.CompositeAnimation;

    switch (variant) {
      case "softPop":
        animation = Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 180,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 180,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 180,
            delay,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]);
        break;

      case "slideUp":
        animation = Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 200,
            delay,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            delay,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]);
        break;

      case "springBounce":
        animation = Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 160,
            delay,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            speed: 16,
            bounciness: 7,
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            speed: 16,
            bounciness: 7,
            useNativeDriver: true,
          }),
        ]);
        break;
    }

    animation.start();
  }, [visible, variant, index, opacity, translateY, scale]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    >
      {children}
    </Animated.View>
  );
};
