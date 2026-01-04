import React, { useMemo } from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { MText, useTheme } from "@musti/ui-native";
import { TargetItem } from "@musti/core";

type TargetItemSummaryProps = {
  item: TargetItem;
  variant?: "compact" | "default";
  style?: ViewStyle;
};

export const TargetItemSummary = ({
  item,
  variant = "default",
  style,
}: TargetItemSummaryProps) => {
  const { colors } = useTheme();

  const sub = useMemo(() => {
    const range = `${item.jumpPage}–${item.endPage}`;
    if (item.type === "pages") return `Pages target • ${range}`;
    return `${item.label} • ${range}`;
  }, [item.type, item.label, item.jumpPage, item.endPage]);

  return (
    <View style={[styles.wrap, style]}>
      <MText
        numberOfLines={1}
        style={[
          styles.bookName,
          { color: colors.textPrimary },
          variant === "compact" && styles.bookNameCompact,
        ]}
      >
        {item.bookName}
      </MText>

      <MText
        numberOfLines={1}
        style={[
          styles.sub,
          { color: colors.textPrimary },
          variant === "compact" && styles.subCompact,
        ]}
      >
        {sub}
      </MText>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { flex: 1 },

  bookName: {
    fontWeight: "800",
  },
  sub: {
    marginTop: 2,
    opacity: 0.75,
  },

  bookNameCompact: {
    fontWeight: "800",
  },
  subCompact: {
    marginTop: 1,
    opacity: 0.7,
  },
});
