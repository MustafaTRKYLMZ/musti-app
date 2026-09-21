import { ZOOM_PRESETS } from "@/constants/readerPresets";

export function findNearestZoomPresetIndex(scale: number): number {
  const clamped = Math.max(
    ZOOM_PRESETS[0],
    Math.min(ZOOM_PRESETS[ZOOM_PRESETS.length - 1], scale)
  );

  let best = 0;
  let bestDiff = Infinity;

  for (let i = 0; i < ZOOM_PRESETS.length; i++) {
    const diff = Math.abs(ZOOM_PRESETS[i] - clamped);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }

  return best;
}
