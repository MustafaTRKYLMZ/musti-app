import { MText, spacing, useTheme } from "@budget/ui-native";
import { Pressable, View, StyleSheet } from "react-native";

export const ItemDots = ({
  items,
  activeColor,
  doneColor,
  pendingColor,
  maxDots = 10,
  selectedIndex,
  onSelectIndex,
}: {
  items: { id: string; status: "done" | "active" | "pending" }[];
  activeColor: string;
  doneColor: string;
  pendingColor: string;
  maxDots?: number;
  selectedIndex: number;
  onSelectIndex: (i: number) => void;
}) => {
  const { colors } = useTheme();

  const total = items.length;
  const shown = Math.min(total, maxDots);
  const extra = total - shown;

  const ringColor = colors.borderSubtle ?? "rgba(0,0,0,0.18)";

  return (
    <View style={styles.dotsRow}>
      {items.slice(0, shown).map((it, idx) => {
        const isSelected = idx === selectedIndex;

        if (it.status === "done") {
          return (
            <Pressable
              key={it.id}
              onPress={() => onSelectIndex(idx)}
              hitSlop={10}
              style={[
                isSelected && styles.dotSelectedWrap,
                isSelected && { borderColor: ringColor },
              ]}
            >
              <View
                style={[styles.dotFilled, { backgroundColor: doneColor }]}
              />
            </Pressable>
          );
        }

        if (it.status === "active") {
          return (
            <Pressable
              key={it.id}
              onPress={() => onSelectIndex(idx)}
              hitSlop={10}
              style={[
                isSelected && styles.dotSelectedWrap,
                isSelected && { borderColor: activeColor },
              ]}
            >
              <View
                style={[
                  styles.dotActiveWrap,
                  { borderColor: activeColor + "66" },
                ]}
              >
                <View
                  style={[
                    styles.dotActiveInner,
                    { backgroundColor: activeColor },
                  ]}
                />
              </View>
            </Pressable>
          );
        }
        const pendingBg = isSelected ? pendingColor : pendingColor + "66";

        return (
          <Pressable
            key={it.id}
            onPress={() => onSelectIndex(idx)}
            hitSlop={10}
            style={[
              isSelected && styles.dotSelectedWrap,
              isSelected && { borderColor: ringColor },
            ]}
          >
            <View
              style={[
                styles.dotPending,
                {
                  borderColor: pendingColor,
                  backgroundColor: pendingBg,
                  opacity: 1,
                },
              ]}
            />
          </Pressable>
        );
      })}

      {extra > 0 && (
        <MText style={[styles.extraText, { color: colors.textSecondary }]}>
          +{extra}
        </MText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
  },
  dotFilled: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },

  dotActiveWrap: {
    width: 16,
    height: 16,
    borderRadius: 999,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dotActiveInner: {
    width: 12,
    height: 12,
    borderRadius: 999,
  },
  dotSelectedWrap: {
    padding: 3,
    borderRadius: 999,
    borderWidth: 2,
    transform: [{ scale: 1.05 }],
  },
  dotPending: {
    width: 10,
    height: 10,
    borderRadius: 999,
    borderWidth: 2.5,
  },
  extraText: {
    fontWeight: "900",
    opacity: 0.85,
    marginLeft: 2,
  },
});
