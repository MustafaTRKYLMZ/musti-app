import React, { FC, ReactNode, useState } from "react";
import { View, StyleSheet } from "react-native";
import { spacing } from "@budget/ui-native";
import { ShelfPlank } from "./ShelfPlank";

type BookshelfRowProps = {
  children: ReactNode;
  plankHeight?: number;
  plankDepth?: number;
  plankThickness?: number;
  bookSink?: number;
  style?: any;
};

export const BookshelfRow: FC<BookshelfRowProps> = ({
  children,
  plankHeight = 46,
  plankDepth = 22,
  plankThickness = 14,
  bookSink = 12,
  style,
}) => {
  const [rowWidth, setRowWidth] = useState(0);

  return (
    <View
      style={[
        styles.container,
        { paddingBottom: plankHeight - 12 },
        style,
      ]}
      onLayout={(e) => {
        if (!rowWidth) setRowWidth(e.nativeEvent.layout.width);
      }}
    >
      {/* Shelf Plank */}
      <View
        style={[styles.plankWrap, { height: plankHeight }]}
        pointerEvents="none"
      >
        {rowWidth > 0 && (
          <ShelfPlank
            width={rowWidth + spacing.lg * 3}
            height={plankHeight}
            thickness={plankThickness}
            depth={plankDepth}
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

      {/* Books Container */}
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
