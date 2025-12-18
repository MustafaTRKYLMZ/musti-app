import React, { FC, ReactNode, useState } from "react";
import { View, StyleSheet } from "react-native";
import { spacing } from "@budget/ui-native";
import { ShelfPlank } from "./ShelfPlank";

type BookShelfProps = {
  children: ReactNode;
  bookSink?: number;
  onLayoutWidth?: (width: number) => void;
};

const PLANK_H = 46;
const PLANK_DEPTH = 22;
const PLANK_THICK = 14;

export const BookShelf: FC<BookShelfProps> = ({
  children,
  bookSink = 12,
  onLayoutWidth,
}) => {
  const [rowWidth, setRowWidth] = useState(0);

  return (
    <View
      style={[styles.container, { paddingBottom: PLANK_H - 12 }]}
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width;
        if (!rowWidth) {
          setRowWidth(width);
          onLayoutWidth?.(width);
        }
      }}
    >
      {/* Shelf Plank */}
      <View style={[styles.plankWrap, { height: PLANK_H }]} pointerEvents="none">
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
      <View style={{ transform: [{ translateY: bookSink }] }}>
        {children}
      </View>
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
