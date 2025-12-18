import React, { FC, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  StyleProp,
  ViewStyle,
  LayoutChangeEvent,
} from "react-native";
import { spacing } from "@budget/ui-native";
import { ShelfPlank } from "./ShelfPlank";

export const SHELF_PLANK_HEIGHT = 46;
export const SHELF_PLANK_DEPTH = 22;
export const SHELF_PLANK_THICKNESS = 14;

type ShelfPlankWrapperProps = {
  style?: StyleProp<ViewStyle>;
};

export const ShelfPlankWrapper: FC<ShelfPlankWrapperProps> = ({ style }) => {
  const [rowWidth, setRowWidth] = useState(0);

  const handleLayout = useCallback(
    (e: LayoutChangeEvent) => {
      const width = e.nativeEvent.layout.width;
      if (width > 0 && rowWidth !== width) {
        setRowWidth(width);
      }
    },
    [rowWidth]
  );

  return (
    <View
      style={[styles.plankWrap, { height: SHELF_PLANK_HEIGHT }, style]}
      pointerEvents="none"
      onLayout={handleLayout}
    >
      {rowWidth > 0 && (
        <ShelfPlank
          width={rowWidth + spacing.lg * 3}
          height={SHELF_PLANK_HEIGHT}
          thickness={SHELF_PLANK_THICKNESS}
          depth={SHELF_PLANK_DEPTH}
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
  );
};

const styles = StyleSheet.create({
  plankWrap: {
    position: "absolute",
    left: -spacing.lg,
    right: -spacing.lg,
    bottom: 0,
  },
});
