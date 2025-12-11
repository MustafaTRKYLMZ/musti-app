import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Pattern, Rect, Path } from "react-native-svg";

export function WoodGrainOverlay() {
  return (
    <Svg style={styles.overlay} pointerEvents="none">
      <Defs>
        <Pattern
          id="woodGrainPattern"
          x="0"
          y="0"
          width={320}
          height={140}
          patternUnits="userSpaceOnUse"
        >
          <Rect width="320" height="140" fill="transparent" />

          <Path
            d="M0 25 C 80 5, 160 45, 320 25"
            stroke="rgba(0,0,0,0.10)"
            strokeWidth={3}
            fill="none"
          />
          <Path
            d="M0 65 C 90 45, 170 85, 320 65"
            stroke="rgba(0,0,0,0.08)"
            strokeWidth={2}
            fill="none"
          />
          <Path
            d="M0 105 C 70 85, 150 125, 320 105"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={2}
            fill="none"
          />
        </Pattern>
      </Defs>

      <Rect width="100%" height="100%" fill="url(#woodGrainPattern)" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.8,
  },
});
