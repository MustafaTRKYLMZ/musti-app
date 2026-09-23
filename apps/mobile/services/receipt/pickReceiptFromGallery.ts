import type { ReceiptCapture } from "./receiptCapture";

type ImagePickerModule = typeof import("expo-image-picker");

function hasNativeModule(name: string): boolean {
  try {
    const { requireOptionalNativeModule } = require("expo-modules-core");
    return requireOptionalNativeModule(name) != null;
  } catch {
    return false;
  }
}

function loadImagePicker(): ImagePickerModule | null {
  if (!hasNativeModule("ExponentImagePicker")) return null;

  try {
    return require("expo-image-picker");
  } catch {
    return null;
  }
}

export function isGalleryImportAvailable(): boolean {
  return hasNativeModule("ExponentImagePicker");
}

export async function pickReceiptFromGallery(): Promise<ReceiptCapture | null> {
  try {
    const ImagePicker = loadImagePicker();
    if (!ImagePicker) return null;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return null;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 1,
      allowsEditing: false,
      exif: false,
    });

    if (result.canceled || result.assets.length === 0) return null;

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      meta: null,
    };
  } catch {
    return null;
  }
}
