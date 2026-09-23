import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  LayoutChangeEvent,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "@musti/core";
import { MText, colors, spacing, radii, iconSizes } from "@musti/ui-native";
import { IconButton } from "@musti/ui-native";
import { ReceiptDocumentFrame } from "@/components/receipt/ReceiptDocumentFrame";
import type { ReceiptCapture } from "@/services/receipt/receiptCapture";
import { computeReceiptFrameBounds } from "@/services/receipt/receiptFrame";
import {
  isDocumentScannerAvailable,
  scanReceiptDocument,
} from "@/services/receipt/scanReceiptDocument";

const SHUTTER_BAR_HEIGHT = 108;
const ALIGNMENT_DELAY_MS = 1200;
const STABILITY_THRESHOLD = 0.08;
const STABILITY_SAMPLES = 8;

type AccelerometerModule = {
  setUpdateInterval: (intervalMs: number) => void;
  addListener: (
    listener: (data: { x: number; y: number; z: number }) => void
  ) => { remove: () => void };
};

function loadAccelerometer(): AccelerometerModule | null {
  try {
    const { requireOptionalNativeModule } = require("expo-modules-core");
    if (!requireOptionalNativeModule("ExponentAccelerometer")) return null;
    return require("expo-sensors/build/Accelerometer").default;
  } catch {
    return null;
  }
}

type Props = {
  onCapture: (capture: ReceiptCapture) => void;
  onClose?: () => void;
  onBack?: () => void;
  onGalleryImport?: () => void;
  embedded?: boolean;
  busy?: boolean;
  hintText?: string;
  partLabel?: string;
  enableStabilityCapture?: boolean;
};

function pickLargestPictureSize(sizes: string[]): string | undefined {
  let best: string | undefined;
  let bestPixels = 0;

  for (const size of sizes) {
    const [wRaw, hRaw] = size.split("x");
    const width = Number(wRaw);
    const height = Number(hRaw);
    if (!Number.isFinite(width) || !Number.isFinite(height)) continue;
    const pixels = width * height;
    if (pixels > bestPixels) {
      bestPixels = pixels;
      best = size;
    }
  }

  return best;
}

