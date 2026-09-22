import React, { useRef, useState } from "react";
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

const SHUTTER_BAR_HEIGHT = 108;

type Props = {
  onCapture: (uri: string) => void;
  onClose?: () => void;
  onBack?: () => void;
  embedded?: boolean;
  busy?: boolean;
  hintText?: string;
  partLabel?: string;
};

export function ReceiptCameraView({
  onCapture,
  onClose,
  onBack,
  embedded = false,
  busy,
  hintText,
  partLabel,
}: Props) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const topInset = embedded ? spacing.sm : insets.top + spacing.sm;
  const bottomReserved =
    SHUTTER_BAR_HEIGHT + Math.max(insets.bottom, spacing.sm);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setLayout({ width, height });
  };

  const handleCapture = async () => {
    if (!cameraRef.current || capturing || busy) return;

    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.95,
        skipProcessing: false,
      });
      if (photo?.uri) {
        onCapture(photo.uri);
      }
    } catch {
      // stay on camera; user can retry
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
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        autofocus="on"
      />

      {layout.width > 0 ? (
        <ReceiptDocumentFrame
          layoutWidth={layout.width}
          layoutHeight={layout.height}
          topInset={topInset}
          bottomReserved={bottomReserved}
          hintText={hintText}
          partLabel={partLabel}
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
          styles.shutterBar,
          {
            height: bottomReserved,
            paddingBottom: Math.max(insets.bottom, spacing.sm),
          },
        ]}
      >
        <Pressable
          style={[styles.shutter, isBusy && styles.shutterDisabled]}
          onPress={handleCapture}
          disabled={isBusy}
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
  camera: {
    ...StyleSheet.absoluteFillObject,
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
});
