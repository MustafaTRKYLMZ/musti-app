import React, { FC, useMemo } from "react";
import { View, StyleSheet } from "react-native";
import { bookshelfTheme, MText, radii } from "@musti/ui-native";

const { colors } = bookshelfTheme;

/** Fixed in-book nameplate — title + optional progress, no layout shift. */
export const BOOK_NAMEPLATE_HEIGHT = 34;

/** Horizontal inset from book edges (smaller = wider nameplate). */
export const BOOK_NAMEPLATE_INSET_X = 12;

type Props = {
  file: { uri: string; name: string };
  totalPages?: number;
  progress: number;
  width: number;
};

export const BookCardFooter: FC<Props> = ({
  file,
  totalPages,
  progress,
  width,
}) => {
  const pct = useMemo(() => {
    const p = Number.isFinite(progress)
      ? Math.max(0, Math.min(1, progress))
      : 0;
    return Math.round(p * 100);
  }, [progress]);

  const showProgress = !!totalPages && totalPages > 0;

  return (
    <View
      style={[styles.footer, { width, height: BOOK_NAMEPLATE_HEIGHT }]}
    >
      <MText
        variant="caption"
        color="textInverse"
        numberOfLines={1}
        ellipsizeMode="tail"
        style={styles.title}
      >
        {file.name}
      </MText>

      <View style={styles.progressSlot}>
        {showProgress ? (
          <>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${pct}%` }]} />
            </View>
            <MText variant="caption" style={styles.pct}>
              {pct}%
            </MText>
          </>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    borderRadius: radii.sm,
    paddingHorizontal: 6,
    paddingTop: 4,
    paddingBottom: 3,
    backgroundColor: "rgba(35, 24, 16, 0.78)",
    overflow: "hidden",
    justifyContent: "flex-start",
  },

  title: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    textAlign: "center",
  },

  progressSlot: {
    minHeight: 12,
    marginTop: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },

  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.22)",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: 2,
  },

  pct: {
    width: 30,
    textAlign: "right",
    fontSize: 10,
    lineHeight: 12,
    color: "rgba(253, 244, 227, 0.85)",
  },
});
