import React, { FC, useMemo } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { MText, radii, spacing, useTheme } from "@budget/ui-native";
import type { ReaderBookNavItem } from "@/hooks/useReaderBookNav";

type HeaderBookTabsBarProps = {
  items: ReaderBookNavItem[];
  activeUri?: string | null;
  onSelect: (it: ReaderBookNavItem) => void;
};

const BAR_H = 44;

export const HeaderBookTabsBar: FC<HeaderBookTabsBarProps> = ({
  items,
  activeUri = null,
  onSelect,
}) => {
  const { colors } = useTheme();

  const data = useMemo(() => items ?? [], [items]);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.surface,
          borderBottomColor: colors.borderSubtle,
        },
      ]}
      pointerEvents="auto"
    >
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        data={data}
        keyExtractor={(x) => x.uri}
        renderItem={({ item }) => {
          const active = !!activeUri && item.uri === activeUri;

          return (
            <Pressable
              onPress={() => onSelect(item)}
              style={({ pressed }) => [
                styles.chip,
                {
                  borderColor: colors.borderSubtle,
                  backgroundColor: active
                    ? colors.backgroundSecondary
                    : colors.surface,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
            >
              <MText
                variant="caption"
                color={active ? "textPrimary" : "textSecondary"}
                numberOfLines={1}
                style={{ maxWidth: 240 }}
              >
                {item.name}
              </MText>
            </Pressable>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    justifyContent: "flex-start",
    width: "100%",
    overflow: "hidden",
    borderBottomWidth: StyleSheet.hairlineWidth,
    height: BAR_H,
    paddingHorizontal: spacing.md,
  },
  listContent: {
    height: BAR_H,
    alignItems: "center",
    gap: spacing.sm,
  },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
