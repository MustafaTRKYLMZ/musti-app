import { bookshelfTheme, MText, radii, spacing } from "@musti/ui-native";
import {
  Pressable,
  View,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";

const { colors } = bookshelfTheme;

type ToggleRowProps = {
  label: string;
  description?: string;

  value: boolean;
  onToggle: () => void;

  onLabel?: string;
  offLabel?: string;

  containerStyle?: ViewStyle;
  pillStyle?: ViewStyle;
  labelStyle?: TextStyle;
  descriptionStyle?: TextStyle;

  disabled?: boolean;
};

export const ToggleRow = ({
  label,
  description,
  value,
  onToggle,
  onLabel = "On",
  offLabel = "Off",
  containerStyle,
  pillStyle,
  labelStyle,
  descriptionStyle,
  disabled = false,
}: ToggleRowProps) => {
  return (
    <Pressable
      onPress={disabled ? undefined : onToggle}
      style={[styles.toggleRow, disabled && { opacity: 0.5 }, containerStyle]}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <MText style={[styles.label, labelStyle]}>{label}</MText>

        {description ? (
          <MText
            style={[styles.description, descriptionStyle]}
            numberOfLines={2}
          >
            {description}
          </MText>
        ) : null}
      </View>

      <View
        style={[
          styles.togglePill,
          {
            backgroundColor: value ? colors.success : colors.surfaceElevated,
            borderColor: colors.borderSubtle,
          },
          pillStyle,
        ]}
      >
        <MText
          style={{
            color: value ? colors.textInverse : colors.textPrimary,
            fontWeight: "900",
          }}
        >
          {value ? onLabel : offLabel}
        </MText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  togglePill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  label: {
    fontWeight: "800",
  },
  description: {
    opacity: 0.7,
    marginTop: 2,
  },
});
