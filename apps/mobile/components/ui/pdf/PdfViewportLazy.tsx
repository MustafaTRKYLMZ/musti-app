import React, { FC, useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { MText, useTheme } from "@musti/ui-native";
import type { PdfRef } from "react-native-pdf";

type PdfModule = typeof import("react-native-pdf");

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
};

function loadPdfModule(): PdfModule | null {
  try {
    // Lazy require avoids crashing Expo Go at route registration time.
    return require("react-native-pdf") as PdfModule;
  } catch {
    return null;
  }
}

const NativePdfViewport = React.lazy(async () => {
  const mod = await import("./ PdfViewport");
  return { default: mod.PdfViewport };
});

export const PdfViewportLazy: FC<PdfViewportProps> = (props) => {
  const { colors } = useTheme();
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    setAvailable(loadPdfModule() != null);
  }, []);

  if (available === null) {
    return (
      <View style={[styles.center, { backgroundColor: props.backgroundColor }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!available) {
    return (
      <View style={[styles.center, { backgroundColor: props.backgroundColor }]}>
        <MText variant="body" color="textSecondary" style={styles.message}>
          PDF reading requires a development build. Expo Go does not include the
          native PDF module.
        </MText>
      </View>
    );
  }

  return (
    <React.Suspense
      fallback={
        <View style={[styles.center, { backgroundColor: props.backgroundColor }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      }
    >
      <NativePdfViewport {...props} />
    </React.Suspense>
  );
};

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
