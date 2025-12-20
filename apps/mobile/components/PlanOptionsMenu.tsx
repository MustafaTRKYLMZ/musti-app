import React, { useRef, useState } from "react";
import {
  Modal,
  TouchableOpacity,
  UIManager,
  findNodeHandle,
  View,
  StyleSheet,
} from "react-native";
import { MText, spacing, radii, useTheme } from "@budget/ui-native";
import { IconButton, BaseIcon } from "@/components/ui/AppIcon";
import { iconSizes } from "@budget/ui-native";

type PlanOptionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
};

export function PlanOptionsMenu({ onEdit, onDelete }: PlanOptionsMenuProps) {
  const { colors } = useTheme();

  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const anchorRef = useRef<View | null>(null);

  const open = () => {
    const handle = findNodeHandle(anchorRef.current);
    if (!handle) return;

    UIManager.measure(handle, (_x, _y, w, h, pageX, pageY) => {
      setPos({
        x: pageX + w - 170,
        y: pageY + h + 8,
      });
      setVisible(true);
    });
  };

  const close = () => setVisible(false);

  return (
    <>
      <View ref={anchorRef}>
        <IconButton
          name="ellipsis-vertical"
          size={iconSizes.md}
          onPress={open}
        />
      </View>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={close}
      >
        <TouchableOpacity
          style={menuStyles.overlay}
          activeOpacity={1}
          onPress={close}
        >
          <View
            style={[
              menuStyles.popover,
              {
                top: pos.y,
                left: pos.x,
                backgroundColor: colors.surface,
                borderColor: colors.borderSubtle,
              },
            ]}
          >
            <TouchableOpacity
              style={menuStyles.menuItem}
              onPress={() => {
                close();
                onEdit();
              }}
            >
              <BaseIcon
                family="ion"
                name="create-outline"
                size={18}
                color={colors.textPrimary}
              />
              <MText variant="body" color="textPrimary">
                Edit
              </MText>
            </TouchableOpacity>

            <TouchableOpacity
              style={menuStyles.menuItem}
              onPress={() => {
                close();
                onDelete();
              }}
            >
              <BaseIcon
                family="ion"
                name="trash-outline"
                size={18}
                color={colors.danger}
              />
              <MText variant="body" color="danger">
                Delete
              </MText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const menuStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  popover: {
    position: "absolute",
    width: 170,
    paddingVertical: spacing.xs,
    borderRadius: radii.lg,
    borderWidth: 1,
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  menuItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
});
