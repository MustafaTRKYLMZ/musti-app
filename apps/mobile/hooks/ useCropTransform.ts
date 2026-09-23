import { useMemo, useState } from "react";
import { CROP_PRESETS, ZOOM_PRESETS } from "@/constants/readerPresets";
import { CropKey } from "@/components/ui/pdf/types";

export function useCropTransform(cropKey: CropKey, zoomPresetIndex: number) {
  const [viewerSize, setViewerSize] = useState({ w: 0, h: 0 });

  const userScale = ZOOM_PRESETS[zoomPresetIndex] ?? 1;
  const crop = CROP_PRESETS[cropKey];

  const cropTransform = useMemo(() => {
    const W = viewerSize.w;
    const H = viewerSize.h;
    if (W <= 0 || H <= 0) return { cropScale: 1, tx: 0, ty: 0 };

    const visibleW = W * (1 - crop.l - crop.r);
    const visibleH = H * (1 - crop.t - crop.b);

    const cropScale = Math.max(W / Math.max(1, visibleW), H / Math.max(1, visibleH));

    const tx = -W * (crop.l - crop.r) * 0.5 * cropScale;
    const ty = -H * (crop.t - crop.b) * 0.5 * cropScale;

    return { cropScale, tx, ty };
  }, [viewerSize.w, viewerSize.h, crop.l, crop.r, crop.t, crop.b]);

  const visualScale = userScale * cropTransform.cropScale;

  return {
    viewerSize,
    setViewerSize,
    userScale,
    visualScale,
    cropTransform,
  };
}
