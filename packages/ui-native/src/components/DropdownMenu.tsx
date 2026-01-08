import { ReactNode, useCallback, useMemo, useRef, useState } from "react";
import {
  View,
  Pressable,
  StyleSheet,
  Modal,
  LayoutRectangle,
  Platform,
  ViewStyle,
  StyleProp,
} from "react-native";
import {
  useTheme,
  MText,
  spacing,
  radii,
  ThemeColors,
  BaseIcon,
} from "@musti/ui-native";

export type DropdownOption<T extends string> = {
  key: T;
  label: string;
  icon?: string;
  right?: ReactNode;
};

type TriggerArgs = {
  open: () => void;
  label: string;
  icon?: string;
};

type Props<T extends string> = {
  value: T;
  options: DropdownOption<T>[];
  onChange: (next: T) => void;

  // trigger
  renderTrigger?: (args: TriggerArgs) => ReactNode;

  // layout
  width?: number;
  itemHeight?: number;
  align?: "left" | "right";

  // styling overrides
  menuStyle?: StyleProp<ViewStyle>;

  // trigger styling overrides (optional)
  triggerStyle?: StyleProp<ViewStyle>;
};

export function DropdownMenu<T extends string>({
  value,
  options,
  onChange,
  renderTrigger,
  width = 180,
  itemHeight = 42,
  align = "right",
  menuStyle,
  triggerStyle,
}: Props<T>) {
  const { colors } = useTheme();

  const palette = useMemo(() => {
    const surface =
      (colors as ThemeColors).surface ??
      (colors as ThemeColors).backgroundSecondary ??
      colors.background;

    const border =
      (colors as ThemeColors).borderSubtle ??
      (colors as ThemeColors).border ??
      "rgba(0,0,0,0.12)";

    const shadow =
      (colors as ThemeColors).shadowStrong ??
      (colors as ThemeColors).shadow ??
      "#000";

    const primary = (colors as ThemeColors).primary ?? colors.textPrimary;

    return { surface, border, shadow, primary };
  }, [colors]);

  const selected = useMemo(() => {
    return options.find((o) => o.key === value);
  }, [options, value]);

  const selectedLabel = selected?.label ?? "Select";
  const selectedIcon = selected?.icon;

  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<LayoutRectangle | null>(null);
  const anchorRef = useRef<View | null>(null);

  const close = useCallback(() => setOpen(false), []);
  const openMenu = useCallback(() => {
    const node = anchorRef.current as any;
    if (!node?.measureInWindow) {
      setOpen(true);
      return;
    }
    node.measureInWindow((x: number, y: number, w: number, h: number) => {
      setAnchor({ x, y, width: w, height: h });
      setOpen(true);
    });
  }, []);

  const pos = useMemo(() => {
    const x = anchor?.x ?? 0;
    const y = anchor?.y ?? 0;
    const w = anchor?.width ?? 0;
    const h = anchor?.height ?? 0;

    const left =
      align === "right" ? Math.max(8, x + w - width) : Math.max(8, x);

    const top = y + h + 8 + (Platform.OS === "ios" ? 0 : 0);

    return { left, top };
  }, [anchor, align, width]);

  const handleSelect = useCallback(
    (k: T) => {
      if (k !== value) onChange(k);
      close();
    },
    [onChange, value, close]
  );

  return (
    <>
      <View
        ref={(r) => {
          anchorRef.current = r;
        }}
        collapsable={false}
      >
        {renderTrigger ? (
          renderTrigger({
            open: openMenu,
            label: selectedLabel,
            icon: selectedIcon,
          })
        ) : (
          <Pressable
            onPress={openMenu}
            hitSlop={8}
            style={[
              styles.trigger,
              {
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
              triggerStyle as any,
            ]}
          >
            {selectedIcon ? (
              <BaseIcon
                name={selectedIcon}
                size={18}
                color={colors.textSecondary}
              />
            ) : null}

            <MText
              variant="caption"
              style={[styles.triggerLabel, { color: colors.textPrimary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {selectedLabel}
            </MText>

            <BaseIcon
              name="chevron-down-outline"
              size={18}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <Pressable style={styles.backdrop} onPress={close} />

        <View
          style={[
            styles.menu,
            {
              left: pos.left,
              top: pos.top,
              width,
              backgroundColor: palette.surface,
              borderColor: palette.border,
              shadowColor: palette.shadow,
            },
            menuStyle as any,
          ]}
        >
          {options.map((opt, idx) => {
            const active = opt.key === value;

            return (
              <Pressable
                key={opt.key}
                onPress={() => handleSelect(opt.key)}
                style={[
                  styles.item,
                  { height: itemHeight },
                  idx !== options.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: palette.border,
                  },
                ]}
              >
                <View style={styles.itemLeft}>
                  {opt.icon ? (
                    <BaseIcon
                      name={opt.icon}
                      size={18}
                      color={active ? palette.primary : colors.textSecondary}
                    />
                  ) : null}

                  <MText
                    variant="body"
                    style={{
                      color: active ? palette.primary : colors.textPrimary,
                      fontWeight: active ? "700" : "500",
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {opt.label}
                  </MText>
                </View>

                <View style={styles.itemRight}>
                  {opt.right}
                  {active ? (
                    <BaseIcon
                      name="checkmark-outline"
                      size={18}
                      color={palette.primary}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    minWidth: 90,
    maxWidth: 220, // ✅ clamp-ish
    justifyContent: "center",
  },

  triggerLabel: {
    flexShrink: 1, // ✅ long text clamp
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },

  menu: {
    position: "absolute",
    borderWidth: 1,
    borderRadius: radii.lg,
    overflow: "hidden",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },

  item: {
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flexShrink: 1,
  },

  itemRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
