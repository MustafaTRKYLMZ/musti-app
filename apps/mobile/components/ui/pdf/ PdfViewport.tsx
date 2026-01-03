import React, { FC, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import Pdf, { PdfRef } from "react-native-pdf";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";

type Props = {
  pdfRef?: React.RefObject<PdfRef | null>;
  captureRef?: React.RefObject<View | null>; // ✅ NEW
  source: { uri: string } | number;
  initialPage: number;

  backgroundColor: string;

  horizontal: boolean;
  enablePaging: boolean;

  onLoadComplete: (n: number, filePath?: string) => void;
  onError?: (e: any) => void;
  onPageChanged: (page: number, numberOfPages: number) => void;

  onLayoutSize: (w: number, h: number) => void;

  // transform
  translateX: number;
  translateY: number;
  scale: number;

  onDoubleTap: () => void;
};

export const PdfViewport: FC<Props> = ({
  pdfRef,
  captureRef,
  source,
  initialPage,
  backgroundColor,
  horizontal,
  enablePaging,
  onLoadComplete,
  onError,
  onPageChanged,
  onLayoutSize,
  translateX,
  translateY,
  scale,
  onDoubleTap,
}) => {
  const doubleTapGesture = useMemo(() => {
    return Gesture.Tap()
      .numberOfTaps(2)
      .maxDelay(250)
      .onEnd(() => {
        runOnJS(onDoubleTap)();
      });
  }, [onDoubleTap]);

  return (
    <View
      style={[styles.viewer, { backgroundColor }]}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        onLayoutSize(width, height);
      }}
    >
      <GestureDetector gesture={doubleTapGesture}>
        <View style={styles.cropClip}>
          {/* ✅ Wrap Pdf with captureRef so we screenshot only this area */}
          <View ref={captureRef} style={styles.captureWrap} collapsable={false}>
            <Pdf
              ref={pdfRef}
              source={source}
              style={[
                styles.pdf,
                {
                  backgroundColor,
                  transform: [{ translateX }, { translateY }, { scale }],
                },
              ]}
              horizontal={horizontal}
              enablePaging={enablePaging}
              page={initialPage}
              scale={1}
              minScale={1}
              maxScale={1}
              enableDoubleTapZoom={false}
              fitPolicy={2}
              onLoadComplete={onLoadComplete}
              onError={onError}
              onPageChanged={onPageChanged}
            />
          </View>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  viewer: { flex: 1 },
  cropClip: { flex: 1, overflow: "hidden" },
  captureWrap: { flex: 1 },
  pdf: { flex: 1, width: "100%", height: "100%" },
});
