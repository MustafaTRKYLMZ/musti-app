// MSelectBottomSheet.tsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import type { ViewStyle } from "react-native";
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Animated,
  PanResponder,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MText, spacing, radii, iconSizes, useTheme } from "@budget/ui-native";
import { IconButton, BaseIcon } from "@/components/ui/AppIcon";

export type MSelectItemBase = { id: string; label: string; subLabel?: string };

type Props<T extends MSelectItemBase> = {
  label?: string;
  placeholder?: string;
  valueId?: string | null;
  items: T[];
  onChange: (item: T) => void;

  // UX
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;

  // render
  renderRight?: (item: T, selected: boolean) => React.ReactNode;

  // ✅ allow screens to enforce consistent form styling
  fieldStyle?: ViewStyle;
};

export function MSelectBottomSheet<T extends MSelectItemBase>({
  label,
  placeholder = "Select…",
  valueId,
  items,
  onChange,
  searchable = false,
  searchPlaceholder = "Search…",
  disabled,
  renderRight,
  fieldStyle,
}: Props<T>) {
  const { colors } = useTheme();

  const selected = useMemo(
    () => items.find((x) => x.id === valueId) ?? null,
    [items, valueId]
  );

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!searchable || !s) return items;
    return items.filter((it) => {
      const a = it.label.toLowerCase();
      const b = (it.subLabel ?? "").toLowerCase();
      return a.includes(s) || b.includes(s);
    });
  }, [items, q, searchable]);

  // --- Sheet animation ---
  const translateY = useRef(new Animated.Value(999)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  const openSheet = useCallback(() => {
    if (disabled) return;
    setOpen(true);
  }, [disabled]);

  const closeSheet = useCallback(() => {
    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 999,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setOpen(false);
      setQ("");
    });
  }, [backdrop, translateY]);

  useEffect(() => {
    if (!open) return;

    translateY.setValue(999);
    backdrop.setValue(0);

    Animated.parallel([
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 160,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
  }, [open, translateY, backdrop]);

  // drag down to close
  const swipeThreshold = 90;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          Math.abs(g.dy) > Math.abs(g.dx) && g.dy > 4,
        onPanResponderMove: (_, g) => {
          const dy = Math.max(0, g.dy);
          translateY.setValue(dy);
        },
        onPanResponderRelease: (_, g) => {
          const dy = Math.max(0, g.dy);
          const vy = g.vy ?? 0;
          const shouldClose = dy > swipeThreshold || vy > 1.2;

          if (shouldClose) {
            closeSheet();
          } else {
            Animated.timing(translateY, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [closeSheet, translateY]
  );

  const handlePick = useCallback(
    (item: T) => {
      onChange(item);
      closeSheet();
    },
    [onChange, closeSheet]
  );

  return (
    <>
      {label ? (
        <MText
          style={{ marginBottom: spacing.xs, fontWeight: "800", opacity: 0.85 }}
        >
          {label}
        </MText>
      ) : null}

      <Pressable
        onPress={openSheet}
        disabled={disabled}
        style={[
          styles.field,
          {
            borderColor: colors.borderSubtle,
            backgroundColor: colors.surface,
            opacity: disabled ? 0.55 : 1,
          },
          fieldStyle, // ✅ allow override from screens
        ]}
      >
        {/* ✅ reserve room for chevron so text never pushes it */}
        <View style={{ flex: 1, paddingRight: 44 }}>
          <MText
            numberOfLines={1}
            style={{ fontWeight: "800", opacity: selected ? 1 : 0.6 }}
          >
            {selected ? selected.label : placeholder}
          </MText>

          {selected?.subLabel ? (
            <MText numberOfLines={1} style={{ opacity: 0.7, marginTop: 2 }}>
              {selected.subLabel}
            </MText>
          ) : null}
        </View>

        {/* ✅ chevron pinned to vertical center */}
        <View style={styles.chevronWrap} pointerEvents="none">
          <BaseIcon
            family="ion"
            name="chevron-down"
            size={iconSizes.md}
            color={colors.textPrimary}
          />
        </View>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="none"
        onRequestClose={closeSheet}
      >
        <View style={styles.modalRoot}>
          {/* backdrop */}
          <Pressable style={StyleSheet.absoluteFill} onPress={closeSheet}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: colors.backdropStrong,
                  opacity: backdrop,
                },
              ]}
            />
          </Pressable>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <Animated.View
              style={[
                styles.sheet,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  transform: [{ translateY }],
                  marginBottom: spacing.lg,
                },
              ]}
            >
              {/* drag handle */}
              <View {...panResponder.panHandlers} style={styles.handleArea}>
                <View
                  style={[
                    styles.handle,
                    { backgroundColor: colors.borderSubtle },
                  ]}
                />
              </View>

              {/* header */}
              <View style={styles.sheetHeader}>
                <MText style={{ fontWeight: "900" }}>{label ?? "Select"}</MText>
                <IconButton
                  name="close"
                  size={iconSizes.lg}
                  color={colors.textPrimary}
                  onPress={closeSheet}
                />
              </View>

              {searchable ? (
                <View
                  style={[
                    styles.searchWrap,
                    {
                      borderColor: colors.borderSubtle,
                      backgroundColor: colors.surface,
                    },
                  ]}
                >
                  <TextInput
                    value={q}
                    onChangeText={setQ}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={colors.textSecondary}
                    style={[styles.searchInput, { color: colors.textPrimary }]}
                  />
                  {!!q && (
                    <IconButton
                      name="close-circle"
                      size={iconSizes.md}
                      color={colors.textSecondary}
                      onPress={() => setQ("")}
                      style={{ padding: 0 }}
                    />
                  )}
                </View>
              ) : null}

              <FlatList
                data={filtered}
                keyExtractor={(x) => x.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: spacing.xl }}
                renderItem={({ item }) => {
                  const isSel = item.id === valueId;
                  return (
                    <Pressable
                      onPress={() => handlePick(item)}
                      style={[
                        styles.row,
                        {
                          borderBottomColor: colors.borderSubtle,
                          backgroundColor: isSel
                            ? colors.surfaceElevated
                            : "transparent",
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <MText numberOfLines={1} style={{ fontWeight: "800" }}>
                          {item.label}
                        </MText>
                        {item.subLabel ? (
                          <MText
                            numberOfLines={1}
                            style={{ opacity: 0.7, marginTop: 2 }}
                          >
                            {item.subLabel}
                          </MText>
                        ) : null}
                      </View>

                      {renderRight ? (
                        renderRight(item, isSel)
                      ) : isSel ? (
                        <MText style={{ fontWeight: "900", opacity: 0.9 }}>
                          ✓
                        </MText>
                      ) : null}
                    </Pressable>
                  );
                }}
              />
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    justifyContent: "center",
    position: "relative",
    minHeight: 52,
  },

  chevronWrap: {
    position: "absolute",
    right: spacing.sm,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  modalRoot: { flex: 1, justifyContent: "flex-end" },

  sheet: {
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    minHeight: "50%",
    maxHeight: "85%",
  },

  handleArea: {
    alignItems: "center",
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  handle: { width: 52, height: 5, borderRadius: 999, opacity: 0.55 },

  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },

  searchWrap: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm },

  row: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderRadius: radii.lg,
  },
});
