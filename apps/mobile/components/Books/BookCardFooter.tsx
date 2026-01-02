// apps/mobile/components/ui/Books/BookCardFooter.tsx
import React, { FC, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import {
  bookshelfTheme,
  iconSizes,
  MText,
  radii,
  spacing,
} from "@budget/ui-native";
import { BaseIcon } from "@/components/ui/AppIcon";

const { colors } = bookshelfTheme;

type Props = {
  file: { uri: string; name: string };
  todayLabel: string | null;
  totalPages?: number;
  progress: number; // 0..1
  width: number;
  compact?: boolean;
};

function compactToday(label: string) {
  return label.replace(/^Today:\s*/i, "").trim();
}

export const BookCardFooter: FC<Props> = ({
  file,
  todayLabel,
  totalPages,
  progress,
  width,
  compact = false,
}) => {
  const todayText = useMemo(() => {
    if (!todayLabel) return null;
    return compact ? compactToday(todayLabel) : todayLabel;
  }, [todayLabel, compact]);

  const pct = useMemo(() => {
    const p = Number.isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : 0;
    return Math.round(p * 100);
  }, [progress]);

  const showProgress = !!totalPages && totalPages > 0;

  return (
    <View style={[styles.footer, { width }]}>
      {/* title */}
      <MText
        variant="caption"
        color="textPrimary"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.title}
      >
        {file.name}
      </MText>

      {/* progress */}
      {showProgress && (
        <View style={styles.progressWrap}>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: colors.borderSubtle },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                { width: `${pct}%`, backgroundColor: colors.success },
              ]}
            />
          </View>

          <MText
            variant="caption"
            color="textSecondary"
            numberOfLines={1}
            style={styles.pct}
          >
            {pct}%
          </MText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    borderRadius: radii.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colors.surfaceStrong,
    overflow: "hidden",
    gap: spacing.xs,
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "flex-start",
  },

  title: {
    fontSize: 12,
    lineHeight: 14,
    textAlign: "center",
  },

  todayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },

  todayText: {
    minWidth: 0,
    flexShrink: 1,
  },

  progressWrap: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },

  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 4,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
  },

  pct: {
    width: 42,
    textAlign: "right",
  },
});