export function ReceiptCameraView({
  onCapture,
  onClose,
  onBack,
  onGalleryImport,
  embedded = false,
  busy,
  hintText,
  partLabel,
  enableStabilityCapture = false,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const [cameraReady, setCameraReady] = useState(false);
  const [receiptAligned, setReceiptAligned] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [autofocusMode, setAutofocusMode] = useState<"on" | "off">("off");
  const [pictureSize, setPictureSize] = useState<string | undefined>();
  const [documentScannerAvailable, setDocumentScannerAvailable] = useState(false);
  const [deviceStable, setDeviceStable] = useState(false);
  const autoCaptureTriggeredRef = useRef(false);
  const recentMotionRef = useRef<number[]>([]);

  useEffect(() => {
    setDocumentScannerAvailable(isDocumentScannerAvailable());
  }, []);

  useEffect(() => {
    if (!enableStabilityCapture || !cameraReady) {
      setDeviceStable(false);
      recentMotionRef.current = [];
      return;
    }

    const Accelerometer = loadAccelerometer();
    if (!Accelerometer) {
      setDeviceStable(false);
      return;
    }

    Accelerometer.setUpdateInterval(120);
    const subscription = Accelerometer.addListener(({ x, y, z }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const delta = Math.abs(magnitude - 1);
      const samples = [...recentMotionRef.current, delta].slice(-STABILITY_SAMPLES);
      recentMotionRef.current = samples;
      const avg =
        samples.reduce((sum, value) => sum + value, 0) / Math.max(samples.length, 1);
      setDeviceStable(samples.length >= STABILITY_SAMPLES && avg < STABILITY_THRESHOLD);
    });

    return () => {
      subscription.remove();
      recentMotionRef.current = [];
    };
  }, [enableStabilityCapture, cameraReady, partLabel]);

  const topInset = embedded ? spacing.sm : insets.top + spacing.sm;
  const bottomReserved =
    SHUTTER_BAR_HEIGHT + Math.max(insets.bottom, spacing.sm);

  useEffect(() => {
    if (!cameraReady) {
      setReceiptAligned(false);
      autoCaptureTriggeredRef.current = false;
      return;
    }

    setReceiptAligned(false);
    autoCaptureTriggeredRef.current = false;
    const timer = setTimeout(() => setReceiptAligned(true), ALIGNMENT_DELAY_MS);
    return () => clearTimeout(timer);
  }, [cameraReady, partLabel, hintText]);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  const handleCameraReady = async () => {
    setCameraReady(true);
    try {
      const sizes = await cameraRef.current?.getAvailablePictureSizesAsync();
      if (sizes?.length) {
        setPictureSize(pickLargestPictureSize(sizes));
      }
    } catch {
      // fall back to default picture size
    }
  };

  const handleTapFocus = () => {
    if (!cameraReady || capturing || busy) return;
    setAutofocusMode("on");
    setTimeout(() => setAutofocusMode("off"), 700);
  };

  const buildCaptureMeta = (photoWidth: number, photoHeight: number) => {
    if (layout.width <= 0 || layout.height <= 0) return null;

    return {
      previewWidth: layout.width,
      previewHeight: layout.height,
      photoWidth,
      photoHeight,
      frame: computeReceiptFrameBounds({
        layoutWidth: layout.width,
        layoutHeight: layout.height,
        topInset,
        bottomReserved,
      }),
    };
  };

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || capturing || busy || !cameraReady) return;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1,
        skipProcessing: false,
      });
      if (photo?.uri && photo.width && photo.height) {
        onCapture({
          uri: photo.uri,
          meta: buildCaptureMeta(photo.width, photo.height),
        });
      }
    } catch {
      // stay on camera; user can retry
    } finally {
      setCapturing(false);
    }
  }, [busy, cameraReady, capturing, layout.height, layout.width, onCapture, topInset, bottomReserved]);

  useEffect(() => {
    if (
      !enableStabilityCapture ||
      !cameraReady ||
      !receiptAligned ||
      !deviceStable ||
      capturing ||
      busy ||
      autoCaptureTriggeredRef.current
    ) {
      return;
    }

    autoCaptureTriggeredRef.current = true;
    void handleCapture();
  }, [
    enableStabilityCapture,
    cameraReady,
    receiptAligned,
    deviceStable,
    capturing,
    busy,
    handleCapture,
  ]);

  const handleDocumentScan = async () => {
    if (capturing || busy) return;

    setCapturing(true);
    try {
      const uri = await scanReceiptDocument();
      if (uri) {
        onCapture({ uri, meta: null });
      }
    } catch {
      // user cancelled or scanner failed
    } finally {
      setCapturing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <MText variant="body" style={styles.permissionText}>
          {t("receipt.camera.permission")}
        </MText>
        <Pressable style={styles.permissionBtn} onPress={requestPermission}>
          <MText variant="bodyStrong" color="primary">
            {t("receipt.camera.grant")}
          </MText>
        </Pressable>
        {onClose ? (
          <IconButton
            name="close-outline"
            size={iconSizes.lg}
            onPress={onClose}
            style={styles.closeFallback}
          />
        ) : null}
      </View>
    );
  }

  const isBusy = capturing || busy;

  return (
    <View style={styles.root} onLayout={handleLayout}>
      <Pressable style={styles.cameraTapArea} onPress={handleTapFocus}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          autofocus={autofocusMode}
          enableTorch={torchEnabled}
          flash="auto"
          pictureSize={pictureSize}
          onCameraReady={handleCameraReady}
        />
      </Pressable>

      {layout.width > 0 ? (
        <ReceiptDocumentFrame
          layoutWidth={layout.width}
          layoutHeight={layout.height}
          topInset={topInset}
          bottomReserved={bottomReserved}
          hintText={hintText}
          partLabel={partLabel}
          aligned={cameraReady && receiptAligned}
        />
      ) : null}

      {capturing ? (
        <View style={styles.captureOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      ) : null}

      {!embedded && (onClose || onBack) ? (
        <View style={[styles.overlayTop, { paddingTop: insets.top + spacing.md }]}>
          {onBack ? (
            <IconButton
              name="arrow-back-outline"
              size={iconSizes.lg}
              onPress={onBack}
              color="#FFF"
            />
          ) : null}
          <View style={styles.spacer} />
          {onClose ? (
            <IconButton
              name="close-outline"
              size={iconSizes.lg}
              onPress={onClose}
              color="#FFF"
            />
          ) : null}
        </View>
      ) : null}

      <View
        style={[
          styles.toolsRow,
          { top: topInset + spacing.xs + (partLabel ? 42 : 28) },
        ]}
      >
        <Pressable
          style={[styles.toolBtn, torchEnabled && styles.toolBtnActive]}
          onPress={() => setTorchEnabled((current) => !current)}
          accessibilityRole="button"
          accessibilityLabel={
            torchEnabled ? t("receipt.camera.torchOn") : t("receipt.camera.torch")
          }
        >
          <MText variant="caption" style={styles.toolBtnText}>
            {torchEnabled ? t("receipt.camera.torchOn") : t("receipt.camera.torch")}
          </MText>
        </Pressable>

        {documentScannerAvailable ? (
          <Pressable
            style={styles.toolBtn}
            onPress={() => void handleDocumentScan()}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={t("receipt.camera.documentScan")}
          >
            <MText variant="caption" style={styles.toolBtnText}>
              {t("receipt.camera.documentScan")}
            </MText>
          </Pressable>
        ) : null}

        {onGalleryImport ? (
          <Pressable
            style={styles.toolBtn}
            onPress={onGalleryImport}
            disabled={isBusy}
            accessibilityRole="button"
            accessibilityLabel={t("receipt.camera.gallery")}
          >
            <MText variant="caption" style={styles.toolBtnText}>
              {t("receipt.camera.gallery")}
            </MText>
          </Pressable>
        ) : null}
      </View>

      {enableStabilityCapture && deviceStable && receiptAligned ? (
        <View style={styles.stabilityBadge}>
          <MText variant="caption" style={styles.stabilityText}>
            {t("receipt.camera.stable")}
          </MText>
        </View>
      ) : null}

      <View
        style={[
          styles.shutterBar,
          {
            height: bottomReserved,
            paddingBottom: Math.max(insets.bottom, spacing.sm),
          },
        ]}
      >
        <MText variant="caption" style={styles.focusHint}>
          {t("receipt.camera.tapToFocus")}
        </MText>
        <Pressable
          style={[styles.shutter, isBusy && styles.shutterDisabled]}
          onPress={handleCapture}
          disabled={isBusy || !cameraReady}
          accessibilityRole="button"
          accessibilityLabel={t("receipt.camera.capture")}
        >
          {capturing ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>
        <MText variant="caption" style={styles.captureLabel}>
          {t("receipt.camera.capture")}
        </MText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000",
    minHeight: 360,
  },
  cameraTapArea: {
    ...StyleSheet.absoluteFillObject,
  },
  camera: {
    flex: 1,
  },
  captureOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  permissionText: {
    textAlign: "center",
    marginBottom: spacing.md,
  },
  permissionBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  closeFallback: {
    marginTop: spacing.lg,
  },
  overlayTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  spacer: {
    flex: 1,
  },
  toolsRow: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.sm,
    zIndex: 3,
  },
  toolBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.35)",
  },
  toolBtnActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.75)",
  },
  toolBtnText: {
    color: "#FFF",
    fontWeight: "600",
  },
  shutterBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "flex-end",
    gap: spacing.xs,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  focusHint: {
    color: "rgba(255,255,255,0.82)",
    marginBottom: spacing.xs,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: "#FFF",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  shutterDisabled: {
    opacity: 0.6,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF",
  },
  captureLabel: {
    color: "#FFF",
    marginBottom: spacing.xs,
  },
  stabilityBadge: {
    position: "absolute",
    right: spacing.md,
    bottom: SHUTTER_BAR_HEIGHT + spacing.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: "rgba(34,197,94,0.35)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.5)",
  },
  stabilityText: {
    color: "#FFF",
    fontWeight: "600",
  },
});
