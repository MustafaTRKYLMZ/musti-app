import { CropKey } from "@/components/ui/pdf/types";

export const ZOOM_PRESETS = [
  1,
  1.15,
  1.3,
  1.5,
  1.75,
  2.0,
  2.25,
  2.5,
] as const;

export type ZoomPreset = (typeof ZOOM_PRESETS)[number];

export type CropInsets = {
  l: number;
  r: number;
  t: number;
  b: number;
};

export const CROP_PRESETS: Record<CropKey, CropInsets> = {
  none: { l: 0, r: 0, t: 0, b: 0 },
  trim: { l: 0.04, r: 0.04, t: 0.06, b: 0.06 },
  tight: { l: 0.07, r: 0.07, t: 0.1, b: 0.1 },
};

export const PREFS_DEBOUNCE_MS = 250;

export const PREFS_VERSION = "v2";

export const DEDUPE_THRESHOLD_MS = 800;

export const TRACKING_PAUSE_BUFFER_MS = 120;

export const JUMP_THRESHOLD = 2;
