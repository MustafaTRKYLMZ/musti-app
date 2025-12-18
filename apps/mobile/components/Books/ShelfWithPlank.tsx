import React, { FC, ReactNode, useState } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { spacing } from "@budget/ui-native";
import { ShelfPlank } from "./ShelfPlank";

type ShelfWithPlankProps = {
  children: ReactNode;
  containerStyle?: ViewStyle;
  onLayout?: (width: number) => void;
};

const PLANK_H = 46;
const PLANK_DEPTH = 22;
const PLANK_THICK = 14;

export const ShelfWithPlank: FC<ShelfWithPlankProps> = ({
  children,
  containerStyle,
  onLayout,
}) => {
  const [rowWidth, setRowWidth] = useState(0);

  return (
    <View
      style={[styles.container, containerStyle]}
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width;
        if (width !== rowWidth) {
          setRowWidth(width);
          onLayout?.(width);
        }
      }}
    >
      {/* Shelf Plank */}
      <View
        style={[styles.plankWrap, { height: PLANK_H }]}
        pointerEvents="none"
      >
        {rowWidth > 0 && (
          <ShelfPlank
            width={rowWidth + spacing.lg * 3}
            height={PLANK_H}
            thickness={PLANK_THICK}
            depth={PLANK_DEPTH}
            skewX={16}
            skewY={10}
            radius={4}
            brightness={0.75}
            accent
            accentHeight={2}
            accentGlow={false}
          />
        )}
      </View>

      {/* Content */}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  plankWrap: {
    position: "absolute",
    left: -spacing.lg,
    right: -spacing.lg,
    bottom: 0,
  },
});

export { PLANK_H };
