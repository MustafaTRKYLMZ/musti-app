import React, { FC, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { MText, useTheme, radii, spacing } from "@musti/ui-native";

import { useReadingPace } from "@/hooks/useReadingPace";
import { formatDurationShort } from "@/utils/formatDuration";
import { clampBetween } from "@/utils/number";

type Props = {
  /** book-specific key; use bookUri when available */
  paceKey: string | null;

  /** pages left (plan: today remaining, target: range remaining) */
  remainingPages: number | null | undefined;

  /** optional label prefix, default "~" */
  prefix?: string;

  /** hide when remainingPages <= 0 (default true) */
  hideWhenDone?: boolean;

  /** text suffix, default " left" */
  suffix?: string;
};

const MIN_VALID_PPM = 0.2;
const MAX_VALID_PPM = 12;

export const RemainingTimeBadge: FC<Props> = ({
  paceKey,
  remainingPages,
  prefix = "~",
  suffix = " left",
  hideWhenDone = true,
}) => {
  const { colors } = useTheme();

  // paceKey null => hook falls back to DEFAULT_PPM internally (no storage read)
  const pace = useReadingPace({ paceKey });

  const label = useMemo(() => {
    if (typeof remainingPages !== "number" || !Number.isFinite(remainingPages))
      return null;

    const rp = Math.max(0, Math.floor(remainingPages));
    if (hideWhenDone && rp <= 0) return null;

    const safePpm = clampBetween(pace.ppm, MIN_VALID_PPM, MAX_VALID_PPM);
    const minutes = rp / safePpm;
    const ms = minutes * 60_000;

    return `${prefix}${formatDurationShort(ms)}${suffix}`;
  }, [remainingPages, pace.ppm, prefix, suffix, hideWhenDone]);

  if (!label) return null;

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: colors.surface, borderColor: colors.borderSubtle },
      ]}
    >
      <MText variant="caption" color="textSecondary" numberOfLines={1}>
        {label}
      </MText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
