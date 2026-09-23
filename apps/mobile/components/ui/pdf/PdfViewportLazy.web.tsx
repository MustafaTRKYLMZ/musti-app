import React, { FC } from "react";
import { View, StyleSheet } from "react-native";
import { MText } from "@musti/ui-native";

import type { PdfRef } from "./pdfTypes";

export type PdfViewportProps = {
  pdfRef?: React.RefObject<PdfRef | null>;
  captureRef?: React.RefObject<View | null>;
  source: { uri: string } | number;
  initialPage: number;
  backgroundColor: string;
  horizontal: boolean;
  enablePaging: boolean;
  onLoadComplete: (n: number, filePath?: string) => void;
  onError?: (e: unknown) => void;
  onPageChanged: (page: number, numberOfPages: number) => void;
  onLayoutSize: (w: number, h: number) => void;
  translateX: number;
  translateY: number;
  scale: number;
  onDoubleTap: () => void;
  onPinchUpdate?: (scale: number) => void;
  onPinchEnd?: (scale: number) => void;
};

export const PdfViewportLazy: FC<PdfViewportProps> = (props) => (
  <View style={[styles.center, { backgroundColor: props.backgroundColor }]}>
    <MText variant="body" color="textSecondary" style={styles.message}>
      PDF reading is not available on web.
    </MText>
  </View>
);

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    textAlign: "center",
  },
});
