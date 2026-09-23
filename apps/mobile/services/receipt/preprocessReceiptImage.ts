import type { ReceiptCaptureMeta } from "./receiptCapture";
import { mapPreviewFrameToPhotoCrop } from "./receiptFrame";

const TARGET_MIN_WIDTH = 2200;
const TARGET_MAX_WIDTH = 3200;

export type ReceiptImageVariant = {
  id: "preprocessed" | "raw" | "upscaled";
  uri: string;
};

function pickTargetWidth(currentWidth: number): number | null {
  if (currentWidth < TARGET_MIN_WIDTH) return TARGET_MIN_WIDTH;
  if (currentWidth > TARGET_MAX_WIDTH) return TARGET_MAX_WIDTH;
  return null;
}

type ImageManipulatorModule = {
  ImageManipulator: {
    manipulate: (uri: string) => {
      crop: (rect: {
        originX: number;
        originY: number;
        width: number;
        height: number;
      }) => unknown;
      resize: (size: { width: number }) => unknown;
      renderAsync: () => Promise<{
        saveAsync: (options: {
          format: string;
          compress?: number;
        }) => Promise<{ uri: string }>;
      }>;
    };
  };
  SaveFormat: { JPEG: string };
};

function loadImageManipulator(): ImageManipulatorModule | null {
  try {
    return require("expo-image-manipulator");
  } catch {
    return null;
  }
}

async function saveManipulated(
  ImageManipulator: ImageManipulatorModule,
  uri: string,
  mutate: (context: ReturnType<
    ImageManipulatorModule["ImageManipulator"]["manipulate"]
  >) => void
): Promise<string | null> {
  try {
    const context = ImageManipulator.ImageManipulator.manipulate(uri);
    mutate(context);
    const rendered = await context.renderAsync();
    const saved = await rendered.saveAsync({
      format: ImageManipulator.SaveFormat.JPEG,
      compress: 0.98,
    });
    return saved.uri;
  } catch {
    return null;
  }
}

export async function buildReceiptImageVariants(
  uri: string,
  meta?: ReceiptCaptureMeta | null
): Promise<ReceiptImageVariant[]> {
  const variants: ReceiptImageVariant[] = [{ id: "raw", uri }];

  const ImageManipulator = loadImageManipulator();
  if (!ImageManipulator) return variants;

  if (meta) {
    try {
      const crop = mapPreviewFrameToPhotoCrop(
        meta.frame,
        { width: meta.previewWidth, height: meta.previewHeight },
        { width: meta.photoWidth, height: meta.photoHeight }
      );

      const preprocessed = await saveManipulated(
        ImageManipulator,
        uri,
        (context) => {
          context.crop(crop);
          const targetWidth = pickTargetWidth(crop.width);
          if (targetWidth) context.resize({ width: targetWidth });
        }
      );
      if (preprocessed) {
        variants.push({ id: "preprocessed", uri: preprocessed });
      }

      const upscaled = await saveManipulated(ImageManipulator, uri, (context) => {
        context.resize({ width: TARGET_MAX_WIDTH });
      });
      if (upscaled && upscaled !== uri) {
        variants.push({ id: "upscaled", uri: upscaled });
      }
    } catch {
      // fall back to raw only
    }
  }

  return variants;
}

export async function preprocessReceiptImage(
  uri: string,
  meta?: ReceiptCaptureMeta | null
): Promise<string> {
  const variants = await buildReceiptImageVariants(uri, meta);
  return variants.find((variant) => variant.id === "preprocessed")?.uri ?? uri;
}
